import { useState } from 'react'
import type { SimulationConfig } from '../types'
import { usePresetGallery } from '../hooks/usePresetGallery'

interface PresetGalleryProps {
  currentConfig: SimulationConfig
  onApply: (config: SimulationConfig) => void
}

export function PresetGallery({ currentConfig, onApply }: PresetGalleryProps) {
  const { presets, savePreset, deletePreset } = usePresetGallery()
  const [name, setName] = useState('')

  const handleSave = () => {
    if (!name.trim()) return
    savePreset(name.trim(), currentConfig)
    setName('')
  }

  return (
    <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500">
        Preset Gallery
      </h3>
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Preset name"
          className="flex-1 min-w-0 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs text-slate-800 dark:text-slate-200"
        />
        <button
          onClick={handleSave}
          className="px-2 py-1 rounded-md bg-emerald-100 dark:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium hover:bg-emerald-200 dark:hover:bg-emerald-600/30 transition"
        >
          Save
        </button>
      </div>
      {presets.length > 0 && (
        <div className="space-y-1 max-h-32 overflow-auto">
          {presets.map((p) => (
            <div
              key={p.name}
              className="flex items-center justify-between rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 px-2 py-1"
            >
              <button
                onClick={() => onApply(p.config)}
                className="text-xs text-slate-700 dark:text-slate-300 truncate text-left flex-1"
              >
                {p.name}
              </button>
              <button
                onClick={() => deletePreset(p.name)}
                className="text-[10px] text-rose-600 hover:underline ml-2"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
