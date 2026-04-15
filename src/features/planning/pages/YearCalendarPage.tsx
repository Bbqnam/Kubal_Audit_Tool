import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Panel } from '../../../components/ui'
import { ButtonLabel } from '../../../components/icons'
import { planningStatusFilterOptions } from '../../../config/domain/statuses'
import { useAuditLibrary } from '../../shared/context/useAuditLibrary'
import { auditPlanningStandardOptions } from '../data/planningSeed'
import PlanningActivityFeed from '../components/PlanningActivityFeed'
import PlanningPageHeader from '../components/PlanningPageHeader'
import PlanningMonthCalendar from '../components/PlanningMonthCalendar'
import PlanningCompletionModal from '../components/PlanningCompletionModal'
import PlanningHistoryModal from '../components/PlanningHistoryModal'
import PlanningRecordModal, { type PlanningEditorDraft } from '../components/PlanningRecordModal'
import { getDerivedPlanStatus, getMonthDateRange, getPlanningDepartmentOptions, getPlanningLegendEntries, planningMonthLabels, summarizePlans } from '../services/planningUtils'
import { updatePlanWithHistory } from '../services/planningFactory'
import type { AuditPlanCompletionResult, AuditPlanRecord } from '../../../types/planning'
import { getAuditReportPath } from '../../../data/navigation'

type CalendarEditorState =
  | { mode: 'create'; defaultStartDate?: string }
  | { mode: 'edit'; recordId: string }

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function parseRequestedMonth(value: string | null, fallbackMonth: number) {
  const parsedValue = Number(value)

  if (!Number.isFinite(parsedValue)) {
    return fallbackMonth
  }

  return parsedValue >= 1 && parsedValue <= 12 ? Math.trunc(parsedValue) : fallbackMonth
}

function parseRequestedYear(value: string | null, fallbackYear: number, availableYears: number[]) {
  const parsedValue = Number(value)

  if (!Number.isFinite(parsedValue)) {
    return fallbackYear
  }

  const normalizedYear = Math.trunc(parsedValue)
  return availableYears.includes(normalizedYear) ? normalizedYear : fallbackYear
}

function startOfDay(date: Date) {
  const clone = new Date(date)
  clone.setHours(0, 0, 0, 0)
  return clone
}

function getCalendarDashboardStatus(record: AuditPlanRecord, referenceDate = new Date()) {
  const derivedStatus = getDerivedPlanStatus(record, referenceDate)

  if (derivedStatus === 'Completed' || derivedStatus === 'In progress' || derivedStatus === 'Overdue' || derivedStatus === 'Cancelled') {
    return derivedStatus
  }

  const startsInDays = Math.round((startOfDay(new Date(record.plannedStart)).getTime() - startOfDay(referenceDate).getTime()) / 86_400_000)
  return startsInDays <= 30 ? 'Upcoming' : 'Planned'
}

export default function YearCalendarPage() {
  const navigate = useNavigate()
  const {
    planningRecords,
    planningYears,
    planningActivityLog,
    activePlanningUser,
    audits,
    createAuditFromPlan,
    createPlanRecord,
    deletePlanRecord,
    getAuditById,
    getPlanById,
    updatePlanRecord,
  } = useAuditLibrary()
  const [searchParams, setSearchParams] = useSearchParams()
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const fallbackYear = planningYears.includes(currentYear) ? currentYear : planningYears[planningYears.length - 1] ?? currentYear
  const resolvedYear = parseRequestedYear(searchParams.get('year'), fallbackYear, planningYears)
  const resolvedMonth = parseRequestedMonth(searchParams.get('month'), currentDate.getMonth() + 1)
  const statusFilter = searchParams.get('status') ?? 'all'
  const [editorState, setEditorState] = useState<CalendarEditorState | null>(null)
  const [completionRecordId, setCompletionRecordId] = useState<string | null>(null)
  const [historyRecordId, setHistoryRecordId] = useState<string | null>(null)
  const departmentOptions = getPlanningDepartmentOptions(planningRecords)
  const focusedRecordId = searchParams.get('record')
  const focusedRecord = focusedRecordId ? getPlanById(focusedRecordId) ?? null : null
  const selectedYear = focusedRecord ? focusedRecord.year : resolvedYear
  const selectedMonth = focusedRecord ? focusedRecord.month : resolvedMonth
  const { firstDay: selectedMonthStart, lastDay: selectedMonthEnd } = getMonthDateRange(selectedYear, selectedMonth)
  const selectedMonthRecords = planningRecords
    .filter((record) => record.plannedStart <= selectedMonthEnd.toISOString().slice(0, 10) && record.plannedEnd >= selectedMonthStart.toISOString().slice(0, 10))
    .filter((record) => (statusFilter === 'all' ? true : getCalendarDashboardStatus(record, currentDate) === statusFilter))
    .sort((left, right) => left.plannedStart.localeCompare(right.plannedStart) || left.title.localeCompare(right.title))
  const visibleLegendEntries = getPlanningLegendEntries(selectedMonthRecords)
  const firstActionablePlan = selectedMonthRecords.find((record) => {
    const status = getDerivedPlanStatus(record)
    return status !== 'Completed' && status !== 'Cancelled'
  })
  const editorRecord = editorState?.mode === 'edit' ? getPlanById(editorState.recordId) ?? null : null
  const completionRecord = completionRecordId ? getPlanById(completionRecordId) ?? null : null
  const historyRecord = historyRecordId ? getPlanById(historyRecordId) ?? null : null
  const selectedPeriodLabel = `${planningMonthLabels[selectedMonth - 1]} ${selectedYear}`
  const selectedMonthSummary = summarizePlans(selectedMonthRecords)
  const visibleActivityEntries = planningActivityLog
    .filter((entry) => entry.year === selectedYear || selectedMonthRecords.some((record) => record.id === entry.recordId))
    .slice(0, 8)
  const searchParamString = searchParams.toString()
  const focusedRecordNeedsReframe = Boolean(
    focusedRecordId
    && focusedRecord
    && (focusedRecord.year !== selectedYear || focusedRecord.month !== selectedMonth),
  )

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('year', String(selectedYear))
    nextParams.set('month', String(selectedMonth))

    if (focusedRecordId && (focusedRecordNeedsReframe || !selectedMonthRecords.some((record) => record.id === focusedRecordId))) {
      nextParams.delete('record')
    }

    if (nextParams.toString() !== searchParamString) {
      setSearchParams(nextParams, { replace: true })
    }
  }, [focusedRecordId, focusedRecordNeedsReframe, searchParamString, searchParams, selectedMonth, selectedMonthRecords, selectedYear, setSearchParams])

  function buildMonthStartDate(month = selectedMonth) {
    return `${selectedYear}-${String(month).padStart(2, '0')}-01`
  }

  function updateCalendarParams(nextMonth: number, nextRecordId?: string | null) {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('year', String(selectedYear))
    nextParams.set('month', String(nextMonth))

    if (nextRecordId) {
      nextParams.set('record', nextRecordId)
    } else {
      nextParams.delete('record')
    }

    setSearchParams(nextParams, { replace: true })
  }

  function handleEditorSave(draft: PlanningEditorDraft) {
    if (!editorState) return

    if (editorState.mode === 'create') {
      createPlanRecord({ ...draft })
      setEditorState(null)
      return
    }

    if (!editorRecord) return

    const hasScheduleChange = editorRecord.plannedStart !== draft.plannedStart || editorRecord.plannedEnd !== draft.plannedEnd
    const isCancellation = draft.status === 'Cancelled' && editorRecord.status !== 'Cancelled'
    const nextUpdates = {
      title: draft.title,
      standard: draft.standard,
      auditType: draft.auditType,
      auditCategory: draft.auditCategory,
      internalExternal: draft.internalExternal,
      department: draft.department,
      processArea: draft.processArea,
      site: draft.site,
      owner: draft.owner,
      plannedStart: draft.plannedStart,
      plannedEnd: draft.plannedEnd,
      frequency: draft.frequency,
      status: draft.status,
      notes: draft.notes,
      linkedAuditId: draft.linkedAuditId,
      source: draft.source,
    }

    updatePlanRecord(editorRecord.id, (record) => {
      if (isCancellation) {
        return updatePlanWithHistory(
          record,
          nextUpdates,
          'Cancelled',
          `Cancelled ${record.title} in the yearly calendar.`,
          activePlanningUser,
        )
      }

      if (hasScheduleChange) {
        return updatePlanWithHistory(
          record,
          nextUpdates,
          'Rescheduled',
          `Rescheduled ${record.title} from ${editorRecord.plannedStart} - ${editorRecord.plannedEnd} to ${draft.plannedStart} - ${draft.plannedEnd}.`,
          activePlanningUser,
        )
      }

      return {
        ...record,
        ...nextUpdates,
      }
    })
    setEditorState(null)
  }

  function handleCompletionSave(payload: {
    actualCompletionDate: string
    completionDateChangeReason: string
    completionResult: AuditPlanCompletionResult
    completionSummary: string
    linkedAuditId: string | null
  }) {
    if (!completionRecord) return

    const completionChanged = payload.actualCompletionDate !== completionRecord.plannedEnd
    const completionSummary = payload.completionDateChangeReason
      ? payload.completionSummary
        ? `${payload.completionSummary}\n\nCompletion date change reason: ${payload.completionDateChangeReason}`
        : `Completion date change reason: ${payload.completionDateChangeReason}`
      : payload.completionSummary
    const historySummary = completionChanged
      ? `Calendar completion saved for ${completionRecord.title}. Completed ${payload.actualCompletionDate} instead of planned end ${completionRecord.plannedEnd}. Reason: ${payload.completionDateChangeReason}.`
      : `Calendar completion saved for ${completionRecord.title} on the planned completion date ${payload.actualCompletionDate}.`

    updatePlanRecord(completionRecord.id, (record) =>
      updatePlanWithHistory(
        record,
        {
          status: 'Completed',
          actualCompletionDate: payload.actualCompletionDate,
          completionDateChangeReason: payload.completionDateChangeReason,
          completionResult: payload.completionResult,
          completionSummary,
          linkedAuditId: payload.linkedAuditId,
        },
        'Completed',
        historySummary,
        activePlanningUser,
      ),
    )
    setCompletionRecordId(null)
  }

  function handleDelete(recordId: string) {
    const record = getPlanById(recordId)
    if (!record) return
    const confirmed = window.confirm(`Delete planned audit "${record.title}"? This removes it from the plan.`)
    if (!confirmed) return
    deletePlanRecord(recordId)
    setEditorState(null)
    setCompletionRecordId((current) => (current === recordId ? null : current))
    setHistoryRecordId((current) => (current === recordId ? null : current))
  }

  function handleOpenReport(recordId: string) {
    const record = getPlanById(recordId)

    if (!record) {
      return
    }

    const linkedAudit = record.linkedAuditId ? getAuditById(record.linkedAuditId) ?? null : null

    if (linkedAudit) {
      navigate(getAuditReportPath(linkedAudit))
      return
    }

    const createdAudit = createAuditFromPlan(recordId)

    if (createdAudit) {
      navigate(getAuditReportPath(createdAudit))
    }
  }

  return (
    <div className="module-page planning-page">
      <PlanningPageHeader
        title="Year calendar"
        subtitle="Work from the month view, keep actions close to the schedule, and track only the changes that matter."
      />

      <div className="calendar-pill-nav planning-calendar-strip">
        <div className="calendar-pill-row planning-calendar-strip-row">
          <span className="calendar-pill-label">Month</span>
          <div className="calendar-pill-group calendar-pill-group-months">
            {MONTH_SHORT.map((label, index) => {
              const monthNum = index + 1
              const isCurrentMonth = selectedYear === currentDate.getFullYear() && monthNum === currentDate.getMonth() + 1
              const hasRecords = planningRecords.some(
                (r) => r.year === selectedYear && r.month === monthNum
              )
              return (
                <button
                  key={label}
                  type="button"
                  className={`calendar-pill ${monthNum === selectedMonth ? 'calendar-pill-active' : ''} ${hasRecords ? 'calendar-pill-has-data' : ''} ${isCurrentMonth ? 'calendar-pill-current' : ''}`}
                  onClick={() => updateCalendarParams(monthNum)}
                >
                  {label}
                </button>
              )
            })}
          </div>
          <div className="planning-calendar-strip-side">
            <div className="planning-calendar-stat-chips">
              <span className="planning-calendar-stat-chip">
                <strong>{selectedMonthSummary.total}</strong>
                <span>Scheduled</span>
              </span>
              <span className="planning-calendar-stat-chip planning-calendar-stat-chip-success">
                <strong>{selectedMonthSummary.completed}</strong>
                <span>Completed</span>
              </span>
              <span className="planning-calendar-stat-chip planning-calendar-stat-chip-warning">
                <strong>{selectedMonthSummary.inProgress}</strong>
                <span>In progress</span>
              </span>
              <span className="planning-calendar-stat-chip planning-calendar-stat-chip-danger">
                <strong>{selectedMonthSummary.overdue}</strong>
                <span>Delayed</span>
              </span>
            </div>
            <div className="planning-calendar-strip-actions">
              {statusFilter !== 'all' ? (
                <button
                  type="button"
                  className="button button-secondary button-small planning-inline-action"
                  onClick={() => {
                    const nextParams = new URLSearchParams(searchParams)
                    nextParams.delete('status')
                    setSearchParams(nextParams, { replace: true })
                  }}
                >
                  <ButtonLabel icon="close" label={`Clear ${planningStatusFilterOptions.find((option) => option.value === statusFilter)?.label ?? 'filter'}`} />
                </button>
              ) : null}
              {focusedRecord ? (
                <button type="button" className="button button-secondary button-small planning-inline-action" onClick={() => setHistoryRecordId(focusedRecord.id)}>
                  <ButtonLabel icon="history" label="History" />
                </button>
              ) : null}
              <button type="button" className="button button-secondary button-small planning-inline-action" onClick={() => setEditorState({ mode: 'create', defaultStartDate: buildMonthStartDate() })}>
                <ButtonLabel icon="add" label="Quick create" />
              </button>
              <button type="button" className="button button-primary button-small planning-inline-action planning-inline-action-primary" onClick={() => setCompletionRecordId(firstActionablePlan?.id ?? null)} disabled={!firstActionablePlan}>
                <ButtonLabel icon="complete" label="Mark completed" />
              </button>
            </div>
          </div>
        </div>
        <div className="calendar-pill-meta">
          <strong>{selectedPeriodLabel}</strong>
          <span>
            {selectedMonthRecords.length} audits in view
            {focusedRecord ? ` · focused on ${focusedRecord.title}` : ''}
          </span>
        </div>
      </div>

      <Panel className="planning-calendar-panel" bodyClassName="planning-calendar-panel-body">
        {visibleLegendEntries.length ? (
          <div className="planning-calendar-legend">
            {visibleLegendEntries.map((entry) => (
              <span key={entry.key} className={`planning-legend-chip ${entry.className}`}>{entry.label}</span>
            ))}
          </div>
        ) : null}
        <PlanningMonthCalendar
          records={selectedMonthRecords}
          year={selectedYear}
          month={selectedMonth}
          focusedRecordId={focusedRecordId}
          onSelectDay={(date) => setEditorState({ mode: 'create', defaultStartDate: date })}
          onSelectRecord={(recordId) => {
            updateCalendarParams(selectedMonth, recordId)
            setEditorState({ mode: 'edit', recordId })
          }}
          onCompleteRecord={(recordId) => setCompletionRecordId(recordId)}
          onOpenReport={handleOpenReport}
        />
      </Panel>

      <Panel
        title="Tracking log"
        description="Only major planning actions are recorded here so the timeline stays useful."
      >
        <PlanningActivityFeed
          entries={visibleActivityEntries}
          emptyMessage="Complete, delete, reschedule, link, or yearly checklist updates to start building the planning log."
        />
      </Panel>

      {editorState ? (
        <PlanningRecordModal
          key={editorState.mode === 'create' ? `calendar-create-${editorState.defaultStartDate ?? 'default'}` : `calendar-edit-${editorState.recordId}`}
          mode={editorState.mode}
          initialRecord={editorRecord}
          departmentOptions={departmentOptions}
          defaultStartDate={'defaultStartDate' in editorState ? editorState.defaultStartDate : undefined}
          standardOptions={auditPlanningStandardOptions}
          onClose={() => setEditorState(null)}
          onDelete={editorState.mode === 'edit' ? () => handleDelete(editorState.recordId) : undefined}
          onSave={handleEditorSave}
        />
      ) : null}

      {completionRecord ? (
        <PlanningCompletionModal
          key={`calendar-complete-${completionRecord.id}-${completionRecord.updatedAt}`}
          record={completionRecord}
          audits={audits}
          onClose={() => setCompletionRecordId(null)}
          onSave={handleCompletionSave}
        />
      ) : null}

      {historyRecord ? <PlanningHistoryModal record={historyRecord} onClose={() => setHistoryRecordId(null)} /> : null}
    </div>
  )
}
