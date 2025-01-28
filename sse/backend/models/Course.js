const mongoose = require('mongoose');

const questionGroupSchema = new mongoose.Schema({
  id: { type: String, required: true},
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
});

const memberSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  totalCorrect: { type: Number, default: 0 },
  totalQuestions: { type: Number, default: 0 },
});

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [memberSchema],
  file: { type: mongoose.Schema.Types.ObjectId, ref: 'File' },
  emailFrequency: { type: String, enum: ['daily', 'weekly'], default: 'daily' },
  numQuestions: { type: Number, default: 5 },
  previousQuestions: [questionGroupSchema],
  newQuestions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
});

module.exports = mongoose.model('Course', courseSchema);
