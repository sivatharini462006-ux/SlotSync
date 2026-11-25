import { UserCircle, Mail, Shield, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';

const ProfilePage = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-extrabold text-navy-900">Account Profile</h1>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-200">
          <div className="w-16 h-16 rounded-full bg-royal-600 text-white text-2xl font-extrabold flex items-center justify-center">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-navy-900">{user?.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-navy-900 text-white">
                {user?.role}
              </span>
              <StatusBadge status={user?.status} />
            </div>
          </div>
        </div>

        <div className="space-y-4 text-sm">
          <div className="flex items-center gap-3">
            <UserCircle className="w-5 h-5 text-royal-600" />
            <div>
              <p className="text-xs text-slate-500">Full Name</p>
              <p className="font-semibold text-navy-900">{user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-royal-600" />
            <div>
              <p className="text-xs text-slate-500">Registered Campus Email</p>
              <p className="font-semibold text-navy-900">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-royal-600" />
            <div>
              <p className="text-xs text-slate-500">Access Role</p>
              <p className="font-semibold text-navy-900">{user?.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-royal-600" />
            <div>
              <p className="text-xs text-slate-500">Member Since</p>
              <p className="font-semibold text-navy-900">{user?.created_at || 'Active Term'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
