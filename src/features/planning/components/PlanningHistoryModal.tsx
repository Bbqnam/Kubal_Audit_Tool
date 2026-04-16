import { Modal, StatusBadge } from '../../../components/ui'
import { ButtonLabel } from '../../../components/icons'
import type { AuditPlanRecord } from '../../../types/planning'
import { formatDateTime } from '../../../utils/dateUtils'

export default function PlanningHistoryModal({ record, onClose }: { record: AuditPlanRecord; onClose: () => void }) {
  const history = [...record.changeHistory].sort((left, right) => right.timestamp.localeCompare(left.timestamp))

  return (
    <Modal
      title="Planning change history"
      description="Trace scheduling, completion, cancellation, and linkage updates for this planned audit."
      onClose={onClose}
      onPrimaryAction={onClose}
      actions={
        <button type="button" className="button button-primary" onClick={onClose}>
          <ButtonLabel icon="close" label="Close" />
        </button>
      }
    >
      <div className="planning-history-list">
        {history.map((item) => (
          <div key={item.id} className="planning-history-item">
            <div className="planning-history-item-header">
              <StatusBadge value={item.action} />
              <span>{formatDateTime(item.timestamp)}</span>
            </div>
            <strong>{item.summary}</strong>
            <span className="planning-history-item-meta">{item.actorName} · {item.actorPosition}</span>
          </div>
        ))}
      </div>
    </Modal>
  )
}
