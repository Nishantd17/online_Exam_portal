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
    default: 'bg-white border-slate-200 dark:bg-[#0d112b]/60 dark:border-slate-800/40 dark:backdrop-blur-xl shadow-xs',
    glass: 'glass-card',
    gradient: 'bg-gradient-to-tr from-white to-slate-50 border-slate-200 dark:from-[#1b1437]/45 dark:to-[#2d1b69]/20 dark:border-slate-800/40 dark:backdrop-blur-xl shadow-sm'
  };

  const hoverEffect = hoverLift && !onClick
    ? { whileHover: { y: -5, scale: 1.01, boxShadow: '0 12px 30px rgba(0, 240, 255, 0.15)' } }
    : {};

  const clickEffect = onClick
    ? {
        whileHover: { y: -4, scale: 1.02, boxShadow: '0 12px 25px rgba(0, 240, 255, 0.18)' },
        whileTap: { scale: 0.98 },
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
