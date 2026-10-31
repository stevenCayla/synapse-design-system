// Compares the Twing rendering (documentation) with PHP Twig (applications) on every fixture.
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { componentsDir, fixtureName, listComponents, listFixtures, renderFixture } from '../../packages/design/scripts/fixtures.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = listFixtures();

const php = spawnSync('php', [join(here, 'render.php')], {
  input: JSON.stringify({
    components: listComponents().map((component) => join(componentsDir, component)),
    fixtures: Object.fromEntries(fixtures.map((fixture) => [fixtureName(fixture), fixture.source])),
  }),
  encoding: 'utf8',
});
if (php.status !== 0) {
  console.error(php.stderr || php.stdout);
  process.exit(1);
}
const expected = JSON.parse(php.stdout);

// Insignificant whitespace only: exact text and attributes must match.
const normalize = (html) => html.replace(/\s+/g, ' ').replace(/> </g, '><').trim();

let failures = 0;
for (const fixture of fixtures) {
  const name = fixtureName(fixture);
  const twing = normalize(await renderFixture(fixture));
  const twig = normalize(expected[name]);
  if (twing === twig) {
    console.log(`ok    ${fixture.component}/${fixture.id}`);
  } else {
    failures += 1;
    console.error(`DIFF  ${fixture.component}/${fixture.id}\n  twing: ${twing}\n  twig:  ${twig}`);
  }
}
console.log(`${fixtures.length - failures}/${fixtures.length} fixtures identical.`);
process.exit(failures ? 1 : 0);
