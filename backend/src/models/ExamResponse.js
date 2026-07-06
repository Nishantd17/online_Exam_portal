import mongoose from 'mongoose';
import { VIOLATION_TYPES } from '../constants/index.js';

const examResponseSchema = new mongoose.Schema({
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  answers: [
    {
      question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
      selectedOption: mongoose.Schema.Types.Mixed, // option index or array for MCQ multi
      textAnswer: String, // subjective, TF, fill in blank
      codeAnswer: String, // coding language source
      isCorrect: { type: Boolean, default: false },
      marksObtained: { type: Number, default: 0 },
      timeSpent: { type: Number, default: 0 }, // in seconds
      status: {
        type: String,
        enum: ['answered', 'not_answered', 'marked_for_review', 'skipped'],
        default: 'not_answered'
      }
    }
  ],
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: Date,
  timeTaken: Number, // total time taken in seconds
  totalMarks: { type: Number, default: 0 },
  obtainedMarks: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  passed: { type: Boolean, default: false },
  rank: Number,
  percentile: Number,
  status: {
    type: String,
    enum: ['in_progress', 'submitted', 'auto_submitted', 'terminated'],
    default: 'in_progress'
  },
  violations: [
    {
      type: {
        type: String,
        enum: Object.values(VIOLATION_TYPES),
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      details: String
    }
  ],
  violationCount: {
    type: Number,
    default: 0
  },
  ipAddress: String,
  userAgent: String,
  deviceInfo: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

// Ensure a student can only submit one response per exam (compound unique index)
examResponseSchema.index({ exam: 1, student: 1 }, { unique: true });

const ExamResponse = mongoose.model('ExamResponse', examResponseSchema);
export default ExamResponse;
