import * as XLSX from 'xlsx'
import type { ActionPlanItem, AuditRecord, ExportDescriptor } from '../types/audit'
import type { AuditPlanRecord } from '../types/planning'
import { formatDateTime } from './dateUtils'
import { getAuditOwnerLabel, getPlanningMetadataItems } from './traceability'

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

function isAuditRecord(value: unknown): value is AuditRecord {
  return Boolean(value) && typeof value === 'object' && 'auditType' in (value as AuditRecord) && 'actions' in (value as AuditRecord)
}

function isPlanningRecordArray(value: unknown): value is AuditPlanRecord[] {
  return Array.isArray(value) && (value.length === 0 || ('plannedStart' in value[0] && 'auditId' in value[0]))
}

function isAuditRecordArray(value: unknown): value is AuditRecord[] {
  return Array.isArray(value) && (value.length === 0 || isAuditRecord(value[0]))
}

function toActionRows(actions: ActionPlanItem[]) {
  return actions.map((item) => ({
    'Action Title': item.action || item.finding || item.section || 'Corrective action',
    Owner: item.owner || 'Unassigned',
    'Due Date': item.dueDate || '',
    Status: item.status,
    Finding: item.finding || '',
    Section: item.section || '',
  }))
}

function writeWorkbook(filename: string, sheets: Array<{ name: string; rows: Array<Record<string, string | number>> }>) {
  const workbook = XLSX.utils.book_new()

  sheets.forEach((sheet) => {
    const worksheet = XLSX.utils.json_to_sheet(sheet.rows)
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name)
  })

  XLSX.writeFileXLSX(workbook, filename)
}

function openPrintWindow(title: string, html: string) {
  if (typeof window === 'undefined') {
    return false
  }

  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1120,height=900')

  if (!printWindow) {
    return false
  }

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
          body {
            margin: 0;
            padding: 32px;
            color: #172431;
            background: #ffffff;
          }
          main {
            max-width: 960px;
            margin: 0 auto;
          }
          header {
            border-bottom: 2px solid #d7dee7;
            padding-bottom: 20px;
            margin-bottom: 24px;
          }
          h1, h2, h3, p {
            margin: 0;
          }
          h1 {
            font-size: 28px;
            margin-bottom: 8px;
          }
          h2 {
            font-size: 17px;
            margin-bottom: 12px;
          }
          .subtitle {
            color: #5f7184;
            font-size: 14px;
          }
          .section {
            margin-bottom: 24px;
            page-break-inside: avoid;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
          }
          .meta-card {
            border: 1px solid #d7dee7;
            border-radius: 10px;
            padding: 12px 14px;
          }
          .meta-card span {
            display: block;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: #5f7184;
            margin-bottom: 4px;
          }
          .meta-card strong {
            display: block;
            font-size: 15px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
          }
          th, td {
            border: 1px solid #d7dee7;
            text-align: left;
            padding: 10px 12px;
            vertical-align: top;
          }
          th {
            background: #eef2f6;
          }
          .history-item {
            border: 1px solid #d7dee7;
            border-radius: 10px;
            padding: 12px 14px;
          }
          .history-item + .history-item {
            margin-top: 10px;
          }
          .history-item-header {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #5f7184;
            margin-bottom: 6px;
          }
          @media print {
            body {
              padding: 18px;
            }
          }
        </style>
      </head>
      <body>
        ${html}
      </body>
    </html>
  `)
  printWindow.document.close()
  printWindow.focus()
  window.setTimeout(() => {
    printWindow.print()
  }, 250)

  return true
}

function renderMetadataCards(items: Array<{ label: string; value: string }>) {
  return `
    <div class="meta-grid">
      ${items.map((item) => `
        <div class="meta-card">
          <span>${escapeHtml(item.label)}</span>
          <strong>${escapeHtml(item.value)}</strong>
        </div>
      `).join('')}
    </div>
  `
}

function renderAuditReport(auditLabel: string, audit: AuditRecord) {
  const history = [...audit.history].sort((left, right) => right.timestamp.localeCompare(left.timestamp))
  const metadata = [
    { label: 'Audit ID', value: audit.auditId },
    { label: 'Audit title', value: audit.title },
    { label: 'Standard', value: audit.standard || 'Not set' },
    { label: 'Owner', value: getAuditOwnerLabel(audit) },
    { label: 'Status', value: audit.status },
    { label: 'Last updated', value: formatDateTime(audit.updatedAt) },
    { label: 'Updated by', value: audit.updatedBy },
  ]

  return `
    <main>
      <header>
        <h1>${escapeHtml(auditLabel)}</h1>
        <p class="subtitle">Print this view or choose "Save as PDF" in the browser print dialog.</p>
      </header>

      <section class="section">
        <h2>Audit metadata</h2>
        ${renderMetadataCards(metadata)}
      </section>

      <section class="section">
        <h2>Action register</h2>
        <table>
          <thead>
            <tr>
              <th>Action title</th>
              <th>Owner</th>
              <th>Due date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${audit.actions.length ? audit.actions.map((item) => `
              <tr>
                <td>${escapeHtml(item.action || item.finding || item.section || 'Corrective action')}</td>
                <td>${escapeHtml(item.owner || 'Unassigned')}</td>
                <td>${escapeHtml(item.dueDate || '')}</td>
                <td>${escapeHtml(item.status)}</td>
              </tr>
            `).join('') : '<tr><td colspan="4">No action items recorded.</td></tr>'}
          </tbody>
        </table>
      </section>

      <section class="section">
        <h2>Activity log</h2>
        ${history.length ? history.map((item) => `
          <div class="history-item">
            <div class="history-item-header">
              <span>${escapeHtml(item.actionType)}</span>
              <span>${escapeHtml(formatDateTime(item.timestamp))}</span>
            </div>
            <strong>${escapeHtml(item.description)}</strong>
            <p>${escapeHtml(item.actor)}</p>
          </div>
        `).join('') : '<p>No audit activity recorded yet.</p>'}
      </section>
    </main>
  `
}

function renderAuditRegister(auditLabel: string, audits: AuditRecord[]) {
  return `
    <main>
      <header>
        <h1>${escapeHtml(auditLabel)}</h1>
        <p class="subtitle">Current audit register prepared for print or PDF export.</p>
      </header>

      <section class="section">
        <h2>Audit register</h2>
        <table>
          <thead>
            <tr>
              <th>Audit ID</th>
              <th>Title</th>
              <th>Standard</th>
              <th>Owner</th>
              <th>Status</th>
              <th>Last updated</th>
              <th>Updated by</th>
            </tr>
          </thead>
          <tbody>
            ${audits.map((audit) => `
              <tr>
                <td>${escapeHtml(audit.auditId)}</td>
                <td>${escapeHtml(audit.title)}</td>
                <td>${escapeHtml(audit.standard)}</td>
                <td>${escapeHtml(getAuditOwnerLabel(audit))}</td>
                <td>${escapeHtml(audit.status)}</td>
                <td>${escapeHtml(formatDateTime(audit.updatedAt))}</td>
                <td>${escapeHtml(audit.updatedBy)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </section>
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

      <section class="section">
        <h2>Planning register</h2>
        <table>
          <thead>
            <tr>
              <th>Audit ID</th>
              <th>Title</th>
              <th>Standard</th>
              <th>Owner</th>
              <th>Status</th>
              <th>Planned start</th>
              <th>Planned end</th>
              <th>Updated by</th>
            </tr>
          </thead>
          <tbody>
            ${records.map((record) => `
              <tr>
                <td>${escapeHtml(record.auditId)}</td>
                <td>${escapeHtml(record.title)}</td>
                <td>${escapeHtml(record.standard)}</td>
                <td>${escapeHtml(record.owner || 'Unassigned')}</td>
                <td>${escapeHtml(record.status)}</td>
                <td>${escapeHtml(record.plannedStart)}</td>
                <td>${escapeHtml(record.plannedEnd)}</td>
                <td>${escapeHtml(record.updatedBy)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </section>
    </main>
  `
}

export async function exportAuditToExcel(auditLabel: string, payload: unknown) {
  const descriptor = createDescriptor(auditLabel, 'excel')

  if (isAuditRecord(payload)) {
    writeWorkbook(descriptor.filename, [
      {
        name: 'Audit Summary',
        rows: [{
          'Audit ID': payload.auditId,
          'Audit Title': payload.title,
          Standard: payload.standard,
          Owner: getAuditOwnerLabel(payload),
          Status: payload.status,
          'Last Updated': formatDateTime(payload.updatedAt),
          'Updated By': payload.updatedBy,
        }],
      },
      {
        name: 'Actions',
        rows: toActionRows(payload.actions),
      },
      {
        name: 'Activity Log',
        rows: [...payload.history]
          .sort((left, right) => right.timestamp.localeCompare(left.timestamp))
          .map((item) => ({
            Timestamp: formatDateTime(item.timestamp),
            Action: item.actionType,
            Description: item.description,
            Actor: item.actor,
          })),
      },
    ])

    return {
      ...descriptor,
      message: 'Audit workbook exported with summary, action register, and activity log.',
    }
  }

  if (isPlanningRecordArray(payload)) {
    return exportPlanningToExcel(auditLabel, payload)
  }

  if (isAuditRecordArray(payload)) {
    writeWorkbook(descriptor.filename, [
      {
        name: 'Audit Register',
        rows: payload.map((audit) => ({
          'Audit ID': audit.auditId,
          'Audit Title': audit.title,
          Standard: audit.standard,
          Owner: getAuditOwnerLabel(audit),
          Status: audit.status,
          'Last Updated': formatDateTime(audit.updatedAt),
          'Updated By': audit.updatedBy,
          'Open Actions': audit.actions.filter((item) => item.status !== 'Closed').length,
        })),
      },
    ])

    return {
      ...descriptor,
      message: `Audit register exported for ${payload.length} records.`,
    }
  }

  throw new Error('Unsupported export payload.')
}

export async function exportAuditToPdf(auditLabel: string, payload: unknown) {
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

  const opened = openPrintWindow(auditLabel, html)

  return {
    ...descriptor,
    message: opened
      ? 'Print-ready report opened. Use the browser print dialog to save as PDF.'
      : 'Print window was blocked. Please allow pop-ups and try again.',
  }
}

export async function exportPlanningToExcel(planLabel: string, records: AuditPlanRecord[]) {
  const descriptor = createDescriptor(planLabel, 'excel')

  writeWorkbook(descriptor.filename, [
    {
      name: 'Planning Register',
      rows: records.map((record) => ({
        'Audit ID': record.auditId,
        Title: record.title,
        Standard: record.standard,
        'Audit Type': record.auditType,
        Category: record.auditCategory,
        Classification: record.internalExternal,
        Department: record.department,
        'Process Area': record.processArea,
        Site: record.site,
        Owner: record.owner,
        'Planned Start': record.plannedStart,
        'Planned End': record.plannedEnd,
        Status: record.status,
        'Last Updated': formatDateTime(record.updatedAt),
        'Updated By': record.updatedBy,
        'Linked Audit ID': record.linkedAuditId || '',
      })),
    },
    {
      name: 'Planning Metadata',
      rows: records.flatMap((record) =>
        getPlanningMetadataItems(record, record.status).map((item) => ({
          'Audit ID': record.auditId,
          Field: item.label,
          Value: item.value,
        })),
      ),
    },
  ])

  return {
    ...descriptor,
    message: `${records.length} planning records exported to Excel.`,
  }
}
