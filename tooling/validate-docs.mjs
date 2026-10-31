// Checks the built documentation: every component is documented and every internal link resolves.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { listComponents, listFixtures } from '../packages/design/scripts/fixtures.mjs';

const contentDir = 'apps/docs/src/content/docs';
const distDir = 'apps/docs/dist';
const errors = [];

const SECTIONS = {
  '': ['Usage', 'Variants', 'States', 'Dimensions', 'Accessibility', 'Responsive', 'Examples', "Do and don't", 'API'],
  'fr/': ['Usage', 'Variantes', 'États', 'Dimensions', 'Accessibilité', 'Responsive', 'Exemples', 'À faire et à éviter', 'API'],
};

for (const component of listComponents()) {
  for (const [locale, sections] of Object.entries(SECTIONS)) {
    const file = join(contentDir, `${locale}components/${component}.mdx`);
    if (!existsSync(file)) {
      errors.push(`${file} is missing.`);
      continue;
    }
    const text = readFileSync(file, 'utf8');
    if (!text.includes(`<Examples component="${component}"`)) errors.push(`${file} does not show its examples.`);
    for (const section of sections) {
      if (!text.includes(`## ${section}`)) errors.push(`${file} has no "${section}" section.`);
    }
  }
}

if (!existsSync(distDir)) {
  console.error('Build the site first: pnpm build.');
  process.exit(1);
}

function* htmlFiles(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(path);
    else if (entry.name.endsWith('.html')) yield path;
  }
}

function resolves(url) {
  const path = decodeURI(url.split(/[?#]/)[0]);
  return [join(distDir, path), join(distDir, path, 'index.html')].some((candidate) => existsSync(candidate) && !candidate.endsWith('/'));
}

let pages = 0;
for (const file of htmlFiles(distDir)) {
  pages += 1;
  const html = readFileSync(file, 'utf8');
  for (const [, url] of html.matchAll(/(?:href|src)="(\/[^"/][^"]*)"/g)) {
    if (!resolves(url)) errors.push(`${file}: broken link ${url}.`);
  }
}

for (const fixture of listFixtures()) {
  if (!existsSync(join(distDir, 'examples', fixture.component, fixture.id, 'index.html'))) errors.push(`The example ${fixture.component}/${fixture.id} was not built.`);
}

// Tools read the text: examples, tokens and rules must reach them, not only the rendered page.
const full = readFileSync(join(distDir, 'llms-full.txt'), 'utf8');
const expectations = {
  'a partial of an example': "@si/badge.html.twig",
  'a token variable': '--si-color-text-muted',
  'a contrast token': 'color.text.muted',
  'an accessibility rule': 'prefers-reduced-motion',
};
for (const [label, text] of Object.entries(expectations)) {
  if (!full.includes(text)) errors.push(`llms-full.txt has lost ${label}: ${text}.`);
}

if (errors.length) {
  console.error([...new Set(errors)].join('\n'));
  console.error(`\n${new Set(errors).size} problem(s).`);
  process.exit(1);
}
console.log(`${pages} pages, ${listFixtures().length} examples and ${listComponents().length} components checked: all good.`);
