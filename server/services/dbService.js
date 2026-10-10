/**
 * Database abstraction service supporting both MongoDB (Mongoose) and In-Memory Fallback.
 */

const { getIsConnected, fallbackStore } = require('../config/db');
const Session = require('../models/Session');
const HistoryEntry = require('../models/HistoryEntry');
const WorkspaceFile = require('../models/WorkspaceFile');
const { v4: uuidv4 } = require('uuid');

class DBService {
  // --- Sessions ---
  static async createSession(data) {
    const id = data.id || `sess_${uuidv4().substring(0, 8)}`;
    const sessionData = {
      id,
      title: data.title || 'Collaborative Coding Session',
      taskDescription: data.taskDescription || '',
      status: 'idle',
      activeAgent: 'None',
      totalSteps: 0,
      llmProvider: data.llmProvider || 'mock',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (getIsConnected()) {
      const doc = new Session(sessionData);
      await doc.save();
      return doc.toObject();
    } else {
      fallbackStore.sessions.set(id, sessionData);
      fallbackStore.historyEntries.set(id, []);
      fallbackStore.workspaceFiles.set(id, new Map());
      return { ...sessionData };
    }
  }

  static async getSession(sessionId) {
    if (getIsConnected()) {
      const doc = await Session.findOne({ id: sessionId });
      return doc ? doc.toObject() : null;
    } else {
      return fallbackStore.sessions.get(sessionId) || null;
    }
  }

  static async listSessions() {
    if (getIsConnected()) {
      return await Session.find().sort({ updatedAt: -1 }).lean();
    } else {
      return Array.from(fallbackStore.sessions.values()).sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
      );
    }
  }

  static async updateSession(sessionId, updates) {
    updates.updatedAt = new Date();
    if (getIsConnected()) {
      return await Session.findOneAndUpdate({ id: sessionId }, { $set: updates }, { new: true }).lean();
    } else {
      const sess = fallbackStore.sessions.get(sessionId);
      if (!sess) return null;
      Object.assign(sess, updates);
      return { ...sess };
    }
  }

  // --- Single Shared History Entries ---
  static async getHistory(sessionId) {
    if (getIsConnected()) {
      return await HistoryEntry.find({ sessionId }).sort({ stepNumber: 1 }).lean();
    } else {
      const entries = fallbackStore.historyEntries.get(sessionId) || [];
      return [...entries].sort((a, b) => a.stepNumber - b.stepNumber);
    }
  }

  static async appendHistoryEntry(sessionId, entryData) {
    const history = await this.getHistory(sessionId);
    const nextStep = history.length + 1;
    const entryId = entryData.id || `hist_${uuidv4().substring(0, 8)}`;

    const fullEntry = {
      id: entryId,
      sessionId,
      stepNumber: nextStep,
      timestamp: new Date(),
      senderName: entryData.senderName,
      senderRole: entryData.senderRole,
      messageRole: entryData.messageRole || 'assistant',
      thought: entryData.thought || null,
      content: entryData.content || '',
      toolCalls: entryData.toolCalls || [],
      toolResults: entryData.toolResults || [],
      metadata: entryData.metadata || {}
    };

    if (getIsConnected()) {
      const doc = new HistoryEntry(fullEntry);
      await doc.save();
      await Session.findOneAndUpdate({ id: sessionId }, { totalSteps: nextStep, updatedAt: new Date() });
      return doc.toObject();
    } else {
      if (!fallbackStore.historyEntries.has(sessionId)) {
        fallbackStore.historyEntries.set(sessionId, []);
      }
      fallbackStore.historyEntries.get(sessionId).push(fullEntry);
      const sess = fallbackStore.sessions.get(sessionId);
      if (sess) {
        sess.totalSteps = nextStep;
        sess.updatedAt = new Date();
      }
      return { ...fullEntry };
    }
  }

  // --- Workspace Files ---
  static async saveWorkspaceFile(sessionId, filename, content, lastModifiedBy = 'Coder') {
    const ext = filename.split('.').pop() || '';
    const langMap = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      json: 'json',
      md: 'markdown',
      html: 'html',
      css: 'css'
    };
    const language = langMap[ext] || 'text';

    if (getIsConnected()) {
      return await WorkspaceFile.findOneAndUpdate(
        { sessionId, filename },
        {
          $set: { content, language, lastModifiedBy, updatedAt: new Date() },
          $inc: { version: 1 }
        },
        { upsert: true, new: true }
      ).lean();
    } else {
      if (!fallbackStore.workspaceFiles.has(sessionId)) {
        fallbackStore.workspaceFiles.set(sessionId, new Map());
      }
      const filesMap = fallbackStore.workspaceFiles.get(sessionId);
      const existing = filesMap.get(filename);
      const fileData = {
        sessionId,
        filename,
        content,
        language,
        version: existing ? existing.version + 1 : 1,
        lastModifiedBy,
        updatedAt: new Date()
      };
      filesMap.set(filename, fileData);
      return { ...fileData };
    }
  }

  static async getWorkspaceFiles(sessionId) {
    if (getIsConnected()) {
      return await WorkspaceFile.find({ sessionId }).sort({ filename: 1 }).lean();
    } else {
      const filesMap = fallbackStore.workspaceFiles.get(sessionId);
      if (!filesMap) return [];
      return Array.from(filesMap.values()).sort((a, b) => a.filename.localeCompare(b.filename));
    }
  }

  static async getWorkspaceFile(sessionId, filename) {
    if (getIsConnected()) {
      return await WorkspaceFile.findOne({ sessionId, filename }).lean();
    } else {
      const filesMap = fallbackStore.workspaceFiles.get(sessionId);
      return filesMap ? filesMap.get(filename) || null : null;
    }
  }

  static async deleteWorkspaceFile(sessionId, filename) {
    if (getIsConnected()) {
      return await WorkspaceFile.deleteOne({ sessionId, filename });
    } else {
      const filesMap = fallbackStore.workspaceFiles.get(sessionId);
      if (filesMap) {
        filesMap.delete(filename);
      }
      return { acknowledged: true, deletedCount: 1 };
    }
  }
}

module.exports = DBService;
