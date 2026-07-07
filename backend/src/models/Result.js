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
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
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
  ],
  status: {
    type: String,
    enum: ['Pending', 'Published', 'Rejected'],
    default: 'Pending',
    required: true
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  publishedAt: Date
}, {
  timestamps: true
});

resultSchema.index({ exam: 1 });
resultSchema.index({ student: 1 });
resultSchema.index({ organizationId: 1 });

const Result = mongoose.model('Result', resultSchema);
export default Result;
