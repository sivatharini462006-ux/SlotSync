import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import api from '../../services/api';

const AddResourcePage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    resource_code: '',
    resource_name: '',
    resource_type: 'LIBRARY_SEAT',
    description: '',
    building: 'Central Library',
    floor_number: 1,
    room_number: 'HALL-101',
    capacity: 1,
    status: 'ACTIVE',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/resources', {
        ...form,
        floor_number: Number(form.floor_number),
        capacity: Number(form.capacity),
      });
      navigate('/admin/resources');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create resource.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        to="/admin/resources"
        className="inline-flex items-center gap-2 text-sm font-semibold text-royal-600 hover:underline"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Resource Management
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <h1 className="text-2xl font-extrabold text-navy-900">Add New Campus Resource</h1>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-navy-900">Resource Code *</label>
              <input
                type="text"
                required
                placeholder="e.g., LIB005"
                value={form.resource_code}
                onChange={(e) => setForm({ ...form, resource_code: e.target.value.toUpperCase() })}
                className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-navy-900">Resource Type *</label>
              <select
                value={form.resource_type}
                onChange={(e) => setForm({ ...form, resource_type: e.target.value })}
                className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
              >
                <option value="LIBRARY_SEAT">LIBRARY_SEAT</option>
                <option value="LAB_COMPUTER">LAB_COMPUTER</option>
                <option value="STUDY_ROOM">STUDY_ROOM</option>
                <option value="PROJECTOR">PROJECTOR</option>
                <option value="OTHER_EQUIPMENT">OTHER_EQUIPMENT</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy-900">Resource Name *</label>
            <input
              type="text"
              required
              placeholder="e.g., Library Seat 05"
              value={form.resource_name}
              onChange={(e) => setForm({ ...form, resource_name: e.target.value })}
              className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy-900">Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Hardware specs, power outlets, seating details..."
              className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-navy-900">Building *</label>
              <input
                type="text"
                required
                value={form.building}
                onChange={(e) => setForm({ ...form, building: e.target.value })}
                className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-navy-900">Floor Number *</label>
              <input
                type="number"
                required
                value={form.floor_number}
                onChange={(e) => setForm({ ...form, floor_number: e.target.value })}
                className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-navy-900">Room Number *</label>
              <input
                type="text"
                required
                value={form.room_number}
                onChange={(e) => setForm({ ...form, room_number: e.target.value })}
                className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-navy-900">Capacity</label>
              <input
                type="number"
                min={1}
                required
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-navy-900">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 px-4 rounded-xl bg-royal-600 hover:bg-royal-500 text-white font-semibold text-sm flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Resource...' : 'Save Resource'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddResourcePage;