# Contributing

## Does it belong here?

```text
Need UI
   │
Does a component or pattern exist? ── yes ──► reuse it
   │ no
Is it specific to one application? ── yes ──► keep it in the application, with the tokens
   │ no
At least two real or close uses?   ── no ───► keep it in the application for now
   │ yes
Pull request: CSS, fixtures, documentation, accessibility
   │
Review ──► new version ──► update in the application
```

The Design System does not take every component of every application.

## Adding a component

In `packages/design/src/components/<name>/`:

- `<name>.css`, imported from `src/index.css`. BEM with full selectors (`.si-badge--success`, never `&--success`), `--si-*` tokens only.
- `<name>.html.twig`, when the structure justifies a partial. Parameters documented at the top of the file.
- `<name>.fixtures.yaml`: one entry per variant and state. The `source` is the code a developer would write. It produces the example page, the code sample and the tests.
- `<name>.js`, when it has a behaviour: gather it in `src/behaviors.js`, and test it in `tests/browser/behaviour.spec.mjs`. Prefer what the browser provides, such as `<dialog>`, `<details>` and `popover`.

Then add its page in `apps/docs/src/content/docs/components/`, its French version in `fr/components/`, and its entry in the sidebar of `apps/docs/astro.config.mjs`. `pnpm validate:docs` requires both pages.

## Tests in a browser

`pnpm build`, then `pnpm test:browser`: axe on every fixture in both themes, the behaviours, and the width at 320px. Run `pnpm exec playwright install chromium` once.

`pnpm test:visual` compares every fixture with its reference screenshot, in a Docker image so that the rendering is the same everywhere. After an intended change, run `sh tooling/test-visual.sh --update` and review the images in the pull request.

## Changing a token

Edit the JSON in `packages/design/tokens/`, then run `pnpm validate`. A semantic colour must exist in `light` and `dark`, reference a primitive, and keep the contrast pairs of `contrast-pairs.json`. Add any new pair to that file.

## Versions

Semantic versioning, one version for the whole package. The public contract is the classes, the semantic tokens, the partial parameters and the JS APIs.

- **Major:** removing or renaming any of them.
- **Minor:** a new component, variant or token; a deprecation; a visible change of value.
- **Patch:** a fix that changes no contract.

## Releasing

1. On `main`, add the version to `CHANGELOG.md`.
2. Run the **Release** workflow with the version number.

It runs the checks, builds the package, commits `dist/`, `twig/` and `meta/` in a commit outside `main`, tags it `vX.Y.Z` and publishes a GitHub release. Applications update with `composer require synapse/design:X.Y.Z`.
