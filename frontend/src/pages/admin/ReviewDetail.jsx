import React, { useEffect, useState, lazy, Suspense } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, FileText, CheckCircle2, XCircle, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import HudPanel from '../../components/ui/HudPanel';
import { FlipCard3D } from '../../components/ui/Card3D';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import toast from 'react-hot-toast';

const ReviewDetail = () => {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [flippedCards, setFlippedCards] = useState({});
  const [expandedIdx, setExpandedIdx] = useState(null);

  useEffect(() => {
    const fetchSubmissionDetails = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/results/${resultId}`);
        setResult(response.data.data);
      } catch (err) {
        toast.error('Failed to load submission details.');
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissionDetails();
  }, [resultId]);

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await api.post(`/results/admin/review/${resultId}/approve`);
      toast.success('✅ Result approved and published successfully!');
      navigate('/admin/pending-reviews');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve result.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!window.confirm('Are you sure you want to reject this submission?')) return;
    setActionLoading(true);
    try {
      await api.post(`/results/admin/review/${resultId}/reject`);
      toast.success('Submission rejected.');
      navigate('/admin/pending-reviews');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject result.');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleFlip = (idx) => {
    setFlippedCards(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton width="w-48" height="h-6" />
        <Skeleton variant="rect" height="h-32" />
        <Skeleton variant="rect" height="h-[400px]" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="text-center py-12">
        <p className="text-xs text-slate-500">Submission not found.</p>
      </div>
    );
  }

  const correctCount = result.questionBreakdown?.filter(q => q.isCorrect).length || 0;
  const totalCount = result.questionBreakdown?.length || 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
        <Link to="/admin/pending-reviews" className="text-slate-400 hover:text-cyan-400 transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">
          ▶ PENDING REVIEWS / ANSWER SHEET EVALUATION
        </span>
      </motion.div>

      {/* HUD Header Panel */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <HudPanel color="violet" title="CANDIDATE SUBMISSION — AWAITING REVIEW">
          <div className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="warning">⏳ Under Review</Badge>
                <span className="text-[10px] text-slate-500 font-mono">ID: {resultId?.slice(-8).toUpperCase()}</span>
              </div>
              <h1 className="text-lg font-bold text-white">{result.exam?.title || 'Exam Sheet'}</h1>
              <p className="text-xs text-slate-400">
                Candidate: <span className="font-semibold text-cyan-400">{result.student?.fullName}</span>
                <span className="text-slate-600 mx-1">•</span>
                <span className="text-slate-500">{result.student?.email}</span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleReject}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.1))',
                  border: '1px solid rgba(239,68,68,0.4)',
                  boxShadow: '0 0 15px rgba(239,68,68,0.15)',
                }}
              >
                ✕ Reject
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleApprove}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                  boxShadow: '0 0 20px rgba(16,185,129,0.4)',
                }}
              >
                ✓ Approve & Publish
              </motion.button>
            </div>
          </div>
        </HudPanel>
      </motion.div>

      {/* Stat Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: 'Total Questions', value: totalCount,                       color: '#00f0ff' },
          { label: 'Correct (Preview)',value: correctCount,                    color: '#10b981' },
          { label: 'Incorrect',        value: totalCount - correctCount,       color: '#ef4444' },
          { label: 'Submission Time',  value: new Date(result.createdAt).toLocaleDateString(), color: '#8b5cf6' },
        ].map(({ label, value, color }, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 + i * 0.07 }}
          >
            <div
              className="p-4 rounded-xl"
              style={{
                background: 'rgba(10,14,39,0.8)',
                border: `1px solid ${color}25`,
                boxShadow: `0 0 15px ${color}10`,
              }}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'rgba(148,163,184,0.7)' }}>{label}</p>
              <p className="text-xl font-black" style={{ color, fontFamily: 'Space Grotesk, sans-serif' }}>{value}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Answer Sheet — 3D Flip Cards */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">▶ ANSWER SHEET — CLICK CARD TO REVEAL CORRECT ANSWER</span>
        </div>

        <div className="space-y-3">
          {result.questionBreakdown.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45 + idx * 0.05 }}
            >
              {/* Front: question + student answer */}
              <div
                className="rounded-xl overflow-hidden cursor-pointer"
                style={{
                  border: `1px solid ${item.isCorrect ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
                  boxShadow: `0 0 15px ${item.isCorrect ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'}`,
                  background: 'rgba(8,12,30,0.8)',
                }}
                onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
              >
                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-black font-mono"
                      style={{
                        background: item.isCorrect ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                        color: item.isCorrect ? '#10b981' : '#ef4444',
                        border: `1px solid ${item.isCorrect ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                      }}
                    >
                      {idx + 1}
                    </div>
                    <p className="text-xs text-slate-300 font-medium truncate">
                      {item.question?.text?.substring(0, 90) || 'Question'}
                      {item.question?.text?.length > 90 && '...'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.isCorrect
                      ? <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                      : <XCircle size={16} style={{ color: '#ef4444' }} />
                    }
                    <span className="text-[10px] font-mono text-slate-500">{expandedIdx === idx ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Expanded: 3D flip reveal */}
                <AnimatePresence>
                  {expandedIdx === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t overflow-hidden"
                      style={{ borderColor: item.isCorrect ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)' }}
                    >
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(148,163,184,0.6)' }}>Question</p>
                          <p className="text-slate-200 leading-relaxed">{item.question?.text}</p>
                          <p className="mt-2 text-[10px] font-mono text-slate-600">Type: {item.question?.type?.toUpperCase()}</p>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <p className="font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(148,163,184,0.6)' }}>Student Answer</p>
                            <span
                              className="px-3 py-1.5 rounded-lg font-mono inline-block text-xs"
                              style={{
                                background: item.isCorrect ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                color: item.isCorrect ? '#10b981' : '#ef4444',
                                border: `1px solid ${item.isCorrect ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                              }}
                            >
                              {item.studentAnswer === null || item.studentAnswer === undefined ? '— Skipped' : String(item.studentAnswer)}
                            </span>
                          </div>
                          <div>
                            <p className="font-bold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(148,163,184,0.6)' }}>Correct Answer Key</p>
                            <motion.span
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="px-3 py-1.5 rounded-lg font-mono inline-block text-xs"
                              style={{
                                background: 'rgba(16,185,129,0.12)',
                                color: '#10b981',
                                border: '1px solid rgba(16,185,129,0.35)',
                                boxShadow: '0 0 10px rgba(16,185,129,0.15)',
                              }}
                            >
                              {String(item.correctAnswer)}
                            </motion.span>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-white/5 text-[10px] font-bold text-slate-500 font-mono">
                            <span>Marks: {item.marksObtained ?? 0} / {item.question?.defaultMarks || 1}</span>
                            <span style={{ color: item.isCorrect ? '#10b981' : '#ef4444' }}>
                              {item.isCorrect ? '✓ CORRECT' : '✗ INCORRECT'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default ReviewDetail;
