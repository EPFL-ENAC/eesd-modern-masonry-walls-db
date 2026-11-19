#!/usr/bin/env bash
# Copy the dataset from the data repository into frontend/public/data.
#   DATA_REF  branch or tag of the data repository (default: dev)
#   SKIP_LFS  1: keep the photos as LFS pointer files (enough for convert and tests)
set -euo pipefail

REPO=https://github.com/EPFL-ENAC/eesd-modern-masonry-walls-data.git
LFS_HOST=https://enac-it-git-lfs.epfl.ch
ref=${DATA_REF:-dev}
here=$(cd "$(dirname "$0")/.." && pwd)
out=$here/public/data
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

# The deploy job sets this header in the site checkout. Locally it is empty and
# git uses your own credentials.
header=$(git -C "$here" config --local --get "http.$LFS_HOST/.extraheader" || true)
lfs_config=(-c "http.$LFS_HOST/.version=HTTP/1.1")
if [ -n "$header" ]; then
  lfs_config+=(-c "http.$LFS_HOST/.extraheader=$header")
fi
# git-lfs over HTTP/2 through ENAC-IT's load balancer cuts parallel downloads.
export GODEBUG=http2client=0

GIT_LFS_SKIP_SMUDGE=1 git clone -q --depth 1 --branch "$ref" "$REPO" "$tmp/repo"
if [ "${SKIP_LFS:-0}" != 1 ]; then
  git -C "$tmp/repo" "${lfs_config[@]}" lfs pull
fi
sha=$(git -C "$tmp/repo" rev-parse HEAD)

rm -rf "$out"
cp -R "$tmp/repo/data" "$out"
printf '%s %s\n' "$sha" "$ref" >"$out/.data-ref"
echo "data: $REPO $ref at $sha" >&2
