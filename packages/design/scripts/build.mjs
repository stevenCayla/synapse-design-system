// Builds what the applications consume: dist/ (CSS) and twig/ (partials) at the repository root.
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundle } from 'lightningcss';
import { componentsDir, listComponents } from './fixtures.mjs';
import { generate } from './tokens.mjs';

const packageDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const rootDir = join(packageDir, '..', '..');
const distDir = join(rootDir, 'dist');
const twigDir = join(rootDir, 'twig');
// Outside dist/: the applications publish dist/ as assets, not this documentation for tools.
const metaDir = join(rootDir, 'meta');

rmSync(distDir, { recursive: true, force: true });
rmSync(twigDir, { recursive: true, force: true });
rmSync(metaDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });
mkdirSync(twigDir, { recursive: true });
mkdirSync(metaDir, { recursive: true });

const tokens = await generate();
const generatedDir = join(packageDir, 'generated');
const banner = `/* ${JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8')).name} */\n`;

// Keeps native nesting and modern syntax: the applications serve these files as they are.
function bundleCss(filename, output) {
  const { code } = bundle({
    filename,
    minify: true,
    visitor: { Url: (url) => ({ ...url, url: `./fonts/${basename(url.url)}` }) },
  });
  writeFileSync(join(distDir, output), banner + code.toString());
  return code.length;
}

const size = bundleCss(join(packageDir, 'src', 'index.css'), 'synapse-design.css');
bundleCss(join(generatedDir, 'tokens.css'), 'tokens.css');
cpSync(join(generatedDir, 'aliases.css'), join(distDir, 'aliases.css'));
cpSync(join(generatedDir, 'aliases-target.css'), join(distDir, 'aliases-target.css'));
cpSync(join(generatedDir, 'tokens.js'), join(distDir, 'tokens.js'));
cpSync(join(generatedDir, 'tokens.d.ts'), join(distDir, 'tokens.d.ts'));
cpSync(join(generatedDir, 'tokens.json'), join(metaDir, 'tokens.json'));
cpSync(join(packageDir, 'tokens', 'migration', 'TABLE.md'), join(metaDir, 'token-migration.md'));
cpSync(join(packageDir, 'src', 'foundations', 'fonts'), join(distDir, 'fonts'), { recursive: true });
cpSync(join(packageDir, 'assets', 'images'), join(distDir, 'images'), { recursive: true });

cpSync(join(packageDir, 'src', 'behaviors.js'), join(distDir, 'js', 'behaviors.js'));
for (const component of listComponents()) {
  // Simple components have no partial: their HTML is the contract.
  const partial = join(componentsDir, component, `${component}.html.twig`);
  if (existsSync(partial)) cpSync(partial, join(twigDir, `${component}.html.twig`));
  const script = join(componentsDir, component, `${component}.js`);
  if (existsSync(script)) cpSync(script, join(distDir, 'js', 'components', component, `${component}.js`));
}

console.log(`Built dist/synapse-design.css (${size} bytes), ${tokens.length} tokens and ${listComponents().length} components.`);
