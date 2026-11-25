import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import {
  LayoutDashboard,
  MapPin,
  Search,
  CalendarPlus,
  CalendarCheck,
  History,
  QrCode,
  UserCircle,
  Boxes,
  Users,
  BarChart3,
  AlertTriangle,
  FileText,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import CommandPalette from '../components/CommandPalette';

const NAV_BY_ROLE = {
  STUDENT: [
    { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/student/floor-map', label: 'Interactive Floor Map', icon: MapPin },
    { to: '/student/resources', label: 'Resource Explorer', icon: Search },
    { to: '/student/book', label: 'Book a Slot', icon: CalendarPlus },
    { to: '/student/reservations', label: 'My Reservations', icon: CalendarCheck },
    { to: '/student/checkin', label: 'QR Check-In', icon: QrCode },
    { to: '/student/history', label: 'Booking History', icon: History },
    { to: '/student/profile', label: 'Profile', icon: UserCircle },
  ],
  FACULTY: [
    { to: '/faculty/dashboard', label: 'Faculty Dashboard', icon: LayoutDashboard },
    { to: '/faculty/floor-map', label: 'Interactive Floor Map', icon: MapPin },
    { to: '/faculty/resources', label: 'Resource Explorer', icon: Search },
    { to: '/faculty/book', label: 'Reserve Equipment / Lab', icon: CalendarPlus },
    { to: '/faculty/reservations', label: 'My Reservations', icon: CalendarCheck },
    { to: '/faculty/checkin', label: 'QR Check-In', icon: QrCode },
    { to: '/faculty/profile', label: 'Profile', icon: UserCircle },
  ],
  ADMIN: [
    { to: '/admin/dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
    { to: '/admin/resources', label: 'Resource Management', icon: Boxes },
    { to: '/admin/bookings', label: 'All Reservations', icon: CalendarCheck },
    { to: '/admin/no-shows', label: 'No-Show Monitor', icon: AlertTriangle },
    { to: '/admin/users', label: 'User Management', icon: Users },
    { to: '/admin/analytics', label: 'Analytics & Reports', icon: BarChart3 },
    { to: '/admin/audit-logs', label: 'Audit Logs', icon: FileText },
  ],
};

const SMOOTH_EASE = [0.22, 1, 0.36, 1];

const pageVariants = {
  initial: { opacity: 0, y: 12, scale: 0.992 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.32, ease: SMOOTH_EASE },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.995,
    transition: { duration: 0.18, ease: SMOOTH_EASE },
  },
};

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  const navItems = NAV_BY_ROLE[user?.role] || [];
  const activeNav = navItems.find((item) => location.pathname.startsWith(item.to));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen flex bg-surface text-navy-900">
        {/* Smooth Mobile Backdrop */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: SMOOTH_EASE }}
              className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Ash Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 bg-navy-900 text-slate-200 border-r border-navy-800 flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:static lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="h-16 px-6 flex items-center justify-between border-b border-navy-800">
            <Logo light to="/" />
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-5 py-3.5 border-b border-navy-800/80 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-widest text-royal-500">
              {user?.role} PORTAL
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-royal-500 shadow-glow-teal" />
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item, idx) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
              return (
                <motion.div
                  key={item.to}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03, duration: 0.28, ease: SMOOTH_EASE }}
                >
                  <NavLink
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200 group ${
                      isActive
                        ? 'text-white'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-navy-800/60'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebarActivePill"
                        transition={{ type: 'spring', stiffness: 350, damping: 30, mass: 0.8 }}
                        className="absolute inset-0 bg-gradient-to-r from-royal-600/25 to-royal-500/10 border-l-2 border-royal-500 rounded-xl"
                      />
                    )}
                    <Icon
                      className={`relative z-10 w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                        isActive ? 'text-royal-500' : 'text-slate-400 group-hover:text-royal-500'
                      }`}
                    />
                    <span className="relative z-10">{item.label}</span>
                  </NavLink>
                </motion.div>
              );
            })}
          </nav>

          <div className="p-4 border-t border-navy-800">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-navy-800 hover:bg-rose-600/90 text-slate-300 hover:text-white text-sm font-semibold transition-colors duration-200 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </motion.button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Glassmorphic Top Navbar */}
          <header className="h-16 bg-white/80 backdrop-blur-md border-b border-navy-100 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl text-navy-900 hover:bg-navy-100 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2.5 truncate">
                <AnimatePresence mode="wait">
                  <motion.h1
                    key={activeNav?.label || 'default'}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2, ease: SMOOTH_EASE }}
                    className="text-sm sm:text-base font-bold text-navy-900 truncate"
                  >
                    {activeNav?.label || 'Smart Campus Resource Management'}
                  </motion.h1>
                </AnimatePresence>
                <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200/70 text-royal-700 text-[11px] font-semibold">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-royal-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-royal-600" />
                  </span>
                  Live Sync
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <button
                type="button"
                onClick={() => setCmdOpen(true)}
                className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-navy-50 hover:bg-navy-100 border border-navy-100 text-xs text-slate-600 transition-colors cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 text-royal-600" />
                <span>Quick jump...</span>
                <kbd className="px-1.5 py-0.5 text-[10px] font-bold bg-white border border-navy-100 rounded text-slate-500">
                  Ctrl K
                </kbd>
              </button>

              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-navy-900 leading-none">{user?.name}</p>
                <p className="text-xs text-slate-500 mt-1">{user?.email}</p>
              </div>
              <motion.div
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.95 }}
                className="w-9 h-9 rounded-full bg-gradient-to-br from-royal-500 to-royal-700 text-white font-bold flex items-center justify-center text-sm shadow-soft ring-2 ring-royal-500/20 cursor-pointer"
              >
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </motion.div>
            </div>
          </header>

          {/* Silk-Smooth Page Transition Outlet */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        {/* Global Ctrl + K Command Palette */}
        <CommandPalette open={cmdOpen} onClose={(val) => setCmdOpen(Boolean(val))} />
      </div>
    </MotionConfig>
  );
};

export default DashboardLayout;