export const ipcMain = {
  handle: () => {}
}

export const dialog = {
  showOpenDialog: async () => ({ canceled: true, filePaths: [] as string[] })
}

export const BrowserWindow = {
  fromWebContents: () => null
}

export const net = {
  fetch: (url: string, options?: RequestInit) => globalThis.fetch(url, options)
}

export const protocol = {
  handle: () => {}
}

export const shell = {
  trashItem: async () => {}
}

export const app = {
  getPath: () => '',
  getVersion: () => '0.0.0'
}
