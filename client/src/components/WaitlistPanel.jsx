import { useEffect, useState, useCallback } from 'react';
import { BellRing, Zap, XCircle } from 'lucide-react';
import api from '../services/api';
import { useLiveSync } from '../hooks/useLiveSync';

export default function WaitlistPanel() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWaitlist = useCallback(async () => {
    try {
      const { data } = await api.get('/waitlist/my');
      setEntries(data.waitlist || []);
    } catch (err) {
      console.error('Failed to load waitlist:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWaitlist();
  }, [fetchWaitlist]);

  useLiveSync((event) => {
    if (event?.eventType?.startsWith('WAITLIST') || event?.eventType === 'NO_SHOW_RELEASED') {
      fetchWaitlist();
    }
  });

  const handleLeave = async (id) => {
    try {
      await api.delete(`/waitlist/${id}`);
      fetchWaitlist();
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to leave waitlist');
    }
  };

  if (loading || entries.length === 0) return null;

  return (
    <div className="mt-6 bg-[#111827] rounded-2xl border border-amber-500/30 shadow-card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
          <span className="inline-flex p-1.5 rounded-lg bg-amber-500/15 text-amber-400">
            <BellRing className="w-4 h-4" />
          </span>
          <span>Smart Waitlist & Auto-Promotion Queue</span>
        </h3>
        <span className="text-xs font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-3 py-1 rounded-full">
          Auto-promotes on cancel / no-show
        </span>
      </div>

      <div className="divide-y divide-slate-800">
        {entries.map((item) => (
          <div key={item.id} className="py-3.5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-bold text-slate-100">{item.resource_name}</p>
              <p className="text-xs text-slate-400 tabular-nums mt-0.5">
                {new Date(item.start_time).toLocaleString()} –{' '}
                {new Date(item.end_time).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {item.status === 'WAITING' ? (
                <>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300 tabular-nums">
                    Queue Position #{item.queue_position}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleLeave(item.id)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Leave Queue</span>
                  </button>
                </>
              ) : item.status === 'PROMOTED' ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-teal-500/20 border border-teal-400/40 text-teal-300">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Auto-Promoted to Confirmed Booking!</span>
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
                  {item.status}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}