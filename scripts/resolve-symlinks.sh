#!/bin/bash

set -euo pipefail

BUILD_DIR="src/ios/Carthage/Build"

if [ ! -d "$BUILD_DIR" ]; then
  echo "⚠️  Build directory not found: $BUILD_DIR"
  exit 1
fi

echo "🔧 Resolving symlinks in $BUILD_DIR..."

TMP_DIR=$(mktemp -d)

cp -R -L "$BUILD_DIR" "$TMP_DIR"
rm -rf "$BUILD_DIR"
mv "$TMP_DIR/Build" "$BUILD_DIR"
rmdir "$TMP_DIR"

echo "✅ Symlinks resolved successfully in $BUILD_DIR"
