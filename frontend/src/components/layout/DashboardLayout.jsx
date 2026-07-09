import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, Bell, Menu } from 'lucide-react';

const DashboardLayout = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
            <div className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-darkMuted dark:hover:bg-slate-800 transition-colors cursor-pointer">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand-red animate-pulse" />
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
