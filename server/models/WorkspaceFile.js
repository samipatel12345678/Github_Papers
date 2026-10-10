const mongoose = require('mongoose');

const workspaceFileSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  filename: {
    type: String,
    required: true
  },
  content: {
    type: String,
    default: ''
  },
  language: {
    type: String,
    default: 'javascript'
  },
  version: {
    type: Number,
    default: 1
  },
  lastModifiedBy: {
    type: String,
    default: 'Coder'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

workspaceFileSchema.index({ sessionId: 1, filename: 1 }, { unique: true });

module.exports = mongoose.model('WorkspaceFile', workspaceFileSchema);
