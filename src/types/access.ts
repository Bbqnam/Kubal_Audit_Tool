export type WorkspaceUserPermission =
  | 'Admin'
  | 'Edit'
  | 'View'

export type WorkspaceUser = {
  id: string
  name: string
  position: string
  permission: WorkspaceUserPermission
}

export type WorkspaceUserHistoryAction =
  | 'Created'
  | 'Edited'
  | 'Permission changed'
  | 'Deleted'

export type WorkspaceUserHistoryEntry = {
  id: string
  timestamp: string
  action: WorkspaceUserHistoryAction
  summary: string
  actorName: string
  actorPosition: string
  userId?: string | null
  userName?: string | null
}
