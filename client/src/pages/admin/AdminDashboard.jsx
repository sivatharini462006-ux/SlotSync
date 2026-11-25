import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Boxes,
  CheckCircle2,
  CalendarCheck,
  AlertTriangle,
  XCircle,
  Clock,
  BarChart3,
  Plus,
  Sparkles,
  FileText,
  ArrowRight,
} from 'lucide-react';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';

const SMOOTH_EASE = [0.22, 1, 0.36, 1];

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.045 },
  },
};

const itemVariant = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: SMOOTH_EASE },
  },
};

const STATUS_FILTERS = ['ALL', 'CONFIRMED', 'CHECKED_IN', 'PENDING', 'NO_SHOW', 'CANCELLED'];

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminOverview = async () => {
      try {
        const res = await api.get('/admin/dashboard');
        setStats(res.data.stats);
        setRecentBookings(res.data.recentBookings || []);
      } catch (err) {
        console.error('Admin dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminOverview();
  }, []);

  const filteredBookings = useMemo(() => {
    if (statusFilter === 'ALL') return recentBookings;
    return recentBookings.filter((b) => b.status === statusFilter);
  }, [recentBookings, statusFilter]);

  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <div className="h-36 rounded-2xl bg-navy-100/80 animate-pulse border border-navy-100" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div
              key={n}
              className="h-28 rounded-2xl bg-navy-100/70 animate-pulse border border-navy-100"
            />
          ))}
        </div>
        <div className="h-72 rounded-2xl bg-navy-100/70 animate-pulse border border-navy-100" />
      </div>
    );
  }

  const cards = [
    {
      label: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      iconBg: 'bg-teal-50 text-royal-600',
    },
    {
      label: 'Total Resources',
      value: stats.totalResources,
      icon: Boxes,
      iconBg: 'bg-sky-50 text-sky-600',
    },
    {
      label: 'Active Resources',
      value: stats.availableResources,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Bookings Today',
      value: stats.bookingsToday,
      icon: Clock,
      iconBg: 'bg-teal-50 text-royal-700',
    },
    {
      label: 'Active Reservations',
      value: stats.activeReservations,
      icon: CalendarCheck,
      iconBg: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Completed',
      value: stats.completedReservations,
      icon: CheckCircle2,
      iconBg: 'bg-navy-100 text-navy-700',
    },
    {
      label: 'Cancelled',
      value: stats.cancelledReservations,
      icon: XCircle,
      iconBg: 'bg-rose-50 text-rose-600',
    },
    {
      label: 'No-Shows Released',
      value: stats.noShowReservations,
      icon: AlertTriangle,
      iconBg: 'bg-amber-50 text-amber-600',
    },
  ];

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Ash & Sea Glass Control Center Header */}
      <motion.div
        variants={itemVariant}
        className="relative overflow-hidden bg-navy-900 text-white rounded-2xl p-6 sm:p-8 border border-navy-800 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-6"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 w-60 h-60 rounded-full bg-royal-500/15 blur-3xl" />

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-800 border border-navy-700 text-royal-500 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>System Administration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            SlotSync Control Center
          </h1>
          <p className="text-slate-300 text-sm max-w-xl leading-relaxed">
            Monitor live campus occupancy, manage resources, track 15-minute no-show releases, and
            inspect real-time utilization analytics.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap gap-3 shrink-0">
          <Link to="/admin/resources/add" className="btn-sea-glass">
            <Plus className="w-4 h-4" />
            <span>Add Resource</span>
          </Link>
          <Link
            to="/admin/no-shows"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-800 border border-navy-700 hover:bg-navy-700 text-white text-sm font-semibold transition-colors"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>No-Shows</span>
          </Link>
          <Link
            to="/admin/analytics"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-800 border border-navy-700 hover:bg-navy-700 text-white text-sm font-semibold transition-colors"
          >
            <BarChart3 className="w-4 h-4 text-royal-500" />
            <span>Analytics</span>
          </Link>
        </div>
      </motion.div>

      {/* 8 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <motion.div
              key={c.label}
              variants={itemVariant}
              whileHover={{ y: -2 }}
              className="bg-white p-5 rounded-2xl border border-navy-100 shadow-card hover:shadow-soft transition-all"
            >
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-navy-700">
                <span>{c.label}</span>
                <div className={`p-2 rounded-lg ${c.iconBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-navy-900 mt-3 tabular-nums">{c.value}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Recent System Reservations with Status Filter */}
      <motion.div
        variants={itemVariant}
        className="bg-white rounded-2xl border border-navy-100 shadow-card overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-navy-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-navy-900">Recent System Reservations</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live feed across Student and Faculty bookings
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/admin/audit-logs"
              className="inline-flex items-center gap-1 text-xs font-bold text-navy-700 hover:text-royal-600 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-royal-600" />
              <span>Audit Logs</span>
            </Link>
            <Link
              to="/admin/bookings"
              className="inline-flex items-center gap-1 text-sm font-bold text-royal-600 hover:text-royal-500 transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="px-6 py-3 bg-navy-50/70 border-b border-navy-100 flex items-center gap-1.5 overflow-x-auto">
          {STATUS_FILTERS.map((st) => {
            const active = statusFilter === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-navy-900 text-white shadow-sm'
                    : 'bg-white border border-navy-100 text-navy-700 hover:border-royal-500/40'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            );
          })}
        </div>

        {filteredBookings.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            No recent reservations match the <strong>{statusFilter}</strong> filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-navy-50 text-navy-700 font-semibold border-b border-navy-100">
                <tr>
                  <th className="px-6 py-3">Code</th>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Resource</th>
                  <th className="px-6 py-3">Date & Time</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-navy-50/60 transition-colors">
                    <td className="px-6 py-3.5 font-mono font-bold text-royal-600">
                      {b.booking_code}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-navy-900">{b.user_name}</div>
                      <div className="text-xs text-slate-500">{b.user_role}</div>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-navy-900">{b.resource_name}</div>
                      <div className="text-xs text-slate-500 font-mono">{b.resource_code}</div>
                    </td>
                    <td className="px-6 py-3.5 tabular-nums text-navy-900">
                      {String(b.booking_date).slice(0, 10)} • {b.start_time.slice(0, 5)} –{' '}
                      {b.end_time.slice(0, 5)}
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={b.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default AdminDashboard;