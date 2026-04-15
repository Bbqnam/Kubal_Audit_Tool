const statusLabelMap: Record<string, string> = {
  Overdue: 'Delayed',
}

export function getDomainStatusLabel(value: string) {
  return statusLabelMap[value] ?? value
}

export const auditStatusFilterOptions = [
  { value: 'all', label: 'All audits' },
  { value: 'Not started', label: 'Not started' },
  { value: 'In progress', label: 'In progress' },
  { value: 'Completed', label: 'Completed' },
  { value: 'delayed', label: 'Delayed follow-up' },
] as const

export const planningStatusFilterOptions = [
  { value: 'Planned', label: 'Planned' },
  { value: 'Upcoming', label: 'Upcoming' },
  { value: 'In progress', label: 'In progress' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Overdue', label: 'Delayed' },
] as const
