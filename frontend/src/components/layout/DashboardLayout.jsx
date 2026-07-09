import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, Bell, Menu, ExternalLink } from 'lucide-react';
import api from '../../services/api';

const DashboardLayout = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      try {
        const response = await api.get('/trial-requests');
        const pending = response.data.data.filter(r => r.status === 'Pending');
        setNotifications(pending);
      } catch (err) {
        // ignore
      }
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000); // query every 20s
    return () => clearInterval(interval);
  }, [user]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login');
      } else if (requiredRole) {
        const isAuthorized = user.role === requiredRole || 
                             (requiredRole === 'admin' && user.role === 'super_admin');
        if (!isAuthorized) {
          navigate((user.role === 'admin' || user.role === 'super_admin') ? '/admin/dashboard' : '/student/dashboard');
        }
      }
    }
  }, [user, loading, requiredRole, navigate]);

  if (loading || !user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-darkBg">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-brand-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm font-semibold text-slate-500 dark:text-darkMuted uppercase tracking-wider">Restoring Session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-slate-50/50 dark:bg-darkBg">
      {/* Mobile Drawer Overlay Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-30 md:hidden transition-opacity duration-300"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <Sidebar mobileOpen={mobileSidebarOpen} setMobileOpen={setMobileSidebarOpen} />

      {/* Main Section */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-200 bg-white dark:bg-darkSurface dark:border-slate-800 flex items-center justify-between px-4 md:px-8 shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-darkMuted dark:hover:bg-slate-800 transition-colors md:hidden mr-1"
            >
              <Menu size={20} />
            </button>
            <div className="text-xs font-semibold text-slate-400 dark:text-darkMuted uppercase tracking-wider">
              Portal / {user.role} / Overview
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-darkMuted dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Notification Alert Trigger */}
            <div className="relative flex items-center" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-darkMuted dark:hover:bg-slate-800 transition-colors focus:outline-none"
              >
                <Bell size={18} />
                {notifications.length > 0 && (
                  <span className="absolute top-0.5 right-0.5 flex h-4.5 w-4.5 min-w-[18px] items-center justify-center rounded-full bg-brand-red text-[8px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-darkSurface animate-pulse px-1">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-80 origin-top-right rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-darkSurface focus:outline-none z-50 overflow-hidden"
                    style={{ top: '100%' }}
                  >
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-darkBg/30 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                        Alert Notifications
                      </span>
                      {notifications.length > 0 && (
                        <span className="text-[9px] font-bold bg-amber-500/10 text-amber-500 dark:text-amber-400 px-1.5 py-0.5 rounded">
                          {notifications.length} Pending
                        </span>
                      )}
                    </div>

                    {/* Content List */}
                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40">
                      {notifications.length > 0 ? (
                        notifications.slice(0, 5).map((notif) => (
                          <div
                            key={notif._id}
                            onClick={() => {
                              setDropdownOpen(false);
                              navigate('/admin/trial-inquiries');
                            }}
                            className="px-4 py-3 hover:bg-slate-50/80 dark:hover:bg-darkBg/40 cursor-pointer transition-colors space-y-1"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                                {notif.fullName}
                              </span>
                              <span className="text-[8px] text-slate-400 font-mono">
                                {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-darkMuted font-semibold">
                              {notif.subject} trial request
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-darkMuted truncate max-w-[260px]">
                              {notif.message}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center px-4 space-y-2">
                          <div className="h-8 w-8 rounded-full bg-slate-55 dark:bg-slate-850 flex items-center justify-center text-slate-400">
                            <Bell size={14} />
                          </div>
                          <p className="text-[11px] font-medium text-slate-550 dark:text-darkMuted">
                            No pending trial inquiries
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    {(user?.role === 'admin' || user?.role === 'super_admin') && (
                      <div 
                        onClick={() => {
                          setDropdownOpen(false);
                          navigate('/admin/trial-inquiries');
                        }}
                        className="px-4 py-2.5 text-center text-[10px] font-bold text-brand-blue dark:text-brand-blueLight border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-darkBg/20 hover:bg-slate-100 dark:hover:bg-slate-800/30 cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span>View All Inquiries</span>
                        <ExternalLink size={10} />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <hr className="h-6 border-l border-slate-200 dark:border-slate-800" />

            {/* Profile Brief */}
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-brand-blue/15 flex items-center justify-center text-brand-blue font-bold text-xs uppercase dark:bg-brand-blue/20 dark:text-brand-blueLight">
                {user.fullName.charAt(0)}
              </div>
              <span className="hidden md:inline text-xs font-bold text-slate-700 dark:text-darkText">{user.fullName}</span>
            </div>
          </div>
        </header>

        {/* Dynamic Inner Content Pane */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8 relative">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
