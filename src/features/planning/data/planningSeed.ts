import type {
  AuditPlanRecord,
  AuditPlanStatus,
  AuditPlanningStandardOption,
  YearlyPlanningChecklistItem,
} from '../../../types/planning'
import { buildPlanHistoryEntry } from '../services/planningFactory'
import { createAuditReferenceId, DEFAULT_PLANNING_ACTOR } from '../../../utils/traceability'

type StandardSeedDefinition = {
  title: string
  standard: AuditPlanRecord['standard']
  auditType: AuditPlanRecord['auditType']
  auditCategory: AuditPlanRecord['auditCategory']
  internalExternal: AuditPlanRecord['internalExternal']
  department: string
  processArea: string
  site: string
  owner: string
  frequency: AuditPlanRecord['frequency']
  description: string
}

type SeedOccurrence = [startWeek: number, endWeek: number, status?: AuditPlanStatus]

type SeedPlanSeries = {
  year: number
  label: keyof typeof standardSeedMap
  occurrences: SeedOccurrence[]
}

const workbookMonthSpans = [
  { month: 1, weeks: 4 },
  { month: 2, weeks: 4 },
  { month: 3, weeks: 5 },
  { month: 4, weeks: 4 },
  { month: 5, weeks: 5 },
  { month: 6, weeks: 4 },
  { month: 7, weeks: 4 },
  { month: 8, weeks: 5 },
  { month: 9, weeks: 4 },
  { month: 10, weeks: 5 },
  { month: 11, weeks: 4 },
  { month: 12, weeks: 4 },
] as const

const standardSeedMap = {
  'EcoVadis Assessment': {
    title: 'EcoVadis Sustainability Assessment',
    standard: 'EcoVadis',
    auditType: 'Sustainability Assessment',
    auditCategory: 'Sustainability',
    internalExternal: 'Certification / third-party',
    department: 'Sustainability Office',
    processArea: 'ESG Reporting',
    site: 'Kubal HQ',
    owner: 'Sustainability Lead',
    frequency: 'Annual',
    description: 'Third-party sustainability assessment cycle and scorecard preparation.',
  },
  ASI: {
    title: 'ASI Assurance Review',
    standard: 'ASI',
    auditType: 'Certification Audit',
    auditCategory: 'Sustainability',
    internalExternal: 'Certification / third-party',
    department: 'Sustainability Office',
    processArea: 'Responsible Sourcing',
    site: 'Kubal HQ',
    owner: 'Compliance Lead',
    frequency: 'Annual',
    description: 'Aluminium Stewardship Initiative assurance and follow-up planning.',
  },
  'ISO 9001': {
    title: 'ISO 9001 System Audit',
    standard: 'ISO 9001',
    auditType: 'System Audit',
    auditCategory: 'Quality Management',
    internalExternal: 'Internal',
    department: 'Quality',
    processArea: 'QMS',
    site: 'Kubal HQ',
    owner: 'Quality Manager',
    frequency: 'Annual',
    description: 'Quality management system audit coverage across the annual programme.',
  },
  'ISO 14001': {
    title: 'ISO 14001 System Audit',
    standard: 'ISO 14001',
    auditType: 'System Audit',
    auditCategory: 'Environmental Management',
    internalExternal: 'Internal',
    department: 'Environment',
    processArea: 'EMS',
    site: 'Kubal HQ',
    owner: 'EHS Manager',
    frequency: 'Annual',
    description: 'Environmental management system audit and compliance follow-up.',
  },
  'IATF 16949': {
    title: 'IATF 16949 System Audit',
    standard: 'IATF 16949',
    auditType: 'System Audit',
    auditCategory: 'Quality Management',
    internalExternal: 'Internal',
    department: 'Quality',
    processArea: 'Automotive QMS',
    site: 'Kubal HQ',
    owner: 'Lead Auditor',
    frequency: 'Annual',
    description: 'Automotive QMS surveillance planning and recurring internal audit coverage.',
  },
  'VDA 6.3 Process': {
    title: 'VDA 6.3 Process Audit',
    standard: 'VDA 6.3',
    auditType: 'Process Audit',
    auditCategory: 'Process',
    internalExternal: 'Internal',
    department: 'Operations',
    processArea: 'Core Manufacturing',
    site: 'Main Plant',
    owner: 'Process Excellence Lead',
    frequency: 'Annual',
    description: 'Process audit planning for the main manufacturing footprint.',
  },
  'VDA 6.3 (Moldshop)': {
    title: 'VDA 6.3 Process Audit - Moldshop',
    standard: 'VDA 6.3',
    auditType: 'Process Audit',
    auditCategory: 'Process',
    internalExternal: 'Internal',
    department: 'Moldshop',
    processArea: 'Tooling & Moldshop',
    site: 'Moldshop',
    owner: 'Moldshop Manager',
    frequency: 'Annual',
    description: 'Dedicated process audit cycle for the Moldshop area.',
  },
  'VDA 6.5 Product': {
    title: 'VDA 6.5 Product Audit',
    standard: 'VDA 6.5',
    auditType: 'Product Audit',
    auditCategory: 'Product',
    internalExternal: 'Internal',
    department: 'Quality',
    processArea: 'Product Release',
    site: 'Main Plant',
    owner: 'Product Quality Lead',
    frequency: 'Quarterly',
    description: 'Recurring product audit programme aligned to release and quality gates.',
  },
  Supplier: {
    title: 'Supplier Audit Programme',
    standard: 'Supplier audits',
    auditType: 'Supplier Audit',
    auditCategory: 'Supplier',
    internalExternal: 'Supplier / second-party',
    department: 'Supply Chain',
    processArea: 'Supplier Development',
    site: 'Supplier Network',
    owner: 'Supplier Quality Engineer',
    frequency: 'Annual',
    description: 'Second-party supplier audit coverage and supplier development reviews.',
  },
  'CO2 Emissions': {
    title: 'CO2 Emissions Compliance Review',
    standard: 'Other',
    auditType: 'Compliance Review',
    auditCategory: 'Sustainability',
    internalExternal: 'External',
    department: 'Sustainability Office',
    processArea: 'CO2 Reporting',
    site: 'Kubal HQ',
    owner: 'Energy Coordinator',
    frequency: 'Annual',
    description: 'Carbon reporting and emissions assurance activities.',
  },
} satisfies Record<string, StandardSeedDefinition>

const seedPlanSeries: SeedPlanSeries[] = [
  { year: 2025, label: 'EcoVadis Assessment', occurrences: [[7, 7, 'Completed'], [48, 48, 'Completed']] },
  { year: 2025, label: 'ISO 9001', occurrences: [[33, 33, 'Completed']] },
  { year: 2025, label: 'ISO 14001', occurrences: [[20, 20, 'Completed']] },
  { year: 2025, label: 'IATF 16949', occurrences: [[33, 33, 'Completed'], [40, 40, 'Completed']] },
  { year: 2025, label: 'VDA 6.3 Process', occurrences: [[10, 10, 'Completed']] },
  { year: 2025, label: 'VDA 6.3 (Moldshop)', occurrences: [[6, 6, 'Completed']] },
  { year: 2025, label: 'VDA 6.5 Product', occurrences: [[10, 10, 'Completed'], [17, 17, 'Completed'], [23, 23, 'Completed'], [50, 50, 'Completed']] },
  { year: 2025, label: 'Supplier', occurrences: [[22, 22, 'Completed']] },
  { year: 2025, label: 'CO2 Emissions', occurrences: [[4, 4, 'Completed']] },
  { year: 2026, label: 'EcoVadis Assessment', occurrences: [[5, 8], [31, 31]] },
  { year: 2026, label: 'ASI', occurrences: [[11, 11], [34, 34]] },
  { year: 2026, label: 'ISO 9001', occurrences: [[22, 22]] },
  { year: 2026, label: 'ISO 14001', occurrences: [[45, 45]] },
  { year: 2026, label: 'IATF 16949', occurrences: [[37, 37], [41, 41]] },
  { year: 2026, label: 'VDA 6.3 Process', occurrences: [[24, 24]] },
  { year: 2026, label: 'VDA 6.3 (Moldshop)', occurrences: [[16, 16]] },
  { year: 2026, label: 'VDA 6.5 Product', occurrences: [[8, 8], [28, 28], [50, 50]] },
  { year: 2026, label: 'Supplier', occurrences: [[38, 38]] },
  { year: 2026, label: 'CO2 Emissions', occurrences: [[4, 4, 'Completed']] },
  { year: 2027, label: 'EcoVadis Assessment', occurrences: [[5, 5], [35, 35]] },
  { year: 2027, label: 'ASI', occurrences: [[11, 11]] },
  { year: 2027, label: 'ISO 9001', occurrences: [[10, 10]] },
  { year: 2027, label: 'ISO 14001', occurrences: [[16, 16]] },
  { year: 2027, label: 'IATF 16949', occurrences: [[34, 34]] },
  { year: 2027, label: 'VDA 6.3 Process', occurrences: [[23, 23], [41, 41]] },
  { year: 2027, label: 'VDA 6.3 (Moldshop)', occurrences: [[15, 15]] },
  { year: 2027, label: 'VDA 6.5 Product', occurrences: [[7, 7], [16, 16], [24, 24], [50, 50]] },
  { year: 2027, label: 'Supplier', occurrences: [[18, 18]] },
  { year: 2027, label: 'CO2 Emissions', occurrences: [[4, 4]] },
]

const yearlyChecklistSeed: YearlyPlanningChecklistItem[] = [
  {
    id: 'checklist-competence-qms',
    group: 'Competence Matrix',
    title: 'QMS auditor competence',
    detail: 'ISO 9001 / ISO 14001 / IATF 16949 (QMS Auditor)',
    years: {
      2025: { date: '2025-02-10', status: 'Updated' },
      2026: { date: '2025-01-14', status: 'Updated' },
      2027: { date: null, status: 'Pending' },
    },
  },
  {
    id: 'checklist-competence-supplier',
    group: 'Competence Matrix',
    title: 'Supplier auditor competence',
    detail: 'Second Part Auditor (Suppliers)',
    years: {
      2025: { date: '2025-02-10', status: 'Updated' },
      2026: { date: '2025-01-14', status: 'Updated' },
      2027: { date: null, status: 'Pending' },
    },
  },
  {
    id: 'checklist-competence-vda63',
    group: 'Competence Matrix',
    title: 'Process auditor competence',
    detail: 'Process Auditor VDA 6.3',
    years: {
      2025: { date: '2025-02-10', status: 'Updated' },
      2026: { date: '2025-01-14', status: 'Updated' },
      2027: { date: null, status: 'Pending' },
    },
  },
  {
    id: 'checklist-competence-vda65',
    group: 'Competence Matrix',
    title: 'Product auditor competence',
    detail: 'Product Auditor VDA 6.5',
    years: {
      2025: { date: '2025-02-10', status: 'Updated' },
      2026: { date: '2025-01-14', status: 'Updated' },
      2027: { date: null, status: 'Pending' },
    },
  },
  {
    id: 'checklist-participation-status',
    group: 'Participation',
    title: 'Internal auditor participation',
    detail: 'Status of internal auditor',
    years: {
      2025: { date: '2025-09-03', status: 'Updated' },
      2026: { date: '2025-01-14', status: 'Updated' },
      2027: { date: null, status: 'Pending' },
    },
  },
  {
    id: 'checklist-qualification-list',
    group: 'Qualification status',
    title: 'Internal auditor list',
    detail: 'List of Internal Auditors',
    years: {
      2025: { date: '2025-02-10', status: 'Updated' },
      2026: { date: '2025-01-14', status: 'Updated' },
      2027: { date: null, status: 'Pending' },
    },
  },
  {
    id: 'checklist-calendar',
    group: 'Calendar',
    title: 'Internal audit calendar',
    detail: 'Internal audit calendar',
    years: {
      2025: { date: '2025-02-10', status: 'Updated' },
      2026: { date: '2025-01-14', status: 'Updated' },
      2027: { date: null, status: 'Pending' },
    },
  },
]

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function getMonthMetadataFromWeek(week: number) {
  let cursor = 0

  for (const item of workbookMonthSpans) {
    const nextCursor = cursor + item.weeks

    if (week > cursor && week <= nextCursor) {
      return {
        month: item.month,
        weekOfMonth: week - cursor,
      }
    }

    cursor = nextCursor
  }

  return {
    month: 12,
    weekOfMonth: 4,
  }
}

function getWorkbookWeekDate(year: number, week: number, edge: 'start' | 'end') {
  const { month, weekOfMonth } = getMonthMetadataFromWeek(week)
  const lastDay = new Date(year, month, 0).getDate()
  const baseDay = 1 + (weekOfMonth - 1) * 7
  const day = edge === 'start' ? baseDay : Math.min(lastDay, baseDay + 4)

  return new Date(Date.UTC(year, month - 1, Math.min(day, lastDay))).toISOString().slice(0, 10)
}

export function createSeedPlanningRecords(): AuditPlanRecord[] {
  const usedAuditIds = new Set<string>()

  return seedPlanSeries.flatMap((series) => {
    const seed = standardSeedMap[series.label]

    return series.occurrences.map((occurrence, index) => {
      const [startWeek, endWeek, seededStatus] = occurrence
      const plannedStart = getWorkbookWeekDate(series.year, startWeek, 'start')
      const plannedEnd = getWorkbookWeekDate(series.year, endWeek, 'end')
      const timestamp = `${plannedStart}T08:00:00.000Z`
      const auditId = createAuditReferenceId(plannedStart, usedAuditIds)
      usedAuditIds.add(auditId)

      return {
        id: `plan-${series.year}-${slugify(series.label)}-${String(index + 1).padStart(2, '0')}`,
        auditId,
        title: seed.title,
        standard: seed.standard,
        auditType: seed.auditType,
        auditCategory: seed.auditCategory,
        internalExternal: seed.internalExternal,
        department: seed.department,
        processArea: seed.processArea,
        site: seed.site,
        owner: seed.owner,
        plannedStart,
        plannedEnd,
        year: series.year,
        month: Number(plannedStart.slice(5, 7)),
        frequency: seed.frequency,
        status: seededStatus ?? 'Planned',
        notes: `Transferred from Internal Audit Plan_Year Calendar.xlsx (${series.year}) for ${seed.processArea}.`,
        linkedAuditId: null,
        actualCompletionDate: seededStatus === 'Completed' ? plannedEnd : null,
        completionDateChangeReason: '',
        completionResult: seededStatus === 'Completed' ? 'Closed' : '',
        completionSummary: seededStatus === 'Completed' ? 'Completed according to imported calendar history.' : '',
        createdAt: timestamp,
        updatedAt: timestamp,
        updatedBy: DEFAULT_PLANNING_ACTOR,
        changeHistory: [
          buildPlanHistoryEntry('Imported', `Imported from workbook planning row for ${series.year}.`, timestamp),
        ],
        source: 'seeded-excel',
      }
    })
  })
}

export function createSeedPlanningChecklist() {
  return yearlyChecklistSeed
}

export const auditPlanningStandardOptions: AuditPlanningStandardOption[] = [
  ...Object.entries(standardSeedMap).map(([id, value]) => ({
    id: slugify(id),
    label: value.standard,
    auditType: value.auditType,
    auditCategory: value.auditCategory,
    internalExternal: value.internalExternal,
    description: value.description,
  })),
  {
    id: 'custom-audit-type',
    label: 'Custom',
    auditType: 'Custom Audit',
    auditCategory: 'Custom',
    internalExternal: 'Special / ad hoc',
    description: 'Use for local audit programmes or custom assurance activities beyond the standard catalogue.',
  },
]
