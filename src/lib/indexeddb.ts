import type { PersistedSession, SimulationState } from '../types'

const DB_NAME = 'dtq-simulator'
const DB_VERSION = 1
const STORE_NAME = 'sessions'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
  })
}

export async function saveSession(
  name: string,
  snapshots: SimulationState[],
  events: PersistedSession['events'],
): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  const session: PersistedSession = {
    id: `${Date.now()}`,
    name,
    createdAt: Date.now(),
    metricsHistory: snapshots.map((s) => ({ ...s.metrics, timestamp: Date.now() })),
    events,
  }
  store.put(session)
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function loadSessions(): Promise<PersistedSession[]> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const store = tx.objectStore(STORE_NAME)
  return new Promise((resolve, reject) => {
    const request = store.getAll()
    request.onsuccess = () => {
      const result = request.result as PersistedSession[]
      resolve(result.sort((a, b) => b.createdAt - a.createdAt))
    }
    request.onerror = () => reject(request.error)
  })
}

export async function deleteSession(id: string): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  store.delete(id)
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
