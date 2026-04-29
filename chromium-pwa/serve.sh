#!/usr/bin/env bash
# Serves this directory over http://localhost:7733/ so that Chromium treats
# the page as a secure context and the manifest can be installed as a PWA.
set -euo pipefail
cd "$(dirname "$0")"
exec python3 -m http.server 7733
