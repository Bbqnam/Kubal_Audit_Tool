import { getAuditWorkspaceKind } from './auditTypes'
import type { AppNavItem, AuditRecord, AuditType, Vda63ChapterKey } from '../types/audit'
import { vda63TemplateChapterTitles } from '../features/vda63/data/questionBank'

export const appNavigation: AppNavItem[] = [
  { label: 'Dashboard', to: '/' },
  { label: 'Planning', to: '/planning' },
  { label: 'Audit Library', to: '/audits' },
]

const vda63SectionNavigation = [
  { label: 'Audit Info', segment: '' },
  { label: 'P2', segment: 'p2' },
  { label: 'P3', segment: 'p3' },
  { label: 'P4', segment: 'p4' },
  { label: 'P5', segment: 'p5' },
  { label: 'P6', segment: 'p6' },
  { label: 'P7', segment: 'p7' },
  { label: 'Summary', segment: 'summary' },
  { label: 'Action Plan', segment: 'action-plan' },
  { label: 'Report Preview', segment: 'report' },
]

const vda65SectionNavigation = [
  { label: 'Audit Info', segment: '' },
  { label: 'Product Info', segment: 'product' },
  { label: 'Checklist', segment: 'checklist' },
  { label: 'Results', segment: 'results' },
  { label: 'Defects / Findings', segment: 'findings' },
  { label: 'Action Plan', segment: 'action-plan' },
  { label: 'Report Preview', segment: 'report' },
]

const genericSectionNavigation = [
  { label: 'Audit Info', segment: '' },
  { label: 'Audit Report', segment: 'report' },
  { label: 'Action Plan', segment: 'action-plan' },
]

const planningSectionNavigation = [
  { label: 'Year Calendar', to: '/planning/calendar' },
  { label: '3-Year Plan', to: '/planning/three-year' },
  { label: 'Reports', to: '/planning/reports' },
  { label: 'Yearly Checklist', to: '/planning/checklist' },
]

export const vda63ChapterTitles: Record<Vda63ChapterKey, string> = vda63TemplateChapterTitles

export function getAuditRootPath(auditId: string, auditType: AuditType) {
  return `/audits/${auditId}/${auditType}`
}

export function getAuditSectionPath(auditId: string, auditType: AuditType, section?: string) {
  const basePath = getAuditRootPath(auditId, auditType)
  return section ? `${basePath}/${section}` : basePath
}

export function getAuditRecordHomePath(record: Pick<AuditRecord, 'id' | 'auditType'>) {
  return getAuditRootPath(record.id, record.auditType)
}

export function getAuditReportPath(record: Pick<AuditRecord, 'id' | 'auditType'>) {
  return getAuditSectionPath(record.id, record.auditType, 'report')
}

export function getPlanningCalendarPath({
  year,
  month,
  recordId,
}: {
  year?: number
  month?: number
  recordId?: string
} = {}) {
  const params = new URLSearchParams()

  if (year) {
    params.set('year', String(year))
  }

  if (month) {
    params.set('month', String(month))
  }

  if (recordId) {
    params.set('record', recordId)
  }

  const query = params.toString()
  return query ? `/planning/calendar?${query}` : '/planning/calendar'
}

export function getPlanningReportsPath({
  year,
  month,
}: {
  year?: number
  month?: number | 'all'
} = {}) {
  const params = new URLSearchParams()

  if (year) {
    params.set('year', String(year))
  }

  if (month) {
    params.set('month', String(month))
  }

  const query = params.toString()
  return query ? `/planning/reports?${query}` : '/planning/reports'
}

export function getModuleNavigation(module: AuditType | 'planning' | undefined, auditId?: string) {
  if (module === 'planning') {
    return planningSectionNavigation
  }

  if (!module || !auditId) {
    return []
  }

  if (module === 'vda63') {
    return vda63SectionNavigation.map<AppNavItem>((item) => ({
      label: item.label,
      to: getAuditSectionPath(auditId, module, item.segment),
    }))
  }

  if (module === 'vda65') {
    return vda65SectionNavigation.map<AppNavItem>((item) => ({
      label: item.label,
      to: getAuditSectionPath(auditId, module, item.segment),
    }))
  }

  if (getAuditWorkspaceKind(module) === 'generic') {
    return genericSectionNavigation.map<AppNavItem>((item) => ({
      label: item.label,
      to: getAuditSectionPath(auditId, module, item.segment),
    }))
  }

  return []
}
