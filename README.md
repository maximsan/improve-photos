# Cleanup Photos

Cleanup Photos is an Electron desktop app for scanning photo folders, finding duplicates, reviewing blurry images, organizing files by capture date, and exporting resized copies.

The v1 release target is a Universal macOS DMG distributed through GitHub Releases. Cleanup Photos is local-first: it scans folders on disk and does not upload photos or include telemetry by default.

## V1 Status

- Final v1 scope lives in `docs/v1-ready-to-market-plan.md`.
- Payments, auto-updates, and release publishing are disabled by default until explicit final v1 approval.
- Unlicensed v1 use will be limited to 100 photos per workflow action; licensed users will get unlimited local processing.
- Lemon Squeezy license activation, GitHub Releases auto-update, signing, notarization, and Universal macOS packaging are planned v1 work and must remain gated until approval.

## Recommended IDE Setup

- VS Code
- ESLint extension
- Prettier extension

## Project Setup

Install dependencies:

```bash
pnpm install
```

Run the app in development:

```bash
pnpm dev
```

Run local checks:

```bash
pnpm lint
pnpm typecheck
pnpm test
```

Build compiled Electron output:

```bash
pnpm build
```

Run the Electron smoke tests after building:

```bash
pnpm test:e2e
```

Build a local Universal macOS DMG (runs natively on Intel `x64` and Apple Silicon `arm64`):

```bash
pnpm build:mac
```

This produces `dist/mac-universal/Cleanup Photos.app` and `dist/Cleanup Photos-<version>-universal.dmg`. Verify the result:

```bash
# Confirm both architectures are present in the app binary
lipo -info "dist/mac-universal/Cleanup Photos.app/Contents/MacOS/Cleanup Photos"
# Expected: Architectures in the fat file: x86_64 arm64

# Inspect the signature (unsigned local builds will report "code object is not signed at all")
codesign -dv --verbose=2 "dist/mac-universal/Cleanup Photos.app"
```

### Signed & notarized release (opt-in)

Local builds are unsigned by default and require no Apple credentials. To produce a signed, notarized DMG suitable for distribution, set the following environment variables before running `pnpm build:mac`:

```bash
export MAC_NOTARIZE=1
export CSC_IDENTITY_AUTO_DISCOVERY=true        # opt-in to Keychain identity lookup
export APPLE_ID="your-apple-id@example.com"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"   # https://appleid.apple.com → App-Specific Passwords
export APPLE_TEAM_ID="ABCD123456"
# If your Developer ID cert is not in the login Keychain:
# export CSC_LINK="file:///path/to/DeveloperID.p12"
# export CSC_KEY_PASSWORD="..."
pnpm build:mac
```

Never commit these values. Without `MAC_NOTARIZE=1` the build is unsigned, hardened runtime is disabled (it crashes ad-hoc-signed apps on macOS 26 with a Team-ID error in dyld), `CSC_IDENTITY_AUTO_DISCOVERY` is forced to `false` (so a stray "Apple Development" cert in the Keychain cannot fail the build partway), and the notarize hook is a no-op. With `MAC_NOTARIZE=1` the wrapper flips hardened runtime on (required by notarization) and lets identity discovery proceed.

## Notes

- `pnpm test:e2e` expects compiled output in `out/`, so run `pnpm build` first.
- Do not publish or create public releases from local builds.
