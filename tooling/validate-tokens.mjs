// Checks the token sources: references, parity between themes, contrast, migration and usage.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
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
function parseColor(value) {
  const hex = value.match(/^#([0-9a-f]{6})$/i);
  if (hex) return [0, 2, 4].map((start) => parseInt(hex[1].slice(start, start + 2), 16)).concat(1);
  const rgba = value.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
  if (rgba) return [Number(rgba[1]), Number(rgba[2]), Number(rgba[3]), rgba[4] === undefined ? 1 : Number(rgba[4])];
  throw new Error(`Colour not understood: ${value}`);
}
const over = (top, bottom) => [0, 1, 2].map((index) => top[index] * top[3] + bottom[index] * (1 - top[3])).concat(1);
function luminance([red, green, blue]) {
  const [r, g, b] = [red, green, blue].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (one, two) => {
  const [high, low] = [luminance(one), luminance(two)].sort((a, b) => b - a);
  return (high + 0.05) / (low + 0.05);
};

const tokens = await loadTokens();
const byPath = new Map(tokens.map((token) => [token.path, token]));
let checked = 0;
for (const pair of read('contrast-pairs.json').pairs) {
  for (const background of pair.on) {
    for (const theme of ['light', 'dark']) {
      const value = (path) => {
        const token = byPath.get(path);
        if (!token) throw new Error(`Unknown token in contrast-pairs.json: ${path}`);
        return token[theme] ? parseColor(token[theme]) : null;
      };
      const canvas = value(pair.fg.startsWith('color.shell') ? 'color.shell.bg' : 'color.surface.default');
      const [foreground, backdrop] = [value(pair.fg), value(background)];
      // A token missing from a theme is already reported above.
      if (!canvas || !foreground || !backdrop) continue;
      const bottom = over(backdrop, canvas);
      const ratio = contrast(over(foreground, bottom), bottom);
      checked += 1;
      if (ratio < pair.min) errors.push(`${theme}: ${pair.fg} on ${background} is ${ratio.toFixed(2)}:1, needs ${pair.min}:1.`);
    }
  }
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
  for (const [, name] of readFileSync(file, 'utf8').matchAll(/var\((--si-[\w-]+)/g)) {
    if (!declared.has(name)) errors.push(`${file} reads an unknown token: ${name}.`);
  }
}

if (errors.length) stop();
const kept = Object.values(map).filter((entry) => entry.keep).length;
const retired = Object.values(map).filter((entry) => entry.retire).length;
console.log(`${tokens.length} tokens, ${checked} contrast checks, ${names.size} application variables (${names.size - kept - retired} to tokens, ${kept} stay, ${retired} removed): all good.`);
