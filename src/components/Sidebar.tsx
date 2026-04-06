import { NavLink } from 'react-router-dom'
import { appNavigation } from '../data/navigation'
import BrandLockup from './BrandLockup'

function SidebarNavIcon({ to }: { to: string }) {
  if (to === '/') {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path d="M3.5 8.2 10 3l6.5 5.2v7.3a1 1 0 0 1-1 1h-3.8V11h-3.4v5.5H4.5a1 1 0 0 1-1-1V8.2Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    )
  }

  if (to === '/planning') {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <rect x="3" y="4" width="14" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M6.2 2.9v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M13.8 2.9v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M3 7.5h14" stroke="currentColor" strokeWidth="1.6" />
        <path d="M6.2 10.4h2.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M11.6 10.4h2.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M6.2 13.5h2.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <rect x="3" y="4" width="14" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7 4v12" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 8.2h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M10 11.2h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export default function Sidebar() {
  return (
    <aside className="sidebar" aria-label="Primary navigation">
      <div className="brand-block">
        <BrandLockup variant="sidebar" subtitle="Audit platform" />
      </div>
      <div className="sidebar-divider" aria-hidden="true">
        <span />
      </div>
      <div className="sidebar-section">
        <span className="sidebar-label">Workspace</span>
        <nav className="sidebar-nav">
          {appNavigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className="sidebar-link"
              aria-label={item.label}
            >
              <span className="sidebar-link-icon">
                <SidebarNavIcon to={item.to} />
              </span>
              <span className="sidebar-link-text">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="sidebar-metadata">
        <div>
          <span>Standards</span>
          <strong>Multi-standard</strong>
        </div>
        <div>
          <span>State</span>
          <strong>Planning + execution</strong>
        </div>
      </div>
      <div className="sidebar-footer">
        <span>Created by Nam Nguyen</span>
      </div>
    </aside>
  )
}
