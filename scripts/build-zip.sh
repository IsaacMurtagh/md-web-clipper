#!/usr/bin/env bash
set -euo pipefail

VERSION="${1:?Usage: build-zip.sh <version>}"
zip -r "markdown-web-clipper-${VERSION}.zip" manifest.json src/ lib/ assets/ LICENSE README.md
