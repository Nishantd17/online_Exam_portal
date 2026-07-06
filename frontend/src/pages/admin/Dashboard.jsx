import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, BookOpen, FileText, CheckCircle2, TrendingUp, ArrowUpRight, HelpCircle, Activity, Plus, ShieldAlert } from 'lucide-react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [exams, setExams] = useState([]);

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

  // Completion mock statistics chart
  const completionsData = [
    { name: 'Mon', Attempted: 120, Completed: 110 },
    { name: 'Tue', Attempted: 240, Completed: 210 },
    { name: 'Wed', Attempted: 310, Completed: 290 },
    { name: 'Thu', Attempted: 180, Completed: 175 },
    { name: 'Fri', Attempted: 420, Completed: 380 },
    { name: 'Sat', Attempted: 90, Completed: 85 },
    { name: 'Sun', Attempted: 50, Completed: 48 }
  ];

  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <Skeleton width="w-48" height="h-8" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Skeleton variant="rect" height="h-28" />
          <Skeleton variant="rect" height="h-28" />
        </div>
        <Skeleton variant="rect" height="h-[300px]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Greet wave header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            Admin Management Portal 🛡️
          </h1>
          <p className="text-xs text-slate-450 dark:text-darkMuted">Audit statistics, dynamic question banks, and student cohorts.</p>
        </div>

        <div className="flex gap-3">
          <Link to="/admin/exams">
            <Button size="sm" className="flex items-center gap-1.5">
              <Plus size={16} /> New Exam
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid of counter cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <Card variant="gradient">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-darkMuted uppercase tracking-wider">Total Students</p>
              <p className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1.5">{stats.totalStudents}</p>
            </div>
            <div className="h-8 w-8 rounded-lg bg-brand-blue/10 flex items-center justify-center text-brand-blue"><Users size={16} /></div>
          </div>
        </Card>

        <Card variant="gradient">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-darkMuted uppercase tracking-wider">Active Examinations</p>
              <p className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1.5">{stats.totalExams}</p>
            </div>
            <div className="h-8 w-8 rounded-lg bg-brand-violet/10 flex items-center justify-center text-brand-violet"><BookOpen size={16} /></div>
          </div>
        </Card>

        <Card variant="gradient">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-darkMuted uppercase tracking-wider">Passing Average</p>
              <p className="text-3xl font-extrabold text-brand-emerald mt-1.5">{stats.averageScore}%</p>
            </div>
            <div className="h-8 w-8 rounded-lg bg-brand-emerald/10 flex items-center justify-center text-brand-emerald"><TrendingUp size={16} /></div>
          </div>
        </Card>

        <Card variant="gradient">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-darkMuted uppercase tracking-wider">Pass Rate</p>
              <p className="text-3xl font-extrabold text-brand-amber mt-1.5">{stats.passRate}%</p>
            </div>
            <div className="h-8 w-8 rounded-lg bg-brand-amber/10 flex items-center justify-center text-brand-amber"><CheckCircle2 size={16} /></div>
          </div>
        </Card>
      </div>

      {/* Row charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Weekly attempted completions chart */}
        <Card className="lg:col-span-8 space-y-4">
          <h3 className="text-sm font-bold text-slate-850 dark:text-white">Exam completions (Attempted VS Completed)</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={completionsData}>
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: '#1E293B',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#FFF',
                    fontSize: '10px'
                  }}
                />
                <Legend iconSize={10} fontSize={10} />
                <Bar dataKey="Attempted" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={15} />
                <Bar dataKey="Completed" fill="#10B981" radius={[4, 4, 0, 0]} barSize={15} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Grade cohorts distribution donuts */}
        <Card className="lg:col-span-4 space-y-4">
          <h3 className="text-sm font-bold text-slate-850 dark:text-white">Student cohort efficiency</h3>
          <div className="h-[240px] flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.performanceDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.performanceDistribution.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="absolute text-center">
              <p className="text-xl font-black text-slate-800 dark:text-white">{stats.totalStudents}</p>
              <p className="text-[9px] uppercase tracking-wider text-slate-400 dark:text-darkMuted font-bold">Candidates</p>
            </div>
          </div>

          {/* Donut Legend */}
          <div className="grid grid-cols-2 gap-y-2 text-[10px] text-slate-450 dark:text-darkMuted font-semibold">
            {stats.performanceDistribution.map((d, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                <span>{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Activities Feed and Compact Exam listing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Compact Upcoming Table list */}
        <div className="lg:col-span-8 space-y-4">
          <h3 className="text-sm font-bold text-slate-850 dark:text-white">Active Examinations</h3>
          <Card className="p-0 overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-slate-805">
              {exams.slice(0, 4).map((ex) => (
                <div key={ex._id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/15">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-850 dark:text-white">{ex.title}</p>
                    <p className="text-[10px] text-slate-450 dark:text-darkMuted">Category: {ex.category} • Marks: {ex.totalMarks}</p>
                  </div>
                  <Badge variant={ex.status === 'published' ? 'info' : (ex.status === 'draft' ? 'neutral' : 'success')}>
                    {ex.status}
                  </Badge>
                </div>
              ))}
              {exams.length === 0 && (
                <div className="py-12 text-center text-xs text-slate-400 dark:text-darkMuted">
                  📭 No examinations created. Start by creating one.
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Recent logs timeline */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="text-sm font-bold text-slate-850 dark:text-white">Recent Activities</h3>
          <Card className="p-5 overflow-hidden">
            <div className="relative border-l border-slate-100 dark:border-slate-800 pl-4 space-y-5 text-xs">
              {stats.activities?.map((act, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-brand-blue border border-white dark:border-darkSurface" />
                  <p className="text-slate-700 dark:text-darkText font-medium">{act.text}</p>
                  <span className="text-[9px] text-slate-400 dark:text-darkMuted block mt-0.5">
                    {new Date(act.time).toLocaleTimeString()}
                  </span>
                </div>
              ))}
              {(!stats.activities || stats.activities.length === 0) && (
                <div className="text-center text-xs text-slate-400 dark:text-darkMuted py-8">
                  No recent activities recorded.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
