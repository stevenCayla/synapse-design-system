// Builds what the applications consume: dist/ (CSS) and twig/ (partials) at the repository root.
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundle } from 'lightningcss';
import { componentsDir, listComponents } from './fixtures.mjs';

const packageDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const rootDir = join(packageDir, '..', '..');
const distDir = join(rootDir, 'dist');
const twigDir = join(rootDir, 'twig');

rmSync(distDir, { recursive: true, force: true });
rmSync(twigDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });
mkdirSync(twigDir, { recursive: true });

const { code } = bundle({
  filename: join(packageDir, 'src', 'index.css'),
  minify: true,
  // Keep native nesting and modern syntax: the application serves this file as is.
  targets: undefined,
});
const banner = `/* ${JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8')).name} */\n`;
writeFileSync(join(distDir, 'synapse-design.css'), banner + code.toString());

for (const component of listComponents()) {
  cpSync(join(componentsDir, component, `${component}.html.twig`), join(twigDir, `${component}.html.twig`));
}

console.log(`Built dist/synapse-design.css (${code.length} bytes) and ${listComponents().length} partials in twig/.`);
