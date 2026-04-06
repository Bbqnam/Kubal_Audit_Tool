import { MetricCard, PageHeader, Panel } from '../../../components/ui'
import { useAuditLibrary } from '../../shared/context/useAuditLibrary'
import { formatDate } from '../../../utils/dateUtils'

function StatusChip({ status }: { status: string }) {
  const isUpdated = status === 'Updated'
  return (
    <span className={`checklist-status-chip ${isUpdated ? 'checklist-status-updated' : 'checklist-status-pending'}`}>
      {isUpdated ? '✓ Updated' : '○ Pending'}
    </span>
  )
}

export default function PlanningChecklistPage() {
  const { planningChecklist, updatePlanningChecklistYear } = useAuditLibrary()
  const years = [...new Set(planningChecklist.flatMap((item) => Object.keys(item.years).map(Number)))].sort((a, b) => a - b)
  const currentYear = years.includes(new Date().getFullYear()) ? new Date().getFullYear() : years[years.length - 1]
  const updatedCount = planningChecklist.filter((item) => item.years[currentYear]?.status === 'Updated').length
  const pendingCount = planningChecklist.length - updatedCount

  // Group items by group
  const groups = [...new Set(planningChecklist.map((item) => item.group))]

  return (
    <div className="module-page planning-page">
      <PageHeader
        eyebrow="Audit planning"
      />

      <div className="planning-metrics-grid planning-checklist-metrics">
        <MetricCard label="Updated" value={updatedCount} tone="success" />
        <MetricCard label="Pending" value={pendingCount} tone={pendingCount > 0 ? 'warning' : 'success'} />
        <MetricCard label="Tracking" value={`${years.length} years`} />
      </div>

      {groups.map((group) => {
        const groupItems = planningChecklist.filter((item) => item.group === group)

        return (
          <Panel key={group} title={group} description={`${groupItems.length} checklist items`}>
            <div className="checklist-card-list">
              {groupItems.map((item) => (
                <div key={item.id} className="checklist-card">
                  <div className="checklist-card-info">
                    <strong className="checklist-card-title">{item.title}</strong>
                    <span className="checklist-card-detail">{item.detail}</span>
                  </div>
                  <div className="checklist-card-years">
                    {years.map((year) => {
                      const entry = item.years[year] ?? { status: 'Pending', date: null }
                      const isUpdated = entry.status === 'Updated'
                      return (
                        <div key={year} className={`checklist-year-cell ${isUpdated ? 'checklist-year-done' : 'checklist-year-pending'}`}>
                          <span className="checklist-year-num">{year}</span>
                          <StatusChip status={entry.status} />
                          <span className="checklist-year-date">
                            {entry.date ? formatDate(entry.date) : 'Not updated'}
                          </span>
                          <button
                            type="button"
                            className={`button button-small ${isUpdated ? 'button-secondary' : 'button-primary'}`}
                            onClick={() => updatePlanningChecklistYear(item.id, year, isUpdated ? 'Pending' : 'Updated')}
                          >
                            {isUpdated ? 'Reset' : 'Mark updated'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        )
      })}
    </div>
  )
}
