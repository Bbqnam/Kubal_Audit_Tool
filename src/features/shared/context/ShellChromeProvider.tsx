import { useEffect, useMemo, useState } from 'react'
import { ShellChromeContext, type ShellChromeContextValue } from './ShellChromeContext'

const SIDEBAR_STATE_KEY = 'kubal-audit-tool:sidebar-collapsed'
const NARROW_SCREEN_QUERY = '(max-width: 1200px)'

function getDefaultCollapsedState() {
  if (typeof window === 'undefined') {
    return false
  }

  const storedValue = window.localStorage.getItem(SIDEBAR_STATE_KEY)

  if (storedValue !== null) {
    return storedValue === 'true'
  }

  return window.matchMedia(NARROW_SCREEN_QUERY).matches
}

export function ShellChromeProvider({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(getDefaultCollapsedState)

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_STATE_KEY, String(isSidebarCollapsed))
  }, [isSidebarCollapsed])

  const value = useMemo<ShellChromeContextValue>(
    () => ({
      isSidebarCollapsed,
      setSidebarCollapsed: setIsSidebarCollapsed,
      toggleSidebar: () => setIsSidebarCollapsed((current) => !current),
    }),
    [isSidebarCollapsed],
  )

  return <ShellChromeContext.Provider value={value}>{children}</ShellChromeContext.Provider>
}
