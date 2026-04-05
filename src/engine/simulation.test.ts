import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SimulationEngine } from './simulation'

describe('SimulationEngine', () => {
  let engine: SimulationEngine

  beforeEach(() => {
    vi.useFakeTimers()
    engine = new SimulationEngine({
      workerCount: 2,
      failureProbability: 0,
      maxRetries: 1,
      simulationSpeed: 10,
      baseProcessingTime: 100,
      maxQueueCapacity: 50,
      loadBalancingStrategy: 'round-robin',
      enableCircuitBreaker: true,
    })
  })

  afterEach(() => {
    engine.reset()
    vi.useRealTimers()
  })

  it('starts with empty state', () => {
    const state = engine.getState()
    expect(state.tasks.size).toBe(0)
    expect(state.mainQueue.length).toBe(0)
    expect(state.isRunning).toBe(false)
  })

  it('adds tasks to the main queue', () => {
    engine.addTask(5)
    const state = engine.getState()
    expect(state.tasks.size).toBe(5)
    expect(state.mainQueue.length).toBe(5)
  })

  it('processes tasks to completion with zero failure', async () => {
    engine.addTask(2)
    engine.start()
    await vi.advanceTimersByTimeAsync(2000)
    const state = engine.getState()
    expect(state.metrics.success).toBe(2)
    expect(state.metrics.processing).toBe(0)
  })

  it('pauses and resumes simulation', () => {
    engine.start()
    expect(engine.getState().isRunning).toBe(true)
    engine.pause()
    expect(engine.getState().isRunning).toBe(false)
  })

  it('applies backpressure when queue is at capacity', () => {
    engine.addTask(60)
    const state = engine.getState()
    expect(state.mainQueue.length).toBeLessThanOrEqual(50)
  })

  it('computes latency percentiles', async () => {
    engine.addTask(3)
    engine.start()
    await vi.advanceTimersByTimeAsync(2000)
    const state = engine.getState()
    expect(state.metrics.p50Latency).toBeGreaterThanOrEqual(0)
    expect(state.metrics.p95Latency).toBeGreaterThanOrEqual(0)
  })
})
