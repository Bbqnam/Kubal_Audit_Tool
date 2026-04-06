import { useContext } from 'react'
import { ShellChromeContext } from './ShellChromeContext'

export function useShellChrome() {
  const context = useContext(ShellChromeContext)

  if (!context) {
    throw new Error('useShellChrome must be used within a ShellChromeProvider')
  }

  return context
}
