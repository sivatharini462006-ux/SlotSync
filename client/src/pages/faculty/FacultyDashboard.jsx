import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Projector,
  Monitor,
  Users,
  CalendarCheck,
  QrCode,
  MapPin,
  Sparkles,
  CalendarPlus,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import { CheckInCountdown } from '../../components/SmartWidgets';

const SMOOTH_EASE = [0.22, 1, 0.36, 1];

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariant = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: SMOOTH_EASE },
  },
};

const FacultyDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFacultyData = async () => {
      try {
        const res = await api.get('/bookings/my-bookings');
        setBookings(res.data.bookings || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadFacultyData();
  }, []);

  const activeBookings = useMemo(
    () => bookings.filter((b) => ['PENDING', 'CONFIRMED', 'CHECKED_IN'].includes(b.status)),
    [bookings]
  );

  const nextCheckInBooking = useMemo(
    () => activeBookings.find((b) => ['PENDING', 'CONFIRMED'].includes(b.status)),
    [activeBookings]
  );

  const nextSlotTimestamp = useMemo(() => {
    if (!nextCheckInBooking?.booking_date || !nextCheckInBooking?.start_time) return null;
    const datePart = String(nextCheckInBooking.booking_date).slice(0, 10);
    const timePart = String(nextCheckInBooking.start_time).slice(0, 8);
    const parsed = new Date(`${datePart}T${timePart}`);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }, [nextCheckInBooking]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-40 rounded-2xl bg-navy-100/80 animate-pulse border border-navy-100" />
        <div className="grid sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-24 rounded-2xl bg-navy-100/70 animate-pulse border border-navy-100"
            />
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-navy-100/70 animate-pulse border border-navy-100" />
      </div>
    );
  }

  const quickCategories = [
    {
      to: '/faculty/resources?type=PROJECTOR',
      title: 'Reserve Projectors',
      subtitle: '4K & HD Seminar Units',
      icon: Projector,
      iconBg: 'bg-teal-50 text-royal-600 border-teal-200/70',
    },
    {
      to: '/faculty/resources?type=LAB_COMPUTER',
      title: 'Lab Systems',
      subtitle: 'Workstations & GPU Nodes',
      icon: Monitor,
      iconBg: 'bg-sky-50 text-sky-600 border-sky-200/70',
    },
    {
      to: '/faculty/resources?type=STUDY_ROOM',
      title: 'Study & Seminar Rooms',
      subtitle: 'Group Discussion Spaces',
      icon: Users,
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200/70',
    },
  ];

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Ash & Sea Glass Faculty Hero Banner */}
      <motion.div
        variants={itemVariant}
        className="relative overflow-hidden bg-navy-900 text-white rounded-2xl p-6 sm:p-8 border border-navy-800 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-6"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 w-60 h-60 rounded-full bg-royal-500/15 blur-3xl" />

        <div className="relative z-10 space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy-800 border border-navy-700 text-royal-500 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Faculty Portal</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-950/80 border border-royal-500/30 text-teal-200 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-royal-500" />
              <span>Priority Academic Access</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {user?.name}
          </h1>
          <p className="text-slate-300 text-sm max-w-xl leading-relaxed">
            Schedule projectors, reserve laboratory workstations for sessions, and book
            collaborative seminar rooms across campus with instant QR passes.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap gap-3 shrink-0">
          <Link to="/faculty/book" className="btn-sea-glass">
            <CalendarPlus className="w-4 h-4" />
            <span>Reserve Equipment</span>
          </Link>
          <Link
            to="/faculty/floor-map"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-800 border border-navy-700 hover:bg-navy-700 text-white text-sm font-semibold transition-colors"
          >
            <MapPin className="w-4 h-4 text-royal-500" />
            <span>Floor Map</span>
          </Link>
          <Link
            to="/faculty/checkin"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-800 border border-navy-700 hover:bg-navy-700 text-white text-sm font-semibold transition-colors"
          >
            <QrCode className="w-4 h-4 text-royal-500" />
            <span>Check In</span>
          </Link>
        </div>
      </motion.div>

      {/* Live 15-Minute Check-In Countdown Ring */}
      {nextCheckInBooking && nextSlotTimestamp && (
        <motion.div variants={itemVariant}>
          <CheckInCountdown
            slotStartTime={nextSlotTimestamp}
            bookingCode={nextCheckInBooking.booking_code}
            rolePrefix="faculty"
          />
        </motion.div>
      )}

      {/* Quick Category Booking Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {quickCategories.map((cat) => {
          const Icon = cat.icon;
          return (
            <motion.div key={cat.to} variants={itemVariant} whileHover={{ y: -2 }}>
              <Link
                to={cat.to}
                className="bg-white p-5 rounded-2xl border border-navy-100 hover:border-royal-500/50 shadow-card hover:shadow-soft flex items-center justify-between gap-4 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${cat.iconBg}`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-navy-900 group-hover:text-royal-700 transition-colors">
                      {cat.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{cat.subtitle}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-royal-600 group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Active Reservations Table */}
      <motion.div
        variants={itemVariant}
        className="bg-white rounded-2xl border border-navy-100 shadow-card overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-navy-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-50 text-royal-600">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <span>Your Scheduled Reservations ({activeBookings.length})</span>
          </h2>
          <Link
            to="/faculty/reservations"
            className="inline-flex items-center gap-1 text-sm font-bold text-royal-600 hover:text-royal-500 transition-colors"
          >
            <span>Manage All</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {activeBookings.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-slate-500 text-sm">
              No active reservations scheduled. Click &ldquo;Reserve Equipment&rdquo; to book a
              resource.
            </p>
            <Link to="/faculty/book" className="btn-sea-glass">
              <CalendarPlus className="w-4 h-4" />
              <span>Reserve Equipment / Lab</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-navy-50 text-navy-700 font-semibold border-b border-navy-100">
                <tr>
                  <th className="px-6 py-3.5">Booking Code</th>
                  <th className="px-6 py-3.5">Resource</th>
                  <th className="px-6 py-3.5">Date & Slot</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">QR Pass</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {activeBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-navy-50/60 transition-colors">
                    <td className="px-6 py-3.5 font-mono font-bold text-royal-600">
                      {b.booking_code}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-navy-900">{b.resource_name}</div>
                      {b.building && (
                        <div className="text-xs text-slate-500">
                          {b.building}, Floor {b.floor_number}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3.5 tabular-nums text-navy-900">
                      {String(b.booking_date).slice(0, 10)} ({b.start_time.slice(0, 5)} –{' '}
                      {b.end_time.slice(0, 5)})
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Link
                        to={`/faculty/qr/${b.booking_code}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-navy-900 hover:bg-royal-600 text-white text-xs font-semibold transition-colors"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>View QR</span>
                      </Link>
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

export default FacultyDashboard;