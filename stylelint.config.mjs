// Components read tokens: no literal colour or scale value.
export default {
  extends: ['stylelint-config-standard'],
  rules: {
    // BEM names (block__element--modifier), see CONTRIBUTING.md.
    'selector-class-pattern': null,
    'custom-property-pattern': '^si-[a-z0-9-]+$',
    // `&--modifier` only exists in Sass: native CSS ignores the rule. Write the full BEM selector.
    'selector-disallowed-list': ['/&[_-]/'],
    // Spacing, sizes and radii come from the scales.
    'declaration-property-unit-disallowed-list': {
      'font-size': ['px', 'rem', 'em'],
      '/^(gap|row-gap|column-gap|padding|margin|border-radius)/': ['px', 'rem', 'em'],
    },
    'color-no-hex': true,
    'color-named': 'never',
    'function-disallowed-list': ['rgb', 'rgba', 'hsl', 'hsla'],
  },
};
