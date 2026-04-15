import { NavLink } from 'react-router-dom'
import { PageHeader } from '../../../components/ui'
import { SHOW_HELPER_TEXT } from '../../../config/uiPreferences'
import { getModuleNavigation } from '../../../data/navigation'
import { useAuditLibrary } from '../../shared/context/useAuditLibrary'

export default function PlanningPageHeader({
  title,
  subtitle,
  actions,
}: {
  title?: string
  subtitle?: string
  actions?: React.ReactNode
}) {
  const { users, activePlanningUser, setActivePlanningUser } = useAuditLibrary()
  const planningNavigation = getModuleNavigation('planning')

  return (
    <div className="planning-page-header">
      <PageHeader eyebrow="Audit planning" title={title} subtitle={subtitle} actions={actions} />
      <div className="planning-page-chrome">
        <div className="module-nav planning-page-nav">
          {planningNavigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/planning'}
              className="module-nav-link"
            >
              {item.label}
            </NavLink>
          ))}
        </div>
        <label className="planning-actor-control">
          <span>Tracking user</span>
          <select
            value={activePlanningUser?.id ?? ''}
            onChange={(event) => setActivePlanningUser(event.target.value)}
            disabled={!users.length}
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
          {SHOW_HELPER_TEXT ? <small>{activePlanningUser?.position || 'Add a position in Admin > Access to enrich the log.'}</small> : null}
        </label>
      </div>
    </div>
  )
}
