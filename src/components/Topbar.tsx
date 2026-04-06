import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { getAuditRouteSegmentLabel, getAuditShortLabel, getAuditToneStyle } from '../data/auditTypes'
import { useAuditLibrary } from '../features/shared/context/useAuditLibrary'
import { formatDateTime } from '../utils/dateUtils'
import { StatusBadge } from './ui'

const labelMap: Record<string, string> = {
  planning: 'Planning',
  audits: 'Audit Library',
  calendar: 'Year Calendar',
  'three-year': '3-Year Plan',
  reports: 'Reports',
  summary: 'Summary',
  'action-plan': 'Action Plan',
  report: 'Report Preview',
  product: 'Product Info',
  checklist: 'Checklist',
  results: 'Results',
  findings: 'Defects / Findings',
  p2: 'P2',
  p3: 'P3',
  p4: 'P4',
  p5: 'P5',
  p6: 'P6',
  p7: 'P7',
}

function buildBreadcrumbs(pathname: string) {
  const segments = pathname.split('/').filter(Boolean)

  if (!segments.length) {
    return ['Dashboard']
  }

  if (segments.length === 1 && segments[0] === 'audits') {
    return ['Dashboard', 'Audit Library']
  }

  return [
    'Dashboard',
    ...segments
      .filter((segment, index, allSegments) => segment !== 'audits' && allSegments[index - 1] !== 'audits')
      .map((segment, index, filteredSegments) => {
        if (segment === 'checklist' && filteredSegments[index - 1] === 'planning') {
          return 'Yearly Checklist'
        }

        return labelMap[segment] ?? getAuditRouteSegmentLabel(segment)
      }),
  ]
}

export default function Topbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { auditId } = useParams<{ auditId?: string }>()
  const { getAuditById, lastSavedAt, saveState } = useAuditLibrary()
  const activeAudit = auditId ? getAuditById(auditId) : undefined
  const breadcrumbs = buildBreadcrumbs(location.pathname)
  const isAuditRoot = !!activeAudit && location.pathname === `/audits/${activeAudit.id}/${activeAudit.auditType}`
  const currentTitle = isAuditRoot ? 'Audit information' : breadcrumbs[breadcrumbs.length - 1] ?? 'Dashboard'
  const eyebrow = activeAudit
    ? activeAudit.auditType === 'template'
      ? 'Audit Template'
      : `${getAuditShortLabel(activeAudit.auditType)} Workspace`
    : location.pathname.startsWith('/planning')
      ? 'Audit Planning'
      : 'KUBAL Audit Platform'
  const canGoBack = location.pathname !== '/'

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }

    navigate('/')
  }

  return (
    <header className="topbar">
      <div className="topbar-heading">
        <div className="topbar-heading-meta">
          <p className="topbar-eyebrow" style={activeAudit ? getAuditToneStyle(activeAudit.auditType, 'strong') : undefined}>{eyebrow}</p>
        </div>
        <h2>{currentTitle}</h2>
        <div className="breadcrumb-list">
          {(activeAudit ? [activeAudit.title, ...breadcrumbs.slice(1)] : breadcrumbs).map((crumb) => (
            <span key={crumb}>{crumb}</span>
          ))}
        </div>
      </div>
      <div className="topbar-actions">
        {activeAudit ? (
          <div className="save-indicator">
            <StatusBadge value={saveState === 'Saving' ? 'Saving' : 'Saved'} />
            <div>
              <strong>{activeAudit.title}</strong>
              <p>{saveState === 'Saving' ? 'Saving to local storage...' : `Last saved ${formatDateTime(lastSavedAt ?? activeAudit.updatedAt)}`}</p>
            </div>
          </div>
        ) : null}
        {canGoBack ? (
          <button type="button" className="button button-small topbar-back-button" onClick={handleBack}>
            Back
          </button>
        ) : null}
      </div>
    </header>
  )
}
