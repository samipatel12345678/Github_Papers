const BaseAgent = require('./BaseAgent');

class CoderAgent extends BaseAgent {
  constructor(sessionId, sharedHistory) {
    super({
      name: 'Coder',
      role: 'Coder',
      systemInstructions: (
        "You are the Senior Software Engineer. You inspect the single shared history,\n" +
        "read the Architect's specification, and author production-ready, clean, well-tested code.\n" +
        "You use the 'write_file' tool to commit code to the session workspace.\n" +
        "If the Reviewer flags defects or security gaps, inspect their critique in the single history and refactor the code."
      ),
      sharedHistory,
      sessionId
    });
  }
}

module.exports = CoderAgent;
