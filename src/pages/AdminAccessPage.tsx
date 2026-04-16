import { useMemo, useState } from 'react'
import HistoryModal from '../components/HistoryModal'
import { ButtonLabel } from '../components/icons'
import { EmptyState, PageHeader, Panel } from '../components/ui'
import { workspaceUserPermissionOptions } from '../data/access'
import { useAuditLibrary } from '../features/shared/context/useAuditLibrary'
import { sanitizeUserName } from '../utils/userDirectory'

function createUsageMap(audits: ReturnType<typeof useAuditLibrary>['audits']) {
  const usage = new Map<string, number>()

  function addUsage(value: string | undefined) {
    const trimmedValue = sanitizeUserName(value ?? '')

    if (!trimmedValue) {
      return
    }

    usage.set(trimmedValue, (usage.get(trimmedValue) ?? 0) + 1)
  }

  audits.forEach((audit) => {
    addUsage(audit.auditor)
    addUsage(audit.data.auditInfo.auditor)
    audit.auditTeam.forEach((participant) => addUsage(participant.userName))
  })

  return usage
}

export default function AdminAccessPage() {
  const { audits, userAdminHistory, users, createUser, updateUser, deleteUser } = useAuditLibrary()
  const [message, setMessage] = useState<string | null>(null)
  const [newUserName, setNewUserName] = useState('')
  const [searchValue, setSearchValue] = useState('')
  const [historyOpen, setHistoryOpen] = useState(false)
  const usageByName = useMemo(() => createUsageMap(audits), [audits])
  const filteredUsers = users.filter((user) => user.name.toLowerCase().includes(searchValue.trim().toLowerCase()))
  const userHistoryItems = useMemo(
    () => [...userAdminHistory]
      .sort((left, right) => right.timestamp.localeCompare(left.timestamp))
      .map((entry) => ({
        id: entry.id,
        timestamp: entry.timestamp,
        badge: entry.action,
        title: entry.userName || entry.summary,
        description: entry.summary,
        meta: `${entry.actorName} · ${entry.actorPosition}`,
      })),
    [userAdminHistory],
  )

  function handleCreateUser() {
    const sanitizedName = sanitizeUserName(newUserName)

    if (!sanitizedName) {
      setMessage('Enter a name before adding a user.')
      return
    }

    if (users.some((user) => user.name === sanitizedName)) {
      setMessage(`"${sanitizedName}" is already in the access directory.`)
      return
    }

    createUser({
      name: sanitizedName,
      position: '',
    })
    setNewUserName('')
    setMessage(null)
  }

  return (
    <div className="module-page">
      <PageHeader
        eyebrow="Admin"
        title="Audit users"
        subtitle="Keep this list small and practical. Names here appear in auditor and audit-team selection."
      />

      <Panel
        title="Directory"
        description="Name is only needed when creating a user. After that, keep each row lightweight."
        actions={
          <button type="button" className="button button-secondary button-small" onClick={() => setHistoryOpen(true)}>
            <ButtonLabel icon="history" label="History" />
          </button>
        }
      >
        {message ? <p className="export-feedback">{message}</p> : null}
        <div className="access-toolbar access-toolbar-minimal">
          <input
            className="access-toolbar-add"
            value={newUserName}
            onChange={(event) => setNewUserName(event.target.value)}
            placeholder="Add user name"
          />
          <button type="button" className="button button-primary" onClick={handleCreateUser}>
            <ButtonLabel icon="add" label="Add" />
          </button>
          <input
            className="access-toolbar-search"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search"
          />
        </div>

        {filteredUsers.length ? (
          <div className="access-directory-list access-directory-list-minimal">
            {filteredUsers.map((user) => {
              const assignmentCount = usageByName.get(user.name) ?? 0

              return (
                <article key={user.id} className="access-directory-row access-directory-row-minimal">
                  <div className="access-directory-user">
                    <strong>{user.name}</strong>
                    <span>{assignmentCount ? `${assignmentCount} assignment${assignmentCount === 1 ? '' : 's'}` : 'Unused'}</span>
                  </div>
                  <div className="access-directory-controls access-directory-controls-minimal">
                    <select
                      value={user.permission}
                      onChange={(event) => {
                        setMessage(null)
                        updateUser(user.id, (current) => ({
                          ...current,
                          permission: event.target.value as typeof current.permission,
                        }))
                      }}
                      aria-label={`Permission for ${user.name}`}
                    >
                      {workspaceUserPermissionOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="button button-secondary button-small button-danger"
                      onClick={() => deleteUser(user.id)}
                      disabled={assignmentCount > 0}
                      title={assignmentCount > 0 ? 'Remove audit assignments before deleting this user.' : 'Delete user'}
                    >
                      <ButtonLabel icon="delete" label="Delete" />
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <EmptyState title="No matching users" description="Try a different search or add a user." />
        )}
      </Panel>

      {historyOpen ? (
        <HistoryModal
          title="User admin history"
          description="Tracks user creation, edits, permission changes, and deletions."
          items={userHistoryItems}
          emptyTitle="No user admin activity yet."
          emptyDescription="Adding users, renaming them, or changing roles will appear here."
          onClose={() => setHistoryOpen(false)}
        />
      ) : null}
    </div>
  )
}
