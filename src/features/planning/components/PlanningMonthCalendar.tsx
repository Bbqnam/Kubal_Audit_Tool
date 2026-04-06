import { StatusBadge } from '../../../components/ui'
import { ButtonLabel } from '../../../components/icons'
import type { AuditPlanRecord } from '../../../types/planning'
import {
  buildPlanningCalendarWeeks,
  getDerivedPlanStatus,
  getPlanColorClass,
  getPlanExecutionAuditType,
  getPlanWindowLabel,
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
                className={`planning-day-cell ${day.isCurrentMonth ? '' : 'planning-day-cell-muted'} ${day.isWeekend ? 'planning-day-cell-weekend' : ''} ${day.holidayLabel ? 'planning-day-cell-holiday' : ''} ${day.isToday ? 'planning-day-cell-today' : ''} ${day.records.some((record) => record.id === focusedRecordId) ? 'planning-day-cell-focused' : ''}`}
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
                  {day.records.slice(0, 4).map((record) => {
                    const status = getDerivedPlanStatus(record)
                    const canOpenReport = !!onOpenReport && (Boolean(record.linkedAuditId) || Boolean(getPlanExecutionAuditType(record)))
                    const canComplete = status !== 'Completed' && status !== 'Cancelled' && !!onCompleteRecord

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
                        <strong>{record.title}</strong>
                        <div className="planning-calendar-event-meta">
                          <span>{record.owner}</span>
                          <StatusBadge value={status} />
                        </div>
                        <span>{getPlanWindowLabel(record)}</span>
                        {canComplete ? (
                          <div className="planning-calendar-event-actions">
                            {canOpenReport ? (
                              <button
                                type="button"
                                className="planning-calendar-event-action"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  onOpenReport(record.id)
                                }}
                              >
                                <ButtonLabel icon={record.linkedAuditId ? 'open' : 'add'} label={record.linkedAuditId ? 'Open report' : 'Create report'} />
                              </button>
                            ) : null}
                            <button
                              type="button"
                              className="planning-calendar-event-complete"
                              onClick={(event) => {
                                event.stopPropagation()
                                onCompleteRecord(record.id)
                              }}
                            >
                              <ButtonLabel icon="complete" label="Mark completed" />
                            </button>
                          </div>
                        ) : canOpenReport ? (
                          <div className="planning-calendar-event-actions">
                            <button
                              type="button"
                              className="planning-calendar-event-action"
                              onClick={(event) => {
                                event.stopPropagation()
                                onOpenReport(record.id)
                              }}
                            >
                              <ButtonLabel icon={record.linkedAuditId ? 'open' : 'add'} label={record.linkedAuditId ? 'Open report' : 'Create report'} />
                            </button>
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                  {day.records.length > 4 ? <div className="planning-calendar-more">+{day.records.length - 4} more</div> : null}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
