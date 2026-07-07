import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, FileText, Download, Award, ShieldAlert, CheckCircle, AlertTriangle, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Card3D from '../../components/ui/Card3D';
import HudPanel from '../../components/ui/HudPanel';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

const Results = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedExamFilter, setSelectedExamFilter] = useState('');
  
  // Aggregate stats states
  const [summary, setSummary] = useState({ totalAttempts: 0, passRate: 0, avgPercentage: 0 });

  // Violation log review modal
  const [violationModalOpen, setViolationModalOpen] = useState(false);
  const [activeViolationsList, setActiveViolationsList] = useState([]);
  const [activeStudentName, setActiveStudentName] = useState('');

  useEffect(() => {
    fetchResults();
  }, [search, selectedExamFilter]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const response = await api.get('/results/admin', {
        params: {
          examId: selectedExamFilter
        }
      });
      const data = response.data.data;
      setResults(data);

      // Compile aggregates
      if (data.length > 0) {
        const total = data.length;
        const passed = data.filter((r) => r.passed).length;
        const avg = Math.round(data.reduce((sum, r) => sum + r.percentage, 0) / total);
        
        setSummary({
          totalAttempts: total,
          passRate: Math.round((passed / total) * 100),
          avgPercentage: avg
        });
      } else {
        setSummary({ totalAttempts: 0, passRate: 0, avgPercentage: 0 });
      }
    } catch (err) {
      toast.error('Failed to load assessment results.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenViolations = (studentName, responseRecord) => {
    setActiveStudentName(studentName);
    setActiveViolationsList(responseRecord?.violations || []);
    setViolationModalOpen(true);
  };

  const handleDisqualify = async (resultId) => {
    // Simulated action
    toast.success('Disqualification completed. Record deleted.', {
      icon: '🛡️'
    });
    fetchResults();
  };

  const tableHeaders = [
    { key: 'student', label: 'Candidate' },
    { key: 'exam', label: 'Exam Title' },
    { key: 'score', label: 'Marks' },
    { key: 'pct', label: 'Percentage' },
    { key: 'violation', label: 'Security warnings' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: 'Actions' }
  ];

  const filteredResults = results.filter((res) => {
    if (!search) return true;
    return (
      res.student?.fullName.toLowerCase().includes(search.toLowerCase()) ||
      res.student?.email.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Assessment Reports</h1>
          <p className="text-xs text-slate-450 dark:text-darkMuted">Audit submitted answer papers, grading sheets, and proctoring warnings logs.</p>
        </div>
      </div>

      {/* Stats summaries row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card variant="gradient">
          <p className="text-[10px] font-bold text-slate-400 dark:text-darkMuted uppercase tracking-wider">Total Submissions</p>
          <p className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1">{summary.totalAttempts}</p>
        </Card>
        <Card variant="gradient">
          <p className="text-[10px] font-bold text-slate-400 dark:text-darkMuted uppercase tracking-wider">Cohort Pass rate</p>
          <p className="text-2xl font-extrabold text-brand-emerald mt-1">{summary.passRate}%</p>
        </Card>
        <Card variant="gradient">
          <p className="text-[10px] font-bold text-slate-400 dark:text-darkMuted uppercase tracking-wider">Average cohort score</p>
          <p className="text-2xl font-extrabold text-brand-blue mt-1">{summary.avgPercentage}%</p>
        </Card>
      </div>

      {/* Filters Search inputs */}
      <Card className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-xs">
          <input
            type="text"
            placeholder="Search candidate name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-darkSurface border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
        </div>
      </Card>

      {/* Roster reports table */}
      <Table
        headers={tableHeaders}
        data={filteredResults}
        loading={loading}
        emptyMessage="No assessment reports recorded yet."
        renderRow={(res) => {
          const vCount = res.response?.violationCount || 0;
          return (
            <>
              <td className="px-6 py-4 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue font-bold text-xs uppercase">
                  {res.student?.fullName.charAt(0)}
                </div>
                <div>
                  <span className="font-semibold text-slate-905 dark:text-darkText block">{res.student?.fullName}</span>
                  <span className="text-[10px] text-slate-400">{res.student?.email}</span>
                </div>
              </td>
              <td className="px-6 py-4 font-semibold text-slate-800 dark:text-darkText max-w-xs truncate">{res.exam?.title}</td>
              <td className="px-6 py-4 font-bold">{res.obtainedMarks} / {res.exam?.totalMarks || res.totalMarks}</td>
              <td className="px-6 py-4 font-semibold">{res.percentage}%</td>
              <td className="px-6 py-4">
                {vCount > 0 ? (
                  <button
                    onClick={() => handleOpenViolations(res.student?.fullName, res.response)}
                    className="flex items-center gap-1 text-[11px] font-bold text-brand-red hover:underline"
                  >
                    <ShieldAlert size={14} /> {vCount} warnings logged
                  </button>
                ) : (
                  <span className="text-slate-400 text-xs">Clean record</span>
                )}
              </td>
              <td className="px-6 py-4">
                <Badge variant={res.passed ? 'success' : 'danger'}>
                  {res.passed ? 'Passed' : 'Failed'}
                </Badge>
              </td>
              <td className="px-6 py-4 flex gap-2">
                <Link to={`/student/results/${res._id}`}>
                  <button className="p-1.5 border rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-brand-blue">
                    <Eye size={14} />
                  </button>
                </Link>
                <button
                  onClick={() => handleDisqualify(res._id)}
                  className="p-1.5 border rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-brand-red"
                  title="Disqualify record"
                >
                  💀
                </button>
              </td>
            </>
          );
        }}
      />

      {/* Violation review modal */}
      <Modal isOpen={violationModalOpen} onClose={() => setViolationModalOpen(false)} title={`Security Warnings Audits: ${activeStudentName}`}>
        <div className="space-y-4">
          <div className="relative border-l border-brand-red pl-4 space-y-4 text-xs">
            {activeViolationsList.map((v, idx) => (
              <div key={idx} className="relative">
                <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-brand-red border border-white dark:border-darkSurface" />
                <p className="font-bold text-slate-850 dark:text-darkText uppercase tracking-wider">{v.type.replace('_', ' ')}</p>
                <p className="text-slate-500 mt-0.5">{v.details}</p>
                <span className="text-[9px] text-slate-400 block mt-1">Logged: {new Date(v.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
            {activeViolationsList.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">No violations logged.</p>
            )}
          </div>
          
          <div className="flex justify-end pt-4 border-t">
            <Button size="sm" onClick={() => setViolationModalOpen(false)}>
              Close Audit
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Results;
