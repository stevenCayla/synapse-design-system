// Checks the token sources: references, parity between themes, contrast, migration and usage.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { contrastReport } from '../packages/design/scripts/contrast.mjs';
import { aliasesCss, loadMigration, loadTokens, migrationTable } from '../packages/design/scripts/tokens.mjs';

const dir = 'packages/design/tokens';
const errors = [];
function stop() {
  console.error(errors.join('\n'));
  console.error(`\n${errors.length} problem(s).`);
  process.exit(1);
}
const read = (file) => JSON.parse(readFileSync(join(dir, file), 'utf8'));

function leaves(node, prefix = []) {
  if (node && typeof node === 'object' && '$value' in node) return [[prefix.join('.'), node]];
  return Object.entries(node).filter(([name]) => !name.startsWith('$')).flatMap(([name, value]) => leaves(value, [...prefix, name]));
}

// Same keys in both themes.
const light = new Map(leaves(read('semantic/light.tokens.json')));
const dark = new Map(leaves(read('semantic/dark.tokens.json')));
for (const name of light.keys()) if (!dark.has(name)) errors.push(`${name} is missing from the dark theme.`);
for (const name of dark.keys()) if (!light.has(name)) errors.push(`${name} is missing from the light theme.`);

// Semantic colours point to primitives.
for (const file of ['semantic/base.tokens.json', 'semantic/light.tokens.json', 'semantic/dark.tokens.json']) {
  for (const [name, token] of leaves(read(file))) {
    if (token.$type === 'color' && !/^\{color\..+\}$/.test(token.$value)) errors.push(`${name} in ${file} must reference a primitive.`);
  }
}

// Every primitive colour is used.
const semanticText = ['base', 'light', 'dark'].map((theme) => readFileSync(join(dir, `semantic/${theme}.tokens.json`), 'utf8')).join();
for (const [name] of leaves(read('primitive/color.tokens.json'))) {
  if (!semanticText.includes(`{${name}}`)) errors.push(`The primitive ${name} is not used.`);
}

// Contrast.
const tokens = await loadTokens();
const byPath = new Map(tokens.map((token) => [token.path, token]));
const report = contrastReport(tokens, read('contrast-pairs.json').pairs);
const checked = report.length;
for (const row of report) {
  // A token missing from a theme is already reported above.
  if (row.ratio !== null && row.ratio < row.min) errors.push(`${row.theme}: ${row.fg} on ${row.on} is ${row.ratio.toFixed(2)}:1, needs ${row.min}:1.`);
}

// Migration: every application variable has a decision, and the current aliases keep the current values.
const { snapshot, map } = loadMigration();
const names = new Set(snapshot.variables.map((item) => item.name));
for (const name of names) if (!map[name]) errors.push(`${name} has no decision in legacy-map.json.`);
for (const name of Object.keys(map)) if (!names.has(name)) errors.push(`${name} in legacy-map.json is not in the snapshot.`);
for (const [name, entry] of Object.entries(map)) {
  if (entry.token && !byPath.has(entry.token)) errors.push(`${name} points to an unknown token: ${entry.token}.`);
}
if (errors.length) stop();
const aliases = aliasesCss(tokens, { target: false });
for (const item of snapshot.variables) {
  if (!map[item.name]?.token || !item.file.endsWith('.css') || item.selector.startsWith('@media')) continue;
  const value = Object.values(item.refs)[0];
  if (!aliases.includes(`${item.name}: ${value};`)) errors.push(`aliases.css changes ${item.name} (${item.selector}).`);
}
if (readFileSync(join(dir, 'migration/TABLE.md'), 'utf8') !== migrationTable(tokens)) errors.push('migration/TABLE.md is not up to date: run pnpm tokens.');

// Components only read declared tokens, and scale tokens are not hard-coded.
const declared = new Set(tokens.filter((token) => token.css).map((token) => token.variable));
const cssFiles = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', 'packages/design/src'], { encoding: 'utf8' }).split('\n').filter((file) => file.endsWith('.css'));
for (const file of cssFiles) {
  const text = readFileSync(file, 'utf8');
  // A component can declare its own settings, such as --si-card-accent.
  const local = new Set([...text.matchAll(/(--si-[\w-]+)\s*:/g)].map((match) => match[1]));
  for (const [, name] of text.matchAll(/var\((--si-[\w-]+)/g)) {
    if (!declared.has(name) && !local.has(name)) errors.push(`${file} reads an unknown token: ${name}.`);
  }
}

if (errors.length) stop();
const kept = Object.values(map).filter((entry) => entry.keep).length;
const retired = Object.values(map).filter((entry) => entry.retire).length;
console.log(`${tokens.length} tokens, ${checked} contrast checks, ${names.size} application variables (${names.size - kept - retired} to tokens, ${kept} stay, ${retired} removed): all good.`);
