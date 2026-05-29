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
# We use it in five steps:
#   1. create  — create an empty writable HFS+ UDRW image sized for the bundle
#   2. attach  — mount it
#   3. ditto   — copy the .app in (preserves codesign metadata, xattrs, ACLs)
#   4. detach  — unmount
#   5. convert — compress into a read-only UDZO image (zlib level 9)
# The /Applications symlink added in step 3 is what shows users the
# "drag here to install" affordance in Finder.
#
# WHY NOT `hdiutil create -srcfolder`?
# ------------------------------------
# The single-call -srcfolder shortcut internally auto-mounts the new image to
# populate it. On macOS 26 (Darwin 25.x) that auto-mount step fails partway
# with "Resource busy" on non-trivial bundles — even after the dots-of-progress
# output shows it almost made it. The explicit create→attach→ditto pattern
# sidesteps the bug and is what create-dmg / dmg-light use under the hood.
# HFS+ instead of APFS for the temp image avoids related APFS image quirks on
# recent macOS and is fine for a transient build artifact (the final UDZO
# output is the same either way).
#
# WHY `ditto` OVER `cp -R`?
# -------------------------
# ditto preserves resource forks, ACLs, extended attributes, and codesign
# metadata. cp -R can silently strip xattrs and break the embedded signature.
#
# WHY NOT OTHER APPROACHES?
# -------------------------
# • create-dmg (npm package): adds a fancier DMG layout (background image,
#   icon positioning) but requires additional setup. Overkill for a simple
#   distributable.
# • appdmg: similar — declarative JSON config, calls hdiutil under the hood.
# • Patching dmg-builder with x86 Rosetta + gettext: brittle dual-Homebrew
#   setup that is hard to document.
# • Shipping a plain .zip: works, but a DMG is the macOS convention.
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
TMP_DMG="dist/tmp-rw.dmg"

if [ ! -d "${APP_BUNDLE}" ]; then
  echo "ERROR: ${APP_BUNDLE} not found. Run electron-builder --dir first." >&2
  exit 1
fi

echo "→ Creating DMG: ${DMG_NAME}"

# Always start clean — leftover tmp images from interrupted runs cause EBUSY.
rm -f "${TMP_DMG}"

# Compute image size: actual .app size in MB + 50 MB slack for filesystem
# overhead, journal, and the /Applications symlink directory entry.
APP_BYTES=$(du -sk "${APP_BUNDLE}" | awk '{print $1}')
SIZE_MB=$(( (APP_BYTES / 1024) + 50 ))

# Empty writable HFS+ image, sized for the bundle plus slack.
# Note: with -size (no source), hdiutil produces a UDRW image by default and
# rejects an explicit -format.
hdiutil create \
  -size "${SIZE_MB}m" \
  -fs HFS+ \
  -volname "${VOLUME_NAME}" \
  -ov \
  "${TMP_DMG}"

# Mount and capture the mount point (handle space in volume name)
MOUNT_DIR=$(hdiutil attach "${TMP_DMG}" -readwrite -noverify -nobrowse | \
  grep "/Volumes" | sed 's|.*\(/Volumes/.*\)|\1|' | tail -1)

if [ -z "${MOUNT_DIR}" ]; then
  echo "ERROR: failed to determine mount point" >&2
  exit 1
fi

echo "  mounted at: ${MOUNT_DIR}"

# Always detach the mount on exit, even on failure — leaving it attached
# blocks the next run with EBUSY.
trap 'hdiutil detach "${MOUNT_DIR}" -quiet -force 2>/dev/null || true' EXIT

# Copy the .app in with metadata-preserving ditto (xattrs, ACLs, signatures).
ditto "${APP_BUNDLE}" "${MOUNT_DIR}/${APP_NAME}.app"

# Add an /Applications symlink so users can drag-install
ln -sf /Applications "${MOUNT_DIR}/Applications"

# Unmount before convert
hdiutil detach "${MOUNT_DIR}" -quiet
trap - EXIT

# Convert to compressed read-only DMG (overwrite if it already exists)
hdiutil convert "${TMP_DMG}" \
  -format UDZO \
  -imagekey zlib-level=9 \
  -ov \
  -o "dist/${DMG_NAME}"

rm "${TMP_DMG}"
echo "✓ dist/${DMG_NAME}"
