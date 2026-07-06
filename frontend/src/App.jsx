import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/public/Landing';
import Login from './pages/public/Login';
import Signup from './pages/public/Signup';
import StudentDashboard from './pages/student/Dashboard';
import ExamList from './pages/student/ExamList';
import ExamInterface from './pages/student/ExamInterface';
import ResultDetail from './pages/student/ResultDetail';
import Profile from './pages/student/Profile';
import AdminDashboard from './pages/admin/Dashboard';
import Students from './pages/admin/Students';
import Exams from './pages/admin/Exams';
import Questions from './pages/admin/Questions';
import Results from './pages/admin/Results';
import Settings from './pages/admin/Settings';
import DashboardLayout from './components/layout/DashboardLayout';
import { ExamProvider } from './context/ExamContext';
import { useAuth } from './context/AuthContext';

const RouteGuard = ({ children, role }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-darkBg">
        <svg className="animate-spin h-8 w-8 text-brand-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} replace />;
  }

  return children;
};

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public Landing & Auth Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Student Pages (Wrapped inside ExamProvider for active sessions) */}
        <Route
          path="/student/*"
          element={
            <RouteGuard role="student">
              <ExamProvider>
                <Routes>
                  <Route
                    path="dashboard"
                    element={
                      <DashboardLayout requiredRole="student">
                        <StudentDashboard />
                      </DashboardLayout>
                    }
                  />
                  <Route
                    path="exams"
                    element={
                      <DashboardLayout requiredRole="student">
                        <ExamList />
                      </DashboardLayout>
                    }
                  />
                  <Route
                    path="results/:resultId"
                    element={
                      <DashboardLayout requiredRole="student">
                        <ResultDetail />
                      </DashboardLayout>
                    }
                  />
                  <Route
                    path="profile"
                    element={
                      <DashboardLayout requiredRole="student">
                        <Profile />
                      </DashboardLayout>
                    }
                  />
                  {/* High security screen doesn't show sidebars/headers layout */}
                  <Route path="exam/:examId" element={<ExamInterface />} />
                </Routes>
              </ExamProvider>
            </RouteGuard>
          }
        />

        {/* Admin Pages */}
        <Route
          path="/admin/*"
          element={
            <RouteGuard role="admin">
              <Routes>
                <Route
                  path="dashboard"
                  element={
                    <DashboardLayout requiredRole="admin">
                      <AdminDashboard />
                    </DashboardLayout>
                  }
                />
                <Route
                  path="students"
                  element={
                    <DashboardLayout requiredRole="admin">
                      <Students />
                    </DashboardLayout>
                  }
                />
                <Route
                  path="exams"
                  element={
                    <DashboardLayout requiredRole="admin">
                      <Exams />
                    </DashboardLayout>
                  }
                />
                <Route
                  path="questions"
                  element={
                    <DashboardLayout requiredRole="admin">
                      <Questions />
                    </DashboardLayout>
                  }
                />
                <Route
                  path="results"
                  element={
                    <DashboardLayout requiredRole="admin">
                      <Results />
                    </DashboardLayout>
                  }
                />
                <Route
                  path="settings"
                  element={
                    <DashboardLayout requiredRole="admin">
                      <Settings />
                    </DashboardLayout>
                  }
                />
              </Routes>
            </RouteGuard>
          }
        />

        {/* Fallback Redirection */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
