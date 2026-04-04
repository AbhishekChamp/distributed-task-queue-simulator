import { useEffect, useRef } from 'react'
import type { SimulationConfig } from '../types'

function serializeConfig(config: SimulationConfig): string {
  const params = new URLSearchParams()
  params.set('wc', String(config.workerCount))
  params.set('fp', String(config.failureProbability))
  params.set('mr', String(config.maxRetries))
  params.set('ss', String(config.simulationSpeed))
  params.set('bt', String(config.baseProcessingTime))
  params.set('mc', String(config.maxQueueCapacity))
  params.set('lb', config.loadBalancingStrategy)
  params.set('cb', config.enableCircuitBreaker ? '1' : '0')
  return params.toString()
}

export function readConfigFromUrl(): Partial<SimulationConfig> | undefined {
  if (typeof window === 'undefined') return undefined
  const params = new URLSearchParams(window.location.search)
  if (!params.has('wc')) return undefined
  const result: Partial<SimulationConfig> = {}
  const wc = params.get('wc')
  if (wc) result.workerCount = Number(wc)
  const fp = params.get('fp')
  if (fp) result.failureProbability = Number(fp)
  const mr = params.get('mr')
  if (mr) result.maxRetries = Number(mr)
  const ss = params.get('ss')
  if (ss) result.simulationSpeed = Number(ss)
  const bt = params.get('bt')
  if (bt) result.baseProcessingTime = Number(bt)
  const mc = params.get('mc')
  if (mc) result.maxQueueCapacity = Number(mc)
  const lb = params.get('lb')
  if (lb) result.loadBalancingStrategy = lb as SimulationConfig['loadBalancingStrategy']
  const cb = params.get('cb')
  if (cb) result.enableCircuitBreaker = cb === '1'
  return result
}

export function useShareableUrl(config: SimulationConfig) {
  const hasUpdatedRef = useRef(false)

  useEffect(() => {
    if (!hasUpdatedRef.current) {
      hasUpdatedRef.current = true
      return
    }
    const qs = serializeConfig(config)
    const url = `${window.location.pathname}?${qs}`
    window.history.replaceState(null, '', url)
  }, [config])
}
