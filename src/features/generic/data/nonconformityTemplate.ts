import type { AuditType } from '../../../types/audit'

export type NonconformityTemplateStandard = 'ISO 9001' | 'ISO 14001' | 'IATF 16949' | 'ASI'

export type KubalProcessAreaGroup = {
  label: string
  options: Array<{
    id: string
    label: string
  }>
}

export type SharedAuditTemplateOption = {
  id: string
  label: string
  standard: string
  auditType: AuditType
  suggestedTitle: string
  workflowLabel: string
}

export type ClauseTreeNode = {
  code: string
  title: string
  level: number
  children: ClauseTreeNode[]
}

export const nonconformityTypeOptions = [
  'Major nonconformity',
  'Minor nonconformity',
  'Observation',
  'Improvement suggestion',
] as const

export const kubalProcessAreaGroups: KubalProcessAreaGroup[] = [
  {
    label: 'Management processes',
    options: [
      { id: '2.1', label: '2.1 Strategic business planning' },
      { id: '2.2', label: '2.2 Internal revision and risk management' },
      { id: '2.3', label: '2.3 Finance' },
      { id: '2.4', label: '2.4 Environment' },
      { id: '2.6', label: '2.6 Quality management' },
    ],
  },
  {
    label: 'Main operational processes',
    options: [
      { id: '1.1', label: '1.1 Marketing and sales' },
      { id: '1.2', label: '1.2 Process development' },
      { id: '1.4.1', label: '1.4.1 Production Electrolysis' },
      { id: '1.4.2', label: '1.4.2 Production Cast House' },
      { id: '1.5', label: '1.5 Transportation and logistics' },
    ],
  },
  {
    label: 'Supporting processes',
    options: [
      { id: '1.3', label: '1.3 Purchasing' },
      { id: '3.1.1', label: '3.1.1 HR management' },
      { id: '3.1.2', label: '3.1.2 Health and safety' },
      { id: '3.2', label: '3.2 Maintenance' },
      { id: '3.3', label: '3.3 IT management' },
    ],
  },
]

export const supportedNonconformityStandards: NonconformityTemplateStandard[] = ['ISO 9001', 'ISO 14001', 'IATF 16949', 'ASI']

export const sharedAuditTemplateOptions: SharedAuditTemplateOption[] = [
  {
    id: 'iso-9001',
    label: 'ISO 9001 System Audit',
    standard: 'ISO 9001',
    auditType: 'system',
    suggestedTitle: 'ISO 9001 Audit Report',
    workflowLabel: 'Shared report template',
  },
  {
    id: 'iso-14001',
    label: 'ISO 14001 System Audit',
    standard: 'ISO 14001',
    auditType: 'system',
    suggestedTitle: 'ISO 14001 Audit Report',
    workflowLabel: 'Shared report template',
  },
  {
    id: 'iatf-16949',
    label: 'IATF 16949 System Audit',
    standard: 'IATF 16949',
    auditType: 'system',
    suggestedTitle: 'IATF 16949 Audit Report',
    workflowLabel: 'Shared report template',
  },
  {
    id: 'vda-63',
    label: 'VDA 6.3 Process Audit',
    standard: 'VDA 6.3',
    auditType: 'vda63',
    suggestedTitle: 'VDA 6.3 Audit Report',
    workflowLabel: 'Dedicated VDA 6.3 workflow',
  },
  {
    id: 'vda-65',
    label: 'VDA 6.5 Product Audit',
    standard: 'VDA 6.5',
    auditType: 'vda65',
    suggestedTitle: 'VDA 6.5 Audit Report',
    workflowLabel: 'Dedicated VDA 6.5 workflow',
  },
  {
    id: 'ecovadis',
    label: 'EcoVadis Sustainability Assessment',
    standard: 'EcoVadis',
    auditType: 'sustainability',
    suggestedTitle: 'EcoVadis Audit Report',
    workflowLabel: 'Shared report template',
  },
  {
    id: 'asi',
    label: 'ASI Assurance Review',
    standard: 'ASI',
    auditType: 'certification',
    suggestedTitle: 'ASI Audit Report',
    workflowLabel: 'Shared report template',
  },
  {
    id: 'supplier',
    label: 'Supplier Audit Programme',
    standard: 'Supplier audits',
    auditType: 'supplier',
    suggestedTitle: 'Supplier Audit Report',
    workflowLabel: 'Shared report template',
  },
  {
    id: 'other',
    label: 'Other / Local programme',
    standard: 'Other',
    auditType: 'custom',
    suggestedTitle: 'Audit Report',
    workflowLabel: 'Shared report template',
  },
]

const iso9001ClauseOptions = [
  '4.1', '4.2', '4.3', '4.4',
  '5.1', '5.1.1', '5.1.2', '5.2', '5.2.1', '5.2.2', '5.3',
  '6.1', '6.1.1', '6.1.2', '6.2', '6.2.1', '6.2.2', '6.3',
  '7.1', '7.1.1', '7.1.2', '7.1.3', '7.1.4', '7.1.5', '7.1.5.1', '7.1.5.2', '7.1.6', '7.2', '7.3', '7.4', '7.5', '7.5.1', '7.5.2', '7.5.3',
  '8.1', '8.2', '8.2.1', '8.2.2', '8.2.3', '8.3', '8.3.1', '8.3.2', '8.3.3', '8.3.4', '8.3.5', '8.3.6', '8.4', '8.4.1', '8.4.2', '8.4.3', '8.5', '8.5.1', '8.5.2', '8.5.3', '8.5.4', '8.5.5', '8.5.6', '8.6', '8.7', '8.7.1', '8.7.2',
  '9.1', '9.1.1', '9.1.2', '9.1.3', '9.2', '9.2.1', '9.2.2', '9.3', '9.3.1', '9.3.2', '9.3.3',
  '10.1', '10.2', '10.2.1', '10.2.2', '10.3',
] as const

const iso14001ClauseOptions = [
  '4.1', '4.2', '4.3', '4.4',
  '5.1', '5.2', '5.3',
  '6.1', '6.1.1', '6.1.2', '6.1.3', '6.1.4', '6.2', '6.2.1', '6.2.2',
  '7.1', '7.2', '7.3', '7.4', '7.4.1', '7.4.2', '7.4.3',
  '8.1', '8.2',
  '9.1', '9.1.1', '9.1.2', '9.1.3', '9.2', '9.2.1', '9.2.2', '9.3', '9.3.1', '9.3.2', '9.3.3',
  '10.1', '10.2', '10.3',
] as const

const iatf16949ClauseOptions = [
  '4.1', '4.2', '4.3', '4.4', '4.4.1.1', '4.4.1.2',
  '5.1', '5.1.1', '5.1.1.1', '5.1.1.2', '5.1.1.3', '5.1.2', '5.2', '5.2.1', '5.2.2', '5.3', '5.3.1',
  '6.1', '6.1.1', '6.1.2', '6.1.2.1', '6.1.2.2', '6.1.2.3', '6.2', '6.2.1', '6.2.2', '6.2.2.1', '6.3', '6.3.1',
  '7.1', '7.1.1', '7.1.2', '7.1.3', '7.1.3.1', '7.1.4', '7.1.4.1', '7.1.5', '7.1.5.1', '7.1.5.1.1', '7.1.5.1.2', '7.1.5.2', '7.1.5.2.1', '7.1.5.3.1', '7.1.5.3.2', '7.1.6', '7.2', '7.2.1', '7.2.2', '7.2.3', '7.2.4', '7.3', '7.3.1', '7.3.2', '7.4', '7.5', '7.5.1', '7.5.1.1', '7.5.2', '7.5.3', '7.5.3.2.1', '7.5.3.2.2',
  '8.1', '8.1.1', '8.1.2', '8.2', '8.2.1', '8.2.1.1', '8.2.2', '8.2.2.1', '8.2.3', '8.2.3.1', '8.2.3.1.1', '8.2.3.1.2', '8.2.3.1.3', '8.2.3.1.4',
  '8.3', '8.3.1', '8.3.2', '8.3.2.1', '8.3.2.2', '8.3.2.3', '8.3.3', '8.3.3.1', '8.3.3.2', '8.3.3.3', '8.3.3.4', '8.3.3.5', '8.3.4', '8.3.4.1', '8.3.4.2', '8.3.4.3', '8.3.4.4', '8.3.5', '8.3.5.1', '8.3.5.2', '8.3.6', '8.3.6.1',
  '8.4', '8.4.1', '8.4.1.1', '8.4.1.2', '8.4.1.3', '8.4.2', '8.4.2.1', '8.4.2.2', '8.4.2.3', '8.4.2.4', '8.4.2.4.1', '8.4.2.5', '8.4.3', '8.4.3.1', '8.4.3.2',
  '8.5', '8.5.1', '8.5.1.1', '8.5.1.2', '8.5.1.3', '8.5.1.4', '8.5.1.5', '8.5.1.6', '8.5.1.7', '8.5.1.8', '8.5.2', '8.5.2.1', '8.5.2.2', '8.5.3', '8.5.4', '8.5.4.1', '8.5.5', '8.5.5.1', '8.5.5.2', '8.5.6', '8.5.6.1', '8.6', '8.6.1', '8.6.2', '8.6.3', '8.6.4', '8.6.5', '8.6.6', '8.7', '8.7.1', '8.7.1.1', '8.7.1.2', '8.7.1.3', '8.7.1.4', '8.7.1.5', '8.7.2',
  '9.1', '9.1.1', '9.1.1.1', '9.1.1.2', '9.1.1.3', '9.1.2', '9.1.2.1', '9.1.3', '9.1.3.1', '9.2', '9.2.1', '9.2.2', '9.2.2.1', '9.2.2.2', '9.2.2.3', '9.2.2.4', '9.3', '9.3.1', '9.3.1.1', '9.3.2', '9.3.2.1', '9.3.2.2', '9.3.2.3', '9.3.2.4', '9.3.3', '9.3.3.1',
  '10.1', '10.2', '10.2.1', '10.2.2', '10.2.3', '10.2.4', '10.2.5', '10.2.6', '10.3',
] as const

const asiClauseOptions = [
  '1.1', '1.2', '1.3', '1.4',
  '2.1', '2.2', '2.3',
  '3.1', '3.2', '3.3', '3.4', '3.5',
  '4.1', '4.2', '4.3',
  '5.1', '5.2', '5.3', '5.4',
  '6.1', '6.2', '6.3', '6.4',
] as const

const clauseCatalogByStandard: Record<NonconformityTemplateStandard, readonly string[]> = {
  'ISO 9001': iso9001ClauseOptions,
  'ISO 14001': iso14001ClauseOptions,
  'IATF 16949': iatf16949ClauseOptions,
  ASI: asiClauseOptions,
}

const commonManagementChapterTitles: Record<string, string> = {
  '4': 'Context of the organization',
  '5': 'Leadership',
  '6': 'Planning',
  '7': 'Support',
  '8': 'Operation',
  '9': 'Performance evaluation',
  '10': 'Improvement',
}

const iso9001ClauseTitleMap: Record<string, string> = {
  '4.1': 'Understanding the organization and its context',
  '4.2': 'Interested parties and expectations',
  '4.3': 'Scope of the quality management system',
  '4.4': 'Quality management system and processes',
  '5.1': 'Leadership and commitment',
  '5.1.1': 'General leadership',
  '5.1.2': 'Customer focus',
  '5.2': 'Quality policy',
  '5.2.1': 'Establishing the quality policy',
  '5.2.2': 'Communicating the quality policy',
  '5.3': 'Roles, responsibilities and authorities',
  '6.1': 'Risks and opportunities',
  '6.1.1': 'General risk planning',
  '6.1.2': 'Actions to address risks and opportunities',
  '6.2': 'Quality objectives and planning',
  '6.2.1': 'Quality objectives',
  '6.2.2': 'Planning to achieve objectives',
  '6.3': 'Planning changes',
  '7.1': 'Resources',
  '7.1.1': 'General resources',
  '7.1.2': 'People',
  '7.1.3': 'Infrastructure',
  '7.1.4': 'Process environment',
  '7.1.5': 'Monitoring and measuring resources',
  '7.1.5.1': 'General monitoring resources',
  '7.1.5.2': 'Measurement traceability',
  '7.1.6': 'Organizational knowledge',
  '7.2': 'Competence',
  '7.3': 'Awareness',
  '7.4': 'Communication',
  '7.5': 'Documented information',
  '7.5.1': 'General documented information',
  '7.5.2': 'Creating and updating',
  '7.5.3': 'Control of documented information',
  '8.1': 'Operational planning and control',
  '8.2': 'Requirements for products and services',
  '8.2.1': 'Customer communication',
  '8.2.2': 'Determining requirements',
  '8.2.3': 'Review of requirements',
  '8.3': 'Design and development',
  '8.3.1': 'General design and development',
  '8.3.2': 'Design planning',
  '8.3.3': 'Design inputs',
  '8.3.4': 'Design controls',
  '8.3.5': 'Design outputs',
  '8.3.6': 'Design changes',
  '8.4': 'Externally provided processes, products and services',
  '8.4.1': 'General external provider control',
  '8.4.2': 'Type and extent of control',
  '8.4.3': 'Information for external providers',
  '8.5': 'Production and service provision',
  '8.5.1': 'Control of production and service provision',
  '8.5.2': 'Identification and traceability',
  '8.5.3': 'Property belonging to customers or providers',
  '8.5.4': 'Preservation',
  '8.5.5': 'Post-delivery activities',
  '8.5.6': 'Control of changes',
  '8.6': 'Release of products and services',
  '8.7': 'Control of nonconforming outputs',
  '8.7.1': 'Nonconforming outputs handling',
  '8.7.2': 'Nonconforming outputs records',
  '9.1': 'Monitoring, measurement, analysis and evaluation',
  '9.1.1': 'General monitoring requirements',
  '9.1.2': 'Customer satisfaction',
  '9.1.3': 'Analysis and evaluation',
  '9.2': 'Internal audit',
  '9.2.1': 'Internal audit general',
  '9.2.2': 'Internal audit programme',
  '9.3': 'Management review',
  '9.3.1': 'General management review',
  '9.3.2': 'Management review inputs',
  '9.3.3': 'Management review outputs',
  '10.1': 'General improvement',
  '10.2': 'Nonconformity and corrective action',
  '10.2.1': 'Reaction to nonconformity',
  '10.2.2': 'Corrective action effectiveness',
  '10.3': 'Continual improvement',
}

const iso14001ClauseTitleMap: Record<string, string> = {
  '4.1': 'Understanding the organization and its context',
  '4.2': 'Interested parties and needs',
  '4.3': 'Scope of the environmental management system',
  '4.4': 'Environmental management system',
  '5.1': 'Leadership and commitment',
  '5.2': 'Environmental policy',
  '5.3': 'Roles, responsibilities and authorities',
  '6.1': 'Risks, opportunities and planning actions',
  '6.1.1': 'General environmental planning',
  '6.1.2': 'Environmental aspects',
  '6.1.3': 'Compliance obligations',
  '6.1.4': 'Planning action',
  '6.2': 'Environmental objectives and planning',
  '6.2.1': 'Environmental objectives',
  '6.2.2': 'Planning actions for objectives',
  '7.1': 'Resources',
  '7.2': 'Competence',
  '7.3': 'Awareness',
  '7.4': 'Communication',
  '7.4.1': 'General communication',
  '7.4.2': 'Internal communication',
  '7.4.3': 'External communication',
  '8.1': 'Operational planning and control',
  '8.2': 'Emergency preparedness and response',
  '9.1': 'Monitoring, measurement, analysis and evaluation',
  '9.1.1': 'General monitoring requirements',
  '9.1.2': 'Compliance evaluation',
  '9.1.3': 'Analysis and evaluation',
  '9.2': 'Internal audit',
  '9.2.1': 'Internal audit general',
  '9.2.2': 'Internal audit programme',
  '9.3': 'Management review',
  '9.3.1': 'General management review',
  '9.3.2': 'Management review inputs',
  '9.3.3': 'Management review outputs',
  '10.1': 'General improvement',
  '10.2': 'Nonconformity and corrective action',
  '10.3': 'Continual improvement',
}

const iatfSupplementClauseTitleMap: Record<string, string> = {
  '4.4.1.1': 'Product and process conformity',
  '4.4.1.2': 'Product safety',
  '5.1.1.1': 'Corporate responsibility',
  '5.1.1.2': 'Process effectiveness and efficiency',
  '5.1.1.3': 'Process owners',
  '5.3.1': 'Roles and authorities - supplemental',
  '6.1.2.1': 'Risk analysis',
  '6.1.2.2': 'Preventive action',
  '6.1.2.3': 'Contingency plans',
  '6.2.2.1': 'Quality objectives - supplemental',
  '6.3.1': 'Planning changes - supplemental',
  '7.1.3.1': 'Plant, facility and equipment planning',
  '7.1.4.1': 'Process environment - supplemental',
  '7.1.5.1.1': 'Measurement systems analysis',
  '7.1.5.1.2': 'Calibration / verification records',
  '7.1.5.2.1': 'Calibration / verification laboratory',
  '7.1.5.3.1': 'Internal laboratory',
  '7.1.5.3.2': 'External laboratory',
  '7.2.1': 'Competence - supplemental',
  '7.2.2': 'On-the-job training',
  '7.2.3': 'Internal auditor competency',
  '7.2.4': 'Second-party auditor competency',
  '7.3.1': 'Awareness - supplemental',
  '7.3.2': 'Employee motivation and empowerment',
  '7.5.1.1': 'QMS documentation - supplemental',
  '7.5.3.2.1': 'Record retention',
  '7.5.3.2.2': 'Engineering specifications',
  '8.1.1': 'Operational planning - supplemental',
  '8.1.2': 'Confidentiality',
  '8.2.1.1': 'Customer communication - supplemental',
  '8.2.2.1': 'Determining requirements - supplemental',
  '8.2.3.1': 'Customer requirement review - supplemental',
  '8.2.3.1.1': 'Review requirements - supplemental',
  '8.2.3.1.2': 'Customer-designated special characteristics',
  '8.2.3.1.3': 'Manufacturing feasibility',
  '8.2.3.1.4': 'Customer requirements',
  '8.3.2.1': 'Design planning - supplemental',
  '8.3.2.2': 'Product design skills',
  '8.3.2.3': 'Embedded software development',
  '8.3.3.1': 'Product design input',
  '8.3.3.2': 'Manufacturing process design input',
  '8.3.3.3': 'Special characteristics',
  '8.3.3.4': 'Error-proofing',
  '8.3.3.5': 'Management of change',
  '8.3.4.1': 'Monitoring',
  '8.3.4.2': 'Design validation',
  '8.3.4.3': 'Prototype programme',
  '8.3.4.4': 'Product approval process',
  '8.3.5.1': 'Design outputs - supplemental',
  '8.3.5.2': 'Manufacturing process outputs',
  '8.3.6.1': 'Design changes - supplemental',
  '8.4.1.1': 'External provider control - supplemental',
  '8.4.1.2': 'Supplier selection process',
  '8.4.1.3': 'Customer-directed sources',
  '8.4.2.1': 'Type and extent of control - supplemental',
  '8.4.2.2': 'Statutory and regulatory requirements',
  '8.4.2.3': 'Supplier QMS development',
  '8.4.2.4': 'Supplier monitoring',
  '8.4.2.4.1': 'Second-party audits',
  '8.4.2.5': 'Supplier development',
  '8.4.3.1': 'Information for external providers - supplemental',
  '8.4.3.2': 'Supplier development requirements',
  '8.5.1.1': 'Control plan',
  '8.5.1.2': 'Standardized work',
  '8.5.1.3': 'Verification of job setups',
  '8.5.1.4': 'Verification after shutdown',
  '8.5.1.5': 'Total productive maintenance',
  '8.5.1.6': 'Tooling and equipment management',
  '8.5.1.7': 'Production scheduling',
  '8.5.1.8': 'Production control - supplemental',
  '8.5.2.1': 'Identification and traceability - supplemental',
  '8.5.2.2': 'Product status',
  '8.5.4.1': 'Preservation - supplemental',
  '8.5.5.1': 'Service feedback information',
  '8.5.5.2': 'Service agreement with customer',
  '8.5.6.1': 'Control of changes - supplemental',
  '8.6.1': 'Release of products - supplemental',
  '8.6.2': 'Layout inspection and functional testing',
  '8.6.3': 'Appearance items',
  '8.6.4': 'Verification and acceptance conformity',
  '8.6.5': 'Statutory and regulatory conformity',
  '8.6.6': 'Acceptance criteria',
  '8.7.1.1': 'Customer authorization for concession',
  '8.7.1.2': 'Control of nonconforming product',
  '8.7.1.3': 'Control of suspect product',
  '8.7.1.4': 'Rework control',
  '8.7.1.5': 'Repair control',
  '9.1.1.1': 'Manufacturing process monitoring',
  '9.1.1.2': 'Statistical tools identification',
  '9.1.1.3': 'Statistical concepts application',
  '9.1.2.1': 'Customer satisfaction - supplemental',
  '9.1.3.1': 'Prioritization',
  '9.2.2.1': 'Internal audit programme',
  '9.2.2.2': 'Quality management system audit',
  '9.2.2.3': 'Manufacturing process audit',
  '9.2.2.4': 'Product audit',
  '9.3.1.1': 'Management review - supplemental',
  '9.3.2.1': 'Management review inputs - supplemental',
  '9.3.2.2': 'Review input - cost of poor quality',
  '9.3.2.3': 'Review input - process effectiveness',
  '9.3.2.4': 'Review input - process efficiency',
  '9.3.3.1': 'Management review outputs - supplemental',
  '10.2.3': 'Problem solving',
  '10.2.4': 'Error-proofing',
  '10.2.5': 'Warranty management systems',
  '10.2.6': 'Customer complaints and field failures',
}

const asiClauseTitleMap: Record<string, string> = {
  '1': 'Governance, policy, and management systems',
  '1.1': 'Governance and accountability',
  '1.2': 'Policy commitments',
  '1.3': 'Risk-based due diligence',
  '1.4': 'Objectives, controls, and review',
  '2': 'Legal compliance and responsible business',
  '2.1': 'Legal and regulatory compliance',
  '2.2': 'Business integrity and ethical conduct',
  '2.3': 'Responsible sourcing and procurement controls',
  '3': 'Human rights and labour rights',
  '3.1': 'Human rights due diligence',
  '3.2': 'Forced labour prevention',
  '3.3': 'Child labour prevention',
  '3.4': 'Working conditions and remuneration',
  '3.5': 'Freedom of association and grievance mechanisms',
  '4': 'Health, safety, and emergency preparedness',
  '4.1': 'Occupational health and safety controls',
  '4.2': 'Training, competence, and awareness',
  '4.3': 'Emergency response and incident preparedness',
  '5': 'Environmental stewardship and climate',
  '5.1': 'Environmental aspects and impact control',
  '5.2': 'Energy use and greenhouse gases',
  '5.3': 'Waste, emissions, and resource efficiency',
  '5.4': 'Biodiversity and land-use stewardship',
  '6': 'Community, transparency, and stakeholder engagement',
  '6.1': 'Community engagement',
  '6.2': 'Affected stakeholders and indigenous peoples',
  '6.3': 'Transparency, claims, and reporting',
  '6.4': 'Complaints, remedy, and follow-up',
}

const clauseTitleMapByStandard: Record<NonconformityTemplateStandard, Record<string, string>> = {
  'ISO 9001': {
    ...commonManagementChapterTitles,
    ...iso9001ClauseTitleMap,
  },
  'ISO 14001': {
    ...commonManagementChapterTitles,
    ...iso14001ClauseTitleMap,
  },
  'IATF 16949': {
    ...commonManagementChapterTitles,
    ...iso9001ClauseTitleMap,
    ...iatfSupplementClauseTitleMap,
  },
  ASI: {
    ...asiClauseTitleMap,
  },
}

export function normalizeNonconformityStandard(standard: string): NonconformityTemplateStandard | null {
  const normalized = standard.trim().toLowerCase()

  if (normalized === 'iso 9001' || normalized === 'iso9001') {
    return 'ISO 9001'
  }

  if (normalized === 'iso 14001' || normalized === 'iso14001') {
    return 'ISO 14001'
  }

  if (normalized === 'iatf 16949' || normalized === 'iatf16949') {
    return 'IATF 16949'
  }

  if (normalized === 'asi') {
    return 'ASI'
  }

  return null
}

export function getClauseOptionsForStandard(standard: string) {
  const normalizedStandard = normalizeNonconformityStandard(standard)

  return normalizedStandard ? clauseCatalogByStandard[normalizedStandard] : []
}

export function supportsClauseCatalog(standard: string) {
  return getClauseOptionsForStandard(standard).length > 0
}

export function getClauseTitle(standard: string, clause: string) {
  const normalizedStandard = normalizeNonconformityStandard(standard)

  if (!normalizedStandard) {
    return ''
  }

  const titles = clauseTitleMapByStandard[normalizedStandard]

  if (titles[clause]) {
    return titles[clause]
  }

  const segments = clause.split('.')

  while (segments.length > 1) {
    segments.pop()
    const parentCode = segments.join('.')

    if (titles[parentCode]) {
      return `${titles[parentCode]} - subclause`
    }
  }

  return 'Clause reference'
}

export function getClauseRequirementText(standard: string, clause: string) {
  const normalizedStandard = normalizeNonconformityStandard(standard)
  const clauseTitle = getClauseTitle(standard, clause)

  if (!normalizedStandard) {
    return clauseTitle ? `${clause} ${clauseTitle}` : clause
  }

  const chapter = clause.split('.')[0] ?? clause

  const chapterIntent: Record<string, string> = {
    '4': 'This chapter expects the organization to understand its business context, relevant internal and external issues, interested-party expectations, and the defined scope and interaction of the management-system processes.',
    '5': 'This chapter expects leadership to visibly own the management system, set policy and direction, assign accountability, and ensure the system is integrated into day-to-day management and decision making.',
    '6': 'This chapter expects the organization to translate strategy into structured planning, including risks, opportunities, objectives, action plans, and controlled changes.',
    '7': 'This chapter expects the organization to provide the support structure for effective operation, including people, infrastructure, competence, awareness, communication, and controlled information.',
    '8': 'This chapter expects operational activities to be defined, controlled, verified, and adjusted so customer, statutory, regulatory, and internal requirements are consistently achieved.',
    '9': 'This chapter expects performance to be measured, analyzed, audited, reviewed, and escalated through a defined management rhythm.',
    '10': 'This chapter expects the organization to react to problems, remove causes, verify effectiveness, and drive ongoing improvement rather than only correcting symptoms.',
  }

  const asiChapterIntent: Record<string, string> = {
    '1': 'This chapter expects the organization to define governance, policy direction, management-system controls, due diligence, and review mechanisms that support ASI assurance commitments.',
    '2': 'This chapter expects legal compliance and responsible-business controls to be defined, implemented, and evidenced across the relevant operations and supply-chain interfaces.',
    '3': 'This chapter expects the organization to identify and control human-rights and labour-rights risks, respond to grievances, and show that working conditions are managed responsibly.',
    '4': 'This chapter expects health, safety, emergency preparedness, and workforce awareness controls to be managed systematically and supported by evidence.',
    '5': 'This chapter expects environmental stewardship obligations such as energy, emissions, waste, and broader environmental impacts to be identified, controlled, and reviewed.',
    '6': 'This chapter expects stakeholder engagement, transparency, reporting, and complaint handling to be structured, traceable, and responsive.',
  }

  const loweredTitle = clauseTitle.toLowerCase()
  const detailedExpectation = (() => {
    if (loweredTitle.includes('policy')) {
      return 'The policy should be formally defined, approved by the appropriate leadership level, aligned to the organization purpose and context, communicated so people understand it, and kept available and current wherever it is needed for implementation.'
    }

    if (loweredTitle.includes('objective')) {
      return 'Objectives should be measurable where practical, linked to relevant functions or process levels, supported by responsibilities, resources, timing, and methods, and regularly reviewed so missed targets trigger action rather than remain informational only.'
    }

    if (loweredTitle.includes('competence') || loweredTitle.includes('training')) {
      return 'Required competence should be defined for the affected roles, current capability should be evaluated, gaps should trigger training or other development actions, and the organization should retain evidence showing that personnel are capable of performing assigned tasks effectively.'
    }

    if (loweredTitle.includes('documented information') || loweredTitle.includes('record')) {
      return 'Documented information should be reviewed, approved, version controlled, distributed, protected, retained, and disposed of in a defined way so that only valid information is used and retained evidence remains traceable and retrievable.'
    }

    if (loweredTitle.includes('internal audit')) {
      return 'The audit programme should define scope, criteria, frequency, methods, auditor competence, and required independence. Audit results should be reported clearly, escalated where needed, and followed through until actions are completed and verified.'
    }

    if (loweredTitle.includes('management review')) {
      return 'Management review should happen at planned intervals using defined inputs, evaluate suitability and effectiveness, and produce concrete outputs such as decisions, priorities, actions, and resource commitments.'
    }

    if (loweredTitle.includes('corrective action') || loweredTitle.includes('nonconformity')) {
      return 'The organization should react promptly, contain or correct the immediate issue, evaluate impact, determine systemic causes, implement proportionate corrective actions, verify effectiveness, and retain evidence of the full problem-solving cycle.'
    }

    if (loweredTitle.includes('customer satisfaction')) {
      return 'Customer perception should be monitored through defined methods, results should be reviewed for adverse trends, and the information should feed management action, prioritization, and improvement work.'
    }

    if (loweredTitle.includes('design')) {
      return 'Design activities should be controlled from planning through inputs, reviews, verification, validation, outputs, release, and change management, with clear responsibilities and retained evidence at each stage.'
    }

    if (loweredTitle.includes('supplier') || loweredTitle.includes('external provider')) {
      return 'External providers should be selected and monitored using defined criteria, the required controls and expectations should be communicated clearly, and supplier performance and follow-up should be retained as objective evidence.'
    }

    if (loweredTitle.includes('production') || loweredTitle.includes('operation') || loweredTitle.includes('service provision')) {
      return 'Operational work should be planned and carried out under controlled conditions using defined methods, suitable resources, process controls, change management, verification activities, and retained evidence showing outputs meet requirements.'
    }

    if (loweredTitle.includes('monitoring') || loweredTitle.includes('measurement') || loweredTitle.includes('analysis') || loweredTitle.includes('evaluation')) {
      return 'The organization should define what is monitored, measured, analyzed, or evaluated, how and when this happens, who owns the activity, what criteria apply, and how the results are reviewed and acted upon.'
    }

    if (loweredTitle.includes('risk') || loweredTitle.includes('opportunit')) {
      return 'Relevant risks and opportunities should be identified, evaluated, translated into proportionate actions, integrated into business processes, and periodically reviewed for effectiveness.'
    }

    if (loweredTitle.includes('feasibility')) {
      return 'The organization should assess feasibility before committing to product or process requirements, including capability, capacity, resources, timing, technical risk, and the ability to meet specified requirements on a sustained basis.'
    }

    return 'This requirement should be defined in the management system, translated into day-to-day practice, assigned to responsible roles, controlled through clear methods or criteria, and supported by retained objective evidence.'
  })()

  const detail =
    clause === chapter
      ? (normalizedStandard === 'ASI' ? asiChapterIntent[chapter] : chapterIntent[chapter]) ?? 'This chapter should be implemented in a defined, effective, controlled, and evidenced manner.'
      : `${normalizedStandard} expects ${clauseTitle.toLowerCase()} to be formally defined, implemented in practice, and shown through objective evidence. ${detailedExpectation}`

  const evidenceHints = (() => {
    if (chapter === '8') {
      return [
        'documented operational method, control plan, or defined process criteria',
        'records showing the activity was performed under controlled conditions',
        'evidence of review, approval, release, verification, or escalation where relevant',
        'traceability between the requirement, the activity, and the resulting output',
      ]
    }

    if (chapter === '9') {
      return [
        'defined measures, review inputs, audit evidence, or performance records',
        'trend analysis, meeting outputs, conclusions, or escalated actions',
        'evidence that results were evaluated and led to decisions or follow-up',
      ]
    }

    if (chapter === '10') {
      return [
        'problem description, containment, root-cause analysis, and corrective action records',
        'verification that implemented actions were effective',
        'evidence that recurrence risk was reduced or controlled',
      ]
    }

    if (normalizedStandard === 'ASI') {
      return [
        'defined commitments, criteria, or due-diligence controls relevant to the selected clause',
        'assigned ownership and operational implementation across the relevant function or process',
        'records, reviews, logs, communications, or stakeholder evidence supporting conformance',
        'follow-up or escalation where gaps, incidents, or risks were identified',
      ]
    }

    return [
      'a defined method, process, or documented approach',
      'clear ownership and responsible roles',
      'records, logs, approvals, or retained evidence showing implementation',
      'monitoring, follow-up, or review where the requirement expects it',
    ]
  })()

  return [
    `${normalizedStandard} - ${clause} ${clauseTitle}`,
    '',
    'Detailed requirement:',
    detail,
    '',
    'What the auditor should expect to verify:',
    ...evidenceHints.map((hint) => `- ${hint}`),
  ].join('\n')
}

function compareClauseCode(left: string, right: string) {
  const leftParts = left.split('.').map((part) => Number(part))
  const rightParts = right.split('.').map((part) => Number(part))
  const maxLength = Math.max(leftParts.length, rightParts.length)

  for (let index = 0; index < maxLength; index += 1) {
    const leftValue = leftParts[index] ?? -1
    const rightValue = rightParts[index] ?? -1

    if (leftValue !== rightValue) {
      return leftValue - rightValue
    }
  }

  return 0
}

export function buildClauseTree(standard: string) {
  const clauseOptions = getClauseOptionsForStandard(standard)
  const nodeLookup = new Map<string, ClauseTreeNode>()
  const rootChapterCodes = [...new Set(clauseOptions.map((code) => code.split('.')[0] ?? code))].sort(compareClauseCode)

  rootChapterCodes.forEach((code) => {
    nodeLookup.set(code, {
      code,
      title: getClauseTitle(standard, code),
      level: 0,
      children: [],
    })
  })

  clauseOptions.forEach((code) => {
    nodeLookup.set(code, {
      code,
      title: getClauseTitle(standard, code),
      level: code.split('.').length - 1,
      children: [],
    })
  })

  const roots: ClauseTreeNode[] = []

  rootChapterCodes.forEach((code) => {
    const rootNode = nodeLookup.get(code)

    if (!rootNode) {
      return
    }

    roots.push(rootNode)
  })

  clauseOptions.forEach((code) => {
    const node = nodeLookup.get(code)

    if (!node) {
      return
    }

    const parentCode = code.includes('.') ? code.split('.').slice(0, -1).join('.') : code
    const parent = nodeLookup.get(parentCode)

    if (parent) {
      parent.children.push(node)
      return
    }

    const rootParent = nodeLookup.get(code.split('.')[0] ?? code)

    if (rootParent && rootParent !== node) {
      rootParent.children.push(node)
    }
  })

  const sortTree = (nodes: ClauseTreeNode[]) => {
    nodes.sort((left, right) => compareClauseCode(left.code, right.code))
    nodes.forEach((node) => sortTree(node.children))
  }

  sortTree(roots)

  return roots
}

export function getClauseAncestorCodes(clause: string) {
  const segments = clause.split('.')
  const ancestors: string[] = []

  while (segments.length > 1) {
    segments.pop()
    ancestors.unshift(segments.join('.'))
  }

  return ancestors
}
