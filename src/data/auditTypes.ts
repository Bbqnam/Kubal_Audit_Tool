import type { CSSProperties } from 'react'
import type { AuditType, AuditTypeFamily } from '../types/audit'
import type { AuditPlanningType } from '../types/planning'

type AuditTypeTone = {
  background: string
  border: string
  text: string
  strongBackground: string
  strongText: string
}

type AuditTypeFamilyDefinition = {
  id: AuditTypeFamily
  label: AuditPlanningType
  tone: AuditTypeTone
}

type AuditTypeDefinition = {
  id: AuditType
  family: AuditTypeFamily
  label: string
  title: string
  shortLabel: string
  standard?: string
  workspace: 'vda63' | 'vda65' | 'generic'
  createDescription: string
}

const auditTypeFamilyDefinitions: Record<AuditTypeFamily, AuditTypeFamilyDefinition> = {
  'System Audit': {
    id: 'System Audit',
    label: 'System Audit',
    tone: {
      background: 'rgba(38, 104, 172, 0.12)',
      border: 'rgba(38, 104, 172, 0.2)',
      text: '#275f95',
      strongBackground: '#e9f2fb',
      strongText: '#1d4d7d',
    },
  },
  'Process Audit': {
    id: 'Process Audit',
    label: 'Process Audit',
    tone: {
      background: 'rgba(176, 117, 46, 0.12)',
      border: 'rgba(176, 117, 46, 0.2)',
      text: '#8a5518',
      strongBackground: '#fbf1e2',
      strongText: '#7b4a14',
    },
  },
  'Product Audit': {
    id: 'Product Audit',
    label: 'Product Audit',
    tone: {
      background: 'rgba(74, 134, 107, 0.12)',
      border: 'rgba(74, 134, 107, 0.18)',
      text: '#2e6d54',
      strongBackground: '#ebf6ef',
      strongText: '#245640',
    },
  },
  'Supplier Audit': {
    id: 'Supplier Audit',
    label: 'Supplier Audit',
    tone: {
      background: 'rgba(162, 95, 52, 0.12)',
      border: 'rgba(162, 95, 52, 0.18)',
      text: '#8d5127',
      strongBackground: '#f8eee8',
      strongText: '#764421',
    },
  },
  'Certification Audit': {
    id: 'Certification Audit',
    label: 'Certification Audit',
    tone: {
      background: 'rgba(96, 82, 154, 0.12)',
      border: 'rgba(96, 82, 154, 0.18)',
      text: '#5a4b95',
      strongBackground: '#f0ecfb',
      strongText: '#4e4181',
    },
  },
  'Sustainability Assessment': {
    id: 'Sustainability Assessment',
    label: 'Sustainability Assessment',
    tone: {
      background: 'rgba(53, 128, 94, 0.12)',
      border: 'rgba(53, 128, 94, 0.18)',
      text: '#2e7854',
      strongBackground: '#eaf6f0',
      strongText: '#235f43',
    },
  },
  'Compliance Review': {
    id: 'Compliance Review',
    label: 'Compliance Review',
    tone: {
      background: 'rgba(196, 113, 71, 0.12)',
      border: 'rgba(196, 113, 71, 0.18)',
      text: '#965d33',
      strongBackground: '#f9efe9',
      strongText: '#7f4f2c',
    },
  },
  'Follow-up Audit': {
    id: 'Follow-up Audit',
    label: 'Follow-up Audit',
    tone: {
      background: 'rgba(215, 147, 42, 0.14)',
      border: 'rgba(215, 147, 42, 0.18)',
      text: '#9b661f',
      strongBackground: '#fcf4e5',
      strongText: '#85581a',
    },
  },
  'Special Audit': {
    id: 'Special Audit',
    label: 'Special Audit',
    tone: {
      background: 'rgba(170, 77, 101, 0.12)',
      border: 'rgba(170, 77, 101, 0.18)',
      text: '#93455b',
      strongBackground: '#f8ecf0',
      strongText: '#7b394c',
    },
  },
  'Custom Audit': {
    id: 'Custom Audit',
    label: 'Custom Audit',
    tone: {
      background: 'rgba(20, 34, 49, 0.08)',
      border: 'rgba(20, 34, 49, 0.12)',
      text: '#324355',
      strongBackground: '#edf1f5',
      strongText: '#233242',
    },
  },
}

const auditTypeDefinitions: Record<AuditType, AuditTypeDefinition> = {
  template: {
    id: 'template',
    family: 'Custom Audit',
    label: 'Audit Template',
    title: 'Audit Template',
    shortLabel: 'Template',
    workspace: 'generic',
    createDescription: 'Shared audit template. Choose the applicable audit type, standard, or specialised workflow inside the record.',
  },
  vda63: {
    id: 'vda63',
    family: 'Process Audit',
    label: 'Process Audit',
    title: 'VDA 6.3 Process Audit',
    shortLabel: 'VDA 6.3',
    standard: 'VDA 6.3',
    workspace: 'vda63',
    createDescription: 'Structured VDA 6.3 process audit workflow with chapter scoring and report output.',
  },
  vda65: {
    id: 'vda65',
    family: 'Product Audit',
    label: 'Product Audit',
    title: 'VDA 6.5 Product Audit',
    shortLabel: 'VDA 6.5',
    standard: 'VDA 6.5',
    workspace: 'vda65',
    createDescription: 'Structured VDA 6.5 product audit workflow with checklist, findings, and results.',
  },
  system: {
    id: 'system',
    family: 'System Audit',
    label: 'System Audit',
    title: 'System Audit',
    shortLabel: 'System',
    workspace: 'generic',
    createDescription: 'General system audit record for ISO, IATF, or other management-system reviews.',
  },
  process: {
    id: 'process',
    family: 'Process Audit',
    label: 'Process Audit',
    title: 'Process Audit',
    shortLabel: 'Process',
    workspace: 'generic',
    createDescription: 'General process audit record for operational process reviews or local process checks.',
  },
  product: {
    id: 'product',
    family: 'Product Audit',
    label: 'Product Audit',
    title: 'Product Audit',
    shortLabel: 'Product',
    workspace: 'generic',
    createDescription: 'General product audit record for product assurance, release readiness, or product checks.',
  },
  supplier: {
    id: 'supplier',
    family: 'Supplier Audit',
    label: 'Supplier Audit',
    title: 'Supplier Audit',
    shortLabel: 'Supplier',
    workspace: 'generic',
    createDescription: 'Second-party supplier audit record for supplier development and surveillance.',
  },
  certification: {
    id: 'certification',
    family: 'Certification Audit',
    label: 'Certification Audit',
    title: 'Certification Audit',
    shortLabel: 'Certification',
    workspace: 'generic',
    createDescription: 'Certification or assurance audit record for third-party programmes and follow-up.',
  },
  sustainability: {
    id: 'sustainability',
    family: 'Sustainability Assessment',
    label: 'Sustainability Assessment',
    title: 'Sustainability Assessment',
    shortLabel: 'Sustainability',
    workspace: 'generic',
    createDescription: 'Sustainability assessment record for EcoVadis, ESG, or similar programmes.',
  },
  compliance: {
    id: 'compliance',
    family: 'Compliance Review',
    label: 'Compliance Review',
    title: 'Compliance Review',
    shortLabel: 'Compliance',
    workspace: 'generic',
    createDescription: 'Compliance review record for regulatory, reporting, or control-based checks.',
  },
  'follow-up': {
    id: 'follow-up',
    family: 'Follow-up Audit',
    label: 'Follow-up Audit',
    title: 'Follow-up Audit',
    shortLabel: 'Follow-up',
    workspace: 'generic',
    createDescription: 'Follow-up audit record for verifying closure and effectiveness of prior actions.',
  },
  special: {
    id: 'special',
    family: 'Special Audit',
    label: 'Special Audit',
    title: 'Special Audit',
    shortLabel: 'Special',
    workspace: 'generic',
    createDescription: 'Special audit record for escalations, one-off investigations, or ad hoc requests.',
  },
  custom: {
    id: 'custom',
    family: 'Custom Audit',
    label: 'Custom Audit',
    title: 'Custom Audit',
    shortLabel: 'Custom',
    workspace: 'generic',
    createDescription: 'Flexible audit record for local programmes that do not fit the standard catalogue.',
  },
}

const planningTypeToAuditTypeMap: Partial<Record<AuditPlanningType, AuditType>> = {
  'System Audit': 'system',
  'Process Audit': 'process',
  'Product Audit': 'product',
  'Supplier Audit': 'supplier',
  'Certification Audit': 'certification',
  'Sustainability Assessment': 'sustainability',
  'Compliance Review': 'compliance',
  'Follow-up Audit': 'follow-up',
  'Special Audit': 'special',
  'Custom Audit': 'custom',
}

export const creatableAuditTypes: AuditType[] = [
  'template',
]

export const auditTemplateSelectionTypes: AuditType[] = [
  'template',
  'vda63',
  'vda65',
  'system',
  'process',
  'product',
  'supplier',
  'certification',
  'sustainability',
  'compliance',
  'follow-up',
  'special',
  'custom',
]

export function getAuditTypeDefinition(auditType: AuditType) {
  return auditTypeDefinitions[auditType]
}

export function getAuditTypeFamily(value: AuditType | AuditPlanningType | string): AuditTypeFamily {
  if (value in auditTypeDefinitions) {
    return auditTypeDefinitions[value as AuditType].family
  }

  if (value in auditTypeFamilyDefinitions) {
    return value as AuditTypeFamily
  }

  return 'Custom Audit'
}

export function getAuditTypeFamilyLabel(value: AuditType | AuditPlanningType | string) {
  return auditTypeFamilyDefinitions[getAuditTypeFamily(value)].label
}

export function getAuditTypeTone(value: AuditType | AuditPlanningType | string) {
  return auditTypeFamilyDefinitions[getAuditTypeFamily(value)].tone
}

export function getAuditToneStyle(value: AuditType | AuditPlanningType | string, variant: 'soft' | 'strong' = 'soft'): CSSProperties {
  const tone = getAuditTypeTone(value)

  return {
    '--audit-type-bg': variant === 'strong' ? tone.strongBackground : tone.background,
    '--audit-type-border': tone.border,
    '--audit-type-text': variant === 'strong' ? tone.strongText : tone.text,
  } as CSSProperties
}

export function getAuditTypeLabel(auditType: AuditType) {
  return auditTypeDefinitions[auditType].label
}

export function getAuditTitleLabel(auditType: AuditType) {
  return auditTypeDefinitions[auditType].title
}

export function getAuditShortLabel(auditType: AuditType) {
  return auditTypeDefinitions[auditType].shortLabel
}

export function getAuditStandardLabel(auditType: AuditType) {
  return auditTypeDefinitions[auditType].standard ?? ''
}

export function getAuditWorkspaceKind(auditType: AuditType) {
  return auditTypeDefinitions[auditType].workspace
}

export function getAuditCreationDescription(auditType: AuditType) {
  return auditTypeDefinitions[auditType].createDescription
}

export function getAuditRouteSegmentLabel(segment: string) {
  if (segment in auditTypeDefinitions) {
    return auditTypeDefinitions[segment as AuditType].shortLabel
  }

  return segment
}

export function getExecutionAuditTypeForPlan(record: { standard: string; auditType: string }): AuditType | null {
  if (record.standard === 'VDA 6.3') {
    return 'vda63'
  }

  if (record.standard === 'VDA 6.5') {
    return 'vda65'
  }

  return planningTypeToAuditTypeMap[record.auditType as AuditPlanningType] ?? null
}
