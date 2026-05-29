/**
 * electron-builder afterSign hook — submits the signed .app to Apple's
 * notarization service via `notarytool` when explicitly opted in.
 *
 * Activation gate: MAC_NOTARIZE=1 plus all of APPLE_ID,
 * APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID. Without these the hook is a
 * no-op, so unsigned local builds (the default) keep working unchanged.
 */
const { notarize } = require('@electron/notarize')

const REQUIRED_CREDENTIAL_KEYS = ['APPLE_ID', 'APPLE_APP_SPECIFIC_PASSWORD', 'APPLE_TEAM_ID']

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir, packager } = context

  if (electronPlatformName !== 'darwin') {
    return
  }

  if (process.env.MAC_NOTARIZE !== '1') {
    console.log('[notarize] MAC_NOTARIZE != 1 — skipping notarization')
    return
  }

  const missing = REQUIRED_CREDENTIAL_KEYS.filter((key) => !process.env[key])
  if (missing.length > 0) {
    console.log(`[notarize] missing credentials (${missing.join(', ')}) — skipping notarization`)
    return
  }

  const appName = packager.appInfo.productFilename
  const appPath = `${appOutDir}/${appName}.app`

  console.log(`[notarize] submitting ${appPath} to notarytool…`)

  await notarize({
    tool: 'notarytool',
    appPath,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID
  })

  console.log('[notarize] notarization complete')
}
