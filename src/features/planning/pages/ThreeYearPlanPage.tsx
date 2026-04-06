import { AuditTypeBadge, MetricCard, PageHeader, Panel, StatusBadge } from '../../../components/ui'
import { useAuditLibrary } from '../../shared/context/useAuditLibrary'
import { getDerivedPlanStatus, getPlanningYears, getPlanWindowLabel, groupPlansByStandard, summarizePlans } from '../services/planningUtils'

export default function ThreeYearPlanPage() {
  const { planningRecords } = useAuditLibrary()
  const years = getPlanningYears(planningRecords)
  const groupedByStandard = groupPlansByStandard(planningRecords)
  const recurringStandards = groupedByStandard
    .map((group) => ({
      label: group.label,
      years: [...new Set(group.records.map((record) => record.year))].sort((left, right) => left - right),
      departments: [...new Set(group.records.map((record) => record.department))],
      count: group.records.length,
    }))
    .sort((left, right) => right.years.length - left.years.length || right.count - left.count)

  return (
    <div className="module-page planning-page">
      <PageHeader
        eyebrow="Planning module"
        title="3-year audit plan"
        subtitle="Strategic coverage matrix for recurring standards, departments, and planned windows across the rolling programme."
      />

      <div className="metrics-grid planning-metrics-grid">
        {years.map((year) => {
          const summary = summarizePlans(planningRecords.filter((record) => record.year === year))

          return (
            <MetricCard
              key={year}
              label={String(year)}
              value={`${summary.total} windows`}
              tone={summary.overdue > 0 ? 'warning' : 'default'}
            />
          )
        })}
      </div>

      <Panel title="Coverage matrix" description="Read each lane from left to right to understand long-term coverage by standard and stream.">
        <div className="planning-roadmap">
          <div className="planning-roadmap-header">
            <div>Standard / stream</div>
            {years.map((year) => (
              <div key={year}>{year}</div>
            ))}
          </div>
          {groupedByStandard.map((group) => (
            <div key={group.label} className="planning-roadmap-row">
              <div className="planning-roadmap-label">
                <strong>{group.label}</strong>
                <span>{group.records[0]?.auditCategory} · {group.records[0]?.department}</span>
              </div>
              {years.map((year) => {
                const yearRecords = group.records.filter((record) => record.year === year)

                return (
                  <div key={year} className="planning-roadmap-cell">
                    {yearRecords.length ? yearRecords.map((record) => (
                      <div key={record.id} className="planning-roadmap-chip">
                        <div className="planning-roadmap-chip-top">
                          <strong>{getPlanWindowLabel(record)}</strong>
                          <StatusBadge value={getDerivedPlanStatus(record)} />
                        </div>
                        <AuditTypeBadge label={record.auditType} size="small" />
                      </div>
                    )) : (
                      <span className="planning-subtle-text">No window</span>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Recurring coverage" description="Standards and streams repeated across the programme horizon.">
        <div className="planning-strategy-grid">
          {recurringStandards.map((item) => (
            <article key={item.label} className="planning-strategy-card">
              <div className="planning-strategy-card-header">
                <strong>{item.label}</strong>
                <span>{item.count} windows</span>
              </div>
              <div className="planning-pill-stack">
                {item.years.map((year) => (
                  <span key={year} className="planning-pill planning-pill-neutral">{year}</span>
                ))}
              </div>
              <p>{item.departments.join(', ')}</p>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  )
}
