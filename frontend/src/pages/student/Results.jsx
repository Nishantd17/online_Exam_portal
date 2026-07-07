import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Eye, Calendar, Award, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Card3D from '../../components/ui/Card3D';
import HudPanel from '../../components/ui/HudPanel';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import toast from 'react-hot-toast';

const StudentResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Aggregate stats states
  const [summary, setSummary] = useState({ totalAttempts: 0, passRate: 0, avgPercentage: 0 });

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const response = await api.get('/results/student');
      const data = response.data.data;
      setResults(data);

      // Compile aggregates
      if (data.length > 0) {
        const publishedData = data.filter((r) => r.status === 'Published');
        if (publishedData.length > 0) {
          const total = publishedData.length;
          const passed = publishedData.filter((r) => r.passed).length;
          const avg = Math.round(publishedData.reduce((sum, r) => sum + r.percentage, 0) / total);
          
          setSummary({
            totalAttempts: data.length,
            passRate: Math.round((passed / total) * 100),
            avgPercentage: avg
          });
        } else {
          setSummary({ totalAttempts: data.length, passRate: 0, avgPercentage: 0 });
        }
      } else {
        setSummary({ totalAttempts: 0, passRate: 0, avgPercentage: 0 });
      }
    } catch (err) {
      toast.error('Failed to load your assessment results.');
    } finally {
      setLoading(false);
    }
  };

  const tableHeaders = [
    { key: 'exam', label: 'Exam Title' },
    { key: 'category', label: 'Category' },
    { key: 'date', label: 'Completion Date' },
    { key: 'score', label: 'Marks' },
    { key: 'pct', label: 'Percentage' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: 'Actions' }
  ];

  const filteredResults = results.filter((res) => {
    if (!search) return true;
    return (
      res.exam?.title.toLowerCase().includes(search.toLowerCase()) ||
      res.exam?.category.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">My Results & Reports</h1>
          <p className="text-xs text-slate-400">Browse completed exam papers, performance metrics, and graded score sheets.</p>
        </div>
      </motion.div>

      {/* Stats summaries row — Card3D with neon glow */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: 'Exams Attempted', value: summary.totalAttempts, icon: Clock,       color: '#00f0ff' },
          { label: 'Pass Rate',       value: `${summary.passRate}%`,  icon: CheckCircle, color: '#10b981' },
          { label: 'Average Score',   value: `${summary.avgPercentage}%`, icon: Award, color: '#8b5cf6' },
        ].map(({ label, value, icon: Icon, color }, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 25, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: i * 0.1, type: 'spring' }}>
            <Card3D intensity={12}>
              <div className="p-5 rounded-xl relative overflow-hidden" style={{ background: 'rgba(8,12,30,0.9)', border: `1px solid ${color}25`, boxShadow: `0 0 20px ${color}10` }}>
                <div className="absolute inset-0 holographic rounded-xl pointer-events-none opacity-30" />
                <div className="relative flex justify-between items-center z-10">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(148,163,184,0.7)' }}>{label}</p>
                    <p className="text-2xl font-black" style={{ color, fontFamily: 'Space Grotesk, sans-serif' }}>{value}</p>
                  </div>
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: `${color}15`, color, boxShadow: `0 0 12px ${color}25` }}>
                    <Icon size={16} />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 h-[2px] w-full animate-gradient" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
              </div>
            </Card3D>
          </motion.div>
        ))}
      </div>

      {/* Search — HUD Panel */}
      <HudPanel color="cyan">
        <div className="p-3 flex items-center gap-3">
          <Search size={14} style={{ color: '#00f0ff' }} />
          <input
            type="text"
            placeholder="Search exam title or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-xs text-white placeholder:text-slate-600 focus:outline-none"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          />
          {search && <button onClick={() => setSearch('')} className="text-slate-500 hover:text-slate-300 text-xs">✕</button>}
        </div>
      </HudPanel>

      {/* Roster reports table */}
      <Table
        headers={tableHeaders}
        data={filteredResults}
        loading={loading}
        emptyMessage="You have not completed any examinations yet."
        renderRow={(res) => {
          return (
            <>
              <td className="px-6 py-4 font-semibold text-slate-900 dark:text-darkText max-w-xs truncate">{res.exam?.title || 'Exam Paper'}</td>
              <td className="px-6 py-4">
                <Badge variant="info">{res.exam?.category || 'General'}</Badge>
              </td>
              <td className="px-6 py-4 text-xs text-slate-500 dark:text-darkMuted">
                <div className="flex items-center gap-1.5">
                  <Calendar size={12} />
                  {new Date(res.createdAt).toLocaleDateString()}
                </div>
              </td>
              <td className="px-6 py-4 font-bold text-slate-800 dark:text-darkText">
                {res.status === 'Published' ? `${res.obtainedMarks} / ${res.totalMarks}` : '—'}
              </td>
              <td className="px-6 py-4 font-semibold text-slate-800 dark:text-darkText">
                {res.status === 'Published' ? `${res.percentage}%` : '—'}
              </td>
              <td className="px-6 py-4">
                {res.status === 'Published' ? (
                  <Badge variant={res.passed ? 'success' : 'danger'}>
                    {res.passed ? 'Passed' : 'Failed'}
                  </Badge>
                ) : res.status === 'Rejected' ? (
                  <Badge variant="danger">Rejected</Badge>
                ) : (
                  <Badge variant="warning">Pending Review</Badge>
                )}
              </td>
              <td className="px-6 py-4">
                <Link to={`/student/results/${res._id}`}>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Eye size={14} /> Report
                  </Button>
                </Link>
              </td>
            </>
          );
        }}
      />
    </div>
  );
};

export default StudentResults;
