import { useEffect, useState } from 'react';
import { ShieldCheck, AlertTriangle, Award } from 'lucide-react';
import api from '../services/api';

export default function ReliabilityCard() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data } = await api.get('/bookings/reliability');
        setProfile(data.reliability);
      } catch (err) {
        console.error('Failed to load reliability score:', err);
      }
    };
    loadProfile();
  }, []);

  if (!profile) return null;

  const badgeStyles = {
    emerald: 'bg-[#111827] border-teal-500/30 text-slate-100',
    indigo: 'bg-[#111827] border-cyan-500/30 text-slate-100',
    amber: 'bg-[#111827] border-amber-500/35 text-slate-100',
    rose: 'bg-[#111827] border-rose-500/35 text-slate-100',
  };

  const pillStyles = {
    emerald: 'bg-teal-500/20 border border-teal-400/40 text-teal-300',
    indigo: 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-300',
    amber: 'bg-amber-500/20 border border-amber-400/40 text-amber-300',
    rose: 'bg-rose-500/20 border border-rose-400/40 text-rose-300',
  };

  return (
    <div
      className={`p-4 sm:px-5 rounded-2xl border shadow-card ${
        badgeStyles[profile.badgeColor] || badgeStyles.emerald
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center shrink-0">
            {profile.score >= 50 ? (
              <ShieldCheck className="w-5 h-5 text-teal-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-extrabold text-slate-100 tabular-nums">
                Fairness Reliability Score: {profile.score}/100
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  pillStyles[profile.badgeColor] || pillStyles.emerald
                }`}
              >
                {profile.tier}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{profile.summary}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold text-slate-300 tabular-nums">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#161F33] border border-slate-800">
            <Award className="w-3.5 h-3.5 text-teal-400" />
            Check-Ins: {profile.stats?.verifiedCheckins ?? 0}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-[#161F33] border border-slate-800">
            No-Shows: {profile.stats?.noShows ?? 0}
          </span>
        </div>
      </div>
    </div>
  );
}