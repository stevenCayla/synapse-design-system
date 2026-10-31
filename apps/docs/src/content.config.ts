import { defineCollection, z } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: z.object({
        // Stable components must document every section (tooling/validate-docs.mjs).
        status: z.enum(['experimental', 'stable']).optional(),
      }),
    }),
  }),
};
