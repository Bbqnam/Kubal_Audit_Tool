import { useParams } from 'react-router-dom'
import { useAuditLibrary } from './useAuditLibrary'

export function useAuditWorkspace() {
  const { auditId } = useParams<{ auditId: string }>()
  const context = useAuditLibrary()
  const audit = auditId ? context.getAuditById(auditId) : undefined

  if (!audit) {
    throw new Error('Active audit could not be found for the current route')
  }

  return {
    ...context,
    audit,
    auditId: audit.id,
  }
}
