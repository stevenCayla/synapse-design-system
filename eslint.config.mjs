import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['**/dist/**', '**/.astro/**', '**/node_modules/**', 'twig/**', 'tooling/twig-parity/vendor/**'] },
  js.configs.recommended,
  {
    files: ['**/*.mjs', '**/*.js'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ['apps/docs/public/**/*.js'],
    languageOptions: { globals: { ...globals.browser } },
  },
];
