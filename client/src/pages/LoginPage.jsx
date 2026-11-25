import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  LogIn,
  Eye,
  EyeOff,
  QrCode,
  ShieldCheck,
  Sparkles,
  CalendarCheck,
  Mail,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getDashboardPathByRole } from '../routes/ProtectedRoute';
import Logo from '../components/Logo';

const DEMO_ACCOUNTS = [
  { role: 'STUDENT', label: 'Student', email: 'aarav.student@slotsync.edu' },
  { role: 'FACULTY', label: 'Faculty', email: 'ananya.sharma@slotsync.edu' },
  { role: 'ADMIN', label: 'Admin', email: 'admin@slotsync.edu' },
];

const SMOOTH_EASE = [0.22, 1, 0.36, 1];

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedDemoRole, setSelectedDemoRole] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(email, password);
      navigate(getDashboardPathByRole(user.role), { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (account) => {
    setSelectedDemoRole(account.role);
    setEmail(account.email);
    setPassword('Password@123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-surface text-navy-900 grid lg:grid-cols-12">
      {/* Left Ash & Sea Glass Brand Panel */}
      <div className="hidden lg:flex lg:col-span-5 bg-navy-900 text-white p-12 flex-col justify-between relative overflow-hidden border-r border-navy-800">
        {/* Ambient Sea Glass Glows */}
        <div className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 rounded-full bg-royal-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-accent-cyan/10 blur-3xl" />

        <div className="relative z-10">
          <Logo light to="/" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: SMOOTH_EASE }}
          className="relative z-10 space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-800 border border-navy-700 text-royal-500 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Campus Resource OS</span>
          </div>

          <h1 className="text-3xl xl:text-4xl font-extrabold leading-tight tracking-tight">
            Book Smart. Avoid Conflicts.{' '}
            <span className="text-royal-500">Sync Your Slots.</span>
          </h1>

          <p className="text-slate-300 text-sm leading-relaxed max-w-md">
            Real-time library seat maps, lab workstation reservations, automated 15-minute
            no-show release, and instant QR check-in passes across your campus.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-navy-800/70 border border-navy-700/80">
              <div className="p-2 rounded-xl bg-royal-600/20 text-royal-500">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Zero Double-Booking Engine</p>
                <p className="text-[11px] text-slate-400">
                  Instant conflict detection & live floor availability
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-navy-800/70 border border-navy-700/80">
              <div className="p-2 rounded-xl bg-royal-600/20 text-royal-500">
                <QrCode className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">15-Minute QR Check-In Passes</p>
                <p className="text-[11px] text-slate-400">
                  Earn +2 reliability points on every on-time arrival
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-navy-800/70 border border-navy-700/80">
              <div className="p-2 rounded-xl bg-royal-600/20 text-royal-500">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Role-Based Portals & Audit Trail</p>
                <p className="text-[11px] text-slate-400">
                  Dedicated workspaces for Students, Faculty & Admins
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 border-t border-navy-800 pt-5">
          <span>SlotSync Academic Cloud</span>
          <span className="inline-flex items-center gap-1.5 text-royal-500 font-semibold">
            <span className="w-2 h-2 rounded-full bg-royal-500 animate-pulse" />
            All Systems Operational
          </span>
        </div>
      </div>

      {/* Right Sign-In Form Panel */}
      <div className="lg:col-span-7 flex flex-col justify-center py-12 px-4 sm:px-8 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: SMOOTH_EASE }}
          className="mx-auto w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="flex justify-center lg:hidden mb-6">
            <Logo />
          </div>

          <div className="mb-7 text-center lg:text-left">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
              Sign in to SlotSync
            </h2>
            <p className="mt-1.5 text-sm text-slate-600">
              Enter your campus credentials or choose a quick demo role below.
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-navy-100 shadow-card">
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy-700 mb-1.5">
                  Campus Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@slotsync.edu"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-navy-100 text-sm text-navy-900 placeholder:text-slate-400 hover:border-royal-500 focus:border-royal-600 focus:ring-2 focus:ring-royal-500/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-3 rounded-xl bg-white border border-navy-100 text-sm text-navy-900 placeholder:text-slate-400 hover:border-royal-500 focus:border-royal-600 focus:ring-2 focus:ring-royal-500/20 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-navy-900 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={submitting}
                className="w-full btn-sea-glass py-3 disabled:opacity-60 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>{submitting ? 'Signing In...' : 'Sign In to Workspace'}</span>
              </motion.button>
            </form>

            {/* Sliding Quick Demo Role Selector */}
            <div className="mt-7 pt-6 border-t border-navy-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Quick Demo Role Fill
                </p>
                <span className="text-[11px] font-mono text-royal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/70">
                  Password@123
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 p-1 bg-navy-100/80 rounded-xl border border-navy-100">
                {DEMO_ACCOUNTS.map((acc) => {
                  const isActive = selectedDemoRole === acc.role;
                  return (
                    <button
                      key={acc.role}
                      type="button"
                      onClick={() => fillDemo(acc)}
                      className={`relative py-2 px-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                        isActive ? 'text-white' : 'text-navy-700 hover:text-navy-900'
                      }`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="demoRolePill"
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                          className="absolute inset-0 bg-navy-900 rounded-lg shadow-sm"
                        />
                      )}
                      <span className="relative z-10">{acc.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="mt-6 text-center text-sm text-slate-600">
              Don&apos;t have an account?{' '}
              <Link
                to="/register"
                className="font-bold text-royal-600 hover:text-royal-500 transition-colors"
              >
                Create an account
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;