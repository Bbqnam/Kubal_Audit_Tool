import { useState } from 'react'
import { PageHeader, Panel } from '../../../components/ui'
import { useAuditLibrary } from '../../shared/context/useAuditLibrary'
import { auditPlanningStandardOptions } from '../data/planningSeed'
import PlanningCalendarNavigator from '../components/PlanningCalendarNavigator'
import PlanningMonthCalendar from '../components/PlanningMonthCalendar'
import PlanningCompletionModal from '../components/PlanningCompletionModal'
import PlanningHistoryModal from '../components/PlanningHistoryModal'
import PlanningRecordModal, { type PlanningEditorDraft } from '../components/PlanningRecordModal'
import { getDerivedPlanStatus, getMonthDateRange, getPlanningDepartmentOptions, getPlanningLegendEntries, getPlanningYears } from '../services/planningUtils'
import { updatePlanWithHistory } from '../services/planningFactory'
import type { AuditPlanCompletionResult } from '../../../types/planning'

type CalendarEditorState =
  | { mode: 'create'; defaultStartDate?: string }
  | { mode: 'edit'; recordId: string }

export default function YearCalendarPage() {
  const { planningRecords, audits, createPlanRecord, deletePlanRecord, getPlanById, updatePlanRecord } = useAuditLibrary()
  const planningYears = getPlanningYears(planningRecords)
  const currentDate = new Date()
  const defaultYear = planningYears.includes(currentDate.getFullYear()) ? currentDate.getFullYear() : planningYears[planningYears.length - 1]
  const [selectedYear, setSelectedYear] = useState(defaultYear)
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1)
  const [editorState, setEditorState] = useState<CalendarEditorState | null>(null)
  const [completionRecordId, setCompletionRecordId] = useState<string | null>(null)
  const [historyRecordId, setHistoryRecordId] = useState<string | null>(null)
  const departmentOptions = getPlanningDepartmentOptions(planningRecords)
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

  function buildMonthStartDate(month = selectedMonth) {
    return `${selectedYear}-${String(month).padStart(2, '0')}-01`
  }

  function handleChangeMonth(direction: -1 | 1) {
    const nextDate = new Date(selectedYear, selectedMonth - 1 + direction, 1)
    setSelectedYear(nextDate.getFullYear())
    setSelectedMonth(nextDate.getMonth() + 1)
  }

  function handleEditorSave(draft: PlanningEditorDraft) {
    if (!editorState) {
      return
    }

    if (editorState.mode === 'create') {
      createPlanRecord({
        ...draft,
      })
      setEditorState(null)
      return
    }

    if (!editorRecord) {
      return
    }

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

  function handleCompletionSave(payload: { actualCompletionDate: string; completionResult: AuditPlanCompletionResult; completionSummary: string; linkedAuditId: string | null }) {
    if (!completionRecord) {
      return
    }

    updatePlanRecord(completionRecord.id, (record) =>
      updatePlanWithHistory(
        record,
        {
          status: 'Completed',
          actualCompletionDate: payload.actualCompletionDate,
          completionResult: payload.completionResult,
          completionSummary: payload.completionSummary,
          linkedAuditId: payload.linkedAuditId,
        },
        'Completed',
        `Calendar completion saved for ${record.title}.`,
      ),
    )
    setCompletionRecordId(null)
  }

  function handleDelete(recordId: string) {
    const record = getPlanById(recordId)

    if (!record) {
      return
    }

    const confirmed = window.confirm(`Delete planned audit "${record.title}"? This removes it from the plan.`)

    if (!confirmed) {
      return
    }

    deletePlanRecord(recordId)
    setEditorState(null)
    setCompletionRecordId((current) => (current === recordId ? null : current))
    setHistoryRecordId((current) => (current === recordId ? null : current))
  }

  return (
    <div className="module-page planning-page">
      <PageHeader
        eyebrow="Planning module"
        title="Year audit calendar"
        subtitle="Focused calendar view for scanning the schedule, clicking days to create audits, and opening blocks to edit or reschedule."
      />

      <Panel title="Calendar filters" description="Use year buttons for the long-range plan and keep the month grid as the main planning surface.">
        <div className="planning-toolbar">
          <div className="planning-year-switcher">
            {planningYears.map((year) => (
              <button
                key={year}
                type="button"
                className={`button button-secondary button-small ${year === selectedYear ? 'planning-year-button-active' : ''}`}
                onClick={() => setSelectedYear(year)}
              >
                {year}
              </button>
            ))}
          </div>
          <div className="planning-toolbar-actions">
            <button type="button" className="button button-secondary" onClick={() => setEditorState({ mode: 'create', defaultStartDate: buildMonthStartDate() })}>
              Quick create
            </button>
            <button type="button" className="button button-secondary" onClick={() => setCompletionRecordId(firstActionablePlan?.id ?? null)} disabled={!firstActionablePlan}>
              Mark completed
            </button>
            <button type="button" className="button button-secondary" onClick={() => setHistoryRecordId(selectedMonthRecords[0]?.id ?? null)} disabled={!selectedMonthRecords.length}>
              Open history
            </button>
          </div>
        </div>
      </Panel>

      <Panel
        actions={
          <PlanningCalendarNavigator
            month={selectedMonth}
            year={selectedYear}
            years={planningYears}
            count={selectedMonthRecords.length}
            onPrevious={() => handleChangeMonth(-1)}
            onNext={() => handleChangeMonth(1)}
            onMonthChange={setSelectedMonth}
            onYearChange={setSelectedYear}
          />
        }
      >
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
          onSelectDay={(date) => setEditorState({ mode: 'create', defaultStartDate: date })}
          onSelectRecord={(recordId) => setEditorState({ mode: 'edit', recordId })}
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
