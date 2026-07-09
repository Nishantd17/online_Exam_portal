import mongoose from 'mongoose';

const trialRequestSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Reviewed'],
    default: 'Pending'
  }
}, {
  timestamps: true
});

const TrialRequest = mongoose.model('TrialRequest', trialRequestSchema);
export default TrialRequest;
