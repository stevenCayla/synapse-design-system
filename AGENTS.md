# Synapse Medical Design System: instructions for coding agents

Before implementing UI, check the Synapse Medical Design System.

This repository is the source of truth for the Synapse Medical interface. It is early work: only the elements listed here exist so far, and `DESIGN_SYSTEM_EXTRACTION_PLAN.md` describes where it is going.

## Where things are

| What | Where |
|---|---|
| Components | `packages/design/src/components/<name>/`: `<name>.css`, `<name>.html.twig`, `<name>.fixtures.yaml` |
| Token sources | `packages/design/tokens/`: `primitive/`, `semantic/` (`base`, `light`, `dark`), `contrast-pairs.json` |
| Generated tokens | `pnpm tokens` writes `packages/design/generated/` (`tokens.css`, `tokens.json`, `tokens.js`). Never edit it |
| Application variables | `packages/design/tokens/migration/TABLE.md`: what each `synapse-app` variable becomes |
| Documentation | `apps/docs/src/content/docs/`: English at the root, French under `fr/`. Keep both up to date |
| Text for tools | Built site: `/llms.txt`, `/llms-full.txt`, `/tokens.json` |
| Behaviours | `<name>.js` next to the component, gathered in `packages/design/src/behaviors.js` |
| Browser tests | `tests/browser/`: accessibility, behaviour, width at 320px and screenshots, on every fixture |
| Example pages | `/examples/<component>/<fixture>/`, generated from the fixtures |

## Choosing

1. A component or pattern exists: reuse it.
2. A variant of an existing component would do: propose the variant, if the need recurs.
3. It is specific to one application: keep it in that application, using the tokens.
4. It is generic, with at least two real or close uses: propose an addition in a pull request.

## Rules

- No hard-coded colour, spacing, radius, font size or shadow in a component: use a `--si-*` token. Components read semantic and scale tokens; primitive colours are not exposed. Spacing tokens are named by their value: `--si-space-16` is 16px.
- Do not invent a colour, a spacing, a button, a variant or a pattern when a suitable one exists.
- No dependency on Bootstrap or on another UI framework in a component ([#1](https://github.com/synapse-medical/synapse-design-system/issues/1)).
- Partials use standard Twig only: no application function, no translation filter, no number arithmetic. Text arrives already translated, as parameters.
- No inline script or style: the applications enforce a strict CSP.
- WCAG 2.2 AA contrast in both themes. Never convey a state by colour alone.
- CSS follows BEM with full selectors (`.si-badge--success`, never `&--success`, which only exists in Sass). Native nesting is for states (`&:hover`). The prefix is `si-` for classes and variables.

## Definition of done

A component has its CSS, its fixtures for each variant and state, and its documentation page in English and French with all its sections. A behaviour has its test in `tests/browser/behaviour.spec.mjs`. These pass, and the screenshots are updated with `sh tooling/test-visual.sh --update` when a change is intended:

```bash
pnpm validate && pnpm lint && pnpm typecheck && pnpm test && pnpm test:parity && pnpm build && pnpm validate:docs && pnpm test:browser
```

## Commits and pull requests

Conventional commits (`feat(button): …`), one pull request per subject, against `main`. Update `CHANGELOG.md`.
