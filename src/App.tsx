import { useEffect } from 'react'
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import './App.css'
import { APP_NAME } from './data/branding'
import { AuditWorkspaceProvider } from './features/shared/context/AuditWorkspaceContext'
import AppLayout from './layouts/AppLayout'
import Dashboard from './pages/Dashboard'
import AuditsPage from './pages/AuditsPage'
import NotFound from './pages/NotFound'
import YearCalendarPage from './features/planning/pages/YearCalendarPage'
import ThreeYearPlanPage from './features/planning/pages/ThreeYearPlanPage'
import PlanningReportsPage from './features/planning/pages/PlanningReportsPage'
import PlanningChecklistPage from './features/planning/pages/PlanningChecklistPage'
import GenericAuditActionPlanPage from './features/generic/pages/ActionPlanPage'
import GenericAuditInfoPage from './features/generic/pages/AuditInfoPage'
import Vda63AuditInfoPage from './features/vda63/pages/AuditInfoPage'
import Vda63ChapterPage from './features/vda63/pages/ChapterPage'
import Vda63SummaryPage from './features/vda63/pages/SummaryPage'
import Vda63ActionPlanPage from './features/vda63/pages/ActionPlanPage'
import Vda63ReportPreviewPage from './features/vda63/pages/ReportPreviewPage'
import Vda65AuditInfoPage from './features/vda65/pages/AuditInfoPage'
import Vda65ProductInfoPage from './features/vda65/pages/ProductInfoPage'
import Vda65ChecklistPage from './features/vda65/pages/ChecklistPage'
import Vda65ResultsPage from './features/vda65/pages/ResultsPage'
import Vda65FindingsPage from './features/vda65/pages/FindingsPage'
import Vda65ActionPlanPage from './features/vda65/pages/ActionPlanPage'
import Vda65ReportPreviewPage from './features/vda65/pages/ReportPreviewPage'

function App() {
  useEffect(() => {
    document.title = APP_NAME
  }, [])

  return (
    <AuditWorkspaceProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="planning" element={<Navigate to="/planning/calendar" replace />} />
            <Route path="planning/calendar" element={<YearCalendarPage />} />
            <Route path="planning/three-year" element={<ThreeYearPlanPage />} />
            <Route path="planning/reports" element={<PlanningReportsPage />} />
            <Route path="planning/checklist" element={<PlanningChecklistPage />} />
            <Route path="audits" element={<AuditsPage />} />
            <Route path="audits/:auditId/vda63" element={<Vda63AuditInfoPage />} />
            <Route path="audits/:auditId/vda63/:chapter" element={<Vda63ChapterPage />} />
            <Route path="audits/:auditId/vda63/summary" element={<Vda63SummaryPage />} />
            <Route path="audits/:auditId/vda63/action-plan" element={<Vda63ActionPlanPage />} />
            <Route path="audits/:auditId/vda63/report" element={<Vda63ReportPreviewPage />} />
            <Route path="audits/:auditId/vda65" element={<Vda65AuditInfoPage />} />
            <Route path="audits/:auditId/vda65/product" element={<Vda65ProductInfoPage />} />
            <Route path="audits/:auditId/vda65/checklist" element={<Vda65ChecklistPage />} />
            <Route path="audits/:auditId/vda65/results" element={<Vda65ResultsPage />} />
            <Route path="audits/:auditId/vda65/findings" element={<Vda65FindingsPage />} />
            <Route path="audits/:auditId/vda65/action-plan" element={<Vda65ActionPlanPage />} />
            <Route path="audits/:auditId/vda65/report" element={<Vda65ReportPreviewPage />} />
            <Route path="audits/:auditId/:auditType/action-plan" element={<GenericAuditActionPlanPage />} />
            <Route path="audits/:auditId/:auditType" element={<GenericAuditInfoPage />} />
            <Route path="vda63" element={<Navigate to="/audits" replace />} />
            <Route path="vda65" element={<Navigate to="/audits" replace />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuditWorkspaceProvider>
  )
}

export default App
