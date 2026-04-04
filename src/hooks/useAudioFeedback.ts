import { useCallback, useRef } from 'react'

const AUDIO_CONSENT_KEY = 'dtq-audio-consent'

export function useAudioFeedback() {
  const ctxRef = useRef<AudioContext | null>(null)

  const getConsent = useCallback(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(AUDIO_CONSENT_KEY) === 'true'
  }, [])

  const setConsent = useCallback((value: boolean) => {
    if (typeof window === 'undefined') return
    localStorage.setItem(AUDIO_CONSENT_KEY, String(value))
  }, [])

  const playTone = useCallback(
    (frequency: number, duration: number, type: OscillatorType = 'sine') => {
      if (!getConsent()) return
      try {
        if (!ctxRef.current) {
          ctxRef.current = new (
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
          )()
        }
        const ctx = ctxRef.current
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = type
        osc.frequency.setValueAtTime(frequency, ctx.currentTime)
        gain.gain.setValueAtTime(0.05, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + duration)
      } catch {
        // ignore
      }
    },
    [getConsent],
  )

  const playSuccess = useCallback(() => {
    playTone(880, 0.08, 'sine')
  }, [playTone])

  const playFailure = useCallback(() => {
    playTone(220, 0.15, 'sawtooth')
  }, [playTone])

  const playClick = useCallback(() => {
    playTone(600, 0.03, 'triangle')
  }, [playTone])

  return { getConsent, setConsent, playSuccess, playFailure, playClick }
}
