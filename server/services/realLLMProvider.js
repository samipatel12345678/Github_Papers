/**
 * Real LLM Providers:
 * High-performance direct integrations for:
 * 1. Google Gemini (Gemini 2.0 Flash / Gemini 1.5 Pro)
 * 2. Groq (Ultra-fast Llama-3.3-70b, Qwen-2.5-Coder)
 * 3. OpenRouter (Free models: Gemini 2.0 Flash Free, Llama 3.3 70B Free, DeepSeek R1 Free)
 * 4. Anthropic Claude (Claude 3.7 Sonnet / Claude 3.5 Sonnet)
 * 5. OpenAI (GPT-4o, GPT-4o-mini)
 * 6. Ollama / Local LLM (Ollama, LM Studio, vLLM)
 *
 * Includes universal model leasing: any active key powers all agents seamlessly.
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

class RealLLMProvider {
  /**
   * Dispatches agent turn to the appropriate live model with universal leasing fallback.
   */
  static async callLiveModel({
    agentId,
    systemPrompt,
    messages,
    apiKeys = {},
    preferredProvider = null
  }) {
    const geminiKey = apiKeys.gemini || process.env.GEMINI_API_KEY;
    const groqKey = apiKeys.groq || process.env.GROQ_API_KEY;
    const openRouterKey = apiKeys.openRouter || process.env.OPENROUTER_API_KEY;
    const anthropicKey = apiKeys.anthropic || process.env.ANTHROPIC_API_KEY;
    const openAIKey = apiKeys.openai || process.env.OPENAI_API_KEY;
    const ollamaUrl = apiKeys.ollamaUrl || process.env.OLLAMA_URL;

    const id = (agentId || '').toLowerCase();
    const pref = (preferredProvider || process.env.PREFERRED_PROVIDER || 'auto').toLowerCase();

    // 1. Explicit Preferred Provider override
    if (pref === 'gemini' && geminiKey) return await this._callGemini({ apiKey: geminiKey, systemPrompt, messages });
    if (pref === 'groq' && groqKey) return await this._callGroq({ apiKey: groqKey, systemPrompt, messages });
    if (pref === 'openrouter' && openRouterKey) return await this._callOpenRouter({ apiKey: openRouterKey, systemPrompt, messages });
    if (pref === 'anthropic' && anthropicKey) return await this._callAnthropic({ apiKey: anthropicKey, systemPrompt, messages });
    if (pref === 'openai' && openAIKey) return await this._callOpenAI({ apiKey: openAIKey, systemPrompt, messages });
    if (pref === 'ollama' && ollamaUrl) return await this._callOllama({ baseUrl: ollamaUrl, systemPrompt, messages });

    // 2. Native Agent Routing
    if ((id.includes('antigravity') || id.includes('gemini')) && geminiKey) {
      return await this._callGemini({ apiKey: geminiKey, systemPrompt, messages });
    }
    if (id.includes('claude') && anthropicKey) {
      return await this._callAnthropic({ apiKey: anthropicKey, systemPrompt, messages });
    }
    if ((id.includes('cursor') || id.includes('devin') || id.includes('chatgpt')) && openAIKey) {
      return await this._callOpenAI({ apiKey: openAIKey, systemPrompt, messages });
    }

    // 3. Universal Cross-Provider Leasing
    // If the agent's native key isn't provided, lease ANY available live key
    if (geminiKey) {
      return await this._callGemini({ apiKey: geminiKey, systemPrompt, messages });
    }
    if (groqKey) {
      return await this._callGroq({ apiKey: groqKey, systemPrompt, messages });
    }
    if (openRouterKey) {
      return await this._callOpenRouter({ apiKey: openRouterKey, systemPrompt, messages });
    }
    if (openAIKey) {
      return await this._callOpenAI({ apiKey: openAIKey, systemPrompt, messages });
    }
    if (anthropicKey) {
      return await this._callAnthropic({ apiKey: anthropicKey, systemPrompt, messages });
    }
    if (ollamaUrl) {
      return await this._callOllama({ baseUrl: ollamaUrl, systemPrompt, messages });
    }

    throw new Error(
      `No live AI key configured.\n` +
      `Enter a Google Gemini (free), Groq (free), OpenRouter (free), Anthropic, or OpenAI key in Settings (⚙️).`
    );
  }

  // --- 1. Google Gemini API (Free Tier available at aistudio.google.com) ---
  static async _callGemini({ apiKey, systemPrompt, messages, model = 'gemini-2.0-flash' }) {
    const contents = [];
    for (const m of messages) {
      if (m.role === 'system') continue;
      contents.push({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      });
    }

    if (contents.length === 0 || contents[0].role !== 'user') {
      contents.unshift({ role: 'user', parts: [{ text: 'Begin multi-agent coding collaboration.' }] });
    }

    const payload = JSON.stringify({
      systemInstruction: {
        parts: [{
          text: (
            `${systemPrompt}\n\n` +
            `You can reason inside <thought>...</thought>.\n` +
            `When you write or modify a code file in the workspace, output a tool block:\n` +
            `\`\`\`tool:write_file\n{"filename": "filename.js", "content": "...code here..."}\n\`\`\`\n` +
            `When you execute a terminal command or test runner, output:\n` +
            `\`\`\`tool:run_command\n{"command": "node testSuite.js"}\n\`\`\``
          )
        }]
      },
      contents,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 8192
      }
    });

    const res = await this._makeHttpsRequest({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/${model}:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, payload);

    const parsed = JSON.parse(res);
    if (parsed.error) {
      throw new Error(`Google Gemini Error (${parsed.error.code}): ${parsed.error.message}`);
    }

    const rawText = parsed.candidates?.[0]?.content?.parts?.map(p => p.text).join('\n') || '';
    return this._parseModelOutput(rawText, 'gemini');
  }

  // --- 2. Groq Cloud (Free Ultra-Fast API at console.groq.com) ---
  static async _callGroq({ apiKey, systemPrompt, messages, model = 'llama-3.3-70b-versatile' }) {
    const formatted = [
      {
        role: 'system',
        content: (
          `${systemPrompt}\n\n` +
          `You can reason inside <thought>...</thought>.\n` +
          `To write a workspace file, output:\n` +
          `\`\`\`tool:write_file\n{"filename": "filename.js", "content": "..."}\n\`\`\`\n` +
          `To run a terminal command, output:\n` +
          `\`\`\`tool:run_command\n{"command": "node testSuite.js"}\n\`\`\``
        )
      }
    ];

    for (const m of messages) {
      if (m.role === 'system') continue;
      formatted.push({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      });
    }

    const payload = JSON.stringify({
      model,
      messages: formatted,
      temperature: 0.2,
      max_tokens: 4096
    });

    const res = await this._makeHttpsRequest({
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    }, payload);

    const parsed = JSON.parse(res);
    if (parsed.error) {
      throw new Error(`Groq API Error: ${parsed.error.message || JSON.stringify(parsed.error)}`);
    }

    const rawText = parsed.choices?.[0]?.message?.content || '';
    return this._parseModelOutput(rawText, 'groq');
  }

  // --- 3. OpenRouter (Free models at openrouter.ai/keys) ---
  static async _callOpenRouter({ apiKey, systemPrompt, messages, model = 'google/gemini-2.0-flash-exp:free' }) {
    const formatted = [
      {
        role: 'system',
        content: (
          `${systemPrompt}\n\n` +
          `You can reason inside <thought>...</thought>.\n` +
          `To write a file: \`\`\`tool:write_file\n{"filename": "...", "content": "..."}\n\`\`\`\n` +
          `To run a command: \`\`\`tool:run_command\n{"command": "node testSuite.js"}\n\`\`\``
        )
      }
    ];

    for (const m of messages) {
      if (m.role === 'system') continue;
      formatted.push({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      });
    }

    const payload = JSON.stringify({
      model,
      messages: formatted,
      temperature: 0.2
    });

    const res = await this._makeHttpsRequest({
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:5000',
        'X-Title': 'Google Antigravity Multi-Agent Studio'
      }
    }, payload);

    const parsed = JSON.parse(res);
    if (parsed.error) {
      throw new Error(`OpenRouter Error: ${parsed.error.message || JSON.stringify(parsed.error)}`);
    }

    const rawText = parsed.choices?.[0]?.message?.content || '';
    return this._parseModelOutput(rawText, 'openrouter');
  }

  // --- 4. Anthropic API (Claude 3.7 / 3.5 Sonnet) ---
  static async _callAnthropic({ apiKey, systemPrompt, messages, model = 'claude-3-7-sonnet-20250219' }) {
    const formatted = [];
    for (const m of messages) {
      if (m.role === 'system') continue;
      formatted.push({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      });
    }

    if (formatted.length === 0 || formatted[0].role !== 'user') {
      formatted.unshift({ role: 'user', content: 'Begin collaboration.' });
    }

    const payload = JSON.stringify({
      model,
      max_tokens: 4096,
      system: (
        `${systemPrompt}\n\n` +
        `You can reason inside <thought>...</thought>.\n` +
        `When authoring a file: \`\`\`tool:write_file\n{"filename": "...", "content": "..."}\n\`\`\`\n` +
        `When executing a command: \`\`\`tool:run_command\n{"command": "node testSuite.js"}\n\`\`\``
      ),
      messages: formatted,
      temperature: 0.2
    });

    const res = await this._makeHttpsRequest({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      }
    }, payload);

    const parsed = JSON.parse(res);
    if (parsed.error) {
      throw new Error(`Anthropic Error: ${parsed.error.message || JSON.stringify(parsed.error)}`);
    }

    const rawText = parsed.content?.map(c => c.text).join('\n') || '';
    return this._parseModelOutput(rawText, 'anthropic');
  }

  // --- 5. OpenAI API (GPT-4o) ---
  static async _callOpenAI({ apiKey, systemPrompt, messages, model = 'gpt-4o' }) {
    const formatted = [
      {
        role: 'system',
        content: (
          `${systemPrompt}\n\n` +
          `You can reason inside <thought>...</thought>.\n` +
          `To write a file: \`\`\`tool:write_file\n{"filename": "...", "content": "..."}\n\`\`\`\n` +
          `To run a command: \`\`\`tool:run_command\n{"command": "node testSuite.js"}\n\`\`\``
        )
      }
    ];

    for (const m of messages) {
      if (m.role === 'system') continue;
      formatted.push({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      });
    }

    const payload = JSON.stringify({
      model,
      messages: formatted,
      temperature: 0.2
    });

    const res = await this._makeHttpsRequest({
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    }, payload);

    const parsed = JSON.parse(res);
    if (parsed.error) {
      throw new Error(`OpenAI Error: ${parsed.error.message || JSON.stringify(parsed.error)}`);
    }

    const rawText = parsed.choices?.[0]?.message?.content || '';
    return this._parseModelOutput(rawText, 'openai');
  }

  // --- 6. Ollama / Local OpenAI-Compatible ---
  static async _callOllama({ baseUrl, apiKey = 'ollama', systemPrompt, messages, model = 'llama3' }) {
    const urlObj = new URL(baseUrl);
    const formatted = [
      { role: 'system', content: `${systemPrompt}\n\nTo write a file: \`\`\`tool:write_file\n{"filename": "...", "content": "..."}\n\`\`\`` }
    ];

    for (const m of messages) {
      if (m.role === 'system') continue;
      formatted.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content });
    }

    const payload = JSON.stringify({
      model,
      messages: formatted,
      temperature: 0.2
    });

    const isHttps = urlObj.protocol === 'https:';
    const reqModule = isHttps ? https : http;

    return new Promise((resolve, reject) => {
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname.endsWith('/chat/completions')
          ? urlObj.pathname
          : `${urlObj.pathname.replace(/\/$/, '')}/v1/chat/completions`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      };

      const req = reqModule.request(options, (resp) => {
        let data = '';
        resp.on('data', chunk => data += chunk);
        resp.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            const rawText = parsed.choices?.[0]?.message?.content || '';
            resolve(RealLLMProvider._parseModelOutput(rawText, 'ollama'));
          } catch (e) {
            reject(new Error(`Ollama/Local parse error: ${e.message} (Raw: ${data})`));
          }
        });
      });

      req.on('error', reject);
      req.write(payload);
      req.end();
    });
  }

  // --- Fast Diagnostic Ping Test ---
  static async testConnection({ provider, apiKey, baseUrl }) {
    const t0 = Date.now();
    const p = (provider || '').toLowerCase();

    if (p === 'gemini') {
      await this._callGemini({ apiKey, systemPrompt: 'Ping test', messages: [{ role: 'user', content: 'Say OK' }] });
      return { success: true, provider: 'Google Gemini', model: 'gemini-2.0-flash', latencyMs: Date.now() - t0 };
    }
    if (p === 'groq') {
      await this._callGroq({ apiKey, systemPrompt: 'Ping test', messages: [{ role: 'user', content: 'Say OK' }] });
      return { success: true, provider: 'Groq', model: 'llama-3.3-70b-versatile', latencyMs: Date.now() - t0 };
    }
    if (p === 'openrouter') {
      await this._callOpenRouter({ apiKey, systemPrompt: 'Ping test', messages: [{ role: 'user', content: 'Say OK' }] });
      return { success: true, provider: 'OpenRouter', model: 'gemini-2.0-flash-exp:free', latencyMs: Date.now() - t0 };
    }
    if (p === 'anthropic') {
      await this._callAnthropic({ apiKey, systemPrompt: 'Ping test', messages: [{ role: 'user', content: 'Say OK' }] });
      return { success: true, provider: 'Anthropic', model: 'claude-3-7-sonnet', latencyMs: Date.now() - t0 };
    }
    if (p === 'openai') {
      await this._callOpenAI({ apiKey, systemPrompt: 'Ping test', messages: [{ role: 'user', content: 'Say OK' }] });
      return { success: true, provider: 'OpenAI', model: 'gpt-4o', latencyMs: Date.now() - t0 };
    }
    if (p === 'ollama') {
      await this._callOllama({ baseUrl, systemPrompt: 'Ping test', messages: [{ role: 'user', content: 'Say OK' }] });
      return { success: true, provider: 'Ollama', model: 'local', latencyMs: Date.now() - t0 };
    }

    throw new Error(`Unknown provider: ${provider}`);
  }

  // --- Resilient Parser: Extracts Thoughts & Code Blocks / Tools ---
  static _parseModelOutput(raw, sourceTag = 'live') {
    let thought = null;
    let content = raw;

    // 1. Extract thought blocks: <thought>...</thought> or <thinking>...</thinking>
    const thoughtMatch = raw.match(/<(thought|thinking)>([\s\S]*?)<\/\1>/i);
    if (thoughtMatch) {
      thought = thoughtMatch[2].trim();
      content = content.replace(thoughtMatch[0], '').trim();
    }

    // 2. Extract explicit tool calls (```tool:write_file ...)
    const toolCalls = [];
    const toolRegex = /```tool:(\w+)[\r\n]+([\s\S]*?)```/g;
    let match;
    let tcIndex = 1;

    while ((match = toolRegex.exec(content)) !== null) {
      const toolName = match[1];
      const jsonArgsStr = match[2].trim();
      try {
        const args = JSON.parse(jsonArgsStr);
        toolCalls.push({
          id: `call_${tcIndex++}_${toolName}`,
          name: toolName,
          arguments: args
        });
      } catch (err) {
        console.warn(`[Tool parse error]`, err.message);
      }
    }

    // 3. Fallback: If no explicit tool blocks, check for code files in markdown blocks
    // e.g. ```javascript /* filename: xxx.js */ or ```js // filename: xxx.js
    if (toolCalls.length === 0) {
      const fileCodeRegex = /```(?:javascript|js|typescript|ts|python|py|html|css|json)?[\r\n]+(?:\/\/\s*(?:filename|file):\s*([a-zA-Z0-9_\-\.\/]+)[\r\n]+)?([\s\S]*?)```/gi;
      let fileMatch;
      while ((fileMatch = fileCodeRegex.exec(content)) !== null) {
        const detectedName = fileMatch[1];
        const codeBlock = fileMatch[2].trim();
        if (codeBlock.length > 30) {
          const fn = detectedName || (codeBlock.includes('assert') || codeBlock.includes('test(') ? 'testSuite.js' : 'coreService.js');
          toolCalls.push({
            id: `call_${tcIndex++}_write_file`,
            name: 'write_file',
            arguments: { filename: fn, content: codeBlock }
          });
        }
      }
    }

    return {
      thought: thought || `[${sourceTag.toUpperCase()} Live Inference] Completed model turn with token verification.`,
      content,
      toolCalls
    };
  }

  static _makeHttpsRequest(options, payload) {
    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      });
      req.on('error', reject);
      if (payload) {
        req.write(payload);
      }
      req.end();
    });
  }
}

module.exports = RealLLMProvider;
