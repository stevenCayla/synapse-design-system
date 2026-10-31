import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { APIRoute } from 'astro';
import { componentsDir } from '@synapse-medical/design/fixtures';

export const GET: APIRoute = () =>
  new Response(readFileSync(join(componentsDir, '..', '..', 'assets', 'images', 'logo.svg')), {
    headers: { 'Content-Type': 'image/svg+xml' },
  });
