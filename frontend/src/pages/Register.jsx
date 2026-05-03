import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, Mail, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import Supernova from '../components/Supernova';

/**
 * Register Component
 */
export const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('All fields are required');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      // 🔥 REQUIRED: Map email to username for backend
      const res = await api.post('/auth/register', {
        username: email,
        password,
      });

      if (res.data) {
        setIsSuccess(true);
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-slate-100 font-sans">
      {/* 🔥 REQUIRED: Supernova Background at root with z-index: 0 */}
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
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
        }
      `}</style>

      {/* 🔥 REQUIRED: Content container with z-index: 10 */}
      <div className="flex items-center justify-center min-h-screen relative z-10 p-4">
        <div className="w-full max-w-md animate-premium-in">
          <div className="glass-card p-8 rounded-[2rem] border border-white/10">
            {/* Header */}
            <div className="flex flex-col items-center mb-10">
              <div className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center mb-6 border border-primary/20">
                <Shield className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tighter">
                CREATE<span className="text-primary">ACCOUNT</span>
              </h1>
              <p className="text-slate-400 mt-2 text-sm font-medium">Join the Defense Network</p>
            </div>

            {isSuccess ? (
              <div className="text-center py-8 space-y-4">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto animate-bounce" />
                <h2 className="text-xl font-bold">Registration Successful!</h2>
                <p className="text-slate-400">Redirecting to login portal...</p>
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-white/5 rounded-2xl focus:ring-2 focus:ring-primary/40 outline-none transition-all"
                        placeholder="name@company.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-white/5 rounded-2xl focus:ring-2 focus:ring-primary/40 outline-none transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="block w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-white/5 rounded-2xl focus:ring-2 focus:ring-primary/40 outline-none transition-all"
                        placeholder="Repeat password"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 px-4 rounded-2xl font-bold text-white bg-primary hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg"
                  >
                    {isLoading ? 'Creating Account...' : 'Register Now'}
                  </button>
                </form>

                <div className="mt-8 text-center">
                  <p className="text-slate-500 text-sm">
                    Already have access?{' '}
                    <Link to="/login" className="text-primary hover:underline font-bold">Sign In</Link>
                  </p>
                </div>
              </>
            )}
          </div>
          <p className="text-center mt-8 text-slate-600 text-[10px] tracking-widest uppercase font-bold opacity-50">
            &copy; 2026 ThreatOps Systems
          </p>
        </div>
      </div>
    </div>
  );
};

