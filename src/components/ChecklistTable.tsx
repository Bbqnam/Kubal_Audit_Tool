import type { Vda65ChecklistItem } from '../types/audit'
import { StatusBadge } from './ui'

function formatSpec(item: Vda65ChecklistItem) {
  const parts = []

  if (item.specialCharacteristic) {
    parts.push(`Special ${item.specialCharacteristic}`)
  }

  if (item.unit) {
    parts.push(`Unit ${item.unit}`)
  }

  if (item.minTolerance || item.nominalValue || item.maxTolerance) {
    parts.push(`Spec ${item.minTolerance || '-'} / ${item.nominalValue || '-'} / ${item.maxTolerance || '-'}`)
  }

  if (item.sampleSize !== null) {
    parts.push(`Sample ${item.sampleSize}`)
  }

  if (item.photoReference) {
    parts.push(item.photoReference)
  }

  return parts
}

export default function ChecklistTable({
  items,
  onUpdate,
}: {
  items: Vda65ChecklistItem[]
  onUpdate?: (
    id: string,
    patch: Partial<Pick<Vda65ChecklistItem, 'status' | 'defectCount' | 'comment'>>,
  ) => void
}) {
  return (
    <div className="table-card data-table-card checklist-table">
      <table>
        <thead>
          <tr>
            <th>Ref</th>
            <th>Section</th>
            <th>Requirement</th>
            <th>Class</th>
            <th>Status</th>
            <th>Defects</th>
            <th>Comment</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const spec = formatSpec(item)

            return (
              <tr key={item.id} className={!onUpdate && item.status === 'NOK' ? 'table-row-attention' : ''}>
                <td>
                  <div className="table-primary-cell">
                    <strong>{item.number}</strong>
                  </div>
                </td>
                <td><span className="table-subtle-cell">{item.section}</span></td>
                <td>
                  <div className="table-primary-cell">
                    <strong>{item.requirement}</strong>
                    {spec.length ? (
                      <div className="checklist-item-meta">
                        {spec.map((entry) => (
                          <span key={entry} className="table-subtle-cell">{entry}</span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </td>
                <td>
                  <span className={`checklist-class-chip checklist-class-${item.defectClass.toLowerCase()}`}>
                    {item.defectClass}
                  </span>
                </td>
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
                    <input
                      type="number"
                      min={0}
                      value={item.status === 'NOK' ? item.defectCount : 0}
                      disabled={item.status !== 'NOK'}
                      onChange={(event) => onUpdate(item.id, { defectCount: Number(event.target.value) })}
                    />
                  ) : (
                    <span className="table-subtle-cell">{item.status === 'NOK' ? item.defectCount : 0}</span>
                  )}
                </td>
                <td>
                  {onUpdate ? (
                    <textarea value={item.comment} onChange={(event) => onUpdate(item.id, { comment: event.target.value })} rows={3} />
                  ) : (
                    item.comment || <span className="table-subtle-cell">No comment</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
