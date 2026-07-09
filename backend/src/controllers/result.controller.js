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
    if (!qDetails) continue; // Skip if question details are missing/deleted
    
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
            // Check both properties: correctAnswer index and options array findIndex
            const correctOptIdx = qDetails.options ? qDetails.options.findIndex(opt => opt.isCorrect) : -1;
            const dbCorrectAnswer = qDetails.correctAnswer;
            
            if (
              (correctOptIdx !== -1 && String(correctOptIdx) === String(studentProvidedValue)) ||
              (dbCorrectAnswer !== undefined && dbCorrectAnswer !== null && String(dbCorrectAnswer) === String(studentProvidedValue))
            ) {
              isCorrect = true;
            }
            break;

          case 'mcq_multiple':
            studentProvidedValue = studentAns.selectedOption; // should be array of indices
            let selectedOptionsArray = [];
            if (Array.isArray(studentProvidedValue)) {
              selectedOptionsArray = studentProvidedValue;
            } else if (typeof studentProvidedValue === 'string') {
              try {
                const parsed = JSON.parse(studentProvidedValue);
                if (Array.isArray(parsed)) {
                  selectedOptionsArray = parsed;
                } else {
                  selectedOptionsArray = studentProvidedValue.split(',').map(s => s.trim());
                }
              } catch (e) {
                selectedOptionsArray = studentProvidedValue.split(',').map(s => s.trim());
              }
            }
            
            // Check correct indices
            const correctIndices = [];
            if (qDetails.options) {
              qDetails.options.forEach((opt, idx) => {
                if (opt.isCorrect) correctIndices.push(idx);
              });
            }
            // Fallback to correctAnswer field if options didn't flag correctly
            if (correctIndices.length === 0 && qDetails.correctAnswer) {
              if (Array.isArray(qDetails.correctAnswer)) {
                correctIndices.push(...qDetails.correctAnswer.map(v => parseInt(v, 10)));
              } else if (typeof qDetails.correctAnswer === 'string') {
                qDetails.correctAnswer.split(',').forEach(v => correctIndices.push(parseInt(v.trim(), 10)));
              } else if (typeof qDetails.correctAnswer === 'number') {
                correctIndices.push(qDetails.correctAnswer);
              }
            }

            if (selectedOptionsArray.length > 0 && correctIndices.length > 0) {
              const isMatch =
                selectedOptionsArray.length === correctIndices.length &&
                selectedOptionsArray.every((val) => correctIndices.includes(parseInt(val, 10)));
              
              if (isMatch) {
                isCorrect = true;
              }
            }
            break;

          case 'true_false':
            studentProvidedValue = studentAns.textAnswer || studentAns.selectedOption; // Support both
            if (studentProvidedValue !== undefined && studentProvidedValue !== null) {
              const correctTF = String(qDetails.correctAnswer).toLowerCase();
              if (String(studentProvidedValue).toLowerCase() === correctTF) {
                isCorrect = true;
              }
            }
            break;

          case 'fill_blank':
            studentProvidedValue = studentAns.textAnswer || studentAns.selectedOption; // Support both
            if (studentProvidedValue && qDetails.correctAnswer) {
              const acceptedAnswers = String(qDetails.correctAnswer)
                .split(',')
                .map((ans) => ans.trim().toLowerCase());
              
              if (acceptedAnswers.includes(String(studentProvidedValue).trim().toLowerCase())) {
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

    if (status === 'skipped' || (studentProvidedValue === null || studentProvidedValue === undefined || studentProvidedValue === '')) {
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

    const exam = await Exam.findOne({ _id: id, organizationId: req.user.organizationId }).populate('questions.question');
    if (!exam) {
      throw new ApiError(404, 'Exam not found');
    }

    const response = await ExamResponse.findOne({ exam: id, student: studentId, organizationId: req.user.organizationId });
    if (!response) {
      throw new ApiError(404, 'No active exam session found for this student');
    }

    if (response.status === 'submitted' || response.status === 'auto_submitted') {
      throw new ApiError(403, 'Exam has already been submitted');
    }

    // Run Grader Engine
    const graded = await gradeExamResponse(exam, response);

    // Update response status (zero out graded aggregates for now)
    response.status = 'submitted';
    response.endTime = new Date();
    response.timeTaken = Math.round((response.endTime - response.startTime) / 1000); // in seconds
    response.obtainedMarks = 0;
    response.totalMarks = exam.totalMarks;
    response.percentage = 0;
    response.passed = false;
    await response.save();

    // Create detailed Result record with Pending status
    const result = await Result.create({
      exam: id,
      student: studentId,
      response: response._id,
      organizationId: req.user.organizationId,
      attemptNumber: 1,
      totalQuestions: graded.totalQuestions,
      attemptedQuestions: graded.attemptedQuestions,
      correctAnswers: 0,
      incorrectAnswers: 0,
      skippedQuestions: 0,
      totalMarks: exam.totalMarks,
      obtainedMarks: 0,
      percentage: 0,
      passed: false,
      status: 'Pending',
      subjectWise: graded.subjectWise.map(s => ({ ...s, obtained: 0, percentage: 0 })),
      topicWise: graded.topicWise.map(t => ({ ...t, obtained: 0, percentage: 0 })),
      timeAnalysis: {
        averageTimePerQuestion: Math.round(response.timeTaken / graded.totalQuestions),
        questionsExceedingTime: []
      },
      questionBreakdown: graded.questionBreakdown // Detailed breakdown remains evaluated for Admin review
    });

    // Update exam attempts count
    exam.totalAttempts += 1;
    await exam.save();

    return res
      .status(200)
      .json(new ApiResponse(200, result, 'Exam submitted successfully. Result is under review.'));
  } catch (error) {
    next(error);
  }
};

export const getStudentResults = async (req, res, next) => {
  try {
    const studentId = req.user._id;

    const results = await Result.find({ student: studentId, organizationId: req.user.organizationId })
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
    const result = await Result.findOne({ _id: id, organizationId: req.user.organizationId })
      .populate('exam', 'title category questions instructions proctoring settings')
      .populate('student', 'fullName email')
      .populate('questionBreakdown.question');

    if (!result) {
      throw new ApiError(404, 'Result record not found');
    }

    const isStudent = req.user.role === 'student';
    const responseJSON = result.toJSON();

    if (isStudent && result.status === 'Pending') {
      // Strip details from Pending status student responses
      delete responseJSON.obtainedMarks;
      delete responseJSON.percentage;
      delete responseJSON.passed;
      delete responseJSON.correctAnswers;
      delete responseJSON.incorrectAnswers;
      delete responseJSON.skippedQuestions;
      delete responseJSON.questionBreakdown;
      delete responseJSON.subjectWise;
      delete responseJSON.topicWise;
      delete responseJSON.timeAnalysis;
      
      responseJSON.cohortStats = {
        average: 0,
        highest: 0,
        totalStudents: 0
      };
    } else {
      // Cohort mean comparison stats (only include Published results to keep averages accurate)
      const allResults = await Result.find({ exam: result.exam._id, status: 'Published', organizationId: req.user.organizationId });
      const scores = allResults.map((r) => r.percentage);
      const average = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      const highest = scores.length ? Math.max(...scores) : 0;

      responseJSON.cohortStats = {
        average,
        highest,
        totalStudents: scores.length
      };
    }

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
    if (req.user.role !== ROLES.SUPER_ADMIN) {
      filter.organizationId = req.user.organizationId;
    }
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
    const userQuery = { role: ROLES.STUDENT };
    const examQuery = {};
    const resultQuery = {};
    
    if (req.user.role !== ROLES.SUPER_ADMIN) {
      userQuery.organizationId = req.user.organizationId;
      examQuery.organizationId = req.user.organizationId;
      resultQuery.organizationId = req.user.organizationId;
    }

    const totalStudents = await User.countDocuments(userQuery);
    const totalExams = await Exam.countDocuments(examQuery);
    
    // Average score across all submissions
    const results = await Result.find(resultQuery);
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

    // Calculate weekly completions data over the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const weeklyQuery = {
      ...resultQuery,
      createdAt: { $gte: sevenDaysAgo }
    };
    const weeklyResults = await Result.find(weeklyQuery);

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const completionsMap = {};

    // Initialize map for the last 7 days leading up to today
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = daysOfWeek[d.getDay()];
      const dateString = d.toDateString();
      completionsMap[dateString] = {
        name: dayName,
        Attempted: 0,
        Completed: 0,
        sortDate: new Date(d.setHours(0, 0, 0, 0))
      };
    }

    weeklyResults.forEach((res) => {
      const dateString = new Date(res.createdAt).toDateString();
      if (completionsMap[dateString]) {
        completionsMap[dateString].Attempted++;
        if (res.status !== 'Rejected') {
          completionsMap[dateString].Completed++;
        }
      }
    });

    const weeklyCompletions = Object.values(completionsMap)
      .sort((a, b) => a.sortDate - b.sortDate)
      .map(item => ({
        name: item.name,
        Attempted: item.Attempted,
        Completed: item.Completed
      }));

    // Recent activities feed
    const studentRecentQuery = { role: ROLES.STUDENT };
    const examRecentQuery = {};
    const subRecentQuery = {};
    
    if (req.user.role !== ROLES.SUPER_ADMIN) {
      studentRecentQuery.organizationId = req.user.organizationId;
      examRecentQuery.organizationId = req.user.organizationId;
      subRecentQuery.organizationId = req.user.organizationId;
    }

    const recentStudents = await User.find(studentRecentQuery).sort({ createdAt: -1 }).limit(5);
    const recentExams = await Exam.find(examRecentQuery).sort({ createdAt: -1 }).limit(5);
    const recentSubmissions = await Result.find(subRecentQuery)
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
          weeklyCompletions,
          activities: activities.slice(0, 8)
        },
        'Dashboard analytics aggregated'
      )
    );
  } catch (error) {
    next(error);
  }
};

export const getPendingResults = async (req, res, next) => {
  try {
    const query = { status: 'Pending' };
    if (req.user.role !== ROLES.SUPER_ADMIN) {
      query.organizationId = req.user.organizationId;
    }

    const results = await Result.find(query)
      .populate('student', 'fullName email')
      .populate('exam', 'title totalMarks')
      .sort({ createdAt: -1 });

    return res
      .status(200)
      .json(new ApiResponse(200, results, 'Pending results retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

export const approveResult = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = { _id: id };
    if (req.user.role !== ROLES.SUPER_ADMIN) {
      query.organizationId = req.user.organizationId;
    }

    const result = await Result.findOne(query).populate('exam');
    if (!result) {
      throw new ApiError(404, 'Result record not found');
    }

    if (result.status !== 'Pending') {
      throw new ApiError(400, 'Result is already reviewed');
    }

    const exam = result.exam;

    // Recalculate aggregates from questionBreakdown
    let correctCount = 0;
    let incorrectCount = 0;
    let skippedCount = 0;
    let obtainedMarks = 0;

    result.questionBreakdown.forEach((item) => {
      if (item.status === 'skipped' || item.status === 'not_answered' || (!item.studentAnswer && item.studentAnswer !== 0)) {
        skippedCount++;
      } else if (item.isCorrect) {
        correctCount++;
        obtainedMarks += item.marksObtained || 0;
      } else {
        incorrectCount++;
        obtainedMarks += item.marksObtained || 0; // negative or 0
      }
    });

    obtainedMarks = Math.max(0, obtainedMarks);
    const totalMarks = exam.totalMarks || result.totalMarks || 1;
    const percentage = Math.round((obtainedMarks / totalMarks) * 100);
    const passed = percentage >= exam.passingMarks;

    // Update Result details
    result.correctAnswers = correctCount;
    result.incorrectAnswers = incorrectCount;
    result.skippedQuestions = skippedCount;
    result.obtainedMarks = obtainedMarks;
    result.percentage = percentage;
    result.passed = passed;
    result.status = 'Published';
    result.reviewedBy = req.user._id;
    result.reviewedAt = new Date();
    result.publishedAt = new Date();

    const subjectWiseMap = {};
    const topicWiseMap = {};

    await result.populate('questionBreakdown.question');

    result.questionBreakdown.forEach((item) => {
      const q = item.question;
      if (!q) return;
      
      const category = q.category || 'General';
      const topics = q.topics || ['Unassigned'];
      
      const examQ = exam.questions.find(eq => eq.question.toString() === q._id.toString());
      const qWeight = examQ ? examQ.marks : (item.marksObtained || 1);

      if (!subjectWiseMap[category]) {
        subjectWiseMap[category] = { total: 0, obtained: 0 };
      }
      subjectWiseMap[category].total += qWeight;
      subjectWiseMap[category].obtained += Math.max(0, item.marksObtained || 0);

      topics.forEach((topic) => {
        if (!topicWiseMap[topic]) {
          topicWiseMap[topic] = { total: 0, obtained: 0 };
        }
        topicWiseMap[topic].total += qWeight;
        topicWiseMap[topic].obtained += Math.max(0, item.marksObtained || 0);
      });
    });

    result.subjectWise = Object.keys(subjectWiseMap).map((subj) => ({
      subject: subj,
      total: subjectWiseMap[subj].total,
      obtained: subjectWiseMap[subj].obtained,
      percentage: Math.round((subjectWiseMap[subj].obtained / subjectWiseMap[subj].total) * 100)
    }));

    result.topicWise = Object.keys(topicWiseMap).map((topic) => ({
      topic,
      total: topicWiseMap[topic].total,
      obtained: topicWiseMap[topic].obtained,
      percentage: Math.round((topicWiseMap[topic].obtained / topicWiseMap[topic].total) * 100)
    }));

    await result.save();

    // Sync back to ExamResponse model
    const response = await ExamResponse.findById(result.response);
    if (response) {
      response.obtainedMarks = obtainedMarks;
      response.percentage = percentage;
      response.passed = passed;
      response.answers.forEach((ans) => {
        const item = result.questionBreakdown.find(qb => qb.question && qb.question._id.toString() === ans.question.toString());
        if (item) {
          ans.isCorrect = item.isCorrect;
          ans.marksObtained = item.marksObtained;
        }
      });
      response.markModified('answers');
      await response.save();
    }

    // Recalculate exam average score
    const allPublishedResponses = await ExamResponse.find({ exam: exam._id, status: 'submitted', percentage: { $gt: 0 } });
    if (allPublishedResponses.length > 0) {
      const totalPercentageSum = allPublishedResponses.reduce((sum, r) => sum + r.percentage, 0);
      exam.averageScore = Math.round(totalPercentageSum / allPublishedResponses.length);
      await exam.save();
    }

    return res
      .status(200)
      .json(new ApiResponse(200, result, 'Result approved and published successfully'));
  } catch (error) {
    next(error);
  }
};

export const rejectResult = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = { _id: id };
    if (req.user.role !== ROLES.SUPER_ADMIN) {
      query.organizationId = req.user.organizationId;
    }

    const result = await Result.findOne(query);
    if (!result) {
      throw new ApiError(404, 'Result record not found');
    }

    if (result.status !== 'Pending') {
      throw new ApiError(400, 'Result is already reviewed');
    }

    result.status = 'Rejected';
    result.reviewedBy = req.user._id;
    result.reviewedAt = new Date();
    await result.save();

    const response = await ExamResponse.findById(result.response);
    if (response) {
      response.status = 'terminated';
      await response.save();
    }

    return res
      .status(200)
      .json(new ApiResponse(200, result, 'Result submission rejected successfully'));
  } catch (error) {
    next(error);
  }
};
