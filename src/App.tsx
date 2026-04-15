import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import './App.css'
import { APP_NAME } from './data/branding'
import { AuditWorkspaceProvider } from './features/shared/context/AuditWorkspaceContext'
import { ShellChromeProvider } from './features/shared/context/ShellChromeProvider'
import AppLayout from './layouts/AppLayout'
import Dashboard from './pages/Dashboard'
import AuditsPage from './pages/AuditsPage'
import NotFound from './pages/NotFound'
import CanonicalAuditRoute from './features/shared/components/CanonicalAuditRoute'

const YearCalendarPage = lazy(() => import('./features/planning/pages/YearCalendarPage'))
const ThreeYearPlanPage = lazy(() => import('./features/planning/pages/ThreeYearPlanPage'))
const PlanningReportsPage = lazy(() => import('./features/planning/pages/PlanningReportsPage'))
const PlanningChecklistPage = lazy(() => import('./features/planning/pages/PlanningChecklistPage'))
const GenericAuditActionPlanPage = lazy(() => import('./features/generic/pages/ActionPlanPage'))
const GenericAuditInfoPage = lazy(() => import('./features/generic/pages/AuditInfoPage'))
const GenericAuditReportPage = lazy(() => import('./features/generic/pages/ReportPage'))
const Vda63AuditInfoPage = lazy(() => import('./features/vda63/pages/AuditInfoPage'))
const Vda63ChapterPage = lazy(() => import('./features/vda63/pages/ChapterPage'))
const Vda63SummaryPage = lazy(() => import('./features/vda63/pages/SummaryPage'))
const Vda63ActionPlanPage = lazy(() => import('./features/vda63/pages/ActionPlanPage'))
const Vda63ReportPreviewPage = lazy(() => import('./features/vda63/pages/ReportPreviewPage'))
const Vda65AuditInfoPage = lazy(() => import('./features/vda65/pages/AuditInfoPage'))
const Vda65ProductInfoPage = lazy(() => import('./features/vda65/pages/ProductInfoPage'))
const Vda65ChecklistPage = lazy(() => import('./features/vda65/pages/ChecklistPage'))
const Vda65ResultsPage = lazy(() => import('./features/vda65/pages/ResultsPage'))
const Vda65FindingsPage = lazy(() => import('./features/vda65/pages/FindingsPage'))
const Vda65ActionPlanPage = lazy(() => import('./features/vda65/pages/ActionPlanPage'))
const Vda65ReportPreviewPage = lazy(() => import('./features/vda65/pages/ReportPreviewPage'))

function RouteLoadingFallback() {
  return (
    <div className="module-page">
      <section className="panel">
        <div className="panel-body">
          <div className="empty-state">
            <h3>Loading workspace</h3>
            <p>Preparing the requested audit module.</p>
          </div>
        </div>
      </section>
    </div>
  )
}

function LazyRoute({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<RouteLoadingFallback />}>{children}</Suspense>
}

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
              <Route path="planning/calendar" element={<LazyRoute><YearCalendarPage /></LazyRoute>} />
              <Route path="planning/three-year" element={<LazyRoute><ThreeYearPlanPage /></LazyRoute>} />
              <Route path="planning/reports" element={<LazyRoute><PlanningReportsPage /></LazyRoute>} />
              <Route path="planning/checklist" element={<LazyRoute><PlanningChecklistPage /></LazyRoute>} />
              <Route path="audits" element={<AuditsPage />} />
              <Route
                path="audits/:auditId/vda63"
                element={(
                  <LazyRoute>
                    <CanonicalAuditRoute expectedAuditType="vda63">
                      <Vda63AuditInfoPage />
                    </CanonicalAuditRoute>
                  </LazyRoute>
                )}
              />
              <Route
                path="audits/:auditId/vda63/:chapter"
                element={(
                  <LazyRoute>
                    <CanonicalAuditRoute expectedAuditType="vda63">
                      <Vda63ChapterPage />
                    </CanonicalAuditRoute>
                  </LazyRoute>
                )}
              />
              <Route
                path="audits/:auditId/vda63/summary"
                element={(
                  <LazyRoute>
                    <CanonicalAuditRoute expectedAuditType="vda63">
                      <Vda63SummaryPage />
                    </CanonicalAuditRoute>
                  </LazyRoute>
                )}
              />
              <Route
                path="audits/:auditId/vda63/action-plan"
                element={(
                  <LazyRoute>
                    <CanonicalAuditRoute expectedAuditType="vda63">
                      <Vda63ActionPlanPage />
                    </CanonicalAuditRoute>
                  </LazyRoute>
                )}
              />
              <Route
                path="audits/:auditId/vda63/report"
                element={(
                  <LazyRoute>
                    <CanonicalAuditRoute expectedAuditType="vda63">
                      <Vda63ReportPreviewPage />
                    </CanonicalAuditRoute>
                  </LazyRoute>
                )}
              />
              <Route
                path="audits/:auditId/vda65"
                element={(
                  <LazyRoute>
                    <CanonicalAuditRoute expectedAuditType="vda65">
                      <Vda65AuditInfoPage />
                    </CanonicalAuditRoute>
                  </LazyRoute>
                )}
              />
              <Route
                path="audits/:auditId/vda65/product"
                element={(
                  <LazyRoute>
                    <CanonicalAuditRoute expectedAuditType="vda65">
                      <Vda65ProductInfoPage />
                    </CanonicalAuditRoute>
                  </LazyRoute>
                )}
              />
              <Route
                path="audits/:auditId/vda65/checklist"
                element={(
                  <LazyRoute>
                    <CanonicalAuditRoute expectedAuditType="vda65">
                      <Vda65ChecklistPage />
                    </CanonicalAuditRoute>
                  </LazyRoute>
                )}
              />
              <Route
                path="audits/:auditId/vda65/results"
                element={(
                  <LazyRoute>
                    <CanonicalAuditRoute expectedAuditType="vda65">
                      <Vda65ResultsPage />
                    </CanonicalAuditRoute>
                  </LazyRoute>
                )}
              />
              <Route
                path="audits/:auditId/vda65/findings"
                element={(
                  <LazyRoute>
                    <CanonicalAuditRoute expectedAuditType="vda65">
                      <Vda65FindingsPage />
                    </CanonicalAuditRoute>
                  </LazyRoute>
                )}
              />
              <Route
                path="audits/:auditId/vda65/action-plan"
                element={(
                  <LazyRoute>
                    <CanonicalAuditRoute expectedAuditType="vda65">
                      <Vda65ActionPlanPage />
                    </CanonicalAuditRoute>
                  </LazyRoute>
                )}
              />
              <Route
                path="audits/:auditId/vda65/report"
                element={(
                  <LazyRoute>
                    <CanonicalAuditRoute expectedAuditType="vda65">
                      <Vda65ReportPreviewPage />
                    </CanonicalAuditRoute>
                  </LazyRoute>
                )}
              />
              <Route
                path="audits/:auditId/:auditType/action-plan"
                element={(
                  <LazyRoute>
                    <CanonicalAuditRoute>
                      <GenericAuditActionPlanPage />
                    </CanonicalAuditRoute>
                  </LazyRoute>
                )}
              />
              <Route
                path="audits/:auditId/:auditType/report"
                element={(
                  <LazyRoute>
                    <CanonicalAuditRoute>
                      <GenericAuditReportPage />
                    </CanonicalAuditRoute>
                  </LazyRoute>
                )}
              />
              <Route
                path="audits/:auditId/:auditType"
                element={(
                  <LazyRoute>
                    <CanonicalAuditRoute>
                      <GenericAuditInfoPage />
                    </CanonicalAuditRoute>
                  </LazyRoute>
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
