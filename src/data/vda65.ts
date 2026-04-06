import type { AuditInfo, ProductInfo, Vda65ChecklistItem } from '../types/audit'

// The workbook in /public does not contain a dedicated VDA 6.5 checklist section.
// This module remains mock placeholder data until a real VDA 6.5 template is supplied.

export const vda65AuditInfo: AuditInfo = {
  site: 'East Innovation Center',
  auditor: 'Milos Bauer',
  date: '2026-04-06',
  reference: 'VDA65-2026-01',
  auditStatus: 'In progress',
  department: 'Quality Assurance',
  customer: 'Nordic Mobility Systems',
  scope: 'Product audit for pre-series sensor control modules covering documentation, traceability, testing, packaging, and release readiness.',
  notes: 'Product audit focus includes defect handling, traceability, release status, and sampling discipline.',
}

export const vda65ProductInfo: ProductInfo = {
  productName: 'Sensor Control Module',
  productNumber: 'SCM-2201',
  batch: 'B-014',
  releaseDate: '2026-05-10',
  productionLine: 'Line 4 / Clean Assembly',
  customerPlant: 'Torslanda Vehicle Systems',
  notes: 'Semi-finished inspection batch selected for the next release cycle and customer witness run.',
}

export const vda65Checklist: Vda65ChecklistItem[] = [
  {
    id: 'c1',
    section: 'Design',
    requirement: 'Product documentation is complete and approved.',
    status: 'OK',
    defectType: 'Documentation',
    severity: 'Low',
    comment: 'Design package reviewed and signed off.',
  },
  {
    id: 'c2',
    section: 'Materials',
    requirement: 'Material certificates are available for all components.',
    status: 'NOK',
    defectType: 'Material',
    severity: 'Medium',
    comment: 'Missing certificate for one supplier lot.',
  },
  {
    id: 'c3',
    section: 'Process',
    requirement: 'Production process accepts verified work instructions.',
    status: 'OK',
    defectType: 'Process',
    severity: 'Low',
    comment: 'Work instructions are current.',
  },
  {
    id: 'c4',
    section: 'Testing',
    requirement: 'Test results are logged and traceable to the batch.',
    status: 'NOK',
    defectType: 'Traceability',
    severity: 'High',
    comment: 'One test record is incomplete.',
  },
  {
    id: 'c5',
    section: 'Packaging',
    requirement: 'Packaging standards are documented and followed.',
    status: 'OK',
    defectType: 'Packaging',
    severity: 'Low',
    comment: 'Packaging checks are completed.',
  },
  {
    id: 'c6',
    section: 'Labeling',
    requirement: 'Identification labels match the part status and release condition.',
    status: 'OK',
    defectType: 'Labeling',
    severity: 'Low',
    comment: 'Labels match ERP release state and sample traceability.',
  },
  {
    id: 'c7',
    section: 'Inspection',
    requirement: 'Sampling records reflect the approved audit plan and defined lot size.',
    status: 'NOK',
    defectType: 'Sampling',
    severity: 'Medium',
    comment: 'One sample size deviation was not formally approved.',
  },
  {
    id: 'c8',
    section: 'Storage',
    requirement: 'Storage and handling conditions protect product integrity before shipment.',
    status: 'OK',
    defectType: 'Handling',
    severity: 'Low',
    comment: 'ESD and humidity controls are active and monitored.',
  },
]
