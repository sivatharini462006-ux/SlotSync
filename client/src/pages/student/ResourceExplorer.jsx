import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  MapPin,
  Users,
  ArrowUpRight,
  Sparkles,
  BookOpen,
  Monitor,
  Projector,
  Cpu,
  Star,
  X,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';

const CATEGORIES = [
  { value: '', label: 'All Resources' },
  { value: 'LIBRARY_SEAT', label: 'Library Seats' },
  { value: 'LAB_COMPUTER', label: 'Lab Computers' },
  { value: 'STUDY_ROOM', label: 'Study Rooms' },
  { value: 'PROJECTOR', label: 'Projectors' },
  { value: 'OTHER_EQUIPMENT', label: 'Equipment' },
];

const SMOOTH_EASE = [0.22, 1, 0.36, 1];

const getCategoryIcon = (type) => {
  switch (type) {
    case 'LIBRARY_SEAT':
      return BookOpen;
    case 'LAB_COMPUTER':
      return Monitor;
    case 'STUDY_ROOM':
      return Users;
    case 'PROJECTOR':
      return Projector;
    default:
      return Cpu;
  }
};

const ResourceExplorer = ({ defaultCategory = '' }) => {
  const { user } = useAuth();
  const basePath = user?.role === 'FACULTY' ? '/faculty' : '/student';

  const [resources, setResources] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(defaultCategory);
  const [statusFilter, setStatusFilter] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('slotsync_fav_resources') || '[]');
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(true);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (category) params.type = category;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/resources', { params });
      setResources(res.data.resources || []);
    } catch (err) {
      console.error('Resource fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [category, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchResources();
  };

  const toggleFavorite = (id) => {
    setFavorites((prev) => {
      const updated = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      localStorage.setItem('slotsync_fav_resources', JSON.stringify(updated));
      return updated;
    });
  };

  const displayedResources = useMemo(() => {
    if (!onlyFavorites) return resources;
    return resources.filter((r) => favorites.includes(r.id));
  }, [resources, onlyFavorites, favorites]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: SMOOTH_EASE }}
      className="space-y-6"
    >
      {/* Ash & Sea Glass Header */}
      <div className="bg-white p-6 rounded-2xl border border-navy-100 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-royal-600">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Campus Directory</span>
          </div>
          <h1 className="text-2xl font-extrabold text-navy-900 mt-0.5">Resource Explorer</h1>
          <p className="text-sm text-slate-600 mt-1">
            Browse library seats, computer lab workstations, study rooms, and projectors.
          </p>
        </div>

        <Link
          to={`${basePath}/floor-map`}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-sm font-semibold transition-colors shrink-0"
        >
          <MapPin className="w-4 h-4 text-royal-500" />
          <span>Switch to Floor Map</span>
        </Link>
      </div>

      {/* Sliding Category Pills */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1">
        <div className="inline-flex p-1 bg-navy-100/80 rounded-xl border border-navy-100">
          {CATEGORIES.map((cat) => {
            const isActive = category === cat.value;
            return (
              <button
                key={cat.value || 'ALL'}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`relative px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  isActive ? 'text-white' : 'text-navy-700 hover:text-navy-900'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="explorerCategoryPill"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    className="absolute inset-0 bg-royal-600 rounded-lg shadow-sm"
                  />
                )}
                <span className="relative z-10">{cat.label}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setOnlyFavorites((prev) => !prev)}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
            onlyFavorites
              ? 'bg-amber-50 border-amber-300 text-amber-800'
              : 'bg-white border-navy-100 text-navy-700 hover:border-amber-300'
          }`}
        >
          <Star
            className={`w-3.5 h-3.5 ${
              onlyFavorites ? 'fill-amber-400 text-amber-500' : 'text-slate-400'
            }`}
          />
          <span>Starred ({favorites.length})</span>
        </button>
      </div>

      {/* Search & Status Filter Bar */}
      <form
        onSubmit={handleSearchSubmit}
        className="bg-white p-4 rounded-2xl border border-navy-100 shadow-card grid grid-cols-1 md:grid-cols-12 gap-3"
      >
        <div className="md:col-span-7 relative">
          <Search className="w-4 h-4 text-royal-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code (LIB001), name, or room..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-navy-100 text-sm text-navy-900 placeholder:text-slate-400 hover:border-royal-500 focus:border-royal-600 focus:ring-2 focus:ring-royal-500/20 outline-none transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setTimeout(fetchResources, 0);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy-900 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="md:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-navy-100 text-sm bg-white text-navy-900 focus:border-royal-600 outline-none"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        <button type="submit" className="md:col-span-2 btn-sea-glass py-2.5 cursor-pointer">
          Search
        </button>
      </form>

      {/* Resource Cards Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-60 rounded-2xl bg-navy-100/70 animate-pulse border border-navy-100"
            />
          ))}
        </div>
      ) : displayedResources.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-navy-100 text-slate-500 shadow-card">
          No resources found matching your filter criteria.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedResources.map((res, idx) => {
            const CategoryIcon = getCategoryIcon(res.resource_type);
            const isFav = favorites.includes(res.id);
            return (
              <motion.div
                key={res.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03, duration: 0.28, ease: SMOOTH_EASE }}
                whileHover={{ y: -3 }}
                className="bg-white rounded-2xl border border-navy-100 p-5 shadow-card hover:shadow-soft hover:border-royal-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-royal-700 bg-teal-50 border border-teal-200/70 px-2.5 py-1 rounded-lg">
                        {res.resource_code}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleFavorite(res.id)}
                        title={isFav ? 'Remove from Starred' : 'Star this resource'}
                        className="p-1.5 rounded-lg hover:bg-amber-50 transition-colors cursor-pointer"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            isFav ? 'fill-amber-400 text-amber-500' : 'text-slate-300'
                          }`}
                        />
                      </button>
                    </div>
                    <StatusBadge status={res.status} />
                  </div>

                  <div className="flex items-start gap-2.5 mt-3.5">
                    <div className="p-2 rounded-xl bg-navy-50 text-royal-600 shrink-0 mt-0.5">
                      <CategoryIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-navy-900 leading-snug">
                        {res.resource_name}
                      </h3>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                        {res.resource_type.replace('_', ' ')}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">
                    {res.description || 'Campus shared academic resource with live slot sync.'}
                  </p>

                  <div className="mt-4 pt-3 border-t border-navy-100 flex items-center justify-between text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-royal-600" />
                      {res.building}, Fl {res.floor_number} ({res.room_number})
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-navy-900 tabular-nums">
                      <Users className="w-3.5 h-3.5 text-royal-600" /> {res.capacity}
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex gap-2.5">
                  <Link
                    to={`${basePath}/resources/${res.id}`}
                    className="flex-1 btn-ash-secondary py-2 px-3 text-xs"
                  >
                    Details & Slots
                  </Link>
                  <Link
                    to={`${basePath}/book?resourceId=${res.id}`}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold text-center inline-flex items-center justify-center gap-1 transition-all ${
                      res.status === 'ACTIVE'
                        ? 'btn-sea-glass py-2 px-3 text-xs'
                        : 'bg-navy-100 text-slate-400 pointer-events-none'
                    }`}
                  >
                    <span>Reserve</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default ResourceExplorer;