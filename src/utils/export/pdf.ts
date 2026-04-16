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
import { getAuditOwnerLabel } from '../traceability'

type CellValue = string | number | boolean | null | undefined

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

function renderActionEvidenceFiles(item: ActionPlanItem) {
  if (!item.closureEvidenceFiles.length) {
    return '<p class="action-card-file-empty">No files attached.</p>'
  }

  return `
    <div class="action-card-file-list">
      ${item.closureEvidenceFiles.map((file) => `
        <a class="action-card-file-link" href="${escapeHtml(file.dataUrl)}" download="${escapeHtml(file.name)}">${escapeHtml(file.name)}</a>
      `).join('')}
    </div>
  `
}

function renderActionTable(actions: ActionPlanItem[]) {
  return actions.length
    ? `
      <div class="action-card-list">
        ${actions.map((item, index) => `
          <article class="action-card">
            <div class="report-card-header action-card-header">
              <div>
                <strong>${escapeHtml(item.section || item.processArea || item.clause || `Action ${index + 1}`)}</strong>
                <p class="action-card-subtitle">${normalizeMultilineText(item.finding)}</p>
              </div>
              <span class="pill">${escapeHtml(item.status)}</span>
            </div>
            <div class="action-card-meta">
              <span><strong>Owner:</strong> ${escapeHtml(formatReportText(item.owner, 'Unassigned'))}</span>
              <span><strong>Due date:</strong> ${escapeHtml(formatReportText(item.dueDate, 'Not set'))}</span>
              <span><strong>Type:</strong> ${escapeHtml(formatReportText(item.nonconformityType, 'Not set'))}</span>
              <span><strong>Reference:</strong> ${escapeHtml([item.processArea, item.clause].filter(Boolean).join(' / ') || 'Not set')}</span>
            </div>
            <div class="detail-grid action-card-grid">
              <div><span>Action summary</span><p>${normalizeMultilineText(item.action)}</p></div>
              <div><span>Containment action</span><p>${normalizeMultilineText(item.containmentAction)}</p></div>
              <div><span>Root cause analysis</span><p>${normalizeMultilineText(item.rootCauseAnalysis)}</p></div>
              <div><span>Corrective action</span><p>${normalizeMultilineText(item.correctiveAction)}</p></div>
              <div><span>Effectiveness check</span><p>${normalizeMultilineText(item.verificationOfEffectiveness)}</p></div>
              <div><span>Notes</span><p>${normalizeMultilineText(item.comment)}</p></div>
            </div>
            <div class="action-card-evidence">
              <div><span>Closure evidence text</span><p>${normalizeMultilineText(item.closureEvidence)}</p></div>
              <div><span>Closure evidence files</span>${renderActionEvidenceFiles(item)}</div>
            </div>
          </article>
        `).join('')}
      </div>
    `
    : '<p>No action items recorded.</p>'
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
  const auditTypeLabel = audit.standard || formatAuditType(audit.auditType)

  return `
    <header>
      <h1>${escapeHtml(auditLabel)}</h1>
      <p class="subtitle">Exported ${escapeHtml(formatDateTime(new Date().toISOString()))}. Review it in the browser, then print or save as PDF when you are ready.</p>
      ${renderMetadataCards([
        { label: 'Audit ID', value: audit.auditId },
        { label: 'Audit type', value: auditTypeLabel },
        ...(audit.standard && audit.standard !== auditTypeLabel ? [{ label: 'Standard', value: audit.standard }] : []),
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
  const resolvedReportSummary = buildGenericAuditShortSummary(audit)

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
            <p>${normalizeMultilineText(resolvedReportSummary)}</p>
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
            padding: 24px 28px 40px;
            color: #172431;
            background: #ffffff;
          }
          .preview-toolbar {
            position: sticky;
            top: 0;
            z-index: 20;
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            align-items: center;
            justify-content: space-between;
            margin: -24px -28px 28px;
            padding: 14px 28px;
            background: rgba(248, 250, 252, 0.96);
            border-bottom: 1px solid #d7dee7;
            backdrop-filter: blur(12px);
          }
          .preview-toolbar-copy {
            display: grid;
            gap: 4px;
          }
          .preview-toolbar-copy strong {
            font-size: 14px;
          }
          .preview-toolbar-copy span {
            color: #5f7184;
            font-size: 12px;
          }
          .preview-toolbar-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
          }
          .preview-toolbar button {
            border: 1px solid #d7dee7;
            border-radius: 999px;
            background: #ffffff;
            color: #172431;
            font: inherit;
            font-weight: 700;
            padding: 10px 16px;
            cursor: pointer;
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
          .action-card-list {
            display: grid;
            gap: 14px;
          }
          .action-card {
            border: 1px solid #d7dee7;
            border-radius: 14px;
            padding: 16px;
            background: linear-gradient(180deg, #ffffff, #f8fafc);
            page-break-inside: avoid;
          }
          .action-card-header {
            margin-bottom: 14px;
          }
          .action-card-subtitle {
            margin-top: 8px;
            color: #4c6175;
            line-height: 1.55;
          }
          .action-card-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 10px 16px;
            margin-bottom: 14px;
            color: #4c6175;
            font-size: 12px;
          }
          .action-card-grid {
            margin-bottom: 14px;
          }
          .action-card-evidence {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
          }
          .action-card-file-list {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }
          .action-card-file-link {
            display: inline-flex;
            align-items: center;
            min-height: 30px;
            padding: 0 10px;
            border-radius: 999px;
            background: #eef2f6;
            color: #172431;
            font-size: 12px;
            text-decoration: none;
          }
          .action-card-file-empty {
            margin: 0;
            color: #5f7184;
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
          @media (max-width: 860px) {
            body {
              padding: 20px 16px 32px;
            }
            .preview-toolbar {
              margin: -20px -16px 24px;
              padding: 12px 16px;
            }
            .meta-grid,
            .detail-grid,
            .action-card-evidence {
              grid-template-columns: 1fr;
            }
          }
          @media print {
            body {
              padding: 16px;
            }
            .preview-toolbar {
              display: none;
            }
            .section {
              break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="preview-toolbar">
          <div class="preview-toolbar-copy">
            <strong>${escapeHtml(title)}</strong>
            <span>Open in browser tab. Print when ready, or use your browser to save as PDF.</span>
          </div>
          <div class="preview-toolbar-actions">
            <button type="button" onclick="window.print()">Print / Save PDF</button>
            <button type="button" onclick="window.close()">Close</button>
          </div>
        </div>
        ${html}
      </body>
    </html>
  `)
  printWindow.document.close()

  return true
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
      ? 'Report opened in a new tab with preview controls. Print or save as PDF from there.'
      : 'Preview window was blocked. Please allow pop-ups and try again.',
  }
}
