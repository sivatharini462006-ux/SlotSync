import { useEffect, useState } from 'react';
import { XCircle } from 'lucide-react';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';

const BookingManagementPage = () => {
  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const loadAllBookings = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/admin/bookings', { params });
      setBookings(res.data.bookings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllBookings();
  }, [statusFilter]);

  const handleAdminCancel = async (b) => {
    if (!window.confirm(`Admin override: Cancel reservation ${b.booking_code}?`)) return;
    try {
      await api.put(`/bookings/${b.id}/cancel`);
      loadAllBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to cancel reservation.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900">All Campus Reservations</h1>
          <p className="text-sm text-slate-600 mt-1">
            Monitor every booking across students and faculty and release slots when needed.
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white"
        >
          <option value="">All Statuses</option>
          <option value="CONFIRMED">CONFIRMED</option>
          <option value="CHECKED_IN">CHECKED_IN</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="CANCELLED">CANCELLED</option>
          <option value="NO_SHOW">NO_SHOW</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center">
            <div className="animate-spin rounded-full h-9 w-9 border-4 border-royal-600 border-t-transparent" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Code</th>
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-6 py-3.5">Resource</th>
                  <th className="px-6 py-3.5">Date & Slot</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Override</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td className="px-6 py-3.5 font-mono font-bold text-royal-600">{b.booking_code}</td>
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-navy-900">{b.user_name}</div>
                      <div className="text-xs text-slate-500">{b.user_email}</div>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-navy-900">{b.resource_name}</div>
                      <div className="text-xs text-slate-500">{b.resource_code}</div>
                    </td>
                    <td className="px-6 py-3.5">
                      {b.booking_date} • {b.start_time.slice(0, 5)} – {b.end_time.slice(0, 5)}
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {['PENDING', 'CONFIRMED'].includes(b.status) && (
                        <button
                          type="button"
                          onClick={() => handleAdminCancel(b)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs font-semibold hover:bg-red-100"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>
                      )}
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

export default BookingManagementPage;