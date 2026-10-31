// Lists the CSS variables declared by synapse-app, for the migration table.
// node tooling/extract-legacy-vars.mjs <path-to-a-clone> <output.json> <ref> [ref...]
// Reads Git objects only: the clone's working tree stays untouched.
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const [repo, output, ...refs] = process.argv.slice(2);
if (!repo || !output || refs.length === 0) {
  console.error('Usage: node tooling/extract-legacy-vars.mjs <clone> <output.json> <ref> [ref...]');
  process.exit(1);
}

const git = (...args) => execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', maxBuffer: 1 << 28 });

// Style blocks of a template, or the whole file for a stylesheet.
function cssOf(path, text) {
  if (path.endsWith('.css')) return text;
  return [...text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((match) => match[1]).join('\n');
}

// Walks the rules and keeps custom property declarations with their full selector.
function declarations(css) {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{#[\s\S]*?#\}/g, '').replace(/\{\{[\s\S]*?\}\}/g, 'TWIG').replace(/\{%[\s\S]*?%\}/g, '');
  const found = [];
  const stack = [];
  let buffer = '';
  for (const char of clean) {
    if (char === '{') {
      stack.push(buffer.trim().replace(/\s+/g, ' '));
      buffer = '';
    } else if (char === '}') {
      collect(buffer);
      stack.pop();
      buffer = '';
    } else if (char === ';') {
      collect(buffer);
      buffer = '';
    } else {
      buffer += char;
    }
  }
  function collect(text) {
    const match = text.trim().match(/^(--[\w-]+)\s*:\s*([\s\S]+)$/);
    if (match) found.push({ name: match[1], selector: stack.join(' { '), value: match[2].trim().replace(/\s+/g, ' ') });
  }
  return found;
}

const result = new Map();
for (const ref of refs) {
  const files = git('ls-tree', '-r', '--name-only', ref, 'assets/styles', 'templates').split('\n').filter((file) => /\.(css|twig)$/.test(file));
  for (const file of files) {
    for (const item of declarations(cssOf(file, git('show', `${ref}:${file}`)))) {
      const key = `${item.name}|${item.selector}|${file}`;
      const existing = result.get(key);
      if (!existing) result.set(key, { ...item, file, refs: { [ref]: item.value } });
      else existing.refs[ref] = item.value;
    }
  }
}

const list = [...result.values()].sort((a, b) => a.name.localeCompare(b.name) || a.selector.localeCompare(b.selector));
writeFileSync(output, `${JSON.stringify({ refs: Object.fromEntries(refs.map((ref) => [ref, git('rev-parse', '--short', ref).trim()])), variables: list }, null, 2)}\n`);
console.log(`${list.length} declarations of ${new Set(list.map((item) => item.name)).size} variables.`);
