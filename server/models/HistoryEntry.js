const mongoose = require('mongoose');

const toolCallSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  arguments: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { _id: false });

const toolResultSchema = new mongoose.Schema({
  toolCallId: { type: String, required: true },
  name: { type: String, required: true },
  output: { type: String, default: '' },
  success: { type: Boolean, default: true }
}, { _id: false });

const historyEntrySchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  stepNumber: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  senderName: {
    type: String,
    required: true // e.g. "Architect", "Coder", "Reviewer", "Tester", "User"
  },
  senderRole: {
    type: String,
    enum: ['Architect', 'Coder', 'Reviewer', 'Tester', 'Coordinator', 'Human'],
    required: true
  },
  messageRole: {
    type: String,
    enum: ['user', 'assistant', 'system', 'tool'],
    default: 'assistant'
  },
  thought: {
    type: String,
    default: null
  },
  content: {
    type: String,
    default: ''
  },
  toolCalls: {
    type: [toolCallSchema],
    default: []
  },
  toolResults: {
    type: [toolResultSchema],
    default: []
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

// Compound index to guarantee order query efficiency
historyEntrySchema.index({ sessionId: 1, stepNumber: 1 });

module.exports = mongoose.model('HistoryEntry', historyEntrySchema);
