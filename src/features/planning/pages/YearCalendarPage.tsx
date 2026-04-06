import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader, Panel } from '../../../components/ui'
import { ButtonLabel } from '../../../components/icons'
import { useAuditLibrary } from '../../shared/context/useAuditLibrary'
import { auditPlanningStandardOptions } from '../data/planningSeed'
import PlanningMonthCalendar from '../components/PlanningMonthCalendar'
import PlanningCompletionModal from '../components/PlanningCompletionModal'
import PlanningHistoryModal from '../components/PlanningHistoryModal'
import PlanningRecordModal, { type PlanningEditorDraft } from '../components/PlanningRecordModal'
import { getDerivedPlanStatus, getMonthDateRange, getPlanningDepartmentOptions, getPlanningLegendEntries, planningMonthLabels } from '../services/planningUtils'
import { updatePlanWithHistory } from '../services/planningFactory'
import type { AuditPlanCompletionResult } from '../../../types/planning'
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

export default function YearCalendarPage() {
  const navigate = useNavigate()
  const { planningRecords, audits, createAuditFromPlan, createPlanRecord, deletePlanRecord, getAuditById, getPlanById, updatePlanRecord } = useAuditLibrary()
  const [searchParams, setSearchParams] = useSearchParams()
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const resolvedMonth = parseRequestedMonth(searchParams.get('month'), currentDate.getMonth() + 1)
  const [editorState, setEditorState] = useState<CalendarEditorState | null>(null)
  const [completionRecordId, setCompletionRecordId] = useState<string | null>(null)
  const [historyRecordId, setHistoryRecordId] = useState<string | null>(null)
  const departmentOptions = getPlanningDepartmentOptions(planningRecords)
  const focusedRecordId = searchParams.get('record')
  const focusedRecord = focusedRecordId ? getPlanById(focusedRecordId) ?? null : null
  const selectedYear = currentYear
  const selectedMonth = focusedRecord && focusedRecord.year === currentYear ? focusedRecord.month : resolvedMonth
  const { firstDay: selectedMonthStart, lastDay: selectedMonthEnd } = getMonthDateRange(selectedYear, selectedMonth)
  const selectedMonthRecords = planningRecords
    .filter((record) => record.plannedStart <= selectedMonthEnd.toISOString().slice(0, 10) && record.plannedEnd >= selectedMonthStart.toISOString().slice(0, 10))
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
  const searchParamString = searchParams.toString()
  const focusedRecordNeedsReframe = Boolean(
    focusedRecordId
    && focusedRecord
    && (focusedRecord.year !== currentYear || focusedRecord.month !== selectedMonth),
  )

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('month', String(selectedMonth))
    nextParams.delete('year')

    if (focusedRecordId && (focusedRecordNeedsReframe || !selectedMonthRecords.some((record) => record.id === focusedRecordId))) {
      nextParams.delete('record')
    }

    if (nextParams.toString() !== searchParamString) {
      setSearchParams(nextParams, { replace: true })
    }
  }, [focusedRecordId, focusedRecordNeedsReframe, searchParamString, searchParams, selectedMonth, selectedMonthRecords, setSearchParams])

  function buildMonthStartDate(month = selectedMonth) {
    return `${selectedYear}-${String(month).padStart(2, '0')}-01`
  }

  function updateCalendarParams(nextMonth: number, nextRecordId?: string | null) {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('month', String(nextMonth))
    nextParams.delete('year')

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
    updatePlanRecord(editorRecord.id, (record) =>
      updatePlanWithHistory(
        record,
        {
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
        },
        hasScheduleChange ? 'Rescheduled' : 'Edited',
        hasScheduleChange ? `Calendar reschedule saved for ${record.title}.` : `Calendar edits saved for ${record.title}.`,
      ),
    )
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
      <PageHeader
        eyebrow="Audit planning"
        actions={
          <div className="section-header-actions">
            <button type="button" className="button button-secondary" onClick={() => setEditorState({ mode: 'create', defaultStartDate: buildMonthStartDate() })}>
              <ButtonLabel icon="add" label="Quick create" />
            </button>
            <button type="button" className="button button-secondary" onClick={() => setCompletionRecordId(firstActionablePlan?.id ?? null)} disabled={!firstActionablePlan}>
              <ButtonLabel icon="complete" label="Mark completed" />
            </button>
          </div>
        }
      />

      <div className="calendar-pill-nav">
        <div className="calendar-pill-row">
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
