import React from 'react';
import { motion } from 'framer-motion';

const ProgressBar = ({
  value, // 0 to 100
  max = 100,
  variant = 'blue', // blue, violet, green, red, amber
  height = 'h-2',
  className = '',
  showLabel = false
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const variants = {
    blue: 'bg-brand-blue',
    violet: 'bg-brand-violet',
    green: 'bg-brand-emerald',
    red: 'bg-brand-red',
    amber: 'bg-brand-amber'
  };

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-darkMuted">
          <span>Progress</span>
          <span>{percentage}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden ${height}`}>
        <motion.div
          className={`h-full rounded-full ${variants[variant]}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
