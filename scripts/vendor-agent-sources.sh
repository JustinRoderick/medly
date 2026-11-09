#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PREFIX="${ROOT}/.agent_sources/github.com"
REFRESH=false

for arg in "$@"; do
  case "$arg" in
    --refresh) REFRESH=true ;;
    -h | --help)
      echo "Usage: $0 [--refresh]"
      exit 0
      ;;
    *)
      echo "Unknown arg: $arg. Fix: run \`$0\` or \`$0 --refresh\`." >&2
      exit 1
      ;;
  esac
done

clone_source() {
  local owner="$1" repo="$2" remote="$3" ref="$4" note="$5"
  local dest="${PREFIX}/${owner}/${repo}"

  if [[ -d "${dest}/.git" && "$REFRESH" != true ]]; then
    echo "skip ${owner}/${repo} (exists; pass --refresh to replace)"
    return 0
  fi

  rm -rf "$dest"
  mkdir -p "$(dirname "$dest")"
  echo "clone ${owner}/${repo} @ ${ref}"
  git clone --depth 1 --branch "$ref" "$remote" "$dest"

  cat >"${dest}/.agent-source.json" <<JSON
{
  "remote": "${remote}",
  "ref": "${ref}",
  "commit": "$(git -C "$dest" rev-parse HEAD)",
  "note": "${note}"
}
JSON
}

pin() {
  node -p "require('${ROOT}/$1').dependencies['$2']"
}

EFFECT_VERSION="$(pin packages/core/package.json effect)"
ALCHEMY_VERSION="$(pin apps/infra/package.json alchemy)"
FOLDKIT_VERSION="$(pin apps/web/package.json foldkit)"

clone_source Effect-TS effect https://github.com/Effect-TS/effect.git "effect@${EFFECT_VERSION}" \
  "Effect matching packages/core effect@${EFFECT_VERSION}."
clone_source kitlangton effect-solutions https://github.com/kitlangton/effect-solutions.git main \
  "Idiomatic Effect patterns."
clone_source alchemy-run alchemy https://github.com/alchemy-run/alchemy.git "v${ALCHEMY_VERSION}" \
  "Alchemy matching apps/infra alchemy@${ALCHEMY_VERSION}."
clone_source foldkit foldkit https://github.com/foldkit/foldkit.git "foldkit@${FOLDKIT_VERSION}" \
  "Foldkit matching apps/web foldkit@${FOLDKIT_VERSION}."

echo "done: agent sources under ${PREFIX}"
