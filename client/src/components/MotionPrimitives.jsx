import React from 'react';
import { motion } from 'framer-motion';

// 1. Staggered Page & Grid Container
export const StaggerContainer = ({ children, className = '' }) => (
  <motion.div
    initial="hidden"
    animate="show"
    variants={{
      hidden: { opacity: 0 },
      show: { opacity: 1, transition: { staggerChildren: 0.06 } },
    }}
    className={className}
  >
    {children}
  </motion.div>
);

// 2. Individual Animated Card
export const AnimatedCard = ({ children, className = '' }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 12 },
      show: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 320, damping: 24 },
      },
    }}
    whileHover={{ y: -2 }}
    className={`bg-white border border-navy-100 rounded-2xl shadow-card transition-shadow hover:shadow-soft ${className}`}
  >
    {children}
  </motion.div>
);

// 3. Sliding Sea-Glass Pill Tabs (for Category Filters & Role Switchers)
export const SlidingTabs = ({ tabs, activeTab, onChange, layoutId = 'activeTabPill' }) => (
  <div className="inline-flex p-1 bg-navy-100/80 rounded-xl border border-navy-100">
    {tabs.map((tab) => {
      const value = typeof tab === 'string' ? tab : tab.value;
      const label = typeof tab === 'string' ? tab : tab.label;
      const isActive = activeTab === value;
      return (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          className={`relative px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            isActive ? 'text-white' : 'text-navy-700 hover:text-navy-900'
          }`}
        >
          {isActive && (
            <motion.span
              layoutId={layoutId}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="absolute inset-0 bg-royal-600 rounded-lg shadow-sm"
            />
          )}
          <span className="relative z-10">{label}</span>
        </button>
      );
    })}
  </div>
);

// 4. Live WebSocket Beacon (for Real-Time Floor Status)
export const LiveBeacon = ({ label = 'Live Sync' }) => (
  <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200/60 text-royal-700 text-xs font-semibold">
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-royal-500 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-royal-600" />
    </span>
    {label}
  </span>
);

// 5. Ash Skeleton Shimmer (replaces plain "Loading..." text)
export const SkeletonCard = ({ height = 'h-32' }) => (
  <div className={`w-full ${height} rounded-2xl bg-navy-100/80 animate-pulse border border-navy-100`} />
);