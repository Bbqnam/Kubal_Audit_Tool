import type { Vda65ChecklistItem } from '../types/audit'
import { StatusBadge } from './ui'

export default function ChecklistTable({
  items,
  onUpdate,
}: {
  items: Vda65ChecklistItem[]
  onUpdate?: (
    id: string,
    patch: Partial<Pick<Vda65ChecklistItem, 'status' | 'defectType' | 'severity' | 'comment'>>,
  ) => void
}) {
  return (
    <div className="table-card">
      <table>
        <thead>
          <tr>
            <th>Section</th>
            <th>Requirement</th>
            <th>Status</th>
            <th>Defect</th>
            <th>Severity</th>
            <th>Comment</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.section}</td>
              <td>{item.requirement}</td>
              <td>
                {onUpdate ? (
                  <select value={item.status} onChange={(event) => onUpdate(item.id, { status: event.target.value as Vda65ChecklistItem['status'] })}>
                    <option value="Pending">Pending</option>
                    <option value="OK">OK</option>
                    <option value="NOK">NOK</option>
                  </select>
                ) : (
                  <StatusBadge value={item.status} />
                )}
              </td>
              <td>
                {onUpdate ? (
                  <input value={item.defectType} onChange={(event) => onUpdate(item.id, { defectType: event.target.value })} />
                ) : (
                  item.defectType
                )}
              </td>
              <td>
                {onUpdate ? (
                  <select value={item.severity} onChange={(event) => onUpdate(item.id, { severity: event.target.value as Vda65ChecklistItem['severity'] })}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                ) : (
                  item.severity
                )}
              </td>
              <td>
                {onUpdate ? (
                  <textarea value={item.comment} onChange={(event) => onUpdate(item.id, { comment: event.target.value })} rows={3} />
                ) : (
                  item.comment
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
