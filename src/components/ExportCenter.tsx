import { useState } from 'react'
import { exportAuditToExcel, exportAuditToPdf } from '../utils/exportUtils'
import { ExportButtons, Panel } from './ui'

export default function ExportCenter({
  auditLabel,
  payload,
  description,
}: {
  auditLabel: string
  payload: unknown
  description?: string
}) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function runExport(format: 'excel' | 'pdf') {
    setBusy(true)

    try {
      const result =
        format === 'excel'
          ? await exportAuditToExcel(auditLabel, payload)
          : await exportAuditToPdf(auditLabel, payload)
      setMessage(`${result.filename} prepared. ${result.message}`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Export failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel
      title="Exports"
      description={description ?? 'Prepare Excel or PDF output from the current view.'}
      actions={<ExportButtons busy={busy} onExcel={() => void runExport('excel')} onPdf={() => void runExport('pdf')} />}
    >
      <div className="export-center-copy">
        <p>Export actions stay consistent across planning, audits, and reports.</p>
        {message ? <p className="export-feedback">{message}</p> : null}
      </div>
    </Panel>
  )
}
