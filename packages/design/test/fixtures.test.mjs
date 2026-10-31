import assert from 'node:assert/strict';
import { test } from 'node:test';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { componentsDir, listComponents, listFixtures, renderFixture } from '../scripts/fixtures.mjs';

test('every component has its styles and fixtures', () => {
  for (const component of listComponents()) {
    for (const file of [`${component}.css`, `${component}.fixtures.yaml`]) {
      assert.ok(existsSync(join(componentsDir, component, file)), `${component}: ${file} is missing`);
    }
  }
});

test('fixture ids are unique within a component', () => {
  const ids = listFixtures().map((fixture) => `${fixture.component}/${fixture.id}`);
  assert.equal(new Set(ids).size, ids.length);
});

for (const fixture of listFixtures()) {
  test(`${fixture.component}/${fixture.id} renders`, async () => {
    const html = await renderFixture(fixture);
    assert.match(html, /class="[^"]*si-/);
  });
}

test('text is escaped', async () => {
  const fixture = listFixtures().find((item) => item.component === 'badge' && item.id === 'escaped');
  const html = await renderFixture(fixture);
  assert.ok(!html.includes('<b>'));
  assert.ok(html.includes('&lt;b&gt;'));
});
