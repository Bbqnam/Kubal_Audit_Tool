import { useState } from 'react'
import { Field, Modal } from '../../../components/ui'
import { ButtonLabel } from '../../../components/icons'
import WorkspaceUserSelect from '../../../components/WorkspaceUserSelect'
import type { AuditPlanRecord, AuditPlanStatus } from '../../../types/planning'
import type { AuditPlanningStandardOption, InternalExternalClassification } from '../../../types/planning'
import { useAuditLibrary } from '../../shared/context/useAuditLibrary'
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
  const { users } = useAuditLibrary()
  const [draft, setDraft] = useState<PlanningEditorDraft>(() =>
    initialRecord ? toDraft(initialRecord) : createDefaultDraft(defaultStartDate),
  )
  const [showMoreDetails, setShowMoreDetails] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const selectedStandardOption = standardOptions.find((item) => item.label === draft.standard)
  const showProcessField = processScopedStandards.has(draft.standard)
  const isCreateMode = mode === 'create'

  function validateDraft(value: PlanningEditorDraft) {
    const errors: string[] = []

    if (!value.title.trim()) {
      errors.push('Title is required.')
    }

    if (!value.standard.trim()) {
      errors.push('Standard is required.')
    }

    if (!value.auditType.trim()) {
      errors.push('Type of audit is required.')
    }

    if (!value.owner.trim()) {
      errors.push('Auditor is required.')
    }

    if (!value.plannedStart) {
      errors.push('Date is required.')
    }

    if (!isCreateMode && !value.plannedEnd) {
      errors.push('Planned end date is required.')
    }

    return errors
  }

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
    const errors = validateDraft(draft)

    if (errors.length) {
      setValidationErrors(errors)
      return
    }

    setValidationErrors([])
    onSave({
      ...draft,
      plannedEnd: isCreateMode ? draft.plannedStart : draft.plannedEnd < draft.plannedStart ? draft.plannedStart : draft.plannedEnd,
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
      title={isCreateMode ? 'Quick create audit' : 'Edit planned audit'}
      description={isCreateMode ? 'Create the audit shell first. Everything else can be completed later in the detailed audit info.' : 'Update dates, auditor, classification, and any optional planning details.'}
      onClose={onClose}
      size="large"
      actions={(
        <div className="planning-record-modal-actions">
          {mode === 'edit' && onDelete ? (
            <button type="button" className="button button-secondary button-danger" onClick={onDelete}>
              <ButtonLabel icon="delete" label="Delete" />
            </button>
          ) : null}
          <button type="button" className="button button-secondary planning-record-modal-close" onClick={onClose}>
            <ButtonLabel icon="close" label="Cancel" />
          </button>
          <button type="submit" form="planning-record-form" className="button button-primary planning-record-modal-submit">
            <ButtonLabel icon={isCreateMode ? 'add' : 'save'} label={isCreateMode ? 'Add audit' : 'Save changes'} />
          </button>
        </div>
      )}
    >
      <form id="planning-record-form" className="input-grid planning-form-grid" onSubmit={handleSubmit}>
        {validationErrors.length ? (
          <div className="empty-state">
            <h3>Missing required planning data</h3>
            <p>{validationErrors.join(' ')}</p>
          </div>
        ) : null}

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

        <Field label="Type of audit">
          <input value={draft.auditType} onChange={(event) => setDraft((current) => ({ ...current, auditType: event.target.value }))} required />
        </Field>

        <Field label="Auditor">
          <WorkspaceUserSelect
            users={users}
            value={draft.owner}
            onChange={(value) => setDraft((current) => ({ ...current, owner: value }))}
            placeholder="Select auditor"
          />
        </Field>

        <Field label={isCreateMode ? 'Date' : 'Planned start'}>
          <input type="date" value={draft.plannedStart} onChange={(event) => setDraft((current) => ({ ...current, plannedStart: event.target.value }))} required />
        </Field>

        {!isCreateMode ? (
          <Field label="Planned end">
            <input type="date" value={draft.plannedEnd} onChange={(event) => setDraft((current) => ({ ...current, plannedEnd: event.target.value }))} required />
          </Field>
        ) : null}

        {!isCreateMode ? (
          <div className="planning-quick-shift">
            <span>Quick date move</span>
            <div className="planning-pill-stack">
              <button type="button" className="button button-secondary button-small" onClick={() => shiftDates(-1)}>-1 day</button>
              <button type="button" className="button button-secondary button-small" onClick={() => shiftDates(1)}>+1 day</button>
              <button type="button" className="button button-secondary button-small" onClick={() => shiftDates(7)}>+1 week</button>
            </div>
          </div>
        ) : null}

        {!isCreateMode ? (
          <div className="planning-more-details" aria-expanded={showMoreDetails}>
            <button
              type="button"
              className="button button-secondary button-small planning-record-modal-toggle"
              onClick={() => setShowMoreDetails((current) => !current)}
            >
              <ButtonLabel icon={showMoreDetails ? 'collapse' : 'details'} label={showMoreDetails ? 'Hide details' : 'Show details'} />
            </button>
          </div>
        ) : null}

        {!isCreateMode && showMoreDetails ? (
          <>
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
