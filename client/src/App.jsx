import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

// Public Pages
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Student & Shared Portal Pages
import StudentDashboard from './pages/student/StudentDashboard';
import InteractiveFloorMap from './pages/student/InteractiveFloorMap';
import ResourceExplorer from './pages/student/ResourceExplorer';
import ResourceDetailsPage from './pages/student/ResourceDetailsPage';
import BookingPage from './pages/student/BookingPage';
import BookingConfirmationPage from './pages/student/BookingConfirmationPage';
import QrCodePage from './pages/student/QrCodePage';
import MyReservationsPage from './pages/student/MyReservationsPage';
import BookingHistoryPage from './pages/student/BookingHistoryPage';
import ProfilePage from './pages/student/ProfilePage';

// Faculty Portal Pages
import FacultyDashboard from './pages/faculty/FacultyDashboard';

// Admin Portal Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ResourceManagementPage from './pages/admin/ResourceManagementPage';
import AddResourcePage from './pages/admin/AddResourcePage';
import EditResourcePage from './pages/admin/EditResourcePage';
import UserManagementPage from './pages/admin/UserManagementPage';
import BookingManagementPage from './pages/admin/BookingManagementPage';
import NoShowManagementPage from './pages/admin/NoShowManagementPage';
import AnalyticsDashboardPage from './pages/admin/AnalyticsDashboardPage';
import AuditLogsPage from './pages/admin/AuditLogsPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Student Portal Routes */}
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="floor-map" element={<InteractiveFloorMap />} />
            <Route path="resources" element={<ResourceExplorer />} />
            <Route path="resources/:id" element={<ResourceDetailsPage />} />
            <Route path="book" element={<BookingPage />} />
            <Route path="booking-confirmation" element={<BookingConfirmationPage />} />
            <Route path="checkin" element={<QrCodePage />} />
            <Route path="qr/:bookingCode" element={<QrCodePage />} />
            <Route path="reservations" element={<MyReservationsPage />} />
            <Route path="history" element={<BookingHistoryPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Faculty Portal Routes */}
          <Route
            path="/faculty"
            element={
              <ProtectedRoute allowedRoles={['FACULTY']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<FacultyDashboard />} />
            <Route path="floor-map" element={<InteractiveFloorMap />} />
            <Route path="resources" element={<ResourceExplorer />} />
            <Route path="resources/:id" element={<ResourceDetailsPage />} />
            <Route path="book" element={<BookingPage />} />
            <Route path="booking-confirmation" element={<BookingConfirmationPage />} />
            <Route path="checkin" element={<QrCodePage />} />
            <Route path="qr/:bookingCode" element={<QrCodePage />} />
            <Route path="reservations" element={<MyReservationsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          {/* Admin Portal Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="resources" element={<ResourceManagementPage />} />
            <Route path="resources/add" element={<AddResourcePage />} />
            <Route path="resources/edit/:id" element={<EditResourcePage />} />
            <Route path="users" element={<UserManagementPage />} />
            <Route path="bookings" element={<BookingManagementPage />} />
            <Route path="no-shows" element={<NoShowManagementPage />} />
            <Route path="analytics" element={<AnalyticsDashboardPage />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;