import { useEffect, Suspense, lazy } from "react"
import { Routes, Route, useLocation, Navigate } from "react-router-dom"
import ProtectedRoute from "./components/ProtectedRoute"
import ErrorBoundary from "./components/ErrorBoundary"
import { ToastProvider } from "./components/Toast"
import VibrantLayout from "./pages/vibrant/VibrantLayout"
import VibrantLogin from "./pages/vibrant/VibrantLogin"
import VibrantDashboard from "./pages/vibrant/VibrantDashboard"
import ChangePasswordFirstLogin from "./pages/auth/ChangePasswordFirstLogin"
import "./styles/vibrant-theme.css"

const Projects = lazy(() => import("./pages/projects/Projects"))
const ProjectForm = lazy(() => import("./pages/projects/ProjectForm"))
const ProjectDetails = lazy(() => import("./pages/projects/ProjectDetails"))
const Staff = lazy(() => import("./pages/staff/Staff"))
const Vehicles = lazy(() => import("./pages/vehicles/Vehicles"))
const Materials = lazy(() => import("./pages/materials/Materials"))
const Finance = lazy(() => import("./pages/finance/Finance"))
const AddTransaction = lazy(() => import("./pages/transactions/AddTransaction"))
const Invoices = lazy(() => import("./pages/invoices/Invoices"))
const AttendanceUnified = lazy(() => import("./pages/attendance/AttendanceUnified"))
const AttendanceReport = lazy(() => import("./pages/attendance/AttendanceReport"))
const AttendancePhotoApprovals = lazy(() => import("./pages/attendance/AttendancePhotoApprovals"))
const Suppliers = lazy(() => import("./pages/procurement/Suppliers"))
const Purchases = lazy(() => import("./pages/procurement/Purchases"))
const Sales = lazy(() => import("./pages/sales/Sales"))
const Store = lazy(() => import("./pages/inventory/Store"))
const ReportsPage = lazy(() => import("./pages/reports/ReportsPage"))
const Documents = lazy(() => import("./pages/documents/Documents"))
const PlanViewer3D = lazy(() => import("./pages/plan-viewer/PlanViewer3D"))
const Profile = lazy(() => import("./pages/profile/Profile"))
const Settings = lazy(() => import("./pages/profile/Settings"))
const PayrollCyclePage = lazy(() => import("./pages/staff/PayrollCyclePage"))
const BudgetPage = lazy(() => import("./pages/finance/BudgetPage"))
const Estimates = lazy(() => import("./pages/quotes/Estimates"))
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"))
const Users = lazy(() => import("./pages/admin/Users"))

const LoadingFallback = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '60vh',
    color: 'var(--v-text-muted)',
    fontSize: '14px',
    gap: '10px'
  }}>
    <div style={{
      width: '24px',
      height: '24px',
      border: '3px solid var(--v-border)',
      borderTopColor: 'var(--v-primary)',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    }} />
    Loading...
    <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
  </div>
)

function App() {
  const location = useLocation()
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register" || location.pathname === "/change-password-first-login"

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <ErrorBoundary>
      <ToastProvider>
        <div style={{ minHeight: "100vh", background: "var(--v-bg-dark)" }}>
          <Routes>
            <Route path="/login" element={<VibrantLogin />} />
            <Route path="/register" element={<VibrantLogin />} />
            <Route path="/change-password-first-login" element={
              <ProtectedRoute><ChangePasswordFirstLogin /></ProtectedRoute>
            } />

            <Route path="/*" element={
              <ProtectedRoute>
                <VibrantLayout>
                  <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                      <Route path="/" element={<VibrantDashboard />} />
                      <Route path="/dashboard" element={<VibrantDashboard />} />
                      <Route path="/projects" element={<Projects />} />
                      <Route path="/projects/new" element={<ProjectForm />} />
                      <Route path="/projects/:id" element={<ProjectDetails />} />
                      <Route path="/projects/:id/edit" element={<ProjectForm />} />
                      <Route path="/staff" element={<Staff />} />
                      <Route path="/vehicles" element={<Vehicles />} />
                      <Route path="/materials" element={<Materials />} />
                      <Route path="/finance" element={<Finance />} />
                      <Route path="/finance/add" element={<AddTransaction />} />
                      <Route path="/finance/transactions" element={<Navigate to="/finance" replace />} />
                      <Route path="/invoices" element={<Invoices />} />
                      <Route path="/attendance/unified" element={<AttendanceUnified />} />
                      <Route path="/attendance/report" element={<AttendanceReport />} />
                      <Route path="/attendance/approvals" element={<AttendancePhotoApprovals />} />
                      <Route path="/suppliers" element={<Suppliers />} />
                      <Route path="/purchases" element={<Purchases />} />
                      <Route path="/sales" element={<Sales />} />
                      <Route path="/store" element={<Store />} />
                      <Route path="/reports" element={<ReportsPage />} />
                      <Route path="/documents" element={<Documents />} />
                      <Route path="/plan-viewer" element={<PlanViewer3D />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/payroll" element={<PayrollCyclePage />} />
                      <Route path="/budgets" element={<BudgetPage />} />
                      <Route path="/estimates" element={<Estimates />} />
                      <Route path="/admin/dashboard" element={<AdminDashboard />} />
                      <Route path="/admin/users" element={<Users />} />
                      <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </Suspense>
                </VibrantLayout>
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </ToastProvider>
    </ErrorBoundary>
  )
}

export default App
