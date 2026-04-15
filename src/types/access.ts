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
