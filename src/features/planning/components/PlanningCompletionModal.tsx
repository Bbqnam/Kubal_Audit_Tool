import { useState } from 'react'
import { Field, Modal, StatusBadge } from '../../../components/ui'
import type { AuditRecord } from '../../../types/audit'
import type { AuditPlanCompletionResult, AuditPlanRecord } from '../../../types/planning'

type PlanningCompletionModalProps = {
  record: AuditPlanRecord
  audits: AuditRecord[]
  onClose: () => void
  onSave: (payload: { actualCompletionDate: string; completionResult: AuditPlanCompletionResult; completionSummary: string; linkedAuditId: string | null }) => void
}

export default function PlanningCompletionModal({ record, audits, onClose, onSave }: PlanningCompletionModalProps) {
  const [actualCompletionDate, setActualCompletionDate] = useState(record.actualCompletionDate ?? new Date().toISOString().slice(0, 10))
  const [completionResult, setCompletionResult] = useState<AuditPlanCompletionResult>(record.completionResult || 'Closed')
  const [completionSummary, setCompletionSummary] = useState(record.completionSummary)
  const [linkedAuditId, setLinkedAuditId] = useState<string>(record.linkedAuditId ?? '')

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSave({
      actualCompletionDate,
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
            Cancel
          </button>
          <button type="submit" form="planning-completion-form" className="button button-primary">
            Save completion
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
        <Field label="Actual completion date">
          <input type="date" value={actualCompletionDate} onChange={(event) => setActualCompletionDate(event.target.value)} required />
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
        <Field label="Outcome / notes" full>
          <textarea rows={4} value={completionSummary} onChange={(event) => setCompletionSummary(event.target.value)} />
        </Field>
      </form>
    </Modal>
  )
}
