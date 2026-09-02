import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ThemeToggle from './components/ThemeToggle';
import { useAuthStore } from './store/authStore';
import { canAccessInterface } from './utils/permissions';
import { ToastProvider } from './components/Toast';
import './styles/index.css';

// Each page is its own chunk, fetched on first visit to that route instead
// of bloating the initial bundle everyone downloads just to see the login
// screen or the calendar.
const LoginPage = lazy(() => import('./pages/LoginPage'));
const CalendarView = lazy(() => import('./pages/CalendarView'));
const EmployeesPage = lazy(() => import('./pages/EmployeesPage'));
const RolesPage = lazy(() => import('./pages/RolesPage'));
const CompaniesPage = lazy(() => import('./pages/CompaniesPage'));
const ShiftsPage = lazy(() => import('./pages/ShiftsPage'));

const RouteFallback = () => <div style={{ padding: '2rem', textAlign: 'center' }}>Chargement...</div>;

// Mirrors the Sidebar's nav list — used to redirect a role away from an
// interface it can't access, to the first one it can (instead of a hardcoded
// "/calendar" that could itself be blocked for that role).
const INTERFACE_ROUTES = [
  { path: '/calendar', interfaceKey: 'calendar' },
  { path: '/employees', interfaceKey: 'users' },
  { path: '/roles', interfaceKey: 'roles' },
  { path: '/companies', interfaceKey: 'companies' },
  { path: '/shifts', interfaceKey: 'shifts' },
];

const getDefaultRoute = (user) => {
  const firstAllowed = INTERFACE_ROUTES.find(r => canAccessInterface(user, r.interfaceKey));
  return firstAllowed ? firstAllowed.path : '/login';
};

const ProtectedRoute = ({ children, interfaceKey }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  // A valid token means isAuthenticated flips true immediately, but the
  // role-bearing user profile only arrives once fetchUser() resolves.
  // Deciding interface access before that would always read as "denied".
  if (!user) return <RouteFallback />;
  if (interfaceKey && !canAccessInterface(user, interfaceKey)) {
    return <Navigate to={getDefaultRoute(user)} replace />;
  }
  return children;
};

function App() {
  const { fetchUser, isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <ToastProvider>
      <ThemeToggle />
      <BrowserRouter>
        {!isAuthenticated ? (
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
        ) : !user ? (
          // A valid token flips isAuthenticated immediately, but the
          // role-bearing profile only arrives once fetchUser() resolves.
          // Hold off on the whole authenticated shell (Sidebar included) —
          // rendering Sidebar early made it briefly show with no nav items,
          // since canAccessInterface(null, ...) fails closed.
          <RouteFallback />
        ) : (
          <div className="app-container">
            <Sidebar />
            <main className="main-content">
              <div className="content-area">
                <Suspense fallback={<RouteFallback />}>
                  <Routes>
                    <Route path="/" element={<Navigate to={getDefaultRoute(user)} replace />} />
                    <Route path="/calendar" element={
                      <ProtectedRoute interfaceKey="calendar">
                        <CalendarView />
                      </ProtectedRoute>
                    } />
                    <Route path="/employees" element={<ProtectedRoute interfaceKey="users"><EmployeesPage /></ProtectedRoute>} />
                    <Route path="/roles" element={<ProtectedRoute interfaceKey="roles"><RolesPage /></ProtectedRoute>} />
                    <Route path="/companies" element={<ProtectedRoute interfaceKey="companies"><CompaniesPage /></ProtectedRoute>} />
                    <Route path="/shifts" element={<ProtectedRoute interfaceKey="shifts"><ShiftsPage /></ProtectedRoute>} />
                    <Route path="*" element={<Navigate to={getDefaultRoute(user)} replace />} />
                  </Routes>
                </Suspense>
              </div>
            </main>
          </div>
        )}
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
