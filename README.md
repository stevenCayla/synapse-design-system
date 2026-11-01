<div align="center">

# Synapse Medical Design System

**The source of truth for the interface of [Synapse Medical](https://synapse-medical.fr)**<br>
Design tokens, CSS components, Twig partials and usage rules, documented in English and French.

[![CI](https://github.com/synapse-medical/synapse-design-system/actions/workflows/ci.yaml/badge.svg)](https://github.com/synapse-medical/synapse-design-system/actions/workflows/ci.yaml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Astro](https://img.shields.io/badge/Astro-7-ff5d01.svg)](https://astro.build)
[![Starlight](https://img.shields.io/badge/Starlight-0.42-8b5cf6.svg)](https://starlight.astro.build)

[Development](https://dev-design.synapse-medical.fr) · [Roadmap](DESIGN_SYSTEM_EXTRACTION_PLAN.md) · [Contributing](CONTRIBUTING.md) · [Report an issue](https://github.com/synapse-medical/synapse-design-system/issues)

</div>

---

## Contents

- [Overview](#overview)
- [Environments](#environments)
- [Getting started](#getting-started)
- [Repository layout](#repository-layout)
- [Design tokens](#design-tokens)
- [Using it in an application](#using-it-in-an-application)
- [Hosting and deployment](#hosting-and-deployment)
- [Branches and releases](#branches-and-releases)
- [Security](#security)
- [License](#license)

## Overview

The Synapse Medical Design System is a monorepo with one package and its documentation site,
built with [Astro](https://astro.build) and [Starlight](https://starlight.astro.build).
It is early work: no application uses it yet, and all its components stay experimental until one does.
[`DESIGN_SYSTEM_EXTRACTION_PLAN.md`](DESIGN_SYSTEM_EXTRACTION_PLAN.md) gives the roadmap.

| Area | What it provides |
|------|------------------|
| Tokens | Colours, typography, spacing, radius, shadows, motion and layout, in JSON, generated as CSS, JavaScript and JSON |
| Components | 21 components: CSS, a Twig partial when the structure justifies it, and one fixture per variant and state |
| Behaviours | Small modules on native `<dialog>`, `<details>` and `popover` |
| Documentation | Foundations read from the tokens, with measured contrast, and real examples in an iframe |
| Tools | `/tokens.json`, `/llms.txt`, `/llms-full.txt` and [`AGENTS.md`](AGENTS.md) for coding agents |
| Checks | Theme parity, WCAG AA contrast pairs, documentation and links, Twig rendering compared with PHP, and browser tests on every fixture |

The components do not depend on Bootstrap or on any other UI framework
([#1](https://github.com/synapse-medical/synapse-design-system/issues/1)).

## Environments

| Source | Published at | Deployment |
|--------|--------------|------------|
| `main` | https://dev-design.synapse-medical.fr (not indexed) | Automatic on every push |
| Final release | https://design.synapse-medical.fr (not published yet) | Through the Release workflow (see [Branches and releases](#branches-and-releases)) |

## Getting started

Requires Node.js 24 and pnpm 11. `pnpm dev` needs nothing else: no PHP, no application.

```bash
pnpm install              # install the dependencies
pnpm dev                  # documentation site on http://localhost:4321
pnpm tokens               # generate the tokens from their JSON sources
pnpm build                # build the package (dist/, twig/, meta/) and the site
pnpm lint                 # Stylelint and ESLint
pnpm typecheck            # type-check the site
pnpm test                 # component and fixture tests
pnpm validate             # check the tokens: parity, contrast, migration table, usage
pnpm validate:docs        # after a build: documentation, links, content readable by tools
pnpm test:browser         # after a build: axe, width at 320px and behaviours, on every fixture
pnpm test:visual          # reference screenshots, in a Docker image
```

The browser tests need Chromium once: `pnpm exec playwright install chromium`. After an
intended visual change, run `sh tooling/test-visual.sh --update` and review the images.

Comparing the rendering with PHP Twig also needs PHP and Composer:

```bash
composer install --working-dir tooling/twig-parity
pnpm test:parity
```

## Repository layout

```text
.
├── .github/workflows/             ci.yaml (checks, staging), release.yaml (release, production)
├── apps/docs/                     Documentation site
│   ├── integrations/              Astro integration (CSP-safe inline scripts)
│   ├── public/                    Headers (_headers) and example theme script
│   ├── scripts/deploy.sh          Deployment of dist/ (dev or prod)
│   ├── src/content/docs/          Pages (English at the root, French under fr/)
│   ├── src/components/            Preview, examples, generated foundation tables, homepage
│   └── wrangler.jsonc             Cloudflare Workers configuration
├── packages/design/               Package @synapse-medical/design
│   ├── assets/                    Logo
│   ├── src/components/<name>/     CSS, Twig partial, fixtures
│   ├── src/foundations/           Base styles and self-hosted fonts
│   └── tokens/                    Token sources, contrast pairs, migration table
├── tests/browser/                 Accessibility, behaviour, width and screenshots
├── tooling/                       Token and documentation checks, Twig parity, release, visual tests
├── AGENTS.md                      Rules for coding agents
├── composer.json                  Composer package synapse/design
└── DESIGN_SYSTEM_EXTRACTION_PLAN.md
```

To add a component, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Design tokens

Sources live in `packages/design/tokens/`, in the DTCG JSON format:

| Folder or file | Content |
|----------------|---------|
| `primitive/` | Raw palette, never read by a component, and the scales |
| `semantic/` | Colours by meaning: `base`, plus `light` and `dark` with the same keys |
| `contrast-pairs.json` | Pairs that must meet WCAG 2.2 AA, in both themes |
| `migration/` | What each variable of `synapse-app` becomes ([`TABLE.md`](packages/design/tokens/migration/TABLE.md)) |

`pnpm tokens` writes `packages/design/generated/`, which is never edited or committed.
Every value is a CSS variable named `--si-*`. Spacing tokens are named by their value:
`--si-space-16` is 16px.

## Using it in an application

PHP applications install the package with Composer, from a tagged release, with no
token and no Node.js in the application:

```json
{
    "repositories": [{ "type": "vcs", "url": "https://github.com/synapse-medical/synapse-design-system" }],
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

The theme comes from the `data-theme` attribute of `<html>`, `light` or `dark`.

The npm package `@synapse-medical/design` is not published yet: its first publication
waits for a Node.js consumer.

## Hosting and deployment

The site is a Cloudflare Worker that serves the files of `apps/docs/dist/`
(`apps/docs/wrangler.jsonc`), with no script of its own.

| Environment | Command | Domain |
|-------------|---------|--------|
| production | `wrangler deploy --env=""` | design.synapse-medical.fr |
| development | `wrangler deploy --env dev` | dev-design.synapse-medical.fr |

### CI pipeline

| Trigger | Workflow | Result |
|---------|----------|--------|
| pull request | `ci.yaml` | Checks and build only |
| push to `main` | `ci.yaml` | Checks and build, then deploy to dev-design (environment `development`) |
| *Run workflow* with a prerelease version | `release.yaml` | Checks, tag and prerelease, **no deployment** |
| *Run workflow* with a final version | `release.yaml` | Checks, tag and release, then deploy to design (environment `production`) |

Manual deployment if needed (after `pnpm exec wrangler login`, from `apps/docs/`):

```bash
pnpm build                # from the root of the repository
pnpm deploy:dev
pnpm deploy:prod
```

### GitHub configuration

| Type | Name | Value |
|------|------|-------|
| Secret | `CLOUDFLARE_API_TOKEN` | Cloudflare API token ("Edit Cloudflare Workers" template, with DNS edit on the zone for the custom domains) |
| Variable | `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |

## Branches and releases

- There is one long-lived branch, `main`. Work branches start from it (`feat/…`,
  `fix/…`, `docs/…`, `ci/…`, `chore/…`) and their pull request targets it. Commits
  follow Conventional Commits.
- `main` is protected: changes go through a pull request whose `build` and `browser` checks pass;
  force-push and deletion are blocked.
- To release, add the version to `CHANGELOG.md` through a pull request, then run the
  workflow: *Actions → Release → Run workflow*. It checks, builds, commits `dist/`,
  `twig/` and `meta/` in a commit outside `main`, and tags it `vX.Y.Z`.
- The project follows [semantic versioning](https://semver.org/). The public contract
  is the classes, the semantic tokens, the partial parameters and the JS APIs
  (see [CONTRIBUTING.md](CONTRIBUTING.md)).

## Security

- The site is served with HSTS, a strict Content Security Policy
  (`script-src 'self'`, no inline script), `nosniff`, frame and referrer policies
  (`apps/docs/public/_headers`).
- `apps/docs/integrations/externalize-inline-scripts.mjs` moves every inline script of
  the generated HTML into a file, for the CSP. Fonts are self-hosted.
- Workflows run with read-only permissions by default. Only the release job can write,
  to push its tag and publish the release.

## License

Released under the [MIT License](LICENSE).
