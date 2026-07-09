import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, BookOpen, HelpCircle, FileText, Settings,
  User, LogOut, ChevronLeft, ChevronRight, GraduationCap, ClipboardList, Zap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const adminMenu = [
    { label: 'Dashboard',       path: '/admin/dashboard',        icon: LayoutDashboard, color: '#00f0ff' },
    { label: 'Users (Students)', path: '/admin/students',         icon: Users,            color: '#8b5cf6' },
    { label: 'Exams',           path: '/admin/exams',            icon: BookOpen,         color: '#06b6d4' },
    { label: 'Questions',       path: '/admin/questions',        icon: HelpCircle,       color: '#3b82f6' },
    { label: 'Pending Reviews', path: '/admin/pending-reviews',  icon: ClipboardList,    color: '#f59e0b' },
    { label: 'Results',         path: '/admin/results',          icon: FileText,         color: '#10b981' },
    { label: 'Settings',        path: '/admin/settings',         icon: Settings,         color: '#94a3b8' },
  ];

  const studentMenu = [
    { label: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard, color: '#00f0ff' },
    { label: 'My Exams',  path: '/student/exams',     icon: BookOpen,        color: '#8b5cf6' },
    { label: 'Results',   path: '/student/results',   icon: FileText,        color: '#10b981' },
    { label: 'Profile',   path: '/student/profile',   icon: User,            color: '#ec4899' },
  ];

  const menuItems = (user?.role === 'admin' || user?.role === 'super_admin') ? adminMenu : studentMenu;

  return (
    <motion.div
      animate={{ width: collapsed ? 80 : 256 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={`h-screen flex flex-col z-40 flex-shrink-0 transition-transform duration-300 md:translate-x-0 md:static fixed inset-y-0 left-0 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
      style={{
        background: 'linear-gradient(180deg, #050814 0%, #0a0e27 40%, #0d0a1e 100%)',
        borderRight: '1px solid rgba(0,240,255,0.12)',
        boxShadow: '4px 0 30px rgba(0,0,0,0.4), inset -1px 0 0 rgba(0,240,255,0.06)',
      }}
    >
      {/* Sidebar aurora glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(139,92,246,0.06) 0%, transparent 70%)',
        }}
      />

      {/* Brand Header */}
      <div
        className="h-16 flex items-center px-4 flex-shrink-0 relative"
        style={{ borderBottom: '1px solid rgba(0,240,255,0.1)' }}
      >
        <Link to="/" onClick={() => setMobileOpen && setMobileOpen(false)} className="flex items-center gap-3 overflow-hidden">
          <motion.div
            whileHover={{ rotate: [0, -10, 10, -5, 0] }}
            transition={{ duration: 0.5 }}
            className="h-9 w-9 min-w-[36px] rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(0,240,255,0.2), rgba(139,92,246,0.2))',
              border: '1px solid rgba(0,240,255,0.3)',
              boxShadow: '0 0 15px rgba(0,240,255,0.2)',
            }}
          >
            <GraduationCap size={20} style={{ color: '#00f0ff' }} />
          </motion.div>

          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-bold text-base whitespace-nowrap"
                style={{
                  background: 'linear-gradient(90deg, #00f0ff, #8b5cf6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                ExamPortal
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto overflow-x-hidden">
        {menuItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={idx}
              to={item.path}
              onClick={() => setMobileOpen && setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden ${
                  isActive ? '' : 'hover:bg-white/[0.04]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active neon background */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-xl"
                      style={{
                        background: `linear-gradient(135deg, ${item.color}18, ${item.color}08)`,
                        border: `1px solid ${item.color}30`,
                        boxShadow: `inset 0 0 15px ${item.color}08`,
                      }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}

                  {/* Left accent bar on active */}
                  {isActive && (
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full"
                      style={{ background: item.color, boxShadow: `0 0 8px ${item.color}` }}
                    />
                  )}

                  {/* Icon */}
                  <motion.span
                    whileHover={{ scale: 1.1 }}
                    className="flex-shrink-0 relative z-10"
                    style={{ color: isActive ? item.color : 'rgba(148,163,184,0.7)' }}
                  >
                    <Icon size={18} />
                  </motion.span>

                  {/* Label */}
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        className="whitespace-nowrap relative z-10 text-xs font-semibold"
                        style={{ color: isActive ? item.color : 'rgba(148,163,184,0.8)' }}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Active neon dot on collapsed */}
                  {isActive && collapsed && (
                    <div
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full"
                      style={{ background: item.color, boxShadow: `0 0 6px ${item.color}` }}
                    />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer */}
      <div
        className="p-3 flex-shrink-0 space-y-2"
        style={{ borderTop: '1px solid rgba(0,240,255,0.08)' }}
      >
        {/* User chip */}
        <AnimatePresence>
          {!collapsed && user && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-3 p-2.5 rounded-xl overflow-hidden"
              style={{
                background: 'rgba(0,240,255,0.04)',
                border: '1px solid rgba(0,240,255,0.1)',
              }}
            >
              <div
                className="h-8 w-8 min-w-[32px] rounded-lg flex items-center justify-center font-bold text-sm uppercase"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,240,255,0.2), rgba(139,92,246,0.2))',
                  color: '#00f0ff',
                  border: '1px solid rgba(0,240,255,0.2)',
                }}
              >
                {user.fullName.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white truncate">{user.fullName}</p>
                <p className="text-[10px] text-slate-500 truncate font-mono">{user.email}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Logout */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{
            color: 'rgba(239,68,68,0.8)',
            background: 'rgba(239,68,68,0.04)',
            border: '1px solid rgba(239,68,68,0.1)',
          }}
        >
          <LogOut size={16} />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs font-semibold">
                Log Out
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Collapse Toggle */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setCollapsed((prev) => !prev)}
        className="absolute -right-3.5 top-[72px] h-7 w-7 rounded-full hidden md:flex items-center justify-center z-50"
        style={{
          background: 'linear-gradient(135deg, #0a0e27, #1b1437)',
          border: '1px solid rgba(0,240,255,0.3)',
          boxShadow: '0 0 10px rgba(0,240,255,0.15)',
          color: '#00f0ff',
        }}
      >
        {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </motion.button>
    </motion.div>
  );
};

export default Sidebar;
