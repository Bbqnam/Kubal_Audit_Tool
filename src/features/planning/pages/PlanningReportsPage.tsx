import { MetricCard, PageHeader, Panel, StatusBadge } from '../../../components/ui'
import { useAuditLibrary } from '../../shared/context/useAuditLibrary'
import { formatDate } from '../../../utils/dateUtils'
import { getDerivedPlanStatus, getOverduePlanningRecords, getStandardColorClass, getUpcomingPlanningRecords, summarizePlans } from '../services/planningUtils'

type AggregateRow = {
  label: string
  total: number
  completed: number
  open: number
  overdue: number
}

function buildAggregateRows<T extends string>(items: ReturnType<typeof useAuditLibrary>['planningRecords'], keySelector: (item: ReturnType<typeof useAuditLibrary>['planningRecords'][number]) => T) {
  const groups = new Map<string, AggregateRow>()

  items.forEach((item) => {
    const label = keySelector(item)
    const status = getDerivedPlanStatus(item)
    const existing = groups.get(label) ?? { label, total: 0, completed: 0, open: 0, overdue: 0 }
    existing.total += 1
    existing.completed += status === 'Completed' ? 1 : 0
    existing.overdue += status === 'Overdue' ? 1 : 0
    existing.open += status === 'Completed' ? 0 : 1
    groups.set(label, existing)
  })

  return [...groups.values()].sort((left, right) => right.total - left.total || left.label.localeCompare(right.label))
}

function HorizonCard({ label, count }: { label: string; count: number }) {
  return (
    <div className="summary-card planning-horizon-card">
      <span>{label}</span>
      <strong>{count}</strong>
    </div>
  )
}

function PlanningDistributionRow({
  label,
  total,
  completed,
  open,
  overdue,
  toneClassName,
  helper,
}: AggregateRow & {
  toneClassName?: string
  helper: string
}) {
  const completionPercent = total === 0 ? 0 : Math.round((completed / total) * 100)
  const openNonOverdue = Math.max(0, open - overdue)

  return (
    <div className="planning-distribution-row">
      <div className="planning-distribution-heading">
        <div className="planning-distribution-title">
          <strong className={toneClassName}>{label}</strong>
          <span>{helper}</span>
        </div>
        <div className="planning-distribution-metrics">
          <span className="planning-distribution-chip">{total} total</span>
          <span className="planning-distribution-chip planning-distribution-chip-success">{completed} completed</span>
          <span className="planning-distribution-chip planning-distribution-chip-open">{open} open</span>
          <span className="planning-distribution-chip planning-distribution-chip-danger">{overdue} overdue</span>
          <strong>{completionPercent}% complete</strong>
        </div>
      </div>
      <div className="planning-distribution-track" aria-label={`${label} completion distribution`}>
        <span className="planning-distribution-segment planning-distribution-segment-success" style={{ width: `${total ? (completed / total) * 100 : 0}%` }} />
        <span className="planning-distribution-segment planning-distribution-segment-open" style={{ width: `${total ? (openNonOverdue / total) * 100 : 0}%` }} />
        <span className="planning-distribution-segment planning-distribution-segment-danger" style={{ width: `${total ? (overdue / total) * 100 : 0}%` }} />
      </div>
    </div>
  )
}

export default function PlanningReportsPage() {
  const { planningRecords } = useAuditLibrary()
  const currentYear = new Date().getFullYear()
  const currentYearPlans = planningRecords.filter((record) => record.year === currentYear)
  const currentYearSummary = summarizePlans(currentYearPlans)
  const upcoming30 = getUpcomingPlanningRecords(planningRecords, 30)
  const upcoming60 = getUpcomingPlanningRecords(planningRecords, 60)
  const upcoming90 = getUpcomingPlanningRecords(planningRecords, 90)
  const overduePlans = getOverduePlanningRecords(planningRecords)
  const byStandard = buildAggregateRows(planningRecords, (record) => record.standard)
  const byClassification = buildAggregateRows(planningRecords, (record) => record.internalExternal)
  const byDepartment = buildAggregateRows(planningRecords, (record) => `${record.department} / ${record.processArea}`)

  return (
    <div className="module-page planning-page">
      <PageHeader
        eyebrow="Planning reports"
        title="Planning analysis"
        subtitle="Compact analysis views for planned versus completed delivery, overdue items, and portfolio distribution by standard, classification, and department."
      />

      <div className="metrics-grid planning-metrics-grid">
        <MetricCard label={`${currentYear} planned`} value={currentYearSummary.total} />
        <MetricCard label={`${currentYear} completed`} value={currentYearSummary.completed} tone="success" />
        <MetricCard label="Open" value={currentYearSummary.planned + currentYearSummary.inProgress + currentYearSummary.overdue} tone="warning" />
        <MetricCard label="Overdue" value={overduePlans.length} tone={overduePlans.length > 0 ? 'danger' : 'success'} />
      </div>

      <div className="grid grid-panels">
        <Panel title="Upcoming horizon" description="Planning demand in the next 30, 60, and 90 days.">
          <div className="summary-grid">
            <HorizonCard label="Next 30 days" count={upcoming30.length} />
            <HorizonCard label="Next 60 days" count={upcoming60.length} />
            <HorizonCard label="Next 90 days" count={upcoming90.length} />
          </div>
        </Panel>

        <Panel title="Overdue attention" description="Items requiring replanning, escalation, or immediate closure action.">
          <ul className="report-summary-list planning-list">
            {overduePlans.length ? overduePlans.slice(0, 8).map((record) => (
              <li key={record.id}>
                <div>
                  <strong>{record.title}</strong>
                  <p>{record.department} · planned end {formatDate(record.plannedEnd)}</p>
                </div>
                <StatusBadge value={getDerivedPlanStatus(record)} />
              </li>
            )) : (
              <li>
                <div>
                  <strong>No overdue items</strong>
                  <p>The plan is currently on track.</p>
                </div>
                <StatusBadge value="Completed" />
              </li>
            )}
          </ul>
        </Panel>
      </div>

      <div className="grid grid-panels">
        <Panel title="By audit standard" description="Distribution of plan load and completion by standard.">
          <div className="planning-report-list">
            {byStandard.map((row) => (
              <PlanningDistributionRow
                key={row.label}
                {...row}
                helper="Planned audits grouped by standard"
                toneClassName={`planning-distribution-standard ${getStandardColorClass(row.label)}`}
              />
            ))}
          </div>
        </Panel>

        <Panel title="By internal vs external" description="Programme mix by assurance relationship.">
          <div className="planning-report-list">
            {byClassification.map((row) => (
              <PlanningDistributionRow
                key={row.label}
                {...row}
                helper="Assurance relationship split"
              />
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="By department / process" description="Where the current planning load sits operationally.">
        <div className="table-card planning-table-card">
          <table>
            <thead>
              <tr>
                <th>Department / process</th>
                <th>Total</th>
                <th>Completed</th>
                <th>Open</th>
                <th>Overdue</th>
              </tr>
            </thead>
            <tbody>
              {byDepartment.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td>{row.total}</td>
                  <td>{row.completed}</td>
                  <td>{row.open}</td>
                  <td>{row.overdue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}
