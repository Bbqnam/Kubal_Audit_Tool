import { useState } from 'react'
import { Field, Modal, StatusBadge } from '../../../components/ui'
import { ButtonLabel } from '../../../components/icons'
import type { AuditRecord } from '../../../types/audit'
import type { AuditPlanCompletionResult, AuditPlanRecord } from '../../../types/planning'

type PlanningCompletionModalProps = {
  record: AuditPlanRecord
  audits: AuditRecord[]
  onClose: () => void
  onSave: (payload: {
    actualCompletionDate: string
    completionDateChangeReason: string
    completionResult: AuditPlanCompletionResult
    completionSummary: string
    linkedAuditId: string | null
  }) => void
}

export default function PlanningCompletionModal({ record, audits, onClose, onSave }: PlanningCompletionModalProps) {
  const plannedCompletionDate = record.plannedEnd
  const [completionDateMode, setCompletionDateMode] = useState<'planned' | 'custom'>(
    record.actualCompletionDate && record.actualCompletionDate !== plannedCompletionDate ? 'custom' : 'planned',
  )
  const [customCompletionDate, setCustomCompletionDate] = useState(record.actualCompletionDate ?? plannedCompletionDate)
  const actualCompletionDate = completionDateMode === 'planned' ? plannedCompletionDate : customCompletionDate
  const [completionDateChangeReason, setCompletionDateChangeReason] = useState(record.completionDateChangeReason ?? '')
  const [completionResult, setCompletionResult] = useState<AuditPlanCompletionResult>(record.completionResult || 'Closed')
  const [completionSummary, setCompletionSummary] = useState(record.completionSummary)
  const [linkedAuditId, setLinkedAuditId] = useState<string>(record.linkedAuditId ?? '')
  const requiresDateChangeReason = actualCompletionDate !== plannedCompletionDate

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (requiresDateChangeReason && !completionDateChangeReason.trim()) {
      return
    }

    onSave({
      actualCompletionDate,
      completionDateChangeReason: requiresDateChangeReason ? completionDateChangeReason.trim() : '',
      completionResult,
      completionSummary,
      linkedAuditId: linkedAuditId || null,
    })
  }

  return (
    <Modal
      title="Mark planned audit completed"
      description="Capture completion date, result, outcome notes, and an optional linked audit record or report."
      onClose={onClose}
      actions={
        <>
          <button type="button" className="button button-secondary" onClick={onClose}>
            <ButtonLabel icon="close" label="Cancel" />
          </button>
          <button type="submit" form="planning-completion-form" className="button button-primary">
            <ButtonLabel icon="complete" label="Save completion" />
          </button>
        </>
      }
    >
      <form id="planning-completion-form" className="input-grid" onSubmit={handleSubmit}>
        <div className="planning-completion-summary">
          <strong>{record.title}</strong>
          <div className="inline-meta">
            <StatusBadge value={record.status} />
            <span>{record.standard}</span>
          </div>
        </div>
        <Field label="Completion date handling" full>
          <div className="planning-completion-date-options">
            <button
              type="button"
              className={`button button-small ${completionDateMode === 'planned' ? 'button-primary' : 'button-secondary'}`}
              onClick={() => setCompletionDateMode('planned')}
            >
              Same as planned date
            </button>
            <button
              type="button"
              className={`button button-small ${completionDateMode === 'custom' ? 'button-primary' : 'button-secondary'}`}
              onClick={() => setCompletionDateMode('custom')}
            >
              Pick another day
            </button>
          </div>
        </Field>
        <Field label={completionDateMode === 'planned' ? 'Planned completion date' : 'Actual completion date'}>
          <input
            type="date"
            value={actualCompletionDate}
            onChange={(event) => {
              setCompletionDateMode('custom')
              setCustomCompletionDate(event.target.value)
            }}
            required
            disabled={completionDateMode === 'planned'}
          />
        </Field>
        <Field label="Completion result">
          <select value={completionResult} onChange={(event) => setCompletionResult(event.target.value as AuditPlanCompletionResult)}>
            <option value="Closed">Closed</option>
            <option value="Pass">Pass</option>
            <option value="Conditional">Conditional</option>
            <option value="Fail">Fail</option>
          </select>
        </Field>
        <Field label="Linked audit record">
          <select value={linkedAuditId} onChange={(event) => setLinkedAuditId(event.target.value)}>
            <option value="">None</option>
            {audits.map((audit) => (
              <option key={audit.id} value={audit.id}>
                {audit.title}
              </option>
            ))}
          </select>
        </Field>
        {requiresDateChangeReason ? (
          <Field label="Reason for completion date change" full>
            <textarea
              rows={3}
              value={completionDateChangeReason}
              onChange={(event) => setCompletionDateChangeReason(event.target.value)}
              placeholder={`Explain why completion moved from ${plannedCompletionDate}.`}
              required
            />
          </Field>
        ) : null}
        <Field label="Outcome / notes" full>
          <textarea rows={4} value={completionSummary} onChange={(event) => setCompletionSummary(event.target.value)} />
        </Field>
      </form>
    </Modal>
  )
}
