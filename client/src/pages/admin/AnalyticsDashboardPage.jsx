import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Filler,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import { Download, RotateCcw, Sparkles, TrendingUp, Calendar } from 'lucide-react';
import api from '../../services/api';
import SmartSlotHeatmap from '../../components/SmartSlotHeatmap';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Filler,
  Title,
  Tooltip,
  Legend
);

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'LIBRARY_SEAT', label: 'Library Seats' },
  { value: 'LAB_COMPUTER', label: 'Lab Computers' },
  { value: 'STUDY_ROOM', label: 'Study Rooms' },
  { value: 'PROJECTOR', label: 'Projectors' },
  { value: 'OTHER_EQUIPMENT', label: 'Equipment' },
];

const SMOOTH_EASE = [0.22, 1, 0.36, 1];

const AnalyticsDashboardPage = () => {
  const [data, setData] = useState(null);
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const params = {};
      if (category) params.category = category;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      const res = await api.get('/admin/analytics', { params });
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [category, startDate, endDate]);

  const handleExportCsv = () => {
    if (!data) return;
    const rows = [
      ['SlotSync Campus Resource Utilization Report'],
      ['Active Utilization (%)', `${data.utilizationPercentage}%`],
      ['Category Filter', category || 'ALL'],
      ['Date Range', `${startDate || 'Start'} to ${endDate || 'Present'}`],
      [],
      ['--- CATEGORY DISTRIBUTION ---'],
      ['Category', 'Total Bookings'],
      ...(data.categoryDistribution || []).map((c) => [c.category, c.count]),
      [],
      ['--- BOOKING STATUS DISTRIBUTION ---'],
      ['Status', 'Count'],
      ...(data.statusDistribution || []).map((s) => [s.status, s.count]),
      [],
      ['--- TOP BOOKED RESOURCES ---'],
      ['Resource Code', 'Resource Name', 'Bookings'],
      ...(data.topResources || []).map((r) => [
        r.resource_code,
        r.resource_name,
        r.booking_count,
      ]),
    ];

    const csvContent = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `SlotSync-Utilization-Report-${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="h-28 rounded-2xl bg-navy-100/80 animate-pulse border border-navy-100" />
        <div className="h-16 rounded-2xl bg-navy-100/70 animate-pulse border border-navy-100" />
        <div className="grid lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-72 rounded-2xl bg-navy-100/70 animate-pulse border border-navy-100"
            />
          ))}
        </div>
      </div>
    );
  }

  const baseChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: '#334155',
          font: { family: '"Plus Jakarta Sans", sans-serif', weight: '600', size: 12 },
        },
      },
      tooltip: {
        backgroundColor: '#0F172A',
        titleFont: { family: '"Plus Jakarta Sans", sans-serif', size: 12 },
        bodyFont: { family: '"Plus Jakarta Sans", sans-serif', size: 12 },
        padding: 10,
        cornerRadius: 10,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#475569', font: { size: 11 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: '#F1F5F9' },
        ticks: { color: '#475569', font: { size: 11 }, precision: 0 },
      },
    },
  };

  const topResourcesOptions = {
    ...baseChartOptions,
    plugins: {
      ...baseChartOptions.plugins,
      tooltip: {
        ...baseChartOptions.plugins.tooltip,
        callbacks: {
          title: (items) => {
            const idx = items[0]?.dataIndex ?? 0;
            const resItem = data.topResources[idx];
            return resItem ? `${resItem.resource_code} — ${resItem.resource_name}` : '';
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: '#1E293B',
          maxRotation: 0,
          minRotation: 0,
          autoSkip: false,
          font: { family: '"Plus Jakarta Sans", sans-serif', weight: '600', size: 11 },
        },
      },
      y: {
        beginAtZero: true,
        grid: { color: '#F1F5F9' },
        ticks: { color: '#475569', font: { size: 11 }, stepSize: 1, precision: 0 },
      },
    },
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#334155',
          padding: 14,
          font: { family: '"Plus Jakarta Sans", sans-serif', weight: '600', size: 12 },
        },
      },
      tooltip: baseChartOptions.plugins.tooltip,
    },
  };

  const dailyChart = {
    labels: data.dailyBookings.map((d) => String(d.date).slice(0, 10)),
    datasets: [
      {
        label: 'Daily Reservations',
        data: data.dailyBookings.map((d) => Number(d.count)),
        backgroundColor: '#0D9488',
        hoverBackgroundColor: '#14B8A6',
        borderRadius: 8,
      },
    ],
  };

  const weeklyChart = {
    labels: data.weeklyBookings.map((w) => `Week of ${String(w.week_start).slice(0, 10)}`),
    datasets: [
      {
        label: 'Weekly Bookings Trend',
        data: data.weeklyBookings.map((w) => Number(w.count)),
        borderColor: '#0F172A',
        backgroundColor: 'rgba(13, 148, 136, 0.14)',
        pointBackgroundColor: '#0D9488',
        pointBorderColor: '#FFFFFF',
        pointRadius: 4,
        tension: 0.38,
        fill: true,
      },
    ],
  };

  const categoryChart = {
    labels: data.categoryDistribution.map((c) => c.category.replace('_', ' ')),
    datasets: [
      {
        data: data.categoryDistribution.map((c) => Number(c.count)),
        backgroundColor: ['#0D9488', '#1E293B', '#06B6D4', '#10B981', '#64748B'],
        borderWidth: 2,
        borderColor: '#FFFFFF',
      },
    ],
  };

  const statusChart = {
    labels: data.statusDistribution.map((s) => s.status),
    datasets: [
      {
        data: data.statusDistribution.map((s) => Number(s.count)),
        backgroundColor: ['#0D9488', '#10B981', '#06B6D4', '#F59E0B', '#E11D48', '#64748B'],
        borderWidth: 2,
        borderColor: '#FFFFFF',
      },
    ],
  };

  // Multi-line array labels render cleanly as horizontal 2-line captions in Chart.js
  const topResourcesChart = {
    labels: data.topResources.map((r) => [
      r.resource_code,
      r.resource_name.length > 18 ? `${r.resource_name.slice(0, 16)}…` : r.resource_name,
    ]),
    datasets: [
      {
        label: 'Total Bookings',
        data: data.topResources.map((r) => Number(r.booking_count)),
        backgroundColor: '#1E293B',
        hoverBackgroundColor: '#0D9488',
        borderRadius: 8,
        maxBarThickness: 56,
      },
    ],
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: SMOOTH_EASE }}
      className="space-y-6"
    >
      {/* Header + Utilization Badge + CSV Export */}
      <div className="bg-white p-6 rounded-2xl border border-navy-100 shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-royal-600">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Administrative Intelligence</span>
          </div>
          <h1 className="text-2xl font-extrabold text-navy-900 mt-0.5">
            Analytics & Utilization Reports
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Real-time insights across resource categories, booking status trends, and peak campus
            occupancy.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-navy-900 text-white px-5 py-3 rounded-2xl border border-navy-800 flex items-center gap-3 shadow-soft">
            <TrendingUp className="w-4 h-4 text-royal-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Active Utilization:
            </span>
            <span className="text-2xl font-extrabold text-royal-500 tabular-nums">
              {data.utilizationPercentage}%
            </span>
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            className="btn-sea-glass py-3 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV Report</span>
          </button>
        </div>
      </div>

      {/* Sliding Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
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
                    layoutId="analyticsCategoryPill"
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

      {/* Date Range Filters */}
      <div className="bg-white p-4 rounded-2xl border border-navy-100 shadow-card grid sm:grid-cols-3 gap-3 items-end">
        <div>
          <label className="text-xs font-bold text-navy-700 flex items-center gap-1.5 mb-1.5">
            <Calendar className="w-3.5 h-3.5 text-royal-600" /> Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-navy-100 text-sm text-navy-900 focus:border-royal-600 outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-navy-700 flex items-center gap-1.5 mb-1.5">
            <Calendar className="w-3.5 h-3.5 text-royal-600" /> End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-navy-100 text-sm text-navy-900 focus:border-royal-600 outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setCategory('');
            setStartDate('');
            setEndDate('');
          }}
          className="btn-ash-secondary py-2 justify-center cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 text-royal-600" />
          <span>Reset Filters</span>
        </button>
      </div>

      {/* 5 Ash & Sea Glass Chart.js Visuals */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white p-6 rounded-2xl border border-navy-100 shadow-card"
        >
          <h3 className="font-bold text-navy-900 mb-4">1. Daily Bookings Volume</h3>
          <Bar data={dailyChart} options={baseChartOptions} />
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white p-6 rounded-2xl border border-navy-100 shadow-card"
        >
          <h3 className="font-bold text-navy-900 mb-4">2. Weekly Booking Trajectory</h3>
          <Line data={weeklyChart} options={baseChartOptions} />
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white p-6 rounded-2xl border border-navy-100 shadow-card"
        >
          <h3 className="font-bold text-navy-900 mb-4">3. Bookings by Resource Category</h3>
          <div className="max-w-xs mx-auto">
            <Pie data={categoryChart} options={pieOptions} />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white p-6 rounded-2xl border border-navy-100 shadow-card"
        >
          <h3 className="font-bold text-navy-900 mb-4">4. Booking Status Distribution</h3>
          <div className="max-w-xs mx-auto">
            <Doughnut data={statusChart} options={pieOptions} />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="lg:col-span-2 bg-white p-6 rounded-2xl border border-navy-100 shadow-card"
        >
          <h3 className="font-bold text-navy-900 mb-4">5. Most Frequently Booked Resources</h3>
          <Bar data={topResourcesChart} options={topResourcesOptions} />
        </motion.div>
      </div>

      {/* Weekly Campus Demand Calendar Matrix */}
      <SmartSlotHeatmap showHeatmap={true} />
    </motion.div>
  );
};

export default AnalyticsDashboardPage;