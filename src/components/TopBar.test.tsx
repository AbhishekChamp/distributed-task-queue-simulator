import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TopBar } from './TopBar'

describe('TopBar', () => {
  it('shows Start button when not running', () => {
    render(
      <TopBar
        isRunning={false}
        onStart={vi.fn()}
        onPause={vi.fn()}
        onReset={vi.fn()}
        onAddTasks={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: /start simulation/i })).toBeInTheDocument()
  })

  it('shows Pause button when running', () => {
    render(
      <TopBar
        isRunning={true}
        onStart={vi.fn()}
        onPause={vi.fn()}
        onReset={vi.fn()}
        onAddTasks={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: /pause simulation/i })).toBeInTheDocument()
  })

  it('calls onAddTasks when add task buttons clicked', () => {
    const onAddTasks = vi.fn()
    render(
      <TopBar
        isRunning={false}
        onStart={vi.fn()}
        onPause={vi.fn()}
        onReset={vi.fn()}
        onAddTasks={onAddTasks}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /add 10 tasks/i }))
    expect(onAddTasks).toHaveBeenCalledWith(10)
  })
})
