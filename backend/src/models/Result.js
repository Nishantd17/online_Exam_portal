import mongoose from 'mongoose';

const resultSchema = new mongoose.Schema({
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
  response: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExamResponse',
    required: true
  },
  attemptNumber: {
    type: Number,
    default: 1
  },
  totalQuestions: { type: Number, required: true },
  attemptedQuestions: { type: Number, required: true },
  correctAnswers: { type: Number, required: true },
  incorrectAnswers: { type: Number, required: true },
  skippedQuestions: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  obtainedMarks: { type: Number, required: true },
  percentage: { type: Number, required: true },
  passed: { type: Boolean, required: true },
  rank: Number,
  percentile: Number,
  subjectWise: [
    {
      subject: String,
      total: Number,
      obtained: Number,
      percentage: Number
    }
  ],
  topicWise: [
    {
      topic: String,
      total: Number,
      obtained: Number,
      percentage: Number
    }
  ],
  timeAnalysis: {
    averageTimePerQuestion: Number, // in seconds
    questionsExceedingTime: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }]
  },
  questionBreakdown: [
    {
      question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
      studentAnswer: mongoose.Schema.Types.Mixed,
      correctAnswer: mongoose.Schema.Types.Mixed,
      isCorrect: Boolean,
      marksObtained: Number,
      timeSpent: Number,
      status: String
    }
  ]
}, {
  timestamps: true
});

const Result = mongoose.model('Result', resultSchema);
export default Result;
