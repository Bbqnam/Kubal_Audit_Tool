import { Outlet } from 'react-router-dom'
import ModuleSectionNav from '../components/ModuleSectionNav'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'

export default function AppLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="content-shell">
        <Topbar />
        <ModuleSectionNav />
        <main className="content-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
