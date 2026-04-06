import { NavLink, useLocation, useParams } from 'react-router-dom'
import { getModuleNavigation } from '../data/navigation'
import type { AuditType } from '../types/audit'
import { useAuditLibrary } from '../features/shared/context/useAuditLibrary'

export default function ModuleSectionNav() {
  const location = useLocation()
  const { auditId } = useParams<{ auditId?: string }>()
  const { getAuditById } = useAuditLibrary()
  const activeAudit = auditId ? getAuditById(auditId) : undefined
  const detectedModule: AuditType | 'planning' | undefined = location.pathname.startsWith('/planning')
    ? 'planning'
    : activeAudit?.auditType
  const items = getModuleNavigation(detectedModule, auditId)

  if (!items.length) {
    return null
  }

  return (
    <div className="module-nav">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/planning' || !item.to.endsWith('/action-plan')}
          className="module-nav-link"
        >
          {item.label}
        </NavLink>
      ))}
    </div>
  )
}
