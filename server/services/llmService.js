/**
 * Unified LLM Service linking live RealLLMProvider (Gemini, Groq, OpenRouter, Anthropic, OpenAI, Ollama)
 * with DynamicAgentEngine for contextual, task-aware code generation.
 */

const RealLLMProvider = require('./realLLMProvider');
const DynamicAgentEngine = require('./dynamicAgentEngine');

class LLMService {
  static async generateAgentTurn(agentId, messages, taskDescription, provider = 'auto') {
    const hasGemini = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());
    const hasGroq = Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim());
    const hasOpenRouter = Boolean(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.trim());
    const hasAnthropic = Boolean(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.trim());
    const hasOpenAI = Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim());
    const hasOllama = Boolean(process.env.OLLAMA_URL && process.env.OLLAMA_URL.trim());

    const hasAnyLiveKey = hasGemini || hasGroq || hasOpenRouter || hasAnthropic || hasOpenAI || hasOllama;

    // 1. If any live key is available, call Real LLM Provider
    if (hasAnyLiveKey && provider !== 'mock') {
      try {
        const cleanId = (agentId || '').toLowerCase();
        let targetSystemPrompt = `You are ${agentId}, participating in a unified multi-agent coding room where all agents share a single conversation history and real disk workspace.`;

        if (cleanId.includes('antigravity')) {
          targetSystemPrompt = (
            `You are Antigravity by Google DeepMind. You share this exact conversation with Claude, Cursor, and Devin.\n` +
            `Your core mission: Architect the system, define mathematical/structural invariants, specify boundary contracts, and outline the workspace file topology.`
          );
        } else if (cleanId.includes('claude')) {
          targetSystemPrompt = (
            `You are Claude by Anthropic. You share this exact conversation with Antigravity, Cursor, and Devin.\n` +
            `Your core mission: Perform deep security analysis, boundary verification, resource exhaustion audits, and nuanced edge-case logic.`
          );
        } else if (cleanId.includes('cursor')) {
          targetSystemPrompt = (
            `You are Cursor (Composer Agent). You share this conversation with Antigravity, Claude, and Devin.\n` +
            `Your core mission: Surgical, clean, production-grade code synthesis. Write real, working code matching the user's requirements.\n` +
            `To save or write a file, you MUST output:\n` +
            `\`\`\`tool:write_file\n{"filename": "name.js", "content": "..."}\n\`\`\``
          );
        } else if (cleanId.includes('devin')) {
          targetSystemPrompt = (
            `You are Devin by Cognition. You share this conversation with Antigravity, Claude, and Cursor.\n` +
            `Your core mission: Autonomous software engineering and QA. Write comprehensive automated unit tests and execute them in the sandbox.\n` +
            `To author a test file, output:\n` +
            `\`\`\`tool:write_file\n{"filename": "testSuite.js", "content": "..."}\n\`\`\`\n` +
            `To run the test runner, output:\n` +
            `\`\`\`tool:run_command\n{"command": "node testSuite.js"}\n\`\`\``
          );
        } else if (cleanId.includes('chatgpt')) {
          targetSystemPrompt = `You are ChatGPT by OpenAI. Provide strategic ecosystem context, framework ergonomics, and practical integration advice.`;
        } else if (cleanId.includes('gemini')) {
          targetSystemPrompt = `You are Gemini by Google. Synthesize cross-cutting context across the entire timeline of agent turns.`;
        }

        const liveResult = await RealLLMProvider.callLiveModel({
          agentId,
          systemPrompt: targetSystemPrompt,
          messages,
          preferredProvider: provider
        });

        console.log(`[LLMService] Live inference successfully completed for '${agentId}'.`);
        return liveResult;
      } catch (err) {
        console.warn(`[Live Model Error for ${agentId}: ${err.message}]. Falling back to Dynamic Autonomous Engine.`);
      }
    }

    // 2. Dynamic Autonomous Engine: Inspects the user's actual prompt & context
    console.log(`[LLMService] Running Dynamic Autonomous Engine for '${agentId}'.`);
    const historyArray = Array.isArray(messages) ? messages : [];
    return DynamicAgentEngine.generateTurn(agentId, taskDescription, historyArray);
  }
}

module.exports = LLMService;
