import { useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'theme-preference'

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function useTheme() {
  const [preference, setPreference] = useState(() => localStorage.getItem(STORAGE_KEY) || 'system')
  const [systemTheme, setSystemTheme] = useState(getSystemTheme)

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (event) => setSystemTheme(event.matches ? 'dark' : 'light')
    media.addEventListener('change', handler)
    return () => media.removeEventListener('change', handler)
  }, [])

  const resolvedTheme = useMemo(
    () => (preference === 'system' ? systemTheme : preference),
    [preference, systemTheme],
  )

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, preference)
  }, [preference])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')
  }, [resolvedTheme])

  return {
    preference,
    setPreference,
    resolvedTheme,
  }
}
