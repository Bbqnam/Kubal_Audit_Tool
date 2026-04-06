export type AuditPlanningStandard =
  | 'VDA 6.3'
  | 'VDA 6.5'
  | 'IATF 16949'
  | 'ISO 9001'
  | 'ISO 14001'
  | 'ASI'
  | 'EcoVadis'
  | 'Supplier audits'
  | 'Other'
  | 'Custom'

export type AuditPlanningType =
  | 'System Audit'
  | 'Process Audit'
  | 'Product Audit'
  | 'Supplier Audit'
  | 'Certification Audit'
  | 'Sustainability Assessment'
  | 'Compliance Review'
  | 'Follow-up Audit'
  | 'Special Audit'
  | 'Custom Audit'

export type AuditPlanningCategory =
  | 'Quality Management'
  | 'Environmental Management'
  | 'Process'
  | 'Product'
  | 'Supplier'
  | 'Sustainability'
  | 'Compliance'
  | 'Special'
  | 'Custom'

export type InternalExternalClassification =
  | 'Internal'
  | 'External'
  | 'Supplier / second-party'
  | 'Certification / third-party'
  | 'Follow-up'
  | 'Special / ad hoc'

export type PlanningFrequency =
  | 'One-time'
  | 'Annual'
  | 'Biannual'
  | 'Quarterly'
  | 'Monthly'
  | 'Ad hoc'
  | 'Recurring'

export type AuditPlanStatus = 'Planned' | 'In progress' | 'Completed' | 'Overdue' | 'Cancelled'

export type AuditPlanCompletionResult = 'Pass' | 'Conditional' | 'Fail' | 'Closed' | ''

export type PlanningHistoryAction =
  | 'Created'
  | 'Imported'
  | 'Edited'
  | 'Rescheduled'
  | 'Completed'
  | 'Cancelled'
  | 'Duplicated'
  | 'Linked audit'

export type AuditPlanChangeHistoryEntry = {
  id: string
  timestamp: string
  action: PlanningHistoryAction
  summary: string
}

export type AuditPlanRecord = {
  id: string
  title: string
  standard: AuditPlanningStandard | string
  auditType: AuditPlanningType | string
  auditCategory: AuditPlanningCategory | string
  internalExternal: InternalExternalClassification
  department: string
  processArea: string
  site: string
  owner: string
  plannedStart: string
  plannedEnd: string
  year: number
  month: number
  frequency: PlanningFrequency | string
  status: AuditPlanStatus
  notes: string
  linkedAuditId: string | null
  actualCompletionDate: string | null
  completionResult: AuditPlanCompletionResult
  completionSummary: string
  createdAt: string
  updatedAt: string
  changeHistory: AuditPlanChangeHistoryEntry[]
  source?: 'seeded-excel' | 'manual'
}

export type PlanningChecklistYearStatus = 'Pending' | 'Updated'

export type PlanningChecklistYearEntry = {
  date: string | null
  status: PlanningChecklistYearStatus
}

export type YearlyPlanningChecklistItem = {
  id: string
  group: string
  title: string
  detail: string
  years: Record<number, PlanningChecklistYearEntry>
}

export type AuditPlanningStandardOption = {
  id: string
  label: AuditPlanningStandard | string
  auditType: AuditPlanningType | string
  auditCategory: AuditPlanningCategory | string
  internalExternal: InternalExternalClassification
  description: string
}
