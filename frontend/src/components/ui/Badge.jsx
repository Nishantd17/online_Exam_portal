import React from 'react';

const Badge = ({
  children,
  variant = 'neutral', // neutral, info, success, warning, danger
  dot = false,
  className = ''
}) => {
  const styles = {
    neutral: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-darkText dark:border-slate-700',
    info: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-brand-blueLight dark:border-blue-900/35',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-brand-emerald dark:border-emerald-900/35',
    warning: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-brand-amber dark:border-amber-900/35',
    danger: 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-brand-red dark:border-red-900/35'
  };

  const dots = {
    neutral: 'bg-slate-400 dark:bg-slate-500',
    info: 'bg-brand-blue',
    success: 'bg-brand-emerald',
    warning: 'bg-brand-amber',
    danger: 'bg-brand-red'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${styles[variant]} ${className}`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dots[variant]}`} />}
      {children}
    </span>
  );
};

export default Badge;
