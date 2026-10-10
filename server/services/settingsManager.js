/**
 * Settings Manager:
 * Manages live API keys (Google Gemini, Groq, OpenRouter, Anthropic, OpenAI, Ollama)
 * dynamically from the UI and updates the .env file on disk.
 */

const fs = require('fs');
const path = require('path');

const ENV_PATH = path.join(__dirname, '../../.env');

class SettingsManager {
  static getSettings() {
    return {
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()),
      geminiKeyMasked: this._maskKey(process.env.GEMINI_API_KEY),
      hasGroqKey: Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim()),
      groqKeyMasked: this._maskKey(process.env.GROQ_API_KEY),
      hasOpenRouterKey: Boolean(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.trim()),
      openRouterKeyMasked: this._maskKey(process.env.OPENROUTER_API_KEY),
      hasAnthropicKey: Boolean(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.trim()),
      anthropicKeyMasked: this._maskKey(process.env.ANTHROPIC_API_KEY),
      hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim()),
      openAIKeyMasked: this._maskKey(process.env.OPENAI_API_KEY),
      ollamaUrl: process.env.OLLAMA_URL || '',
      preferredProvider: process.env.PREFERRED_PROVIDER || 'auto', // 'auto' | 'gemini' | 'groq' | 'openrouter' | 'anthropic' | 'openai' | 'ollama'
      preferredMode: process.env.AGENT_MODE || 'live'
    };
  }

  static updateSettings(newSettings = {}) {
    if (newSettings.geminiKey !== undefined) {
      process.env.GEMINI_API_KEY = newSettings.geminiKey.trim();
    }
    if (newSettings.groqKey !== undefined) {
      process.env.GROQ_API_KEY = newSettings.groqKey.trim();
    }
    if (newSettings.openRouterKey !== undefined) {
      process.env.OPENROUTER_API_KEY = newSettings.openRouterKey.trim();
    }
    if (newSettings.anthropicKey !== undefined) {
      process.env.ANTHROPIC_API_KEY = newSettings.anthropicKey.trim();
    }
    if (newSettings.openAIKey !== undefined) {
      process.env.OPENAI_API_KEY = newSettings.openAIKey.trim();
    }
    if (newSettings.ollamaUrl !== undefined) {
      process.env.OLLAMA_URL = newSettings.ollamaUrl.trim();
    }
    if (newSettings.preferredProvider !== undefined) {
      process.env.PREFERRED_PROVIDER = newSettings.preferredProvider;
    }
    if (newSettings.preferredMode !== undefined) {
      process.env.AGENT_MODE = newSettings.preferredMode;
    }

    // Persist to .env on disk
    this._saveToEnvFile();

    return this.getSettings();
  }

  static _maskKey(key) {
    if (!key || key.length < 8) return '';
    return key.substring(0, 7) + '...' + key.substring(key.length - 4);
  }

  static _saveToEnvFile() {
    try {
      let content = '';
      content += `PORT=${process.env.PORT || 5000}\n`;
      content += `MONGODB_URI=${process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/multi_coding_agents'}\n`;
      if (process.env.GEMINI_API_KEY) content += `GEMINI_API_KEY=${process.env.GEMINI_API_KEY}\n`;
      if (process.env.GROQ_API_KEY) content += `GROQ_API_KEY=${process.env.GROQ_API_KEY}\n`;
      if (process.env.OPENROUTER_API_KEY) content += `OPENROUTER_API_KEY=${process.env.OPENROUTER_API_KEY}\n`;
      if (process.env.ANTHROPIC_API_KEY) content += `ANTHROPIC_API_KEY=${process.env.ANTHROPIC_API_KEY}\n`;
      if (process.env.OPENAI_API_KEY) content += `OPENAI_API_KEY=${process.env.OPENAI_API_KEY}\n`;
      if (process.env.OLLAMA_URL) content += `OLLAMA_URL=${process.env.OLLAMA_URL}\n`;
      if (process.env.PREFERRED_PROVIDER) content += `PREFERRED_PROVIDER=${process.env.PREFERRED_PROVIDER}\n`;
      if (process.env.AGENT_MODE) content += `AGENT_MODE=${process.env.AGENT_MODE}\n`;

      fs.writeFileSync(ENV_PATH, content, 'utf-8');
    } catch (err) {
      console.warn('[SettingsManager] Could not persist to .env:', err.message);
    }
  }
}

module.exports = SettingsManager;
