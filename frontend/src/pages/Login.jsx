import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Supernova from '../components/Supernova';

/**
 * Login Component
 */
export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { login, error, setError } = useAuth(); // 🔥 use global error

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLocalError('');
    setError(null);

    if (!email.trim() || !password) {
      setLocalError('Email and password are required');
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(email, password);

      if (result?.success) {
        navigate('/');
      } else {
        setLocalError('Invalid credentials');
        setPassword(''); // 🔥 clear password on failure
      }
    } catch {
      setLocalError('Login failed. Try again.');
    } finally {
      setIsLoading(false); // 🔥 FIX: prevents infinite loading
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-slate-100 font-sans">
      <Supernova />

      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-premium-in {
          animation: fadeInScale 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .glass-card {
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
          transition: all 0.3s ease;
        }
        .login-card:hover {
          box-shadow: 0 0 30px rgba(59, 130, 246, 0.4);
          transform: translateY(-2px);
          border-color: rgba(59, 130, 246, 0.3);
        }
      `}</style>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md animate-premium-in">
          <div className="glass-card login-card p-8 rounded-[2rem] border border-white/10">

            {/* Header */}
            <div className="flex flex-col items-center mb-10">
              <div className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center mb-6 border border-primary/20 shadow-lg shadow-primary/10">
                <Shield className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tighter">
                THREAT<span className="text-primary">OPS</span>
              </h1>
              <p className="text-slate-400 mt-2 text-sm font-medium">
                Cybersecurity Monitoring System
              </p>
            </div>

            {/* 🔥 ERROR DISPLAY */}
            {(localError || error) && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{localError || error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* EMAIL */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setLocalError('');
                      setError(null);
                    }}
                    className="block w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-white/5 rounded-2xl focus:ring-2 focus:ring-primary/40 outline-none"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setLocalError('');
                      setError(null);
                    }}
                    className="block w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-white/5 rounded-2xl focus:ring-2 focus:ring-primary/40 outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* BUTTON */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-4 rounded-2xl font-bold text-white bg-primary hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Authenticating...
                  </span>
                ) : (
                  'Sign In to Dashboard'
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-slate-500 text-sm">
                Need access?{' '}
                <Link to="/register" className="text-primary hover:underline font-bold">
                  Request Account
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center mt-8 text-slate-600 text-[10px] tracking-widest uppercase font-bold opacity-50">
            &copy; 2026 ThreatOps Systems
          </p>
        </div>
      </div>
    </div>
  );
};