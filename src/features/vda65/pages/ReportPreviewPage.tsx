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
        subtitle="Preview the workbook-style product audit report with product identification, class-based scoring, and corrective-action traceability."
      />

      <Panel title="Audit details">
        <DetailList
          items={[
            { label: 'Audit date', value: vda65AuditInfo.date },
            { label: 'Site', value: vda65AuditInfo.site },
            { label: 'Auditor', value: vda65AuditInfo.auditor },
            { label: 'Reference', value: vda65AuditInfo.reference },
            { label: 'Customer', value: vda65AuditInfo.customer ?? 'n/a' },
            { label: 'Product', value: vda65ProductInfo.productName },
            { label: 'Specification', value: vda65ProductInfo.productNumber },
            { label: 'Cast / batch', value: vda65ProductInfo.batch },
            { label: 'Production line', value: vda65ProductInfo.productionLine },
          ]}
        />
      </Panel>
      <Panel title="Results snapshot">
        <div className="report-summary-list">
          <div>
            <span>Reviewed checks</span>
            <strong>{results.reviewedCount}/{results.totalChecks}</strong>
          </div>
          <div>
            <span>Defect points</span>
            <strong>{results.totalScore}</strong>
          </div>
          <div>
            <span>Score band</span>
            <strong>{results.resultBand ?? 'n/a'}</strong>
          </div>
          <div>
            <span>Audit decision</span>
            <StatusBadge value={results.auditDecision} />
          </div>
        </div>
      </Panel>

      <Panel title="Workbook classification">
        <DetailList
          items={[
            { label: 'Class A defects', value: `${results.defectClassOverview.A} x 100 pts` },
            { label: 'Class B defects', value: `${results.defectClassOverview.B} x 50 pts` },
            { label: 'Class C defects', value: `${results.defectClassOverview.C} x 10 pts` },
            { label: 'Workbook thresholds', value: '0-50 Very Good, 51-100 Good, 101-149 Satisfactory, 150+ Not OK' },
          ]}
        />
      </Panel>

      <Panel title="Audit summary">
        <p>{vda65AuditInfo.notes || 'No summary narrative recorded yet.'}</p>
      </Panel>

      <Panel title="Defects and findings">
        <ul className="stack-list">
          {findings.map((item) => (
            <li key={item.id}>
              <strong>{item.number} - {item.requirement}</strong>
              <p>{`Class ${item.defectClass} | ${item.defectCount} defect(s) | ${item.comment || 'No narrative captured yet.'}`}</p>
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
