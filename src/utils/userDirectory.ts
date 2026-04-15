import { seedWorkspaceUsers } from '../data/access'
import type { WorkspaceUser, WorkspaceUserPermission } from '../types/access'
import type { AuditParticipant, AuditParticipantRole } from '../types/audit'

function createUserId(name: string) {
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  if (normalized) {
    return `user-${normalized}`
  }

  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `user-${crypto.randomUUID()}`
  }

  return `user-${Math.random().toString(36).slice(2, 10)}`
}

export function sanitizeUserName(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

export function getDefaultPermissionForUser(name: string): WorkspaceUserPermission {
  return name.toLowerCase().includes('nam nguyen') ? 'Admin' : 'Edit'
}

export function parseLegacyUserReference(value: string) {
  const trimmedValue = sanitizeUserName(value)

  if (!trimmedValue) {
    return null
  }

  const [namePart] = trimmedValue.split(',').map((segment) => sanitizeUserName(segment))
  const name = namePart || trimmedValue

  return {
    name,
  }
}

export function normalizeWorkspaceUser(user: Partial<WorkspaceUser> & Pick<WorkspaceUser, 'name'>): WorkspaceUser {
  const name = sanitizeUserName(user.name)
  const position = sanitizeUserName(user.position ?? '')

  return {
    id: user.id ?? createUserId(name),
    name,
    position,
    permission: user.permission ?? getDefaultPermissionForUser(name),
  }
}

function isLegacySystemUser(candidate: WorkspaceUser & { role?: string }) {
  if (!candidate.name.trim()) {
    return false
  }

  if (candidate.permission === 'Admin') {
    return true
  }

  if (!('role' in candidate) || !candidate.role) {
    return true
  }

  return candidate.role !== 'Process Owner'
}

export function mergeWorkspaceUsers(users: WorkspaceUser[]) {
  const byName = new Map<string, WorkspaceUser>()

  seedWorkspaceUsers.forEach((user) => {
    const normalized = normalizeWorkspaceUser(user)
    byName.set(normalized.name, normalized)
  })

  users.forEach((user) => {
    const legacyCandidate = user as WorkspaceUser & { role?: string }

    if (!isLegacySystemUser(legacyCandidate)) {
      return
    }

    const normalized = normalizeWorkspaceUser(user)
    byName.set(normalized.name, normalized)
  })

  return [...byName.values()].sort((left, right) => left.name.localeCompare(right.name))
}

export function getAuditableUsers(users: WorkspaceUser[]) {
  return users
}

export function getUserOptionLabel(user: WorkspaceUser) {
  return user.position ? `${user.name} · ${user.position}` : user.name
}

function inferAuditParticipantRole(value: string): AuditParticipantRole {
  const normalized = value.toLowerCase()

  if (normalized.includes('lead auditor')) {
    return 'Lead auditor'
  }

  if (normalized.includes('observer')) {
    return 'Observer'
  }

  return 'Auditor'
}

function createParticipantId(userName: string) {
  return `participant-${createUserId(userName)}`
}

export function normalizeAuditParticipants(participants: Array<string | Partial<AuditParticipant>>) {
  return participants
    .map((participant) => {
      if (typeof participant === 'string') {
        const parsed = parseLegacyUserReference(participant)

        if (!parsed?.name) {
          return null
        }

        return {
          id: createParticipantId(parsed.name),
          userName: parsed.name,
          role: inferAuditParticipantRole(participant),
        } satisfies AuditParticipant
      }

      const userName = sanitizeUserName(participant.userName ?? '')

      if (!userName) {
        return null
      }

      return {
        id: participant.id ?? createParticipantId(userName),
        userName,
        role: participant.role === 'Lead auditor' || participant.role === 'Observer' ? participant.role : 'Auditor',
      } satisfies AuditParticipant
    })
    .filter((participant): participant is AuditParticipant => Boolean(participant))
}
