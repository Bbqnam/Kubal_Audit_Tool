import { useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { appNavigation } from '../data/navigation'
import { useShellChrome } from '../features/shared/context/useShellChrome'
import BrandLockup from './BrandLockup'

function SidebarNavIcon({ to }: { to: string }) {
  if (to === '/') {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path d="M3.5 8.2 10 3l6.5 5.2v7.3a1 1 0 0 1-1 1h-3.8V11h-3.4v5.5H4.5a1 1 0 0 1-1-1V8.2Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      </svg>
    )
  }

  if (to === '/planning') {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <rect x="3" y="4" width="14" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.7" />
        <path d="M6.2 2.9v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M13.8 2.9v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M3 7.5h14" stroke="currentColor" strokeWidth="1.7" />
        <path d="M6.2 10.4h2.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M11.6 10.4h2.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M6.2 13.5h2.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    )
  }

  if (to === '/audits') {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path d="M5 4.1h8.1a1.9 1.9 0 0 1 1.9 1.9v8.2a1.9 1.9 0 0 1-1.9 1.9H5.9A1.9 1.9 0 0 1 4 14.2V5.1A1 1 0 0 1 5 4.1Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M6.9 2.9h8.1A1.9 1.9 0 0 1 17 4.8V13" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
        <path d="M7 8h5.7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M7 11.1h5.7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    )
  }

  if (to === '/admin/access') {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path d="M10 3.1 15.5 5v4.2c0 3.1-2.2 5.8-5.5 7.7C6.7 15 4.5 12.3 4.5 9.2V5L10 3.1Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M10 7.2a1.85 1.85 0 1 1 0 3.7 1.85 1.85 0 0 1 0-3.7Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7.7 13.6c.5-1.1 1.34-1.7 2.3-1.7s1.8.6 2.3 1.7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <rect x="3" y="4" width="14" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M7 4v12" stroke="currentColor" strokeWidth="1.7" />
      <path d="M10 8.2h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M10 11.2h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { isMobileViewport, isSidebarOpen } = useShellChrome()
  const focusFromPointerRef = useRef(false)
  const [isPointerInside, setIsPointerInside] = useState(false)
  const [isFocusWithin, setIsFocusWithin] = useState(false)
  const isExpanded = isMobileViewport ? isSidebarOpen : isPointerInside || isFocusWithin

  function handlePointerEnter() {
    if (isMobileViewport) {
      return
    }

    setIsPointerInside(true)
  }

  function handlePointerLeave() {
    if (isMobileViewport) {
      return
    }

    focusFromPointerRef.current = false
    setIsPointerInside(false)
  }

  function handleFocusCapture() {
    if (isMobileViewport) {
      return
    }

    if (focusFromPointerRef.current) {
      return
    }

    setIsFocusWithin(true)
  }

  function handleBlurCapture(event: React.FocusEvent<HTMLElement>) {
    if (isMobileViewport) {
      return
    }

    const nextTarget = event.relatedTarget
    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
      return
    }

    setIsFocusWithin(false)
  }

  function handlePointerDownCapture() {
    if (isMobileViewport) {
      return
    }

    focusFromPointerRef.current = true
  }

  function handleKeyDownCapture() {
    if (isMobileViewport) {
      return
    }

    focusFromPointerRef.current = false
  }

  function handleNavigateClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (!isMobileViewport && focusFromPointerRef.current) {
      event.currentTarget.blur()
    }

    onNavigate?.()
  }

  return (
    <aside
      id="app-sidebar"
      className={`sidebar ${isMobileViewport ? 'sidebar-mobile' : ''} ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'} ${isExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`.trim()}
      aria-label="Primary navigation"
      aria-hidden={isMobileViewport && !isSidebarOpen}
      onPointerDownCapture={handlePointerDownCapture}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onKeyDownCapture={handleKeyDownCapture}
      onFocusCapture={handleFocusCapture}
      onBlurCapture={handleBlurCapture}
    >
      <Link to="/" className="brand-block sidebar-brand-link" aria-label="Go to dashboard" onClick={handleNavigateClick}>
        <BrandLockup variant="sidebar" subtitle="Audit platform" />
      </Link>
      <div className="sidebar-divider" aria-hidden="true">
        <span />
      </div>
      <div className="sidebar-section">
        <nav className="sidebar-nav">
          {appNavigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className="sidebar-link"
              aria-label={item.label}
              onClick={handleNavigateClick}
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
