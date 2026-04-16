import { useMemo, useRef, useState } from 'react'
import type { WorkspaceUser } from '../types/access'
import type { AuditParticipant } from '../types/audit'
import WorkspaceUserSelect from './WorkspaceUserSelect'

function createParticipantId(userId: string) {
  return `participant-${userId}`
}

export default function AuditTeamEditor({
  users,
  leadAuditor,
  auditTeam,
  onLeadAuditorChange,
  onAuditTeamChange,
}: {
  users: WorkspaceUser[]
  leadAuditor: string
  auditTeam: AuditParticipant[]
  onLeadAuditorChange: (value: string) => void
  onAuditTeamChange: (value: AuditParticipant[]) => void
}) {
  const [searchValue, setSearchValue] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const searchRegionRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const selectedNames = useMemo(
    () => new Set([leadAuditor, ...auditTeam.map((participant) => participant.userName)].filter(Boolean)),
    [auditTeam, leadAuditor],
  )
  const searchableUsers = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase()

    return users.filter((user) => {
      if (selectedNames.has(user.name)) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      return user.name.toLowerCase().includes(normalizedSearch)
    })
  }, [searchValue, selectedNames, users])
  const hasSearch = searchValue.trim().length > 0

  return (
    <div className="audit-team-editor">
      <div className="audit-team-primary">
        <label className="field">
          <span>Lead auditor</span>
          <WorkspaceUserSelect
            users={users}
            value={leadAuditor}
            onChange={(value) => {
              onLeadAuditorChange(value)
              onAuditTeamChange(auditTeam.filter((participant) => participant.userName !== value))
            }}
            placeholder="Select lead auditor"
          />
        </label>
      </div>

      <div className="audit-team-secondary">
        <div
          ref={searchRegionRef}
          className="audit-team-search-region"
          onBlur={(event) => {
            if (!searchRegionRef.current?.contains(event.relatedTarget as Node | null)) {
              setIsSearchOpen(false)
            }
          }}
        >
          <label className="field">
            <span>Add auditor / observer</span>
            <input
              ref={inputRef}
              value={searchValue}
              onFocus={() => setIsSearchOpen(true)}
              onChange={(event) => {
                setSearchValue(event.target.value)
                setIsSearchOpen(true)
              }}
              placeholder="Search people"
            />
          </label>

          {isSearchOpen ? searchableUsers.length ? (
            <div className="participant-search-results">
              {searchableUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  className="participant-search-option"
                  onMouseDown={(event) => {
                    event.preventDefault()
                    onAuditTeamChange([
                      ...auditTeam,
                      {
                        id: createParticipantId(user.id),
                        userName: user.name,
                        role: 'Auditor',
                      },
                    ])
                    setSearchValue('')
                    setIsSearchOpen(true)
                    setTimeout(() => inputRef.current?.focus(), 0)
                  }}
                >
                  <strong>{user.name}</strong>
                </button>
              ))}
            </div>
          ) : (
            <div className="participant-search-empty">
              {hasSearch ? 'No matching auditors found.' : 'All available auditors are already added.'}
            </div>
          ) : null}
        </div>

        {auditTeam.length ? (
          <div className="participant-selected-list">
            {auditTeam.map((participant) => (
              <div key={participant.id} className="participant-selected-item">
                <div className="participant-selected-copy">
                  <strong>{participant.userName}</strong>
                </div>
                <select
                  value={participant.role}
                  onChange={(event) => onAuditTeamChange(
                    auditTeam.map((entry) => (
                      entry.id === participant.id
                        ? { ...entry, role: event.target.value as typeof participant.role }
                        : entry
                    )),
                  )}
                >
                  <option value="Auditor">Auditor</option>
                  <option value="Observer">Observer</option>
                </select>
                <button
                  type="button"
                  className="button button-secondary button-small"
                  onClick={() => onAuditTeamChange(auditTeam.filter((entry) => entry.id !== participant.id))}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
