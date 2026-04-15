import type { AuditHistoryEntry } from '../types/audit'
import { formatDateTime } from '../utils/dateUtils'

export default function ActivityLog({ history }: { history: AuditHistoryEntry[] }) {
  const items = [...history].sort((left, right) => right.timestamp.localeCompare(left.timestamp))

  if (!items.length) {
    return (
      <div className="activity-log-empty">
        <strong>No audit activity recorded yet.</strong>
        <p>New audit events will appear here automatically.</p>
      </div>
    )
  }

  return (
    <div className="activity-log-list">
      {items.map((item) => (
        <article key={item.id} className="activity-log-item">
          <div className="activity-log-item-header">
            <span className="activity-log-badge">{item.actionType}</span>
            <time dateTime={item.timestamp}>{formatDateTime(item.timestamp)}</time>
          </div>
          <strong>{item.description}</strong>
          <p>{item.actor}</p>
        </article>
      ))}
    </div>
  )
}
