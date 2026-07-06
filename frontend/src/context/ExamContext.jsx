import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import api from '../services/api';

const ExamContext = createContext();

export const ExamProvider = ({ children }) => {
  const [activeExam, setActiveExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [violationsCount, setViolationsCount] = useState(0);
  const [showViolationWarning, setShowViolationWarning] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [sessionRestored, setSessionRestored] = useState(false);

  const timerRef = useRef(null);
  const answersRef = useRef(answers);
  const timeLeftRef = useRef(timeLeft);

  // Sync ref with state
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  // Timer Countdown
  useEffect(() => {
    if (activeExam && timeLeft > 0 && !submitting) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            autoSubmitExam();
            return 0;
          }
          // Backup to localStorage every 15s
          if (prev % 15 === 0) {
            saveToLocalStorage();
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeExam, timeLeft, submitting]);

  const saveToLocalStorage = () => {
    if (!activeExam) return;
    const backup = {
      answers: answersRef.current,
      timeLeft: timeLeftRef.current,
      examId: activeExam._id
    };
    localStorage.setItem(`exam_backup_${activeExam._id}`, JSON.stringify(backup));
  };

  const restoreFromLocalStorage = (examId, serverDuration) => {
    const backupStr = localStorage.getItem(`exam_backup_${examId}`);
    if (backupStr) {
      try {
        const backup = JSON.parse(backupStr);
        if (backup.examId === examId) {
          setAnswers(backup.answers || {});
          // Use smaller of remaining times to avoid cheating via refresh
          setTimeLeft(Math.min(backup.timeLeft, serverDuration));
          setSessionRestored(true);
          return true;
        }
      } catch (err) {
        console.error('Failed to restore local exam state', err);
      }
    }
    return false;
  };

  const startExamSession = async (examId) => {
    try {
      const response = await api.get(`/exams/student/${examId}/start`);
      const { exam, startTime, savedAnswers } = response.data.data;

      setActiveExam(exam);
      setQuestions(exam.questions);
      setCurrentIdx(0);
      setViolationsCount(0);
      setShowViolationWarning(null);

      // Parse server answers
      const parsedSaved = {};
      if (savedAnswers && savedAnswers.length) {
        savedAnswers.forEach((ans) => {
          parsedSaved[ans.question] = {
            selectedOption: ans.selectedOption,
            textAnswer: ans.textAnswer,
            codeAnswer: ans.codeAnswer,
            status: ans.status,
            timeSpent: ans.timeSpent || 0
          };
        });
      }
      setAnswers(parsedSaved);

      // Calculate timer countdown
      const start = new Date(startTime);
      const elapsedSeconds = Math.round((new Date() - start) / 1000);
      const totalSeconds = exam.duration * 60;
      const remainingSeconds = Math.max(0, totalSeconds - elapsedSeconds);

      // Check local storage for backup restoration
      const restored = restoreFromLocalStorage(examId, remainingSeconds);
      if (!restored) {
        setTimeLeft(remainingSeconds);
      }
    } catch (err) {
      console.error('Failed to initiate exam', err);
      throw err.response?.data || err;
    }
  };

  const updateAnswer = (questionId, fields) => {
    setAnswers((prev) => {
      const updated = {
        ...prev,
        [questionId]: {
          ...(prev[questionId] || { timeSpent: 0, status: 'answered' }),
          ...fields
        }
      };
      // Auto sync single answer on change to backend
      syncAnswerWithServer(questionId, updated[questionId]);
      return updated;
    });
  };

  const syncAnswerWithServer = async (questionId, answerData) => {
    if (!activeExam) return;
    try {
      await api.post(`/exams/student/${activeExam._id}/save-answer`, {
        questionId,
        ...answerData
      });
    } catch (err) {
      console.error('Sync failed', err);
    }
  };

  const triggerViolation = async (type, details) => {
    if (!activeExam) return;
    try {
      const response = await api.post(`/exams/student/${activeExam._id}/violation`, {
        type,
        details
      });
      const { violationCount, autoSubmitted } = response.data.data;
      
      setViolationsCount(violationCount);
      setShowViolationWarning({ type, count: violationCount, limit: 3 });

      if (autoSubmitted) {
        autoSubmitExam();
      }
    } catch (err) {
      console.error('Violation logger failed', err);
    }
  };

  const submitExamSession = async () => {
    if (!activeExam) return;
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      // Sync remaining unsaved fields to backend first
      const finalAnswersList = Object.keys(answers).map((qId) => ({
        questionId: qId,
        ...answers[qId]
      }));

      // Submit
      const response = await api.post(`/results/student/${activeExam._id}/submit`);
      
      // Cleanup localStorage
      localStorage.removeItem(`exam_backup_${activeExam._id}`);
      
      setActiveExam(null);
      return response.data.data;
    } catch (err) {
      console.error('Failed submitting exam', err);
      throw err.response?.data || err;
    } finally {
      setSubmitting(false);
    }
  };

  const autoSubmitExam = async () => {
    try {
      await submitExamSession();
      window.dispatchEvent(new Event('exam_autosubmitted'));
    } catch (err) {
      console.error('Autosubmission failed', err);
    }
  };

  return (
    <ExamContext.Provider
      value={{
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
      }}
    >
      {children}
    </ExamContext.Provider>
  );
};

export const useExam = () => useContext(ExamContext);
export default ExamContext;
