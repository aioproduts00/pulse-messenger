import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Database, UserCheck, Shield, Sparkles, AlertCircle, ArrowRight, Phone, Mail, Lock, User, CheckCircle2 } from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { SupabaseConfigModal } from '../common/SupabaseConfigModal';

export const AuthScreen: React.FC = () => {
  const { login, signUp, switchDemoUser, availableDemoUsers, isConfigured } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');

  // Form states
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const result = await login(emailOrPhone, password || 'password123');
        if (!result.success) {
          setError(result.error || 'Failed to log in. Please check credentials.');
        }
      } else {
        if (!displayName.trim() || !username.trim()) {
          setError('Display name and username are required.');
          setLoading(false);
          return;
        }
        const email = authMethod === 'email' ? emailOrPhone : `${username.toLowerCase()}@pulseflow.app`;
        const phone = authMethod === 'phone' ? phoneNumber || emailOrPhone : phoneNumber;
        const result = await signUp(email, password || 'password123', displayName, username, phone);
        if (!result.success) {
          setError(result.error || 'Failed to sign up.');
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication error';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-y-auto selection:bg-teal-500/30 selection:text-teal-200">
      {/* Background ambient glowing nodes */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Connection status bar */}
      <div className="fixed top-4 right-4 z-20 flex items-center gap-2">
        <button
          onClick={() => setShowConfigModal(true)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur border transition cursor-pointer shadow-lg ${
            isConfigured
              ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/60'
              : 'bg-slate-900/80 border-slate-700 text-teal-300 hover:bg-slate-800'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-teal-400" />
          <span>{isConfigured ? 'Supabase Live' : 'Supabase Config'}</span>
          <span
            className={`w-2 h-2 rounded-full ${
              isConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-teal-400'
            }`}
          />
        </button>
      </div>

      <div className="w-full max-w-md z-10 my-8">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-500 shadow-xl shadow-teal-900/40 mb-3 border border-teal-400/30">
            <svg className="w-9 h-9 text-slate-950" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.38 5.07L2 22l5.12-1.34C8.54 21.49 10.22 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
            PulseFlow
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-Time Encrypted Messaging • Calling • Status
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
          {/* Mode Switcher */}
          <div className="flex bg-slate-950/80 p-1 rounded-xl mb-6 border border-slate-800">
            <button
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
                mode === 'login'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
                mode === 'signup'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Display Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jordan Hayes"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Username
                  </label>
                  <div className="relative">
                    <span className="text-slate-500 font-mono text-sm absolute left-3 top-2.5">@</span>
                    <input
                      type="text"
                      required
                      placeholder="jordan_h"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  {authMethod === 'email' ? 'Email Address' : 'Phone Number'}
                </label>
                <button
                  type="button"
                  onClick={() => setAuthMethod(authMethod === 'email' ? 'phone' : 'email')}
                  className="text-[11px] text-teal-400 hover:text-teal-300 hover:underline cursor-pointer"
                >
                  Use {authMethod === 'email' ? 'Phone' : 'Email'} instead
                </button>
              </div>

              <div className="relative">
                {authMethod === 'email' ? (
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                ) : (
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                )}
                <input
                  type={authMethod === 'email' ? 'email' : 'tel'}
                  required
                  placeholder={authMethod === 'email' ? 'alex@company.com' : '+1 (555) 019-2834'}
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-bold text-sm shadow-lg shadow-teal-950/60 transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In to PulseFlow' : 'Create & Launch'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Personas Switcher (for immediate 2-user real-time test flow) */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                Instant Test Personas
              </span>
              <span className="text-[10px] text-teal-400/80 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20">
                1-Click Switch
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
              Instantly log in as any profile to test live conversations, typing signals, and calls:
            </p>

            <div className="space-y-2">
              {availableDemoUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => switchDemoUser(user.id)}
                  className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800/80 hover:border-teal-500/40 transition group cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar src={user.avatar_url} name={user.display_name} size="sm" isOnline={user.is_online} showOnlineStatus />
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-teal-300 transition">
                        {user.display_name}
                      </div>
                      <div className="text-[10px] text-slate-400">@{user.username}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 group-hover:text-teal-400">
                    <span className="text-[10px] font-medium hidden group-hover:inline">Enter</span>
                    <UserCheck className="w-4 h-4" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security and privacy footer note */}
        <div className="mt-6 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-teal-500" />
          <span>PostgreSQL RLS Secured • WebRTC Encrypted • PWA Compliant</span>
        </div>
      </div>

      <SupabaseConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
      />
    </div>
  );
};
