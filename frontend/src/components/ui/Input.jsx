import React from 'react';

const Input = ({
  label,
  id,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  error,
  icon,
  floating = false,
  className = '',
  required = false,
  ...props
}) => {
  const containerClass = floating ? 'relative mt-6' : 'flex flex-col gap-1.5';
  
  const baseInputClass = 'w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 transition-all focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue disabled:opacity-50 disabled:cursor-not-allowed dark:bg-darkSurface dark:text-darkText dark:border-slate-800';
  
  const errorInputClass = error
    ? 'border-brand-red focus:ring-brand-red/30 focus:border-brand-red'
    : 'border-slate-200 focus:ring-brand-blue/30 focus:border-brand-blue';

  const paddedClass = icon ? 'pl-9' : '';

  if (floating) {
    return (
      <div className={`${containerClass} ${className}`}>
        <input
          id={id}
          type={type}
          placeholder=" "
          value={value}
          onChange={onChange}
          className={`${baseInputClass} ${errorInputClass} ${paddedClass} py-2.5 placeholder-transparent peer floating-label-input`}
          required={required}
          {...props}
        />
        {icon && (
          <div className="absolute left-3 top-3.5 flex items-center text-slate-400 dark:text-darkMuted peer-focus:text-brand-blue">
            {icon}
          </div>
        )}
        <label
          htmlFor={id}
          className="absolute left-3 top-2.5 origin-[0] -translate-y-1/2 scale-100 text-sm text-slate-400 transition-all duration-200 pointer-events-none peer-placeholder-shown:top-1/2 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-2.5 peer-focus:scale-75 peer-focus:-translate-y-6 peer-focus:px-1 peer-focus:bg-white dark:peer-focus:bg-darkSurface dark:text-darkMuted"
        >
          {label} {required && <span className="text-brand-red">*</span>}
        </label>
        {error && <span className="text-xs text-brand-red mt-1 block">{error}</span>}
      </div>
    );
  }

  return (
    <div className={`${containerClass} ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-slate-600 dark:text-darkMuted uppercase tracking-wider">
          {label} {required && <span className="text-brand-red">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center text-slate-400 dark:text-darkMuted">
            {icon}
          </div>
        )}
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`${baseInputClass} ${errorInputClass} ${paddedClass}`}
          required={required}
          {...props}
        />
      </div>
      {error && <span className="text-xs text-brand-red mt-0.5 block">{error}</span>}
    </div>
  );
};

export default Input;
