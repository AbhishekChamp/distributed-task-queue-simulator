import { useEffect, useState } from 'react'
import type { SimulationConfig } from '../types'

const STORAGE_KEY = 'dtq-presets'

export interface UserPreset {
  name: string
  config: SimulationConfig
}

export function usePresetGallery() {
  const [presets, setPresets] = useState<UserPreset[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as UserPreset[]
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPresets(parsed)
      }
    } catch {
      // ignore
    }
  }, [])

  const savePreset = (name: string, config: SimulationConfig) => {
    const next = [...presets, { name, config }]
    setPresets(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const deletePreset = (name: string) => {
    const next = presets.filter((p) => p.name !== name)
    setPresets(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  return { presets, savePreset, deletePreset }
}
