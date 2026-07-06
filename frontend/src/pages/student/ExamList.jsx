import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Award, ShieldAlert, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import toast from 'react-hot-toast';

const ExamList = () => {
  const [loading, setLoading] = useState(true);
  const [examsData, setExamsData] = useState({ upcoming: [], active: [], completed: [] });
  const [activeTab, setActiveTab] = useState('active'); // active, upcoming, completed

  const navigate = useNavigate();

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const response = await api.get('/exams/student');
      setExamsData(response.data.data);
    } catch (err) {
      toast.error('Failed to load exams list.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = (examId) => {
    // Redirect to the fullscreen exam session screen
    navigate(`/student/exam/${examId}`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton width="w-48" height="h-8" />
        <div className="flex gap-4 border-b pb-2">
          <Skeleton width="w-20" height="h-8" />
          <Skeleton width="w-20" height="h-8" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton variant="rect" height="h-44" />
          <Skeleton variant="rect" height="h-44" />
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'active', label: 'Active Exams', count: examsData.active.length },
    { id: 'upcoming', label: 'Upcoming Scheduled', count: examsData.upcoming.length },
    { id: 'completed', label: 'Completed History', count: examsData.completed.length }
  ];

  const activeList = examsData[activeTab] || [];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">My Examinations</h1>
        <p className="text-xs text-slate-450 dark:text-darkMuted">Launch active papers or check your upcoming schedule.</p>
      </div>

      {/* Tab Selectors */}
      <div className="flex items-center gap-6 border-b border-slate-200 dark:border-slate-800 pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-all relative ${
              activeTab === tab.id
                ? 'text-brand-blue border-b-2 border-brand-blue dark:text-brand-blueLight dark:border-brand-blueLight'
                : 'text-slate-400 dark:text-darkMuted hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeList.map((item) => {
          const exam = item.exam || item;
          return (
            <Card key={exam._id} hoverLift className="flex flex-col justify-between h-56">
              <div className="space-y-2.5">
                <div className="flex justify-between items-start">
                  <Badge variant="info">{exam.category}</Badge>
                  {exam.proctoring?.level === 'strict' && (
                    <Badge variant="danger" dot>Proctored</Badge>
                  )}
                </div>
                
                <h3 className="text-sm font-bold text-slate-800 dark:text-white leading-snug line-clamp-2">
                  {exam.title}
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-darkMuted line-clamp-2">
                  {exam.description || 'No instruction description provided by creator.'}
                </p>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center justify-between mt-auto">
                <div className="flex flex-col gap-0.5 text-[10px] text-slate-450 dark:text-darkMuted font-semibold">
                  <span className="flex items-center gap-1"><Clock size={12} /> {exam.duration} mins</span>
                  <span>Total Marks: {exam.totalMarks}</span>
                </div>

                {activeTab === 'active' && (
                  <Button size="sm" onClick={() => handleStartExam(exam._id)}>
                    Start Exam
                  </Button>
                )}

                {activeTab === 'upcoming' && (
                  <Badge variant="warning">Scheduled</Badge>
                )}

                {activeTab === 'completed' && (
                  <div className="flex items-center gap-2">
                    <Badge variant={item.responseStatus === 'missed' ? 'danger' : (item.passed ? 'success' : 'danger')}>
                      {item.responseStatus === 'missed' ? 'Missed' : `${item.percentage}%`}
                    </Badge>
                  </div>
                )}
              </div>
            </Card>
          );
        })}

        {activeList.length === 0 && (
          <div className="col-span-full border border-dashed border-slate-200 dark:border-slate-850 rounded-2xl py-16 text-center text-xs text-slate-400 dark:text-darkMuted">
            <div className="flex flex-col items-center justify-center gap-3">
              <AlertCircle size={24} className="text-slate-300" />
              <p>No exams found in this folder tab.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamList;
