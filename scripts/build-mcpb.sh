#!/bin/bash
#
# Build script for Renderbase MCPB bundle
# Creates a .mcpb file for one-click installation in Claude Desktop
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BUILD_DIR="$PROJECT_DIR/mcpb-build"
DIST_DIR="$PROJECT_DIR/dist-mcpb"
VERSION=$(node -p "require('$PROJECT_DIR/package.json').version")
BUNDLE_NAME="renderbase-mcp-$VERSION.mcpb"

echo "Building Renderbase MCP Bundle v$VERSION"
echo "=========================================="

# Clean previous builds
echo "Cleaning previous builds..."
rm -rf "$BUILD_DIR"
rm -rf "$DIST_DIR"
mkdir -p "$BUILD_DIR/server"
mkdir -p "$DIST_DIR"

# Build the TypeScript source
echo "Building TypeScript..."
cd "$PROJECT_DIR"
npm run build

# Copy manifest
echo "Copying manifest.json..."
cp "$PROJECT_DIR/mcpb/manifest.json" "$BUILD_DIR/manifest.json"

# Copy built server files
echo "Copying server files..."
cp -r "$PROJECT_DIR/dist/"* "$BUILD_DIR/server/"

# Copy icon if it exists
if [ -f "$PROJECT_DIR/mcpb/icon.png" ]; then
  echo "Copying icon..."
  cp "$PROJECT_DIR/mcpb/icon.png" "$BUILD_DIR/icon.png"
fi

# Create the bundle (zip file with .mcpb extension)
echo "Creating bundle..."
cd "$BUILD_DIR"
zip -r "$DIST_DIR/$BUNDLE_NAME" .

# Also create a .zip version for platforms that don't recognize .mcpb
cp "$DIST_DIR/$BUNDLE_NAME" "$DIST_DIR/renderbase-mcp-$VERSION.zip"

# Calculate checksums
echo "Calculating checksums..."
cd "$DIST_DIR"
sha256sum "$BUNDLE_NAME" > "$BUNDLE_NAME.sha256"

echo ""
echo "Build complete!"
echo "==============="
echo "Bundle: $DIST_DIR/$BUNDLE_NAME"
echo "Size: $(du -h "$DIST_DIR/$BUNDLE_NAME" | cut -f1)"
echo ""
echo "To test locally:"
echo "  1. Open Claude Desktop"
echo "  2. Go to Settings → Extensions"
echo "  3. Click 'Install from file'"
echo "  4. Select $DIST_DIR/$BUNDLE_NAME"
echo ""
echo "Bundle contents:"
unzip -l "$DIST_DIR/$BUNDLE_NAME"
