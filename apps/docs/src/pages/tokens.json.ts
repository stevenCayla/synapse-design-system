import type { APIRoute } from 'astro';
import { primitives, tokens } from '@synapse-medical/design/tokens';

export const GET: APIRoute = () =>
  new Response(`${JSON.stringify({ name: '@synapse-medical/design', tokens, primitives }, null, 2)}\n`, {
    headers: { 'Content-Type': 'application/json' },
  });
