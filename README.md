# Synapse Design System

The source of truth for the Synapse interface: design tokens, CSS components, Twig partials, patterns and usage rules.

Documentation: <https://design.synapse-medical.fr> (not published yet).

> Early work. The components here validate the rendering chain and can still change. The roadmap is in [`DESIGN_SYSTEM_EXTRACTION_PLAN.md`](./DESIGN_SYSTEM_EXTRACTION_PLAN.md).

## Getting started

Node 24 and pnpm 11 are required.

```bash
git clone https://github.com/stevenCayla/synapse-design-system.git
cd synapse-design-system
pnpm install
pnpm dev
```

| Command | Purpose |
|---|---|
| `pnpm dev` | Documentation site with hot reload |
| `pnpm build` | Package (`dist/`, `twig/`) and documentation site |
| `pnpm tokens` | Generate the tokens from their JSON sources |
| `pnpm validate` | Check the tokens: theme parity, contrast, migration table and usage |
| `pnpm lint` | Stylelint and ESLint |
| `pnpm typecheck` | Type-check the documentation site |
| `pnpm test` | Component and fixture tests |
| `pnpm test:parity` | Compare the documentation rendering with PHP Twig. Needs PHP and `composer install --working-dir tooling/twig-parity` |

## Repository

```text
packages/design/   the package: tokens, foundations and components (CSS, Twig, fixtures)
apps/docs/         documentation site, Astro and Starlight
tooling/           token validation, Twig parity check and release script
```

## Using it in an application

PHP applications install the package with Composer, from a tagged release:

```json
{
    "repositories": [{ "type": "vcs", "url": "https://github.com/stevenCayla/synapse-design-system" }],
    "require": { "synapse/design": "0.0.1-alpha.3" }
}
```

```yaml
# config/packages/asset_mapper.yaml
framework:
    asset_mapper:
        paths:
            assets/: ''
            # The namespace keeps its fonts and images apart from those of the application.
            vendor/synapse/design/dist: synapse-design
```

```yaml
# config/packages/twig.yaml
twig:
    paths:
        vendor/synapse/design/twig: si
```

```twig
<link rel="stylesheet" href="{{ asset('synapse-design/synapse-design.css') }}">

{% include '@si/badge.html.twig' with {label: 'Published', tone: 'success'} only %}
```

## License

[MIT](./LICENSE).
