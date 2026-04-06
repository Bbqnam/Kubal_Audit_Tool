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
    const result =
      format === 'excel'
        ? await exportAuditToExcel(auditLabel, payload)
        : await exportAuditToPdf(auditLabel, payload)
    setMessage(`${result.filename} prepared. ${result.message}`)
    setBusy(false)
  }

  return (
    <Panel
      title="Export Center"
      description={description ?? 'Integration points are prepared for future Excel and PDF generation services.'}
      actions={<ExportButtons busy={busy} onExcel={() => void runExport('excel')} onPdf={() => void runExport('pdf')} />}
    >
      <div className="export-center-copy">
        <p>Exports use a typed adapter interface so file generators can be added later without changing page-level code.</p>
        {message ? <p className="export-feedback">{message}</p> : null}
      </div>
    </Panel>
  )
}
