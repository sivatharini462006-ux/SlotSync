import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode,
  XCircle,
  CalendarPlus,
  Sparkles,
  Calendar,
  MapPin,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';

const SMOOTH_EASE = [0.22, 1, 0.36, 1];

const TABS = [
  { value: 'ALL', label: 'All Upcoming' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'CHECKED_IN', label: 'Checked In' },
  { value: 'PENDING', label: 'Pending' },
];

const MyReservationsPage = () => {
  const { user } = useAuth();
  const basePath = user?.role === 'FACULTY' ? '/faculty' : '/student';

  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bookings/my-bookings?timeframe=upcoming');
      setBookings(res.data.bookings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const filteredBookings = useMemo(() => {
    if (activeTab === 'ALL') return bookings;
    return bookings.filter((b) => b.status === activeTab);
  }, [bookings, activeTab]);

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await api.put(`/bookings/${cancelTarget.id}/cancel`);
      setActionMsg(
        `Reservation ${cancelTarget.booking_code} cancelled and slot released to waitlist.`
      );
      setCancelTarget(null);
      loadBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to cancel reservation.');
    } finally {
      setCancelling(false);
    }
  };

  const handleDownloadIcs = async (booking) => {
    setDownloadingId(booking.id);
    try {
      const res = await api.get(`/bookings/${booking.id}/ics`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `SlotSync-${booking.booking_code}.ics`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to export calendar invite.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: SMOOTH_EASE }}
      className="space-y-6"
    >
      {/* Ash & Sea Glass Header */}
      <div className="bg-white p-6 rounded-2xl border border-navy-100 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-royal-600">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Active Schedule</span>
          </div>
          <h1 className="text-2xl font-extrabold text-navy-900 mt-0.5">
            My Active & Upcoming Reservations
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            View QR check-in passes, export calendar invites, or release slots you no longer need.
          </p>
        </div>

        <Link to={`${basePath}/book`} className="btn-sea-glass shrink-0">
          <CalendarPlus className="w-4 h-4" />
          <span>New Booking</span>
        </Link>
      </div>

      {/* Sliding Filter Tabs */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1">
        <div className="inline-flex p-1 bg-navy-100/80 rounded-xl border border-navy-100">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                className={`relative px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  isActive ? 'text-white' : 'text-navy-700 hover:text-navy-900'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="reservationTabPill"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    className="absolute inset-0 bg-royal-600 rounded-lg shadow-sm"
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200/70 text-royal-700 tabular-nums shrink-0">
          {filteredBookings.length} Reservation(s)
        </span>
      </div>

      {/* Action Success Toast Banner */}
      <AnimatePresence>
        {actionMsg && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-royal-900 text-sm font-semibold flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-royal-600 shrink-0" />
              <span>{actionMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionMsg('')}
              className="text-xs font-bold text-royal-700 hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reservations Table Card */}
      <div className="bg-white rounded-2xl border border-navy-100 shadow-card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-14 rounded-xl bg-navy-100/70 animate-pulse" />
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-slate-500 text-sm">
              No upcoming reservations found in this view.
            </p>
            <Link to={`${basePath}/book`} className="btn-sea-glass">
              <CalendarPlus className="w-4 h-4" />
              <span>Reserve a Slot Now</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-navy-50 text-navy-700 font-semibold border-b border-navy-100">
                <tr>
                  <th className="px-6 py-3.5">Pass Code</th>
                  <th className="px-6 py-3.5">Resource</th>
                  <th className="px-6 py-3.5">Date & Time</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-navy-50/60 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-royal-600">
                      {b.booking_code}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-navy-900">{b.resource_name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-royal-600" />
                        <span>
                          {b.resource_code} • {b.building}, Fl {b.floor_number}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 tabular-nums">
                      <div className="font-semibold text-navy-900">
                        {String(b.booking_date).slice(0, 10)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {b.start_time.slice(0, 5)} – {b.end_time.slice(0, 5)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        <button
                          type="button"
                          disabled={downloadingId === b.id}
                          onClick={() => handleDownloadIcs(b)}
                          title="Export .ics Calendar Invite"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-navy-50 hover:bg-navy-100 border border-navy-100 text-navy-800 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <Calendar className="w-3.5 h-3.5 text-royal-600" />
                          <span>{downloadingId === b.id ? '...' : '.ics'}</span>
                        </button>

                        <Link
                          to={`${basePath}/qr/${b.booking_code}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-navy-900 hover:bg-royal-600 text-white text-xs font-semibold transition-colors"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>QR Pass</span>
                        </Link>

                        {['PENDING', 'CONFIRMED'].includes(b.status) && (
                          <button
                            type="button"
                            onClick={() => setCancelTarget(b)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Cancel</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Custom Glassmorphic Cancel Confirmation Modal */}
      <AnimatePresence>
        {cancelTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !cancelling && setCancelTarget(null)}
              className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: SMOOTH_EASE }}
              className="relative z-10 w-full max-w-md bg-white rounded-3xl border border-navy-100 p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-navy-900">Cancel Reservation?</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    You are about to release{' '}
                    <strong className="text-navy-900">{cancelTarget.resource_name}</strong> (
                    <span className="font-mono font-bold text-royal-600">
                      {cancelTarget.booking_code}
                    </span>
                    ) on <strong className="tabular-nums">{String(cancelTarget.booking_date).slice(0, 10)}</strong>.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-navy-50 border border-navy-100 text-xs text-slate-600">
                Releasing unused slots early protects your reliability score and automatically
                promotes the next student on the Smart Waitlist.
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={() => setCancelTarget(null)}
                  className="btn-ash-secondary py-2 px-4 text-xs cursor-pointer"
                >
                  Keep Slot
                </button>
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={confirmCancel}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  {cancelling ? 'Releasing...' : 'Yes, Cancel & Release'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MyReservationsPage;