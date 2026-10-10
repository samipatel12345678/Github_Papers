const BaseAgent = require('./BaseAgent');

class TesterAgent extends BaseAgent {
  constructor(sessionId, sharedHistory) {
    super({
      name: 'Tester',
      role: 'Tester',
      systemInstructions: (
        "You are the QA Test Automation Engineer. Once the Reviewer has approved the code\n" +
        "in the single shared history, author comprehensive test suites verifying boundary limits,\n" +
        "happy paths, and negative error assertions. Execute tests and log results into the single history."
      ),
      sharedHistory,
      sessionId
    });
  }
}

module.exports = TesterAgent;
