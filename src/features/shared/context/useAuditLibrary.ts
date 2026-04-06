import { useContext } from 'react'
import { AuditWorkspaceContext } from './AuditWorkspaceValue'

export function useAuditLibrary() {
  const context = useContext(AuditWorkspaceContext)

  if (!context) {
    throw new Error('useAuditLibrary must be used within AuditWorkspaceProvider')
  }

  return context
}
