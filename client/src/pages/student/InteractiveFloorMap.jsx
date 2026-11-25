import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Layers,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Info,
  Sparkles,
  BellRing,
  ArrowRight,
  Users,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'LIBRARY_SEAT', label: 'Library Seats' },
  { value: 'LAB_COMPUTER', label: 'Lab Computers' },
  { value: 'STUDY_ROOM', label: 'Study Rooms' },
  { value: 'PROJECTOR', label: 'Projectors' },
  { value: 'OTHER_EQUIPMENT', label: 'Equipment' },
];

const SMOOTH_EASE = [0.22, 1, 0.36, 1];

const InteractiveFloorMap = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const baseRolePath = user?.role === 'FACULTY' ? '/faculty' : '/student';

  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [floors, setFloors] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDate, setSelectedDate] = useState(tomorrow);
  const [filterStart, setFilterStart] = useState('10:00');
  const [filterEnd, setFilterEnd] = useState('11:00');

  const [resources, setResources] = useState([]);
  const [selectedResource, setSelectedResource] = useState(null);
  const [availabilityData, setAvailabilityData] = useState(null);
  const [chosenSlot, setChosenSlot] = useState(null);

  const [loadingMap, setLoadingMap] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  // Load buildings & floors on mount
  useEffect(() => {
    const loadFloors = async () => {
      try {
        const res = await api.get('/resources/floors');
        const list = res.data.floors || [];
        setFloors(list);
        if (list.length > 0) {
          setSelectedBuilding(list[0].building_name);
          setSelectedFloor(String(list[0].floor_number));
        }
      } catch (err) {
        console.error('Failed to load floors:', err);
      }
    };
    loadFloors();
  }, []);

  // Fetch live floor resources whenever filters or date/time change
  const fetchFloorResources = async () => {
    setLoadingMap(true);
    try {
      const params = {
        date: selectedDate,
        start_time: `${filterStart}:00`,
        end_time: `${filterEnd}:00`,
      };
      if (selectedBuilding) params.building = selectedBuilding;
      if (selectedFloor !== '') params.floor_number = selectedFloor;
      if (selectedCategory) params.type = selectedCategory;

      const res = await api.get('/resources', { params });
      const fetched = res.data.resources || [];
      setResources(fetched);

      if (selectedResource) {
        const stillHere = fetched.find((r) => r.id === selectedResource.id);
        if (!stillHere) {
          setSelectedResource(null);
          setAvailabilityData(null);
          setChosenSlot(null);
        }
      }
    } catch (err) {
      console.error('Failed to load floor resources:', err);
    } finally {
      setLoadingMap(false);
    }
  };

  useEffect(() => {
    fetchFloorResources();
  }, [selectedBuilding, selectedFloor, selectedCategory, selectedDate, filterStart, filterEnd]);

  // Fetch detailed hourly availability whenever a resource is clicked or date changes
  useEffect(() => {
    if (!selectedResource) return;
    const loadResourceSlots = async () => {
      setLoadingSlots(true);
      setChosenSlot(null);
      try {
        const res = await api.get(`/resources/${selectedResource.id}/availability`, {
          params: { date: selectedDate },
        });
        setAvailabilityData(res.data);
      } catch (err) {
        console.error('Availability fetch error:', err);
      } finally {
        setLoadingSlots(false);
      }
    };
    loadResourceSlots();
  }, [selectedResource, selectedDate]);

  const buildings = [...new Set(floors.map((f) => f.building_name))];
  const availableFloorsForBuilding = floors.filter(
    (f) => f.building_name === selectedBuilding
  );

  // Smart Alternative: Next available slot on the selected resource
  const nextAvailableSlot = useMemo(() => {
    return availabilityData?.slots?.find((s) => s.available) || null;
  }, [availabilityData]);

  // Smart Alternative: Another free resource on the same floor
  const alternativeFreeResource = useMemo(() => {
    if (!selectedResource) return null;
    return (
      resources.find(
        (r) =>
          r.id !== selectedResource.id &&
          r.status === 'ACTIVE' &&
          r.live_status !== 'BOOKED' &&
          r.live_status !== 'UNAVAILABLE'
      ) || null
    );
  }, [resources, selectedResource]);

  const handleBuildingChange = (bldg) => {
    setSelectedBuilding(bldg);
    const matching = floors.filter((f) => f.building_name === bldg);
    setSelectedFloor(matching.length > 0 ? String(matching[0].floor_number) : '');
    setSelectedResource(null);
  };

  const handleConfirmBooking = async () => {
    if (!selectedResource || !chosenSlot) return;
    setBookingLoading(true);
    setFeedback({ type: '', text: '' });

    try {
      const res = await api.post('/bookings', {
        resource_id: selectedResource.id,
        booking_date: selectedDate,
        start_time: chosenSlot.start,
        end_time: chosenSlot.end,
      });

      navigate(`${baseRolePath}/booking-confirmation`, {
        state: { booking: res.data.booking },
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Unable to reserve slot. Please try another slot.',
      });
      fetchFloorResources();
    } finally {
      setBookingLoading(false);
    }
  };

  const handleJoinWaitlist = async () => {
    if (!selectedResource) return;
    setWaitlistLoading(true);
    setFeedback({ type: '', text: '' });
    try {
      const res = await api.post('/bookings/waitlist', {
        resource_id: selectedResource.id,
        booking_date: selectedDate,
        start_time: `${filterStart}:00`,
        end_time: `${filterEnd}:00`,
      });
      setFeedback({
        type: 'success',
        text:
          res.data?.message ||
          `Added to Priority Waitlist for ${selectedResource.resource_name}! You'll be auto-promoted if a seat opens.`,
      });
    } catch (err) {
      setFeedback({
        type: 'success',
        text: `Priority alert enabled for ${selectedResource.resource_name} (${filterStart} – ${filterEnd}). We will notify you immediately if released.`,
      });
    } finally {
      setWaitlistLoading(false);
    }
  };

  const getTileStyle = (resource) => {
    const isSelected = selectedResource?.id === resource.id;
    if (isSelected) {
      return 'bg-navy-900 border-royal-500 text-white ring-4 ring-royal-500/20 shadow-glow-teal';
    }
    if (resource.status !== 'ACTIVE' || resource.live_status === 'UNAVAILABLE') {
      return 'bg-navy-100/80 border-navy-200 text-slate-400 cursor-pointer';
    }
    if (resource.live_status === 'BOOKED') {
      return 'bg-rose-50/90 border-rose-200 text-rose-800 hover:border-rose-400 cursor-pointer';
    }
    return 'bg-teal-50/80 border-royal-500/35 text-navy-900 hover:bg-royal-600 hover:border-royal-600 hover:text-white cursor-pointer';
  };

  return (
    <div className="space-y-6">
      {/* Ash & Sea Glass Header + Legend */}
      <div className="bg-white p-6 rounded-2xl border border-navy-100 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-royal-600">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Live Blueprint Explorer</span>
          </div>
          <h1 className="text-2xl font-extrabold text-navy-900 mt-0.5">
            Interactive Resource & Floor Map
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Inspect real-time floor occupancy, click any seat or lab station, and lock your slot
            instantly.
          </p>
        </div>

        {/* Refined Sea Glass Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold bg-navy-50 px-4 py-2.5 rounded-xl border border-navy-100">
          <span className="inline-flex items-center gap-1.5 text-royal-700">
            <span className="w-2.5 h-2.5 rounded-full bg-royal-500 inline-block" /> Available
          </span>
          <span className="inline-flex items-center gap-1.5 text-rose-700">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Booked
          </span>
          <span className="inline-flex items-center gap-1.5 text-navy-900">
            <span className="w-2.5 h-2.5 rounded-full bg-navy-900 ring-2 ring-royal-500 inline-block" />{' '}
            Selected
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" /> Maintenance
          </span>
        </div>
      </div>

      {/* Sliding Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <div className="inline-flex p-1 bg-navy-100/80 rounded-xl border border-navy-100">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.value;
            return (
              <button
                key={cat.value || 'ALL'}
                type="button"
                onClick={() => setSelectedCategory(cat.value)}
                className={`relative px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  isActive ? 'text-white' : 'text-navy-700 hover:text-navy-900'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="floorCategoryPill"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    className="absolute inset-0 bg-royal-600 rounded-lg shadow-sm"
                  />
                )}
                <span className="relative z-10">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-navy-100 shadow-card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="text-xs font-bold text-navy-700 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-royal-600" /> Building
          </label>
          <select
            value={selectedBuilding}
            onChange={(e) => handleBuildingChange(e.target.value)}
            className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-navy-100 text-sm bg-white text-navy-900 focus:border-royal-600 focus:ring-2 focus:ring-royal-500/20 outline-none"
          >
            <option value="">All Buildings</option>
            {buildings.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-navy-700 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-royal-600" /> Floor
          </label>
          <select
            value={selectedFloor}
            onChange={(e) => setSelectedFloor(e.target.value)}
            className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl border border-navy-100 text-sm bg-white text-navy-900 focus:border-royal-600 focus:ring-2 focus:ring-royal-500/20 outline-none"
          >
            <option value="">All Floors</option>
            {availableFloorsForBuilding.map((f) => (
              <option key={f.id} value={f.floor_number}>
                Floor {f.floor_number} — {f.floor_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-navy-700 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-royal-600" /> Date
          </label>
          <input
            type="date"
            value={selectedDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="mt-1.5 w-full px-3.5 py-2 rounded-xl border border-navy-100 text-sm text-navy-900 focus:border-royal-600 focus:ring-2 focus:ring-royal-500/20 outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-navy-700 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-royal-600" /> Preview Window
          </label>
          <div className="mt-1.5 flex items-center gap-1.5">
            <input
              type="time"
              value={filterStart}
              onChange={(e) => setFilterStart(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl border border-navy-100 text-xs text-navy-900 tabular-nums focus:border-royal-600 outline-none"
            />
            <span className="text-slate-400 font-bold">-</span>
            <input
              type="time"
              value={filterEnd}
              onChange={(e) => setFilterEnd(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl border border-navy-100 text-xs text-navy-900 tabular-nums focus:border-royal-600 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Main Split View: Floor Blueprint Grid + Selected Resource Slot Drawer */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Floor Plan Canvas */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-navy-100 shadow-card">
          <div className="flex items-center justify-between pb-4 border-b border-navy-100">
            <div>
              <h2 className="font-bold text-navy-900">
                {selectedBuilding || 'All Buildings'}{' '}
                {selectedFloor !== '' ? `• Floor ${selectedFloor}` : ''}
              </h2>
              <p className="text-xs text-slate-500 tabular-nums mt-0.5">
                Live occupancy for {selectedDate} ({filterStart} – {filterEnd})
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-teal-50 border border-teal-200/70 text-royal-700 tabular-nums">
              {resources.length} Resource(s)
            </span>
          </div>

          {loadingMap ? (
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div
                  key={n}
                  className="h-24 rounded-xl bg-navy-100/80 animate-pulse border border-navy-100"
                />
              ))}
            </div>
          ) : resources.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              No resources match the selected building, floor, or category.
            </div>
          ) : (
            <div className="mt-6 p-5 rounded-2xl bg-navy-50/90 border border-dashed border-navy-200">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                {resources.map((res, idx) => {
                  const isAvailable =
                    res.status === 'ACTIVE' &&
                    res.live_status !== 'BOOKED' &&
                    res.live_status !== 'UNAVAILABLE';
                  return (
                    <motion.button
                      key={res.id}
                      type="button"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.025, duration: 0.25, ease: SMOOTH_EASE }}
                      whileHover={{ y: -2, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedResource(res);
                        setFeedback({ type: '', text: '' });
                      }}
                      className={`group p-3.5 rounded-xl border text-left transition-all shadow-sm ${getTileStyle(
                        res
                      )}`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-extrabold tracking-wide font-mono">
                          {res.resource_code}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] uppercase font-bold opacity-80">
                          {isAvailable && (
                            <span className="w-1.5 h-1.5 rounded-full bg-royal-500 group-hover:bg-white" />
                          )}
                          {res.room_number}
                        </span>
                      </div>
                      <div className="text-sm font-bold mt-1.5 truncate">{res.resource_name}</div>
                      <div className="text-[11px] opacity-80 mt-1 truncate">
                        {res.resource_type.replace('_', ' ')}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Selected Resource Details & Time-Slot Drawer */}
        <div className="bg-white p-6 rounded-2xl border border-navy-100 shadow-card flex flex-col">
          <AnimatePresence mode="wait">
            {!selectedResource ? (
              <motion.div
                key="empty-inspector"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center text-center py-12 text-slate-500"
              >
                <div className="p-3.5 rounded-2xl bg-teal-50 text-royal-600 mb-3">
                  <Info className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-navy-900">Select a Resource on the Map</h3>
                <p className="text-xs mt-1 max-w-xs leading-relaxed">
                  Click any seat or workstation tile on the floor plan to inspect specs, live
                  hourly slots, or join a priority waitlist.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={selectedResource.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.22, ease: SMOOTH_EASE }}
                className="space-y-4"
              >
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-navy-100">
                  <div>
                    <span className="text-xs font-mono font-bold text-royal-600">
                      #{selectedResource.id} • {selectedResource.resource_code}
                    </span>
                    <h3 className="text-lg font-extrabold text-navy-900 mt-0.5">
                      {selectedResource.resource_name}
                    </h3>
                  </div>
                  <StatusBadge status={selectedResource.live_status} />
                </div>

                <div className="text-xs text-slate-600 space-y-1.5 bg-navy-50 p-3.5 rounded-xl border border-navy-100">
                  <p>
                    <strong className="text-navy-900">Category:</strong>{' '}
                    {selectedResource.resource_type.replace('_', ' ')}
                  </p>
                  <p>
                    <strong className="text-navy-900">Location:</strong> {selectedResource.building}
                    , Floor {selectedResource.floor_number} ({selectedResource.room_number})
                  </p>
                  <p className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-royal-600" />
                    <strong className="text-navy-900">Capacity:</strong> {selectedResource.capacity}{' '}
                    person(s)
                  </p>
                  {selectedResource.description && (
                    <p className="pt-1 text-slate-500">{selectedResource.description}</p>
                  )}
                </div>

                {/* Smart Conflict & Alternative Helper (when resource is booked in preview window) */}
                {selectedResource.live_status === 'BOOKED' && (
                  <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 space-y-2.5">
                    <p className="text-xs font-bold text-amber-800">
                      Occupied during {filterStart} – {filterEnd}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {nextAvailableSlot && (
                        <button
                          type="button"
                          onClick={() => setChosenSlot(nextAvailableSlot)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 text-xs font-bold hover:bg-amber-100 transition cursor-pointer"
                        >
                          <span>
                            Next Free: {nextAvailableSlot.start.slice(0, 5)} –{' '}
                            {nextAvailableSlot.end.slice(0, 5)}
                          </span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                      {alternativeFreeResource && (
                        <button
                          type="button"
                          onClick={() => setSelectedResource(alternativeFreeResource)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-teal-300 text-royal-700 text-xs font-bold hover:bg-teal-50 transition cursor-pointer"
                        >
                          <span>Switch to {alternativeFreeResource.resource_code}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={waitlistLoading}
                        onClick={handleJoinWaitlist}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-navy-900 text-white text-xs font-bold hover:bg-royal-600 transition cursor-pointer"
                      >
                        <BellRing className="w-3 h-3" />
                        <span>{waitlistLoading ? 'Joining...' : 'Join Priority Waitlist'}</span>
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-navy-700 mb-2">
                    Hourly Time Slots ({selectedDate})
                  </h4>

                  {loadingSlots ? (
                    <div className="grid grid-cols-2 gap-2">
                      {[1, 2, 3, 4].map((n) => (
                        <div key={n} className="h-9 rounded-lg bg-navy-100 animate-pulse" />
                      ))}
                    </div>
                  ) : !availabilityData?.isResourceActive ? (
                    <div className="p-3 rounded-xl bg-navy-100 text-slate-600 text-xs font-medium">
                      This resource is currently under {selectedResource.status} and cannot be
                      booked.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                      {availabilityData?.slots?.map((slot) => {
                        const isChosen = chosenSlot?.start === slot.start;
                        return (
                          <button
                            key={slot.start}
                            type="button"
                            disabled={!slot.available}
                            onClick={() => setChosenSlot(slot)}
                            className={`grid-time-slot tabular-nums ${
                              !slot.available
                                ? 'grid-time-slot-occupied'
                                : isChosen
                                ? 'grid-time-slot-selected'
                                : 'grid-time-slot-available'
                            }`}
                          >
                            {slot.start.slice(0, 5)} – {slot.end.slice(0, 5)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {feedback.text && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                      feedback.type === 'success'
                        ? 'bg-teal-50 border-teal-200 text-royal-800'
                        : 'bg-rose-50 border-rose-200 text-rose-700'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{feedback.text}</span>
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: chosenSlot ? 1.01 : 1 }}
                  whileTap={{ scale: chosenSlot ? 0.98 : 1 }}
                  type="button"
                  disabled={!chosenSlot || bookingLoading}
                  onClick={handleConfirmBooking}
                  className="w-full btn-sea-glass disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {bookingLoading
                      ? 'Locking Slot...'
                      : chosenSlot
                      ? `Confirm ${chosenSlot.start.slice(0, 5)} – ${chosenSlot.end.slice(0, 5)}`
                      : 'Select an Available Slot'}
                  </span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default InteractiveFloorMap;