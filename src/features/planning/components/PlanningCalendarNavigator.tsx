import { getPlanMonthLabel, planningMonthLabels } from '../services/planningUtils'
import { ButtonLabel } from '../../../components/icons'

type PlanningCalendarNavigatorProps = {
  month: number
  year: number
  years: number[]
  count: number
  onPrevious: () => void
  onNext: () => void
  onMonthChange: (month: number) => void
  onYearChange: (year: number) => void
}

export default function PlanningCalendarNavigator({
  month,
  year,
  years,
  count,
  onPrevious,
  onNext,
  onMonthChange,
  onYearChange,
}: PlanningCalendarNavigatorProps) {
  return (
    <div className="planning-calendar-hero">
      <button type="button" className="button button-secondary planning-calendar-hero-button" onClick={onPrevious}>
        <ButtonLabel icon="back" label="Previous" />
      </button>
      <div className="planning-calendar-hero-main">
        <div className="planning-calendar-hero-picker">
          <select
            aria-label="Select month"
            className="planning-calendar-hero-select planning-calendar-hero-select-month"
            value={month}
            onChange={(event) => onMonthChange(Number(event.target.value))}
          >
            {planningMonthLabels.map((label, index) => (
              <option key={label} value={index + 1}>{label}</option>
            ))}
          </select>
          <select
            aria-label="Select year"
            className="planning-calendar-hero-select planning-calendar-hero-select-year"
            value={year}
            onChange={(event) => onYearChange(Number(event.target.value))}
          >
            {years.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
        <strong>{getPlanMonthLabel(month)} {year}</strong>
        <span>{count} audits in view</span>
      </div>
      <button type="button" className="button button-secondary planning-calendar-hero-button" onClick={onNext}>
        <ButtonLabel icon="next" label="Next" />
      </button>
    </div>
  )
}
