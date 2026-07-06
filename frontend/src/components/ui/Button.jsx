import React from 'react';
import { motion } from 'framer-motion';

const Button = ({
  children,
  type = 'button',
  variant = 'primary', // primary, secondary, outline, danger, ghost
  size = 'md', // sm, md, lg
  className = '',
  disabled = false,
  loading = false,
  onClick,
  ...props
}) => {
  const baseStyle = 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-brand-blue/50 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-brand-blue text-white hover:bg-brand-blueDark active:bg-brand-blueDark/95 shadow-sm hover:shadow-md dark:bg-brand-blueDark dark:hover:bg-brand-blue',
    secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-200/90 dark:bg-slate-800 dark:text-darkText dark:hover:bg-slate-700',
    outline: 'border border-slate-250 text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 dark:border-slate-850 dark:text-darkText dark:bg-darkSurface dark:hover:bg-darkElevated',
    danger: 'bg-brand-red text-white hover:bg-brand-red/90 active:bg-brand-red/95 shadow-sm hover:shadow-md',
    ghost: 'text-slate-600 hover:bg-slate-50 active:bg-slate-100 dark:text-darkMuted dark:hover:bg-slate-800/80'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base'
  };

  return (
    <motion.button
      type={type}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      whileHover={disabled || loading ? {} : { scale: 1.02, y: -0.5 }}
      whileTap={disabled || loading ? {} : { scale: 0.98 }}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </motion.button>
  );
};

export default Button;
