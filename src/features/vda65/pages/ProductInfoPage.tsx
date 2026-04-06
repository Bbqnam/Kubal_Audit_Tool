import ExportCenter from '../../../components/ExportCenter'
import { useVda65AuditWorkspace } from '../../shared/context/useVda65AuditWorkspace'
import { Field, PageHeader, Panel } from '../../../components/ui'

export default function Vda65ProductInfoPage() {
  const { audit, updateProductInfo, vda65ProductInfo } = useVda65AuditWorkspace()

  return (
    <div className="module-page">
      <PageHeader
        eyebrow="VDA 6.5"
        eyebrowTone="vda65"
        title="Product information"
        subtitle="Capture product, batch, production-line, and release details for the product audit report."
      />
      <Panel title="Product data" description="Structured fields for future persistence and export templates.">
        <div className="input-grid">
          <Field label="Product name">
            <input value={vda65ProductInfo.productName} onChange={(event) => updateProductInfo('productName', event.target.value)} />
          </Field>
          <Field label="Product number">
            <input value={vda65ProductInfo.productNumber} onChange={(event) => updateProductInfo('productNumber', event.target.value)} />
          </Field>
          <Field label="Batch">
            <input value={vda65ProductInfo.batch} onChange={(event) => updateProductInfo('batch', event.target.value)} />
          </Field>
          <Field label="Release date">
            <input type="date" value={vda65ProductInfo.releaseDate} onChange={(event) => updateProductInfo('releaseDate', event.target.value)} />
          </Field>
          <Field label="Production line">
            <input value={vda65ProductInfo.productionLine} onChange={(event) => updateProductInfo('productionLine', event.target.value)} />
          </Field>
          <Field label="Customer plant">
            <input value={vda65ProductInfo.customerPlant} onChange={(event) => updateProductInfo('customerPlant', event.target.value)} />
          </Field>
          <Field label="Notes" full>
            <textarea rows={4} value={vda65ProductInfo.notes} onChange={(event) => updateProductInfo('notes', event.target.value)} />
          </Field>
        </div>
      </Panel>
      <ExportCenter auditLabel={`${audit.title} Product Information`} payload={audit} />
    </div>
  )
}
