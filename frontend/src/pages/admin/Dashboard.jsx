import React, { useEffect, useState, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Users, BookOpen, FileText, CheckCircle2, TrendingUp, Plus, Activity, ClipboardList, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Card3D from '../../components/ui/Card3D';
import HudPanel from '../../components/ui/HudPanel';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import ErrorBoundary from '../../components/ui/ErrorBoundary';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Globe3D = lazy(() => import('../../components/effects/Globe3D'));

const GlobeFallback = () => (
  <div className="flex flex-col items-center justify-center h-full text-center p-4">
    <div className="animate-spin-slow h-16 w-16 rounded-full border border-dashed border-cyan-500/30 flex items-center justify-center mb-3">
      <Globe size={24} className="text-cyan-400 animate-pulse" />
    </div>
    <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Analytics Monitor</span>
  </div>
);

// Animated counter hook
const useAnimatedCounter = (target, duration = 1500) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { setValue(target); clearInterval(timer); }
      else setValue(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return value;
};

const StatCard = ({ label, value, icon: Icon, color, suffix = '', delay = 0 }) => {
  const animatedVal = useAnimatedCounter(typeof value === 'number' ? value : 0);
  const colorMap = {
    cyan:    { bg: 'rgba(0,240,255,0.1)',     text: '#00f0ff',   border: 'rgba(0,240,255,0.25)',   glow: 'rgba(0,240,255,0.2)' },
    violet:  { bg: 'rgba(139,92,246,0.1)',    text: '#8b5cf6',   border: 'rgba(139,92,246,0.25)',  glow: 'rgba(139,92,246,0.2)' },
    emerald: { bg: 'rgba(16,185,129,0.1)',    text: '#10b981',   border: 'rgba(16,185,129,0.25)',  glow: 'rgba(16,185,129,0.2)' },
    amber:   { bg: 'rgba(245,158,11,0.1)',    text: '#f59e0b',   border: 'rgba(245,158,11,0.25)',  glow: 'rgba(245,158,11,0.2)' },
  };
  const c = colorMap[color] || colorMap.cyan;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5, type: 'spring', stiffness: 120 }}
    >
      <Card3D intensity={12}>
        <div
          className="p-5 rounded-xl relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(10,14,39,0.9) 0%, rgba(15,20,50,0.8) 100%)',
            border: `1px solid ${c.border}`,
            boxShadow: `0 0 25px ${c.glow}, inset 0 0 20px rgba(0,0,0,0.3)`,
          }}
        >
          {/* Holographic shimmer */}
          <div className="absolute inset-0 holographic rounded-xl pointer-events-none" />

          <div className="relative flex justify-between items-start z-10">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(148,163,184,0.8)' }}>
                {label}
              </p>
              <p className="text-3xl font-black" style={{ color: c.text, fontFamily: 'Space Grotesk, sans-serif' }}>
                {animatedVal}{suffix}
              </p>
            </div>
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ background: c.bg, color: c.text, boxShadow: `0 0 15px ${c.glow}` }}
            >
              <Icon size={18} />
            </div>
          </div>

          {/* Animated neon bottom line */}
          <div
            className="absolute bottom-0 left-0 h-[2px] w-full animate-gradient"
            style={{ background: `linear-gradient(90deg, transparent, ${c.text}, transparent)` }}
          />
        </div>
      </Card3D>
    </motion.div>
  );
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [exams, setExams] = useState([]);
  const [showGlobe, setShowGlobe] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setShowGlobe(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const statsResponse = await api.get('/results/admin/dashboard-stats');
        setStats(statsResponse.data.data);
        const examsResponse = await api.get('/exams');
        setExams(examsResponse.data.data || []);
      } catch (err) {
        console.error('Failed loading admin dashboard stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminStats();
  }, []);

  const completionsData = [
    { name: 'Mon', Attempted: 120, Completed: 110 },
    { name: 'Tue', Attempted: 240, Completed: 210 },
    { name: 'Wed', Attempted: 310, Completed: 290 },
    { name: 'Thu', Attempted: 180, Completed: 175 },
    { name: 'Fri', Attempted: 420, Completed: 380 },
    { name: 'Sat', Attempted: 90,  Completed: 85 },
    { name: 'Sun', Attempted: 50,  Completed: 48 }
  ];

  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <Skeleton width="w-48" height="h-8" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} variant="rect" height="h-28" />)}
        </div>
        <Skeleton variant="rect" height="h-[300px]" />
      </div>
    );
  }

  const neonTooltipStyle = {
    background: 'rgba(5,8,20,0.95)',
    border: '1px solid rgba(0,240,255,0.3)',
    borderRadius: '10px',
    color: '#e2e8f0',
    fontSize: '11px',
    boxShadow: '0 0 20px rgba(0,240,255,0.15)',
  };

  return (
    <div className="space-y-8">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <span className="hud-glitch">{user?.organizationId?.name || 'Admin Portal'}</span>
            <span className="text-base">🛡️</span>
          </h1>
          <p className="text-xs text-slate-400">
            Org ID: <span className="font-bold text-cyan-400 font-mono">{user?.organizationId?.orgId || 'N/A'}</span>
            {' '}• Audit stats, exams and students.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {user?.organizationId?.joinCode && (
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { navigator.clipboard.writeText(user.organizationId.joinCode); toast.success('Join Code copied!'); }}
              className="px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer"
              style={{
                background: 'rgba(0,240,255,0.06)',
                border: '1px solid rgba(0,240,255,0.3)',
                boxShadow: '0 0 15px rgba(0,240,255,0.1)',
              }}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">Join Code:</span>
              <span className="text-sm font-extrabold font-mono text-cyan-400 neon-cyan">{user.organizationId.joinCode}</span>
            </motion.div>
          )}
          <Link to="/admin/exams">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 text-white"
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                boxShadow: '0 0 20px rgba(139,92,246,0.4)',
              }}
            >
              <Plus size={15} /> New Exam
            </motion.button>
          </Link>
        </div>
      </motion.div>

      {/* ── Stat Cards (Card3D + aurora) ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <StatCard label="Total Students"    value={stats.totalStudents} icon={Users}       color="cyan"    delay={0} />
        <StatCard label="Active Exams"      value={stats.totalExams}    icon={BookOpen}     color="violet"  delay={0.1} />
        <StatCard label="Passing Average"   value={stats.averageScore}  icon={TrendingUp}   color="emerald" suffix="%" delay={0.2} />
        <StatCard label="Pass Rate"         value={stats.passRate}      icon={CheckCircle2} color="amber"   suffix="%" delay={0.3} />
      </div>

      {/* ── Charts Row + Globe ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Neon Area Chart */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="lg:col-span-7"
        >
          <HudPanel title="Exam Completions — Weekly Overview" color="cyan">
            <div className="p-4 h-[280px] chart-neon-cyan">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={completionsData}>
                  <defs>
                    <linearGradient id="gradAttempted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#00f0ff" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00f0ff" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" stroke="rgba(148,163,184,0.5)" fontSize={10} tickLine={false} />
                  <YAxis stroke="rgba(148,163,184,0.5)" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={neonTooltipStyle} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: '10px', color: '#94a3b8' }} />
                  <Area type="monotone" dataKey="Attempted" stroke="#00f0ff" strokeWidth={2} fill="url(#gradAttempted)" dot={{ fill: '#00f0ff', r: 3 }} />
                  <Area type="monotone" dataKey="Completed" stroke="#10b981" strokeWidth={2} fill="url(#gradCompleted)" dot={{ fill: '#10b981', r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </HudPanel>
        </motion.div>

        {/* 3D Globe */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.7, type: 'spring' }}
          className="lg:col-span-5"
        >
          <HudPanel title="Live Analytics Globe" color="violet" className="h-full" style={{ minHeight: 280 }}>
            <div className="h-[250px] w-full">
              <ErrorBoundary fallback={<GlobeFallback />}>
                <Suspense fallback={
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin-slow h-12 w-12 rounded-full" style={{ border: '2px solid rgba(0,240,255,0.2)', borderTop: '2px solid #00f0ff' }} />
                  </div>
                }>
                  {showGlobe ? <Globe3D /> : <GlobeFallback />}
                </Suspense>
              </ErrorBoundary>
            </div>
          </HudPanel>
        </motion.div>
      </div>

      {/* ── Donut + Activities ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Neon Donut Chart */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="lg:col-span-4"
        >
          <HudPanel title="Cohort Distribution" color="violet">
            <div className="p-4">
              <div className="h-[200px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.performanceDistribution}
                      cx="50%" cy="50%"
                      innerRadius={55} outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {stats.performanceDistribution.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={neonTooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-2xl font-black text-white">{stats.totalStudents}</p>
                  <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Students</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-y-2 mt-2">
                {stats.performanceDistribution.map((d, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold">
                    <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: d.color, boxShadow: `0 0 6px ${d.color}` }} />
                    <span>{d.name}: {d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </HudPanel>
        </motion.div>

        {/* Active Exams list */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="lg:col-span-5"
        >
          <HudPanel title="Active Examinations" color="emerald">
            <div className="divide-y" style={{ borderColor: 'rgba(0,240,255,0.08)' }}>
              {exams.slice(0, 5).map((ex, i) => (
                <motion.div
                  key={ex._id}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.08 }}
                  className="p-3 flex items-center justify-between hover:bg-white/[0.03] transition-colors"
                >
                  <div>
                    <p className="text-xs font-bold text-white">{ex.title}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{ex.category} • {ex.totalMarks} marks</p>
                  </div>
                  <Badge variant={ex.status === 'published' ? 'info' : 'neutral'}>{ex.status}</Badge>
                </motion.div>
              ))}
              {exams.length === 0 && (
                <div className="py-10 text-center text-xs text-slate-500">No exams created yet.</div>
              )}
            </div>
          </HudPanel>
        </motion.div>

        {/* Activity Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="lg:col-span-3"
        >
          <HudPanel title="Recent Activity" color="cyan">
            <div className="p-4 relative pl-6 space-y-4 text-xs" style={{ borderLeft: '1px solid rgba(0,240,255,0.2)' }}>
              {stats.activities?.slice(0, 6).map((act, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + idx * 0.07 }}
                  className="relative"
                >
                  <div
                    className="absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full animate-ping-slow"
                    style={{ background: '#00f0ff', boxShadow: '0 0 8px #00f0ff' }}
                  />
                  <p className="text-slate-300 font-medium leading-snug">{act.text}</p>
                  <span className="text-[9px] text-slate-500 font-mono">{new Date(act.time).toLocaleTimeString()}</span>
                </motion.div>
              ))}
              {(!stats.activities || stats.activities.length === 0) && (
                <div className="text-center text-slate-500 py-6">No recent activities.</div>
              )}
            </div>
          </HudPanel>
        </motion.div>
      </div>

      {/* ── Quick Actions ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: 'All Students',    icon: Users,         path: '/admin/students',        color: '#00f0ff' },
          { label: 'Manage Exams',    icon: BookOpen,      path: '/admin/exams',           color: '#8b5cf6' },
          { label: 'Pending Reviews', icon: ClipboardList, path: '/admin/pending-reviews', color: '#f59e0b' },
          { label: 'View Results',    icon: FileText,      path: '/admin/results',         color: '#10b981' },
        ].map(({ label, icon: Icon, path, color }) => (
          <Link to={path} key={path}>
            <Card3D intensity={10}>
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                className="p-4 rounded-xl flex flex-col items-center gap-3 text-center cursor-pointer"
                style={{
                  background: 'rgba(10,14,39,0.8)',
                  border: `1px solid ${color}30`,
                  boxShadow: `0 0 15px ${color}15`,
                }}
              >
                <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: `${color}18`, color, boxShadow: `0 0 12px ${color}30` }}>
                  <Icon size={18} />
                </div>
                <span className="text-xs font-bold text-slate-300">{label}</span>
              </motion.div>
            </Card3D>
          </Link>
        ))}
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
