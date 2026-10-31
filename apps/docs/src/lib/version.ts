import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { componentsDir } from '@synapse-medical/design/fixtures';

// The latest released version: main only carries the changelog, the tag carries the version.
export function latestVersion(): string {
  const changelog = readFileSync(join(componentsDir, '..', '..', '..', '..', 'CHANGELOG.md'), 'utf8');
  return changelog.match(/^## \[(\d[^\]]*)\]/m)?.[1] ?? '0.0.0';
}
