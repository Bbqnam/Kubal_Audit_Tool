import { useEffect } from 'react'
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import './App.css'
import { APP_NAME } from './data/branding'
import { AuditWorkspaceProvider } from './features/shared/context/AuditWorkspaceContext'
import { ShellChromeProvider } from './features/shared/context/ShellChromeProvider'
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
import GenericAuditReportPage from './features/generic/pages/ReportPage'
import CanonicalAuditRoute from './features/shared/components/CanonicalAuditRoute'
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
      <ShellChromeProvider>
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
              <Route
                path="audits/:auditId/vda63"
                element={(
                  <CanonicalAuditRoute expectedAuditType="vda63">
                    <Vda63AuditInfoPage />
                  </CanonicalAuditRoute>
                )}
              />
              <Route
                path="audits/:auditId/vda63/:chapter"
                element={(
                  <CanonicalAuditRoute expectedAuditType="vda63">
                    <Vda63ChapterPage />
                  </CanonicalAuditRoute>
                )}
              />
              <Route
                path="audits/:auditId/vda63/summary"
                element={(
                  <CanonicalAuditRoute expectedAuditType="vda63">
                    <Vda63SummaryPage />
                  </CanonicalAuditRoute>
                )}
              />
              <Route
                path="audits/:auditId/vda63/action-plan"
                element={(
                  <CanonicalAuditRoute expectedAuditType="vda63">
                    <Vda63ActionPlanPage />
                  </CanonicalAuditRoute>
                )}
              />
              <Route
                path="audits/:auditId/vda63/report"
                element={(
                  <CanonicalAuditRoute expectedAuditType="vda63">
                    <Vda63ReportPreviewPage />
                  </CanonicalAuditRoute>
                )}
              />
              <Route
                path="audits/:auditId/vda65"
                element={(
                  <CanonicalAuditRoute expectedAuditType="vda65">
                    <Vda65AuditInfoPage />
                  </CanonicalAuditRoute>
                )}
              />
              <Route
                path="audits/:auditId/vda65/product"
                element={(
                  <CanonicalAuditRoute expectedAuditType="vda65">
                    <Vda65ProductInfoPage />
                  </CanonicalAuditRoute>
                )}
              />
              <Route
                path="audits/:auditId/vda65/checklist"
                element={(
                  <CanonicalAuditRoute expectedAuditType="vda65">
                    <Vda65ChecklistPage />
                  </CanonicalAuditRoute>
                )}
              />
              <Route
                path="audits/:auditId/vda65/results"
                element={(
                  <CanonicalAuditRoute expectedAuditType="vda65">
                    <Vda65ResultsPage />
                  </CanonicalAuditRoute>
                )}
              />
              <Route
                path="audits/:auditId/vda65/findings"
                element={(
                  <CanonicalAuditRoute expectedAuditType="vda65">
                    <Vda65FindingsPage />
                  </CanonicalAuditRoute>
                )}
              />
              <Route
                path="audits/:auditId/vda65/action-plan"
                element={(
                  <CanonicalAuditRoute expectedAuditType="vda65">
                    <Vda65ActionPlanPage />
                  </CanonicalAuditRoute>
                )}
              />
              <Route
                path="audits/:auditId/vda65/report"
                element={(
                  <CanonicalAuditRoute expectedAuditType="vda65">
                    <Vda65ReportPreviewPage />
                  </CanonicalAuditRoute>
                )}
              />
              <Route
                path="audits/:auditId/:auditType/action-plan"
                element={(
                  <CanonicalAuditRoute>
                    <GenericAuditActionPlanPage />
                  </CanonicalAuditRoute>
                )}
              />
              <Route
                path="audits/:auditId/:auditType/report"
                element={(
                  <CanonicalAuditRoute>
                    <GenericAuditReportPage />
                  </CanonicalAuditRoute>
                )}
              />
              <Route
                path="audits/:auditId/:auditType"
                element={(
                  <CanonicalAuditRoute>
                    <GenericAuditInfoPage />
                  </CanonicalAuditRoute>
                )}
              />
              <Route path="vda63" element={<Navigate to="/audits" replace />} />
              <Route path="vda65" element={<Navigate to="/audits" replace />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ShellChromeProvider>
    </AuditWorkspaceProvider>
  )
}

export default App
