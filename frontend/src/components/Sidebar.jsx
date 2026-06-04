import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/',           icon: '📊', label: 'Dashboard' },
  { path: '/journal',    icon: '📝', label: 'Smart Journal' },
  { path: '/chat',       icon: '💬', label: 'AI Companion' },
  { path: '/community',  icon: '🤝', label: 'Community' },
  { path: '/poetry',     icon: '🎭', label: 'Poetry & Writing' },
  { path: '/letters',    icon: '💌', label: 'Future Letters' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const initials = user?.displayName
    ? user.displayName.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || 'U';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🌿</div>
        <div>
          <h1>ReflectAI</h1>
          <span>Your Reflection Companion</span>
        </div>
      </div>

      <nav>
        {navItems.map(({ path, icon, label }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-chip" onClick={handleLogout} title="Click to sign out">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.displayName || 'Student'}</div>
            <div className="user-email">{user?.email}</div>
          </div>
          <span style={{ fontSize: 16, color: 'var(--text-muted)' }}>↗</span>
        </div>
      </div>
    </aside>
  );
}
