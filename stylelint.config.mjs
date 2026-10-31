// Components read tokens: no literal colour outside the tokens file.
export default {
  extends: ['stylelint-config-standard'],
  rules: {
    // BEM names (block__element--modifier), see CONTRIBUTING.md.
    'selector-class-pattern': null,
    'custom-property-pattern': '^si-[a-z0-9-]+$',
    // `&--modifier` only exists in Sass: native CSS ignores the rule. Write the full BEM selector.
    'selector-disallowed-list': ['/&[_-]/'],
    'color-no-hex': true,
    'color-named': 'never',
    'function-disallowed-list': ['rgb', 'rgba', 'hsl', 'hsla'],
  },
  overrides: [
    {
      // Temporary: generated from the token sources in Phase 2.
      files: ['packages/design/src/foundations/tokens.css'],
      rules: { 'color-no-hex': null, 'function-disallowed-list': null },
    },
  ],
};
