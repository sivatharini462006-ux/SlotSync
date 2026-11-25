import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  CalendarPlus,
  MapPin,
  QrCode,
  CalendarCheck,
  LayoutDashboard,
  BarChart3,
  AlertTriangle,
  Boxes,
  ArrowRight,
  Command,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const COMMANDS_BY_ROLE = {
  STUDENT: [
    { label: 'Quick Book a Seat or Lab', hint: 'Reserve a slot now', to: '/student/book', icon: CalendarPlus, group: 'Actions' },
    { label: 'Open QR Check-In Pass', hint: 'Scan or show pass', to: '/student/checkin', icon: QrCode, group: 'Actions' },
    { label: 'Interactive Floor Map', hint: 'Live seat availability', to: '/student/floor-map', icon: MapPin, group: 'Explore' },
    { label: 'Explore All Resources', hint: 'Filter library, labs & rooms', to: '/student/resources', icon: Search, group: 'Explore' },
    { label: 'My Active Reservations', hint: 'Manage or cancel bookings', to: '/student/reservations', icon: CalendarCheck, group: 'Navigation' },
    { label: 'Student Dashboard', hint: 'Overview & reliability score', to: '/student/dashboard', icon: LayoutDashboard, group: 'Navigation' },
  ],
  FACULTY: [
    { label: 'Reserve Equipment or Lab', hint: 'Priority faculty booking', to: '/faculty/book', icon: CalendarPlus, group: 'Actions' },
    { label: 'Open QR Check-In Pass', hint: 'Verify arrival', to: '/faculty/checkin', icon: QrCode, group: 'Actions' },
    { label: 'Interactive Floor Map', hint: 'Live campus view', to: '/faculty/floor-map', icon: MapPin, group: 'Explore' },
    { label: 'Faculty Dashboard', hint: 'Overview', to: '/faculty/dashboard', icon: LayoutDashboard, group: 'Navigation' },
  ],
  ADMIN: [
    { label: 'No-Show Monitor', hint: 'View auto-released slots', to: '/admin/no-shows', icon: AlertTriangle, group: 'Monitoring' },
    { label: 'Analytics & Peak Heatmap', hint: 'Utilization & reports', to: '/admin/analytics', icon: BarChart3, group: 'Monitoring' },
    { label: 'Manage Campus Resources', hint: 'Add or edit seats/labs', to: '/admin/resources', icon: Boxes, group: 'Management' },
    { label: 'All Reservations', hint: 'Live booking feed', to: '/admin/bookings', icon: CalendarCheck, group: 'Management' },
    { label: 'Admin Dashboard', hint: 'System overview', to: '/admin/dashboard', icon: LayoutDashboard, group: 'Navigation' },
  ],
};

const CommandPalette = ({ open, onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const items = COMMANDS_BY_ROLE[user?.role] || COMMANDS_BY_ROLE.STUDENT;
  const filtered = items.filter(
    (item) =>
      item.label.toLowerCase().includes(query.toLowerCase()) ||
      item.hint.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, open]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        open ? onClose() : onClose(true);
      }
      if (!open) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (filtered.length ? (prev + 1) % filtered.length : 0));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filtered.length ? (prev - 1 + filtered.length) % filtered.length : 0
        );
      }
      if (e.key === 'Enter' && filtered[selectedIndex]) {
        e.preventDefault();
        navigate(filtered[selectedIndex].to);
        onClose();
        setQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, filtered, selectedIndex, navigate, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[14vh] px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onClose()}
            className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-lg bg-white border border-navy-100 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-navy-100">
              <Search className="w-4 h-4 text-royal-600 shrink-0" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command or search SlotSync (e.g., Floor Map, QR, Book)..."
                className="w-full text-sm text-navy-900 placeholder:text-slate-400 outline-none bg-transparent"
              />
              <kbd className="px-2 py-0.5 text-[10px] font-bold text-slate-500 bg-navy-100 rounded">
                ESC
              </kbd>
            </div>

            <div className="max-h-72 overflow-y-auto p-2 space-y-1">
              {filtered.length === 0 ? (
                <p className="text-center text-sm text-slate-500 py-8">
                  No matching commands for "{query}"
                </p>
              ) : (
                filtered.map((item, idx) => {
                  const Icon = item.icon;
                  const active = idx === selectedIndex;
                  return (
                    <button
                      key={item.to}
                      type="button"
                      onMouseEnter={() => setSelectedIndex(idx)}
                      onClick={() => {
                        navigate(item.to);
                        onClose();
                        setQuery('');
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                        active
                          ? 'bg-royal-600 text-white shadow-sm'
                          : 'text-navy-900 hover:bg-navy-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            active ? 'bg-white/15 text-white' : 'bg-teal-50 text-royal-600'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold leading-tight">{item.label}</p>
                          <p
                            className={`text-xs mt-0.5 ${
                              active ? 'text-teal-100' : 'text-slate-500'
                            }`}
                          >
                            {item.hint}
                          </p>
                        </div>
                      </div>
                      <ArrowRight
                        className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-300'}`}
                      />
                    </button>
                  );
                })
              )}
            </div>

            <div className="px-4 py-2.5 bg-navy-50 border-t border-navy-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <Command className="w-3 h-3 text-royal-600" /> Use ↑↓ arrows to navigate, Enter to open
              </span>
              <span className="font-semibold text-royal-700">SlotSync Quick Jump</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;