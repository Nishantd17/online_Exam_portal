import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Eye, Clock, ShieldCheck, Activity, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import Card3D from '../../components/ui/Card3D';
import HudPanel from '../../components/ui/HudPanel';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

const PendingResults = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPendingSubmissions();
  }, []);

  const fetchPendingSubmissions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/results/admin/pending');
      setSubmissions(response.data.data || []);
    } catch (err) {
      toast.error('Failed to load pending submissions.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = submissions.filter((sub) => {
    if (!search) return true;
    return (
      sub.student?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      sub.student?.email?.toLowerCase().includes(search.toLowerCase()) ||
      sub.exam?.title?.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
              Pending Reviews
              <ShieldCheck size={22} style={{ color: '#8b5cf6' }} className="antigravity-float" />
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Review and publish student exam results. <span className="text-violet-400 font-bold">{submissions.length} awaiting review.</span>
            </p>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold"
            style={{
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.3)',
              color: '#f59e0b',
              boxShadow: '0 0 15px rgba(245,158,11,0.1)',
            }}
          >
            <AlertTriangle size={14} />
            {submissions.length} Pending
          </motion.div>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <HudPanel color="cyan">
          <div className="p-3 flex items-center gap-3">
            <Search size={14} style={{ color: '#00f0ff' }} />
            <input
              type="text"
              placeholder="Search by student name, email, or exam title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-xs text-white placeholder:text-slate-600 focus:outline-none"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-slate-500 hover:text-slate-300 text-xs">✕</button>
            )}
          </div>
        </HudPanel>
      </motion.div>

      {/* Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 rounded-xl animate-shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <div className="text-5xl mb-4">✅</div>
          <p className="text-slate-400 font-semibold">
            {search ? 'No results match your search.' : 'No pending reviews. All caught up!'}
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <AnimatePresence>
            {filtered.map((res, i) => (
              <motion.div
                key={res._id}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.07, type: 'spring', stiffness: 120 }}
              >
                <Card3D intensity={14}>
                  <div
                    className="p-5 rounded-xl space-y-4 h-full relative overflow-hidden"
                    style={{
                      background: 'rgba(8,12,30,0.9)',
                      border: '1px solid rgba(245,158,11,0.25)',
                      boxShadow: '0 0 25px rgba(245,158,11,0.08)',
                    }}
                  >
                    {/* Holographic overlay */}
                    <div className="absolute inset-0 holographic rounded-xl pointer-events-none opacity-30" />

                    {/* Pending indicator pulse */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping-slow" style={{ boxShadow: '0 0 6px #f59e0b' }} />
                      <span className="text-[9px] text-amber-400 font-bold font-mono uppercase tracking-widest">Pending</span>
                    </div>

                    {/* Student info */}
                    <div className="space-y-1 pr-20">
                      <p className="text-sm font-bold text-white truncate">{res.student?.fullName || 'Student'}</p>
                      <p className="text-[10px] text-slate-500 font-mono truncate">{res.student?.email}</p>
                    </div>

                    {/* Exam info */}
                    <div
                      className="p-3 rounded-lg space-y-1"
                      style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}
                    >
                      <p className="text-xs font-semibold text-violet-300 truncate">{res.exam?.title || 'Exam'}</p>
                      <p className="text-[10px] text-slate-500">{res.totalQuestions} questions</p>
                    </div>

                    {/* Time */}
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                      <Clock size={11} />
                      {new Date(res.createdAt).toLocaleString()}
                    </div>

                    {/* Action */}
                    <Link to={`/admin/review/${res._id}`} className="block">
                      <motion.div
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="w-full py-2 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-2"
                        style={{
                          background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                          boxShadow: '0 0 15px rgba(139,92,246,0.3)',
                          color: 'white',
                        }}
                      >
                        <Eye size={13} /> Review Submission
                      </motion.div>
                    </Link>
                  </div>
                </Card3D>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default PendingResults;
