#!/usr/bin/env bash
# =============================================================================
# create-dmg.sh — Wraps the already-built .app into a distributable DMG.
#
# WHY THIS SCRIPT EXISTS
# ----------------------
# electron-builder ships with a bundled tool called dmg-builder to create DMGs.
# That tool is a compiled x86_64 (Intel) binary that dynamically links against
# /usr/local/opt/gettext/lib/libintl.8.dylib — a library provided by x86
# Homebrew (installed at /usr/local on Intel Macs).
#
# On Apple Silicon machines with arm64-native Homebrew (installed at
# /opt/homebrew), the x86 Homebrew path does not exist, so dmg-builder crashes
# with "Library not loaded: incompatible architecture (have arm64, need x86_64)".
#
# SOLUTION: HDIUTIL
# -----------------
# hdiutil is a macOS-native command-line tool (ships with every macOS install,
# no Homebrew required) that can create, mount, and convert disk images.
# It is a universal binary — runs natively on both Intel and Apple Silicon.
# We use it in three steps:
#   1. create  — pack the .app into a writable UDRW (read-write) image
#   2. attach  — mount the image so we can add an /Applications symlink
#   3. convert — compress the result into a read-only UDZO image (zlib level 9)
# The /Applications symlink is what shows users the "drag here to install"
# affordance in Finder.
#
# WHY NOT OTHER APPROACHES?
# -------------------------
# • create-dmg (npm package): adds a fancier DMG layout (background image,
#   icon positioning) but requires additional setup and still calls hdiutil
#   internally. Overkill for a simple distributable.
# • appdmg: similar — declarative JSON config, calls hdiutil under the hood.
# • Patching dmg-builder with x86 Rosetta + gettext: brittle — requires the
#   developer to manually install x86 Homebrew alongside arm64 Homebrew,
#   creating a dual-Homebrew setup that is fragile and hard to document.
# • Disabling the DMG target and shipping a plain .zip: works, but a DMG is
#   the macOS convention and gives users the drag-to-install UX.
#
# UNIVERSAL MAC COVERAGE
# ----------------------
# The default build is universal so one DMG runs natively on Apple Silicon and
# Intel Macs. Pass a different arch as the first argument only when debugging a
# single-architecture package, e.g. `bash scripts/create-dmg.sh arm64`.
# =============================================================================
set -euo pipefail

APP_NAME="Cleanup Photos"
VERSION=$(node -p "require('./package.json').version")
ARCH="${1:-universal}"
DMG_NAME="${APP_NAME}-${VERSION}-${ARCH}.dmg"
VOLUME_NAME="${APP_NAME} ${VERSION}"
APP_BUNDLE="dist/mac-${ARCH}/${APP_NAME}.app"

if [ ! -d "${APP_BUNDLE}" ]; then
  echo "ERROR: ${APP_BUNDLE} not found. Run electron-builder --dir first." >&2
  exit 1
fi

echo "→ Creating DMG: ${DMG_NAME}"

# Temporary read-write image large enough for the .app
hdiutil create \
  -volname "${VOLUME_NAME}" \
  -srcfolder "${APP_BUNDLE}" \
  -ov \
  -format UDRW \
  "dist/tmp-rw.dmg"

# Mount and capture the mount point (handle space in volume name)
MOUNT_DIR=$(hdiutil attach "dist/tmp-rw.dmg" -readwrite -noverify -nobrowse | \
  grep "/Volumes" | sed 's|.*\(/Volumes/.*\)|\1|' | tail -1)

if [ -z "${MOUNT_DIR}" ]; then
  echo "ERROR: failed to determine mount point" >&2
  exit 1
fi

echo "  mounted at: ${MOUNT_DIR}"

# Add an /Applications symlink so users can drag-install
ln -sf /Applications "${MOUNT_DIR}/Applications"

# Unmount
hdiutil detach "${MOUNT_DIR}" -quiet

# Convert to compressed read-only DMG (overwrite if it already exists)
hdiutil convert "dist/tmp-rw.dmg" \
  -format UDZO \
  -imagekey zlib-level=9 \
  -ov \
  -o "dist/${DMG_NAME}"

rm "dist/tmp-rw.dmg"
echo "✓ dist/${DMG_NAME}"
