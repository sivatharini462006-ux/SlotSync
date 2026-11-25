import { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarPlus,
  XCircle,
  Users,
  Sparkles,
  RotateCcw,
  Download,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import WaitlistPanel from '../../components/WaitlistPanel';
import { useLiveSync } from '../../hooks/useLiveSync';

const SMOOTH_EASE = [0.22, 1, 0.36, 1];

const HISTORY_TABS = [
  { value: 'ALL', label: 'All Records' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CHECKED_IN', label: 'Checked In' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'NO_SHOW', label: 'No-Show' },
];

const BookingHistoryPage = () => {
  const { user } = useAuth();
  const basePath = user?.role === 'FACULTY' ? '/faculty' : '/student';

  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState({ type: '', text: '' });
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      const res = await api.get('/bookings/my');
      setBookings(res.data.bookings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Auto-refresh when a waitlist auto-promotion or no-show release happens
  useLiveSync((event) => {
    if (
      event?.eventType?.startsWith('WAITLIST') ||
      event?.eventType === 'NO_SHOW_RELEASED' ||
      event?.eventType === 'CHECKED_IN'
    ) {
      loadHistory();
    }
  });

  const filteredBookings = useMemo(() => {
    if (statusFilter === 'ALL') return bookings;
    return bookings.filter((b) => b.status === statusFilter);
  }, [bookings, statusFilter]);

  const handleDownloadIcs = async (bookingId, bookingCode) => {
    try {
      const res = await api.get(`/bookings/${bookingId}/ics`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `SlotSync-${bookingCode}.ics`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setToastMsg({
        type: 'error',
        text: err.response?.data?.message || 'Unable to export calendar invite.',
      });
    }
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const res = await api.patch(`/bookings/${cancelTarget.id}/cancel`);
      setToastMsg({
        type: 'success',
        text:
          res.data?.message ||
          `Reservation ${cancelTarget.booking_code} cancelled and waitlisted student notified.`,
      });
      setCancelTarget(null);
      loadHistory();
    } catch (err) {
      setToastMsg({
        type: 'error',
        text: err.response?.data?.message || 'Unable to cancel booking.',
      });
      setCancelTarget(null);
    } finally {
      setCancelling(false);
    }
  };

  const handleExportCsv = () => {
    if (!filteredBookings.length) return;
    const headers = ['Booking Code', 'Resource Code', 'Resource Name', 'Date', 'Start', 'End', 'Status'];
    const rows = filteredBookings.map((b) => [
      b.booking_code,
      b.resource_code,
      `"${b.resource_name}"`,
      String(b.booking_date).slice(0, 10),
      String(b.start_time).slice(0, 5),
      String(b.end_time).slice(0, 5),
      b.status,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SlotSync-History-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
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
            <span>Reservation Ledger & Waitlist</span>
          </div>
          <h1 className="text-2xl font-extrabold text-navy-900 mt-0.5">
            Complete Booking History
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Full record of your owned and group-invited reservations, 1-click rebooking, and live
            waitlist queue.
          </p>
        </div>

        <button
          type="button"
          disabled={filteredBookings.length === 0}
          onClick={handleExportCsv}
          className="btn-ash-secondary disabled:opacity-50 shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4 text-royal-600" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Sliding Status Filter Tabs */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1">
        <div className="inline-flex p-1 bg-navy-100/80 rounded-xl border border-navy-100">
          {HISTORY_TABS.map((tab) => {
            const isActive = statusFilter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatusFilter(tab.value)}
                className={`relative px-3.5 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  isActive ? 'text-white' : 'text-navy-700 hover:text-navy-900'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="historyStatusPill"
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
          {filteredBookings.length} Record(s)
        </span>
      </div>

      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toastMsg.text && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={`p-4 rounded-2xl border text-sm font-semibold flex items-center justify-between gap-3 ${
              toastMsg.type === 'success'
                ? 'bg-teal-50 border-teal-200 text-royal-900'
                : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {toastMsg.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-royal-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span>{toastMsg.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMsg({ type: '', text: '' })}
              className="text-xs font-bold underline cursor-pointer"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Table Card */}
      <div className="bg-white rounded-2xl border border-navy-100 shadow-card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="h-14 rounded-xl bg-navy-100/70 animate-pulse" />
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No booking records match this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-navy-50 text-navy-700 font-semibold border-b border-navy-100">
                <tr>
                  <th className="px-6 py-3.5">Booking Code</th>
                  <th className="px-6 py-3.5">Resource</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Slot</th>
                  <th className="px-6 py-3.5">Check-In Time</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-navy-50/60 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="font-mono font-bold text-royal-600">{b.booking_code}</div>
                      {b.participation_role === 'INVITED_GUEST' && (
                        <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 border border-teal-200/70 text-royal-700">
                          <Users className="w-3 h-3" /> Group Invite
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-navy-900">{b.resource_name}</div>
                      <div className="text-xs text-slate-500 font-mono">{b.resource_code}</div>
                      {b.invited_emails && (
                        <div className="text-[11px] text-royal-700 mt-0.5">
                          Team: {b.invited_emails}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-3.5 tabular-nums text-navy-900">
                      {String(b.booking_date).slice(0, 10)}
                    </td>
                    <td className="px-6 py-3.5 tabular-nums text-navy-900">
                      {String(b.start_time).slice(0, 5)} – {String(b.end_time).slice(0, 5)}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-500 tabular-nums">
                      {b.check_in_time ? new Date(b.check_in_time).toLocaleString() : '—'}
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        {['CONFIRMED', 'CHECKED_IN'].includes(b.status) && (
                          <button
                            type="button"
                            onClick={() => handleDownloadIcs(b.id, b.booking_code)}
                            title="Export to Google / Apple / Outlook Calendar (.ics)"
                            className="px-2.5 py-1.5 rounded-xl bg-navy-50 hover:bg-navy-100 border border-navy-100 text-navy-800 text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <CalendarPlus className="w-3.5 h-3.5 text-royal-600" />
                            <span>.ics</span>
                          </button>
                        )}
                        {['PENDING', 'CONFIRMED'].includes(b.status) &&
                          b.participation_role !== 'INVITED_GUEST' && (
                            <button
                              type="button"
                              onClick={() => setCancelTarget(b)}
                              title="Cancel Reservation"
                              className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Cancel</span>
                            </button>
                          )}
                        {['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(b.status) &&
                          b.resource_id && (
                            <Link
                              to={`${basePath}/book?resourceId=${b.resource_id}`}
                              title="Book this resource again"
                              className="px-2.5 py-1.5 rounded-xl bg-teal-50 hover:bg-royal-600 border border-teal-200/70 text-royal-700 hover:text-white text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Book Again</span>
                            </Link>
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

      {/* Live Smart Waitlist Queue */}
      <WaitlistPanel />

      {/* Custom Cancel Confirmation Modal */}
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
                    Cancel <strong className="text-navy-900">{cancelTarget.resource_name}</strong> (
                    <span className="font-mono font-bold text-royal-600">
                      {cancelTarget.booking_code}
                    </span>
                    )? Any waitlisted student for this window will be auto-promoted immediately.
                  </p>
                </div>
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
                  {cancelling ? 'Cancelling...' : 'Yes, Cancel & Release'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default BookingHistoryPage;