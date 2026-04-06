import { createContext } from 'react'

export type ShellChromeContextValue = {
  isSidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
}

export const ShellChromeContext = createContext<ShellChromeContextValue | null>(null)
