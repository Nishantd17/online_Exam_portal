import Exam from '../models/Exam.js';
import Question from '../models/Question.js';
import ExamResponse from '../models/ExamResponse.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { EXAM_STATUS } from '../constants/index.js';

// --- ADMIN CONTROLLERS ---

export const createExam = async (req, res, next) => {
  try {
    const examData = req.body;
    examData.createdBy = req.user._id;

    if (!examData.title || !examData.category || !examData.type || !examData.duration) {
      throw new ApiError(400, 'Required basic parameters missing: title, category, type, duration');
    }

    // Auto-calculate totalMarks from questions list if provided
    let totalMarks = 0;
    if (examData.questions && Array.isArray(examData.questions)) {
      totalMarks = examData.questions.reduce((sum, q) => sum + (q.marks || 0), 0);
    }
    examData.totalMarks = totalMarks;

    const exam = await Exam.create(examData);

    return res
      .status(201)
      .json(new ApiResponse(201, exam, 'Exam created successfully'));
  } catch (error) {
    next(error);
  }
};

export const getAdminExams = async (req, res, next) => {
  try {
    const { status, category } = req.query;
    const query = {};

    if (status) query.status = status;
    if (category) query.category = category;

    const exams = await Exam.find(query).sort({ createdAt: -1 });

    return res
      .status(200)
      .json(new ApiResponse(200, exams, 'Exams retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

export const getExamById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findById(id).populate('questions.question');

    if (!exam) {
      throw new ApiError(404, 'Exam not found');
    }

    return res
      .status(200)
      .json(new ApiResponse(200, exam, 'Exam details retrieved'));
  } catch (error) {
    next(error);
  }
};

export const updateExam = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Recalculate totalMarks if questions changed
    if (updateData.questions && Array.isArray(updateData.questions)) {
      updateData.totalMarks = updateData.questions.reduce((sum, q) => sum + (q.marks || 0), 0);
    }

    const exam = await Exam.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true });

    if (!exam) {
      throw new ApiError(404, 'Exam not found');
    }

    return res
      .status(200)
      .json(new ApiResponse(200, exam, 'Exam updated successfully'));
  } catch (error) {
    next(error);
  }
};

export const deleteExam = async (req, res, next) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findByIdAndDelete(id);

    if (!exam) {
      throw new ApiError(404, 'Exam not found');
    }

    // Clean up responses
    await ExamResponse.deleteMany({ exam: id });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, 'Exam deleted successfully'));
  } catch (error) {
    next(error);
  }
};

export const duplicateExam = async (req, res, next) => {
  try {
    const { id } = req.params;
    const original = await Exam.findById(id);

    if (!original) {
      throw new ApiError(404, 'Original exam not found');
    }

    const duplicatedData = original.toObject();
    delete duplicatedData._id;
    delete duplicatedData.createdAt;
    delete duplicatedData.updatedAt;
    duplicatedData.title = `${duplicatedData.title} (Copy)`;
    duplicatedData.status = EXAM_STATUS.DRAFT;
    duplicatedData.createdBy = req.user._id;

    const copy = await Exam.create(duplicatedData);

    return res
      .status(201)
      .json(new ApiResponse(201, copy, 'Exam duplicated successfully'));
  } catch (error) {
    next(error);
  }
};


// --- STUDENT CONTROLLERS ---

export const getStudentExams = async (req, res, next) => {
  try {
    const studentId = req.user._id;

    // Fetch all published/in-progress/completed exams
    const exams = await Exam.find({
      status: { $in: [EXAM_STATUS.PUBLISHED, EXAM_STATUS.IN_PROGRESS, EXAM_STATUS.COMPLETED] }
    }).select('-questions');

    // Fetch student response records
    const responses = await ExamResponse.find({ student: studentId });

    const responseMap = responses.reduce((map, r) => {
      map[r.exam.toString()] = r;
      return map;
    }, {});

    const categorizedExams = {
      upcoming: [],
      active: [],
      completed: []
    };

    const now = new Date();

    exams.forEach((exam) => {
      const response = responseMap[exam._id.toString()];
      const isCompleted = response && (response.status === 'submitted' || response.status === 'auto_submitted');

      if (isCompleted) {
        categorizedExams.completed.push({
          exam,
          responseStatus: response.status,
          obtainedMarks: response.obtainedMarks,
          percentage: response.percentage,
          passed: response.passed,
          endTime: response.endTime
        });
      } else {
        const isScheduled = exam.schedule.type === 'fixed';
        const start = exam.schedule.startDate;
        const end = exam.schedule.endDate;

        if (isScheduled && start && now < new Date(start)) {
          categorizedExams.upcoming.push({ exam });
        } else if (isScheduled && end && now > new Date(end)) {
          // Fixed window has passed and they didn't take it
          categorizedExams.completed.push({ exam, responseStatus: 'missed' });
        } else {
          // Either always open, or inside flexible/fixed window, and not taken
          categorizedExams.active.push({
            exam,
            inProgress: response ? true : false,
            attemptsLeft: exam.settings.maxAttempts - (response ? 1 : 0) // rough check
          });
        }
      }
    });

    return res
      .status(200)
      .json(new ApiResponse(200, categorizedExams, 'Student exams categorized successfully'));
  } catch (error) {
    next(error);
  }
};

export const startExam = async (req, res, next) => {
  try {
    const { id } = req.params;
    const studentId = req.user._id;

    const exam = await Exam.findById(id).populate('questions.question');
    if (!exam) {
      throw new ApiError(404, 'Exam not found');
    }

    // Filter out any questions that failed to populate (e.g. if the question was deleted)
    exam.questions = exam.questions.filter((q) => q.question !== null && q.question !== undefined);

    if (exam.status === EXAM_STATUS.DRAFT) {
      throw new ApiError(403, 'This exam has not been published yet');
    }

    // Check if response already exists
    let response = await ExamResponse.findOne({ exam: id, student: studentId });

    if (response && (response.status === 'submitted' || response.status === 'auto_submitted')) {
      throw new ApiError(403, 'You have already submitted this exam');
    }

    // Create a new response if it doesn't exist
    if (!response) {
      // Check maximum attempts configuration
      const pastAttempts = await ExamResponse.countDocuments({ exam: id, student: studentId, status: 'submitted' });
      if (pastAttempts >= exam.settings.maxAttempts) {
        throw new ApiError(403, 'Maximum exam attempts limit reached');
      }

      // Initialize empty response map
      const initialAnswers = exam.questions.map((q) => ({
        question: q.question._id,
        status: 'not_answered',
        marksObtained: 0,
        timeSpent: 0
      }));

      response = await ExamResponse.create({
        exam: id,
        student: studentId,
        answers: initialAnswers,
        startTime: new Date(),
        status: 'in_progress',
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip
      });
    }

    // SECURITY COMPLIANCE:
    // Strip correct answers, solutions, explanations, test cases before returning exam sheet
    const sanitizedQuestions = exam.questions.map((eq) => {
      const q = eq.question.toObject();
      
      // Remove sensitive fields
      delete q.correctAnswer;
      delete q.explanation;
      
      if (q.options && Array.isArray(q.options)) {
        q.options = q.options.map((opt) => {
          delete opt.isCorrect;
          return opt;
        });
      }

      if (q.codingDetails) {
        // Strip test solutions and hidden test cases
        delete q.codingDetails.solutionCode;
        if (q.codingDetails.testCases) {
          q.codingDetails.testCases = q.codingDetails.testCases
            .filter((tc) => !tc.isHidden)
            .map((tc) => {
              delete tc.expectedOutput; // hide outputs to avoid hardcoding solutions
              return tc;
            });
        }
      }

      return {
        ...q,
        marksAllocated: eq.marks,
        order: eq.order
      };
    });

    // Shuffle questions if configured
    if (exam.settings.shuffleQuestions) {
      sanitizedQuestions.sort(() => Math.random() - 0.5);
    }

    const examData = exam.toObject();
    examData.questions = sanitizedQuestions;

    return res.status(200).json(
      new ApiResponse(
        200,
        { exam: examData, responseId: response._id, startTime: response.startTime, savedAnswers: response.answers },
        'Exam started. Questions locked.'
      )
    );
  } catch (error) {
    next(error);
  }
};

export const saveAnswer = async (req, res, next) => {
  try {
    const { id } = req.params; // Exam ID
    const studentId = req.user._id;
    const { questionId, selectedOption, textAnswer, codeAnswer, status, timeSpent } = req.body;

    const response = await ExamResponse.findOne({ exam: id, student: studentId });
    if (!response) {
      throw new ApiError(404, 'Exam session not found');
    }

    if (response.status !== 'in_progress') {
      throw new ApiError(403, 'Cannot save answer. Exam is not in progress.');
    }

    // Find and update the specific answer index
    const answerIndex = response.answers.findIndex((ans) => ans.question.toString() === questionId);

    if (answerIndex === -1) {
      response.answers.push({
        question: questionId,
        selectedOption,
        textAnswer,
        codeAnswer,
        status: status || 'answered',
        timeSpent: timeSpent || 0
      });
    } else {
      const answer = response.answers[answerIndex];
      answer.selectedOption = selectedOption;
      answer.textAnswer = textAnswer;
      answer.codeAnswer = codeAnswer;
      answer.status = status || 'answered';
      answer.timeSpent = (answer.timeSpent || 0) + (timeSpent || 0);
    }

    await response.save();

    return res.status(200).json(new ApiResponse(200, {}, 'Answer saved successfully'));
  } catch (error) {
    next(error);
  }
};

export const logViolation = async (req, res, next) => {
  try {
    const { id } = req.params; // Exam ID
    const studentId = req.user._id;
    const { type, details } = req.body;

    const response = await ExamResponse.findOne({ exam: id, student: studentId });
    if (!response) {
      throw new ApiError(404, 'Exam session not found');
    }

    response.violations.push({
      type,
      timestamp: new Date(),
      details: details || `Recorded violation of type ${type}`
    });

    response.violationCount = response.violations.length;
    await response.save();

    // Check if violation limit exceeded
    const exam = await Exam.findById(id);
    let autoSubmitted = false;
    if (exam && (response.violationCount >= 3 || type === 'face_not_visible')) {
      // Auto-submit the exam
      autoSubmitted = true;
      console.warn(`Student ${studentId} auto-submitted due to excessive violations (reached limit of 3) or face not visible.`);
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        { violationCount: response.violationCount, autoSubmitted },
        'Violation logged successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};
