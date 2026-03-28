import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import DashboardLayout from './components/layout/DashboardLayout';
import LoginPage from './pages/auth/LoginPage';
import StudentDashboard from './pages/student/StudentDashboard';
import BookCatalog from './pages/student/BookCatalog';
import UserProfile from './pages/student/UserProfile';
import ScanAction from './pages/student/ScanAction';
import Reservations from './pages/student/Reservations';
import FineManagement from './pages/student/FineManagement';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminBooks from './pages/admin/AdminBooks';
import AdminReservations from './pages/admin/AdminReservations';
import AdminFineRequests from './pages/admin/AdminFineRequests';
import { motion } from 'framer-motion';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        className="flex flex-col items-center gap-4"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full"
        />
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-on-surface-dim text-body-md"
        >
          Loading Lib-Link...
        </motion.p>
      </motion.div>
    </div>
  );
  return user ? children : <Navigate to="/" replace />;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  if (user?.role !== 'Admin') return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        className="flex flex-col items-center gap-4"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full"
        />
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-on-surface-dim text-body-md"
        >
          Loading Lib-Link...
        </motion.p>
      </motion.div>
    </div>
  );

  const getDefaultRoute = () => {
    if (!user) return '/';
    return user.role === 'Admin' ? '/admin' : '/dashboard';
  };

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={getDefaultRoute()} replace /> : <LoginPage />} />
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        {/* Student Routes */}
        <Route path="/dashboard" element={<StudentDashboard />} />
        <Route path="/books" element={<BookCatalog />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/scan" element={<ScanAction />} />
        <Route path="/reservations" element={<Reservations />} />
        <Route path="/fines" element={<FineManagement />} />
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/books" element={<AdminRoute><AdminBooks /></AdminRoute>} />
        <Route path="/admin/reservations" element={<AdminRoute><AdminReservations /></AdminRoute>} />
        <Route path="/admin/fines" element={<AdminRoute><AdminFineRequests /></AdminRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#0f1930',
                color: '#dee5ff',
                border: '1px solid rgba(64, 72, 93, 0.3)',
                borderRadius: '12px',
              },
              success: { iconTheme: { primary: '#34d399', secondary: '#060e20' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#060e20' } },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
