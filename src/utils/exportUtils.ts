import type { ExportDescriptor } from '../types/audit'
import type { AuditPlanRecord } from '../types/planning'

function createDescriptor(auditLabel: string, format: ExportDescriptor['format']): ExportDescriptor {
  const timestamp = new Date().toISOString()
  const safeName = auditLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-')

  return {
    filename: `${safeName}.${format === 'excel' ? 'xlsx' : 'pdf'}`,
    format,
    generatedAt: timestamp,
    message: `${auditLabel} ${format.toUpperCase()} export is wired to a placeholder adapter for future file generation.`,
  }
}

function triggerDownload(filename: string, content: string, mimeType: string) {
  if (typeof window === 'undefined') {
    return
  }

  const blob = new Blob([content], { type: mimeType })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

function escapeHtml(value: string | null | undefined) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function exportAuditToExcel(auditLabel: string, payload: unknown) {
  console.log('Excel export requested', { auditLabel, payload })
  return createDescriptor(auditLabel, 'excel')
}

export async function exportAuditToPdf(auditLabel: string, payload: unknown) {
  console.log('PDF export requested', { auditLabel, payload })
  return createDescriptor(auditLabel, 'pdf')
}

export async function exportPlanningToExcel(planLabel: string, records: AuditPlanRecord[]) {
  const descriptor = createDescriptor(planLabel, 'excel')
  const filename = descriptor.filename.replace(/\.xlsx$/, '.xls')
  const rows = records
    .map((record) => `
      <tr>
        <td>${escapeHtml(record.title)}</td>
        <td>${escapeHtml(record.standard)}</td>
        <td>${escapeHtml(record.auditType)}</td>
        <td>${escapeHtml(record.auditCategory)}</td>
        <td>${escapeHtml(record.internalExternal)}</td>
        <td>${escapeHtml(record.department)}</td>
        <td>${escapeHtml(record.processArea)}</td>
        <td>${escapeHtml(record.site)}</td>
        <td>${escapeHtml(record.owner)}</td>
        <td>${escapeHtml(record.plannedStart)}</td>
        <td>${escapeHtml(record.plannedEnd)}</td>
        <td>${escapeHtml(record.actualCompletionDate)}</td>
        <td>${escapeHtml(record.status)}</td>
        <td>${escapeHtml(record.completionResult)}</td>
        <td>${escapeHtml(record.frequency)}</td>
        <td>${escapeHtml(record.linkedAuditId)}</td>
        <td>${escapeHtml(record.notes)}</td>
        <td>${escapeHtml(record.completionSummary)}</td>
      </tr>`)
    .join('')
  const workbook = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head>
        <meta charset="UTF-8" />
      </head>
      <body>
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Standard</th>
              <th>Audit Type</th>
              <th>Category</th>
              <th>Classification</th>
              <th>Department</th>
              <th>Process Area</th>
              <th>Site</th>
              <th>Owner</th>
              <th>Planned Start</th>
              <th>Planned End</th>
              <th>Actual Completion</th>
              <th>Status</th>
              <th>Completion Result</th>
              <th>Frequency</th>
              <th>Linked Audit</th>
              <th>Notes</th>
              <th>Outcome</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>
  `

  triggerDownload(filename, workbook, 'application/vnd.ms-excel;charset=utf-8')

  return {
    ...descriptor,
    filename,
    message: `${records.length} planning records exported in spreadsheet-ready format.`,
  }
}
