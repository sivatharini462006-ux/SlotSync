import { useEffect, useState } from 'react';
import api from '../../services/api';

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const res = await api.get('/admin/audit-logs');
        setLogs(res.data.logs || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-navy-900">System Audit Logs</h1>
        <p className="text-sm text-slate-600 mt-1">
          Chronological security trail of user logins, bookings, cancellations, QR check-ins, and cron releases.
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
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">Actor</th>
                  <th className="px-6 py-3.5">Action</th>
                  <th className="px-6 py-3.5">Entity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-6 py-3.5 text-xs font-mono text-slate-500">
                      {log.created_at}
                    </td>
                    <td className="px-6 py-3.5">
                      {log.user_name ? (
                        <div>
                          <span className="font-semibold text-navy-900">{log.user_name}</span>
                          <span className="text-xs text-slate-500 ml-1.5">({log.user_role})</span>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-royal-600">SYSTEM CRON</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs font-bold text-navy-900">
                      {log.action}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-slate-600">
                      {log.entity_type} #{log.entity_id || '—'}
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

export default AuditLogsPage;