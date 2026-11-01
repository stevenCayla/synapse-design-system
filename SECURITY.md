# Security policy

This repository holds the Synapse Medical Design System: design tokens, CSS components, Twig
partials and the documentation website (Astro + Starlight). It contains no patient data and no
application code.

## Reporting a vulnerability

Please do not open a public issue for a security problem.

Report it privately with GitHub's
[private vulnerability reporting](https://github.com/synapse-medical/synapse-design-system/security/advisories/new)
(*Security* tab → *Report a vulnerability*). Include the page or file concerned,
the steps to reproduce it and the impact you see.

You will get an answer as soon as possible. Once the problem is fixed, the
report is published as a security advisory.

## Scope

- The package: styles, scripts in `packages/design/src`, Twig partials and the release process.
- The website (https://design.synapse-medical.fr) and its build: scripts, headers
  (`apps/docs/public/_headers`), Content Security Policy, dependencies, CI workflows.
- Vulnerabilities of the Synapse Medical application itself belong to the
  [synapse-app](https://github.com/stevenCayla/synapse-app) repository.

## Supported versions

Only the latest release and the `main` branch are maintained.
