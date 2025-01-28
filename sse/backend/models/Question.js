const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  id: { type: Number, required: true},
  text: { type: String, required: true },
  choices: { type: [String], required: true },
  answer: { type: String, required: true }
});

module.exports = mongoose.model('Question', questionSchema);
