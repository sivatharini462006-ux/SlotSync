import { useState } from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  QrCode,
  CalendarCheck,
  CalendarPlus,
  Download,
  Users,
  MapPin,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const SMOOTH_EASE = [0.22, 1, 0.36, 1];

const BookingConfirmationPage = () => {
  const { state } = useLocation();
  const { user } = useAuth();
  const basePath = user?.role === 'FACULTY' ? '/faculty' : '/student';
  const [downloadingIcs, setDownloadingIcs] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const booking = state?.booking;
  if (!booking) {
    return <Navigate to={`${basePath}/reservations`} replace />;
  }

  const resourceName =
    booking.resource?.resource_name || booking.resource_name || 'Campus Resource';
  const resourceCode = booking.resource?.resource_code || booking.resource_code || '';
  const building = booking.resource?.building || booking.building || '';
  const floorNumber = booking.resource?.floor_number ?? booking.floor_number ?? '';
  const participants = booking.participants || [];

  const handleCopyCode = () => {
    if (!booking.booking_code) return;
    navigator.clipboard?.writeText(booking.booking_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadIcs = async () => {
    setDownloadingIcs(true);
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
      setDownloadingIcs(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: SMOOTH_EASE }}
      className="max-w-xl mx-auto"
    >
      <div className="bg-white rounded-3xl border border-navy-100 shadow-card overflow-hidden">
        {/* Deep Ash Top Header */}
        <div className="relative bg-navy-900 text-white px-6 py-8 text-center overflow-hidden">
          <div className="pointer-events-none absolute -top-12 -right-12 w-44 h-44 rounded-full bg-royal-500/20 blur-2xl" />
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 360, damping: 22, delay: 0.08 }}
            className="w-16 h-16 rounded-2xl bg-royal-600/20 border border-royal-500/40 text-royal-500 flex items-center justify-center mx-auto shadow-glow-teal"
          >
            <CheckCircle2 className="w-9 h-9" />
          </motion.div>

          <div className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-royal-500 bg-navy-800 border border-navy-700 px-3 py-1 rounded-full">
            <Sparkles className="w-3 h-3" />
            <span>Reservation Confirmed</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold mt-3 tracking-tight">
            Your Slot is Locked & Synced!
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-md mx-auto">
            Verify on-campus check-in within 15 minutes of start time to earn{' '}
            <strong className="text-royal-500">+2 Reliability pts</strong>.
          </p>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Digital Boarding Pass & QR Code Card */}
          <div className="relative bg-navy-50/90 p-6 rounded-2xl border border-navy-100 text-center">
            {booking.qr_code_url && (
              <div className="relative inline-block p-3 bg-white rounded-2xl border border-navy-100 shadow-soft mb-4 overflow-hidden">
                <img
                  src={booking.qr_code_url}
                  alt={`QR Code for ${booking.booking_code}`}
                  className="w-44 h-44 mx-auto rounded-lg"
                />
                {/* Subtle Sea Glass Scan Line */}
                <motion.div
                  animate={{ y: [0, 168, 0] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                  className="pointer-events-none absolute left-2 right-2 top-3 h-0.5 bg-gradient-to-r from-transparent via-royal-500 to-transparent opacity-75"
                />
              </div>
            )}

            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
              Reservation Pass Code
            </p>

            <div className="mt-1.5 inline-flex items-center gap-2">
              <span className="font-mono text-xl font-extrabold text-navy-900 tracking-wider">
                {booking.booking_code}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                title="Copy booking code"
                className="p-1.5 rounded-lg bg-white border border-navy-100 text-navy-700 hover:text-royal-600 hover:border-royal-500/40 transition-colors cursor-pointer"
              >
                {copiedCode ? (
                  <Check className="w-3.5 h-3.5 text-royal-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              {booking.qr_code_url && (
                <a
                  href={booking.qr_code_url}
                  download={`${booking.booking_code}-QR.png`}
                  className="btn-ash-secondary py-2 px-3.5 text-xs"
                >
                  <Download className="w-3.5 h-3.5 text-royal-600" />
                  <span>Download QR PNG</span>
                </a>
              )}
              <button
                type="button"
                disabled={downloadingIcs}
                onClick={handleDownloadIcs}
                className="btn-sea-glass py-2 px-3.5 text-xs disabled:opacity-60 cursor-pointer"
              >
                <CalendarPlus className="w-3.5 h-3.5" />
                <span>{downloadingIcs ? 'Exporting...' : 'Add to Calendar (.ics)'}</span>
              </button>
            </div>
          </div>

          {/* Perforated Divider */}
          <div className="relative flex items-center">
            <div className="w-full border-t border-dashed border-navy-200" />
          </div>

          {/* Reservation Summary */}
          <div className="bg-surface rounded-2xl p-4 border border-navy-100 text-sm space-y-2.5">
            <div className="flex justify-between gap-2">
              <span className="text-slate-500">Resource</span>
              <span className="font-bold text-navy-900 text-right">
                {resourceName} {resourceCode ? `(${resourceCode})` : ''}
              </span>
            </div>
            {building && (
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Location</span>
                <span className="font-semibold text-navy-900">
                  {building}
                  {floorNumber !== '' ? `, Floor ${floorNumber}` : ''}
                </span>
              </div>
            )}
            <div className="flex justify-between gap-2">
              <span className="text-slate-500">Date</span>
              <span className="font-semibold text-navy-900 tabular-nums">
                {String(booking.booking_date).slice(0, 10)}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-slate-500">Time Slot</span>
              <span className="font-semibold text-royal-700 tabular-nums">
                {String(booking.start_time).slice(0, 5)} – {String(booking.end_time).slice(0, 5)}
              </span>
            </div>

            {participants.length > 0 && (
              <div className="pt-2.5 border-t border-navy-100">
                <span className="text-xs font-bold text-navy-700 flex items-center gap-1.5 mb-2">
                  <Users className="w-3.5 h-3.5 text-royal-600" />
                  Invited Group Study Teammates ({participants.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {participants.map((p) => (
                    <span
                      key={p.email}
                      className="px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 border border-teal-200/70 text-royal-700"
                    >
                      {p.name || p.email}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Geo-Fence Reminder */}
          <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5">
            <MapPin className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              GPS Geo-Fence active: Check-in requires physical presence within the campus facility
              radius (or Admin/Demo override).
            </span>
          </div>

          {/* Primary Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to={`${basePath}/checkin`}
              state={{ bookingCode: booking.booking_code, token: booking.checkin_token }}
              className="flex-1 btn-sea-glass py-3"
            >
              <QrCode className="w-4 h-4" />
              <span>Go to Check-In</span>
            </Link>
            <Link
              to={`${basePath}/reservations`}
              className="flex-1 btn-ash-secondary py-3"
            >
              <CalendarCheck className="w-4 h-4 text-royal-600" />
              <span>My Reservations</span>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BookingConfirmationPage;