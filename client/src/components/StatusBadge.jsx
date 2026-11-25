const STATUS_STYLES = {
  AVAILABLE: 'bg-green-100 text-green-800 border-green-200',
  ACTIVE: 'bg-green-100 text-green-800 border-green-200',
  CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  SELECTED: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CHECKED_IN: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  COMPLETED: 'bg-slate-100 text-slate-700 border-slate-200',
  BOOKED: 'bg-red-100 text-red-800 border-red-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
  NO_SHOW: 'bg-orange-100 text-orange-800 border-orange-200',
  INACTIVE: 'bg-gray-200 text-gray-700 border-gray-300',
  MAINTENANCE: 'bg-amber-100 text-amber-800 border-amber-200',
  UNAVAILABLE: 'bg-gray-200 text-gray-700 border-gray-300',
};

const StatusBadge = ({ status }) => {
  const normalized = (status || 'UNKNOWN').toUpperCase();
  const style = STATUS_STYLES[normalized] || 'bg-gray-100 text-gray-800 border-gray-200';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style}`}
    >
      {normalized.replace('_', ' ')}
    </span>
  );
};

export default StatusBadge;