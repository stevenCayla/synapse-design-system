# Synapse Design System: instructions for coding agents

Before implementing UI, check the Synapse Design System.

This repository is the source of truth for the Synapse interface. It is early work: only the elements listed here exist so far, and `DESIGN_SYSTEM_EXTRACTION_PLAN.md` describes where it is going.

## Where things are

| What | Where |
|---|---|
| Components | `packages/design/src/components/<name>/`: `<name>.css`, `<name>.html.twig`, `<name>.fixtures.yaml` |
| Tokens | `packages/design/src/foundations/tokens.css` (temporary, generated from token sources in Phase 2) |
| Documentation | `apps/docs/src/content/docs/`: English at the root, French under `fr/` |
| Example pages | `/examples/<component>/<fixture>/`, generated from the fixtures |

## Choosing

1. A component or pattern exists: reuse it.
2. A variant of an existing component would do: propose the variant, if the need recurs.
3. It is specific to one application: keep it in that application, using the tokens.
4. It is generic, with at least two real or close uses: propose an addition in a pull request.

## Rules

- No hard-coded colour, spacing or shadow in a component: use a `--si-*` token.
- Do not invent a colour, a spacing, a button, a variant or a pattern when a suitable one exists.
- No dependency on Bootstrap or on another UI framework in a component ([#1](https://github.com/stevenCayla/synapse-design-system/issues/1)).
- Partials use standard Twig only: no application function, no translation filter, no number arithmetic. Text arrives already translated, as parameters.
- No inline script or style: the applications enforce a strict CSP.
- WCAG 2.2 AA contrast in both themes. Never convey a state by colour alone.
- CSS follows BEM with native nesting, and the `si-` prefix for classes and variables.

## Definition of done

A component has its CSS, its fixtures for each variant and state, and its documentation page. These pass:

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm test:parity && pnpm build
```

## Commits and pull requests

Conventional commits (`feat(button): …`), one pull request per subject, against `main`. Update `CHANGELOG.md`.
