const express = require('express');
const router = express.Router();
const DBService = require('../services/dbService');
const Orchestrator = require('../agents/Orchestrator');
const UniversalOrchestrator = require('../agents/UniversalOrchestrator');
const SettingsManager = require('../services/settingsManager');
const RealToolRunner = require('../services/realToolRunner');
const RealLLMProvider = require('../services/realLLMProvider');
const { AGENT_CATALOG } = require('../config/agentsCatalog');
const { getDBStatus } = require('../config/db');

// Health and DB Status
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    database: getDBStatus(),
    settings: SettingsManager.getSettings(),
    timestamp: new Date()
  });
});

// Get current live API key status
router.get('/settings', (req, res) => {
  res.json(SettingsManager.getSettings());
});

// Update live API keys (Gemini, Groq, OpenRouter, Anthropic, OpenAI, Ollama)
router.post('/settings', (req, res) => {
  try {
    const updated = SettingsManager.updateSettings(req.body);
    res.json({ success: true, settings: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Test live API connectivity
router.post('/settings/test', async (req, res) => {
  try {
    const { provider, apiKey, baseUrl } = req.body;
    const testResult = await RealLLMProvider.testConnection({ provider, apiKey, baseUrl });
    res.json(testResult);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Create new session
router.post('/sessions', async (req, res) => {
  try {
    const { title, taskDescription, llmProvider } = req.body;
    if (!taskDescription) {
      return res.status(400).json({ error: 'taskDescription is required' });
    }

    const session = await DBService.createSession({
      title: title || 'Coding Task',
      taskDescription,
      llmProvider: llmProvider || 'mock'
    });

    // Record the user's initial task into the Single Shared History as Step 1
    await DBService.appendHistoryEntry(session.id, {
      senderName: 'User',
      senderRole: 'Human',
      messageRole: 'user',
      content: taskDescription
    });

    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List all sessions
router.get('/sessions', async (req, res) => {
  try {
    const sessions = await DBService.listSessions();
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get session details
router.get('/sessions/:id', async (req, res) => {
  try {
    const session = await DBService.getSession(req.params.id);
    if (!session) return res.status(400).json({ error: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Single Shared History
router.get('/sessions/:id/history', async (req, res) => {
  try {
    const history = await DBService.getHistory(req.params.id);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Workspace Files
router.get('/sessions/:id/files', async (req, res) => {
  try {
    const files = await DBService.getWorkspaceFiles(req.params.id);
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save / Update / Create Workspace File from Code Editor
router.post('/sessions/:id/files', async (req, res) => {
  try {
    const { filename, content, notifyReviewer } = req.body;
    if (!filename) return res.status(400).json({ error: 'filename is required' });

    // Sync to physical disk
    const runner = new RealToolRunner(req.params.id);
    await runner.writeFile(filename, content || '');

    // Sync to DB/Memory store
    const savedFile = await DBService.saveWorkspaceFile(req.params.id, filename, content || '', 'User');

    // If requested, commit this user edit to the Single Shared History
    if (notifyReviewer) {
      await DBService.appendHistoryEntry(req.params.id, {
        senderName: 'User',
        senderRole: 'Human',
        messageRole: 'user',
        content: `I have updated file \`${filename}\` in the editor.\n\`\`\`${savedFile.language}\n${content}\n\`\`\`\nPlease audit these changes.`
      });

      // Trigger Claude or Reviewer agent directly
      const orchestrator = new UniversalOrchestrator(req.params.id);
      const stepRes = await orchestrator.executeAgentTurn('claude', `Audit file ${filename}`);
      return res.json({ file: savedFile, agentReview: stepRes });
    }

    res.json({ file: savedFile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Workspace File
router.delete('/sessions/:id/files/:filename', async (req, res) => {
  try {
    // Delete from physical disk
    const runner = new RealToolRunner(req.params.id);
    await runner.deleteFile(req.params.filename);

    // Delete from DB/Memory store
    await DBService.deleteWorkspaceFile(req.params.id, req.params.filename);
    res.json({ success: true, deleted: req.params.filename });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all available AI Coding Agents (Antigravity, Cursor, Devin, Claude Code, etc.)
router.get('/agents', (req, res) => {
  res.json(AGENT_CATALOG);
});

// Summon a specific agent (e.g. cursor, antigravity, devin) to take a turn on the Single Shared History
router.post('/sessions/:id/summon-agent', async (req, res) => {
  try {
    const { agentId, instruction } = req.body;
    if (!agentId) return res.status(400).json({ error: 'agentId is required' });

    const orchestrator = new UniversalOrchestrator(req.params.id);
    const result = await orchestrator.executeAgentTurn(agentId, instruction);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Step: Execute single next agent turn in the council
router.post('/sessions/:id/step', async (req, res) => {
  try {
    const orchestrator = new UniversalOrchestrator(req.params.id);
    const result = await orchestrator.stepNext();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Run Council: Execute full multi-agent pipeline (Antigravity -> Cursor -> Claude Code -> Devin -> Aider)
router.post('/sessions/:id/run-all', async (req, res) => {
  try {
    const orchestrator = new UniversalOrchestrator(req.params.id);
    const results = await orchestrator.runCouncil();
    res.json({ success: true, steps: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Append human follow-up message to the single history
router.post('/sessions/:id/user-message', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'content is required' });

    const entry = await DBService.appendHistoryEntry(req.params.id, {
      senderName: 'User',
      senderRole: 'Human',
      messageRole: 'user',
      content
    });

    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
