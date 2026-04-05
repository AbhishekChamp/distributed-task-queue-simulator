import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BottleneckAlert } from './BottleneckAlert'

describe('BottleneckAlert', () => {
  it('renders normal state', () => {
    render(<BottleneckAlert stage="none" />)
    expect(screen.getByText(/operating within normal parameters/i)).toBeInTheDocument()
  })

  it('renders queue bottleneck', () => {
    render(<BottleneckAlert stage="queue" />)
    expect(screen.getByText(/Queue bottleneck/i)).toBeInTheDocument()
  })

  it('renders worker bottleneck', () => {
    render(<BottleneckAlert stage="workers" />)
    expect(screen.getByText(/Worker bottleneck/i)).toBeInTheDocument()
  })
})
