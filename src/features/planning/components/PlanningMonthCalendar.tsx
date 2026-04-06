import { StatusBadge } from '../../../components/ui'
import type { AuditPlanRecord } from '../../../types/planning'
import {
  buildPlanningCalendarWeeks,
  getDerivedPlanStatus,
  getPlanColorClass,
  getPlanWindowLabel,
  getStatusAccentClass,
  planningWeekdayLabels,
} from '../services/planningUtils'

export default function PlanningMonthCalendar({
  records,
  year,
  month,
  onSelectDay,
  onSelectRecord,
}: {
  records: AuditPlanRecord[]
  year: number
  month: number
  onSelectDay: (date: string) => void
  onSelectRecord: (recordId: string) => void
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
                className={`planning-day-cell ${day.isCurrentMonth ? '' : 'planning-day-cell-muted'} ${day.isWeekend ? 'planning-day-cell-weekend' : ''} ${day.holidayLabel ? 'planning-day-cell-holiday' : ''}`}
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
                    <span>{day.dateNumber}</span>
                    {day.holidayLabel ? <em>{day.holidayLabel}</em> : null}
                  </div>
                  {day.records.length ? <small>{day.records.length}</small> : null}
                </div>
                <div className="planning-day-cell-events">
                  {day.records.slice(0, 4).map((record) => {
                    const status = getDerivedPlanStatus(record)

                    return (
                      <button
                        key={`${record.id}-${day.isoDate}`}
                        type="button"
                        className={`planning-calendar-event ${getPlanColorClass(record)} ${getStatusAccentClass(status)}`}
                        onClick={(event) => {
                          event.stopPropagation()
                          onSelectRecord(record.id)
                        }}
                      >
                        <strong>{record.title}</strong>
                        <div className="planning-calendar-event-meta">
                          <span>{record.owner}</span>
                          <StatusBadge value={status} />
                        </div>
                        <span>{getPlanWindowLabel(record)}</span>
                      </button>
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
