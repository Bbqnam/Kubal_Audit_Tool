import { Navigate, useLocation, useParams } from 'react-router-dom'
import { getAuditRecordHomePath } from '../../../data/navigation'
import type { AuditType } from '../../../types/audit'
import { useAuditLibrary } from '../context/useAuditLibrary'

export default function CanonicalAuditRoute({
  children,
  expectedAuditType,
}: {
  children: React.ReactNode
  expectedAuditType?: AuditType
}) {
  const { auditId, auditType } = useParams<{ auditId: string; auditType: string }>()
  const location = useLocation()
  const { getAuditById } = useAuditLibrary()

  if (!auditId) {
    return <>{children}</>
  }

  const audit = getAuditById(auditId)

  if (!audit) {
    return <Navigate to="/audits" replace />
  }

  const resolvedAuditType = (auditType ?? expectedAuditType) || audit.auditType
  const shouldRedirect = auditId !== audit.id || resolvedAuditType !== audit.auditType

  if (!shouldRedirect) {
    return <>{children}</>
  }

  const currentBasePath = `/audits/${auditId}/${resolvedAuditType}`
  const canonicalBasePath = `/audits/${audit.id}/${audit.auditType}`
  const canonicalPathname = location.pathname === currentBasePath
    ? canonicalBasePath
    : location.pathname.startsWith(`${currentBasePath}/`)
      ? `${canonicalBasePath}${location.pathname.slice(currentBasePath.length)}`
      : getAuditRecordHomePath(audit)

  return <Navigate to={`${canonicalPathname}${location.search}${location.hash}`} replace />
}
