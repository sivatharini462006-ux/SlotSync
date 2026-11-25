import { useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert, Clock, QrCode } from 'lucide-react';
import { Link } from 'react-router-dom';

// 1. Gamified Reliability Tier Badge (Dark Ash & Sea Glass)
export const ReliabilityBadge = ({ score = 100 }) => {
  const isPriority = score >= 95;
  const isStandard = score >= 80 && score < 95;

  const tier = isPriority
    ? {
        label: 'Priority Pass',
        perk: 'Book up to 7 days ahead + Instant Waitlist Boost',
        badgeClass: 'bg-[#111827] text-teal-300 border-teal-500/30',
        pillClass: 'bg-teal-500/20 text-teal-200 border border-teal-400/40',
        Icon: ShieldCheck,
      }
    : isStandard
    ? {
        label: 'Standard Tier',
        perk: 'Book up to 3 days ahead • Keep checking in on time for Priority',
        badgeClass: 'bg-[#111827] text-cyan-300 border-cyan-500/30',
        pillClass: 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40',
        Icon: ShieldCheck,
      }
    : {
        label: 'Restricted Tier',
        perk: 'Same-day bookings only • Complete 3 on-time check-ins to restore',
        badgeClass: 'bg-[#111827] text-amber-300 border-amber-500/35',
        pillClass: 'bg-amber-500/20 text-amber-200 border border-amber-400/40',
        Icon: ShieldAlert,
      };

  const { Icon } = tier;

  return (
    <div className={`inline-flex flex-col gap-1.5 px-4 py-2.5 rounded-2xl border shadow-card ${tier.badgeClass}`}>
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 shrink-0" />
        <span className="text-xs font-bold uppercase tracking-wider">{tier.label}</span>
        <span className={`text-xs font-extrabold tabular-nums px-2 py-0.5 rounded-full ${tier.pillClass}`}>
          {score}/100
        </span>
      </div>
      <p className="text-[11px] text-slate-400">{tier.perk}</p>
    </div>
  );
};

// 2. Live Smart Check-In Countdown Ring (Dark Ash & Sea Glass)
export const CheckInCountdown = ({ slotStartTime, bookingCode, rolePrefix = 'student' }) => {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    const updateTimer = () => {
      const deadline = new Date(slotStartTime).getTime() + 15 * 60 * 1000;
      const diff = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
      setSecondsLeft(diff);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [slotStartTime]);

  const graceWindowSeconds = 15 * 60;
  const isUpcoming = secondsLeft > graceWindowSeconds;
  const isUrgent = secondsLeft > 0 && secondsLeft <= 180;

  // Format timer cleanly whether upcoming (hours/days) or active 15-min grace countdown
  const formatDisplay = () => {
    if (secondsLeft <= 0) return '00:00 expired';
    if (isUpcoming) {
      const secsUntilOpen = secondsLeft - graceWindowSeconds;
      const days = Math.floor(secsUntilOpen / 86400);
      const hrs = Math.floor((secsUntilOpen % 86400) / 3600);
      const mins = Math.floor((secsUntilOpen % 3600) / 60);
      if (days > 0) return `Opens in ${days}d ${hrs}h`;
      if (hrs > 0) return `Opens in ${hrs}h ${mins}m`;
      return `Opens in ${mins}m`;
    }
    const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
    const secs = String(secondsLeft % 60).padStart(2, '0');
    return `${mins}:${secs} remaining`;
  };

  const progress = isUpcoming
    ? 100
    : Math.min(100, Math.max(0, (secondsLeft / graceWindowSeconds) * 100));

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-4 p-4 sm:px-5 rounded-2xl border shadow-card transition-colors ${
        isUrgent
          ? 'bg-[#111827] border-amber-500/50 animate-pulse'
          : 'bg-[#111827] border-teal-500/30'
      }`}
    >
      <div className="flex items-center gap-3.5">
        <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
          <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-slate-800"
              strokeWidth="3.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className={isUrgent ? 'text-amber-400' : 'text-teal-400'}
              strokeDasharray={`${progress}, 100`}
              strokeWidth="3.5"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <Clock className={`w-4 h-4 absolute ${isUrgent ? 'text-amber-400' : 'text-teal-400'}`} />
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {secondsLeft <= 0
              ? 'Check-In Window Expired'
              : isUpcoming
              ? 'Upcoming Check-In Window'
              : 'Auto-Release Check-In Window'}
          </p>
          <p
            className={`text-lg font-extrabold tabular-nums mt-0.5 ${
              isUrgent ? 'text-amber-400' : 'text-teal-300'
            }`}
          >
            {formatDisplay()}
          </p>
        </div>
      </div>

      <Link
        to={bookingCode ? `/${rolePrefix}/qr/${bookingCode}` : `/${rolePrefix}/checkin`}
        className="btn-sea-glass shrink-0"
      >
        <QrCode className="w-4 h-4" />
        <span>Check In Now</span>
      </Link>
    </div>
  );
};