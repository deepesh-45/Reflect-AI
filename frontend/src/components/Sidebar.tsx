import { 
  LayoutDashboard, 
  NotebookPen, 
  Brain, 
  ScrollText, 
  Users, 
  Hourglass, 
  Plus, 
  Sparkle,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
  onNewReflection: () => void;
}

export default function Sidebar({ currentView, setView, onNewReflection }: SidebarProps) {
  const { user, logout } = useAuth();
  
  const navItems = [
    { id: 'home', label: 'Home', icon: LayoutDashboard },
    { id: 'journal', label: 'Smart Journal', icon: NotebookPen },
    { id: 'assistant', label: 'AI Companion', icon: Brain },
    { id: 'writing-hub', label: 'Writing Hub', icon: ScrollText },
    { id: 'community', label: 'Community Feed', icon: Users },
    { id: 'future', label: 'Future Self', icon: Hourglass },
  ];

  // Helper to get initials
  const getInitials = () => {
    if (!user) return '??';
    if (user.displayName) {
      return user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return user.email ? user.email.slice(0, 2).toUpperCase() : 'US';
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error('Failed to log out:', e);
    }
  };

  return (
    <aside className="w-64 bg-surface-container-lowest border-r border-outline-variant/20 shadow-sm flex flex-col h-screen fixed left-0 top-0 z-30 transition-all duration-300">
      
      {/* Brand Logo & Title */}
      <div className="p-6 pb-2">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-lg select-none">
            <span className="flex items-center text-white"><Sparkle className="w-5 h-5 fill-white" /></span>
          </div>
          <div>
            <h1 className="font-display font-semibold text-lg text-primary leading-tight">ReflectAI</h1>
            <p className="text-xs text-on-surface-variant/80 font-medium tracking-tight">Digital Sanctuary</p>
          </div>
        </div>
      </div>

      {/* Nav Link Lists */}
      <nav className="flex-1 mt-6 px-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 outline-none select-none text-left font-medium cursor-pointer ${
                isActive
                  ? 'text-primary bg-primary/10 border-r-4 border-primary font-semibold shadow-sm'
                  : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low/60 hover:scale-[1.01]'
              }`}
            >
              <Icon className={`w-5 h-5 mr-4 transition-transform ${isActive ? 'scale-105' : 'opacity-80'}`} />
              <span className="text-sm tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Action Space */}
      <div className="p-4 border-t border-surface-container-high space-y-4">
        <button
          onClick={onNewReflection}
          className="w-full bg-primary text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 shadow-md hover:bg-primary/95 transition-all duration-200 hover:scale-[1.02] active:scale-95 group cursor-pointer"
        >
          <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
          <span className="text-sm">New Reflection</span>
        </button>

        {/* User Card with logout */}
        <div className="flex items-center justify-between p-2 bg-surface-container-low/40 rounded-xl border border-outline-variant/10">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant/30 flex-shrink-0 bg-primary-container/20 flex items-center justify-center text-primary font-bold text-sm">
              {user?.photoURL ? (
                <img 
                  alt="User Profile" 
                  src={user.photoURL} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                getInitials()
              )}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-on-surface truncate">{user?.displayName || 'Student'}</p>
              <p className="text-xs text-on-surface-variant/80 font-medium truncate">{user?.email || 'Reflector'}</p>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            title="Log Out"
            className="p-2 hover:bg-error-container/10 hover:text-error rounded-lg transition-colors text-on-surface-variant/80 shrink-0 cursor-pointer"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

    </aside>
  );
}
