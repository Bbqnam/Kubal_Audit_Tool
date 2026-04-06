import { Outlet } from 'react-router-dom'
import ModuleSectionNav from '../components/ModuleSectionNav'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'

export default function AppLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="content-shell">
        <div className="module-toolbar">
          <ModuleSectionNav />
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
