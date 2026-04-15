import { StatusBadge } from '../../../components/ui'
import type { PlanningActivityLogEntry } from '../../../types/planning'
import { formatDateTime } from '../../../utils/dateUtils'

function getActivityContextLabel(entry: PlanningActivityLogEntry) {
  if (entry.recordTitle) {
    return entry.year ? `${entry.recordTitle} · ${entry.year}` : entry.recordTitle
  }

  if (entry.checklistTitle) {
    return entry.year ? `${entry.checklistTitle} · ${entry.year}` : entry.checklistTitle
  }

  if (entry.year) {
    return String(entry.year)
  }

  return entry.entityType
}

export default function PlanningActivityFeed({
  entries,
  emptyMessage = 'Major planning actions will appear here once the programme starts changing.',
}: {
  entries: PlanningActivityLogEntry[]
  emptyMessage?: string
}) {
  if (!entries.length) {
    return (
      <div className="planning-activity-empty">
        <strong>No major planning activity yet</strong>
        <span>{emptyMessage}</span>
      </div>
    )
  }

  return (
    <div className="planning-activity-feed">
      {entries.map((entry) => (
        <article key={entry.id} className="planning-activity-item">
          <div className="planning-activity-item-top">
            <StatusBadge value={entry.action} />
            <span>{formatDateTime(entry.timestamp)}</span>
          </div>
          <strong>{entry.summary}</strong>
          <div className="planning-activity-item-meta">
            <span>{getActivityContextLabel(entry)}</span>
            <span>{entry.actorName} · {entry.actorPosition}</span>
          </div>
        </article>
      ))}
    </div>
  )
}
