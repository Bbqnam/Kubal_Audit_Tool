import { useEffect, useMemo, useState } from 'react'
import { ShellChromeContext, type ShellChromeContextValue } from './ShellChromeContext'

const MOBILE_SCREEN_QUERY = '(max-width: 1180px)'

function getIsMobileViewport() {
  if (typeof window === 'undefined') {
    return false
  }

  return window.matchMedia(MOBILE_SCREEN_QUERY).matches
}

export function ShellChromeProvider({ children }: { children: React.ReactNode }) {
  const [isMobileViewport, setIsMobileViewport] = useState(getIsMobileViewport)
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => !getIsMobileViewport())

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const mediaQuery = window.matchMedia(MOBILE_SCREEN_QUERY)
    const syncViewport = (matches: boolean) => {
      setIsMobileViewport(matches)
      setIsSidebarOpen(!matches)
    }
    const handleChange = (event: MediaQueryListEvent) => {
      syncViewport(event.matches)
    }

    syncViewport(mediaQuery.matches)

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange)

      return () => {
        mediaQuery.removeEventListener('change', handleChange)
      }
    }

    mediaQuery.addListener(handleChange)

    return () => {
      mediaQuery.removeListener(handleChange)
    }
  }, [])

  const value = useMemo<ShellChromeContextValue>(
    () => ({
      isMobileViewport,
      isSidebarOpen,
      closeSidebar: () => setIsSidebarOpen(false),
      openSidebar: () => setIsSidebarOpen(true),
      toggleSidebar: () => setIsSidebarOpen((current) => !current),
    }),
    [isMobileViewport, isSidebarOpen],
  )

  return <ShellChromeContext.Provider value={value}>{children}</ShellChromeContext.Provider>
}
