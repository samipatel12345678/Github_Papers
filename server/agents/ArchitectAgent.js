const BaseAgent = require('./BaseAgent');

class ArchitectAgent extends BaseAgent {
  constructor(sessionId, sharedHistory) {
    super({
      name: 'Architect',
      role: 'Architect',
      systemInstructions: (
        "You are the Lead Software Architect. Your job is to analyze coding tasks from the user,\n" +
        "produce clean modular specifications, design patterns, file breakdowns, and establish boundaries.\n" +
        "Document your decisions in the single shared history so the Coder agent can implement them."
      ),
      sharedHistory,
      sessionId
    });
  }
}

module.exports = ArchitectAgent;
