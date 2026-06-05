import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkle, Mail, Lock, User as UserIcon, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!name.trim()) {
          setError('Please enter your name');
          setLoading(false);
          return;
        }
        await signup(name, email, password);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message.replace('Firebase: ', '').replace(/\(auth\/.*\)/, '').trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-background relative overflow-hidden p-4 select-none">
      
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[65vw] h-[65vw] bg-secondary-container/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-[30%] right-[10%] w-[40vw] h-[40vw] bg-tertiary-container/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Glassmorphic Card */}
      <div 
        className="w-full max-w-md bg-surface-container-lowest/80 backdrop-blur-xl rounded-3xl border border-outline-variant/15 p-8 md:p-10 shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-primary-container flex items-center justify-center text-white shadow-lg shadow-primary/20 mb-4 animate-pulse-slow">
            <Sparkle className="w-7 h-7 fill-white/20" />
          </div>
          <h1 className="font-display font-bold text-2xl text-on-surface leading-tight">ReflectAI</h1>
          <p className="text-sm text-on-surface-variant font-medium tracking-tight mt-1">
            {isLogin ? 'Welcome back to your Digital Sanctuary' : 'Create your secure emotional sanctuary'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-error-container/20 border border-error/20 flex items-start space-x-3 text-error">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span className="text-xs font-semibold leading-relaxed">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant tracking-wide uppercase">Your Name</label>
              <div className="relative flex items-center">
                <UserIcon className="w-4 h-4 text-outline absolute left-4" />
                <input
                  type="text"
                  placeholder="e.g. Alex Rivera"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface-container-low/50 border border-outline-variant/20 focus:border-primary focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary rounded-2xl pl-11 pr-4 py-3.5 text-xs font-medium text-on-surface outline-none transition-all placeholder:text-outline-variant/60"
                  required
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface-variant tracking-wide uppercase">Email Address</label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-outline absolute left-4" />
              <input
                type="email"
                placeholder="student@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-container-low/50 border border-outline-variant/20 focus:border-primary focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary rounded-2xl pl-11 pr-4 py-3.5 text-xs font-medium text-on-surface outline-none transition-all placeholder:text-outline-variant/60"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface-variant tracking-wide uppercase">Password</label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-outline absolute left-4" />
              <input
                type="password"
                placeholder={isLogin ? 'Enter password' : 'At least 6 characters'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-container-low/50 border border-outline-variant/20 focus:border-primary focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary rounded-2xl pl-11 pr-4 py-3.5 text-xs font-medium text-on-surface outline-none transition-all placeholder:text-outline-variant/60"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/95 text-white font-semibold py-3.5 px-4 rounded-2xl shadow-md hover:scale-[1.01] active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2 mt-6 text-sm"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Please wait...</span>
              </>
            ) : (
              <span>{isLogin ? 'Sign In 🔑' : 'Create Sanctuary ✨'}</span>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-outline-variant/10 text-center text-xs text-on-surface-variant font-medium">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-primary font-bold ml-1.5 hover:underline cursor-pointer bg-transparent border-none outline-none"
          >
            {isLogin ? 'Create one now' : 'Sign in here'}
          </button>
        </div>
      </div>

    </div>
  );
}
