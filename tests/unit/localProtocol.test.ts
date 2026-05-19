import { beforeEach, describe, expect, it, vi } from 'vitest'
import { net, protocol } from 'electron'
import {
  allowDirectory,
  clearPreviewCache,
  registerAppProtocol
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
    clearPreviewCache()
  })

  it('rejects requests for hosts other than images', async () => {
    const handler = registerProtocolTestHandler()

    const response = await handler({ url: 'app://not-images/allowed/photo.jpg' })

    expect(response.status).toBe(400)
  })

  it('rejects image paths outside registered roots', async () => {
    allowDirectory('/allowed')
    const handler = registerProtocolTestHandler()

    const response = await handler({ url: 'app://images/outside/photo.jpg' })

    expect(response.status).toBe(403)
  })

  it('serves allowed image paths through Electron net.fetch', async () => {
    vi.spyOn(net, 'fetch').mockResolvedValue(new Response('ok'))
    allowDirectory('/allowed')
    const handler = registerProtocolTestHandler()

    const response = await handler({ url: 'app://images/allowed/photo.jpg' })

    expect(response.status).toBe(200)
    expect(net.fetch).toHaveBeenCalledWith('file:///allowed/photo.jpg')
  })
})
