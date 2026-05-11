import { useCallback, useEffect, useRef, useState } from 'react'

const DB_NAME = 'academic-grade-db'
const STORE = 'dashboard'
const KEY = 'dashboard-state'
const VERSION = 1

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function runTransaction(db, mode, callback) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, mode)
    const store = transaction.objectStore(STORE)
    const request = callback(store)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export function useIndexedDB(initialValue) {
  const [data, setData] = useState(initialValue)
  const [loaded, setLoaded] = useState(false)
  const saveTimeoutRef = useRef(null)

  useEffect(() => {
    let isMounted = true

    async function load() {
      try {
        const db = await openDatabase()
        const stored = await runTransaction(db, 'readonly', (store) => store.get(KEY))
        db.close()

        if (isMounted && stored) {
          setData(stored)
        }
      } catch {
        // fallback silencieux: initialValue
      } finally {
        if (isMounted) {
          setLoaded(true)
        }
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!loaded) return

    clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const db = await openDatabase()
        await runTransaction(db, 'readwrite', (store) => store.put(data, KEY))
        db.close()
      } catch {
        // fallback silencieux
      }
    }, 100)

    return () => clearTimeout(saveTimeoutRef.current)
  }, [data, loaded])

  const reset = useCallback(() => setData(initialValue), [initialValue])

  return { data, setData, loaded, reset }
}
