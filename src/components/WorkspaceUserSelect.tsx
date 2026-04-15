import { getUserOptionLabel } from '../utils/userDirectory'
import type { WorkspaceUser } from '../types/access'

export default function WorkspaceUserSelect({
  users,
  value,
  onChange,
  placeholder = 'Select user',
}: {
  users: WorkspaceUser[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  const filteredUsers = users
  const hasCurrentValue = value && filteredUsers.some((user) => user.name === value)

  return (
    <select value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">{placeholder}</option>
      {!hasCurrentValue && value ? (
        <option value={value}>{value}</option>
      ) : null}
      {filteredUsers.map((user) => (
        <option key={user.id} value={user.name}>
          {getUserOptionLabel(user)}
        </option>
      ))}
    </select>
  )
}
