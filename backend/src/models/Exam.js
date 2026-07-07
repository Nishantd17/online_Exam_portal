import mongoose from 'mongoose';
import { EXAM_STATUS } from '../constants/index.js';

const examSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Exam title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['practice', 'quiz', 'midterm', 'final', 'entrance'],
    required: [true, 'Exam type is required']
  },
  duration: {
    type: Number, // in minutes
    required: [true, 'Duration is required']
  },
  totalMarks: {
    type: Number,
    required: true,
    default: 0
  },
  passingMarks: {
    type: Number,
    required: true,
    default: 0
  },
  negativeMarking: {
    enabled: { type: Boolean, default: false },
    value: { type: Number, default: 0 } // marks to deduct per wrong answer
  },
  schedule: {
    type: {
      type: String,
      enum: ['fixed', 'flexible', 'always'],
      default: 'always'
    },
    startDate: Date,
    endDate: Date,
    timeLimit: Number // for flexible: duration limit in mins
  },
  accessControl: {
    type: {
      type: String,
      enum: ['all', 'specific', 'batch'],
      default: 'all'
    },
    allowedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    allowedBatches: [String]
  },
  settings: {
    shuffleQuestions: { type: Boolean, default: false },
    showResults: {
      type: String,
      enum: ['immediately', 'after_deadline', 'never'],
      default: 'immediately'
    },
    showCorrectAnswers: {
      type: String,
      enum: ['after_exam', 'after_deadline', 'never'],
      default: 'after_exam'
    },
    maxAttempts: { type: Number, default: 1 },
    allowLateEntry: { type: Boolean, default: false },
    lateEntryGracePeriod: { type: Number, default: 15 } // in minutes
  },
  proctoring: {
    level: {
      type: String,
      enum: ['basic', 'moderate', 'strict'],
      default: 'basic'
    },
    tabSwitchLimit: { type: Number, default: 3 },
    fullscreenRequired: { type: Boolean, default: false },
    webcamRequired: { type: Boolean, default: false },
    disableCopyPaste: { type: Boolean, default: true },
    ipRestriction: [String]
  },
  questions: [
    {
      question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
      marks: { type: Number, required: true },
      order: { type: Number, required: true }
    }
  ],
  instructions: String,
  status: {
    type: String,
    enum: Object.values(EXAM_STATUS),
    default: EXAM_STATUS.DRAFT
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  totalAttempts: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

examSchema.index({ status: 1 });
examSchema.index({ createdBy: 1 });
examSchema.index({ organizationId: 1 });

const Exam = mongoose.model('Exam', examSchema);
export default Exam;
