import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, CalendarDays, Clock } from 'lucide-react';
import api from '../services/api';

export default function SmartSlotHeatmap({
  resourceId,
  bookingDate,
  onSelectSlot,
  showHeatmap = true,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInsights = async () => {
      setLoading(true);
      try {
        const res = await api.get('/recommendations', {
          params: {
            ...(resourceId ? { resourceId } : {}),
            ...(bookingDate ? { date: bookingDate } : {}),
          },
        });
        setData(res.data);
      } catch (err) {
        console.error('Failed to load smart slot recommendations:', err);
      } finally {
        setLoading(false);
      }
    };
    loadInsights();
  }, [resourceId, bookingDate]);

  if (loading || !data) return null;

  const getHeatColor = (intensity) => {
    if (intensity === 0) return 'bg-slate-800/85 text-slate-400 border border-slate-700/70';
    if (intensity <= 30) return 'bg-teal-500/20 text-teal-300 border border-teal-500/35';
    if (intensity <= 65) return 'bg-amber-500/25 text-amber-300 border border-amber-500/40';
    return 'bg-rose-500/85 text-white border border-rose-400/50';
  };

  const hoursHeader = data.heatmap?.[0]?.hours || [];

  return (
    <div className="space-y-4">
      {/* Top 3 AI-Recommended Low-Traffic Slots */}
      {data.recommendations?.length > 0 && (
        <div className="p-5 rounded-2xl bg-[#111827] border border-teal-500/25 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>Smart Slot Recommender ({data.day_name})</span>
            </h4>
            <span className="text-[11px] font-semibold text-slate-400">
              Lowest-congestion open windows
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {data.recommendations.map((slot) => (
              <motion.button
                key={slot.start_time}
                type="button"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelectSlot && onSelectSlot(slot.start_time, slot.end_time)}
                className="text-left p-3.5 rounded-xl bg-[#161F33] hover:bg-teal-500 group border border-slate-700/80 hover:border-teal-400 transition-all shadow-sm cursor-pointer"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-sm font-extrabold text-slate-100 group-hover:text-slate-950 flex items-center gap-1.5 tabular-nums">
                    <Clock className="w-3.5 h-3.5 text-teal-400 group-hover:text-slate-950" />
                    {slot.start_time}–{slot.end_time}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30 group-hover:bg-slate-950/15 group-hover:text-slate-950 group-hover:border-transparent">
                    {slot.crowd_level}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 group-hover:text-slate-900 mt-1.5 line-clamp-1 font-medium">
                  {slot.reason}
                </p>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Compact Weekly Calendar Matrix (Days x Operating Hours) */}
      {showHeatmap && data.heatmap?.length > 0 && (
        <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-teal-400" />
              <span>Weekly Campus Demand Calendar</span>
            </h4>
            <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-slate-800 border border-slate-600 inline-block" />{' '}
                Empty
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-teal-500/30 border border-teal-500/60 inline-block" />{' '}
                Quiet
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-amber-500/40 border border-amber-500/60 inline-block" />{' '}
                Moderate
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block" /> Peak
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[600px] space-y-2">
              {/* Calendar Top Hour Header */}
              <div
                className="grid items-center gap-1.5 pb-1 border-b border-slate-800"
                style={{ gridTemplateColumns: '52px repeat(12, minmax(0, 1fr))' }}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Day
                </span>
                {hoursHeader.map((cell) => (
                  <div
                    key={cell.hour}
                    className="text-center text-[10px] font-bold text-slate-400 tabular-nums"
                  >
                    {cell.hour.slice(0, 2)}:00
                  </div>
                ))}
              </div>

              {/* Calendar Day Rows */}
              {data.heatmap.map((row) => (
                <div
                  key={row.dow}
                  className="grid items-center gap-1.5"
                  style={{ gridTemplateColumns: '52px repeat(12, minmax(0, 1fr))' }}
                >
                  <span className="text-xs font-extrabold text-slate-200">{row.day}</span>
                  {row.hours.map((cell) => (
                    <div
                      key={cell.hour}
                      title={`${row.day} ${cell.hour} — ${cell.count} booking(s)`}
                      className={`h-8 rounded-lg flex items-center justify-center text-[11px] font-bold tabular-nums transition-transform hover:scale-105 cursor-default ${getHeatColor(
                        cell.intensity
                      )}`}
                    >
                      {cell.count > 0 ? cell.count : '—'}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}