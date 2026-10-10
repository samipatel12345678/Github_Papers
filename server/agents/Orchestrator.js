/**
 * Multi-Agent Orchestrator binding all 4 agents to a Single Shared History.
 */

const SingleSharedHistory = require('./SingleSharedHistory');
const ArchitectAgent = require('./ArchitectAgent');
const CoderAgent = require('./CoderAgent');
const ReviewerAgent = require('./ReviewerAgent');
const TesterAgent = require('./TesterAgent');
const DBService = require('../services/dbService');

class Orchestrator {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.sharedHistory = new SingleSharedHistory(sessionId);

    // All agents instantiated with the EXACT SAME SingleSharedHistory reference
    this.agents = {
      Architect: new ArchitectAgent(sessionId, this.sharedHistory),
      Coder: new CoderAgent(sessionId, this.sharedHistory),
      Reviewer: new ReviewerAgent(sessionId, this.sharedHistory),
      Tester: new TesterAgent(sessionId, this.sharedHistory)
    };
  }

  /**
   * Automatically determines which agent should act next based on the Single Shared History.
   */
  async determineNextAgent() {
    const history = await this.sharedHistory.getAllEntries();
    if (history.length === 0) return 'Architect';

    const lastEntry = history[history.length - 1];

    if (lastEntry.senderRole === 'Human') {
      return 'Architect';
    }

    if (lastEntry.senderName === 'Architect') {
      return 'Coder';
    }

    if (lastEntry.senderName === 'Coder') {
      return 'Reviewer';
    }

    if (lastEntry.senderName === 'Reviewer') {
      if (lastEntry.content.includes('CHANGES REQUESTED') || lastEntry.content.includes('⚠️')) {
        return 'Coder'; // Feedback loop: Coder must resolve review critique
      }
      return 'Tester'; // Approved: Proceed to automated testing
    }

    if (lastEntry.senderName === 'Tester') {
      return 'COMPLETE';
    }

    return 'Architect';
  }

  /**
   * Executes a single step in the collaborative pipeline.
   */
  async stepNext() {
    const session = await DBService.getSession(this.sessionId);
    if (!session) throw new Error(`Session ${this.sessionId} not found`);

    const nextAgentName = await this.determineNextAgent();

    if (nextAgentName === 'COMPLETE') {
      await DBService.updateSession(this.sessionId, {
        status: 'completed',
        activeAgent: 'None'
      });
      return { completed: true, message: 'All agents have completed their work on this task.' };
    }

    const agent = this.agents[nextAgentName];
    if (!agent) {
      throw new Error(`Agent ${nextAgentName} not found`);
    }

    await DBService.updateSession(this.sessionId, {
      status: nextAgentName.toLowerCase() + 'ing',
      activeAgent: nextAgentName
    });

    try {
      const entry = await agent.executeTurn(session.taskDescription, session.llmProvider);

      const nextPending = await this.determineNextAgent();
      const isDone = (nextPending === 'COMPLETE');

      await DBService.updateSession(this.sessionId, {
        status: isDone ? 'completed' : 'idle',
        activeAgent: isDone ? 'None' : nextPending
      });

      return {
        completed: isDone,
        executedAgent: nextAgentName,
        nextAgent: nextPending,
        entry
      };
    } catch (err) {
      await DBService.updateSession(this.sessionId, {
        status: 'error',
        activeAgent: 'None'
      });
      throw err;
    }
  }

  /**
   * Runs the entire multi-agent cycle until completion.
   */
  async runAll(onStepCallback = null) {
    const results = [];
    let isComplete = false;
    let maxSteps = 10; // Defensive iteration guard
    let currentStep = 0;

    while (!isComplete && currentStep < maxSteps) {
      currentStep++;
      const stepRes = await this.stepNext();
      results.push(stepRes);

      if (onStepCallback) {
        onStepCallback(stepRes);
      }

      if (stepRes.completed) {
        isComplete = true;
        break;
      }
    }

    return results;
  }
}

module.exports = Orchestrator;
