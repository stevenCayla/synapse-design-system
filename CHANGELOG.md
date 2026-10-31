# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [semantic versioning](https://semver.org/).

## [Unreleased]

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
