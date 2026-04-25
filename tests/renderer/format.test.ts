import { describe, it, expect } from 'vitest'
import { formatBytes, fileUrl } from '../../src/renderer/src/lib/format'

describe('formatBytes', () => {
  it('formats zero as bytes', () => {
    expect(formatBytes(0)).toBe('0 B')
  })

  it('formats values below 1 KB as bytes', () => {
    expect(formatBytes(1)).toBe('1 B')
    expect(formatBytes(1023)).toBe('1023 B')
  })

  it('formats 1 KB boundary', () => {
    expect(formatBytes(1024)).toBe('1.0 KB')
  })

  it('formats values in KB range', () => {
    expect(formatBytes(1536)).toBe('1.5 KB')
    expect(formatBytes(1024 * 1024 - 1)).toBe('1024.0 KB')
  })

  it('formats 1 MB boundary', () => {
    expect(formatBytes(1024 * 1024)).toBe('1.0 MB')
  })

  it('formats values in MB range', () => {
    expect(formatBytes(1.5 * 1024 * 1024)).toBe('1.5 MB')
  })

  it('formats 1 GB boundary', () => {
    expect(formatBytes(1024 * 1024 * 1024)).toBe('1.00 GB')
  })

  it('formats values above 1 GB', () => {
    expect(formatBytes(2.5 * 1024 * 1024 * 1024)).toBe('2.50 GB')
  })
})

describe('fileUrl', () => {
  it('prepends app://images to the path', () => {
    expect(fileUrl('/Users/foo/bar.jpg')).toBe('app://images/Users/foo/bar.jpg')
  })

  it('preserves paths with spaces and special characters', () => {
    expect(fileUrl('/my photos/hello world.jpg')).toBe('app://images/my photos/hello world.jpg')
  })

  it('preserves nested paths', () => {
    expect(fileUrl('/a/b/c/d.png')).toBe('app://images/a/b/c/d.png')
  })
})
