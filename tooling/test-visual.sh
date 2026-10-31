#!/usr/bin/env sh
# Visual tests in the Playwright Docker image, the same as CI, so that the rendering is identical.
#   sh tooling/test-visual.sh            compares with the reference screenshots
#   sh tooling/test-visual.sh --update   replaces them
# Works on a copy inside the container: only the screenshots come back to the repository.
set -eu

cd "$(dirname "$0")/.."

flag=""
[ "${1:-}" = "--update" ] && flag="--update-snapshots"
mkdir -p tests/browser/__screenshots__

docker run --rm -e CI=1 -e COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
  -v "$PWD:/source:ro" -v "$PWD/tests/browser/__screenshots__:/screenshots" \
  mcr.microsoft.com/playwright:v1.64.1-noble sh -ec "
    mkdir /work && cd /source
    tar --exclude=node_modules --exclude=dist --exclude=.astro --exclude=vendor --exclude=generated --exclude=__screenshots__ -cf - . | tar -xf - -C /work
    cd /work
    mkdir -p tests/browser && cp -r /screenshots tests/browser/__screenshots__
    npm install -g pnpm@11.5.3 --silent
    pnpm install --frozen-lockfile --silent
    pnpm build > /dev/null
    pnpm exec playwright test --project=visual $flag
    cp -r tests/browser/__screenshots__/. /screenshots/
  "
