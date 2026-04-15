import * as XLSX from 'xlsx'
import type { AuditRecord } from '../../../types/audit'
import type { AuditPlanRecord } from '../../../types/planning'
import { normalizePlanningRecordShape } from '../../planning/services/planningFactory'
import { normalizeAuditRecordShape, synchronizeAuditRecord } from './auditFactory'

export const IMPORT_DATA_SHEET_NAME = 'Import Data'
export const IMPORT_SCHEMA_VERSION = 1
const TRANSFER_PAYLOAD_CHUNK_SIZE = 30000

export type TransferEntityType = 'audit' | 'audit-library' | 'planning-library'

export type TransferEnvelope = {
  entityType: TransferEntityType
  schemaVersion: number
  exportedAt: string
  label: string
  payload: unknown
}

export type ImportParseResult =
  | { entityType: 'audit'; audits: AuditRecord[]; label: string; exportedAt: string }
  | { entityType: 'audit-library'; audits: AuditRecord[]; label: string; exportedAt: string }
  | { entityType: 'planning-library'; planningRecords: AuditPlanRecord[]; label: string; exportedAt: string }

export type MergeResult<T> = {
  records: T[]
  imported: number
  updated: number
  skipped: number
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))]
}

function serializeComparable(value: unknown) {
  return JSON.stringify(value)
}

function findAuditRecordMatchIndex(records: AuditRecord[], importedRecord: AuditRecord) {
  return records.findIndex((record) =>
    record.id === importedRecord.id
    || record.auditId === importedRecord.auditId
    || record.legacyIds?.includes(importedRecord.id)
    || importedRecord.legacyIds?.includes(record.id),
  )
}

function resolveLinkedAuditId(linkedAuditId: string | null, audits: AuditRecord[]) {
  if (!linkedAuditId) {
    return null
  }

  const linkedAudit = audits.find((audit) => audit.id === linkedAuditId || audit.legacyIds?.includes(linkedAuditId))
  return linkedAudit?.id ?? null
}

function findPlanningRecordMatchIndex(records: AuditPlanRecord[], importedRecord: AuditPlanRecord) {
  return records.findIndex((record) =>
    record.id === importedRecord.id
    || record.auditId === importedRecord.auditId,
  )
}

export function createTransferSheetRows(entityType: TransferEntityType, label: string, payload: unknown, exportedAt = new Date().toISOString()) {
  const serializedPayload = JSON.stringify(payload)
  const chunks = serializedPayload.match(new RegExp(`.{1,${TRANSFER_PAYLOAD_CHUNK_SIZE}}`, 'g')) ?? ['']

  return chunks.map((chunk, index) => ({
    Entity: entityType,
    'Schema Version': IMPORT_SCHEMA_VERSION,
    Label: label,
    'Exported At': exportedAt,
    'Payload Part': index + 1,
    Payload: chunk,
  }))
}

function parseTransferEnvelope(value: unknown): TransferEnvelope {
  if (!value || typeof value !== 'object') {
    throw new Error('Import payload is not a valid transfer envelope.')
  }

  const envelope = value as Partial<TransferEnvelope>

  if (envelope.entityType !== 'audit' && envelope.entityType !== 'audit-library' && envelope.entityType !== 'planning-library') {
    throw new Error('Unsupported import file type.')
  }

  return {
    entityType: envelope.entityType,
    schemaVersion: Number(envelope.schemaVersion ?? IMPORT_SCHEMA_VERSION),
    exportedAt: typeof envelope.exportedAt === 'string' ? envelope.exportedAt : new Date().toISOString(),
    label: typeof envelope.label === 'string' ? envelope.label : 'Imported file',
    payload: envelope.payload,
  }
}

function parseWorkbookTransfer(workbook: XLSX.WorkBook): TransferEnvelope {
  const importSheet = workbook.Sheets[IMPORT_DATA_SHEET_NAME]

  if (!importSheet) {
    throw new Error('Unsupported workbook structure. Import a file exported from this audit application.')
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(importSheet, { defval: '' })
  const firstRow = rows[0]
  const payload = rows
    .map((row, index) => ({
      chunk:
        typeof row.Payload === 'string'
          ? row.Payload
          : typeof row.Payload === 'number'
            ? String(row.Payload)
            : '',
      part: Number(row['Payload Part'] ?? index + 1),
      index,
    }))
    .filter((row) => row.chunk.length > 0)
    .sort((left, right) => left.part - right.part || left.index - right.index)
    .map((row) => row.chunk)
    .join('')

  if (!firstRow || !payload) {
    throw new Error('Import Data sheet is missing the serialized payload.')
  }

  return parseTransferEnvelope({
    entityType: firstRow.Entity,
    schemaVersion: Number(firstRow['Schema Version'] ?? IMPORT_SCHEMA_VERSION),
    exportedAt: String(firstRow['Exported At'] ?? new Date().toISOString()),
    label: String(firstRow.Label ?? 'Imported file'),
    payload: JSON.parse(payload),
  })
}

export async function parseImportFile(file: File): Promise<ImportParseResult> {
  const lowerName = file.name.toLowerCase()
  const envelope = lowerName.endsWith('.json')
    ? parseTransferEnvelope(JSON.parse(await file.text()))
    : parseWorkbookTransfer(XLSX.read(await file.arrayBuffer(), { type: 'array' }))

  if (envelope.schemaVersion !== IMPORT_SCHEMA_VERSION) {
    throw new Error(`Unsupported import schema version ${envelope.schemaVersion}.`)
  }

  if (envelope.entityType === 'audit') {
    if (!envelope.payload) {
      throw new Error('Audit import payload is empty.')
    }

    return {
      entityType: 'audit',
      audits: [synchronizeAuditRecord(normalizeAuditRecordShape(envelope.payload as AuditRecord))],
      label: envelope.label,
      exportedAt: envelope.exportedAt,
    }
  }

  if (envelope.entityType === 'audit-library') {
    if (!Array.isArray(envelope.payload)) {
      throw new Error('Audit library payload must be a list of audits.')
    }

    return {
      entityType: 'audit-library',
      audits: envelope.payload.map((record) => synchronizeAuditRecord(normalizeAuditRecordShape(record as AuditRecord))),
      label: envelope.label,
      exportedAt: envelope.exportedAt,
    }
  }

  if (!Array.isArray(envelope.payload)) {
    throw new Error('Planning payload must be a list of planning records.')
  }

  return {
    entityType: 'planning-library',
    planningRecords: envelope.payload.map((record) => normalizePlanningRecordShape(record as AuditPlanRecord)),
    label: envelope.label,
    exportedAt: envelope.exportedAt,
  }
}

export function mergeImportedAudits(currentAudits: AuditRecord[], importedAudits: AuditRecord[]): MergeResult<AuditRecord> {
  const records = [...currentAudits]
  let imported = 0
  let updated = 0
  let skipped = 0

  importedAudits.forEach((importedRecord) => {
    const normalizedImport = synchronizeAuditRecord(normalizeAuditRecordShape(importedRecord))
    const existingIndex = findAuditRecordMatchIndex(records, normalizedImport)

    if (existingIndex === -1) {
      records.unshift(normalizedImport)
      imported += 1
      return
    }

    const existingRecord = records[existingIndex]
    const nextRecord = synchronizeAuditRecord(normalizeAuditRecordShape({
      ...normalizedImport,
      id: existingRecord.id,
      legacyIds: uniqueStrings([
        ...(existingRecord.legacyIds ?? []),
        existingRecord.id,
        normalizedImport.id,
        ...(normalizedImport.legacyIds ?? []),
      ]),
    }))

    if (serializeComparable(existingRecord) === serializeComparable(nextRecord)) {
      skipped += 1
      return
    }

    records[existingIndex] = nextRecord
    updated += 1
  })

  return {
    records,
    imported,
    updated,
    skipped,
  }
}

export function mergeImportedPlanningRecords(
  currentPlanningRecords: AuditPlanRecord[],
  importedPlanningRecords: AuditPlanRecord[],
  audits: AuditRecord[],
): MergeResult<AuditPlanRecord> {
  const records = [...currentPlanningRecords]
  let imported = 0
  let updated = 0
  let skipped = 0

  importedPlanningRecords.forEach((importedRecord) => {
    const normalizedImport = normalizePlanningRecordShape({
      ...importedRecord,
      linkedAuditId: resolveLinkedAuditId(importedRecord.linkedAuditId, audits),
    })
    const existingIndex = findPlanningRecordMatchIndex(records, normalizedImport)

    if (existingIndex === -1) {
      records.unshift(normalizedImport)
      imported += 1
      return
    }

    const existingRecord = records[existingIndex]
    const nextRecord = normalizePlanningRecordShape({
      ...normalizedImport,
      id: existingRecord.id,
    })

    if (serializeComparable(existingRecord) === serializeComparable(nextRecord)) {
      skipped += 1
      return
    }

    records[existingIndex] = nextRecord
    updated += 1
  })

  return {
    records,
    imported,
    updated,
    skipped,
  }
}
