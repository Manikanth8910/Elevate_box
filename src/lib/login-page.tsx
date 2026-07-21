import { useState } from 'react';
import { Shield, Mail, Lock, ArrowRight, User } from 'lucide-react';
import { useAuth } from './auth';
import { Button, Input } from './ui';

export function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) setError(error);
    } else {
      const { error } = await signUp(email, password, fullName);
      if (error) setError(error);
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-slate-900 p-12 lg:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950" />
        <div className="absolute -right-24 top-1/4 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -left-24 bottom-1/4 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">Sentinel EHS</p>
            <p className="text-xs text-slate-400">Safety Intelligence Platform</p>
          </div>
        </div>

        <div className="relative z-10">
          <h2 className="text-3xl font-bold leading-tight text-white">
            Real-time safety<br />intelligence for<br />industrial operations
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
            Monitor your entire fleet of IoT safety devices, respond to SOS alerts instantly,
            and gain actionable insights across all your organizations.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { value: '2,400+', label: 'Devices Monitored' },
              { value: '180+', label: 'Organizations' },
              { value: '< 3s', label: 'Alert Response' },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-[11px] text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-500">
          © 2026 Sentinel EHS. All rights reserved.
        </div>
      </div>

      {/* Right panel */}
      <div className="flex w-full flex-col items-center justify-center bg-slate-50 p-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-900">Sentinel EHS</p>
              <p className="text-xs text-slate-400">Super Admin Console</p>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            {mode === 'login' ? 'Sign in to access the admin console' : 'Set up your super admin account'}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {mode === 'signup' && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  label="Full name"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="[&_input]:pl-10"
                />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
              <Input
                label="Email address"
                type="email"
                placeholder="admin@sentinel.ehs"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="[&_input]:pl-10"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="[&_input]:pl-10"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); }}
              className="font-semibold text-slate-900 hover:underline"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
