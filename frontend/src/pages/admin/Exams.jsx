import React, { useEffect, useState } from 'react';
import { Search, Plus, Calendar, Clock, Edit3, Eye, Copy, Trash2, CheckCircle2, ChevronRight, ChevronLeft, Shield, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

const Exams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  
  // Create / Edit Stepper Modal
  const [stepperOpen, setStepperOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [editingExamId, setEditingExamId] = useState(null);

  // Stepper Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState('quiz'); // practice, quiz, midterm, final, entrance
  const [duration, setDuration] = useState(60); // minutes
  const [passingMarks, setPassingMarks] = useState(50); // percentage
  const [instructions, setInstructions] = useState('');
  
  // Step 2 Access
  const [scheduleType, setScheduleType] = useState('always'); // always, fixed
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [maxAttempts, setMaxAttempts] = useState(1);

  // Step 3 Questions Selector
  const [questionBank, setQuestionBank] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]); // Array of { questionId, marks, order }

  // Step 4 Proctoring
  const [proctorLevel, setProctorLevel] = useState('basic'); // basic, moderate, strict
  const [tabSwitchLimit, setTabSwitchLimit] = useState(3);
  const [fullscreenRequired, setFullscreenRequired] = useState(false);
  const [webcamRequired, setWebcamRequired] = useState(false);

  useEffect(() => {
    fetchExams();
    fetchQuestionBank();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const response = await api.get('/exams');
      setExams(response.data.data);
    } catch (err) {
      toast.error('Failed to load examinations.');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestionBank = async () => {
    try {
      const response = await api.get('/admin/questions', { params: { limit: 100 } });
      setQuestionBank(response.data.data.questions || []);
    } catch (err) {
      console.error('Failed loading question repository', err);
    }
  };

  const handleOpenAdd = () => {
    setEditingExamId(null);
    setTitle('');
    setDescription('');
    setCategory('General');
    setType('quiz');
    setDuration(60);
    setPassingMarks(50);
    setInstructions('');
    setScheduleType('always');
    setSelectedQuestions([]);
    setProctorLevel('basic');
    setTabSwitchLimit(3);
    setFullscreenRequired(false);
    setWebcamRequired(false);
    setStep(1);
    setStepperOpen(true);
  };

  const handleOpenEdit = (exam) => {
    setEditingExamId(exam._id);
    setTitle(exam.title);
    setDescription(exam.description);
    setCategory(exam.category);
    setType(exam.type);
    setDuration(exam.duration);
    setPassingMarks(exam.passingMarks);
    setInstructions(exam.instructions);
    setScheduleType(exam.schedule.type);
    setStartDate(exam.schedule.startDate ? exam.schedule.startDate.substring(0, 16) : '');
    setEndDate(exam.schedule.endDate ? exam.schedule.endDate.substring(0, 16) : '');
    setMaxAttempts(exam.settings.maxAttempts);
    
    // Map questions correctly
    setSelectedQuestions(
      exam.questions.map((q) => ({
        questionId: q.question?._id || q.question,
        marks: q.marks,
        order: q.order
      }))
    );

    setProctorLevel(exam.proctoring.level);
    setTabSwitchLimit(exam.proctoring.tabSwitchLimit);
    setFullscreenRequired(exam.proctoring.fullscreenRequired);
    setWebcamRequired(exam.proctoring.webcamRequired);
    setStep(1);
    setStepperOpen(true);
  };

  const handleQuestionToggle = (qId) => {
    setSelectedQuestions((prev) => {
      const exists = prev.find((q) => q.questionId === qId);
      if (exists) {
        return prev.filter((q) => q.questionId !== qId);
      } else {
        return [...prev, { questionId: qId, marks: 5, order: prev.length }];
      }
    });
  };

  const handleSaveExam = async () => {
    if (selectedQuestions.length === 0) {
      return toast.error('Please select at least 1 question from bank.');
    }

    const payload = {
      title,
      description,
      category,
      type,
      duration: parseInt(duration),
      passingMarks: parseInt(passingMarks),
      instructions,
      schedule: {
        type: scheduleType,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined
      },
      settings: {
        maxAttempts: parseInt(maxAttempts),
        shuffleQuestions: true,
        showResults: 'immediately'
      },
      proctoring: {
        level: proctorLevel,
        tabSwitchLimit: parseInt(tabSwitchLimit),
        fullscreenRequired,
        webcamRequired
      },
      questions: selectedQuestions.map((q, idx) => ({
        question: q.questionId,
        marks: parseInt(q.marks),
        order: idx
      })),
      status: 'published' // auto publish for simplified previewing
    };

    try {
      if (editingExamId) {
        await api.patch(`/exams/${editingExamId}`, payload);
        toast.success('Examination updated successfully.');
      } else {
        await api.post('/exams', payload);
        toast.success('Examination published.');
      }
      setStepperOpen(false);
      fetchExams();
    } catch (err) {
      toast.error('Failed to register exam.');
    }
  };

  const handleDuplicate = async (id) => {
    try {
      await api.post(`/exams/${id}/duplicate`);
      toast.success('Exam duplicated as draft.');
      fetchExams();
    } catch (err) {
      toast.error('Failed to duplicate.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/exams/${id}`);
      toast.success('Exam deleted.');
      fetchExams();
    } catch (err) {
      toast.error('Failed to delete.');
    }
  };

  const filteredExams = exams.filter((ex) => {
    if (activeTab === 'All') return true;
    return ex.status.toLowerCase() === activeTab.toLowerCase();
  });

  return (
    <div className="space-y-6">
      {/* Header bar controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Exam Management</h1>
          <p className="text-xs text-slate-450 dark:text-darkMuted">Create scheduled mock papers or lock browser rules.</p>
        </div>
        <Button size="sm" onClick={handleOpenAdd}>
          <Plus size={16} className="mr-1" /> Create New Exam
        </Button>
      </div>

      {/* Tabs folder filters */}
      <div className="flex items-center gap-6 border-b border-slate-200 dark:border-slate-800 pb-px">
        {['All', 'Published', 'Draft'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-xs font-semibold uppercase tracking-wider relative transition-all ${
              activeTab === tab
                ? 'text-brand-blue border-b-2 border-brand-blue dark:text-brand-blueLight dark:border-brand-blueLight'
                : 'text-slate-400 dark:text-darkMuted hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Cards list grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredExams.map((exam) => (
          <Card key={exam._id} hoverLift className="flex flex-col justify-between h-60">
            <div className="space-y-2.5">
              <div className="flex justify-between items-start">
                <Badge variant="info">{exam.category}</Badge>
                <Badge variant={exam.status === 'published' ? 'success' : 'neutral'}>{exam.status}</Badge>
              </div>

              <h3 className="text-sm font-bold text-slate-850 dark:text-white leading-snug line-clamp-2">{exam.title}</h3>
              <p className="text-[11px] text-slate-450 dark:text-darkMuted line-clamp-2">{exam.description || 'No description'}</p>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center justify-between mt-auto">
              <div className="text-[10px] text-slate-450 dark:text-darkMuted font-semibold space-y-0.5">
                <span className="flex items-center gap-1"><Clock size={12} /> {exam.duration} mins</span>
                <p>Questions: {exam.questions?.length || 0} • Marks: {exam.totalMarks}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenEdit(exam)}
                  className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-450 hover:text-brand-blue transition-all"
                >
                  <Edit3 size={12} />
                </button>
                <button
                  onClick={() => handleDuplicate(exam._id)}
                  className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-450 hover:text-brand-violet transition-all"
                >
                  <Copy size={12} />
                </button>
                <button
                  onClick={() => handleDelete(exam._id)}
                  className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-450 hover:text-brand-red transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </Card>
        ))}

        {filteredExams.length === 0 && (
          <div className="col-span-full border border-dashed border-slate-200 dark:border-slate-850 rounded-2xl py-16 text-center text-xs text-slate-400 dark:text-darkMuted">
            No examinations found.
          </div>
        )}
      </div>

      {/* Stepper Multi Step Modal */}
      <Modal
        isOpen={stepperOpen}
        onClose={() => setStepperOpen(false)}
        title={editingExamId ? `Configure Paper: Step ${step} / 5` : `Build Exam Paper: Step ${step} / 5`}
        size="lg"
      >
        <div className="space-y-6">
          {/* Progress stepper line */}
          <div className="flex justify-between items-center text-xs font-semibold text-slate-400 mb-6">
            {['General', 'Access Rules', 'Questions selector', 'Security limits', 'Review'].map((label, idx) => (
              <span key={idx} className={step === idx + 1 ? 'text-brand-blue font-black' : ''}>
                {idx + 1}. {label}
              </span>
            ))}
          </div>

          {/* STEP 1: Basic details */}
          {step === 1 && (
            <div className="space-y-4">
              <Input label="Exam Title" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              
              <div className="grid grid-cols-2 gap-4">
                <Input label="Category (e.g. Science)" id="category" value={category} onChange={(e) => setCategory(e.target.value)} required />
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Exam Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-white dark:bg-darkSurface border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs mt-1.5 focus:outline-none"
                  >
                    <option value="quiz">Quiz / Trivia</option>
                    <option value="midterm">Semester Midterm</option>
                    <option value="final">Final Term Examination</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input label="Duration (in minutes)" id="duration" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} required />
                <Input label="Passing marks percentage" id="pass" type="number" value={passingMarks} onChange={(e) => setPassingMarks(e.target.value)} required />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Special candidate instructions</label>
                <textarea
                  rows={4}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-800 dark:bg-darkSurface rounded-lg px-3 py-2 text-xs mt-1.5 focus:outline-none resize-none"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Scheduling */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Schedule Availability</span>
                <div className="grid grid-cols-2 gap-4">
                  <div
                    onClick={() => setScheduleType('always')}
                    className={`border p-4 rounded-xl cursor-pointer transition-all ${
                      scheduleType === 'always' ? 'border-brand-blue bg-brand-blue/5' : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <span className="text-xs font-bold block">Open Availability</span>
                    <span className="text-[10px] text-slate-400 mt-1 block">Students can attempt at any date/time.</span>
                  </div>
                  <div
                    onClick={() => setScheduleType('fixed')}
                    className={`border p-4 rounded-xl cursor-pointer transition-all ${
                      scheduleType === 'fixed' ? 'border-brand-blue bg-brand-blue/5' : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <span className="text-xs font-bold block">Fixed Window Interval</span>
                    <span className="text-[10px] text-slate-400 mt-1 block">Scheduled specific start and end ranges.</span>
                  </div>
                </div>
              </div>

              {scheduleType === 'fixed' && (
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Start date/time" id="start" type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  <Input label="End date/time" id="end" type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              )}

              <Input label="Maximum attempts permitted" id="attempts" type="number" value={maxAttempts} onChange={(e) => setMaxAttempts(e.target.value)} />
            </div>
          )}

          {/* STEP 3: Question selections list */}
          {step === 3 && (
            <div className="space-y-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Link Question items from Bank</span>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto">
                {questionBank.map((q) => {
                  const isChecked = selectedQuestions.some((item) => item.questionId === q._id);
                  return (
                    <div
                      key={q._id}
                      onClick={() => handleQuestionToggle(q._id)}
                      className={`p-3 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                        isChecked ? 'bg-brand-blue/5 dark:bg-brand-blue/10' : ''
                      }`}
                    >
                      <div className="space-y-0.5 pr-4 flex-1">
                        <p className="font-semibold text-slate-850 dark:text-darkText line-clamp-1">{q.text}</p>
                        <p className="text-[10px] text-slate-400">Type: {q.type} • Difficulty: {q.difficulty}</p>
                      </div>
                      
                      <div className={`h-4 w-4 rounded border flex items-center justify-center ${
                        isChecked ? 'border-brand-blue bg-brand-blue text-white' : 'border-slate-300'
                      }`}>
                        {isChecked && <span className="text-[10px]">✓</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <p className="text-[10px] text-slate-400 font-semibold font-mono">Linked Questions count: {selectedQuestions.length}</p>
            </div>
          )}

          {/* STEP 4: Anti Cheating proctoring */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Proctor security levels</span>
                <div className="grid grid-cols-3 gap-3">
                  {['basic', 'moderate', 'strict'].map((level) => (
                    <div
                      key={level}
                      onClick={() => {
                        setProctorLevel(level);
                        if (level === 'strict') {
                          setFullscreenRequired(true);
                          setWebcamRequired(true);
                        } else {
                          setFullscreenRequired(false);
                          setWebcamRequired(false);
                        }
                      }}
                      className={`border p-3 rounded-lg text-center cursor-pointer transition-all ${
                        proctorLevel === level ? 'border-brand-blue bg-brand-blue/5 font-bold' : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <span className="text-xs uppercase block">{level}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input label="Max warning tab switch tolerances" id="warn" type="number" value={tabSwitchLimit} onChange={(e) => setTabSwitchLimit(e.target.value)} />
                <div className="flex flex-col gap-2 pt-6">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 cursor-pointer select-none">
                    <input type="checkbox" checked={fullscreenRequired} onChange={(e) => setFullscreenRequired(e.target.checked)} className="rounded text-brand-blue" />
                    Lock Fullscreen browser
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 cursor-pointer select-none">
                    <input type="checkbox" checked={webcamRequired} onChange={(e) => setWebcamRequired(e.target.checked)} className="rounded text-brand-blue" />
                    Activate Webcam proctoring PIP
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Final Review */}
          {step === 5 && (
            <div className="space-y-4 bg-slate-50 dark:bg-darkBg border border-slate-200/50 dark:border-slate-850 p-5 rounded-2xl">
              <h4 className="text-xs font-bold text-slate-850 dark:text-white uppercase tracking-wider mb-2">Examination blueprints recap</h4>
              
              <div className="grid grid-cols-2 gap-y-3 text-xs">
                <p><span className="text-slate-400">Title:</span> {title}</p>
                <p><span className="text-slate-400">Duration:</span> {duration} minutes</p>
                <p><span className="text-slate-400">Category:</span> {category}</p>
                <p><span className="text-slate-400">Linked Questions:</span> {selectedQuestions.length}</p>
                <p><span className="text-slate-400">Security Type:</span> {proctorLevel.toUpperCase()}</p>
                <p><span className="text-slate-400">Attempts Permit:</span> {maxAttempts}</p>
              </div>
            </div>
          )}

          {/* Stepper buttons controls */}
          <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
            <Button variant="outline" size="sm" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}>
              Back
            </Button>

            {step < 5 ? (
              <Button size="sm" onClick={() => setStep((s) => Math.min(5, s + 1))}>
                Continue <ChevronRight size={14} className="ml-1" />
              </Button>
            ) : (
              <Button size="sm" onClick={handleSaveExam}>
                Verify & Publish Exam
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Exams;
