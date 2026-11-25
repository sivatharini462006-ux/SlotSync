import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';

const ResourceManagementPage = () => {
  const [resources, setResources] = useState([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadResources = async () => {
    setLoading(true);
    try {
      const params = {};
      if (typeFilter) params.type = typeFilter;
      if (search.trim()) params.search = search.trim();
      const res = await api.get('/resources', { params });
      setResources(res.data.resources || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, [typeFilter]);

  const handleDelete = async (resource) => {
    const ok = window.confirm(
      `Delete or deactivate ${resource.resource_code} (${resource.resource_name})?`
    );
    if (!ok) return;

    try {
      const res = await api.delete(`/resources/${resource.id}`);
      setMessage(res.data.message);
      loadResources();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-900">Resource Management</h1>
          <p className="text-sm text-slate-600 mt-1">
            Add, edit, deactivate, or put library seats, lab PCs, rooms, and projectors under maintenance.
          </p>
        </div>
        <Link
          to="/admin/resources/add"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-royal-600 hover:bg-royal-500 text-white text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Resource</span>
        </Link>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm font-medium">
          {message}
        </div>
      )}

      {/* Filter Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          loadResources();
        }}
        className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code, name, or room..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 text-sm"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3.5 py-2 rounded-lg border border-slate-300 text-sm bg-white"
        >
          <option value="">All Resource Types</option>
          <option value="LIBRARY_SEAT">Library Seat</option>
          <option value="LAB_COMPUTER">Lab Computer</option>
          <option value="STUDY_ROOM">Study Room</option>
          <option value="PROJECTOR">Projector</option>
          <option value="OTHER_EQUIPMENT">Other Equipment</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-navy-900 text-white text-sm font-semibold"
        >
          Filter
        </button>
      </form>

      {/* Resources Table */}
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
                  <th className="px-6 py-3.5">Name & Type</th>
                  <th className="px-6 py-3.5">Location</th>
                  <th className="px-6 py-3.5">Cap</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {resources.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70">
                    <td className="px-6 py-3.5 font-mono font-bold text-royal-600">
                      {r.resource_code}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="font-bold text-navy-900">{r.resource_name}</div>
                      <div className="text-xs text-slate-500">{r.resource_type}</div>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-600">
                      {r.building}, Fl {r.floor_number} ({r.room_number})
                    </td>
                    <td className="px-6 py-3.5">{r.capacity}</td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-6 py-3.5 text-right space-x-2">
                      <Link
                        to={`/admin/resources/edit/${r.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-navy-900 text-xs font-semibold hover:bg-slate-50"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(r)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 text-xs font-semibold hover:bg-red-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
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

export default ResourceManagementPage;