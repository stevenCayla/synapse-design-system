export interface Fixture {
  component: string;
  id: string;
  title: string;
  source: string;
  height?: number;
}

export const componentsDir: string;
export function listComponents(): string[];
export function listFixtures(): Fixture[];
export function fixtureName(fixture: Fixture): string;
export function renderFixture(fixture: Fixture): Promise<string>;
