import mongoose from 'mongoose';
import { QUESTION_TYPES, DIFFICULTY_LEVELS } from '../constants/index.js';

const questionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: Object.values(QUESTION_TYPES),
    required: [true, 'Question type is required']
  },
  text: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true
  },
  richText: {
    type: Boolean,
    default: false
  },
  options: [
    {
      text: { type: String, required: true },
      isCorrect: { type: Boolean, required: true, default: false },
      order: { type: Number, required: true }
    }
  ],
  correctAnswer: mongoose.Schema.Types.Mixed, // For TF: Boolean, Fill blank: String, Subjective: String etc.
  blanks: [
    {
      index: Number,
      correctAnswers: [String],
      caseSensitive: { type: Boolean, default: false }
    }
  ],
  codingDetails: {
    language: {
      type: String,
      enum: ['javascript', 'python', 'java', 'cpp']
    },
    starterCode: String,
    solutionCode: String,
    testCases: [
      {
        input: String,
        expectedOutput: String,
        isHidden: { type: Boolean, default: false },
        marks: { type: Number, default: 0 }
      }
    ],
    timeLimit: { type: Number, default: 2000 }, // in ms
    memoryLimit: { type: Number, default: 256 } // in MB
  },
  difficulty: {
    type: String,
    enum: Object.values(DIFFICULTY_LEVELS),
    required: [true, 'Difficulty level is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  topics: [String],
  tags: [String],
  defaultMarks: {
    type: Number,
    required: true,
    default: 1
  },
  negativeMarks: {
    type: Number,
    default: 0
  },
  explanation: {
    type: String,
    trim: true
  },
  timeLimit: Number, // optional duration in seconds to answer
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  usageCount: {
    type: Number,
    default: 0
  },
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Indexes
questionSchema.index({ type: 1, difficulty: 1, category: 1 });
questionSchema.index({ topics: 1 });
questionSchema.index({ text: 'text' }); // full-text search index

const Question = mongoose.model('Question', questionSchema);
export default Question;
