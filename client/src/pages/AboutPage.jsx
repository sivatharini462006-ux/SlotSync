import { Link } from 'react-router-dom';
import { ArrowLeft, Database, Lock, Cpu, QrCode } from 'lucide-react';
import Logo from '../components/Logo';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-surface text-navy-900">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Logo />
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-royal-600 hover:underline">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12 space-y-8">
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
          <h1 className="text-3xl font-extrabold text-navy-900">About SlotSync Architecture</h1>
          <p className="mt-4 text-slate-600 leading-relaxed">
            SlotSync is engineered as a concurrency-safe campus resource reservation platform using
            React.js, Node.js, Express.js, and MySQL (InnoDB). Unlike basic CRUD booking apps that
            fail under simultaneous traffic, SlotSync enforces transactional integrity directly at the
            database row level.
          </p>

          <div className="mt-8 grid sm:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-surface border border-slate-200">
              <Database className="w-6 h-6 text-royal-600" />
              <h3 className="mt-3 font-bold">InnoDB Row-Level Locking</h3>
              <p className="mt-1 text-sm text-slate-600">
                Uses <code>BEGIN TRANSACTION</code> and <code>SELECT ... FOR UPDATE</code> on the target resource row so concurrent bookings serialize cleanly.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-surface border border-slate-200">
              <Lock className="w-6 h-6 text-royal-600" />
              <h3 className="mt-3 font-bold">JWT & Role-Based Security</h3>
              <p className="mt-1 text-sm text-slate-600">
                Strict RBAC enforcement separating Student, Faculty, and Administrator capabilities on both API and UI layers.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-surface border border-slate-200">
              <QrCode className="w-6 h-6 text-royal-600" />
              <h3 className="mt-3 font-bold">SHA-256 QR Verification</h3>
              <p className="mt-1 text-sm text-slate-600">
                Generates single-use cryptographic check-in tokens stored as SHA-256 hashes in MySQL.
              </p>
            </div>
            <div className="p-5 rounded-xl bg-surface border border-slate-200">
              <Cpu className="w-6 h-6 text-royal-600" />
              <h3 className="mt-3 font-bold">Automated Cron Lifecycle</h3>
              <p className="mt-1 text-sm text-slate-600">
                <code>node-cron</code> checks every minute for unverified bookings past their 15-minute grace window and releases slots automatically.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AboutPage;