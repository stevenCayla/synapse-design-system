import { readdirSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import starlight from '@astrojs/starlight';
import starlightLlmsTxt from 'starlight-llms-txt';
import externalizeInlineScripts from './integrations/externalize-inline-scripts.mjs';

const section = (label, fr, items) => ({ label, translations: { fr }, items });
const components = readdirSync(new URL('../../packages/design/src/components', import.meta.url), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

export default defineConfig({
  site: 'https://design.synapse-medical.fr',
  vite: {
    // No data: URIs for assets: the CSP only allows font-src 'self'.
    build: { assetsInlineLimit: 0 },
  },
  integrations: [
    sitemap({
      i18n: { defaultLocale: 'en', locales: { en: 'en', fr: 'fr' } },
      filter: (page) => !/\/examples\/|\/404\/?$/.test(page),
    }),
    starlight({
      title: 'Synapse Design System',
      logo: {
        light: '../../packages/design/assets/images/logo.svg',
        dark: '../../packages/design/assets/images/logo-dark.svg',
        alt: 'Synapse',
        replacesTitle: false,
      },
      favicon: '/favicon.svg',
      defaultLocale: 'root',
      locales: {
        root: { label: 'English', lang: 'en' },
        fr: { label: 'Français', lang: 'fr' },
      },
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/stevenCayla/synapse-design-system' }],
      customCss: ['./src/styles/theme.css'],
      components: { PageTitle: './src/components/PageTitle.astro' },
      plugins: [
        starlightLlmsTxt({
          projectName: 'Synapse Design System',
          description: 'The source of truth for the Synapse interface: design tokens, CSS components, Twig partials and usage rules.',
          details: 'Before implementing UI, check these rules. Values are in /tokens.json. Do not invent a colour, a spacing, a button or a variant when a suitable one exists.',
        }),
      ],
      sidebar: [
        section('Getting started', 'Démarrer', [{ slug: 'getting-started/introduction' }, { slug: 'getting-started/installation' }]),
        section('Foundations', 'Fondations', ['colors', 'typography', 'spacing', 'layout', 'radius', 'shadows', 'motion', 'icons'].map((name) => ({ slug: `foundations/${name}` }))),
        section('Components', 'Composants', components.map((name) => ({ slug: `components/${name}` }))),
        section('Accessibility', 'Accessibilité', [{ slug: 'accessibility/rules' }]),
        section('Resources', 'Ressources', [{ slug: 'resources/files' }, { slug: 'ai/coding-agents' }]),
      ],
    }),
    externalizeInlineScripts(),
  ],
});
