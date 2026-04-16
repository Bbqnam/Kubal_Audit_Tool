import { StatusBadge } from '../../../components/ui'
import { ButtonLabel } from '../../../components/icons'
import type { AuditPlanRecord } from '../../../types/planning'
import {
  buildPlanningCalendarWeeks,
  getDerivedPlanStatus,
  getPlanColorClass,
  getPlanExecutionAuditType,
  getStatusAccentClass,
  planningWeekdayLabels,
} from '../services/planningUtils'

export default function PlanningMonthCalendar({
  records,
  year,
  month,
  focusedRecordId,
  onSelectDay,
  onSelectRecord,
  onCompleteRecord,
  onOpenReport,
}: {
  records: AuditPlanRecord[]
  year: number
  month: number
  focusedRecordId?: string | null
  onSelectDay: (date: string) => void
  onSelectRecord: (recordId: string) => void
  onCompleteRecord?: (recordId: string) => void
  onOpenReport?: (recordId: string) => void
}) {
  const weeks = buildPlanningCalendarWeeks(records, year, month)

  return (
    <div className="planning-month-calendar">
      <div className="planning-month-calendar-head">
        {planningWeekdayLabels.map((label, index) => (
          <div
            key={label}
            className={`planning-month-calendar-head-cell ${index >= 5 ? 'planning-month-calendar-head-cell-weekend' : ''}`}
          >
            {label}
          </div>
        ))}
      </div>
      <div className="planning-month-calendar-body">
        {weeks.map((week, weekIndex) => (
          <div key={`${year}-${month}-week-${weekIndex + 1}`} className="planning-month-calendar-row">
            {week.map((day) => (
              <div
                key={day.isoDate}
                role="button"
                tabIndex={0}
                className={`planning-day-cell ${day.isCurrentMonth ? '' : 'planning-day-cell-muted'} ${day.isWeekend ? 'planning-day-cell-weekend' : ''} ${day.holidayLabel ? 'planning-day-cell-holiday' : ''} ${day.isToday ? 'planning-day-cell-today' : ''} ${!day.records.length ? 'planning-day-cell-empty' : ''} ${day.records.some((record) => record.id === focusedRecordId) ? 'planning-day-cell-focused' : ''}`}
                onClick={() => onSelectDay(day.isoDate)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onSelectDay(day.isoDate)
                  }
                }}
              >
                <div className="planning-day-cell-header">
                  <div className="planning-day-cell-title">
                    <span className={day.isToday ? 'planning-day-cell-date-today' : ''}>{day.dateNumber}</span>
                    {day.holidayLabel ? <em>{day.holidayLabel}</em> : null}
                  </div>
                  {day.isToday ? <small className="planning-day-cell-today-badge">Today</small> : day.records.length ? <small>{day.records.length}</small> : null}
                </div>
                <div className="planning-day-cell-events">
                  {day.records.slice(0, 2).map((record) => {
                    const status = getDerivedPlanStatus(record)
                    const canOpenReport = !!onOpenReport && (Boolean(record.linkedAuditId) || Boolean(getPlanExecutionAuditType(record)))
                    const canComplete = status !== 'Completed' && status !== 'Cancelled' && !!onCompleteRecord
                    const recordMeta = [record.owner].filter(Boolean).join(' • ')

                    return (
                      <div
                        key={`${record.id}-${day.isoDate}`}
                        role="button"
                        tabIndex={0}
                        className={`planning-calendar-event ${getPlanColorClass(record)} ${getStatusAccentClass(status)} ${record.id === focusedRecordId ? 'planning-calendar-event-focused' : ''}`}
                        onClick={(event) => {
                          event.stopPropagation()
                          onSelectRecord(record.id)
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            event.stopPropagation()
                            onSelectRecord(record.id)
                          }
                        }}
                      >
                        <div className="planning-calendar-event-header">
                          <div className="planning-calendar-event-title-block">
                            <span className="planning-calendar-event-kicker">{record.standard}</span>
                            <strong>{record.title}</strong>
                          </div>
                          <StatusBadge value={status} />
                        </div>
                        <div className="planning-calendar-event-footer">
                          <span className="planning-calendar-event-caption">{recordMeta}</span>
                          {canComplete ? (
                            <div className="planning-calendar-event-actions">
                              {canOpenReport ? (
                                <button
                                  type="button"
                                  className="planning-calendar-event-action"
                                  aria-label={record.linkedAuditId ? `Open linked audit report for ${record.title}` : `Create audit report for ${record.title}`}
                                  title={record.linkedAuditId ? 'Open linked audit report' : 'Create audit report'}
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    onOpenReport(record.id)
                                  }}
                                >
                                  <ButtonLabel icon={record.linkedAuditId ? 'open' : 'add'} label={record.linkedAuditId ? 'Report' : 'Create'} />
                                </button>
                              ) : null}
                              <button
                                type="button"
                                className="planning-calendar-event-complete"
                                aria-label={`Mark ${record.title} as completed`}
                                title="Mark completed"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  onCompleteRecord(record.id)
                                }}
                              >
                                <ButtonLabel icon="complete" label="Done" />
                              </button>
                            </div>
                          ) : canOpenReport ? (
                            <div className="planning-calendar-event-actions">
                              <button
                                type="button"
                                className="planning-calendar-event-action"
                                aria-label={record.linkedAuditId ? `Open linked audit report for ${record.title}` : `Create audit report for ${record.title}`}
                                title={record.linkedAuditId ? 'Open linked audit report' : 'Create audit report'}
                                onClick={(event) => {
                                  event.stopPropagation()
                                  onOpenReport(record.id)
                                }}
                              >
                                <ButtonLabel icon={record.linkedAuditId ? 'open' : 'add'} label={record.linkedAuditId ? 'Report' : 'Create'} />
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    )
                  })}
                  {day.records.length > 2 ? <div className="planning-calendar-more">+{day.records.length - 2} more</div> : null}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
