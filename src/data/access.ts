import type { WorkspaceUser, WorkspaceUserPermission } from '../types/access'

export const workspaceUserPermissionOptions: WorkspaceUserPermission[] = [
  'Admin',
  'Edit',
  'View',
]

export const seedWorkspaceUsers: WorkspaceUser[] = [
  {
    id: 'user-admin-nam-nguyen',
    name: 'Nam Nguyen',
    position: 'Quality Manager',
    permission: 'Admin',
  },
  {
    id: 'user-clara-schmidt',
    name: 'Clara Schmidt',
    position: 'Internal Audit Lead',
    permission: 'Edit',
  },
  {
    id: 'user-mehdi-h',
    name: 'Mehdi H.',
    position: 'Supplier Quality Engineer',
    permission: 'Edit',
  },
  {
    id: 'user-milos-bauer',
    name: 'Milos Bauer',
    position: 'Operations Manager',
    permission: 'Edit',
  },
  {
    id: 'user-marta-kovac',
    name: 'Marta Kovac',
    position: 'Compliance Observer',
    permission: 'View',
  },
]
