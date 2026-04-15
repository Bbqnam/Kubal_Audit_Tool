import { useMemo, useState } from 'react'
import { MetricCard, Panel } from '../../../components/ui'
import PlanningPageHeader from '../components/PlanningPageHeader'
import { useAuditLibrary } from '../../shared/context/useAuditLibrary'
import { formatDate } from '../../../utils/dateUtils'

function StatusChip({ status }: { status: string }) {
  const isUpdated = status === 'Updated'

  return (
    <span className={`checklist-status-chip ${isUpdated ? 'checklist-status-updated' : 'checklist-status-pending'}`}>
      {isUpdated ? 'Updated' : 'Pending'}
    </span>
  )
}

export default function PlanningChecklistPage() {
  const { planningChecklist, updatePlanningChecklistYear } = useAuditLibrary()
  const years = [...new Set(planningChecklist.flatMap((item) => Object.keys(item.years).map(Number)))].sort((a, b) => a - b)
  const fallbackYear = years.includes(new Date().getFullYear()) ? new Date().getFullYear() : years[years.length - 1]
  const [selectedYear, setSelectedYear] = useState(fallbackYear)

  const selectedYearItems = useMemo(
    () => planningChecklist.map((item) => ({
      ...item,
      currentYearEntry: item.years[selectedYear] ?? { status: 'Pending', date: null },
    })),
    [planningChecklist, selectedYear],
  )
  const updatedCount = selectedYearItems.filter((item) => item.currentYearEntry.status === 'Updated').length
  const pendingCount = selectedYearItems.length - updatedCount
  const groups = [...new Set(selectedYearItems.map((item) => item.group))]

  return (
    <div className="module-page planning-page">
      <PlanningPageHeader
        title="Yearly checklist"
        subtitle="Use one year at a time, keep the control list short, and preserve the year history without repeating the whole page."
      />

      <div className="calendar-pill-nav report-slicer-row">
        <div className="calendar-pill-row report-slicer-group">
          <span className="calendar-pill-label">Year</span>
          <div className="calendar-pill-group">
            {years.map((year) => (
              <button
                key={year}
                type="button"
                className={`calendar-pill ${year === selectedYear ? 'calendar-pill-active' : ''}`}
                onClick={() => setSelectedYear(year)}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="planning-metrics-grid planning-checklist-metrics">
        <MetricCard label="Updated" value={updatedCount} tone="success" />
        <MetricCard label="Pending" value={pendingCount} tone={pendingCount > 0 ? 'warning' : 'success'} />
        <MetricCard label="Control groups" value={groups.length} />
      </div>

      {groups.map((group) => {
        const groupItems = selectedYearItems.filter((item) => item.group === group)
        const groupUpdated = groupItems.filter((item) => item.currentYearEntry.status === 'Updated').length

        return (
          <Panel
            key={group}
            title={group}
            description={`${groupUpdated}/${groupItems.length} controls updated for ${selectedYear}`}
          >
            <div className="planning-checklist-rows">
              {groupItems.map((item) => {
                const currentEntry = item.currentYearEntry
                const isUpdated = currentEntry.status === 'Updated'

                return (
                  <article key={item.id} className="planning-checklist-row">
                    <div className="planning-checklist-row-main">
                      <div className="planning-checklist-row-copy">
                        <strong>{item.title}</strong>
                        <span>{item.detail}</span>
                      </div>
                      <div className="planning-checklist-history">
                        {years.map((year) => {
                          const entry = item.years[year] ?? { status: 'Pending', date: null }

                          return (
                            <span
                              key={year}
                              className={`planning-checklist-history-chip ${entry.status === 'Updated' ? 'planning-checklist-history-chip-updated' : ''}`}
                            >
                              {year}: {entry.date ? formatDate(entry.date) : 'Pending'}
                            </span>
                          )
                        })}
                      </div>
                    </div>

                    <div className={`planning-checklist-row-status ${isUpdated ? 'planning-checklist-row-status-updated' : 'planning-checklist-row-status-pending'}`}>
                      <span className="planning-checklist-row-year">{selectedYear}</span>
                      <StatusChip status={currentEntry.status} />
                      <span className="planning-checklist-row-date">{currentEntry.date ? formatDate(currentEntry.date) : 'Not updated yet'}</span>
                      <button
                        type="button"
                        className={`button button-small ${isUpdated ? 'button-secondary' : 'button-primary'}`}
                        onClick={() => updatePlanningChecklistYear(item.id, selectedYear, isUpdated ? 'Pending' : 'Updated')}
                      >
                        {isUpdated ? 'Reset' : 'Mark updated'}
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          </Panel>
        )
      })}
    </div>
  )
}
