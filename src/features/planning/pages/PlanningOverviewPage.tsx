import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuditTypeBadge, MetricCard, PageHeader, Panel, StatusBadge } from '../../../components/ui'
import { ButtonLabel } from '../../../components/icons'
import { getAuditRecordHomePath } from '../../../data/navigation'
import { getAuditToneStyle } from '../../../data/auditTypes'
import { useAuditLibrary } from '../../shared/context/useAuditLibrary'
import type { AuditPlanCompletionResult } from '../../../types/planning'
import { formatDate } from '../../../utils/dateUtils'
import { exportPlanningToExcel } from '../../../utils/exportUtils'
import { auditPlanningStandardOptions } from '../data/planningSeed'
import PlanningCalendarNavigator from '../components/PlanningCalendarNavigator'
import PlanningMonthCalendar from '../components/PlanningMonthCalendar'
import PlanningCompletionModal from '../components/PlanningCompletionModal'
import PlanningHistoryModal from '../components/PlanningHistoryModal'
import PlanningRecordModal, { type PlanningEditorDraft } from '../components/PlanningRecordModal'
import {
  comparePlanRecords,
  getMonthDateRange,
  getDerivedPlanStatus,
  getPlanningLegendEntries,
  getPlanningDepartmentOptions,
  getPlanMonthLabel,
  getPlanExecutionAuditType,
  getPlanWindowLabel,
  summarizePlans,
} from '../services/planningUtils'
import { updatePlanWithHistory } from '../services/planningFactory'

type PlannerEditorState =
  | { mode: 'create'; defaultStartDate?: string }
  | { mode: 'edit'; recordId: string; defaultStartDate?: string }

export default function PlanningOverviewPage() {
  const navigate = useNavigate()
  const {
    audits,
    planningRecords,
    planningYears,
    createPlanRecord,
    createAuditFromPlan,
    duplicatePlanRecord,
    deletePlanRecord,
    getAuditById,
    getPlanById,
    updatePlanRecord,
  } = useAuditLibrary()
  const currentDate = new Date()
  const [selectedYear, setSelectedYear] = useState<number>(
    planningYears.includes(currentDate.getFullYear())
      ? currentDate.getFullYear()
      : planningYears[planningYears.length - 1] ?? currentDate.getFullYear(),
  )
  const [selectedMonth, setSelectedMonth] = useState<number>(planningYears.includes(currentDate.getFullYear()) ? currentDate.getMonth() + 1 : 1)
  const [searchValue] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<'all' | string>('all')
  const [selectedStandard, setSelectedStandard] = useState<'all' | string>('all')
  const [editorState, setEditorState] = useState<PlannerEditorState | null>(null)
  const [completionRecordId, setCompletionRecordId] = useState<string | null>(null)
  const [historyRecordId, setHistoryRecordId] = useState<string | null>(null)
  const [exportMessage, setExportMessage] = useState<string | null>(null)
  const departmentOptions = useMemo(() => getPlanningDepartmentOptions(planningRecords), [planningRecords])
  const { firstDay: selectedMonthStart, lastDay: selectedMonthEnd } = getMonthDateRange(selectedYear, selectedMonth)

  const filteredRecords = useMemo(() => {
    const query = searchValue.trim().toLowerCase()

    return [...planningRecords]
      .filter((record) => record.plannedStart <= selectedMonthEnd.toISOString().slice(0, 10) && record.plannedEnd >= selectedMonthStart.toISOString().slice(0, 10))
      .filter((record) => (selectedStatus === 'all' ? true : getDerivedPlanStatus(record) === selectedStatus))
      .filter((record) => (selectedStandard === 'all' ? true : record.standard === selectedStandard))
      .filter((record) => {
        if (!query) {
          return true
        }

        return [
          record.title,
          record.standard,
          record.auditType,
          record.department,
          record.processArea,
          record.site,
          record.owner,
        ]
          .join(' ')
          .toLowerCase()
          .includes(query)
      })
      .sort(comparePlanRecords)
  }, [planningRecords, searchValue, selectedMonthEnd, selectedMonthStart, selectedStandard, selectedStatus])
  const visibleLegendEntries = useMemo(() => getPlanningLegendEntries(filteredRecords), [filteredRecords])

  const visibleSummary = summarizePlans(filteredRecords)
  const completionRecord = completionRecordId ? getPlanById(completionRecordId) ?? null : null
  const historyRecord = historyRecordId ? getPlanById(historyRecordId) ?? null : null
  const editorRecord = editorState?.mode === 'edit' ? getPlanById(editorState.recordId) ?? null : null
  const actionableCalendarRecord = filteredRecords.find((record) => {
    const status = getDerivedPlanStatus(record)
    return status !== 'Completed' && status !== 'Cancelled'
  })

  function handleSelectDay(date: string) {
    setEditorState({ mode: 'create', defaultStartDate: date })
  }

  function handleChangeMonth(direction: -1 | 1) {
    const nextDate = new Date(selectedYear, selectedMonth - 1 + direction, 1)
    setSelectedYear(nextDate.getFullYear())
    setSelectedMonth(nextDate.getMonth() + 1)
  }

  async function handleExport() {
    const result = await exportPlanningToExcel('Audit Planning Register', filteredRecords)
    setExportMessage(`${result.filename} prepared. ${result.message}`)
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

    const existingRecord = editorRecord

    if (!existingRecord) {
      return
    }

    const hasScheduleChange = existingRecord.plannedStart !== draft.plannedStart || existingRecord.plannedEnd !== draft.plannedEnd
    const isCancellation = draft.status === 'Cancelled' && existingRecord.status !== 'Cancelled'
    const action = isCancellation ? 'Cancelled' : hasScheduleChange ? 'Rescheduled' : 'Edited'
    const summary = isCancellation
      ? `Planning record cancelled for ${existingRecord.title}.`
      : hasScheduleChange
        ? `Rescheduled from ${existingRecord.plannedStart} - ${existingRecord.plannedEnd} to ${draft.plannedStart} - ${draft.plannedEnd}.`
        : `Planning fields updated for ${existingRecord.title}.`

    updatePlanRecord(existingRecord.id, (record) =>
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
        action,
        summary,
      ),
    )

    setEditorState(null)
  }

  function handleCompleteSave(payload: {
    actualCompletionDate: string
    completionDateChangeReason: string
    completionResult: AuditPlanCompletionResult
    completionSummary: string
    linkedAuditId: string | null
  }) {
    if (!completionRecord) {
      return
    }

    const completionChanged = payload.actualCompletionDate !== completionRecord.plannedEnd
    const completionSummary = payload.completionDateChangeReason
      ? payload.completionSummary
        ? `${payload.completionSummary}\n\nCompletion date change reason: ${payload.completionDateChangeReason}`
        : `Completion date change reason: ${payload.completionDateChangeReason}`
      : payload.completionSummary
    const historySummary = completionChanged
      ? `Marked completed on ${payload.actualCompletionDate} instead of planned end ${completionRecord.plannedEnd}. Reason: ${payload.completionDateChangeReason}.${payload.completionResult ? ` Result ${payload.completionResult}.` : ''}`
      : `Marked completed on planned date ${payload.actualCompletionDate}${payload.completionResult ? ` with result ${payload.completionResult}` : ''}.`

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

  function handleCancel(recordId: string) {
    updatePlanRecord(recordId, (record) =>
      updatePlanWithHistory(
        record,
        {
          status: record.status === 'Cancelled' ? 'Planned' : 'Cancelled',
        },
        'Cancelled',
        record.status === 'Cancelled' ? 'Planning record re-opened.' : 'Planning record cancelled.',
      ),
    )
  }

  function handleDuplicate(recordId: string) {
    duplicatePlanRecord(recordId)
  }

  function handleCreateAudit(recordId: string) {
    const createdAudit = createAuditFromPlan(recordId)

    if (createdAudit) {
      navigate(getAuditRecordHomePath(createdAudit))
    }
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
        eyebrow="Audit planning"
        actions={
          <div className="section-header-actions">
            <button type="button" className="button button-secondary" onClick={() => setEditorState({ mode: 'create', defaultStartDate: `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01` })}>
              <ButtonLabel icon="add" label="Quick create" />
            </button>
            <button type="button" className="button button-primary" onClick={handleExport}>
              <ButtonLabel icon="export" label="Export plan" />
            </button>
          </div>
        }
      />

      <div className="metrics-grid planning-metrics-grid">
        <MetricCard label={`${getPlanMonthLabel(selectedMonth)} audits`} value={visibleSummary.total} />
        <MetricCard label="Completed" value={visibleSummary.completed} tone="success" />
        <MetricCard label="In progress" value={visibleSummary.inProgress} tone="warning" />
        <MetricCard label="Overdue / cancelled" value={visibleSummary.overdue + visibleSummary.cancelled} tone="danger" />
      </div>

      <Panel
        title="Calendar view"
        description="Click any day to quick-create an audit. Click an audit block to edit it. Use the month navigator to move quickly."
        actions={
          <PlanningCalendarNavigator
            month={selectedMonth}
            year={selectedYear}
            years={planningYears}
            count={filteredRecords.length}
            onPrevious={() => handleChangeMonth(-1)}
            onNext={() => handleChangeMonth(1)}
            onMonthChange={setSelectedMonth}
            onYearChange={setSelectedYear}
          />
        }
      >
        <div className="planning-toolbar">
          <div className="planning-toolbar-summary">
            <strong>{getPlanMonthLabel(selectedMonth)} focus</strong>
            <span>Filter the visible month by status or standard while keeping the calendar as the main working view.</span>
          </div>
          <label className="planning-filter">
            <span>Status</span>
            <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)}>
              <option value="all">All statuses</option>
              <option value="Planned">Planned</option>
              <option value="In progress">In progress</option>
              <option value="Completed">Completed</option>
              <option value="Overdue">Overdue</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </label>
          <label className="planning-filter">
            <span>Standard</span>
            <select value={selectedStandard} onChange={(event) => setSelectedStandard(event.target.value)}>
              <option value="all">All standards</option>
              {[...new Set(planningRecords.map((record) => record.standard))].sort().map((standard) => (
                <option key={standard} value={standard}>{standard}</option>
              ))}
            </select>
          </label>
          <div className="planning-toolbar-actions">
            <button type="button" className="button button-secondary button-small" onClick={() => setCompletionRecordId(actionableCalendarRecord?.id ?? null)} disabled={!actionableCalendarRecord}>
              <ButtonLabel icon="complete" label="Mark completed" />
            </button>
            <Link to="/planning/calendar" className="button button-secondary button-small">
              <ButtonLabel icon="calendar" label="Calendar" />
            </Link>
            <Link to="/planning/three-year" className="button button-secondary button-small">
              <ButtonLabel icon="calendar" label="3-year plan" />
            </Link>
            <Link to="/planning/reports" className="button button-secondary button-small">
              <ButtonLabel icon="reports" label="Reports" />
            </Link>
          </div>
        </div>
        {visibleLegendEntries.length ? (
          <div className="planning-calendar-legend">
            {visibleLegendEntries.map((entry) => (
              <span key={entry.key} className={`planning-legend-chip ${entry.className}`}>{entry.label}</span>
            ))}
          </div>
        ) : null}
        <PlanningMonthCalendar
          records={filteredRecords}
          year={selectedYear}
          month={selectedMonth}
          onSelectDay={handleSelectDay}
          onSelectRecord={(recordId) => setEditorState({ mode: 'edit', recordId })}
          onCompleteRecord={(recordId) => setCompletionRecordId(recordId)}
        />
        {exportMessage ? <p className="export-feedback">{exportMessage}</p> : null}
      </Panel>

      <Panel title="Management table" description="Secondary view for filters, exports, and detailed planning actions.">
        <div className="table-card planning-table-card">
          <table>
            <thead>
              <tr>
                <th>Audit</th>
                <th>Standard / type</th>
                <th>Classification</th>
                <th>Department / site</th>
                <th>Window</th>
                <th>Owner</th>
                <th>Status</th>
                <th>Linked record</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => {
                const linkedAudit = record.linkedAuditId ? getAuditById(record.linkedAuditId) : undefined
                const derivedStatus = getDerivedPlanStatus(record)
                const completionLabel = record.actualCompletionDate ? `Completed ${formatDate(record.actualCompletionDate)}` : 'No completion'

                return (
                  <tr key={record.id}>
                    <td>
                      <div className="planning-table-title">
                        <strong>{record.title}</strong>
                        <span>{record.frequency} · {record.notes || 'No notes'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="planning-table-title">
                        <strong>{record.standard}</strong>
                        <AuditTypeBadge label={record.auditType} size="small" />
                      </div>
                    </td>
                    <td>
                      <div className="planning-pill-stack">
                        <span className={`planning-pill planning-pill-${record.internalExternal.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>{record.internalExternal}</span>
                        <span className="planning-pill planning-pill-neutral" style={getAuditToneStyle(record.auditType)}>{record.auditCategory}</span>
                      </div>
                    </td>
                    <td>
                      <div className="planning-table-title">
                        <strong>{record.department}</strong>
                        <span>{record.processArea} · {record.site}</span>
                      </div>
                    </td>
                    <td>
                      <div className="planning-table-title">
                        <strong>{getPlanWindowLabel(record)}</strong>
                        <span>{formatDate(record.plannedStart)} to {formatDate(record.plannedEnd)}</span>
                      </div>
                    </td>
                    <td>
                      <div className="planning-table-title">
                        <strong>{record.owner}</strong>
                        <span>{completionLabel}</span>
                      </div>
                    </td>
                    <td>
                      <div className="planning-table-title">
                        <StatusBadge value={derivedStatus} />
                        <span>{record.completionResult || 'No result captured'}</span>
                      </div>
                    </td>
                    <td>
                      {linkedAudit ? (
                        <Link to={getAuditRecordHomePath(linkedAudit)} className="button button-secondary button-small">
                          <ButtonLabel icon="open" label="Open audit" />
                        </Link>
                      ) : (
                        <span className="planning-subtle-text">Not linked</span>
                      )}
                    </td>
                    <td>
                      <div className="planning-row-actions">
                        <button
                          type="button"
                          className="button button-secondary button-small button-icon-only"
                          onClick={() => setEditorState({ mode: 'edit', recordId: record.id })}
                          aria-label={`Edit ${record.title}`}
                          title="Edit"
                        >
                          <ButtonLabel icon="edit" label={`Edit ${record.title}`} hideLabel />
                        </button>
                        <button
                          type="button"
                          className="button button-secondary button-small button-icon-only"
                          onClick={() => setEditorState({ mode: 'edit', recordId: record.id, defaultStartDate: record.plannedStart })}
                          aria-label={`Reschedule ${record.title}`}
                          title="Reschedule"
                        >
                          <ButtonLabel icon="calendar" label={`Reschedule ${record.title}`} hideLabel />
                        </button>
                        <button
                          type="button"
                          className="button button-secondary button-small button-icon-only"
                          onClick={() => setCompletionRecordId(record.id)}
                          aria-label={`Mark ${record.title} completed`}
                          title="Mark completed"
                        >
                          <ButtonLabel icon="complete" label={`Mark ${record.title} completed`} hideLabel />
                        </button>
                        <button
                          type="button"
                          className="button button-secondary button-small button-icon-only"
                          onClick={() => handleCancel(record.id)}
                          aria-label={`${record.status === 'Cancelled' ? 'Reopen' : 'Cancel'} ${record.title}`}
                          title={record.status === 'Cancelled' ? 'Reopen' : 'Cancel'}
                        >
                          <ButtonLabel icon={record.status === 'Cancelled' ? 'reopen' : 'cancel'} label={`${record.status === 'Cancelled' ? 'Reopen' : 'Cancel'} ${record.title}`} hideLabel />
                        </button>
                        <button
                          type="button"
                          className="button button-secondary button-small button-icon-only"
                          onClick={() => handleDuplicate(record.id)}
                          aria-label={`Duplicate ${record.title}`}
                          title="Duplicate"
                        >
                          <ButtonLabel icon="duplicate" label={`Duplicate ${record.title}`} hideLabel />
                        </button>
                        <button
                          type="button"
                          className="button button-secondary button-small button-danger button-icon-only"
                          onClick={() => handleDelete(record.id)}
                          aria-label={`Delete ${record.title}`}
                          title="Delete"
                        >
                          <ButtonLabel icon="delete" label={`Delete ${record.title}`} hideLabel />
                        </button>
                        <button
                          type="button"
                          className="button button-secondary button-small button-icon-only"
                          onClick={() => setHistoryRecordId(record.id)}
                          aria-label={`Open history for ${record.title}`}
                          title="History"
                        >
                          <ButtonLabel icon="history" label={`Open history for ${record.title}`} hideLabel />
                        </button>
                        {getPlanExecutionAuditType(record) && !record.linkedAuditId ? (
                          <button type="button" className="button button-primary button-small" onClick={() => handleCreateAudit(record.id)}>
                            <ButtonLabel icon="add" label="Create audit" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {editorState ? (
        <PlanningRecordModal
          key={editorState.mode === 'create' ? `create-${editorState.defaultStartDate ?? 'default'}` : `edit-${editorState.recordId}`}
          mode={editorState.mode}
          initialRecord={editorRecord}
          departmentOptions={departmentOptions}
          defaultStartDate={editorState.defaultStartDate}
          standardOptions={auditPlanningStandardOptions}
          onClose={() => setEditorState(null)}
          onDelete={editorState.mode === 'edit' ? () => handleDelete(editorState.recordId) : undefined}
          onSave={handleEditorSave}
        />
      ) : null}

      {completionRecord ? (
        <PlanningCompletionModal
          key={`complete-${completionRecord.id}-${completionRecord.updatedAt}`}
          record={completionRecord}
          audits={audits}
          onClose={() => setCompletionRecordId(null)}
          onSave={handleCompleteSave}
        />
      ) : null}

      {historyRecord ? <PlanningHistoryModal record={historyRecord} onClose={() => setHistoryRecordId(null)} /> : null}
    </div>
  )
}
