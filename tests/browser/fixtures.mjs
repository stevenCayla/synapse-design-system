import { listFixtures } from '../../packages/design/scripts/fixtures.mjs';

export const fixtures = listFixtures();
export const themes = ['light', 'dark'];
export const exampleUrl = (fixture, theme) => `/examples/${fixture.component}/${fixture.id}/?theme=${theme}`;
