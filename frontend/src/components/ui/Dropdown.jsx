import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Dropdown = ({
  trigger,
  items = [], // Array of { label, onClick, icon, divider, danger }
  align = 'right', // left, right
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const alignments = {
    left: 'left-0 origin-top-left',
    right: 'right-0 origin-top-right'
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div onClick={() => setIsOpen((prev) => !prev)} className="cursor-pointer">
        {trigger}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={`absolute mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-darkSurface z-50 overflow-hidden ${alignments[align]} ${className}`}
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            <div className="py-1">
              {items.map((item, idx) => {
                if (item.divider) {
                  return <hr key={idx} className="border-slate-100 dark:border-slate-800 my-1" />;
                }

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (item.onClick) item.onClick();
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 transition-colors ${
                      item.danger
                        ? 'text-brand-red hover:bg-red-50 dark:hover:bg-red-950/20'
                        : 'text-slate-700 hover:bg-slate-50 dark:text-darkText dark:hover:bg-slate-800'
                    }`}
                  >
                    {item.icon && <span className="text-slate-400 dark:text-darkMuted">{item.icon}</span>}
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dropdown;
