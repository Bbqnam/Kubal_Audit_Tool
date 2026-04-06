import { PageHeader, Panel, StatusBadge } from '../../../components/ui'
import { useAuditLibrary } from '../../shared/context/useAuditLibrary'
import { formatDate } from '../../../utils/dateUtils'

export default function PlanningChecklistPage() {
  const { planningChecklist, updatePlanningChecklistYear } = useAuditLibrary()
  const years = [...new Set(planningChecklist.flatMap((item) => Object.keys(item.years).map(Number)))].sort((left, right) => left - right)
  const currentYear = years.includes(new Date().getFullYear()) ? new Date().getFullYear() : years[years.length - 1]
  const updatedCount = planningChecklist.filter((item) => item.years[currentYear]?.status === 'Updated').length
  const pendingCount = planningChecklist.length - updatedCount

  return (
    <div className="module-page planning-page">
      <PageHeader
        eyebrow="Planning maintenance"
        title="Yearly update checklist"
        subtitle="Support page for annual plan maintenance, competence review, and checklist traceability."
      />

      <Panel title="Maintenance checklist" description={`${currentYear}: ${updatedCount} updated, ${pendingCount} pending. Use this page during the yearly maintenance cycle, not as the main planner.`}>
        <div className="table-card planning-table-card">
          <table>
            <thead>
              <tr>
                <th>Group</th>
                <th>Item</th>
                <th>Detail</th>
                {years.map((year) => (
                  <th key={year}>{year}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {planningChecklist.map((item) => (
                <tr key={item.id}>
                  <td>{item.group}</td>
                  <td>{item.title}</td>
                  <td>{item.detail}</td>
                  {years.map((year) => {
                    const entry = item.years[year] ?? { status: 'Pending', date: null }

                    return (
                      <td key={year}>
                        <div className="planning-checklist-cell">
                          <StatusBadge value={entry.status} />
                          <span>{entry.date ? formatDate(entry.date) : 'Not updated'}</span>
                          <button
                            type="button"
                            className="button button-secondary button-small"
                            onClick={() => updatePlanningChecklistYear(item.id, year, entry.status === 'Updated' ? 'Pending' : 'Updated')}
                          >
                            {entry.status === 'Updated' ? 'Reset' : 'Mark updated'}
                          </button>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}
