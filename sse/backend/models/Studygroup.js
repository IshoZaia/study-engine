const mongoose = require('mongoose');

const studyGroupSchema = new mongoose.Schema({
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Array of user references
});

module.exports = mongoose.model('StudyGroup', studyGroupSchema);
