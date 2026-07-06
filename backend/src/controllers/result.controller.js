import Exam from '../models/Exam.js';
import Question from '../models/Question.js';
import ExamResponse from '../models/ExamResponse.js';
import Result from '../models/Result.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ROLES } from '../constants/index.js';

// Grading logic helper
const gradeExamResponse = async (exam, response) => {
  let obtainedMarks = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let skippedCount = 0;
  
  const questionBreakdown = [];
  const subjectWiseMap = {};
  const topicWiseMap = {};

  for (const item of exam.questions) {
    const qDetails = item.question;
    const studentAns = response.answers.find((ans) => ans.question.toString() === qDetails._id.toString());

    let isCorrect = false;
    let earnedMarks = 0;
    let status = 'skipped';
    let studentProvidedValue = null;

    const maxMarks = item.marks;
    const category = qDetails.category || 'General';
    const topics = qDetails.topics || ['Unassigned'];

    if (studentAns) {
      status = studentAns.status;
      
      if (status === 'answered' || status === 'marked_for_review') {
        switch (qDetails.type) {
          case 'mcq_single':
            studentProvidedValue = studentAns.selectedOption;
            // Check if selected option is marked correct
            const correctOptIdx = qDetails.options.findIndex(opt => opt.isCorrect);
            if (correctOptIdx !== -1 && String(correctOptIdx) === String(studentProvidedValue)) {
              isCorrect = true;
            }
            break;

          case 'mcq_multiple':
            studentProvidedValue = studentAns.selectedOption; // should be array of indices
            if (Array.isArray(studentProvidedValue)) {
              const correctIndices = qDetails.options
                .map((opt, idx) => (opt.isCorrect ? idx : null))
                .filter((idx) => idx !== null);

              const isMatch =
                studentProvidedValue.length === correctIndices.length &&
                studentProvidedValue.every((val) => correctIndices.includes(parseInt(val, 10)));
              
              if (isMatch) {
                isCorrect = true;
              }
            }
            break;

          case 'true_false':
            studentProvidedValue = studentAns.textAnswer; // "true" or "false"
            const correctTF = String(qDetails.correctAnswer).toLowerCase();
            if (studentProvidedValue && String(studentProvidedValue).toLowerCase() === correctTF) {
              isCorrect = true;
            }
            break;

          case 'fill_blank':
            studentProvidedValue = studentAns.textAnswer; // string
            if (studentProvidedValue && qDetails.correctAnswer) {
              const acceptedAnswers = String(qDetails.correctAnswer)
                .split(',')
                .map((ans) => ans.trim().toLowerCase());
              
              if (acceptedAnswers.includes(studentProvidedValue.trim().toLowerCase())) {
                isCorrect = true;
              }
            }
            break;

          case 'subjective':
            // Subjective questions requires manual grading or a basic length/keywords checker
            studentProvidedValue = studentAns.textAnswer;
            if (studentProvidedValue && studentProvidedValue.length > 20) {
              // Simulating auto-grade if keywords match or word count exceeds threshold
              isCorrect = true;
              earnedMarks = Math.round(maxMarks * 0.8); // 80% mark mockup
            }
            break;

          case 'coding':
            studentProvidedValue = studentAns.codeAnswer;
            // Execute mock tests: if the code compiles or contains key terms matching test solutions
            if (studentProvidedValue) {
              // Basic heuristic grading: compile simulation based on syntax existence
              const testCases = qDetails.codingDetails?.testCases || [];
              let passedTests = 0;

              testCases.forEach((tc) => {
                // Mock execution matching key logical components
                if (studentProvidedValue.includes('return') || studentProvidedValue.includes('console.log')) {
                  passedTests++;
                }
              });

              const passRatio = testCases.length ? passedTests / testCases.length : 1;
              earnedMarks = Math.round(maxMarks * passRatio);
              isCorrect = passRatio >= 0.7; // correct if 70% of testcases pass
            }
            break;
        }
      }
    }

    if (status === 'skipped' || (!studentProvidedValue && studentProvidedValue !== 0)) {
      skippedCount++;
      status = 'skipped';
    } else if (isCorrect) {
      correctCount++;
      if (qDetails.type !== 'subjective' && qDetails.type !== 'coding') {
        earnedMarks = maxMarks;
      }
    } else {
      incorrectCount++;
      // Apply negative marking
      if (exam.negativeMarking?.enabled) {
        earnedMarks = -Math.abs(exam.negativeMarking.value);
      } else {
        earnedMarks = 0;
      }
    }

    obtainedMarks += earnedMarks;

    // Update student response schema record for this question
    if (studentAns) {
      studentAns.isCorrect = isCorrect;
      studentAns.marksObtained = earnedMarks;
    }

    // Save breakdown details
    questionBreakdown.push({
      question: qDetails._id,
      studentAnswer: studentProvidedValue,
      correctAnswer: qDetails.type === 'mcq_single' || qDetails.type === 'mcq_multiple'
        ? qDetails.options.map((o) => (o.isCorrect ? o.text : null)).filter(Boolean)
        : qDetails.correctAnswer,
      isCorrect,
      marksObtained: earnedMarks,
      timeSpent: studentAns ? studentAns.timeSpent : 0,
      status
    });

    // Populate Category stats
    if (!subjectWiseMap[category]) {
      subjectWiseMap[category] = { total: 0, obtained: 0 };
    }
    subjectWiseMap[category].total += maxMarks;
    subjectWiseMap[category].obtained += Math.max(0, earnedMarks);

    // Populate Topic stats
    topics.forEach((topic) => {
      if (!topicWiseMap[topic]) {
        topicWiseMap[topic] = { total: 0, obtained: 0 };
      }
      topicWiseMap[topic].total += maxMarks;
      topicWiseMap[topic].obtained += Math.max(0, earnedMarks);
    });
  }

  // Format category/topic results
  const subjectWise = Object.keys(subjectWiseMap).map((subj) => ({
    subject: subj,
    total: subjectWiseMap[subj].total,
    obtained: subjectWiseMap[subj].obtained,
    percentage: Math.round((subjectWiseMap[subj].obtained / subjectWiseMap[subj].total) * 100)
  }));

  const topicWise = Object.keys(topicWiseMap).map((topic) => ({
    topic,
    total: topicWiseMap[topic].total,
    obtained: topicWiseMap[topic].obtained,
    percentage: Math.round((topicWiseMap[topic].obtained / topicWiseMap[topic].total) * 100)
  }));

  obtainedMarks = Math.max(0, obtainedMarks);
  const percentage = Math.round((obtainedMarks / exam.totalMarks) * 100);
  const passed = percentage >= exam.passingMarks;

  return {
    totalQuestions: exam.questions.length,
    attemptedQuestions: correctCount + incorrectCount,
    correctAnswers: correctCount,
    incorrectAnswers: incorrectCount,
    skippedQuestions: skippedCount,
    obtainedMarks,
    percentage,
    passed,
    subjectWise,
    topicWise,
    questionBreakdown
  };
};

export const submitExam = async (req, res, next) => {
  try {
    const { id } = req.params; // Exam ID
    const studentId = req.user._id;

    const exam = await Exam.findById(id).populate('questions.question');
    if (!exam) {
      throw new ApiError(404, 'Exam not found');
    }

    const response = await ExamResponse.findOne({ exam: id, student: studentId });
    if (!response) {
      throw new ApiError(404, 'No active exam session found for this student');
    }

    if (response.status === 'submitted' || response.status === 'auto_submitted') {
      throw new ApiError(403, 'Exam has already been submitted');
    }

    // Run Grader Engine
    const graded = await gradeExamResponse(exam, response);

    // Update response status
    response.status = 'submitted';
    response.endTime = new Date();
    response.timeTaken = Math.round((response.endTime - response.startTime) / 1000); // in seconds
    response.obtainedMarks = graded.obtainedMarks;
    response.totalMarks = exam.totalMarks;
    response.percentage = graded.percentage;
    response.passed = graded.passed;
    await response.save();

    // Create detailed Result record
    const result = await Result.create({
      exam: id,
      student: studentId,
      response: response._id,
      attemptNumber: 1,
      totalQuestions: graded.totalQuestions,
      attemptedQuestions: graded.attemptedQuestions,
      correctAnswers: graded.correctAnswers,
      incorrectAnswers: graded.incorrectAnswers,
      skippedQuestions: graded.skippedQuestions,
      totalMarks: exam.totalMarks,
      obtainedMarks: graded.obtainedMarks,
      percentage: graded.percentage,
      passed: graded.passed,
      subjectWise: graded.subjectWise,
      topicWise: graded.topicWise,
      timeAnalysis: {
        averageTimePerQuestion: Math.round(response.timeTaken / graded.totalQuestions),
        questionsExceedingTime: []
      },
      questionBreakdown: graded.questionBreakdown
    });

    // Update exam aggregations
    exam.totalAttempts += 1;
    const allResponses = await ExamResponse.find({ exam: id, status: 'submitted' });
    const totalPercentageSum = allResponses.reduce((sum, r) => sum + r.percentage, 0);
    exam.averageScore = Math.round(totalPercentageSum / allResponses.length);
    await exam.save();

    return res
      .status(200)
      .json(new ApiResponse(200, result, 'Exam graded and submitted successfully'));
  } catch (error) {
    next(error);
  }
};

export const getStudentResults = async (req, res, next) => {
  try {
    const studentId = req.user._id;

    const results = await Result.find({ student: studentId })
      .populate('exam', 'title category duration')
      .sort({ createdAt: -1 });

    return res
      .status(200)
      .json(new ApiResponse(200, results, 'Student results retrieved'));
  } catch (error) {
    next(error);
  }
};

export const getResultById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await Result.findById(id)
      .populate('exam', 'title category questions instructions proctoring settings')
      .populate('student', 'fullName email')
      .populate('questionBreakdown.question');

    if (!result) {
      throw new ApiError(404, 'Result record not found');
    }

    // Cohort mean comparison stats
    const allResults = await Result.find({ exam: result.exam._id });
    const scores = allResults.map((r) => r.percentage);
    const average = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const highest = scores.length ? Math.max(...scores) : 0;

    const responseJSON = result.toJSON();
    responseJSON.cohortStats = {
      average,
      highest,
      totalStudents: scores.length
    };

    return res
      .status(200)
      .json(new ApiResponse(200, responseJSON, 'Detailed result report fetched'));
  } catch (error) {
    next(error);
  }
};

export const getAdminResults = async (req, res, next) => {
  try {
    const { examId } = req.query;
    const filter = {};
    if (examId) filter.exam = examId;

    const results = await Result.find(filter)
      .populate('exam', 'title category totalMarks')
      .populate('student', 'fullName email')
      .populate({
        path: 'response',
        select: 'violationCount violations'
      })
      .sort({ createdAt: -1 });

    return res
      .status(200)
      .json(new ApiResponse(200, results, 'Admin result records retrieved'));
  } catch (error) {
    next(error);
  }
};

export const getDashboardStats = async (req, res, next) => {
  try {
    const totalStudents = await User.countDocuments({ role: ROLES.STUDENT });
    const totalExams = await Exam.countDocuments();
    
    // Average score across all submissions
    const results = await Result.find();
    const totalScores = results.reduce((sum, r) => sum + r.percentage, 0);
    const averageScore = results.length ? Math.round(totalScores / results.length) : 0;
    
    const passedCount = results.filter((r) => r.passed).length;
    const passRate = results.length ? Math.round((passedCount / results.length) * 100) : 0;

    // Distribution categories
    const distribution = { excellent: 0, good: 0, average: 0, below: 0 };
    results.forEach((r) => {
      if (r.percentage >= 90) distribution.excellent++;
      else if (r.percentage >= 75) distribution.good++;
      else if (r.percentage >= 60) distribution.average++;
      else distribution.below++;
    });

    // Recent activities feed
    const recentStudents = await User.find({ role: ROLES.STUDENT }).sort({ createdAt: -1 }).limit(5);
    const recentExams = await Exam.find().sort({ createdAt: -1 }).limit(5);
    const recentSubmissions = await Result.find()
      .populate('student', 'fullName')
      .populate('exam', 'title')
      .sort({ createdAt: -1 })
      .limit(5);

    const activities = [];
    recentStudents.forEach((s) => {
      activities.push({
        type: 'registration',
        text: `Student ${s.fullName} registered`,
        time: s.createdAt
      });
    });
    recentExams.forEach((e) => {
      activities.push({
        type: 'exam_created',
        text: `Exam ${e.title} was created as a ${e.type}`,
        time: e.createdAt
      });
    });
    recentSubmissions.forEach((sub) => {
      activities.push({
        type: 'exam_submitted',
        text: `Student ${sub.student?.fullName || 'Anonymous'} submitted ${sub.exam?.title || 'an exam'} (${sub.percentage}%)`,
        time: sub.createdAt
      });
    });

    activities.sort((a, b) => new Date(b.time) - new Date(a.time));

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          totalStudents,
          totalExams,
          averageScore,
          passRate,
          performanceDistribution: [
            { name: 'Excellent (90-100%)', value: distribution.excellent, color: '#10B981' },
            { name: 'Good (75-89%)', value: distribution.good, color: '#3B82F6' },
            { name: 'Average (60-74%)', value: distribution.average, color: '#F59E0B' },
            { name: 'Below (Below 60%)', value: distribution.below, color: '#EF4444' }
          ],
          activities: activities.slice(0, 8)
        },
        'Dashboard analytics aggregated'
      )
    );
  } catch (error) {
    next(error);
  }
};
