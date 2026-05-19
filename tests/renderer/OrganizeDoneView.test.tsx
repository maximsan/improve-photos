// @vitest-environment happy-dom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { OrganizeDoneView } from '../../src/renderer/src/features/Organizer/components/OrganizeDoneView'

afterEach(cleanup)

describe('OrganizeDoneView — organized variant', () => {
  it('shows the file count in the title', () => {
    render(<OrganizeDoneView count={5} variant="organized" onReset={vi.fn()} />)
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('5 files organized')
  })

  it('uses singular "file" for a count of 1', () => {
    render(<OrganizeDoneView count={1} variant="organized" onReset={vi.fn()} />)
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('1 file organized')
  })

  it('shows the "Organize again" reset button', () => {
    render(<OrganizeDoneView count={3} variant="organized" onReset={vi.fn()} />)
    expect(screen.getByRole('button', { name: /organize again/i })).not.toBeNull()
  })

  it('calls onReset when "Organize again" is clicked', () => {
    const onReset = vi.fn()
    render(<OrganizeDoneView count={3} variant="organized" onReset={onReset} />)
    fireEvent.click(screen.getByRole('button', { name: /organize again/i }))
    expect(onReset).toHaveBeenCalledOnce()
  })

  it('shows the "Undo" button when onUndo is provided', () => {
    render(<OrganizeDoneView count={3} variant="organized" onReset={vi.fn()} onUndo={vi.fn()} />)
    expect(screen.getByRole('button', { name: /undo/i })).not.toBeNull()
  })

  it('calls onUndo when the undo button is clicked', () => {
    const onUndo = vi.fn()
    render(<OrganizeDoneView count={3} variant="organized" onReset={vi.fn()} onUndo={onUndo} />)
    fireEvent.click(screen.getByRole('button', { name: /undo/i }))
    expect(onUndo).toHaveBeenCalledOnce()
  })

  it('does not show the "Undo" button when onUndo is absent', () => {
    render(<OrganizeDoneView count={3} variant="organized" onReset={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /undo/i })).toBeNull()
  })

  it('shows an error message when error is provided', () => {
    render(
      <OrganizeDoneView
        count={3}
        variant="organized"
        onReset={vi.fn()}
        onUndo={vi.fn()}
        error="2 of 3 files could not be reverted"
      />
    )
    expect(screen.getByText(/2 of 3 files could not be reverted/i)).not.toBeNull()
  })

  it('does not render error text when error is null', () => {
    render(<OrganizeDoneView count={3} variant="organized" onReset={vi.fn()} error={null} />)
    expect(screen.queryByText(/could not/i)).toBeNull()
  })
})

describe('OrganizeDoneView — reverted variant', () => {
  it('shows "Files reverted" as the title', () => {
    render(<OrganizeDoneView count={3} variant="reverted" onReset={vi.fn()} />)
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Files reverted')
  })

  it('shows original-locations body text', () => {
    render(<OrganizeDoneView count={3} variant="reverted" onReset={vi.fn()} />)
    expect(screen.getByText(/original locations/i)).not.toBeNull()
  })

  it('shows "Done" as the reset button label', () => {
    render(<OrganizeDoneView count={3} variant="reverted" onReset={vi.fn()} />)
    expect(screen.getByRole('button', { name: /^done$/i })).not.toBeNull()
  })

  it('does not show an "Undo" button in reverted state even when onUndo is passed', () => {
    render(<OrganizeDoneView count={3} variant="reverted" onReset={vi.fn()} onUndo={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /undo/i })).toBeNull()
  })

  it('calls onReset when "Done" is clicked', () => {
    const onReset = vi.fn()
    render(<OrganizeDoneView count={3} variant="reverted" onReset={onReset} />)
    fireEvent.click(screen.getByRole('button', { name: /^done$/i }))
    expect(onReset).toHaveBeenCalledOnce()
  })
})
