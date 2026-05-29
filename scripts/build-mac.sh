#!/usr/bin/env bash
# =============================================================================
# build-mac.sh — Produces the macOS Universal DMG.
#
# Two flows, selected by the MAC_NOTARIZE env var:
#
#   MAC_NOTARIZE unset (default) → unsigned ad-hoc local build:
#     * CSC_IDENTITY_AUTO_DISCOVERY=false so electron-builder does not pick up
#       a stray Apple Development cert from the Keychain and fail mid-sign.
#     * hardenedRuntime=false. With hardened runtime ON + ad-hoc signing on
#       macOS 26, dyld refuses to load the Electron Framework into the main
#       process with "different Team IDs", and the app crashes at launch.
#
#   MAC_NOTARIZE=1 → signed + notarized release build:
#     * Caller must also supply APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD,
#       APPLE_TEAM_ID, and (typically) CSC_IDENTITY_AUTO_DISCOVERY=true.
#     * hardenedRuntime=true. Required by Apple notarization.
#     * The afterSign hook (build/notarize.cjs) submits the signed .app to
#       notarytool.
# =============================================================================
set -euo pipefail

: "${CSC_IDENTITY_AUTO_DISCOVERY:=false}"
: "${MAC_NOTARIZE:=0}"

if [ "${MAC_NOTARIZE}" = "1" ]; then
  HARDENED_RUNTIME=true
else
  HARDENED_RUNTIME=false
fi

export CSC_IDENTITY_AUTO_DISCOVERY

pnpm build
electron-builder --mac --dir --universal \
  -c.mac.hardenedRuntime="${HARDENED_RUNTIME}"
bash scripts/create-dmg.sh universal
