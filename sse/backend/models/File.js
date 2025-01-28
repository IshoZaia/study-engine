const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  filepath: { type: String, required: true }, // Store PDF path
});

module.exports = mongoose.model('File', fileSchema);
