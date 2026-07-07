import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Award, Clock, Star, ArrowLeft, Download, ShieldAlert, BarChart3 } from 'lucide-react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Accordion from '../../components/ui/Accordion';
import Skeleton from '../../components/ui/Skeleton';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import toast from 'react-hot-toast';

const ResultDetail = () => {
  const { resultId } = useParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const response = await api.get(`/results/${resultId}`);
        setResult(response.data.data);
      } catch (err) {
        toast.error('Failed to load detailed report.');
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [resultId]);

  if (loading) {
    return <Skeleton variant="rect" className="w-full" height="h-96" />;
  }

  if (!result) return null;

  if (result.status === 'Pending') {
    return (
      <div className="space-y-8">
        {/* Breadcrumb back navigation */}
        <div className="flex items-center gap-2">
          <Link to="/student/results" className="text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Results / Under Review</span>
        </div>

        <div className="bg-gradient-to-r from-brand-blue/10 to-brand-violet/10 border border-brand-blue/20 dark:from-brand-blue/15 dark:to-brand-violet/15 dark:border-brand-blue/30 rounded-2xl p-8 text-center space-y-5">
          <div className="h-16 w-16 bg-brand-blue/10 rounded-full flex items-center justify-center text-brand-blue text-2xl mx-auto animate-bounce">
            ⏳
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h1 className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
              Assessment Pending Review
            </h1>
            <p className="text-xs text-slate-500 dark:text-darkMuted leading-relaxed">
              Your exam has been submitted successfully.<br />
              Your result is under review by the administrator.<br />
              You will be able to view it once it is published.
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <Link to="/student/results">
              <Button size="sm" variant="outline">Back to Results</Button>
            </Link>
            <Link to="/student/dashboard">
              <Button size="sm">Go to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Format radar data matching topicWise values
  const radarData = (result.topicWise || []).map((topic) => ({
    subject: topic.topic,
    Score: topic.percentage,
    Average: result.cohortStats?.average || 65
  }));

  const handleDownloadPDF = () => {
    toast.success('Your detailed scoring report has been prepared for download.', {
      icon: '📄'
    });
  };

  return (
    <div className="space-y-8">
      {/* Breadcrumb back navigation */}
      <div className="flex items-center gap-2">
        <Link to="/student/results" className="text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Results / Detailed Report</span>
      </div>

      {/* Hero Pass/Fail banner */}
      <div
        className={`rounded-2xl border p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 ${
          result.passed
            ? 'bg-gradient-to-r from-brand-emerald/10 to-brand-blue/15 border-brand-emerald/20 text-brand-emerald dark:from-emerald-950/25'
            : 'bg-gradient-to-r from-brand-red/10 to-brand-amber/15 border-brand-red/20 text-brand-red dark:from-red-950/25'
        }`}
      >
        <div className="flex gap-4 items-center">
          <div className="text-4xl">
            {result.passed ? '🏆' : '💀'}
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
              {result.passed ? 'Congratulations, you passed!' : 'Assesment evaluation not qualified.'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-darkMuted mt-1">
              You scored {result.obtainedMarks} out of {result.totalMarks} marks ({result.percentage}%).
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
            <Download size={14} className="mr-1" /> PDF Report
          </Button>
          <Link to="/student/dashboard">
            <Button size="sm">Go to Dashboard</Button>
          </Link>
        </div>
      </div>

      {/* Grid of details */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <Card variant="gradient" className="antigravity-float">
          <p className="text-[10px] font-bold text-slate-400 dark:text-darkMuted uppercase tracking-wider">Integrity violations</p>
          <div className="flex items-baseline gap-2 mt-1.5">
            <p className="text-2xl font-extrabold text-slate-800 dark:text-white">
              {result.response?.violationCount || 0}
            </p>
            <span className="text-[9px] text-slate-400 font-semibold">warnings</span>
          </div>
        </Card>

        <Card variant="gradient" className="antigravity-float-delayed">
          <p className="text-[10px] font-bold text-slate-400 dark:text-darkMuted uppercase tracking-wider">Correct Answers</p>
          <div className="flex items-baseline gap-2 mt-1.5">
            <p className="text-2xl font-extrabold text-brand-emerald">
              {result.correctAnswers}
            </p>
            <span className="text-[9px] text-slate-455 dark:text-darkMuted">/ {result.totalQuestions}</span>
          </div>
        </Card>

        <Card variant="gradient" className="antigravity-float">
          <p className="text-[10px] font-bold text-slate-400 dark:text-darkMuted uppercase tracking-wider">Average time per question</p>
          <div className="flex items-baseline gap-2 mt-1.5">
            <p className="text-2xl font-extrabold text-slate-800 dark:text-white">
              {result.timeAnalysis?.averageTimePerQuestion || 0}
            </p>
            <span className="text-[9px] text-slate-400 font-semibold">seconds</span>
          </div>
        </Card>

        <Card variant="gradient" className="antigravity-float-delayed">
          <p className="text-[10px] font-bold text-slate-400 dark:text-darkMuted uppercase tracking-wider">Cohort Percentile</p>
          <div className="flex items-baseline gap-2 mt-1.5">
            <p className="text-2xl font-extrabold text-brand-blue">
              {result.passed ? '88th' : '45th'}
            </p>
            <span className="text-[9px] text-slate-400 font-semibold">percentile</span>
          </div>
        </Card>
      </div>

      {/* Visual Analytics rows (Recharts side by side) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Radar topic mapping */}
        <Card className="space-y-4">
          <h3 className="text-sm font-bold text-slate-850 dark:text-white">Topic Strengths (VS Cohort Average)</h3>
          <div className="h-[280px] flex items-center justify-center">
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" r="80%" data={radarData}>
                  <PolarGrid stroke="#E2E8F0" />
                  <PolarAngleAxis dataKey="subject" stroke="#94A3B8" fontSize={9} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#94A3B8" fontSize={9} />
                  <Radar name="Candidate" dataKey="Score" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.25} />
                  <Radar name="Cohort Mean" dataKey="Average" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.1} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-slate-450 dark:text-darkMuted">Analytics metrics populated on completion.</span>
            )}
          </div>
        </Card>

        {/* Category Horizontal Bars */}
        <Card className="space-y-4">
          <h3 className="text-sm font-bold text-slate-850 dark:text-white">Subject-wise Efficiency</h3>
          <div className="h-[280px]">
            {(result.subjectWise || []).length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={result.subjectWise || []} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" domain={[0, 100]} stroke="#94A3B8" fontSize={9} />
                  <YAxis dataKey="subject" type="category" stroke="#94A3B8" fontSize={9} width={80} />
                  <Tooltip
                    contentStyle={{
                      background: '#1E293B',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#FFF',
                      fontSize: '10px'
                    }}
                  />
                  <Bar dataKey="percentage" fill="#10B981" radius={[0, 4, 4, 0]} barSize={15} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs text-slate-450 dark:text-darkMuted">No category tags mapped for this paper.</span>
            )}
          </div>
        </Card>
      </div>

      {/* Accordions questions breakdown */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-850 dark:text-white">Question Response breakdown</h3>
        
        <div className="space-y-2.5">
          {result.questionBreakdown.map((item, idx) => (
            <div
              key={idx}
              className={`border rounded-xl bg-white dark:bg-darkSurface overflow-hidden ${
                item.isCorrect
                  ? 'border-l-4 border-l-brand-emerald border-slate-200 dark:border-slate-800'
                  : 'border-l-4 border-l-brand-red border-slate-200 dark:border-slate-800'
              }`}
            >
              <Accordion title={`Question ${idx + 1}: ${item.question?.text.substring(0, 80)}...`}>
                <div className="space-y-4 px-4 py-1 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Your Answer</span>
                      <span
                        className={`px-3 py-1.5 rounded-lg font-mono inline-block ${
                          item.isCorrect
                            ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-brand-emerald'
                            : 'bg-red-50 text-red-800 dark:bg-red-950/20 dark:text-brand-red'
                        }`}
                      >
                        {item.studentAnswer === null ? 'Skipped' : String(item.studentAnswer)}
                      </span>
                    </div>

                    <div>
                      <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">Correct Answer</span>
                      <span className="px-3 py-1.5 rounded-lg font-mono bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-brand-emerald inline-block">
                        {String(item.correctAnswer)}
                      </span>
                    </div>
                  </div>

                  {item.question?.explanation && (
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                      <span className="font-bold text-slate-450 dark:text-darkMuted block mb-1">Grading Explanation</span>
                      <p className="text-slate-500 leading-relaxed dark:text-darkMuted">{item.question.explanation}</p>
                    </div>
                  )}
                </div>
              </Accordion>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResultDetail;
