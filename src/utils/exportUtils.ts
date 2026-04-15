import * as XLSX from 'xlsx'
import { createTransferSheetRows, IMPORT_DATA_SHEET_NAME } from '../features/shared/services/fileTransfer'
import { vda63QuestionBank, vda63TemplateChapterTitles } from '../features/vda63/data/questionBank'
import type {
  ActionPlanItem,
  AuditRecord,
  ExportDescriptor,
  GenericAuditRecord,
  Vda63AuditRecord,
  Vda65AuditRecord,
} from '../types/audit'
import type { AuditPlanRecord } from '../types/planning'
import { formatDateTime } from './dateUtils'
import {
  buildVda63AuditQuestions,
  buildVda63Summary,
  calculateVda65Results,
  formatAuditType,
  getVda63ChapterResultLabel,
  getVda63ChapterStatusLabel,
} from './auditUtils'
import { getAuditOwnerLabel, getPlanningMetadataItems } from './traceability'

type CellValue = string | number | boolean | null | undefined

type DetailItem = {
  label: string
  value: CellValue
}

type DetailSection = {
  title: string
  items: DetailItem[]
}

type WorksheetSpec = {
  name: string
  worksheet: XLSX.WorkSheet
  hidden?: boolean
}

function createDescriptor(auditLabel: string, format: ExportDescriptor['format']): ExportDescriptor {
  const timestamp = new Date().toISOString()
  const safeName = auditLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-')

  return {
    filename: `${safeName}.${format === 'excel' ? 'xlsx' : 'pdf'}`,
    format,
    generatedAt: timestamp,
    message: '',
  }
}

function escapeHtml(value: string | null | undefined) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatCellValue(value: CellValue, fallback = '') {
  if (value === null || value === undefined) {
    return fallback
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || fallback
  }

  return value
}

function formatReportText(value: CellValue, fallback = 'Not recorded') {
  const normalized = formatCellValue(value, '')
  return normalized === '' ? fallback : String(normalized)
}

function isAuditRecord(value: unknown): value is AuditRecord {
  return Boolean(value) && typeof value === 'object' && 'auditType' in (value as AuditRecord) && 'actions' in (value as AuditRecord)
}

function isPlanningRecordArray(value: unknown): value is AuditPlanRecord[] {
  return Array.isArray(value) && (value.length === 0 || ('plannedStart' in value[0] && 'auditId' in value[0]))
}

function isAuditRecordArray(value: unknown): value is AuditRecord[] {
  return Array.isArray(value) && (value.length === 0 || isAuditRecord(value[0]))
}

function isVda63AuditRecord(audit: AuditRecord): audit is Vda63AuditRecord {
  return audit.auditType === 'vda63'
}

function isGenericAuditRecord(audit: AuditRecord): audit is GenericAuditRecord {
  return audit.auditType !== 'vda63' && audit.auditType !== 'vda65'
}

function sanitizeSheetName(name: string) {
  const sanitized = name.replace(/[\\/?*[\]:]/g, ' ').trim()
  return (sanitized || 'Sheet').slice(0, 31)
}

function createRange(startRow: number, startCol: number, endRow: number, endCol: number): XLSX.Range {
  return {
    s: { r: startRow, c: startCol },
    e: { r: endRow, c: endCol },
  }
}

function createWorksheetFromRows(
  title: string,
  subtitle: string,
  bodyRows: CellValue[][],
  columnWidths: number[],
  mergedBodyRows: number[] = [],
) {
  const rows: CellValue[][] = [
    [title],
    [subtitle],
    [],
    ...bodyRows,
  ]
  const worksheet = XLSX.utils.aoa_to_sheet(rows)
  const lastColumn = Math.max(columnWidths.length - 1, 0)
  const merges = [
    createRange(0, 0, 0, lastColumn),
    createRange(1, 0, 1, lastColumn),
    ...mergedBodyRows.map((rowIndex) => createRange(rowIndex + 3, 0, rowIndex + 3, lastColumn)),
  ]

  worksheet['!cols'] = columnWidths.map((width) => ({ wch: width }))
  worksheet['!merges'] = merges

  return worksheet
}

function createTableSheet(
  name: string,
  title: string,
  subtitle: string,
  headers: string[],
  rows: Array<Array<CellValue>>,
  columnWidths: number[],
  emptyMessage: string,
): WorksheetSpec {
  const bodyRows = [
    headers,
    ...(rows.length
      ? rows
      : [[emptyMessage, ...Array.from({ length: Math.max(headers.length - 1, 0) }, () => '')]]),
  ]
  const worksheet = createWorksheetFromRows(title, subtitle, bodyRows, columnWidths)
  const lastRow = 3 + bodyRows.length - 1

  worksheet['!autofilter'] = {
    ref: XLSX.utils.encode_range({
      s: { r: 3, c: 0 },
      e: { r: lastRow, c: headers.length - 1 },
    }),
  }

  return {
    name,
    worksheet,
  }
}

function createDetailSheet(
  name: string,
  title: string,
  subtitle: string,
  sections: DetailSection[],
  columnWidths = [22, 30, 22, 30],
): WorksheetSpec {
  const bodyRows: CellValue[][] = []
  const mergedBodyRows: number[] = []

  sections.forEach((section, sectionIndex) => {
    if (sectionIndex > 0) {
      bodyRows.push([])
    }

    bodyRows.push([section.title])
    mergedBodyRows.push(bodyRows.length - 1)

    const visibleItems = section.items.filter((item) => formatCellValue(item.value, '') !== '')

    if (!visibleItems.length) {
      bodyRows.push(['No information recorded.', '', '', ''])
      return
    }

    for (let index = 0; index < visibleItems.length; index += 2) {
      const left = visibleItems[index]
      const right = visibleItems[index + 1]

      bodyRows.push([
        left.label,
        formatCellValue(left.value, 'Not set'),
        right?.label ?? '',
        right ? formatCellValue(right.value, 'Not set') : '',
      ])
    }
  })

  return {
    name,
    worksheet: createWorksheetFromRows(title, subtitle, bodyRows, columnWidths, mergedBodyRows),
  }
}

function createNarrativeSheet(
  name: string,
  title: string,
  subtitle: string,
  sections: Array<{ title: string; text: CellValue }>,
  columnWidths = [28, 92],
): WorksheetSpec {
  const bodyRows: CellValue[][] = []
  const mergedBodyRows: number[] = []

  sections.forEach((section, sectionIndex) => {
    if (sectionIndex > 0) {
      bodyRows.push([])
    }

    bodyRows.push([section.title, ''])
    mergedBodyRows.push(bodyRows.length - 1)
    bodyRows.push([formatCellValue(section.text, 'No narrative recorded.'), ''])
    mergedBodyRows.push(bodyRows.length - 1)
  })

  return {
    name,
    worksheet: createWorksheetFromRows(title, subtitle, bodyRows, columnWidths, mergedBodyRows),
  }
}

function createImportSheet(
  entityType: 'audit' | 'audit-library' | 'planning-library',
  label: string,
  payload: unknown,
  exportedAt: string,
): WorksheetSpec {
  const worksheet = XLSX.utils.json_to_sheet(createTransferSheetRows(entityType, label, payload, exportedAt))
  worksheet['!cols'] = [
    { wch: 18 },
    { wch: 16 },
    { wch: 34 },
    { wch: 24 },
    { wch: 12 },
    { wch: 80 },
  ]

  return {
    name: IMPORT_DATA_SHEET_NAME,
    worksheet,
    hidden: true,
  }
}

function writeWorkbook(filename: string, sheets: WorksheetSpec[]) {
  const workbook = XLSX.utils.book_new()

  sheets.forEach((sheet) => {
    XLSX.utils.book_append_sheet(workbook, sheet.worksheet, sanitizeSheetName(sheet.name))
  })

  workbook.Workbook = {
    Sheets: sheets.map((sheet) => ({ Hidden: sheet.hidden ? 1 : 0 })),
  }

  XLSX.writeFileXLSX(workbook, filename)
}

function getCommonAuditInfoSections(audit: AuditRecord): DetailSection[] {
  const auditInfo = audit.data.auditInfo

  return [
    {
      title: 'Record metadata',
      items: [
        { label: 'Audit ID', value: audit.auditId },
        { label: 'Audit title', value: audit.title },
        { label: 'Audit type', value: formatAuditType(audit.auditType) },
        { label: 'Standard', value: audit.standard },
        { label: 'Lifecycle status', value: audit.status },
        { label: 'Audit decision', value: auditInfo.auditStatus },
        { label: 'Owner', value: getAuditOwnerLabel(audit) },
        { label: 'Reviewer', value: audit.reviewer },
        { label: 'Approver', value: audit.approver },
        { label: 'Last updated', value: formatDateTime(audit.updatedAt) },
        { label: 'Updated by', value: audit.updatedBy },
        { label: 'Last modified by', value: audit.lastModifiedBy },
      ],
    },
    {
      title: 'Audit setup',
      items: [
        { label: 'Site', value: auditInfo.site || audit.site },
        { label: 'Auditor', value: auditInfo.auditor || audit.auditor },
        { label: 'Audit date', value: auditInfo.date || audit.auditDate },
        { label: 'Customer', value: auditInfo.customer },
        { label: 'Reference', value: auditInfo.reference },
        { label: 'Department', value: auditInfo.department },
      ],
    },
  ]
}

function getCommonNarrativeSections(audit: AuditRecord) {
  return [
    { title: 'Audit scope', text: audit.data.auditInfo.scope },
    { title: 'Audit notes', text: audit.data.auditInfo.notes },
  ]
}

function getOpenActionCount(actions: ActionPlanItem[]) {
  return actions.filter((item) => item.status !== 'Closed').length
}

function getDelayedActionCount(actions: ActionPlanItem[]) {
  const today = new Date().toISOString().slice(0, 10)

  return actions.filter((item) => item.status !== 'Closed' && item.dueDate && item.dueDate < today).length
}

function toActionRows(actions: ActionPlanItem[]) {
  return actions.map((item, index) => ([
    index + 1,
    item.nonconformityType || '',
    item.processArea || '',
    item.clause || '',
    item.section || '',
    item.finding || '',
    item.action || '',
    item.containmentAction || '',
    item.rootCauseAnalysis || '',
    item.correctiveAction || '',
    item.preventiveAction || '',
    item.verificationOfEffectiveness || '',
    item.closureEvidence || '',
    item.owner || '',
    item.dueDate || '',
    item.status,
    item.comment || '',
    item.reportItemId || '',
    item.savedAt ? formatDateTime(item.savedAt) : '',
  ]))
}

function toHistoryRows(audit: AuditRecord) {
  return [...audit.history]
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp))
    .map((item) => [
      formatDateTime(item.timestamp),
      item.actionType,
      item.description,
      item.actor,
    ])
}

function createAuditOverviewSheet(audit: AuditRecord): WorksheetSpec {
  const auditInfo = audit.data.auditInfo
  const sections: DetailSection[] = [
    {
      title: 'Headline',
      items: [
        { label: 'Audit title', value: audit.title },
        { label: 'Standard', value: audit.standard },
        { label: 'Site', value: auditInfo.site || audit.site },
        { label: 'Auditor', value: auditInfo.auditor || audit.auditor },
        { label: 'Audit date', value: auditInfo.date || audit.auditDate },
        { label: 'Status', value: audit.status },
      ],
    },
    {
      title: 'Progress snapshot',
      items: [
        { label: 'Progress', value: `${audit.summary.progressPercent}%` },
        { label: 'Score preview', value: audit.summary.scorePreview },
        { label: 'Result preview', value: audit.summary.resultPreview },
        { label: 'Open actions', value: getOpenActionCount(audit.actions) },
        { label: 'Delayed actions', value: getDelayedActionCount(audit.actions) },
        { label: 'Activity entries', value: audit.history.length },
      ],
    },
  ]

  return createDetailSheet(
    'Overview',
    `${audit.title} Export`,
    'Formatted workbook with visible report sheets plus a hidden import snapshot.',
    sections,
  )
}

function createActionPlanSheet(audit: AuditRecord): WorksheetSpec {
  return createTableSheet(
    'Action Plan',
    `${audit.title} - Action plan`,
    'Corrective-action register with ownership, due dates, containment, root cause, and effectiveness evidence.',
    [
      '#',
      'NC Type',
      'Process Area',
      'Clause',
      'Section',
      'Finding',
      'Action',
      'Containment',
      'Root Cause',
      'Corrective Action',
      'Preventive Action',
      'Verification',
      'Closure Evidence',
      'Owner',
      'Due Date',
      'Status',
      'Comment',
      'Linked Report Item',
      'Saved At',
    ],
    toActionRows(audit.actions),
    [6, 22, 24, 16, 18, 28, 28, 24, 24, 24, 24, 24, 24, 20, 14, 16, 24, 20, 18],
    'No action items recorded.',
  )
}

function createHistorySheet(audit: AuditRecord): WorksheetSpec {
  return createTableSheet(
    'Activity Log',
    `${audit.title} - Activity log`,
    'Chronological audit history exported from the current local record.',
    ['Timestamp', 'Action', 'Description', 'Actor'],
    toHistoryRows(audit),
    [24, 18, 84, 24],
    'No audit activity recorded.',
  )
}

function createGenericWorkbookSheets(audit: GenericAuditRecord, exportedAt: string): WorksheetSpec[] {
  const majorCount = audit.data.reportItems.filter((item) => item.nonconformityType === 'Major nonconformity').length
  const minorCount = audit.data.reportItems.filter((item) => item.nonconformityType === 'Minor nonconformity').length
  const observationCount = audit.data.reportItems.filter(
    (item) => item.nonconformityType === 'Observation' || item.nonconformityType === 'Improvement suggestion',
  ).length

  return [
    createAuditOverviewSheet(audit),
    createDetailSheet(
      'Audit Info',
      `${audit.title} - Audit information`,
      'Core audit-identification data used by the shared report workflow.',
      [
        ...getCommonAuditInfoSections(audit),
        {
          title: 'Report counts',
          items: [
            { label: 'Report items', value: audit.data.reportItems.length },
            { label: 'Major NC', value: majorCount },
            { label: 'Minor NC', value: minorCount },
            { label: 'Observations / ideas', value: observationCount },
          ],
        },
      ],
    ),
    createNarrativeSheet(
      'Narrative',
      `${audit.title} - Narrative`,
      'Narrative sections captured on the shared audit report page.',
      [
        ...getCommonNarrativeSections(audit),
        { title: 'Report summary', text: audit.data.reportSummary },
      ],
    ),
    createTableSheet(
      'NC Register',
      `${audit.title} - Nonconformity register`,
      'Structured register of nonconformities, evidence, requirement text, and formal statements.',
      [
        '#',
        'NC Type',
        'Process Area',
        'Clause',
        'Title',
        'Requirement',
        'Objective Evidence',
        'Statement of Nonconformity',
        'Recommendation',
        'Saved At',
      ],
      audit.data.reportItems.map((item, index) => [
        index + 1,
        item.nonconformityType,
        item.processArea,
        item.clause,
        item.title,
        item.requirement,
        item.evidence,
        item.statement,
        item.recommendation,
        item.savedAt ? formatDateTime(item.savedAt) : '',
      ]),
      [6, 24, 24, 16, 28, 34, 34, 38, 28, 18],
      'No nonconformities or observations recorded.',
    ),
    createActionPlanSheet(audit),
    createHistorySheet(audit),
    createImportSheet('audit', audit.title, audit, exportedAt),
  ]
}

function createVda63WorkbookSheets(audit: Vda63AuditRecord, exportedAt: string): WorksheetSpec[] {
  const questions = buildVda63AuditQuestions(vda63QuestionBank, audit.data.responses)
  const summary = buildVda63Summary(questions, audit.data.chapterScope)
  const chapterLookup = new Map(summary.chapters.map((chapter) => [chapter.chapter, chapter]))

  return [
    createAuditOverviewSheet(audit),
    createDetailSheet(
      'Audit Info',
      `${audit.title} - Audit information`,
      'Core VDA 6.3 audit identification, scope, and classification context.',
      [
        ...getCommonAuditInfoSections(audit),
        {
          title: 'VDA 6.3 result overview',
          items: [
            { label: 'Achievement level (EG)', value: summary.overallPercent === null ? 'n.e.' : `${summary.overallPercent}%` },
            { label: 'Final classification', value: summary.finalStatus },
            { label: 'In-scope chapters', value: summary.inScopeChapterCount },
            { label: 'Audited chapters', value: summary.auditedChapterCount },
            { label: 'Completed chapters', value: summary.completedChapterCount },
            { label: 'Downgrade triggered', value: summary.downgradeTriggered ? 'Yes' : 'No' },
          ],
        },
      ],
    ),
    createNarrativeSheet(
      'Narrative',
      `${audit.title} - Narrative`,
      'Scope and notes captured for the VDA 6.3 audit record.',
      getCommonNarrativeSections(audit),
    ),
    createTableSheet(
      'Participants',
      `${audit.title} - Participants`,
      'Participant list carried with the VDA 6.3 audit record.',
      ['#', 'Participant', 'Role'],
      audit.auditTeam.map((participant, index) => [index + 1, participant.userName, participant.role]),
      [6, 28, 24],
      'No participants recorded.',
    ),
    createTableSheet(
      'VDA63 Summary',
      `${audit.title} - Chapter summary`,
      'Chapter-level VDA 6.3 results including scope, status, achievement level, and downgrade state.',
      [
        'Chapter',
        'Chapter Title',
        'Scope',
        'Status',
        'Result',
        'Percent',
        'Completion %',
        'Question Count',
        'Scored Questions',
        'Downgraded',
      ],
      summary.chapters.map((chapter) => [
        chapter.chapter,
        vda63TemplateChapterTitles[chapter.chapter],
        chapter.scope === 'inScope' ? 'In scope' : 'Out of scope',
        getVda63ChapterStatusLabel(chapter.status),
        getVda63ChapterResultLabel(chapter.result),
        chapter.percent === null ? 'n.e.' : `${chapter.percent}%`,
        `${chapter.completionPercent}%`,
        chapter.questionCount,
        chapter.scoredQuestionCount,
        chapter.downgradeTriggered ? 'Yes' : 'No',
      ]),
      [10, 38, 14, 18, 26, 12, 14, 16, 18, 14],
      'No VDA 6.3 summary available.',
    ),
    createTableSheet(
      'Question Results',
      `${audit.title} - Question results`,
      'Full VDA 6.3 question export including score, comments, findings, and question text.',
      [
        'Chapter',
        'Chapter Status',
        'Question No.',
        'Product / Process',
        'Group',
        'Subgroup',
        'Star Question',
        'Score',
        'Comment',
        'Finding',
        'Question Text',
      ],
      questions.map((question) => {
        const chapterSummary = chapterLookup.get(question.chapter)

        return [
          question.chapter,
          chapterSummary ? getVda63ChapterStatusLabel(chapterSummary.status) : '',
          question.number,
          question.productProcessType || '',
          question.group || '',
          question.subgroup || '',
          question.isStarQuestion ? 'Yes' : 'No',
          question.score === null ? '' : question.score,
          question.comment,
          question.finding,
          question.text,
        ]
      }),
      [10, 18, 14, 18, 18, 20, 14, 10, 30, 34, 54],
      'No VDA 6.3 question data recorded.',
    ),
    createActionPlanSheet(audit),
    createHistorySheet(audit),
    createImportSheet('audit', audit.title, audit, exportedAt),
  ]
}

function createVda65WorkbookSheets(audit: Vda65AuditRecord, exportedAt: string): WorksheetSpec[] {
  const results = calculateVda65Results(audit.data.checklist)

  return [
    createAuditOverviewSheet(audit),
    createDetailSheet(
      'Audit Info',
      `${audit.title} - Audit information`,
      'Core VDA 6.5 audit details, result status, and product-audit execution context.',
      [
        ...getCommonAuditInfoSections(audit),
        {
          title: 'VDA 6.5 result overview',
          items: [
            { label: 'Reviewed checks', value: `${results.reviewedCount}/${results.totalChecks}` },
            { label: 'Pending checks', value: results.pendingCount },
            { label: 'Detected defects', value: results.totalDefects },
            { label: 'Defect points', value: results.totalScore },
            { label: 'Score band', value: results.resultBand },
            { label: 'Audit decision', value: results.auditDecision },
          ],
        },
      ],
    ),
    createDetailSheet(
      'Product Info',
      `${audit.title} - Product information`,
      'Product-specific context captured for the VDA 6.5 product audit.',
      [
        {
          title: 'Product details',
          items: [
            { label: 'Product name', value: audit.data.productInfo.productName },
            { label: 'Product number', value: audit.data.productInfo.productNumber },
            { label: 'Batch', value: audit.data.productInfo.batch },
            { label: 'Release date', value: audit.data.productInfo.releaseDate },
            { label: 'Production line', value: audit.data.productInfo.productionLine },
            { label: 'Customer plant', value: audit.data.productInfo.customerPlant },
          ],
        },
      ],
    ),
    createNarrativeSheet(
      'Narrative',
      `${audit.title} - Narrative`,
      'Scope, audit notes, and product notes captured for the VDA 6.5 record.',
      [
        ...getCommonNarrativeSections(audit),
        { title: 'Product notes', text: audit.data.productInfo.notes },
      ],
    ),
    createTableSheet(
      'Checklist',
      `${audit.title} - Checklist`,
      'Full VDA 6.5 checklist export including defect classification, tolerances, comments, and photo references.',
      [
        '#',
        'Section',
        'Requirement',
        'Status',
        'Special Characteristic',
        'Defect Class',
        'Unit',
        'Min Tol.',
        'Nominal',
        'Max Tol.',
        'Sample Size',
        'Defect Count',
        'Photo Reference',
        'Comment',
      ],
      audit.data.checklist.map((item, index) => [
        index + 1,
        item.section,
        item.requirement,
        item.status,
        item.specialCharacteristic,
        item.defectClass,
        item.unit,
        item.minTolerance,
        item.nominalValue,
        item.maxTolerance,
        item.sampleSize ?? '',
        item.defectCount,
        item.photoReference,
        item.comment,
      ]),
      [6, 18, 44, 14, 22, 14, 12, 12, 12, 12, 12, 12, 18, 34],
      'No checklist results recorded.',
    ),
    createTableSheet(
      'Findings',
      `${audit.title} - NOK findings`,
      'Checklist rows flagged as NOK so they stand out in the exported report package.',
      ['#', 'Section', 'Requirement', 'Defect Class', 'Defect Count', 'Comment'],
      audit.data.checklist
        .filter((item) => item.status === 'NOK')
        .map((item, index) => [
          index + 1,
          item.section,
          item.requirement,
          item.defectClass,
          item.defectCount,
          item.comment,
        ]),
      [6, 18, 56, 14, 14, 42],
      'No NOK findings recorded.',
    ),
    createActionPlanSheet(audit),
    createHistorySheet(audit),
    createImportSheet('audit', audit.title, audit, exportedAt),
  ]
}

function createAuditRegisterSheets(auditLabel: string, audits: AuditRecord[], exportedAt: string): WorksheetSpec[] {
  return [
    createTableSheet(
      'Audit Register',
      `${auditLabel} - Audit register`,
      'Current register export with summary fields for each audit record.',
      ['Audit ID', 'Title', 'Audit Type', 'Standard', 'Owner', 'Status', 'Open Actions', 'Updated', 'Updated By'],
      audits.map((audit) => [
        audit.auditId,
        audit.title,
        formatAuditType(audit.auditType),
        audit.standard,
        getAuditOwnerLabel(audit),
        audit.status,
        getOpenActionCount(audit.actions),
        formatDateTime(audit.updatedAt),
        audit.updatedBy,
      ]),
      [16, 34, 18, 18, 24, 16, 14, 24, 24],
      'No audit records available.',
    ),
    createImportSheet('audit-library', auditLabel, audits, exportedAt),
  ]
}

function createPlanningRegisterSheets(planLabel: string, records: AuditPlanRecord[], exportedAt: string): WorksheetSpec[] {
  return [
    createTableSheet(
      'Planning Register',
      `${planLabel} - Planning register`,
      'Planning export including scope, ownership, dates, status, and link-back data.',
      [
        'Audit ID',
        'Title',
        'Standard',
        'Audit Type',
        'Category',
        'Classification',
        'Department',
        'Process Area',
        'Site',
        'Owner',
        'Planned Start',
        'Planned End',
        'Status',
        'Last Updated',
        'Updated By',
        'Linked Audit ID',
      ],
      records.map((record) => [
        record.auditId,
        record.title,
        record.standard,
        record.auditType,
        record.auditCategory,
        record.internalExternal,
        record.department,
        record.processArea,
        record.site,
        record.owner,
        record.plannedStart,
        record.plannedEnd,
        record.status,
        formatDateTime(record.updatedAt),
        record.updatedBy,
        record.linkedAuditId || '',
      ]),
      [16, 30, 18, 16, 18, 18, 18, 22, 20, 20, 14, 14, 16, 24, 24, 18],
      'No planning records available.',
    ),
    createTableSheet(
      'Planning Metadata',
      `${planLabel} - Metadata`,
      'Expanded metadata rows for each planning record.',
      ['Audit ID', 'Field', 'Value'],
      records.flatMap((record) =>
        getPlanningMetadataItems(record, record.status).map((item) => [record.auditId, item.label, item.value]),
      ),
      [16, 28, 64],
      'No planning metadata available.',
    ),
    createImportSheet('planning-library', planLabel, records, exportedAt),
  ]
}

function normalizeMultilineText(value: CellValue, fallback = 'Not recorded') {
  return escapeHtml(formatReportText(value, fallback)).replace(/\n/g, '<br />')
}

function renderMetadataCards(items: Array<{ label: string; value: CellValue }>) {
  return `
    <div class="meta-grid">
      ${items.map((item) => `
        <div class="meta-card">
          <span>${escapeHtml(item.label)}</span>
          <strong>${escapeHtml(formatReportText(item.value, 'Not set'))}</strong>
        </div>
      `).join('')}
    </div>
  `
}

function renderTable(headers: string[], rows: string[][], emptyMessage: string, compact = false) {
  return `
    <table class="${compact ? 'table-compact' : ''}">
      <thead>
        <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr>
      </thead>
      <tbody>
        ${rows.length
          ? rows.map((row) => `
            <tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>
          `).join('')
          : `<tr><td colspan="${headers.length}">${escapeHtml(emptyMessage)}</td></tr>`}
      </tbody>
    </table>
  `
}

function renderHistoryEntries(audit: AuditRecord) {
  const history = [...audit.history].sort((left, right) => right.timestamp.localeCompare(left.timestamp))

  return history.length
    ? history.map((item) => `
      <div class="history-item">
        <div class="history-item-header">
          <span>${escapeHtml(item.actionType)}</span>
          <span>${escapeHtml(formatDateTime(item.timestamp))}</span>
        </div>
        <strong>${escapeHtml(item.description)}</strong>
        <p>${escapeHtml(item.actor)}</p>
      </div>
    `).join('')
    : '<p>No audit activity recorded yet.</p>'
}

function renderActionTable(actions: ActionPlanItem[]) {
  return renderTable(
    ['Section', 'Process Area', 'Finding', 'Action', 'Owner', 'Due date', 'Status'],
    actions.map((item) => [
      escapeHtml(formatReportText(item.section, 'n/a')),
      escapeHtml(formatReportText(item.processArea, 'n/a')),
      normalizeMultilineText(item.finding),
      normalizeMultilineText(item.action),
      escapeHtml(formatReportText(item.owner, 'Unassigned')),
      escapeHtml(formatReportText(item.dueDate, '')),
      escapeHtml(item.status),
    ]),
    'No action items recorded.',
    true,
  )
}

function renderSection(title: string, content: string) {
  return `
    <section class="section">
      <h2>${escapeHtml(title)}</h2>
      ${content}
    </section>
  `
}

function renderCommonAuditHeader(auditLabel: string, audit: AuditRecord) {
  const info = audit.data.auditInfo

  return `
    <header>
      <h1>${escapeHtml(auditLabel)}</h1>
      <p class="subtitle">Exported ${escapeHtml(formatDateTime(new Date().toISOString()))}. Use the browser print dialog to save this layout as PDF.</p>
      ${renderMetadataCards([
        { label: 'Audit ID', value: audit.auditId },
        { label: 'Audit type', value: formatAuditType(audit.auditType) },
        { label: 'Standard', value: audit.standard },
        { label: 'Status', value: audit.status },
        { label: 'Site', value: info.site || audit.site },
        { label: 'Auditor', value: info.auditor || audit.auditor },
        { label: 'Audit date', value: info.date || audit.auditDate },
        { label: 'Owner', value: getAuditOwnerLabel(audit) },
      ])}
    </header>
  `
}

function renderGenericAuditReport(auditLabel: string, audit: GenericAuditRecord) {
  const reportItems = audit.data.reportItems

  return `
    <main>
      ${renderCommonAuditHeader(auditLabel, audit)}

      ${renderSection('Narrative', `
        <div class="narrative-stack">
          <div class="narrative-block">
            <span>Audit scope</span>
            <p>${normalizeMultilineText(audit.data.auditInfo.scope)}</p>
          </div>
          <div class="narrative-block">
            <span>Audit notes</span>
            <p>${normalizeMultilineText(audit.data.auditInfo.notes)}</p>
          </div>
          <div class="narrative-block">
            <span>Report summary</span>
            <p>${normalizeMultilineText(audit.data.reportSummary)}</p>
          </div>
        </div>
      `)}

      ${renderSection('Nonconformity Register', reportItems.length
        ? `<div class="report-card-list">
            ${reportItems.map((item, index) => `
              <article class="report-card">
                <div class="report-card-header">
                  <strong>${escapeHtml(item.title || `Finding ${index + 1}`)}</strong>
                  <span class="pill">${escapeHtml(item.nonconformityType)}</span>
                </div>
                <div class="detail-grid">
                  <div><span>Process area</span><p>${escapeHtml(formatReportText(item.processArea, 'Not set'))}</p></div>
                  <div><span>Clause</span><p>${escapeHtml(formatReportText(item.clause, 'Not set'))}</p></div>
                  <div><span>Requirement</span><p>${normalizeMultilineText(item.requirement)}</p></div>
                  <div><span>Objective evidence</span><p>${normalizeMultilineText(item.evidence)}</p></div>
                  <div><span>Statement of nonconformity</span><p>${normalizeMultilineText(item.statement)}</p></div>
                  <div><span>Recommendation</span><p>${normalizeMultilineText(item.recommendation)}</p></div>
                </div>
              </article>
            `).join('')}
          </div>`
        : '<p>No nonconformities or observations recorded.</p>')}

      ${renderSection('Action Plan', renderActionTable(audit.actions))}

      ${renderSection('Activity Log', renderHistoryEntries(audit))}
    </main>
  `
}

function renderVda63AuditReport(auditLabel: string, audit: Vda63AuditRecord) {
  const questions = buildVda63AuditQuestions(vda63QuestionBank, audit.data.responses)
  const summary = buildVda63Summary(questions, audit.data.chapterScope)

  return `
    <main>
      ${renderCommonAuditHeader(auditLabel, audit)}

      ${renderSection('Result Summary', `
        <div class="callout">
          <span>Final classification</span>
          <strong>${escapeHtml(summary.finalStatus)}</strong>
        </div>
        ${renderMetadataCards([
          { label: 'Achievement level (EG)', value: summary.overallPercent === null ? 'n.e.' : `${summary.overallPercent}%` },
          { label: 'In-scope chapters', value: summary.inScopeChapterCount },
          { label: 'Audited chapters', value: summary.auditedChapterCount },
          { label: 'Completed chapters', value: summary.completedChapterCount },
          { label: 'In progress', value: summary.inProgressChapterCount },
          { label: 'Downgrade triggered', value: summary.downgradeTriggered ? 'Yes' : 'No' },
        ])}
      `)}

      ${renderSection('Participants', audit.auditTeam.length
        ? `<div class="meta-grid">
            ${audit.auditTeam.map((participant) => `
              <div class="meta-card">
                <span>${escapeHtml(participant.role)}</span>
                <strong>${escapeHtml(participant.userName)}</strong>
              </div>
            `).join('')}
          </div>`
        : '<p>No participants recorded.</p>')}

      ${renderSection('Chapter Summary', renderTable(
        ['Chapter', 'Title', 'Scope', 'Status', 'Result', 'Percent'],
        summary.chapters.map((chapter) => [
          escapeHtml(chapter.chapter),
          escapeHtml(vda63TemplateChapterTitles[chapter.chapter]),
          escapeHtml(chapter.scope === 'inScope' ? 'In scope' : 'Out of scope'),
          escapeHtml(getVda63ChapterStatusLabel(chapter.status)),
          escapeHtml(getVda63ChapterResultLabel(chapter.result)),
          escapeHtml(chapter.percent === null ? 'n.e.' : `${chapter.percent}%`),
        ]),
        'No chapter results available.',
      ))}

      ${renderSection('Question Results', renderTable(
        ['Chapter', 'No.', 'Product / Process', 'Star', 'Score', 'Comment', 'Finding', 'Question'],
        questions.map((question) => [
          escapeHtml(question.chapter),
          escapeHtml(question.number),
          escapeHtml(question.productProcessType || ''),
          escapeHtml(question.isStarQuestion ? 'Yes' : 'No'),
          escapeHtml(question.score === null ? '' : String(question.score)),
          normalizeMultilineText(question.comment),
          normalizeMultilineText(question.finding),
          normalizeMultilineText(question.text),
        ]),
        'No VDA 6.3 question responses recorded.',
        true,
      ))}

      ${renderSection('Action Plan', renderActionTable(audit.actions))}

      ${renderSection('Activity Log', renderHistoryEntries(audit))}
    </main>
  `
}

function renderVda65AuditReport(auditLabel: string, audit: Vda65AuditRecord) {
  const results = calculateVda65Results(audit.data.checklist)
  const findings = audit.data.checklist.filter((item) => item.status === 'NOK')

  return `
    <main>
      ${renderCommonAuditHeader(auditLabel, audit)}

      ${renderSection('Product Information', renderMetadataCards([
        { label: 'Product name', value: audit.data.productInfo.productName },
        { label: 'Product number', value: audit.data.productInfo.productNumber },
        { label: 'Batch', value: audit.data.productInfo.batch },
        { label: 'Release date', value: audit.data.productInfo.releaseDate },
        { label: 'Production line', value: audit.data.productInfo.productionLine },
        { label: 'Customer plant', value: audit.data.productInfo.customerPlant },
      ]))}

      ${renderSection('Result Summary', `
        <div class="callout">
          <span>Audit decision</span>
          <strong>${escapeHtml(results.auditDecision)}</strong>
        </div>
        ${renderMetadataCards([
          { label: 'Reviewed checks', value: `${results.reviewedCount}/${results.totalChecks}` },
          { label: 'Pending checks', value: results.pendingCount },
          { label: 'Detected defects', value: results.totalDefects },
          { label: 'Defect points', value: results.totalScore },
          { label: 'Score band', value: results.resultBand ?? 'n/a' },
          { label: 'Notes', value: audit.data.auditInfo.notes || audit.data.productInfo.notes || 'Not set' },
        ])}
      `)}

      ${renderSection('Checklist Results', renderTable(
        ['Section', 'Requirement', 'Status', 'Defect Class', 'Defect Count', 'Comment', 'Photo Ref.'],
        audit.data.checklist.map((item) => [
          escapeHtml(item.section),
          normalizeMultilineText(item.requirement),
          escapeHtml(item.status),
          escapeHtml(item.defectClass),
          escapeHtml(String(item.defectCount)),
          normalizeMultilineText(item.comment),
          escapeHtml(item.photoReference),
        ]),
        'No checklist results recorded.',
        true,
      ))}

      ${renderSection('NOK Findings', findings.length
        ? `<div class="report-card-list">
            ${findings.map((item) => `
              <article class="report-card">
                <div class="report-card-header">
                  <strong>${escapeHtml(item.section)}</strong>
                  <span class="pill">${escapeHtml(`Class ${item.defectClass}`)}</span>
                </div>
                <div class="detail-grid">
                  <div><span>Requirement</span><p>${normalizeMultilineText(item.requirement)}</p></div>
                  <div><span>Defect count</span><p>${escapeHtml(String(item.defectCount))}</p></div>
                  <div><span>Comment</span><p>${normalizeMultilineText(item.comment)}</p></div>
                  <div><span>Photo reference</span><p>${escapeHtml(formatReportText(item.photoReference, 'Not recorded'))}</p></div>
                </div>
              </article>
            `).join('')}
          </div>`
        : '<p>No NOK findings recorded.</p>')}

      ${renderSection('Action Plan', renderActionTable(audit.actions))}

      ${renderSection('Activity Log', renderHistoryEntries(audit))}
    </main>
  `
}

function renderAuditReport(auditLabel: string, audit: AuditRecord) {
  if (isGenericAuditRecord(audit)) {
    return renderGenericAuditReport(auditLabel, audit)
  }

  if (isVda63AuditRecord(audit)) {
    return renderVda63AuditReport(auditLabel, audit)
  }

  return renderVda65AuditReport(auditLabel, audit)
}

function renderAuditRegister(auditLabel: string, audits: AuditRecord[]) {
  return `
    <main>
      <header>
        <h1>${escapeHtml(auditLabel)}</h1>
        <p class="subtitle">Current audit register prepared for print or PDF export.</p>
      </header>
      ${renderSection('Audit Register', renderTable(
        ['Audit ID', 'Title', 'Audit Type', 'Standard', 'Owner', 'Status', 'Updated'],
        audits.map((audit) => [
          escapeHtml(audit.auditId),
          escapeHtml(audit.title),
          escapeHtml(formatAuditType(audit.auditType)),
          escapeHtml(audit.standard),
          escapeHtml(getAuditOwnerLabel(audit)),
          escapeHtml(audit.status),
          escapeHtml(formatDateTime(audit.updatedAt)),
        ]),
        'No audits available.',
      ))}
    </main>
  `
}

function renderPlanningRegister(planLabel: string, records: AuditPlanRecord[]) {
  return `
    <main>
      <header>
        <h1>${escapeHtml(planLabel)}</h1>
        <p class="subtitle">Current planning dataset prepared for print or PDF export.</p>
      </header>
      ${renderSection('Planning Register', renderTable(
        ['Audit ID', 'Title', 'Standard', 'Owner', 'Status', 'Planned start', 'Planned end'],
        records.map((record) => [
          escapeHtml(record.auditId),
          escapeHtml(record.title),
          escapeHtml(record.standard),
          escapeHtml(record.owner || 'Unassigned'),
          escapeHtml(record.status),
          escapeHtml(record.plannedStart),
          escapeHtml(record.plannedEnd),
        ]),
        'No planning records available.',
      ))}
    </main>
  `
}

function openPrintWindow(title: string, html: string, targetWindow?: Window | null) {
  if (typeof window === 'undefined') {
    return false
  }

  const printWindow = targetWindow ?? window.open('', '_blank', 'width=1180,height=920')

  if (!printWindow) {
    return false
  }

  printWindow.document.open()
  printWindow.document.write(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          :root {
            color-scheme: light;
            font-family: "Avenir Next", "Segoe UI", sans-serif;
            color: #172431;
            background: #ffffff;
          }
          * {
            box-sizing: border-box;
          }
          body {
            margin: 0;
            padding: 28px;
            color: #172431;
            background: #ffffff;
          }
          main {
            max-width: 1120px;
            margin: 0 auto;
          }
          header {
            margin-bottom: 28px;
          }
          h1, h2, h3, p {
            margin: 0;
          }
          h1 {
            font-size: 30px;
            margin-bottom: 10px;
          }
          h2 {
            font-size: 18px;
            margin-bottom: 14px;
          }
          .subtitle {
            color: #5f7184;
            font-size: 14px;
            margin-bottom: 18px;
          }
          .section {
            margin-bottom: 26px;
            page-break-inside: avoid;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
          }
          .meta-card {
            border: 1px solid #d7dee7;
            border-radius: 12px;
            padding: 12px 14px;
            background: #f8fafc;
          }
          .meta-card span,
          .detail-grid span,
          .narrative-block span {
            display: block;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #6b7d90;
            margin-bottom: 5px;
          }
          .meta-card strong {
            display: block;
            font-size: 15px;
          }
          .callout {
            border: 1px solid #d7dee7;
            border-left: 5px solid #9e6a1e;
            border-radius: 12px;
            padding: 14px 16px;
            margin-bottom: 16px;
            background: #fff8ed;
          }
          .callout span {
            display: block;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: #9e6a1e;
            margin-bottom: 6px;
          }
          .callout strong {
            font-size: 18px;
          }
          .narrative-stack {
            display: grid;
            gap: 12px;
          }
          .narrative-block,
          .report-card,
          .history-item {
            border: 1px solid #d7dee7;
            border-radius: 12px;
            padding: 14px 16px;
            background: #ffffff;
          }
          .narrative-block p,
          .detail-grid p {
            color: #233446;
            line-height: 1.55;
            white-space: normal;
            word-break: break-word;
          }
          .report-card-list {
            display: grid;
            gap: 14px;
          }
          .report-card-header {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            align-items: flex-start;
            margin-bottom: 12px;
          }
          .report-card-header strong {
            font-size: 16px;
          }
          .pill {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 6px 10px;
            border-radius: 999px;
            background: #eef2f6;
            color: #33475b;
            font-size: 12px;
            font-weight: 700;
          }
          .detail-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            font-size: 12px;
          }
          .table-compact {
            font-size: 11px;
          }
          th, td {
            border: 1px solid #d7dee7;
            text-align: left;
            padding: 8px 10px;
            vertical-align: top;
            word-break: break-word;
          }
          th {
            background: #eef2f6;
          }
          .history-item + .history-item {
            margin-top: 10px;
          }
          .history-item-header {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.07em;
            color: #5f7184;
            margin-bottom: 8px;
          }
          @media print {
            body {
              padding: 16px;
            }
            .section {
              break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        ${html}
        <script>
          window.addEventListener('load', function () {
            window.setTimeout(function () {
              window.focus();
              window.print();
            }, 300);
          });
        </script>
      </body>
    </html>
  `)
  printWindow.document.close()

  return true
}

export async function exportAuditToExcel(auditLabel: string, payload: unknown) {
  const descriptor = createDescriptor(auditLabel, 'excel')

  if (isAuditRecord(payload)) {
    const sheets = isGenericAuditRecord(payload)
      ? createGenericWorkbookSheets(payload, descriptor.generatedAt)
      : isVda63AuditRecord(payload)
        ? createVda63WorkbookSheets(payload, descriptor.generatedAt)
        : createVda65WorkbookSheets(payload, descriptor.generatedAt)

    writeWorkbook(descriptor.filename, sheets)

    return {
      ...descriptor,
      message: 'Workbook exported with visible report sheets and a hidden full-fidelity import snapshot.',
    }
  }

  if (isPlanningRecordArray(payload)) {
    return exportPlanningToExcel(auditLabel, payload)
  }

  if (isAuditRecordArray(payload)) {
    writeWorkbook(descriptor.filename, createAuditRegisterSheets(auditLabel, payload, descriptor.generatedAt))

    return {
      ...descriptor,
      message: `Audit register exported for ${payload.length} records, including hidden re-import data.`,
    }
  }

  throw new Error('Unsupported export payload.')
}

export async function exportAuditToPdf(auditLabel: string, payload: unknown, targetWindow?: Window | null) {
  const descriptor = createDescriptor(auditLabel, 'pdf')
  const html = isAuditRecord(payload)
    ? renderAuditReport(auditLabel, payload)
    : isPlanningRecordArray(payload)
      ? renderPlanningRegister(auditLabel, payload)
      : isAuditRecordArray(payload)
        ? renderAuditRegister(auditLabel, payload)
        : null

  if (!html) {
    throw new Error('Unsupported export payload.')
  }

  const opened = openPrintWindow(auditLabel, html, targetWindow)

  return {
    ...descriptor,
    message: opened
      ? 'Print-ready report opened with the full export layout. Use the browser dialog to save as PDF.'
      : 'Print window was blocked. Please allow pop-ups and try again.',
  }
}

export async function exportPlanningToExcel(planLabel: string, records: AuditPlanRecord[]) {
  const descriptor = createDescriptor(planLabel, 'excel')
  writeWorkbook(descriptor.filename, createPlanningRegisterSheets(planLabel, records, descriptor.generatedAt))

  return {
    ...descriptor,
    message: `${records.length} planning records exported with hidden re-import data.`,
  }
}
