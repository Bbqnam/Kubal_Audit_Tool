import * as XLSX from 'xlsx'
import { createTransferSheetRows, IMPORT_DATA_SHEET_NAME } from '../../features/shared/services/fileTransfer'
import { buildGenericAuditShortSummary } from '../../features/shared/services/auditSummary'
import { vda63QuestionBank, vda63TemplateChapterTitles } from '../../features/vda63/data/questionBank'
import type {
  ActionPlanItem,
  AuditRecord,
  ExportDescriptor,
  GenericAuditRecord,
  Vda63AuditRecord,
  Vda65AuditRecord,
} from '../../types/audit'
import type { AuditPlanRecord } from '../../types/planning'
import { formatDateTime } from '../dateUtils'
import {
  buildVda63AuditQuestions,
  buildVda63Summary,
  calculateVda65Results,
  formatAuditType,
  getVda63ChapterResultLabel,
  getVda63ChapterStatusLabel,
} from '../auditUtils'
import { getAuditOwnerLabel, getPlanningMetadataItems } from '../traceability'

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

function formatEvidenceFileNames(item: ActionPlanItem) {
  return item.closureEvidenceFiles.map((file) => file.name).join(', ')
}

function formatClosureEvidenceText(item: ActionPlanItem) {
  const text = item.closureEvidence.trim()
  const fileNames = formatEvidenceFileNames(item)

  if (text && fileNames) {
    return `${text}\nFiles: ${fileNames}`
  }

  if (text) {
    return text
  }

  if (fileNames) {
    return `Files: ${fileNames}`
  }

  return ''
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
    formatClosureEvidenceText(item),
    formatEvidenceFileNames(item),
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
      'Evidence Files',
      'Owner',
      'Due Date',
      'Status',
      'Comment',
      'Linked Report Item',
      'Saved At',
    ],
    toActionRows(audit.actions),
    [6, 22, 24, 16, 18, 28, 28, 24, 24, 24, 24, 24, 24, 22, 20, 14, 16, 24, 20, 18],
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
  const resolvedReportSummary = buildGenericAuditShortSummary(audit)

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
        { title: 'Report summary', text: resolvedReportSummary },
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

export async function exportPlanningToExcel(planLabel: string, records: AuditPlanRecord[]) {
  const descriptor = createDescriptor(planLabel, 'excel')
  writeWorkbook(descriptor.filename, createPlanningRegisterSheets(planLabel, records, descriptor.generatedAt))

  return {
    ...descriptor,
    message: `${records.length} planning records exported with hidden re-import data.`,
  }
}
