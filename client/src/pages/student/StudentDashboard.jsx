import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CalendarCheck,
  MapPin,
  QrCode,
  Clock,
  ArrowRight,
  BookOpen,
  Monitor,
  Zap,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import { ReliabilityBadge, CheckInCountdown } from '../../components/SmartWidgets';

const SMOOTH_EASE = [0.22, 1, 0.36, 1];

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const cardVariant = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: SMOOTH_EASE },
  },
};

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [bookingsRes, resourcesRes] = await Promise.all([
          api.get('/bookings/my-bookings'),
          api.get('/resources?status=ACTIVE'),
        ]);
        setBookings(bookingsRes.data.bookings || []);
        setResources(resourcesRes.data.resources || []);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const upcoming = useMemo(
    () => bookings.filter((b) => ['PENDING', 'CONFIRMED', 'CHECKED_IN'].includes(b.status)),
    [bookings]
  );

  const completed = useMemo(
    () => bookings.filter((b) => b.status === 'COMPLETED'),
    [bookings]
  );

  // Find next booking needing check-in (PENDING or CONFIRMED)
  const nextCheckInBooking = useMemo(() => {
    return upcoming.find((b) => ['PENDING', 'CONFIRMED'].includes(b.status));
  }, [upcoming]);

  // Build ISO start timestamp safely from booking_date + start_time
  const nextSlotTimestamp = useMemo(() => {
    if (!nextCheckInBooking?.booking_date || !nextCheckInBooking?.start_time) return null;
    const datePart = String(nextCheckInBooking.booking_date).slice(0, 10);
    const timePart = String(nextCheckInBooking.start_time).slice(0, 8);
    const parsed = new Date(`${datePart}T${timePart}`);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }, [nextCheckInBooking]);

  const lastCompleted = completed[0];
  const quickPickResource = resources[0];

  const handleQuickBook = (resourceId) => {
    if (resourceId) {
      navigate(`/student/book?resourceId=${resourceId}`);
    } else {
      navigate('/student/book');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-44 rounded-2xl bg-navy-100/80 animate-pulse border border-navy-100" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-28 rounded-2xl bg-navy-100/70 animate-pulse border border-navy-100"
            />
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-navy-100/70 animate-pulse border border-navy-100" />
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Ash & Sea Glass Welcome Banner */}
      <motion.div
        variants={cardVariant}
        className="relative overflow-hidden bg-navy-900 text-white rounded-2xl p-6 sm:p-8 border border-navy-800 shadow-card"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-royal-500/15 blur-3xl" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-800 border border-navy-700 text-royal-500 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Student Workspace</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name}
            </h1>
            <p className="text-slate-300 text-sm max-w-xl leading-relaxed">
              Reserve quiet library seats, lab workstations, and study rooms with instant QR
              check-in and zero scheduling conflicts.
            </p>
            <div className="pt-1">
              <ReliabilityBadge score={user?.reliability_score ?? 100} />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => handleQuickBook(quickPickResource?.id)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-royal-600 hover:bg-royal-500 text-white text-sm font-semibold shadow-glow-teal transition-colors cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>Quick Book Now</span>
            </motion.button>
            <Link
              to="/student/floor-map"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-700 border border-navy-700 text-white text-sm font-semibold transition-colors"
            >
              <MapPin className="w-4 h-4 text-royal-500" />
              <span>Floor Map</span>
            </Link>
            <Link
              to="/student/checkin"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-700 border border-navy-700 text-white text-sm font-semibold transition-colors"
            >
              <QrCode className="w-4 h-4 text-royal-500" />
              <span>QR Pass</span>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Active 15-Minute Check-In Countdown Alert (if upcoming booking exists) */}
      {nextCheckInBooking && nextSlotTimestamp && (
        <motion.div variants={cardVariant}>
          <CheckInCountdown
            slotStartTime={nextSlotTimestamp}
            bookingCode={nextCheckInBooking.booking_code}
            rolePrefix="student"
          />
        </motion.div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          variants={cardVariant}
          whileHover={{ y: -2 }}
          className="bg-white p-5 rounded-2xl border border-navy-100 shadow-card transition-shadow hover:shadow-soft"
        >
          <div className="flex items-center justify-between text-navy-700 text-xs font-bold uppercase tracking-wider">
            <span>Active / Upcoming</span>
            <div className="p-2 rounded-lg bg-teal-50 text-royal-600">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-navy-900 mt-3 tabular-nums">
            {upcoming.length}
          </p>
        </motion.div>

        <motion.div
          variants={cardVariant}
          whileHover={{ y: -2 }}
          className="bg-white p-5 rounded-2xl border border-navy-100 shadow-card transition-shadow hover:shadow-soft"
        >
          <div className="flex items-center justify-between text-navy-700 text-xs font-bold uppercase tracking-wider">
            <span>Total Bookings</span>
            <div className="p-2 rounded-lg bg-sky-50 text-sky-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-navy-900 mt-3 tabular-nums">
            {bookings.length}
          </p>
        </motion.div>

        <motion.div
          variants={cardVariant}
          whileHover={{ y: -2 }}
          className="bg-white p-5 rounded-2xl border border-navy-100 shadow-card transition-shadow hover:shadow-soft"
        >
          <div className="flex items-center justify-between text-navy-700 text-xs font-bold uppercase tracking-wider">
            <span>Completed Sessions</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-navy-900 mt-3 tabular-nums">
            {completed.length}
          </p>
        </motion.div>

        <motion.div
          variants={cardVariant}
          whileHover={{ y: -2 }}
          className="bg-white p-5 rounded-2xl border border-navy-100 shadow-card transition-shadow hover:shadow-soft"
        >
          <div className="flex items-center justify-between text-navy-700 text-xs font-bold uppercase tracking-wider">
            <span>Active Campus Slots</span>
            <div className="p-2 rounded-lg bg-teal-50 text-royal-600">
              <Monitor className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-navy-900 mt-3 tabular-nums">
            {resources.length}
          </p>
        </motion.div>
      </div>

      {/* 1-Click Book Again Shortcut (if user has completed history) */}
      {lastCompleted && (
        <motion.div
          variants={cardVariant}
          className="bg-white rounded-2xl border border-navy-100 p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-card"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-teal-50 text-royal-600 shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-royal-700">
                Book Again • Frequent Spot
              </p>
              <p className="text-sm font-bold text-navy-900 mt-0.5">
                {lastCompleted.resource_name}{' '}
                <span className="font-normal text-slate-500">
                  ({lastCompleted.building}, Floor {lastCompleted.floor_number})
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleQuickBook(lastCompleted.resource_id)}
            className="btn-ash-secondary shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-royal-600" />
            <span>Rebook Spot</span>
          </button>
        </motion.div>
      )}

      {/* Upcoming Reservations Table */}
      <motion.div
        variants={cardVariant}
        className="bg-white rounded-2xl border border-navy-100 shadow-card overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-navy-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-navy-900">Upcoming Reservations</h2>
          <Link
            to="/student/reservations"
            className="inline-flex items-center gap-1 text-sm font-semibold text-royal-600 hover:text-royal-500 transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-slate-500 text-sm">You have no upcoming reservations yet.</p>
            <Link to="/student/book" className="mt-4 btn-sea-glass">
              Book a Resource Now
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-navy-50 text-navy-700 font-semibold border-b border-navy-100">
                <tr>
                  <th className="px-6 py-3">Booking Code</th>
                  <th className="px-6 py-3">Resource</th>
                  <th className="px-6 py-3">Date & Slot</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Pass</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {upcoming.slice(0, 5).map((b) => (
                  <tr key={b.id} className="hover:bg-navy-50/70 transition-colors">
                    <td className="px-6 py-3.5 font-mono font-bold text-royal-600">
                      {b.booking_code}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-navy-900">{b.resource_name}</div>
                      <div className="text-xs text-slate-500">
                        {b.resource_code} • {b.building}, Floor {b.floor_number}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 tabular-nums">
                      <div className="font-medium text-navy-900">
                        {String(b.booking_date).slice(0, 10)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {b.start_time.slice(0, 5)} – {b.end_time.slice(0, 5)}
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Link
                        to={`/student/qr/${b.booking_code}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-navy-900 text-white text-xs font-semibold hover:bg-royal-600 transition-colors"
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

export default StudentDashboard;