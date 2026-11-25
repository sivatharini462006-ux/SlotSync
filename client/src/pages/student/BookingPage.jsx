import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarPlus,
  AlertCircle,
  Zap,
  CheckCircle2,
  Users,
  Sparkles,
  Clock,
  Calendar,
  Building2,
  X,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import SmartSlotHeatmap from '../../components/SmartSlotHeatmap';
import ReliabilityCard from '../../components/ReliabilityCard';

const SMOOTH_EASE = [0.22, 1, 0.36, 1];

const DURATION_PRESETS = [
  { label: '1 Hr', hours: 1 },
  { label: '2 Hrs', hours: 2 },
  { label: '3 Hrs', hours: 3 },
];

const addHoursToTime = (timeStr, hoursToAdd) => {
  if (!timeStr) return '11:00';
  const [h, m] = timeStr.split(':').map(Number);
  const nextH = Math.min(23, h + hoursToAdd);
  return `${String(nextH).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`;
};

const BookingPage = () => {
  const { user } = useAuth();
  const basePath = user?.role === 'FACULTY' ? '/faculty' : '/student';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialResourceId = searchParams.get('resourceId') || '';
  const initialDate =
    searchParams.get('date') || new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [resources, setResources] = useState([]);
  const [resourceId, setResourceId] = useState(initialResourceId);
  const [bookingDate, setBookingDate] = useState(initialDate);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [inviteeInput, setInviteeInput] = useState('');
  const [inviteeList, setInviteeList] = useState([]);
  const [bookedIntervals, setBookedIntervals] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Smart Waitlist states
  const [canWaitlist, setCanWaitlist] = useState(false);
  const [joiningWaitlist, setJoiningWaitlist] = useState(false);
  const [waitlistMsg, setWaitlistMsg] = useState('');

  const selectedResource = resources.find((r) => String(r.id) === String(resourceId));
  const maxGuests = selectedResource ? Math.max(0, Number(selectedResource.capacity) - 1) : 0;

  useEffect(() => {
    const loadResources = async () => {
      try {
        const res = await api.get('/resources?status=ACTIVE');
        const list = res.data.resources || [];
        setResources(list);
        if (!initialResourceId && list.length > 0) {
          setResourceId(String(list[0].id));
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadResources();
  }, [initialResourceId]);

  useEffect(() => {
    if (!resourceId || !bookingDate) return;
    const loadOccupied = async () => {
      try {
        const res = await api.get(`/resources/${resourceId}/availability`, {
          params: { date: bookingDate },
        });
        setBookedIntervals(res.data.bookedIntervals || []);
      } catch (err) {
        console.error(err);
      }
    };
    loadOccupied();
  }, [resourceId, bookingDate]);

  const addInviteeTag = (raw) => {
    const parts = raw
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);
    if (!parts.length) return;
    setInviteeList((prev) => {
      const merged = [...prev];
      for (const email of parts) {
        if (!merged.includes(email) && merged.length < maxGuests) {
          merged.push(email);
        }
      }
      return merged;
    });
    setInviteeInput('');
  };

  const handleInviteeKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addInviteeTag(inviteeInput);
    }
  };

  const removeInviteeTag = (emailToRemove) => {
    setInviteeList((prev) => prev.filter((e) => e !== emailToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCanWaitlist(false);
    setWaitlistMsg('');
    setSubmitting(true);

    try {
      const pendingTyped = inviteeInput
        .split(',')
        .map((email) => email.trim())
        .filter(Boolean);
      const invitees = Array.from(new Set([...inviteeList, ...pendingTyped]));

      const res = await api.post('/bookings', {
        resource_id: Number(resourceId),
        booking_date: bookingDate,
        start_time: startTime,
        end_time: endTime,
        invitees,
      });

      navigate(`${basePath}/booking-confirmation`, {
        state: { booking: res.data.booking },
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed due to a conflict or invalid time.');
      if (err.response?.status === 409) {
        setCanWaitlist(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinWaitlist = async () => {
    setJoiningWaitlist(true);
    try {
      const res = await api.post('/waitlist', {
        resource_id: Number(resourceId),
        booking_date: bookingDate,
        start_time: startTime,
        end_time: endTime,
      });

      setCanWaitlist(false);
      setError('');
      setWaitlistMsg(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to join the waitlist.');
    } finally {
      setJoiningWaitlist(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: SMOOTH_EASE }}
      className="max-w-2xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-navy-100 shadow-card">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-royal-600">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Conflict-Free Booking Engine</span>
        </div>
        <h1 className="text-2xl font-extrabold text-navy-900 mt-1">
          Create a Resource Reservation
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Protected by MySQL InnoDB row-level locking to guarantee zero double-bookings.
        </p>
      </div>

      {/* Fairness Reliability Score & Booking Tier Badge */}
      <ReliabilityCard />

      {/* AI Smart Slot Recommender (auto-fills Start & End time on click) */}
      <SmartSlotHeatmap
        resourceId={resourceId}
        bookingDate={bookingDate}
        showHeatmap={false}
        onSelectSlot={(start, end) => {
          setStartTime(start);
          setEndTime(end);
          setCanWaitlist(false);
          setError('');
        }}
      />

      {/* Main Reservation Form Card */}
      <div className="bg-white rounded-3xl border border-navy-100 p-6 sm:p-8 shadow-card">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2.5"
            >
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {canWaitlist && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="mb-5 p-4 rounded-2xl bg-amber-50/90 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <p className="text-sm font-bold text-amber-900">Slot Already Reserved</p>
                <p className="text-xs text-amber-800 mt-0.5">
                  Join the Smart Waitlist to get auto-booked the instant this slot opens up!
                </p>
              </div>
              <button
                type="button"
                disabled={joiningWaitlist}
                onClick={handleJoinWaitlist}
                className="px-4 py-2.5 rounded-xl bg-navy-900 hover:bg-royal-600 disabled:opacity-60 text-white text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer"
              >
                <Zap className="w-4 h-4 text-royal-500" />
                <span>{joiningWaitlist ? 'Joining...' : 'Join Smart Waitlist'}</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {waitlistMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-4 rounded-2xl bg-teal-50 border border-teal-200 text-royal-900 text-sm flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-royal-600" />
                <span className="font-semibold">{waitlistMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => navigate(`${basePath}/history`)}
                className="text-xs font-bold underline text-royal-700 hover:text-royal-600 whitespace-nowrap cursor-pointer"
              >
                View Queue →
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-navy-700 flex items-center gap-1.5 mb-1.5">
              <Building2 className="w-3.5 h-3.5 text-royal-600" /> Select Resource
            </label>
            <select
              required
              value={resourceId}
              onChange={(e) => {
                setResourceId(e.target.value);
                setInviteeList([]);
                setCanWaitlist(false);
                setWaitlistMsg('');
              }}
              className="w-full px-3.5 py-3 rounded-xl border border-navy-100 text-sm bg-white text-navy-900 hover:border-royal-500 focus:border-royal-600 focus:ring-2 focus:ring-royal-500/20 outline-none transition-all"
            >
              <option value="">-- Choose an Active Resource --</option>
              {resources.map((r) => (
                <option key={r.id} value={r.id}>
                  [{r.resource_code}] {r.resource_name} — {r.building} (Fl {r.floor_number}, Cap:{' '}
                  {r.capacity})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-navy-700 flex items-center gap-1.5 mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-royal-600" /> Reservation Date
            </label>
            <input
              type="date"
              required
              min={new Date().toISOString().split('T')[0]}
              value={bookingDate}
              onChange={(e) => {
                setBookingDate(e.target.value);
                setCanWaitlist(false);
                setWaitlistMsg('');
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-navy-100 text-sm text-navy-900 tabular-nums hover:border-royal-500 focus:border-royal-600 focus:ring-2 focus:ring-royal-500/20 outline-none transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-navy-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-royal-600" /> Time Window
              </label>
              <div className="flex items-center gap-1.5">
                {DURATION_PRESETS.map((preset) => (
                  <button
                    key={preset.hours}
                    type="button"
                    onClick={() => {
                      setEndTime(addHoursToTime(startTime, preset.hours));
                      setCanWaitlist(false);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-royal-600 text-royal-700 hover:text-white border border-teal-200/70 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    +{preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[11px] font-semibold text-slate-500">Start Time</span>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    setCanWaitlist(false);
                  }}
                  className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-navy-100 text-sm text-navy-900 tabular-nums hover:border-royal-500 focus:border-royal-600 focus:ring-2 focus:ring-royal-500/20 outline-none transition-all"
                />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-500">End Time</span>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => {
                    setEndTime(e.target.value);
                    setCanWaitlist(false);
                  }}
                  className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-navy-100 text-sm text-navy-900 tabular-nums hover:border-royal-500 focus:border-royal-600 focus:ring-2 focus:ring-royal-500/20 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Group Study Invites (shown when resource capacity > 1) */}
          {selectedResource && maxGuests > 0 && (
            <div className="p-4 rounded-2xl bg-navy-50/70 border border-navy-100 space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-navy-700 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-royal-600" />
                <span>
                  Invite Group Study Teammates (Optional • Max {maxGuests} guest
                  {maxGuests > 1 ? 's' : ''})
                </span>
              </label>

              {inviteeList.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {inviteeList.map((email) => (
                    <span
                      key={email}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-royal-800 text-xs font-semibold"
                    >
                      <span>{email}</span>
                      <button
                        type="button"
                        onClick={() => removeInviteeTag(email)}
                        className="hover:text-rose-600 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <input
                type="text"
                placeholder="Type teammate email & press Enter (e.g. arjun@slotsync.edu)"
                value={inviteeInput}
                onChange={(e) => setInviteeInput(e.target.value)}
                onKeyDown={handleInviteeKeyDown}
                onBlur={() => addInviteeTag(inviteeInput)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-navy-100 text-sm text-navy-900 placeholder:text-slate-400 focus:border-royal-600 outline-none"
              />
              <p className="text-[11px] text-slate-500">
                Press Enter or comma to add teammates. Invited teammates automatically receive the
                shared QR pass.
              </p>
            </div>
          )}

          {/* Existing Reserved Windows Notice */}
          <div className="p-4 rounded-2xl bg-surface border border-navy-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy-700 tabular-nums">
              Already Reserved Windows on {bookingDate}
            </h4>
            {bookedIntervals.length === 0 ? (
              <p className="text-xs text-royal-700 font-semibold mt-1.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-royal-500" />
                All time slots are currently open for this resource on {bookingDate}.
              </p>
            ) : (
              <div className="mt-2.5 flex flex-wrap gap-2">
                {bookedIntervals.map((b) => (
                  <span
                    key={b.id}
                    className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold tabular-nums"
                  >
                    {b.start_time.slice(0, 5)} – {b.end_time.slice(0, 5)} ({b.status})
                  </span>
                ))}
              </div>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={submitting}
            className="w-full btn-sea-glass py-3.5 disabled:opacity-60 cursor-pointer"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>{submitting ? 'Confirming Reservation...' : 'Confirm Reservation'}</span>
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
};

export default BookingPage;