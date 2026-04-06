import ExportCenter from '../../../components/ExportCenter'
import { DetailList, PageHeader, Panel, StatusBadge } from '../../../components/ui'
import { useVda65AuditWorkspace } from '../../shared/context/useVda65AuditWorkspace'
import { calculateVda65Results } from '../../../utils/auditUtils'

export default function Vda65ReportPreviewPage() {
  const { audit, actionPlanItems, vda65AuditInfo, vda65Checklist, vda65ProductInfo } = useVda65AuditWorkspace()
  const results = calculateVda65Results(vda65Checklist)
  const findings = vda65Checklist.filter((item) => item.status === 'NOK')
  const actions = actionPlanItems

  return (
    <div className="module-page">
      <PageHeader
        eyebrow="VDA 6.5"
        eyebrowTone="vda65"
        title="Report preview"
        subtitle="Preview the structure of the product audit report before connecting production-ready file generation."
      />

      <Panel title="Audit details">
        <DetailList
          items={[
            { label: 'Site', value: vda65AuditInfo.site },
            { label: 'Auditor', value: vda65AuditInfo.auditor },
            { label: 'Reference', value: vda65AuditInfo.reference },
            { label: 'Product', value: vda65ProductInfo.productName },
            { label: 'Batch', value: vda65ProductInfo.batch },
            { label: 'Production line', value: vda65ProductInfo.productionLine },
          ]}
        />
      </Panel>
      <Panel title="Results snapshot">
        <div className="report-summary-list">
          <div>
            <span>Total checks</span>
            <strong>{results.totalChecks}</strong>
          </div>
          <div>
            <span>NOK count</span>
            <strong>{results.nokCount}</strong>
          </div>
          <div>
            <span>Audit status</span>
            <StatusBadge value={results.resultSummary} />
          </div>
        </div>
      </Panel>

      <Panel title="Defects and findings">
        <ul className="stack-list">
          {findings.map((item) => (
            <li key={item.id}>
              <strong>{item.section} - {item.defectType}</strong>
              <p>{item.comment}</p>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Action plan extract">
        <ul className="stack-list">
          {actions.map((item) => (
            <li key={item.id}>
              <strong>{item.section} - {item.owner}</strong>
              <p>{item.action}</p>
            </li>
          ))}
        </ul>
      </Panel>

      <ExportCenter
        auditLabel={`${audit.title} Report Preview`}
        payload={audit}
      />
    </div>
  )
}
