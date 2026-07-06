import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExam } from '../../context/ExamContext';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, AlertTriangle, Play, HelpCircle, Monitor, Camera, RefreshCw, Layers, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import ProgressBar from '../../components/ui/ProgressBar';
import toast from 'react-hot-toast';
import api from '../../services/api';

const ExamInterface = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const {
    activeExam,
    questions,
    currentIdx,
    setCurrentIdx,
    answers,
    timeLeft,
    violationsCount,
    showViolationWarning,
    setShowViolationWarning,
    submitting,
    startExamSession,
    updateAnswer,
    triggerViolation,
    submitExamSession
  } = useExam();

  const [inExam, setInExam] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedProctor, setAgreedProctor] = useState(false);
  const [systemCheck, setSystemCheck] = useState({ webcam: 'checking', screen: 'checking', internet: 'checking' });
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [webcamStream, setWebcamStream] = useState(null);
  const [examDetails, setExamDetails] = useState(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  
  const videoRef = useRef(null);
  const previewVideoRef = useRef(null);
  const inExamRef = useRef(inExam);
  const cocoModelRef = useRef(null);

  useEffect(() => {
    inExamRef.current = inExam;
  }, [inExam]);

  // Load TensorFlow.js and COCO-SSD model dynamically on mount
  useEffect(() => {
    const loadTFAndModel = async () => {
      try {
        if (!window.tf || !window.cocoSsd) {
          await new Promise((resolve) => {
            const tfScript = document.createElement('script');
            tfScript.src = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.10.0/dist/tf.min.js";
            tfScript.async = true;
            tfScript.onload = () => {
              const cocoScript = document.createElement('script');
              cocoScript.src = "https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js";
              cocoScript.async = true;
              cocoScript.onload = () => resolve();
              document.body.appendChild(cocoScript);
            };
            document.body.appendChild(tfScript);
          });
        }

        console.log('Loading COCO-SSD model...');
        const model = await window.cocoSsd.load({ base: 'lite_mobilenet_v2' });
        cocoModelRef.current = model;
        setModelLoaded(true);
        console.log('COCO-SSD model loaded successfully.');
      } catch (err) {
        console.error('COCO-SSD model load failed:', err);
      }
    };

    loadTFAndModel();
  }, []);
  
  // Local state for active inputs
  const [mcqSel, setMcqSel] = useState('');
  const [textSel, setTextSel] = useState('');
  const [codeSel, setCodeSel] = useState('');

  // Active question details
  const currentQuestion = questions[currentIdx]?.question || questions[currentIdx];

  // Fetch exam details on mount
  useEffect(() => {
    const fetchExamDetails = async () => {
      try {
        const response = await api.get(`/exams/${examId}`);
        setExamDetails(response.data.data);
      } catch (err) {
        console.error('Failed to fetch exam details', err);
        toast.error('Failed to load exam details');
      }
    };
    if (examId) {
      fetchExamDetails();
    }
  }, [examId]);

  // Initiate real system checks once exam details are resolved
  useEffect(() => {
    let activeStream = null;
    const runChecks = async () => {
      // 1. Internet Check
      const isOnline = navigator.onLine;
      setSystemCheck(prev => ({ ...prev, internet: isOnline ? 'ready' : 'error' }));

      // 2. Fullscreen Support Check
      const fullscreenSupported = !!document.documentElement.requestFullscreen;
      setSystemCheck(prev => ({ ...prev, screen: fullscreenSupported ? 'ready' : 'error' }));

      // 3. Real Webcam Check
      const webcamNeeded = examDetails?.proctoring?.webcamRequired || examDetails?.proctoring?.level !== 'basic';
      if (webcamNeeded) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
          activeStream = stream;
          setWebcamStream(stream);
          setSystemCheck(prev => ({ ...prev, webcam: 'ready' }));
        } catch (err) {
          console.error('Webcam check failed:', err);
          setSystemCheck(prev => ({ ...prev, webcam: 'error' }));
          toast.error('Webcam access is required for this exam. Please enable camera permission.');
        }
      } else {
        // Not strictly required, request if allowed but don't block
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
          activeStream = stream;
          setWebcamStream(stream);
        } catch (err) {
          console.log('Optional webcam access denied');
        }
        setSystemCheck(prev => ({ ...prev, webcam: 'ready' }));
      }
    };

    if (!inExam && examDetails) {
      runChecks();
    }

    return () => {
      // Cleanup stream if component unmounts and we did not enter exam
      if (!inExamRef.current && activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [inExam, examDetails]);

  // Bind stream to preview element
  useEffect(() => {
    if (previewVideoRef.current && webcamStream) {
      previewVideoRef.current.srcObject = webcamStream;
      previewVideoRef.current.play().catch(err => console.error('Preview play error:', err));
    }
  }, [webcamStream, inExam]);

  // Bind stream to exam room element
  useEffect(() => {
    if (videoRef.current && webcamStream && inExam) {
      videoRef.current.srcObject = webcamStream;
      videoRef.current.play().catch(err => console.error('Active feed play error:', err));
    }
  }, [webcamStream, inExam]);

  // Stop all camera tracks on final cleanup
  useEffect(() => {
    return () => {
      if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [webcamStream]);

  // Real camera pixel & COCO-SSD object proctoring loop
  useEffect(() => {
    if (!inExam || !webcamStream || !modelLoaded) return;

    let lastFrameData = null;
    let noMotionTicks = 0;

    const interval = setInterval(async () => {
      const videoElement = videoRef.current;
      if (videoElement && videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
        // 1. Pixel/Motion checks using canvas
        const canvas = document.createElement('canvas');
        canvas.width = 80;
        canvas.height = 60;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = frame.data;

        let totalBrightness = 0;
        let diff = 0;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i+1];
          const b = data[i+2];
          const brightness = (r + g + b) / 3;
          totalBrightness += brightness;

          if (lastFrameData) {
            diff += Math.abs(brightness - lastFrameData[i/4]);
          }
        }

        const avgBrightness = totalBrightness / (canvas.width * canvas.height);
        const avgDiff = lastFrameData ? diff / (canvas.width * canvas.height) : 10;

        const currentFrameBrightnesses = new Float32Array(canvas.width * canvas.height);
        for (let i = 0; i < data.length; i += 4) {
          currentFrameBrightnesses[i/4] = (data[i] + data[i+1] + data[i+2]) / 3;
        }
        lastFrameData = currentFrameBrightnesses;

        // Cover check
        if (avgBrightness < 15) {
          triggerViolation('face_not_visible', 'Webcam is blocked or camera feed is too dark.');
          toast.error('Warning! Face not visible. Ensure your face is well-lit and the camera is uncovered.', { id: 'cam-dark' });
        }
        // Motion check
        else if (avgDiff < 0.8) {
          noMotionTicks++;
          if (noMotionTicks >= 3) {
            triggerViolation('face_not_visible', 'No candidate presence or activity detected in camera feed.');
            toast.error('Warning! Please stay in front of your webcam.', { id: 'cam-motion' });
            noMotionTicks = 0;
          }
        } else {
          noMotionTicks = 0;
        }

        // 2. Real-time COCO-SSD Object detection (Cell Phone)
        if (cocoModelRef.current) {
          try {
            const predictions = await cocoModelRef.current.detect(videoElement);
            // Lower threshold to 0.35 for high sensitivity to detect any phone orientation
            const phonePrediction = predictions.find(p => (p.class === 'cell phone' || p.class === 'phone') && p.score > 0.35);
            if (phonePrediction) {
              console.log('CELL PHONE DETECTED:', phonePrediction);
              triggerViolation('mobile_phone', `Cell phone detected in webcam view with confidence: ${Math.round(phonePrediction.score * 100)}%`);
              toast.error('Warning! Mobile phone detected in hand!', { id: 'cam-phone' });
            }
          } catch (err) {
            console.error('COCO detection execution error:', err);
          }
        }
      }
    }, 4000); // Check every 4 seconds for high responsiveness

    return () => {
      clearInterval(interval);
    };
  }, [inExam, webcamStream, modelLoaded]);

  // Load question fields on index change
  useEffect(() => {
    if (activeExam && currentQuestion) {
      const saved = answers[currentQuestion._id];
      if (saved) {
        setMcqSel(saved.selectedOption || '');
        setTextSel(saved.textAnswer || '');
        setCodeSel(saved.codeAnswer || currentQuestion.codingDetails?.starterCode || '');
      } else {
        setMcqSel('');
        setTextSel('');
        setCodeSel(currentQuestion.codingDetails?.starterCode || '');
      }
    }
  }, [currentIdx, activeExam, questions]);

  // SECURITY ENFORCEMENT INTERCEPTORS
  useEffect(() => {
    if (!inExam || !activeExam) return;

    // 1. Tab switches (Visibilitychange)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerViolation('tab_switch', 'User switched browser tab or minimized window');
        toast.error('Warning! Tab switching is recorded as a violation!', { id: 'vis-violation' });
      }
    };

    // 2. Fullscreen exiting
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        triggerViolation('fullscreen_exit', 'User exited fullscreen window lockdown mode');
        toast.error('Warning! Fullscreen exit detected! Return to fullscreen to proceed.', { id: 'fs-violation' });
      }
    };

    // 3. Block Shortcuts & Copy-Paste
    const handleKeyDown = (e) => {
      if (activeExam.proctoring?.disableCopyPaste) {
        const isCtrl = e.ctrlKey || e.metaKey;
        const key = e.key.toLowerCase();
        
        if (isCtrl && ['c', 'v', 'x', 'u', 'p', 's', 'a'].includes(key)) {
          e.preventDefault();
          triggerViolation('copy_attempt', `Blocked shortcut key: Ctrl+${key.toUpperCase()}`);
          toast.error('Copy/Paste operations are disabled during this exam!');
        }
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      triggerViolation('right_click', 'Blocked context menu click event');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);

    // Watch auto-submit event from context
    const handleAutoSub = () => {
      toast.error('Exam auto-submitted due to security violations limit!');
      setTimeout(() => {
        navigate('/student/dashboard');
      }, 3000);
    };
    window.addEventListener('exam_autosubmitted', handleAutoSub);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('exam_autosubmitted', handleAutoSub);
    };
  }, [inExam, activeExam]);

  const enterExamLockdown = async () => {
    try {
      await startExamSession(examId);
      
      // Request Fullscreen
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
      }
      
      inExamRef.current = true;
      setInExam(true);
      toast.success('Security lockdown active. All activities are monitored.');
    } catch (err) {
      toast.error('Failed to initialize security checks.');
    }
  };

  const handleSaveResponse = () => {
    if (!currentQuestion) return;
    
    // Save locally and sync backend
    updateAnswer(currentQuestion._id, {
      selectedOption: mcqSel,
      textAnswer: textSel,
      codeAnswer: codeSel,
      status: 'answered'
    });
    
    toast.success('Response saved.', { duration: 1000 });
  };

  const handleMarkReview = () => {
    if (!currentQuestion) return;
    updateAnswer(currentQuestion._id, {
      selectedOption: mcqSel,
      textAnswer: textSel,
      codeAnswer: codeSel,
      status: 'marked_for_review'
    });
    toast.success('Marked for review.', { duration: 1000 });
  };

  const handleFinalSubmit = async () => {
    setConfirmSubmitOpen(false);
    try {
      const res = await submitExamSession();
      // Exit Fullscreen
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
      toast.success('Exam submitted successfully!');
      navigate(`/student/results/${res._id}`);
    } catch (err) {
      toast.error('Failed submitting responses.');
    }
  };

  // Compile formatting for Timer countdown HH:MM:SS
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (timeLeft < 120) return 'text-brand-red animate-pulse bg-red-950/20'; // under 2 mins
    if (timeLeft < 600) return 'text-brand-amber bg-amber-950/20'; // under 10 mins
    return 'text-slate-700 bg-slate-100 dark:text-darkText dark:bg-darkElevated';
  };

  // PRE-EXAM SCREEN
  if (!inExam) {
    return (
      <div className="min-h-screen w-screen bg-slate-50 dark:bg-darkBg flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white dark:bg-darkSurface border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-brand-blue/15 flex items-center justify-center text-brand-blue text-lg">💡</div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Security Integrity System Checks</h2>
              <p className="text-xs text-slate-450 dark:text-darkMuted">Verification of system configuration parameters before locking browser.</p>
            </div>
          </div>

          {/* Checks status */}
          <div className="grid grid-cols-3 gap-4 border-y border-slate-100 dark:border-slate-800 py-5">
            <div className="text-center space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Network Connection</span>
              <Badge variant={systemCheck.internet === 'ready' ? 'success' : 'neutral'}>
                {systemCheck.internet === 'ready' ? 'Stable' : 'Verifying'}
              </Badge>
            </div>
            <div className="text-center space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Fullscreen Module</span>
              <Badge variant={systemCheck.screen === 'ready' ? 'success' : 'neutral'}>
                {systemCheck.screen === 'ready' ? 'Supported' : 'Verifying'}
              </Badge>
            </div>
            <div className="text-center space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Webcam Feed</span>
              <Badge variant={systemCheck.webcam === 'ready' ? 'success' : 'neutral'}>
                {systemCheck.webcam === 'ready' ? 'Ready' : 'Checking'}
              </Badge>
            </div>
          </div>

          {webcamStream && (
            <div className="w-full h-44 bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 relative shadow-inner flex items-center justify-center">
              <video
                ref={previewVideoRef}
                muted
                playsInline
                className="w-full h-full object-cover scale-x-[-1]"
              />
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] font-bold text-white flex items-center gap-1.5 border border-white/10">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-emerald animate-pulse" /> Live Camera Check
              </div>
            </div>
          )}

          {/* Rules checkboxes */}
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer text-xs leading-relaxed text-slate-500 dark:text-darkMuted select-none">
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="mt-0.5 rounded border-slate-350 dark:border-slate-805 text-brand-blue"
              />
              <span>I acknowledge that starting this exam initiates a fullscreen lockdown. Tab switching or exiting is monitored as a violation.</span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer text-xs leading-relaxed text-slate-500 dark:text-darkMuted select-none">
              <input
                type="checkbox"
                checked={agreedProctor}
                onChange={(e) => setAgreedProctor(e.target.checked)}
                className="mt-0.5 rounded border-slate-350 dark:border-slate-850 text-brand-blue"
              />
              <span>I consent to live AI-powered proctoring logging system screenshots and webcam telemetry during the evaluation.</span>
            </label>
          </div>

          <Button
            onClick={enterExamLockdown}
            disabled={!agreedTerms || !agreedProctor || systemCheck.webcam !== 'ready'}
            className="w-full"
          >
            Authenticate & Start Exam
          </Button>
        </div>
      </div>
    );
  }

  // SYSTEM DOWNLOADING STATE
  if (!activeExam) return null;

  // LOCKDOWN EXAMINATION ROOM SCREEN
  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 dark:bg-darkBg overflow-hidden select-none">
      {/* Top Header Bar */}
      <header className="h-16 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between px-6 shrink-0 relative z-20">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-brand-blue/20 flex items-center justify-center text-brand-blue text-sm">🎓</div>
          <div>
            <h1 className="text-xs font-bold truncate max-w-sm">{activeExam.title}</h1>
            <p className="text-[9px] text-slate-400 font-medium">Candidate: {user.fullName}</p>
          </div>
        </div>

        {/* Timer monospaced count */}
        <div className={`px-4 py-1.5 rounded-full font-mono text-xs font-bold flex items-center gap-1.5 ${getTimerColor()}`}>
          <span>⏱️</span>
          <span>{formatTime(timeLeft)}</span>
        </div>

        <Button variant="danger" size="sm" onClick={() => setConfirmSubmitOpen(true)}>
          Submit Exam
        </Button>
      </header>

      {/* Progress Bar under header */}
      <div className="h-1 w-full bg-slate-800 shrink-0">
        <div
          className="h-full bg-brand-emerald transition-all duration-300"
          style={{
            width: `${Math.round(
              (Object.keys(answers).filter((k) => answers[k]?.status === 'answered').length / questions.length) * 100
            )}%`
          }}
        />
      </div>

      {/* Main split workarea */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Question Palette (numbered matrix) */}
        <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-darkSurface p-4 overflow-y-auto shrink-0 flex flex-col gap-4">
          <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block">Question Palette</span>
          
          <div className="grid grid-cols-4 gap-2">
            {questions.map((_, idx) => {
              const qId = questions[idx]?.question?._id || questions[idx]?._id;
              const ansState = answers[qId];
              
              let btnClass = 'border-slate-200 bg-white text-slate-800 dark:border-slate-800 dark:bg-darkSurface dark:text-darkText';
              
              if (currentIdx === idx) {
                btnClass = 'ring-2 ring-brand-blue border-brand-blue dark:ring-brand-blueLight dark:border-brand-blueLight text-brand-blue dark:text-brand-blueLight font-bold';
              } else if (ansState?.status === 'marked_for_review') {
                btnClass = 'bg-brand-violet/20 border-brand-violet text-brand-violet font-semibold';
              } else if (ansState?.status === 'answered') {
                btnClass = 'bg-brand-emerald/10 border-brand-emerald text-brand-emerald font-semibold dark:bg-brand-emerald/20';
              }

              return (
                <button
                  key={idx}
                  onClick={() => setCurrentIdx(idx)}
                  className={`h-9 w-9 rounded-lg border text-xs flex items-center justify-center transition-all ${btnClass}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Palette Legend */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-auto space-y-2 text-[10px] text-slate-400 dark:text-darkMuted font-semibold">
            <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-md bg-brand-emerald/10 border border-brand-emerald" /> Answered</div>
            <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-md bg-brand-violet/20 border border-brand-violet" /> Marked Review</div>
            <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-md bg-white border border-slate-200 dark:bg-darkSurface dark:border-slate-800" /> Unvisited</div>
          </div>
        </aside>

        {/* Center Panel: Active Question Answer Sheets */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col gap-6">
          {/* Question Meta Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-800 dark:text-white">Question {currentIdx + 1}</span>
              <Badge variant="info">{currentQuestion?.type?.replace('_', ' ')}</Badge>
            </div>
            <span className="text-xs text-slate-400 dark:text-darkMuted font-semibold">Marks: {questions[currentIdx]?.marks || activeExam.questions[currentIdx]?.marks || 1}</span>
          </div>

          {/* Question Text */}
          <div className="text-sm font-medium text-slate-800 dark:text-white leading-relaxed border-b border-slate-100 dark:border-slate-805 pb-5">
            {currentQuestion?.text}
          </div>

          {/* Input sheets by question types */}
          <div className="flex-1">
            {/* MCQ SINGLE SELECT */}
            {currentQuestion?.type === 'mcq_single' && (
              <div className="space-y-3">
                {currentQuestion.options.map((opt, oIdx) => (
                  <label
                    key={oIdx}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                      String(oIdx) === String(mcqSel)
                        ? 'border-brand-blue bg-brand-blue/5 dark:border-brand-blueLight dark:bg-brand-blue/10 text-brand-blue dark:text-brand-blueLight font-semibold'
                        : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="mcq"
                      checked={String(oIdx) === String(mcqSel)}
                      onChange={() => setMcqSel(String(oIdx))}
                      className="text-brand-blue focus:ring-brand-blue h-4 w-4"
                    />
                    <span className="text-xs">{opt.text}</span>
                  </label>
                ))}
              </div>
            )}

            {/* TRUE OR FALSE SELECT */}
            {currentQuestion?.type === 'true_false' && (
              <div className="grid grid-cols-2 gap-4">
                {['True', 'False'].map((val) => (
                  <button
                    key={val}
                    onClick={() => setTextSel(val)}
                    className={`py-6 rounded-xl border text-sm font-bold transition-all ${
                      textSel === val
                        ? 'border-brand-blue bg-brand-blue/5 text-brand-blue dark:border-brand-blueLight dark:bg-brand-blue/10 dark:text-brand-blueLight'
                        : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    {val.toUpperCase()}
                  </button>
                ))}
              </div>
            )}

            {/* SUBJECTIVE TEXT EDITOR */}
            {currentQuestion?.type === 'subjective' && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Answer Response Description</label>
                <textarea
                  rows={8}
                  placeholder="Draft your paragraph response here..."
                  value={textSel}
                  onChange={(e) => setTextSel(e.target.value)}
                  className="w-full bg-white border border-slate-200 dark:bg-darkSurface dark:border-slate-800 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue resize-none leading-relaxed"
                />
              </div>
            )}

            {/* CODING MONACO-LIKE EDITOR */}
            {currentQuestion?.type === 'coding' && (
              <div className="flex flex-col h-[350px] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-900 text-white font-mono">
                {/* Editor Header */}
                <div className="h-10 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between text-[10px] text-slate-400">
                  <span>source.{currentQuestion.codingDetails?.language === 'javascript' ? 'js' : 'py'}</span>
                  <span>JetBrains Mono</span>
                </div>

                <div className="flex-1 flex">
                  {/* Mock line numbers */}
                  <div className="w-10 bg-slate-950/50 text-right pr-2 py-4 select-none text-[10px] text-slate-600 border-r border-slate-800/30">
                    {Array.from({ length: 15 }).map((_, idx) => (
                      <div key={idx}>{idx + 1}</div>
                    ))}
                  </div>
                  
                  <textarea
                    value={codeSel}
                    onChange={(e) => setCodeSel(e.target.value)}
                    className="flex-1 bg-transparent p-4 text-[11px] outline-none border-none resize-none overflow-y-auto leading-relaxed text-slate-100 placeholder-slate-700"
                    placeholder="// Write solution code structure here"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action bottom bar */}
          <div className="border-t border-slate-200 dark:border-slate-805 pt-6 flex items-center justify-between shrink-0">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                disabled={currentIdx === 0}
              >
                <ChevronLeft size={16} className="mr-0.5" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1))}
                disabled={currentIdx === questions.length - 1}
              >
                Next <ChevronRight size={16} className="ml-0.5" />
              </Button>
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleMarkReview}>
                Mark Review
              </Button>
              <Button size="sm" onClick={handleSaveResponse}>
                Save Response
              </Button>
            </div>
          </div>
        </main>
      </div>

      {/* Confirmation Submit modal */}
      <Modal isOpen={confirmSubmitOpen} onClose={() => setConfirmSubmitOpen(false)} title="Confirm Exam Submission">
        <div className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-darkMuted leading-relaxed">
            Are you sure you want to compile and terminate this exam session? You answered{' '}
            <strong>{Object.keys(answers).length}</strong> out of <strong>{questions.length}</strong> questions.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmSubmitOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleFinalSubmit}>
              Submit Responses
            </Button>
          </div>
        </div>
      </Modal>

      {/* Security Violation Overlay block */}
      {showViolationWarning && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-red-900 rounded-3xl p-6 text-white text-center space-y-6 shadow-2xl">
            <div className="h-14 w-14 rounded-full bg-red-950/40 border border-red-500 flex items-center justify-center text-red-500 text-2xl mx-auto animate-pulse">
              🚨
            </div>
            <div className="space-y-2">
              <h3 className="text-md font-extrabold text-red-400">
                {showViolationWarning.type === 'multiple_faces' && 'Multiple Faces Detected'}
                {showViolationWarning.type === 'face_not_visible' && 'Webcam Feed Blocked / Invisible'}
                {showViolationWarning.type === 'mobile_phone' && 'Mobile Phone / Tablet Detected'}
                {showViolationWarning.type !== 'multiple_faces' && showViolationWarning.type !== 'face_not_visible' && showViolationWarning.type !== 'mobile_phone' && 'Security Breach Alert'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {showViolationWarning.type === 'multiple_faces' && 'Proctoring system detected secondary individuals in your camera feed. Please take the evaluation completely alone.'}
                {showViolationWarning.type === 'face_not_visible' && 'Please ensure your face is fully visible in front of the camera and well-lit. Do not block the camera lens.'}
                {showViolationWarning.type === 'mobile_phone' && 'Proctoring system detected an unauthorized device (mobile phone/tablet) in the camera field of view. Please put away all devices.'}
                {showViolationWarning.type !== 'multiple_faces' && showViolationWarning.type !== 'face_not_visible' && showViolationWarning.type !== 'mobile_phone' && 'A system violation was logged. Exiting fullscreen lock downs or switching browser tabs is prohibited.'}
              </p>
            </div>
            
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
              <p className="text-slate-400 font-bold">Total Violations logged: {showViolationWarning.count} / {showViolationWarning.limit}</p>
            </div>

            <Button onClick={() => setShowViolationWarning(null)} className="w-full bg-red-650 hover:bg-red-700">
              Return to Lockdown Exam Room
            </Button>
          </div>
        </div>
      )}

      {/* Floating Proctoring Webcam PIP */}
      {inExam && webcamStream && (
        <div className="fixed bottom-20 right-6 z-40 w-36 h-48 bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md flex flex-col group hover:w-44 hover:h-60 transition-all duration-300">
          <video
            ref={videoRef}
            muted
            playsInline
            className="flex-1 object-cover scale-x-[-1]"
          />
          <div className="h-6 bg-slate-900 border-t border-slate-800 px-2 flex items-center justify-between text-[8px] text-slate-400 font-bold shrink-0">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-emerald animate-pulse" /> PROCTOR ACTIVE
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamInterface;
