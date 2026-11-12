import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import AccessDeniedPage from './pages/AccessDeniedPage.jsx';
import PlaceholderDashboard from './pages/PlaceholderDashboard.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import RoleBasedRoute from './routes/RoleBasedRoute.jsx';
import CitizenDashboardPage from './pages/CitizenDashboardPage.jsx';
import SubmitGrievancePage from './pages/SubmitGrievancePage.jsx';
import MyGrievancesPage from './pages/MyGrievancesPage.jsx';
import GrievanceDetailsPage from './pages/GrievanceDetailsPage.jsx';
import TrackGrievancePage from './pages/TrackGrievancePage.jsx';
import { CitizenLayout } from './components/CitizenPortal.jsx';
import { CmoLayout } from './components/CmoPortal.jsx';
import CmoDashboardPage from './pages/CmoDashboardPage.jsx';
import CmoGrievancesPage from './pages/CmoGrievancesPage.jsx';
import CmoGrievanceDetailsPage from './pages/CmoGrievanceDetailsPage.jsx';
import CmoDepartmentsPage from './pages/CmoDepartmentsPage.jsx';
import CmoProfilePage from './pages/CmoProfilePage.jsx';
import { OfficerDashboard, OfficerGrievanceDetails, OfficerLayout, OfficerQueue } from './pages/OfficerPages.jsx';
import CmoActionReportsPage from './pages/CmoActionReportsPage.jsx';
import CmoActionReportDetailsPage from './pages/CmoActionReportDetailsPage.jsx';

export default function App() {
  return <AuthProvider><Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/access-denied" element={<AccessDeniedPage />} />
    <Route path="/track-grievance" element={<TrackGrievancePage />} />
    <Route element={<ProtectedRoute />}>
      <Route path="/citizen" element={<RoleBasedRoute allowedRoles={['citizen']}><CitizenLayout /></RoleBasedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<CitizenDashboardPage />} />
        <Route path="submit-grievance" element={<SubmitGrievancePage />} />
        <Route path="my-grievances" element={<MyGrievancesPage />} />
        <Route path="grievances/:id" element={<GrievanceDetailsPage />} />
      </Route>
      <Route path="/cmo" element={<RoleBasedRoute allowedRoles={['cmo_admin']}><CmoLayout /></RoleBasedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<CmoDashboardPage />} />
        <Route path="grievances" element={<CmoGrievancesPage />} />
        <Route path="grievances/:id" element={<CmoGrievanceDetailsPage />} />
        <Route path="departments" element={<CmoDepartmentsPage />} />
        <Route path="profile" element={<CmoProfilePage />} />
        <Route path="action-reports" element={<CmoActionReportsPage />} />
        <Route path="action-reports/:id" element={<CmoActionReportDetailsPage />} />
      </Route>
      <Route path="/officer" element={<RoleBasedRoute allowedRoles={['department_officer']}><OfficerLayout><Outlet/></OfficerLayout></RoleBasedRoute>}>
        <Route index element={<Navigate to="dashboard" replace/>}/><Route path="dashboard" element={<OfficerDashboard/>}/><Route path="grievances" element={<OfficerQueue/>}/><Route path="grievances/:id" element={<OfficerGrievanceDetails/>}/>
      </Route>
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></AuthProvider>;
}
