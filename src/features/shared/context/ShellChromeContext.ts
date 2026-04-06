import { createContext } from 'react'

export type ShellChromeContextValue = {
  isMobileViewport: boolean
  isSidebarOpen: boolean
  closeSidebar: () => void
  openSidebar: () => void
  toggleSidebar: () => void
}

export const ShellChromeContext = createContext<ShellChromeContextValue | null>(null)
