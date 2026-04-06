import { useState } from 'react'
import { Field, Modal } from '../../../components/ui'
import type { AuditPlanRecord, AuditPlanStatus } from '../../../types/planning'
import type { AuditPlanningStandardOption, InternalExternalClassification } from '../../../types/planning'
import { processScopedStandards, shiftIsoDate } from '../services/planningUtils'

export type PlanningEditorDraft = {
  title: string
  standard: string
  auditType: string
  auditCategory: string
  internalExternal: InternalExternalClassification
  department: string
  processArea: string
  site: string
  owner: string
  plannedStart: string
  plannedEnd: string
  frequency: string
  status: Exclude<AuditPlanStatus, 'Completed' | 'Overdue'>
  notes: string
  linkedAuditId: string | null
  source: AuditPlanRecord['source']
}

type PlanningRecordModalProps = {
  mode: 'create' | 'edit'
  initialRecord?: AuditPlanRecord | null
  standardOptions: AuditPlanningStandardOption[]
  departmentOptions: string[]
  defaultStartDate?: string
  onClose: () => void
  onSave: (draft: PlanningEditorDraft) => void
  onDelete?: () => void
}

const internalExternalOptions: InternalExternalClassification[] = [
  'Internal',
  'External',
  'Supplier / second-party',
  'Certification / third-party',
  'Follow-up',
  'Special / ad hoc',
]

function createDefaultDraft(defaultStartDate?: string): PlanningEditorDraft {
  const startDate = defaultStartDate ?? new Date().toISOString().slice(0, 10)

  return {
    title: '',
    standard: 'VDA 6.3',
    auditType: 'Process Audit',
    auditCategory: 'Process',
    internalExternal: 'Internal',
    department: '',
    processArea: '',
    site: '',
    owner: '',
    plannedStart: startDate,
    plannedEnd: startDate,
    frequency: '',
    status: 'Planned',
    notes: '',
    linkedAuditId: null,
    source: 'manual',
  }
}

function toDraft(record: AuditPlanRecord): PlanningEditorDraft {
  return {
    title: record.title,
    standard: record.standard,
    auditType: record.auditType,
    auditCategory: record.auditCategory,
    internalExternal: record.internalExternal,
    department: record.department,
    processArea: record.processArea,
    site: record.site,
    owner: record.owner,
    plannedStart: record.plannedStart,
    plannedEnd: record.plannedEnd,
    frequency: record.frequency,
    status: record.status === 'Completed' || record.status === 'Overdue' ? 'In progress' : record.status,
    notes: record.notes,
    linkedAuditId: record.linkedAuditId,
    source: record.source,
  }
}

export default function PlanningRecordModal({
  mode,
  initialRecord,
  standardOptions,
  departmentOptions,
  defaultStartDate,
  onClose,
  onSave,
  onDelete,
}: PlanningRecordModalProps) {
  const [draft, setDraft] = useState<PlanningEditorDraft>(() =>
    initialRecord ? toDraft(initialRecord) : createDefaultDraft(defaultStartDate),
  )
  const [showMoreDetails, setShowMoreDetails] = useState(mode === 'edit')

  const selectedStandardOption = standardOptions.find((item) => item.label === draft.standard)
  const showProcessField = processScopedStandards.has(draft.standard)

  function applyStandardOption(optionId: string) {
    const option = standardOptions.find((item) => item.id === optionId)

    if (!option) {
      return
    }

    setDraft((current) => ({
      ...current,
      standard: option.label,
      auditType: option.auditType,
      auditCategory: option.auditCategory,
      internalExternal: option.internalExternal,
    }))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSave({
      ...draft,
      plannedEnd: draft.plannedEnd < draft.plannedStart ? draft.plannedStart : draft.plannedEnd,
    })
  }

  function shiftDates(days: number) {
    setDraft((current) => ({
      ...current,
      plannedStart: shiftIsoDate(current.plannedStart, days),
      plannedEnd: shiftIsoDate(current.plannedEnd, days),
    }))
  }

  return (
    <Modal
      title={mode === 'create' ? 'Quick create audit' : 'Edit planned audit'}
      description={mode === 'create' ? 'Create an audit with the minimum fields first, then expand details only if needed.' : 'Update dates, owner, classification, and any optional planning details.'}
      onClose={onClose}
      size="large"
      actions={
        <>
          {mode === 'edit' && onDelete ? (
            <button type="button" className="button button-secondary button-danger" onClick={onDelete}>
              Delete
            </button>
          ) : null}
          <button type="button" className="button button-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="planning-record-form" className="button button-primary">
            {mode === 'create' ? 'Add audit' : 'Save changes'}
          </button>
        </>
      }
    >
      <form id="planning-record-form" className="input-grid planning-form-grid" onSubmit={handleSubmit}>
        <Field label="Title" full>
          <input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} required />
        </Field>
        <Field label="Standard">
          <select
            value={selectedStandardOption?.id ?? 'custom-audit-type'}
            onChange={(event) => applyStandardOption(event.target.value)}
            required
          >
            {standardOptions.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Internal / external">
          <select
            value={draft.internalExternal}
            onChange={(event) => setDraft((current) => ({ ...current, internalExternal: event.target.value as InternalExternalClassification }))}
            required
          >
            {internalExternalOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </Field>
        <Field label="Owner">
          <input value={draft.owner} onChange={(event) => setDraft((current) => ({ ...current, owner: event.target.value }))} required />
        </Field>
        <Field label="Planned start">
          <input type="date" value={draft.plannedStart} onChange={(event) => setDraft((current) => ({ ...current, plannedStart: event.target.value }))} required />
        </Field>
        <Field label="Planned end">
          <input type="date" value={draft.plannedEnd} onChange={(event) => setDraft((current) => ({ ...current, plannedEnd: event.target.value }))} required />
        </Field>
        {mode === 'edit' ? (
          <div className="planning-quick-shift">
            <span>Quick date move</span>
            <div className="planning-pill-stack">
              <button type="button" className="button button-secondary button-small" onClick={() => shiftDates(-1)}> -1 day </button>
              <button type="button" className="button button-secondary button-small" onClick={() => shiftDates(1)}> +1 day </button>
              <button type="button" className="button button-secondary button-small" onClick={() => shiftDates(7)}> +1 week </button>
            </div>
          </div>
        ) : null}
        <div className="planning-more-details" aria-expanded={showMoreDetails}>
          <button type="button" className="button button-secondary button-small" onClick={() => setShowMoreDetails((current) => !current)}>
            {showMoreDetails ? 'Hide more details' : 'More details'}
          </button>
        </div>
        {showMoreDetails ? (
          <>
            <Field label="Department">
              <select value={draft.department} onChange={(event) => setDraft((current) => ({ ...current, department: event.target.value }))}>
                <option value="">Select department</option>
                {departmentOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </Field>
            {showProcessField ? (
              <Field label="Process / stream">
                <input value={draft.processArea} onChange={(event) => setDraft((current) => ({ ...current, processArea: event.target.value }))} />
              </Field>
            ) : null}
            <Field label="Site">
              <input value={draft.site} onChange={(event) => setDraft((current) => ({ ...current, site: event.target.value }))} />
            </Field>
            <Field label="Frequency">
              <input value={draft.frequency} onChange={(event) => setDraft((current) => ({ ...current, frequency: event.target.value }))} placeholder="Optional" />
            </Field>
            <Field label="Audit type">
              <input value={draft.auditType} onChange={(event) => setDraft((current) => ({ ...current, auditType: event.target.value }))} />
            </Field>
            <Field label="Category">
              <input value={draft.auditCategory} onChange={(event) => setDraft((current) => ({ ...current, auditCategory: event.target.value }))} />
            </Field>
            <Field label="Planning status">
              <select value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as PlanningEditorDraft['status'] }))}>
                <option value="Planned">Planned</option>
                <option value="In progress">In progress</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </Field>
            <Field label="Notes" full>
              <textarea rows={4} value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} />
            </Field>
          </>
        ) : null}
      </form>
    </Modal>
  )
}
