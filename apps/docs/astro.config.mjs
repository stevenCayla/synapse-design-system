import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://design.synapse-medical.fr',
  vite: {
    // No data: URIs for assets: the site follows the same CSP rules as the application.
    build: { assetsInlineLimit: 0 },
  },
  integrations: [
    starlight({
      title: 'Synapse Design System',
      defaultLocale: 'root',
      locales: {
        root: { label: 'English', lang: 'en' },
        fr: { label: 'Français', lang: 'fr' },
      },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/stevenCayla/synapse-design-system' },
      ],
      sidebar: [
        {
          label: 'Getting started',
          translations: { fr: 'Démarrer' },
          items: [{ slug: 'getting-started/introduction' }],
        },
        {
          label: 'Components',
          translations: { fr: 'Composants' },
          items: [{ slug: 'components/alert' }, { slug: 'components/badge' }, { slug: 'components/modal' }],
        },
      ],
    }),
  ],
});
