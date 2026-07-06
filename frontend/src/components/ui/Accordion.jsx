import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const Accordion = ({
  title,
  children,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`border-b border-slate-200 dark:border-slate-800 ${className}`}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between py-4 text-left font-semibold text-slate-850 dark:text-darkText hover:text-brand-blue dark:hover:text-brand-blueLight transition-colors focus:outline-none"
      >
        <span className="text-sm md:text-base">{title}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-slate-400"
        >
          <ChevronDown size={18} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pb-4 text-sm text-slate-500 dark:text-darkMuted leading-relaxed">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Accordion;
