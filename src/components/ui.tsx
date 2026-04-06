import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { getAuditToneStyle, getAuditTypeFamilyLabel, getAuditTypeLabel } from '../data/auditTypes'
import type { AuditType } from '../types/audit'

type PanelProps = {
  title?: string
  description?: string
  children: React.ReactNode
  actions?: React.ReactNode
}

export function Panel({ title, description, children, actions }: PanelProps) {
  const hasCopy = Boolean(title || description)

  return (
    <section className="panel">
      {title || description || actions ? (
        <div className={`panel-header ${hasCopy ? '' : 'panel-header-actions-only'}`}>
          {hasCopy ? (
            <div>
              {title ? <h2>{title}</h2> : null}
              {description ? <p>{description}</p> : null}
            </div>
          ) : null}
          {actions ? <div className="panel-actions">{actions}</div> : null}
        </div>
      ) : null}
      <div className="panel-body">{children}</div>
    </section>
  )
}

export function PageHeader({
  eyebrow,
  eyebrowTone,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: React.ReactNode
  eyebrowTone?: AuditType | string
  title: string
  subtitle?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="section-header">
      <div>
        {eyebrow ? <span className="section-eyebrow" style={eyebrowTone ? getAuditToneStyle(eyebrowTone, 'strong') : undefined}>{eyebrow}</span> : null}
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {actions ? <div className="section-header-actions">{actions}</div> : null}
    </div>
  )
}

export function AuditTypeBadge({
  auditType,
  label,
  size = 'medium',
  variant = 'soft',
}: {
  auditType?: AuditType
  label?: string
  size?: 'small' | 'medium'
  variant?: 'soft' | 'strong'
}) {
  const resolvedLabel = label ?? (auditType ? (auditType === 'template' ? getAuditTypeLabel(auditType) : getAuditTypeFamilyLabel(auditType)) : 'Custom Audit')
  const toneSource = auditType ?? resolvedLabel

  return (
    <span
      className={`audit-type-badge audit-type-badge-${size} audit-type-badge-${variant}`}
      style={getAuditToneStyle(toneSource, variant)}
    >
      {resolvedLabel}
    </span>
  )
}

export function DashboardCard({
  title,
  label,
  description,
  icon,
  to,
  stats,
}: {
  title: string
  label: string
  description: string
  icon: string
  to: string
  stats: string[]
}) {
  return (
    <NavLink to={to} className="dashboard-card">
      <div className="card-icon">{icon}</div>
      <div className="dashboard-card-content">
        <span className="chip">{label}</span>
        <h3>{title}</h3>
        <p>{description}</p>
        <div className="dashboard-card-stats">
          {stats.map((stat) => (
            <span key={stat}>{stat}</span>
          ))}
        </div>
      </div>
      <span className="card-action">Open module</span>
    </NavLink>
  )
}

export function StatusBadge({ value }: { value: string }) {
  return <span className={`status-badge status-${value.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>{value}</span>
}

export function StatusLegend({
  items,
}: {
  items: Array<{ label: string; tone: 'neutral' | 'muted' | 'progress' | 'attention' | 'danger' }>
}) {
  return (
    <div className="status-legend" aria-label="Status legend">
      {items.map((item) => (
        <span key={item.label} className={`status-legend-chip status-legend-${item.tone}`}>
          {item.label}
        </span>
      ))}
    </div>
  )
}

export function ProgressBar({
  value,
  label,
}: {
  value: number
  label?: string
}) {
  return (
    <div className="progress-block" aria-label={label ?? 'Progress'}>
      <div className="progress-track" aria-hidden="true">
        <div className="progress-fill" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
      <div className="progress-meta">
        <span>{label ?? 'Completion'}</span>
        <strong>{value}%</strong>
      </div>
    </div>
  )
}

export function MetricCard({ label, value, tone = 'default' }: { label: string; value: string | number; tone?: 'default' | 'success' | 'warning' | 'danger' }) {
  return (
    <div className={`metric-card metric-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export function DetailList({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className="detail-list">
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function Field({ label, children, full = false }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`field ${full ? 'field-full' : ''}`}>
      <span>{label}</span>
      {children}
    </label>
  )
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  )
}

export function ExportButtons({
  onExcel,
  onPdf,
  busy,
}: {
  onExcel: () => void
  onPdf: () => void
  busy?: boolean
}) {
  return (
    <div className="export-actions">
      <button type="button" className="button button-secondary" onClick={onExcel} disabled={busy}>
        Export Excel
      </button>
      <button type="button" className="button button-primary" onClick={onPdf} disabled={busy}>
        Export PDF
      </button>
    </div>
  )
}

export function Modal({
  title,
  description,
  children,
  actions,
  onClose,
  size = 'medium',
}: {
  title: string
  description?: string
  children: React.ReactNode
  actions?: React.ReactNode
  onClose: () => void
  size?: 'medium' | 'large'
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div className={`modal-shell modal-${size}`} onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
          <button type="button" className="button button-secondary button-small" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {actions ? <div className="modal-footer">{actions}</div> : null}
      </div>
    </div>
  )
}
