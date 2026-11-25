import { useEffect, useState } from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';

const NoShowManagementPage = () => {
  const [noShows, setNoShows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNoShows = async () => {
      try {
        const res = await api.get('/admin/no-shows');
        setNoShows(res.data.noShows || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadNoShows();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 flex items-start gap-3">
        <Clock className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
        <div className="text-sm text-orange-900">
          <strong>Automated 15-Minute No-Show Rule Active:</strong> Reservations not checked in
          within 15 minutes of their scheduled start time are automatically marked{' '}
          <code>NO_SHOW</code> by <code>node-cron</code> and released for other students and faculty.
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          <h1 className="text-lg font-extrabold text-navy-900">
            No-Show Reservations ({noShows.length})
          </h1>
        </div>

        {loading ? (
          <div className="py-16 flex justify-center">
            <div className="animate-spin rounded-full h-9 w-9 border-4 border-royal-600 border-t-transparent" />
          </div>
        ) : noShows.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            Zero no-show violations recorded so far.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Booking Code</th>
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-6 py-3.5">Resource</th>
                  <th className="px-6 py-3.5">Scheduled Slot</th>
                  <th className="px-6 py-3.5">Released At</th>
                  <th className="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {noShows.map((b) => (
                  <tr key={b.id}>
                    <td className="px-6 py-3.5 font-mono font-bold text-orange-700">{b.booking_code}</td>
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-navy-900">{b.user_name}</div>
                      <div className="text-xs text-slate-500">{b.user_email}</div>
                    </td>
                    <td className="px-6 py-3.5">{b.resource_name} ({b.resource_code})</td>
                    <td className="px-6 py-3.5">
                      {b.booking_date} • {b.start_time.slice(0, 5)} – {b.end_time.slice(0, 5)}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-500">{b.released_at || 'Auto'}</td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={b.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoShowManagementPage;