import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import JournalPage from './pages/JournalPage';
import ChatPage from './pages/ChatPage';
import CommunityPage from './pages/CommunityPage';
import PoetryPage from './pages/PoetryPage';
import LettersPage from './pages/LettersPage';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        height: '100vh', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: 'var(--bg)', 
        color: 'var(--text)' 
      }}>
        <div className="skeleton" style={{ padding: '20px 40px', borderRadius: 'var(--radius)' }}>
          Loading ReflectAI...
        </div>
      </div>
    );
  }

  return user ? children : <Navigate to="/auth" replace />;
}

export default function App() {
  const { user } = useAuth();

  return (
    <Router>
      <div className={user ? "app-layout" : ""}>
        {user && <Sidebar />}
        <main className={user ? "main-content" : ""}>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/journal" element={<PrivateRoute><JournalPage /></PrivateRoute>} />
            <Route path="/chat" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
            <Route path="/community" element={<PrivateRoute><CommunityPage /></PrivateRoute>} />
            <Route path="/poetry" element={<PrivateRoute><PoetryPage /></PrivateRoute>} />
            <Route path="/letters" element={<PrivateRoute><LettersPage /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
