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
  params.set('mt', String(config.maxTasksPerSecondPerWorker))
  params.set('dd', config.durationDistribution)
  params.set('as', config.enableAutoScaling ? '1' : '0')
  params.set('at', String(config.autoScalingQueueThreshold))
  params.set('nl', String(config.networkLatencyMs))
  params.set('nj', String(config.networkJitterMs))
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
  const mt = params.get('mt')
  if (mt) result.maxTasksPerSecondPerWorker = Number(mt)
  const dd = params.get('dd')
  if (dd) result.durationDistribution = dd as SimulationConfig['durationDistribution']
  const as = params.get('as')
  if (as) result.enableAutoScaling = as === '1'
  const at = params.get('at')
  if (at) result.autoScalingQueueThreshold = Number(at)
  const nl = params.get('nl')
  if (nl) result.networkLatencyMs = Number(nl)
  const nj = params.get('nj')
  if (nj) result.networkJitterMs = Number(nj)
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
    const currentQs = window.location.search.replace(/^\?/, '')
    if (qs === currentQs) return
    const url = `${window.location.pathname}?${qs}`
    window.history.replaceState(null, '', url)
  }, [config])
}
