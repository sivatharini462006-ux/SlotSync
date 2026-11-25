import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Sparkles,
  MapPin,
  Clock,
  ShieldCheck,
  Copy,
  Check,
  Download,
  Zap,
} from 'lucide-react';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';

const SMOOTH_EASE = [0.22, 1, 0.36, 1];

const QrCodePage = () => {
  const { bookingCode: paramCode } = useParams();
  const { state } = useLocation();

  const [bookingCodeInput, setBookingCodeInput] = useState(
    paramCode || state?.bookingCode || ''
  );
  const [tokenInput, setTokenInput] = useState(state?.token || '');
  const [bookingDetails, setBookingDetails] = useState(null);
  const [qrImage, setQrImage] = useState('');
  const [activePasses, setActivePasses] = useState([]);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load pass details if bookingCode is in URL
  useEffect(() => {
    if (!paramCode) return;
    const loadPass = async () => {
      try {
        const res = await api.get(`/checkin/${paramCode}`);
        setBookingDetails(res.data.booking);
        setQrImage(res.data.qr_code_url);
        if (res.data.booking?.checkin_token && !state?.token) {
          setTokenInput(res.data.booking.checkin_token);
        }
      } catch (err) {
        setStatusMsg({
          type: 'error',
          text: err.response?.data?.message || 'Unable to load booking QR pass.',
        });
      }
    };
    loadPass();
  }, [paramCode, state?.token]);

  // Fetch user's upcoming bookings for 1-tap pass selection
  useEffect(() => {
    const loadUpcomingPasses = async () => {
      try {
        const res = await api.get('/bookings/my-bookings');
        const list = (res.data.bookings || []).filter((b) =>
          ['PENDING', 'CONFIRMED', 'CHECKED_IN'].includes(b.status)
        );
        setActivePasses(list);
      } catch (err) {
        console.error('Could not fetch active passes:', err);
      }
    };
    loadUpcomingPasses();
  }, []);

  const handleSelectQuickPass = async (pass) => {
    setBookingCodeInput(pass.booking_code);
    setTokenInput(pass.checkin_token || '');
    setStatusMsg({ type: '', text: '' });
    setBookingDetails(pass);
    if (pass.qr_code_url) {
      setQrImage(pass.qr_code_url);
    } else {
      try {
        const res = await api.get(`/checkin/${pass.booking_code}`);
        setBookingDetails(res.data.booking);
        setQrImage(res.data.qr_code_url);
      } catch {
        // Keep basic pass details if QR endpoint isn't needed
      }
    }
  };

  const handleCopyCode = () => {
    if (!bookingDetails?.booking_code) return;
    navigator.clipboard?.writeText(bookingDetails.booking_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();
    setStatusMsg({ type: '', text: '' });
    setLoading(true);

    try {
      const method = tokenInput.trim() ? 'QR_SCAN' : 'MANUAL_CODE';
      const res = await api.post('/checkin', {
        bookingCode: bookingCodeInput.trim(),
        token: tokenInput.trim() || undefined,
        method,
      });

      setStatusMsg({
        type: 'success',
        text: res.data.message || 'Check-in verified! +2 Reliability pts awarded.',
      });
      setBookingDetails(res.data.booking);
    } catch (err) {
      setStatusMsg({
        type: 'error',
        text: err.response?.data?.message || 'Check-in verification failed.',
      });
    } finally {
      setLoading(false);
    }
  };

  const isCheckedIn = bookingDetails?.status === 'CHECKED_IN';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: SMOOTH_EASE }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Ash & Sea Glass Header */}
      <div className="bg-white p-6 rounded-2xl border border-navy-100 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-royal-600">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Cryptographic Arrival Verification</span>
          </div>
          <h1 className="text-2xl font-extrabold text-navy-900 mt-0.5">
            QR Pass & Reservation Check-In
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Verify arrival using your QR check-in token or manual booking code within 15 minutes of
            slot start.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-teal-50 border border-teal-200/70 text-royal-700 text-xs font-bold shrink-0">
          <ShieldCheck className="w-4 h-4 text-royal-600" />
          <span>SHA-256 Pass Guard</span>
        </div>
      </div>

      {/* 1-Tap Quick Pass Selector (if user has active bookings) */}
      {activePasses.length > 0 && (
        <div className="bg-white p-4 sm:px-6 rounded-2xl border border-navy-100 shadow-card">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-navy-700 mb-3">
            <Zap className="w-3.5 h-3.5 text-royal-600" />
            <span>Your Active Passes (Tap to Auto-Fill)</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {activePasses.map((pass) => {
              const selected = bookingCodeInput === pass.booking_code;
              return (
                <button
                  key={pass.id}
                  type="button"
                  onClick={() => handleSelectQuickPass(pass)}
                  className={`inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    selected
                      ? 'bg-navy-900 border-royal-500 text-white shadow-soft'
                      : 'bg-navy-50 hover:bg-teal-50 border-navy-100 text-navy-900'
                  }`}
                >
                  <span
                    className={`font-mono font-extrabold ${
                      selected ? 'text-royal-500' : 'text-royal-700'
                    }`}
                  >
                    {pass.booking_code}
                  </span>
                  <span className="opacity-80">• {pass.resource_name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Split Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Check-In Verification Form */}
        <div className="bg-white rounded-3xl border border-navy-100 p-6 sm:p-7 shadow-card flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-navy-900 flex items-center gap-2">
              <div className="p-2 rounded-xl bg-teal-50 text-royal-600">
                <KeyRound className="w-4 h-4" />
              </div>
              <span>Verify Arrival</span>
            </h2>

            <AnimatePresence>
              {statusMsg.text && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className={`mt-4 p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2.5 ${
                    statusMsg.type === 'success'
                      ? 'bg-teal-50 border-teal-200 text-royal-900'
                      : 'bg-rose-50 border-rose-200 text-rose-700'
                  }`}
                >
                  {statusMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-royal-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  )}
                  <span>{statusMsg.text}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleCheckIn} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy-700">
                  Booking Code *
                </label>
                <input
                  type="text"
                  required
                  value={bookingCodeInput}
                  onChange={(e) => setBookingCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g., SYNC-8F3A9C"
                  className="mt-1.5 w-full px-3.5 py-3 rounded-xl border border-navy-100 font-mono text-sm font-bold text-navy-900 placeholder:text-slate-400 hover:border-royal-500 focus:border-royal-600 focus:ring-2 focus:ring-royal-500/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-navy-700">
                  QR Security Token{' '}
                  <span className="font-normal text-slate-400 normal-case">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Auto-filled on QR scan or leave blank for manual code"
                  className="mt-1.5 w-full px-3.5 py-3 rounded-xl border border-navy-100 font-mono text-xs text-navy-900 placeholder:text-slate-400 hover:border-royal-500 focus:border-royal-600 focus:ring-2 focus:ring-royal-500/20 outline-none transition-all"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading || isCheckedIn}
                className="w-full btn-sea-glass py-3.5 disabled:opacity-60 cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>
                  {loading
                    ? 'Verifying Pass...'
                    : isCheckedIn
                    ? 'Already Checked In'
                    : 'Complete Check-In'}
                </span>
              </motion.button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-navy-100 flex items-center gap-2 text-[11px] text-slate-500">
            <Clock className="w-3.5 h-3.5 text-royal-600 shrink-0" />
            <span>
              On-time check-in locks your seat and adds <strong>+2 Reliability points</strong>.
            </span>
          </div>
        </div>

        {/* Digital Boarding Pass Preview */}
        <div className="bg-white rounded-3xl border border-navy-100 shadow-card overflow-hidden flex flex-col">
          <AnimatePresence mode="wait">
            {bookingDetails ? (
              <motion.div
                key={bookingDetails.booking_code}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.25, ease: SMOOTH_EASE }}
                className="flex-1 flex flex-col"
              >
                {/* Ash Header Strip */}
                <div className="bg-navy-900 text-white px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-royal-500">
                      SlotSync Digital Pass
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-base font-extrabold tracking-wider">
                        {bookingDetails.booking_code}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="p-1 rounded-md bg-navy-800 hover:bg-navy-700 text-slate-300 hover:text-white transition cursor-pointer"
                        title="Copy code"
                      >
                        {copied ? (
                          <Check className="w-3 h-3 text-royal-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                  <StatusBadge status={bookingDetails.status} />
                </div>

                {/* QR Body */}
                <div className="p-6 flex-1 flex flex-col items-center justify-center text-center space-y-4">
                  {qrImage ? (
                    <div className="relative p-3 bg-navy-50 rounded-2xl border border-navy-100 overflow-hidden">
                      <img
                        src={qrImage}
                        alt="Booking QR"
                        className="w-44 h-44 mx-auto rounded-xl bg-white p-1.5"
                      />
                      {!isCheckedIn && (
                        <motion.div
                          animate={{ y: [0, 168, 0] }}
                          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                          className="pointer-events-none absolute left-2 right-2 top-3 h-0.5 bg-gradient-to-r from-transparent via-royal-500 to-transparent opacity-80"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="w-36 h-36 rounded-2xl bg-teal-50 border border-teal-200/70 text-royal-600 flex items-center justify-center">
                      <QrCode className="w-16 h-16" />
                    </div>
                  )}

                  <div className="w-full bg-surface rounded-2xl p-4 border border-navy-100 text-left text-xs space-y-1.5">
                    <p className="text-sm font-extrabold text-navy-900">
                      {bookingDetails.resource_name}
                    </p>
                    <p className="text-slate-600 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-royal-600 shrink-0" />
                      <span>
                        {bookingDetails.building}, Floor {bookingDetails.floor_number}
                      </span>
                    </p>
                    <p className="text-slate-600 flex items-center gap-1.5 tabular-nums">
                      <Clock className="w-3.5 h-3.5 text-royal-600 shrink-0" />
                      <span>
                        {String(bookingDetails.booking_date).slice(0, 10)} •{' '}
                        {bookingDetails.start_time?.slice(0, 5)} –{' '}
                        {bookingDetails.end_time?.slice(0, 5)}
                      </span>
                    </p>
                  </div>

                  {qrImage && (
                    <a
                      href={qrImage}
                      download={`${bookingDetails.booking_code}-QR.png`}
                      className="btn-ash-secondary py-2 px-4 text-xs"
                    >
                      <Download className="w-3.5 h-3.5 text-royal-600" />
                      <span>Save QR Pass PNG</span>
                    </a>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty-pass"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-3"
              >
                <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200/70 text-royal-600 flex items-center justify-center">
                  <QrCode className="w-8 h-8" />
                </div>
                <p className="text-sm font-bold text-navy-900">Digital Reservation Pass</p>
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                  Tap one of your active passes above or enter a booking code to preview your QR
                  pass and verify check-in.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default QrCodePage;