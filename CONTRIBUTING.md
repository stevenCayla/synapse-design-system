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

- `<name>.css`, imported from `src/index.css`. BEM with native nesting, `--si-*` tokens only.
- `<name>.html.twig`, when the structure justifies a partial. Parameters documented at the top of the file.
- `<name>.fixtures.yaml`: one entry per variant and state. The `source` is the code a developer would write. It produces the example page, the code sample and the tests.

Then add its page in `apps/docs/src/content/docs/components/`, and the French version when it is ready: a missing page falls back to English.

## Versions

Semantic versioning, one version for the whole package. The public contract is the classes, the semantic tokens, the partial parameters and the JS APIs.

- **Major:** removing or renaming any of them.
- **Minor:** a new component, variant or token; a deprecation; a visible change of value.
- **Patch:** a fix that changes no contract.

## Releasing

1. On `main`, add the version to `CHANGELOG.md`.
2. Run the **Release** workflow with the version number.

It runs the checks, builds the package, commits `dist/` and `twig/` in a commit outside `main`, tags it `vX.Y.Z` and publishes a GitHub release. Applications update with `composer require synapse/design:X.Y.Z`.
