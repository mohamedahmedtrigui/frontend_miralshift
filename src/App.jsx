import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import { useAuthStore } from './store/authStore';
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

const RouteFallback = () => <div style={{ padding: '2rem', textAlign: 'center' }}>Chargement...</div>;

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  const { fetchUser, isAuthenticated } = useAuthStore();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <ToastProvider>
      <BrowserRouter>
        {!isAuthenticated ? (
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Suspense>
        ) : (
          <div className="app-container">
            <Sidebar />
            <main className="main-content">
              <div className="content-area">
                <Suspense fallback={<RouteFallback />}>
                  <Routes>
                    <Route path="/" element={<Navigate to="/calendar" replace />} />
                    <Route path="/calendar" element={
                      <ProtectedRoute>
                        <CalendarView />
                      </ProtectedRoute>
                    } />
                    <Route path="/employees" element={<ProtectedRoute><EmployeesPage /></ProtectedRoute>} />
                    <Route path="/roles" element={<ProtectedRoute><RolesPage /></ProtectedRoute>} />
                    <Route path="/companies" element={<ProtectedRoute><CompaniesPage /></ProtectedRoute>} />
                    <Route path="*" element={<Navigate to="/calendar" replace />} />
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
