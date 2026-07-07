import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Calendar, Clock, Award, Star, CheckCircle, AlertTriangle, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../context/AuthContext';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ upcoming: [], active: [], completed: [] });
  const [results, setResults] = useState([]);
  const [stats, setStats] = useState({ upcomingCount: 0, completedCount: 0, avgScore: 0, rank: 'N/A' });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const examResponse = await api.get('/exams/student');
        setData(examResponse.data.data);

        const resultResponse = await api.get('/results/student');
        const studentResults = resultResponse.data.data;
        setResults(studentResults);

        // Calculate statistics
        const completedExams = examResponse.data.data.completed || [];
        const activeExams = examResponse.data.data.active || [];
        const upcomingExams = examResponse.data.data.upcoming || [];

        const validScores = studentResults.map(r => r.percentage);
        const avgScore = validScores.length
          ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
          : 0;

        setStats({
          upcomingCount: upcomingExams.length,
          completedCount: completedExams.length,
          avgScore,
          rank: studentResults.length ? '12th' : 'N/A' // Simulating rank metric
        });
      } catch (err) {
        console.error('Dashboard loading failure', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const chartData = results
    .slice(0, 5)
    .reverse()
    .map((r) => ({
      name: r.exam?.title.substring(0, 10) || 'Exam',
      score: r.percentage
    }));

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton width="w-64" height="h-8" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Skeleton variant="rect" height="h-28" />
          <Skeleton variant="rect" height="h-28" />
          <Skeleton variant="rect" height="h-28" />
          <Skeleton variant="rect" height="h-28" />
        </div>
        <Skeleton variant="rect" height="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Greet wave banner */}
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          Welcome back, {user?.fullName || 'Student'}! <span className="animate-bounce">👋</span>
        </h1>
        <p className="text-sm text-slate-450 dark:text-darkMuted">
          Classroom: <span className="font-semibold text-brand-blue dark:text-brand-blueLight">{user?.organizationId?.name || 'Loading organization...'}</span> • Here is your active dashboard.
        </p>
      </div>

      {/* Grid of counters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <Card variant="gradient" className="antigravity-float">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-darkMuted uppercase tracking-wider">Upcoming Exams</p>
              <p className="text-3xl font-extrabold text-brand-blue mt-1.5">{stats.upcomingCount}</p>
            </div>
            <div className="h-8 w-8 rounded-lg bg-brand-blue/10 flex items-center justify-center text-brand-blue"><Calendar size={16} /></div>
          </div>
        </Card>

        <Card variant="gradient" className="antigravity-float-delayed">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-darkMuted uppercase tracking-wider">Completed Exams</p>
              <p className="text-3xl font-extrabold text-brand-emerald mt-1.5">{stats.completedCount}</p>
            </div>
            <div className="h-8 w-8 rounded-lg bg-brand-emerald/10 flex items-center justify-center text-brand-emerald"><CheckCircle size={16} /></div>
          </div>
        </Card>

        <Card variant="gradient" className="antigravity-float">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-darkMuted uppercase tracking-wider">Average Score</p>
              <p className="text-3xl font-extrabold text-brand-violet mt-1.5">{stats.avgScore}%</p>
            </div>
            <div className="h-8 w-8 rounded-lg bg-brand-violet/10 flex items-center justify-center text-brand-violet"><Award size={16} /></div>
          </div>
        </Card>

        <Card variant="gradient" className="antigravity-float-delayed">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-darkMuted uppercase tracking-wider">Cohort Rank</p>
              <p className="text-3xl font-extrabold text-brand-amber mt-1.5">{stats.rank}</p>
            </div>
            <div className="h-8 w-8 rounded-lg bg-brand-amber/10 flex items-center justify-center text-brand-amber"><Star size={16} /></div>
          </div>
        </Card>
      </div>

      {/* Active Exams Alerts */}
      {data.active.length > 0 && (
        <div className="bg-gradient-to-r from-brand-blue/10 to-brand-violet/10 border border-brand-blue/20 dark:from-brand-blue/10 dark:to-brand-violet/20 dark:border-brand-blue/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="flex gap-4 items-center">
            <div className="h-10 w-10 min-w-10 rounded-full bg-brand-blue flex items-center justify-center text-white text-lg">💡</div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Active Examination Window Open</h4>
              <p className="text-xs text-slate-500 dark:text-darkMuted">You have {data.active.length} exam paper(s) ready to start. Click the button to launch security checks.</p>
            </div>
          </div>
          <Link to={`/student/exams`}>
            <Button size="sm">Go to Exams</Button>
          </Link>
        </div>
      )}

      {/* Upcoming Exams Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column: Upcoming list */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Upcoming Examinations</h3>
            <Link to="/student/exams" className="text-xs text-brand-blue font-bold hover:underline flex items-center gap-0.5">
              View all <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.upcoming.length > 0 ? (
              data.upcoming.map(({ exam }) => (
                <Card key={exam._id} hoverLift className="flex flex-col justify-between gap-4">
                  <div className="space-y-2">
                    <Badge variant="info">{exam.category}</Badge>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white leading-snug">{exam.title}</h4>
                    <p className="text-[11px] text-slate-400 dark:text-darkMuted truncate">{exam.description || 'No description provided.'}</p>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-slate-450 dark:text-darkMuted border-t border-slate-100 dark:border-slate-800 pt-3">
                    <span className="flex items-center gap-1"><Clock size={12} /> {exam.duration} mins</span>
                    <span className="flex items-center gap-1">Marks: {exam.totalMarks}</span>
                  </div>
                </Card>
              ))
            ) : (
              <div className="col-span-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl py-12 text-center text-xs text-slate-400 dark:text-darkMuted">
                📭 No upcoming exams scheduled at this time.
              </div>
            )}
          </div>
        </div>

        {/* Right column: Performance Trends Chart */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Performance Trend</h3>
          <Card className="h-[240px] flex items-center justify-center p-4">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={10} domain={[0, 100]} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: '#1E293B',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#FFF',
                      fontSize: '10px'
                    }}
                  />
                  <Line type="monotone" dataKey="score" stroke="#3B82F6" strokeWidth={2} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-slate-400 dark:text-darkMuted text-center p-6">
                Complete exams to populate performance charts.
              </span>
            )}
          </Card>
        </div>
      </div>

      {/* Recent submissions list */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Submissions</h3>
        <Card className="p-0 overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {results.slice(0, 3).map((res) => (
              <div key={res._id} className="p-5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white">{res.exam?.title}</h4>
                  <p className="text-[10px] text-slate-400 dark:text-darkMuted">Submitted on {new Date(res.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-800 dark:text-white">Score: {res.obtainedMarks}/{res.totalMarks}</p>
                    <p className="text-[10px] text-slate-400 dark:text-darkMuted">Percentage: {res.percentage}%</p>
                  </div>
                  <Badge variant={res.passed ? 'success' : 'danger'}>
                    {res.passed ? 'Passed' : 'Failed'}
                  </Badge>
                  <Link to={`/student/results/${res._id}`}>
                    <Button variant="outline" size="sm">Report</Button>
                  </Link>
                </div>
              </div>
            ))}
            {results.length === 0 && (
              <div className="py-10 text-center text-xs text-slate-400 dark:text-darkMuted">
                📭 No completed exam reports found.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;
