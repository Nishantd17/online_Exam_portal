import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  HelpCircle,
  FileText,
  Settings,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const adminMenu = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'Students', path: '/admin/students', icon: <Users size={20} /> },
    { label: 'Exams', path: '/admin/exams', icon: <BookOpen size={20} /> },
    { label: 'Questions', path: '/admin/questions', icon: <HelpCircle size={20} /> },
    { label: 'Results', path: '/admin/results', icon: <FileText size={20} /> },
    { label: 'Settings', path: '/admin/settings', icon: <Settings size={20} /> }
  ];

  const studentMenu = [
    { label: 'Dashboard', path: '/student/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'My Exams', path: '/student/exams', icon: <BookOpen size={20} /> },
    { label: 'Results', path: '/student/results', icon: <FileText size={20} /> },
    { label: 'Profile', path: '/student/profile', icon: <User size={20} /> }
  ];

  const menuItems = user?.role === 'admin' ? adminMenu : studentMenu;

  return (
    <div
      className={`h-screen flex flex-col bg-white border-r border-slate-200 dark:bg-darkSurface dark:border-slate-800 transition-all duration-300 relative z-30 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-slate-800">
        <Link to="/" className="flex items-center gap-3">
          <div className="h-9 w-9 min-w-9 rounded-lg bg-gradient-to-tr from-brand-blue to-brand-violet flex items-center justify-center text-white shadow-md shadow-brand-blue/20">
            <GraduationCap size={20} />
          </div>
          {!collapsed && (
            <span className="font-bold text-base bg-gradient-to-r from-slate-900 to-slate-750 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
              ExamPortal
            </span>
          )}
        </Link>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {menuItems.map((item, idx) => (
          <NavLink
            key={idx}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-brand-blue/10 text-brand-blue dark:bg-brand-blueDark/20 dark:text-brand-blueLight border-l-4 border-brand-blue dark:border-brand-blueLight'
                  : 'text-slate-600 dark:text-darkMuted hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-darkText'
              }`
            }
          >
            <span className="transition-transform group-hover:scale-105">{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Active User Footer Section */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
        {!collapsed && user && (
          <div className="flex items-center gap-3 p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/40">
            <div className="h-9 w-9 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue font-bold text-sm uppercase dark:bg-brand-blue/20 dark:text-brand-blueLight">
              {user.fullName.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-800 dark:text-darkText truncate">{user.fullName}</p>
              <p className="text-[10px] text-slate-400 dark:text-darkMuted truncate">{user.email}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-3.5 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-brand-red hover:bg-red-50 dark:hover:bg-red-950/20 transition-all group"
        >
          <span className="transition-transform group-hover:translate-x-0.5"><LogOut size={20} /></span>
          {!collapsed && <span>Log Out</span>}
        </button>
      </div>

      {/* Collapse Toggle trigger */}
      <button
        onClick={() => setCollapsed((prev) => !prev)}
        className="absolute -right-3 top-20 h-6 w-6 rounded-full bg-white dark:bg-darkSurface border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-darkText shadow-sm z-40"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </div>
  );
};

export default Sidebar;
