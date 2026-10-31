#!/usr/bin/env sh
# Deploys dist/ to Cloudflare Workers: ./scripts/deploy.sh dev|prod
#   dev  → https://dev-design.synapse-medical.fr (not indexed)
#   prod → https://design.synapse-medical.fr
# Authentication: "pnpm exec wrangler login" locally, or CLOUDFLARE_API_TOKEN and
# CLOUDFLARE_ACCOUNT_ID in CI.
set -eu

cd "$(dirname "$0")/.."

test -f dist/index.html || { echo "dist/ is missing: run \"pnpm build\" first." >&2; exit 1; }

case "${1:-}" in
  dev)
    # Staging: keep it out of search engines.
    grep -q 'X-Robots-Tag' dist/_headers || printf '\n/*\n  X-Robots-Tag: noindex, nofollow\n' >> dist/_headers
    printf 'User-agent: *\nDisallow: /\n' > dist/robots.txt
    pnpm exec wrangler deploy --env dev
    ;;
  prod)
    pnpm exec wrangler deploy --env=""
    ;;
  *)
    echo "Usage: $0 dev|prod" >&2
    exit 1
    ;;
esac
