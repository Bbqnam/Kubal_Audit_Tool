import { useEffect, useMemo, useRef, useState } from 'react'
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
  const [activeOptionIndex, setActiveOptionIndex] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null)
  const searchRegionRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const selectedListRef = useRef<HTMLDivElement | null>(null)
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
  const clampedActiveOptionIndex = searchableUsers.length
    ? Math.min(activeOptionIndex, searchableUsers.length - 1)
    : 0
  const activeOption = searchableUsers[clampedActiveOptionIndex]

  useEffect(() => {
    if (!statusMessage) {
      return
    }

    const timeoutId = window.setTimeout(() => setStatusMessage(''), 2200)
    return () => window.clearTimeout(timeoutId)
  }, [statusMessage])

  function addParticipant(user: WorkspaceUser) {
    const nextParticipant = {
      id: createParticipantId(user.id),
      userName: user.name,
      role: 'Auditor' as const,
    }

    onAuditTeamChange([...auditTeam, nextParticipant])
    setRecentlyAddedId(nextParticipant.id)
    setStatusMessage(`${user.name} added to audit team as Auditor.`)
    setSearchValue('')
    setIsSearchOpen(true)
    setActiveOptionIndex(0)
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }

  function removeParticipant(participantId: string, userName: string) {
    onAuditTeamChange(auditTeam.filter((entry) => entry.id !== participantId))
    setStatusMessage(`${userName} removed from audit team.`)
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }

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
              role="combobox"
              aria-expanded={isSearchOpen}
              aria-autocomplete="list"
              aria-controls="audit-team-search-results"
              aria-activedescendant={isSearchOpen && activeOption ? `audit-team-option-${activeOption.id}` : undefined}
              value={searchValue}
              onFocus={() => setIsSearchOpen(true)}
              onChange={(event) => {
                setSearchValue(event.target.value)
                setIsSearchOpen(true)
                setActiveOptionIndex(0)
              }}
              onKeyDown={(event) => {
                if (!isSearchOpen && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
                  setIsSearchOpen(true)
                  event.preventDefault()
                  return
                }

                if (event.key === 'Escape') {
                  setIsSearchOpen(false)
                  setActiveOptionIndex(0)
                  event.preventDefault()
                  return
                }

                if (!searchableUsers.length) {
                  return
                }

                if (event.key === 'ArrowDown') {
                  event.preventDefault()
                  setActiveOptionIndex((current) => (current + 1) % searchableUsers.length)
                  return
                }

                if (event.key === 'ArrowUp') {
                  event.preventDefault()
                  setActiveOptionIndex((current) => (current - 1 + searchableUsers.length) % searchableUsers.length)
                  return
                }

                if (event.key === 'Enter' && activeOption) {
                  event.preventDefault()
                  addParticipant(activeOption)
                }
              }}
              placeholder="Search people"
            />
          </label>

          {isSearchOpen ? searchableUsers.length ? (
            <div id="audit-team-search-results" className="participant-search-results" role="listbox">
              {searchableUsers.map((user, index) => (
                <button
                  key={user.id}
                  id={`audit-team-option-${user.id}`}
                  type="button"
                  role="option"
                  aria-selected={index === clampedActiveOptionIndex}
                  className={`participant-search-option ${index === clampedActiveOptionIndex ? 'participant-search-option-active' : ''}`}
                  onMouseDown={(event) => {
                    event.preventDefault()
                    addParticipant(user)
                  }}
                  onMouseEnter={() => setActiveOptionIndex(index)}
                >
                  <strong>{user.name}</strong>
                </button>
              ))}
            </div>
          ) : (
            <div className="participant-search-empty">
              {hasSearch ? 'No matching auditors found. Press Escape to close search.' : 'All available auditors are already added.'}
            </div>
          ) : null}
          <p className="participant-search-helper">Press Enter to add highlighted person, Arrow keys to navigate, Escape to close.</p>
        </div>

        {auditTeam.length ? (
          <div ref={selectedListRef} className="participant-selected-list">
            {auditTeam.map((participant) => (
              <div
                key={participant.id}
                className={`participant-selected-item ${recentlyAddedId === participant.id ? 'participant-selected-item-new' : ''}`}
              >
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
                  onClick={() => removeParticipant(participant.id, participant.userName)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="participant-search-empty">No additional auditors or observers added yet.</div>
        )}
        <div className="audit-team-status" role="status" aria-live="polite">
          {statusMessage}
        </div>
      </div>
    </div>
  )
}
