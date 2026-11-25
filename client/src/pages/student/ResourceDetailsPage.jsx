import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Users, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';

const ResourceDetailsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const basePath = user?.role === 'FACULTY' ? '/faculty' : '/student';

  const [date, setDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDetails = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/resources/${id}/availability`, { params: { date } });
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadDetails();
  }, [id, date]);

  if (loading || !data) {
    return (
      <div className="py-20 flex justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-royal-600 border-t-transparent" />
      </div>
    );
  }

  const { resource, slots } = data;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        to={`${basePath}/resources`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-royal-600 hover:underline"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Resource Explorer
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <span className="text-xs font-extrabold text-royal-600 bg-royal-600/10 px-2.5 py-1 rounded-md">
              {resource.resource_code} • {resource.resource_type.replace('_', ' ')}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 mt-2">
              {resource.resource_name}
            </h1>
            <p className="text-slate-600 text-sm mt-2">{resource.description}</p>
          </div>
          <StatusBadge status={resource.status} />
        </div>

        <div className="grid sm:grid-cols-3 gap-4 py-6 border-b border-slate-200 text-sm">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-royal-600" />
            <div>
              <p className="text-xs text-slate-500">Location</p>
              <p className="font-semibold text-navy-900">
                {resource.building}, Floor {resource.floor_number}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-royal-600" />
            <div>
              <p className="text-xs text-slate-500">Room / Zone</p>
              <p className="font-semibold text-navy-900">{resource.room_number}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-royal-600" />
            <div>
              <p className="text-xs text-slate-500">Capacity</p>
              <p className="font-semibold text-navy-900">{resource.capacity} Seat(s)</p>
            </div>
          </div>
        </div>

        {/* Date Selector & Live Time Slots */}
        <div className="pt-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-navy-900">Live Slot Schedule</h2>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <input
                type="date"
                value={date}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDate(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {slots.map((slot) => (
              <div
                key={slot.start}
                className={`p-3 rounded-xl border text-center text-xs font-semibold ${
                  slot.available
                    ? 'bg-green-50 border-green-300 text-green-800'
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}
              >
                <div>{slot.label}</div>
                <div className="mt-1 text-[10px] uppercase">{slot.reason}</div>
              </div>
            ))}
          </div>

          {resource.status === 'ACTIVE' && (
            <div className="pt-4">
              <Link
                to={`${basePath}/book?resourceId=${resource.id}&date=${date}`}
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-royal-600 hover:bg-royal-500 text-white font-semibold text-sm transition"
              >
                Proceed to Reservation Form
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResourceDetailsPage;