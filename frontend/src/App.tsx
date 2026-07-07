import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from './store/useAuthStore';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Navbar from './components/Navbar';
import CreateProject from './pages/CreateProject';
import ProjectPage from './pages/ProjectPage';
import Workspace from './pages/Workspace';
import Profile from './pages/Profile';
import Discovery from './pages/Discovery';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { user, loading, initialized } = useAuthStore();

  if (loading && !initialized) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <div className="spinner">Loading ICON...</div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  const checkUserSession = useAuthStore((state) => state.checkUserSession);
  const initialized = useAuthStore((state) => state.initialized);

  useEffect(() => {
    checkUserSession();
  }, [checkUserSession]);

  if (!initialized) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        <div className="spinner">Initializing...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <Navbar />
                <main className="container" style={{ marginTop: '2rem', paddingBottom: '4rem' }}>
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/discovery" element={<Discovery />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/project/new" element={<CreateProject />} />
                    <Route path="/project/:id" element={<ProjectPage />} />
                    <Route path="/project/:id/workspace" element={<Workspace />} />
                    <Route path="*" element={<Navigate to="/dashboard" />} />
                  </Routes>
                </main>
              </PrivateRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
