/**
 * Universal Multi-Agent Orchestrator uniting Cursor, Antigravity, Devin,
 * Claude Code, Aider, Copilot, and Windsurf over a Single Shared History.
 */

const SingleSharedHistory = require('./SingleSharedHistory');
const DBService = require('../services/dbService');
const LLMService = require('../services/llmService');
const RealToolRunner = require('../services/realToolRunner');
const { AGENT_CATALOG, getAgentById } = require('../config/agentsCatalog');

class UniversalOrchestrator {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.sharedHistory = new SingleSharedHistory(sessionId);
    this.toolRunner = new RealToolRunner(sessionId);
  }

  /**
   * Executes a specific chosen agent turn on the Single Shared History.
   */
  async executeAgentTurn(agentId, customInstruction = null) {
    const session = await DBService.getSession(this.sessionId);
    if (!session) throw new Error(`Session ${this.sessionId} not found`);

    const agentMeta = getAgentById(agentId);

    // If user provided a specific target prompt, record it as a user instruction first
    if (customInstruction) {
      await this.sharedHistory.appendEntry({
        senderName: 'User',
        senderRole: 'Human',
        messageRole: 'user',
        content: `@${agentMeta.name}: ${customInstruction}`
      });
    }

    await DBService.updateSession(this.sessionId, {
      status: `active_${agentMeta.id}`,
      activeAgent: agentMeta.name
    });

    // 1. Format the Single Shared History for this agent
    const messages = await this.sharedHistory.formatForAgent(
      agentMeta.name,
      agentMeta.role,
      agentMeta.systemPrompt
    );

    // 2. Generate agent's thought, content, and tool calls
    const turnResult = await LLMService.generateAgentTurn(
      agentMeta.id,
      messages,
      session.taskDescription,
      session.llmProvider
    );

    const { thought, content, toolCalls = [] } = turnResult;
    const toolResults = [];

    // 3. Execute tool calls on real filesystem and host process runtime
    for (const tc of toolCalls) {
      if (tc.name === 'write_file') {
        const { filename, content: fileContent } = tc.arguments;
        // Real disk write
        const realWrite = await this.toolRunner.writeFile(filename, fileContent);
        // MongoDB / In-memory sync for live React editor
        await DBService.saveWorkspaceFile(this.sessionId, filename, fileContent, agentMeta.name);
        toolResults.push({
          toolCallId: tc.id,
          name: tc.name,
          output: realWrite.output,
          success: realWrite.success
        });
      } else if (tc.name === 'run_command' || tc.name === 'execute_test') {
        const cmd = tc.arguments.command || `node ${tc.arguments.testFile || 'testSuite.js'}`;
        // Real process execution in session workspace
        const cmdResult = await this.toolRunner.runCommand(cmd);
        toolResults.push({
          toolCallId: tc.id,
          name: 'run_command',
          output: `[Real Process Execution: '${cmd}' (Exit ${cmdResult.exitCode})]\n${cmdResult.output}`,
          success: cmdResult.success
        });
      } else if (tc.name === 'read_file') {
        try {
          const fileData = await this.toolRunner.readFile(tc.arguments.filename);
          toolResults.push({
            toolCallId: tc.id,
            name: tc.name,
            output: fileData.content,
            success: true
          });
        } catch (e) {
          toolResults.push({
            toolCallId: tc.id,
            name: tc.name,
            output: `Error reading file: ${e.message}`,
            success: false
          });
        }
      }
    }

    // 4. Append to Single Shared History
    const entry = await this.sharedHistory.appendEntry({
      senderName: agentMeta.name,
      senderRole: agentMeta.role,
      messageRole: 'assistant',
      thought,
      content,
      toolCalls,
      toolResults,
      metadata: {
        agentId: agentMeta.id,
        creator: agentMeta.creator,
        icon: agentMeta.icon,
        themeColor: agentMeta.themeColor
      }
    });

    await DBService.updateSession(this.sessionId, {
      status: 'idle',
      activeAgent: 'None'
    });

    return {
      agent: agentMeta,
      entry
    };
  }

  /**
   * Runs the full Unified Agent Council pipeline:
   * Antigravity -> Cursor -> Claude Code -> Devin -> Aider
   */
  async runCouncil(customPipeline = null) {
    const pipeline = customPipeline || ['antigravity', 'claude', 'cursor', 'devin', 'chatgpt', 'gemini'];
    const results = [];

    for (const agentId of pipeline) {
      const stepRes = await this.executeAgentTurn(agentId);
      results.push(stepRes);
    }

    await DBService.updateSession(this.sessionId, {
      status: 'completed',
      activeAgent: 'None'
    });

    return results;
  }

  /**
   * Determine next agent in default council cycle.
   */
  async determineNextCouncilAgent() {
    const history = await this.sharedHistory.getAllEntries();
    if (history.length === 0) return 'antigravity';

    const lastEntry = history[history.length - 1];
    const name = lastEntry.senderName.toLowerCase();

    if (name.includes('user') || name.includes('human')) return 'antigravity';
    if (name.includes('antigravity')) return 'claude';
    if (name.includes('claude')) return 'cursor';
    if (name.includes('cursor')) return 'devin';
    if (name.includes('devin')) return 'chatgpt';
    if (name.includes('chatgpt')) return 'gemini';
    if (name.includes('gemini')) return 'COMPLETE';

    return 'antigravity';
  }

  async stepNext() {
    const nextAgent = await this.determineNextCouncilAgent();
    if (nextAgent === 'COMPLETE') {
      await DBService.updateSession(this.sessionId, { status: 'completed', activeAgent: 'None' });
      return { completed: true, message: 'All council agents completed their tasks.' };
    }
    const res = await this.executeAgentTurn(nextAgent);
    const pendingNext = await this.determineNextCouncilAgent();
    return {
      completed: pendingNext === 'COMPLETE',
      executedAgent: res.agent.name,
      nextAgent: pendingNext,
      entry: res.entry
    };
  }
}

module.exports = UniversalOrchestrator;
