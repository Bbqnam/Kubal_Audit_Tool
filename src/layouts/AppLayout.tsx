import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { ButtonLabel } from '../components/icons'
import ModuleSectionNav from '../components/ModuleSectionNav'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import { useShellChrome } from '../features/shared/context/useShellChrome'

export default function AppLayout() {
  const location = useLocation()
  const { closeSidebar, isMobileViewport, isSidebarOpen, toggleSidebar } = useShellChrome()

  useEffect(() => {
    if (isMobileViewport) {
      closeSidebar()
    }
  }, [closeSidebar, isMobileViewport, location.pathname, location.search])

  useEffect(() => {
    if (!isMobileViewport || !isSidebarOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isMobileViewport, isSidebarOpen])

  useEffect(() => {
    if (!isMobileViewport || !isSidebarOpen) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeSidebar()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [closeSidebar, isMobileViewport, isSidebarOpen])

  return (
    <div className={`app-shell ${isMobileViewport ? 'app-shell-mobile' : ''} ${isSidebarOpen ? 'app-shell-sidebar-open' : 'app-shell-sidebar-closed'}`.trim()}>
      {isMobileViewport ? (
        <button
          type="button"
          className="sidebar-overlay"
          onClick={closeSidebar}
          aria-label="Close navigation"
        />
      ) : null}
      <Sidebar onNavigate={closeSidebar} />
      <div className="content-shell">
        <div className="module-toolbar">
          <div className="module-toolbar-left">
            {isMobileViewport ? (
              <button
                type="button"
                className="button button-secondary button-small app-shell-menu-button"
                onClick={toggleSidebar}
                aria-controls="app-sidebar"
                aria-expanded={isSidebarOpen}
              >
                <ButtonLabel icon={isSidebarOpen ? 'close' : 'menu'} label={isSidebarOpen ? 'Close menu' : 'Open menu'} />
              </button>
            ) : null}
            <ModuleSectionNav />
          </div>
          <div className="module-toolbar-right">
            <Topbar />
          </div>
        </div>
        <main className="content-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
