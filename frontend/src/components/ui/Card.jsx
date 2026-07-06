import React from 'react';
import { motion } from 'framer-motion';

const Card = ({
  children,
  variant = 'default', // default, glass, gradient
  hoverLift = true,
  className = '',
  onClick,
  ...props
}) => {
  const baseStyle = 'rounded-xl border p-5 transition-all duration-300';
  
  const variants = {
    default: 'bg-white border-slate-200 dark:bg-darkSurface dark:border-slate-800 shadow-xs',
    glass: 'glass-card',
    gradient: 'bg-gradient-to-tr from-white to-slate-50 border-slate-200 dark:from-darkSurface dark:to-darkElevated dark:border-slate-800 shadow-sm'
  };

  const hoverEffect = hoverLift && !onClick
    ? { whileHover: { y: -4, boxShadow: '0 10px 25px rgba(0,0,0,0.08)' } }
    : {};

  const clickEffect = onClick
    ? {
        whileHover: { y: -3, scale: 1.01, boxShadow: '0 8px 20px rgba(0,0,0,0.06)' },
        whileTap: { scale: 0.99 },
        className: `${baseStyle} ${variants[variant]} cursor-pointer ${className}`
      }
    : { className: `${baseStyle} ${variants[variant]} ${className}` };

  return (
    <motion.div
      onClick={onClick}
      {...hoverEffect}
      {...clickEffect}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default Card;
