/**
 * SingleSharedHistory Manager for MERN multi-agent system.
 * 
 * Central invariant:
 * Every collaborating agent is bound to this exact single history stream.
 * All decisions, code outputs, reviews, and test assertions are committed
 * to the shared MongoDB timeline.
 */

const DBService = require('../services/dbService');

class SingleSharedHistory {
  constructor(sessionId) {
    this.sessionId = sessionId;
  }

  async getAllEntries() {
    return await DBService.getHistory(this.sessionId);
  }

  async appendEntry({ senderName, senderRole, messageRole, thought, content, toolCalls, toolResults, metadata }) {
    return await DBService.appendHistoryEntry(this.sessionId, {
      senderName,
      senderRole,
      messageRole: messageRole || 'assistant',
      thought: thought || null,
      content: content || '',
      toolCalls: toolCalls || [],
      toolResults: toolResults || [],
      metadata: metadata || {}
    });
  }

  /**
   * Projects the single shared history into an LLM-compatible chat format for a specific agent.
   * 
   * This is how multiple distinct agents share ONE unified history:
   * - Items created by THIS agent in earlier steps are delivered as 'assistant' messages.
   * - Items created by PEER agents (e.g. Coder seeing Architect's plan) or the USER
   *   are delivered as 'user' observations with clear provenance headers:
   *   "[AGENT: Architect (Role: Architect) - Step 2] ..."
   */
  async formatForAgent(agentName, agentRole, systemInstructions) {
    const rawEntries = await this.getAllEntries();

    const messages = [];

    // System prompt with multi-agent context
    messages.push({
      role: 'system',
      content: `${systemInstructions}\n\n` +
        `=== SHARED HISTORY MULTI-AGENT ENVIRONMENT ===\n` +
        `You are '${agentName}' (${agentRole}).\n` +
        `You and your peer agents (Architect, Coder, Reviewer, Tester) share this single unified timeline.\n` +
        `Entries from other agents appear prefixed with '[AGENT: <Name> (<Role>)]'.\n` +
        `Review previous findings, code, and comments in the history before acting.`
    });

    for (const entry of rawEntries) {
      if (entry.senderRole === 'Human') {
        messages.push({
          role: 'user',
          content: `[USER TASK / REQUEST]:\n${entry.content}`
        });
      } else if (entry.senderName === agentName) {
        let text = '';
        if (entry.thought) text += `<thought>\n${entry.thought}\n</thought>\n\n`;
        text += entry.content;
        if (entry.toolCalls && entry.toolCalls.length > 0) {
          text += `\n\n[Tools Executed]: ${entry.toolCalls.map(tc => `${tc.name}(${JSON.stringify(tc.arguments)})`).join(', ')}`;
        }
        if (entry.toolResults && entry.toolResults.length > 0) {
          text += `\n[Tool Outputs]:\n${entry.toolResults.map(tr => `${tr.name}: ${tr.output}`).join('\n')}`;
        }
        messages.push({ role: 'assistant', content: text });
      } else {
        let text = `[AGENT: ${entry.senderName} (${entry.senderRole}) - Step ${entry.stepNumber}]\n`;
        if (entry.thought) text += `Internal Reasoning: ${entry.thought}\n\n`;
        text += `Message:\n${entry.content}\n`;
        if (entry.toolCalls && entry.toolCalls.length > 0) {
          text += `\nTool Calls:\n${entry.toolCalls.map(tc => `- ${tc.name}: ${JSON.stringify(tc.arguments)}`).join('\n')}\n`;
        }
        if (entry.toolResults && entry.toolResults.length > 0) {
          text += `\nTool Outputs:\n${entry.toolResults.map(tr => `- ${tr.name} (${tr.success ? 'Success' : 'Failed'}): ${tr.output}`).join('\n')}`;
        }
        messages.push({ role: 'user', content: text });
      }
    }

    return messages;
  }
}

module.exports = SingleSharedHistory;
