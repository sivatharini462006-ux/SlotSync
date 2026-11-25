import { useEffect, useState } from 'react';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const toggleStatus = async (user) => {
    const nextStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await api.put(`/admin/users/${user.id}`, { status: nextStatus });
      loadUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to update user.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-navy-900">User Account Management</h1>
        <p className="text-sm text-slate-600 mt-1">
          View all registered students, faculty members, and administrators.
        </p>
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
                  <th className="px-6 py-3.5">Name</th>
                  <th className="px-6 py-3.5">Email</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Bookings</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-6 py-3.5 font-bold text-navy-900">{u.name}</td>
                    <td className="px-6 py-3.5 text-slate-600">{u.email}</td>
                    <td className="px-6 py-3.5">
                      <span className="px-2.5 py-0.5 rounded bg-navy-900 text-white text-xs font-semibold">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-semibold">{u.total_bookings}</td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {u.role !== 'ADMIN' && (
                        <button
                          type="button"
                          onClick={() => toggleStatus(u)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                            u.status === 'ACTIVE'
                              ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                              : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                          }`}
                        >
                          {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
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

export default UserManagementPage;