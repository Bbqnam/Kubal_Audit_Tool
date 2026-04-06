import { useParams } from 'react-router-dom'
import { useAuditLibrary } from '../features/shared/context/useAuditLibrary'
import { formatDateTime } from '../utils/dateUtils'
import { StatusBadge } from './ui'

export default function Topbar() {
  const { auditId } = useParams<{ auditId?: string }>()
  const { getAuditById, lastSavedAt, saveState } = useAuditLibrary()
  const activeAudit = auditId ? getAuditById(auditId) : undefined

  if (!activeAudit) {
    return null
  }

  return (
    <div className="module-toolbar-meta">
      <div className="save-indicator">
        <StatusBadge value={saveState === 'Saving' ? 'Saving' : 'Saved'} />
        <div>
          <strong>{activeAudit.title}</strong>
          <p>{saveState === 'Saving' ? 'Saving...' : `Saved ${formatDateTime(lastSavedAt ?? activeAudit.updatedAt)}`}</p>
        </div>
      </div>
    </div>
  )
}
