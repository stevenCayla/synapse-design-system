// Lists the component fixtures and renders them with Twing, for the documentation and the tests.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import * as fs from 'node:fs';
import { createArrayLoader, createChainLoader, createEnvironment, createFilesystemLoader } from 'twing';
import { parse } from 'yaml';

// From the working directory: the documentation build bundles this module elsewhere.
function findRoot(directory = process.cwd()) {
  if (existsSync(join(directory, 'pnpm-workspace.yaml'))) return directory;
  const parent = dirname(directory);
  if (parent === directory) throw new Error('The repository root was not found.');
  return findRoot(parent);
}

export const componentsDir = join(findRoot(), 'packages', 'design', 'src', 'components');

export function listComponents() {
  return readdirSync(componentsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

export function listFixtures() {
  return listComponents().flatMap((component) => {
    const file = join(componentsDir, component, `${component}.fixtures.yaml`);
    if (!existsSync(file)) return [];
    return parse(readFileSync(file, 'utf8')).map((fixture) => ({ component, ...fixture }));
  });
}

export function fixtureName(fixture) {
  return `fixture/${fixture.component}/${fixture.id}.html.twig`;
}

let environment;

function getEnvironment() {
  if (environment) return environment;
  const sources = Object.fromEntries(listFixtures().map((fixture) => [fixtureName(fixture), fixture.source]));
  const files = createFilesystemLoader(fs);
  for (const component of listComponents()) {
    files.addPath(join(componentsDir, component), '@si');
  }
  environment = createEnvironment(createChainLoader([createArrayLoader(sources), files]), {
    autoEscapingStrategy: 'html',
  });
  return environment;
}

export function renderFixture(fixture) {
  return getEnvironment().render(fixtureName(fixture), {}, { strict: true });
}
