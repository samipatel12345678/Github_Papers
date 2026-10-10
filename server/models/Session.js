const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true,
    default: 'New Coding Task'
  },
  taskDescription: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['idle', 'planning', 'coding', 'reviewing', 'testing', 'completed', 'error'],
    default: 'idle'
  },
  activeAgent: {
    type: String,
    default: 'None'
  },
  totalSteps: {
    type: Number,
    default: 0
  },
  llmProvider: {
    type: String,
    default: 'mock'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Session', sessionSchema);
