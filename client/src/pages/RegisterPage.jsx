import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getDashboardPathByRole } from '../routes/ProtectedRoute';
import Logo from '../components/Logo';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await register(form);
      navigate(getDashboardPathByRole(user.role), { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center">
          <Logo />
        </div>
        <h2 className="mt-6 text-2xl font-extrabold text-navy-900">Create your SlotSync account</h2>
        <p className="mt-1 text-sm text-slate-600">Reserve library seats, lab PCs & study rooms</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-navy-900">Full Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Aarav Patel"
                className="mt-1.5 w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-royal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-navy-900">College Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@slotsync.edu"
                className="mt-1.5 w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-royal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-navy-900">Account Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="mt-1.5 w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-royal-500"
              >
                <option value="STUDENT">Student</option>
                <option value="FACULTY">Faculty Member</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-navy-900">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Minimum 6 characters"
                className="mt-1.5 w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-royal-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-royal-600 hover:bg-royal-500 disabled:opacity-60 text-white font-semibold text-sm transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>{submitting ? 'Creating Account...' : 'Register'}</span>
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-royal-600 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;