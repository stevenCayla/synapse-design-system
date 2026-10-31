import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['**/dist/**', '**/.astro/**', '**/node_modules/**', 'twig/**', 'meta/**', 'tooling/twig-parity/vendor/**'] },
  js.configs.recommended,
  {
    files: ['**/*.mjs', '**/*.js'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ['packages/design/src/**/*.js'],
    languageOptions: { globals: { ...globals.browser } },
  },
  {
    files: ['tests/**/*.mjs'],
    languageOptions: { globals: { ...globals.browser } },
  },
  {
    files: ['apps/docs/public/**/*.js'],
    languageOptions: { globals: { ...globals.browser, ResizeObserver: 'readonly' } },
  },
];
