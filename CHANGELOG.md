# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [semantic versioning](https://semver.org/).

## [Unreleased]

### Changed

- The documentation site uses the template of the public Synapse Medical sites: header, hero, sections, footer, 404 page, Nunito, Newsreader and JetBrains Mono. Components and examples keep reading the tokens.
- The product is named Synapse Medical in the documentation.

### Added

- Design tokens in DTCG JSON: primitives, then semantic tokens for the light and dark themes. Generated as CSS, JSON and JavaScript.
- Validation of the tokens: theme parity, WCAG AA contrast pairs, migration table and usage in components.
- Migration table for the 174 variables of `synapse-app`, with `aliases.css` (current values) and `aliases-target.css` (tokens).
- Inter, Fraunces and Nunito fonts, and the logo in the brand colour `#4f46e5`.
- Stylelint rejects hard-coded colours, spacing, radii and font sizes.
- Documentation site, in English and French: homepage, foundations generated from the tokens, accessibility rules, `/tokens.json`, `/llms.txt` and `/llms-full.txt`.
- Deployment of the site to Cloudflare Workers: `main` to staging, a final release to production.
- Components: avatar, button, card, chip, confirmation, disclosure, drawer, empty state, field, KPI, loading, menu, page header, pagination, table, tabs, theme toggle and toast. All are experimental until an application uses them.
- Behaviours in `behaviors.js`, on native `<dialog>`, `<details>` and `popover`: `confirmDialog`, `showToast`, `loadDrawer`, `setTheme`.
- Browser tests on every fixture: axe in both themes, width at 320px and reference screenshots, plus keyboard and focus scenarios.

### Changed

- Components read the generated tokens. Spacing tokens are named by their value (`--si-space-16`).
- Badge, alert and modal: more tones and variants, and every component page documents usage, variants, states, dimensions, accessibility, responsive behaviour, examples and API.

## [0.0.1-alpha.4] - 2026-11-01

Validates the new Composer package name. Not for production use.

### Changed

- The Composer package is now `synapse-medical/design`, and its files move to `vendor/synapse-medical/design/`. Versions up to `0.0.1-alpha.3` keep the name `synapse/design`.

## [0.0.1-alpha.3] - 2026-10-31

Validates the Release workflow. Not for production use. No change to the package.

## [0.0.1-alpha.2] - 2026-10-31

Validates the delivery chain. Not for production use.

### Fixed

- Badge and alert tones and the modal layout were ignored: their CSS used a selector form that only exists in Sass.

## [0.0.1-alpha.1] - 2026-10-31

Validates the delivery chain. Not for production use.

### Added

- Monorepo with the `@synapse/design` package and the documentation site.
- Trial components: badge, alert and modal.
- Twig rendering in the documentation, checked against PHP Twig.
- Composer package `synapse/design`, built by the release script.
