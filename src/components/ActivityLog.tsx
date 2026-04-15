import { useMemo, useState } from 'react'
import type { AuditHistoryActionType, AuditHistoryEntry } from '../types/audit'
import { formatDateTime, parseDateValue } from '../utils/dateUtils'

const archiveMonthFormatter = new Intl.DateTimeFormat('en-GB', {
  month: 'long',
  year: 'numeric',
})

const libraryRecentItemLimit = 8
const libraryExpandedItemStep = 12

type ActivityLogVariant = 'full' | 'library'

type ActivityLogArchiveGroup = {
  key: string
  label: string
  items: AuditHistoryEntry[]
  actionCounts: Map<AuditHistoryActionType, number>
}

type ActivityLogProps = {
  history: AuditHistoryEntry[]
  emptyTitle?: string
  emptyDescription?: string
  variant?: ActivityLogVariant
}

function getArchiveGroupKey(timestamp: string) {
  const parsedDate = parseDateValue(timestamp)

  if (!parsedDate) {
    return 'unknown'
  }

  const year = parsedDate.getFullYear()
  const month = `${parsedDate.getMonth() + 1}`.padStart(2, '0')
  return `${year}-${month}`
}

function getArchiveGroupLabel(timestamp: string) {
  const parsedDate = parseDateValue(timestamp)
  return parsedDate ? archiveMonthFormatter.format(parsedDate) : 'Older activity'
}

function buildArchiveGroups(items: AuditHistoryEntry[]) {
  const groups = new Map<string, ActivityLogArchiveGroup>()

  items.forEach((item) => {
    const key = getArchiveGroupKey(item.timestamp)
    const existingGroup = groups.get(key)

    if (existingGroup) {
      existingGroup.items.push(item)
      existingGroup.actionCounts.set(item.actionType, (existingGroup.actionCounts.get(item.actionType) ?? 0) + 1)
      return
    }

    groups.set(key, {
      key,
      label: getArchiveGroupLabel(item.timestamp),
      items: [item],
      actionCounts: new Map([[item.actionType, 1]]),
    })
  })

  return Array.from(groups.values())
}

function getActivityTitle(item: AuditHistoryEntry) {
  return item.subjectLabel || item.description
}

function ActivityLogEntryRow({
  item,
  isExpanded,
  onToggle,
  compact = false,
}: {
  item: AuditHistoryEntry
  isExpanded: boolean
  onToggle: () => void
  compact?: boolean
}) {
  return (
    <article className={`activity-log-item ${compact ? 'activity-log-item-compact' : ''}`}>
      <button
        type="button"
        className="activity-log-item-toggle"
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        <div className="activity-log-item-main">
          <span className="activity-log-badge">{item.actionType}</span>
          <strong>{getActivityTitle(item)}</strong>
        </div>
        <div className="activity-log-item-trailing">
          <time dateTime={item.timestamp}>{formatDateTime(item.timestamp)}</time>
          <span className="activity-log-expand-link">{isExpanded ? 'Less' : 'More'}</span>
        </div>
      </button>
      {isExpanded ? (
        <div className="activity-log-item-details">
          <p>{item.description}</p>
          <span>{item.actor}</span>
        </div>
      ) : null}
    </article>
  )
}

export default function ActivityLog({
  history,
  emptyTitle = 'No audit activity recorded yet.',
  emptyDescription = 'New audit events will appear here automatically.',
  variant = 'full',
}: ActivityLogProps) {
  const [expandedArchiveKey, setExpandedArchiveKey] = useState<string | null>(null)
  const [expandedArchiveCount, setExpandedArchiveCount] = useState(libraryExpandedItemStep)
  const [expandedItemIds, setExpandedItemIds] = useState<Record<string, boolean>>({})
  const items = useMemo(
    () => [...history].sort((left, right) => right.timestamp.localeCompare(left.timestamp)),
    [history],
  )

  function toggleItem(itemId: string) {
    setExpandedItemIds((current) => ({
      ...current,
      [itemId]: !current[itemId],
    }))
  }

  if (!items.length) {
    return (
      <div className="activity-log-empty">
        <strong>{emptyTitle}</strong>
        <p>{emptyDescription}</p>
      </div>
    )
  }

  if (variant === 'library') {
    const recentItems = items.slice(0, libraryRecentItemLimit)
    const archivedGroups = buildArchiveGroups(items.slice(libraryRecentItemLimit))

    return (
      <div className="activity-log-list">
        {recentItems.map((item) => (
          <ActivityLogEntryRow
            key={item.id}
            item={item}
            isExpanded={Boolean(expandedItemIds[item.id])}
            onToggle={() => toggleItem(item.id)}
          />
        ))}

        {archivedGroups.length ? (
          <section className="activity-log-archive" aria-label="Older activity archive">
            <div className="activity-log-archive-header">
              <strong>Archive overview</strong>
              <span>{items.length - recentItems.length} older entries</span>
            </div>
            <div className="activity-log-archive-list">
              {archivedGroups.map((group) => {
                const isExpanded = expandedArchiveKey === group.key
                const visibleItems = isExpanded ? group.items.slice(0, expandedArchiveCount) : []
                const actionSummaries = Array.from(group.actionCounts.entries())
                  .sort((left, right) => right[1] - left[1])
                  .slice(0, 3)

                return (
                  <article key={group.key} className={`activity-log-archive-row${isExpanded ? ' is-expanded' : ''}`}>
                    <button
                      type="button"
                      className="activity-log-archive-toggle"
                      onClick={() => {
                        if (isExpanded) {
                          setExpandedArchiveKey(null)
                          setExpandedArchiveCount(libraryExpandedItemStep)
                          return
                        }

                        setExpandedArchiveKey(group.key)
                        setExpandedArchiveCount(libraryExpandedItemStep)
                      }}
                      aria-expanded={isExpanded}
                    >
                      <div className="activity-log-archive-meta">
                        <strong>{group.label}</strong>
                        <span>{group.items.length} entries</span>
                      </div>
                      <div className="activity-log-archive-counts" aria-hidden="true">
                        {actionSummaries.map(([actionType, count]) => (
                          <span key={`${group.key}-${actionType}`} className="activity-log-archive-count">
                            {count} {actionType}
                          </span>
                        ))}
                      </div>
                    </button>

                    {isExpanded ? (
                      <div className="activity-log-archive-items">
                        {visibleItems.map((item) => (
                          <ActivityLogEntryRow
                            key={item.id}
                            item={item}
                            compact
                            isExpanded={Boolean(expandedItemIds[item.id])}
                            onToggle={() => toggleItem(item.id)}
                          />
                        ))}
                        {group.items.length > visibleItems.length ? (
                          <div className="activity-log-archive-actions">
                            <button
                              type="button"
                              className="button button-secondary button-small"
                              onClick={() => setExpandedArchiveCount((current) => current + libraryExpandedItemStep)}
                            >
                              Show {Math.min(libraryExpandedItemStep, group.items.length - visibleItems.length)} more
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                )
              })}
            </div>
          </section>
        ) : null}
      </div>
    )
  }

  return (
    <div className="activity-log-list">
      {items.map((item) => (
        <ActivityLogEntryRow
          key={item.id}
          item={item}
          isExpanded={Boolean(expandedItemIds[item.id])}
          onToggle={() => toggleItem(item.id)}
        />
      ))}
    </div>
  )
}
