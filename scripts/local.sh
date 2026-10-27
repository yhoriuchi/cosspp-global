#!/bin/sh
# Use a normal Node/pnpm installation, or Codex's existing desktop runtime.
set -eu
if ! command -v node >/dev/null 2>&1 || ! command -v pnpm >/dev/null 2>&1; then
  cosspp_runtime="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies"
  PATH="$cosspp_runtime/node/bin:$cosspp_runtime/bin/fallback:$PATH"
  export PATH
fi
if ! command -v node >/dev/null 2>&1 || ! command -v pnpm >/dev/null 2>&1; then
  echo 'Install Node.js 22.12+ and pnpm 11.25.0, then rerun this command.' >&2
  exit 1
fi
cosspp_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$cosspp_root"
if [ "$#" -eq 0 ]; then set -- dev; fi
if [ "$1" = install ]; then exec pnpm install --frozen-lockfile; fi
exec pnpm run "$@"
