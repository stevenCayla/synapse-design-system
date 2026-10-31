// Generates every token output from the JSON sources: node scripts/tokens.mjs
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import StyleDictionary from 'style-dictionary';

const packageDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const tokensDir = join(packageDir, 'tokens');
const outputDir = join(packageDir, 'generated');
export const THEMES = ['light', 'dark'];

// color.text.default → si-color-text
const variableName = (path) => `si-${path.filter((part, index) => !(part === 'default' && index === path.length - 1)).join('-')}`;

async function resolveTheme(theme) {
  const dictionary = new StyleDictionary({
    log: { verbosity: 'silent' },
    source: [join(tokensDir, 'primitive/*.tokens.json'), join(tokensDir, 'semantic/base.tokens.json'), join(tokensDir, `semantic/${theme}.tokens.json`)],
    hooks: { transforms: { 'name/si': { type: 'name', transform: (token) => variableName(token.path) } } },
    platforms: { css: { transforms: ['name/si'] } },
  });
  const { allTokens } = await dictionary.getPlatformTokens('css');
  return allTokens;
}

const isPrimitiveColor = (token) => token.filePath.includes('primitive') && token.path[0] === 'color';
// Media queries cannot read a variable: the breakpoints exist in JSON and TypeScript only.
const isDocumentation = (token) => token.path[0] === 'breakpoint';
const key = (token) => token.path.join('.');

/** Public tokens with their value per theme. */
export async function loadTokens() {
  const [light, dark] = await Promise.all(THEMES.map(resolveTheme));
  const darkByKey = new Map(dark.map((token) => [key(token), token]));
  return light
    .filter((token) => !isPrimitiveColor(token))
    .map((token) => ({
      path: key(token),
      variable: `--${token.name}`,
      type: token.$type,
      description: token.$description,
      layer: token.filePath.includes('primitive') ? 'scale' : 'semantic',
      light: String(token.$value),
      dark: String(darkByKey.get(key(token))?.$value ?? ''),
      css: !isDocumentation(token),
    }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

const block = (selector, declarations) => `${selector} {\n${declarations.map(([name, value]) => `  ${name}: ${value};`).join('\n')}\n}\n`;

export function tokensCss(tokens) {
  const css = tokens.filter((token) => token.css);
  const themed = css.filter((token) => token.light !== token.dark);
  return [
    '/* Generated from packages/design/tokens. Do not edit. */',
    block(':root', css.map((token) => [token.variable, token.light])),
    block('html[data-theme="dark"]', themed.map((token) => [token.variable, token.dark])),
    // A printed page is always light.
    `@media print {\n${block('  html[data-theme="dark"]', themed.map((token) => [token.variable, token.light])).replace(/^ {2}--/gm, '    --').replace(/\n}\n$/, '\n  }\n')}}\n`,
  ].join('\n');
}

/** Migration from the application variables: current values (no visual change) or tokens (target). */
export function loadMigration() {
  return {
    snapshot: JSON.parse(readFileSync(join(tokensDir, 'migration/legacy-vars.json'), 'utf8')),
    map: JSON.parse(readFileSync(join(tokensDir, 'migration/legacy-map.json'), 'utf8')),
  };
}

// Declared in a template, or under a media query: they stay where they are until their screen migrates.
const isGlobalDeclaration = (item) => item.file.endsWith('.css') && !item.selector.startsWith('@media');

function grouped(declarations) {
  const rules = new Map();
  for (const [selector, name, value] of declarations) {
    if (!rules.has(selector)) rules.set(selector, new Map());
    rules.get(selector).set(name, value);
  }
  return [...rules].map(([selector, values]) => block(selector, [...values])).join('\n');
}

export function aliasesCss(tokens, { target }) {
  const { snapshot, map } = loadMigration();
  const byPath = new Map(tokens.map((token) => [token.path, token]));
  const declarations = snapshot.variables
    .filter((item) => map[item.name]?.token && isGlobalDeclaration(item))
    .map((item) => {
      const value = Object.values(item.refs)[0];
      return [item.selector, item.name, target ? `var(${byPath.get(map[item.name].token).variable})` : value];
    });
  const title = target
    ? 'Target values: every application variable reads its token.'
    : 'Current values of the application: this file changes nothing on screen.';
  return `/* Generated from packages/design/tokens/migration. ${title} Do not edit. */\n${grouped(declarations)}`;
}

export function migrationTable(tokens) {
  const { snapshot, map } = loadMigration();
  const byPath = new Map(tokens.map((token) => [token.path, token]));
  const change = (now, target) => (now === undefined ? '' : now === target ? `\`${now}\`` : `\`${now}\` → \`${target}\``);
  const rows = [...new Set(snapshot.variables.map((item) => item.name))].sort().map((name) => {
    const entry = map[name] ?? {};
    const items = snapshot.variables.filter((item) => item.name === name);
    const files = [...new Set(items.map((item) => item.file.split('/').pop()))].join(', ');
    if (!entry.token) return `| \`${name}\` | ${entry.keep ? `Stays: ${entry.keep}` : `Removed: ${entry.retire}`} | | | ${files} |`;
    const token = byPath.get(entry.token);
    const current = (dark) => {
      const found = items.find((item) => !item.selector.startsWith('@media') && /dark/.test(item.selector) === dark);
      return found && Object.values(found.refs)[0];
    };
    return `| \`${name}\` | \`${token?.variable}\` | ${change(current(false), token?.light)} | ${change(current(true), token?.dark)} | ${files} |`;
  });
  const commit = Object.values(snapshot.refs)[0];
  return `# Migration of the application variables

Generated by \`pnpm tokens\` from \`legacy-map.json\`, for \`synapse-app\` at \`${commit}\`. Do not edit.

The value columns show the current value, then the target when it differs. \`aliases.css\` keeps the current values; \`aliases-target.css\` applies the targets.

| Variable | Becomes | Light | Dark | Declared in |
|---|---|---|---|---|
${rows.join('\n')}
`;
}

const write = (file, content) => writeFileSync(join(outputDir, file), content);

export async function generate() {
  mkdirSync(outputDir, { recursive: true });
  const tokens = await loadTokens();
  write('tokens.css', tokensCss(tokens));
  write('aliases.css', aliasesCss(tokens, { target: false }));
  write('aliases-target.css', aliasesCss(tokens, { target: true }));
  const data = { name: '@synapse-medical/design', tokens };
  write('tokens.json', `${JSON.stringify(data, null, 2)}\n`);
  write('tokens.js', `// Generated from packages/design/tokens. Do not edit.\nexport const tokens = ${JSON.stringify(tokens, null, 2)};\n`);
  write('tokens.d.ts', `export interface Token {\n  path: string;\n  variable: string;\n  type: string;\n  description?: string;\n  layer: 'scale' | 'semantic';\n  light: string;\n  dark: string;\n  css: boolean;\n}\nexport const tokens: Token[];\n`);
  writeFileSync(join(tokensDir, 'migration/TABLE.md'), migrationTable(tokens));
  return tokens;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const tokens = await generate();
  console.log(`Generated ${tokens.length} tokens.`);
}
