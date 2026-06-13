import { beforeEach, describe, expect, it, vi } from 'vitest'
import { net, protocol } from 'electron'
import {
  clearPreviewCache,
  registerAppProtocol,
  setAllowedPreviewRoot
} from '../../src/main/localProtocol'

type ProtocolHandler = (request: { url: string }) => Promise<Response>

function registerProtocolTestHandler(): ProtocolHandler {
  let handler: ProtocolHandler | null = null
  vi.spyOn(protocol, 'handle').mockImplementation((_scheme, registeredHandler) => {
    handler = registeredHandler as ProtocolHandler
  })
  registerAppProtocol()

  if (!handler) {
    throw new Error('Protocol handler was not registered')
  }

  return handler
}

describe('local app:// protocol', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    setAllowedPreviewRoot('/__cleanup_photos_test_reset__')
    clearPreviewCache()
  })

  it('rejects requests for hosts other than images', async () => {
    const handler = registerProtocolTestHandler()

    const response = await handler({ url: 'app://not-images/allowed/photo.jpg' })

    expect(response.status).toBe(400)
  })

  it('rejects image paths outside registered roots', async () => {
    setAllowedPreviewRoot('/allowed')
    const handler = registerProtocolTestHandler()

    const response = await handler({ url: 'app://images/outside/photo.jpg' })

    expect(response.status).toBe(403)
  })

  it('serves allowed image paths through Electron net.fetch', async () => {
    vi.spyOn(net, 'fetch').mockResolvedValue(new Response('ok'))
    setAllowedPreviewRoot('/allowed')
    const handler = registerProtocolTestHandler()

    const response = await handler({ url: 'app://images/allowed/photo.jpg' })

    expect(response.status).toBe(200)
    expect(net.fetch).toHaveBeenCalledWith('file:///allowed/photo.jpg')
  })

  it('replaces the previous scan root when a new preview root is registered', async () => {
    vi.spyOn(net, 'fetch').mockResolvedValue(new Response('ok'))
    setAllowedPreviewRoot('/first')
    setAllowedPreviewRoot('/second')
    const handler = registerProtocolTestHandler()

    const firstRootResponse = await handler({ url: 'app://images/first/photo.jpg' })
    const secondRootResponse = await handler({ url: 'app://images/second/photo.jpg' })

    expect(firstRootResponse.status).toBe(403)
    expect(secondRootResponse.status).toBe(200)
    expect(net.fetch).toHaveBeenCalledTimes(1)
    expect(net.fetch).toHaveBeenCalledWith('file:///second/photo.jpg')
  })

  it('rejects sibling paths that only share the allowed root prefix', async () => {
    vi.spyOn(net, 'fetch').mockResolvedValue(new Response('ok'))
    setAllowedPreviewRoot('/photos')
    const handler = registerProtocolTestHandler()

    const response = await handler({ url: 'app://images/photos-old/a.jpg' })

    expect(response.status).toBe(403)
    expect(net.fetch).not.toHaveBeenCalled()
  })
})
