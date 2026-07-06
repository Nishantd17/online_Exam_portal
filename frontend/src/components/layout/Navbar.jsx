import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Sun, Moon, GraduationCap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Button from '../ui/Button';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 py-3 shadow-xs'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-brand-blue to-brand-violet flex items-center justify-center text-white shadow-md shadow-brand-blue/20">
            <GraduationCap size={20} />
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-750 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
            ExamPortal
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-medium text-slate-600 dark:text-darkMuted hover:text-brand-blue dark:hover:text-darkText transition-colors">
            Features
          </a>
          <a href="#statistics" className="text-sm font-medium text-slate-600 dark:text-darkMuted hover:text-brand-blue dark:hover:text-darkText transition-colors">
            Statistics
          </a>
          <a href="#faq" className="text-sm font-medium text-slate-600 dark:text-darkMuted hover:text-brand-blue dark:hover:text-darkText transition-colors">
            FAQ
          </a>
          <a href="#contact" className="text-sm font-medium text-slate-600 dark:text-darkMuted hover:text-brand-blue dark:hover:text-darkText transition-colors">
            Contact
          </a>
        </div>

        {/* Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-darkMuted dark:hover:bg-slate-800 transition-colors"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          {user ? (
            <Link to={user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'}>
              <Button size="sm">Go to Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link to="/signup">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile controls */}
        <div className="flex md:hidden items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-slate-500 dark:text-darkMuted"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={() => setIsOpen((prev) => !prev)}
            className="text-slate-700 dark:text-darkText"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-slate-200 dark:bg-slate-900 dark:border-slate-800 p-6 flex flex-col gap-4 shadow-xl z-50">
          <a
            href="#features"
            onClick={() => setIsOpen(false)}
            className="text-base font-semibold text-slate-800 dark:text-darkText"
          >
            Features
          </a>
          <a
            href="#statistics"
            onClick={() => setIsOpen(false)}
            className="text-base font-semibold text-slate-800 dark:text-darkText"
          >
            Statistics
          </a>
          <a
            href="#faq"
            onClick={() => setIsOpen(false)}
            className="text-base font-semibold text-slate-800 dark:text-darkText"
          >
            FAQ
          </a>
          <a
            href="#contact"
            onClick={() => setIsOpen(false)}
            className="text-base font-semibold text-slate-800 dark:text-darkText"
          >
            Contact
          </a>
          <hr className="border-slate-100 dark:border-slate-800" />
          {user ? (
            <Link to={user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} onClick={() => setIsOpen(false)}>
              <Button className="w-full">Go to Dashboard</Button>
            </Link>
          ) : (
            <div className="flex flex-col gap-2">
              <Link to="/login" onClick={() => setIsOpen(false)}>
                <Button variant="outline" className="w-full">Sign In</Button>
              </Link>
              <Link to="/signup" onClick={() => setIsOpen(false)}>
                <Button className="w-full">Get Started</Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
