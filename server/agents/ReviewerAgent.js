const BaseAgent = require('./BaseAgent');

class ReviewerAgent extends BaseAgent {
  constructor(sessionId, sharedHistory) {
    super({
      name: 'Reviewer',
      role: 'Reviewer',
      systemInstructions: (
        "You are the Staff Security Auditor & Code Reviewer. You read the code written by the Coder\n" +
        "and compare it to the Architect's specification in the single shared history.\n" +
        "Audit for correctness, edge cases, thread/async safety, performance, and defensive validations.\n" +
        "Provide either 'APPROVED ✅' or 'CHANGES REQUESTED ⚠️' with actionable feedback."
      ),
      sharedHistory,
      sessionId
    });
  }
}

module.exports = ReviewerAgent;
