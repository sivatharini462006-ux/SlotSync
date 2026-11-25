import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  QrCode,
  Map,
  Clock,
  BookOpen,
  Monitor,
  Users,
  Projector,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { getDashboardPathByRole } from '../routes/ProtectedRoute';

const SMOOTH_EASE = [0.22, 1, 0.36, 1];

const PREVIEW_TILES = [
  { code: 'LIB001', name: 'Library Seat 01', zone: 'Quiet Zone • Floor 1', status: 'AVAILABLE' },
  { code: 'LAB001', name: 'GPU Workstation 01', zone: 'AI Lab • Floor 2', status: 'BOOKED' },
  { code: 'ROOM001', name: 'Study Room 01', zone: 'Collab Wing • Floor 1', status: 'AVAILABLE' },
  { code: 'PROJ001', name: '4K Projector Kit', zone: 'AV Desk • Ground', status: 'AVAILABLE' },
];

const HomePage = () => {
  const { user } = useAuth();
  const [selectedPreview, setSelectedPreview] = useState('LIB001');

  return (
    <div className="min-h-screen flex flex-col bg-surface text-navy-900">
      {/* Glassmorphic Public Navbar */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-navy-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-navy-700">
            <a href="#about" className="hover:text-royal-600 transition-colors">
              About
            </a>
            <a href="#how-it-works" className="hover:text-royal-600 transition-colors">
              How It Works
            </a>
            <a href="#resources" className="hover:text-royal-600 transition-colors">
              Resources
            </a>
            <a href="#features" className="hover:text-royal-600 transition-colors">
              Features
            </a>
            <Link to="/about" className="hover:text-royal-600 transition-colors">
              Architecture
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <Link to={getDashboardPathByRole(user.role)} className="btn-sea-glass">
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-navy-900 hover:bg-navy-100/80 text-sm font-semibold transition-colors"
                >
                  Login
                </Link>
                <Link to="/register" className="btn-sea-glass">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Ash & Sea Glass Hero Section */}
      <section className="relative overflow-hidden bg-navy-900 text-white py-20 lg:py-28 border-b border-navy-800">
        <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-royal-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-10 w-96 h-96 rounded-full bg-accent-cyan/10 blur-3xl" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: SMOOTH_EASE }}
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-navy-800 border border-navy-700 text-royal-500 text-xs font-bold tracking-wide uppercase mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Zero Double-Bookings • Real-Time Floor Maps</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
              Book Smart. Avoid Conflicts.{' '}
              <span className="text-royal-500">Sync Your Slots.</span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
              SlotSync is a unified campus reservation platform for library seats, high-performance
              computer labs, collaborative study rooms, and seminar projectors—powered by ACID
              database row-level locking and instant QR check-in.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to={user ? getDashboardPathByRole(user.role) : '/register'}
                className="btn-sea-glass py-3.5 px-6 text-base"
              >
                <span>Reserve a Resource</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-navy-800 hover:bg-navy-700 border border-navy-700 text-white font-semibold transition-colors"
              >
                Sign In to Portal
              </Link>
            </div>
          </motion.div>

          {/* Interactive Live Status Preview Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: SMOOTH_EASE }}
            className="bg-navy-800/90 backdrop-blur-md border border-navy-700 rounded-3xl p-6 sm:p-7 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-4 border-b border-navy-700">
              <div>
                <span className="text-sm font-bold text-white">Live Campus Availability</span>
                <p className="text-xs text-slate-400 mt-0.5">Click a tile to preview selection</p>
              </div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-950/80 border border-royal-500/30 text-xs text-royal-500 font-semibold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-royal-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-royal-500" />
                </span>
                InnoDB Synced
              </span>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {PREVIEW_TILES.map((item) => {
                const isSelected = selectedPreview === item.code;
                const isBooked = item.status === 'BOOKED';

                let tileClass =
                  'border-royal-500/30 bg-royal-500/10 text-teal-200 hover:border-royal-500/60';
                let statusLabel = 'AVAILABLE';

                if (isSelected) {
                  tileClass =
                    'border-royal-500 bg-royal-600/25 text-white ring-2 ring-royal-500/40 shadow-glow-teal';
                  statusLabel = 'SELECTED';
                } else if (isBooked) {
                  tileClass = 'border-rose-500/35 bg-rose-500/10 text-rose-300';
                  statusLabel = 'BOOKED';
                }

                return (
                  <motion.button
                    key={item.code}
                    type="button"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedPreview(item.code)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${tileClass}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-extrabold opacity-90">
                        {item.code}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-navy-900/60">
                        {statusLabel}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white mt-2">{item.name}</div>
                    <div className="text-[11px] text-slate-300/80 mt-0.5">{item.zone}</div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 bg-navy-50 border-b border-navy-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-royal-600">
            Purpose-Built for Campuses
          </span>
          <h2 className="text-3xl font-extrabold text-navy-900 mt-2">About SlotSync</h2>
          <p className="mt-4 text-slate-600 leading-relaxed">
            Built for universities, central libraries, and engineering labs, SlotSync eliminates
            walk-in congestion, overlapping manual registers, and ghost bookings. Every reservation
            is verified with a unique QR pass and backed by automated 15-minute no-show slot release.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-18 py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-royal-600">
              Effortless Workflow
            </span>
            <h2 className="text-3xl font-extrabold text-navy-900 mt-2">How It Works</h2>
          </div>

          <div className="mt-12 grid md:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Explore Live Map',
                desc: 'Filter buildings, floors, and resource categories with real-time slot status.',
              },
              {
                step: '02',
                title: 'Lock Your Slot',
                desc: 'Pick your date and time window. Row-level SQL locking prevents any overlap.',
              },
              {
                step: '03',
                title: 'Scan QR Pass',
                desc: 'Receive an instant booking code and encrypted QR pass on your dashboard.',
              },
              {
                step: '04',
                title: 'Check In On Time',
                desc: 'Scan within 15 minutes of start time—unclaimed slots release automatically.',
              },
            ].map((item, idx) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: idx * 0.06, duration: 0.35, ease: SMOOTH_EASE }}
                whileHover={{ y: -3 }}
                className="p-6 rounded-2xl border border-navy-100 bg-surface shadow-card hover:shadow-soft transition-all"
              >
                <span className="text-xs font-extrabold text-royal-700 bg-teal-50 border border-teal-200/70 px-3 py-1 rounded-full">
                  STEP {item.step}
                </span>
                <h3 className="mt-4 text-lg font-bold text-navy-900">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Available Resources */}
      <section id="resources" className="py-16 bg-navy-50 border-y border-navy-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-royal-600">
              Unified Inventory
            </span>
            <h2 className="text-3xl font-extrabold text-navy-900 mt-2">
              Available Campus Resources
            </h2>
          </div>

          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: BookOpen,
                title: 'Library Seats',
                desc: 'Quiet reading carrels with power outlets and LAN connectivity.',
              },
              {
                icon: Monitor,
                title: 'Lab Workstations',
                desc: 'High-RAM GPU systems pre-configured for coding, AI, and database labs.',
              },
              {
                icon: Users,
                title: 'Study Rooms',
                desc: 'Acoustic group rooms with smart displays for project teams.',
              },
              {
                icon: Projector,
                title: 'Projectors & Gear',
                desc: 'Portable 4K projectors and interactive classroom kits for faculty & events.',
              },
            ].map((res, idx) => {
              const Icon = res.icon;
              return (
                <motion.div
                  key={res.title}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ delay: idx * 0.06, duration: 0.35, ease: SMOOTH_EASE }}
                  whileHover={{ y: -3 }}
                  className="bg-white p-6 rounded-2xl border border-navy-100 shadow-card hover:shadow-soft transition-all"
                >
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200/70 text-royal-600 flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-navy-900">{res.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{res.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Key Features & Benefits */}
      <section id="features" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-royal-600">
              Enterprise Reliability
            </span>
            <h2 className="text-3xl font-extrabold text-navy-900 mt-2">
              Built for Concurrency & Fairness
            </h2>
            <div className="mt-6 space-y-5">
              {[
                {
                  icon: ShieldCheck,
                  title: 'SQL Row-Level Locking',
                  desc: 'InnoDB SELECT ... FOR UPDATE serializes concurrent requests to guarantee zero double-bookings.',
                },
                {
                  icon: Map,
                  title: 'Interactive Floor Map',
                  desc: 'Visual floor-by-floor occupancy with Sea Glass color-coded live availability.',
                },
                {
                  icon: QrCode,
                  title: 'Cryptographic QR Check-In',
                  desc: 'Tamper-proof SHA-256 check-in tokens prevent unauthorized entry.',
                },
                {
                  icon: Clock,
                  title: '15-Minute Auto No-Show Release',
                  desc: 'Background cron jobs reclaim abandoned seats automatically.',
                },
              ].map((feat) => {
                const Icon = feat.icon;
                return (
                  <div key={feat.title} className="flex gap-4">
                    <div className="w-11 h-11 rounded-xl bg-navy-900 text-royal-500 flex items-center justify-center shrink-0 shadow-soft">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-navy-900">{feat.title}</h4>
                      <p className="text-sm text-slate-600 mt-0.5 leading-relaxed">{feat.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative overflow-hidden bg-navy-900 text-white rounded-3xl p-8 sm:p-10 border border-navy-800 shadow-card">
            <div className="pointer-events-none absolute -right-12 -bottom-12 w-56 h-56 rounded-full bg-royal-500/15 blur-3xl" />
            <h3 className="text-2xl font-extrabold">Campus-Wide Impact</h3>
            <ul className="mt-6 space-y-4 text-slate-200 text-sm">
              {[
                'Up to 40% higher seat and lab workstation utilization',
                'Zero scheduling conflicts during peak exam and project weeks',
                'Role-tailored portals for Students, Faculty, and Administrators',
                'Real-time Chart.js utilization reports and full audit trails',
              ].map((benefit) => (
                <li key={benefit} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-royal-500 shrink-0 mt-0.5" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy-900 text-slate-400 py-8 mt-auto border-t border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo light />
          <p className="text-xs">
            © {new Date().getFullYear()} SlotSync — Smart Library, Lab & Resource Booking System.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;