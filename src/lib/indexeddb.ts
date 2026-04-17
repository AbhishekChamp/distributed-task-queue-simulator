import type { Bookmark, PersistedSession, SimulationState } from '../types'

const DB_NAME = 'dtq-simulator'
const DB_VERSION = 2
const SESSION_STORE = 'sessions'
const BOOKMARK_STORE = 'bookmarks'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(SESSION_STORE)) {
        db.createObjectStore(SESSION_STORE, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(BOOKMARK_STORE)) {
        db.createObjectStore(BOOKMARK_STORE, { keyPath: 'id' })
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
  const tx = db.transaction(SESSION_STORE, 'readwrite')
  const store = tx.objectStore(SESSION_STORE)
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
  const tx = db.transaction(SESSION_STORE, 'readonly')
  const store = tx.objectStore(SESSION_STORE)
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
  const tx = db.transaction(SESSION_STORE, 'readwrite')
  const store = tx.objectStore(SESSION_STORE)
  store.delete(id)
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function saveBookmark(name: string, snapshot: SimulationState): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(BOOKMARK_STORE, 'readwrite')
  const store = tx.objectStore(BOOKMARK_STORE)
  const bookmark: Bookmark = {
    id: `${Date.now()}`,
    name,
    createdAt: Date.now(),
    snapshot,
  }
  store.put(bookmark)
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function loadBookmarks(): Promise<Bookmark[]> {
  const db = await openDB()
  const tx = db.transaction(BOOKMARK_STORE, 'readonly')
  const store = tx.objectStore(BOOKMARK_STORE)
  return new Promise((resolve, reject) => {
    const request = store.getAll()
    request.onsuccess = () => {
      const result = request.result as Bookmark[]
      resolve(result.sort((a, b) => b.createdAt - a.createdAt))
    }
    request.onerror = () => reject(request.error)
  })
}

export async function deleteBookmark(id: string): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(BOOKMARK_STORE, 'readwrite')
  const store = tx.objectStore(BOOKMARK_STORE)
  store.delete(id)
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
