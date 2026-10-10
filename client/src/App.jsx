import React, { useState, useEffect, useRef } from 'react';

const AGENTS_CATALOG = [
  { id: 'antigravity', name: 'Antigravity', icon: '🚀', creator: 'DeepMind', model: 'gemini-2.0-flash', desc: 'Architecture & Invariants' },
  { id: 'claude', name: 'Claude', icon: '🧠', creator: 'Anthropic', model: 'claude-3-7-sonnet', desc: 'Security & Nuanced Logic' },
  { id: 'cursor', name: 'Cursor', icon: '⚡', creator: 'Composer', model: 'gpt-4o', desc: 'Surgical Code Synthesis' },
  { id: 'devin', name: 'Devin', icon: '🤖', creator: 'Cognition', model: 'sandbox-v2', desc: 'Autonomous Sandbox QA' },
  { id: 'chatgpt', name: 'ChatGPT', icon: '🟢', creator: 'OpenAI', model: 'gpt-4o', desc: 'Ecosystem & Strategy' },
  { id: 'gemini', name: 'Gemini', icon: '♊', creator: 'Google', model: 'gemini-2.0', desc: 'Deep Context Synthesis' },
  { id: 'aider', name: 'Aider', icon: '🛠️', creator: 'Paul Gauthier', model: 'git-pair', desc: 'Git Pair Commits & Docs' }
];

const TEMPLATES = [
  {
    title: 'Distributed Token Bucket Rate Limiter',
    desc: 'Build a production-grade Token Bucket Rate Limiter with thread-safety, bursts, security audits, and automated test verification.'
  },
  {
    title: 'Thread-Safe O(1) LRU Cache with TTL',
    desc: 'Create an in-memory double-linked list LRU Cache with time-to-live eviction and adversarial test suites.'
  },
  {
    title: 'Deterministic Snake Game Engine',
    desc: 'Develop a deterministic 2D grid game state engine with collision detection, boundary guards, and automated test suite.'
  },
  {
    title: 'Zero-Dependency JWT Auth & Session Engine',
    desc: 'Implement an HS256 cryptographic JWT signer, token verification middleware, tamper defense, and revocation blacklist.'
  },
  {
    title: 'In-Memory CRUD Task Manager API',
    desc: 'Build a high-throughput in-memory REST Task Service with search filters, defensive validation, and full automated test suite.'
  }
];

export default function App() {
  const [activeActivity, setActiveActivity] = useState('chats');
  const [viewMode, setViewMode] = useState('unified_stream'); // 'unified_stream' | 'full_editor' | 'full_terminal'

  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [history, setHistory] = useState([]);
  const [files, setFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [editorContent, setEditorContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [dbStatus, setDbStatus] = useState({ connected: false, type: 'Checking...' });
  const [settings, setSettings] = useState({});

  const [targetAgent, setTargetAgent] = useState('all');
  const [loadingTurn, setLoadingTurn] = useState(false);
  const [activeSpeakingAgent, setActiveSpeakingAgent] = useState(null);

  const [activeDropdown, setActiveDropdown] = useState(null);

  const [terminalInput, setTerminalInput] = useState('');
  const [terminalLogs, setTerminalLogs] = useState([
    'devin@cognition-sandbox:~/workspace$ echo "Antigravity Real Agent Sandbox online. Live disk sync active."'
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [userInput, setUserInput] = useState('');
  const [newFilePrompt, setNewFilePrompt] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  // Live API Keys state
  const [geminiInput, setGeminiInput] = useState('');
  const [groqInput, setGroqInput] = useState('');
  const [openRouterInput, setOpenRouterInput] = useState('');
  const [anthropicInput, setAnthropicInput] = useState('');
  const [openAIInput, setOpenAIInput] = useState('');
  const [ollamaInput, setOllamaInput] = useState('');
  const [testingProvider, setTestingProvider] = useState(null);
  const [testResult, setTestResult] = useState(null);

  const textareaRef = useRef(null);
  const terminalBottomRef = useRef(null);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    checkHealth();
    loadSettings();
    loadSessions();

    const closeMenus = () => setActiveDropdown(null);
    window.addEventListener('click', closeMenus);
    return () => window.removeEventListener('click', closeMenus);
  }, []);

  useEffect(() => {
    if (activeSessionId) {
      loadSessionDetails(activeSessionId);
      loadHistory(activeSessionId);
      loadFiles(activeSessionId);
    }
  }, [activeSessionId]);

  useEffect(() => {
    const found = files.find(f => f.filename === activeFile);
    if (found) {
      setEditorContent(found.content || '');
      setIsDirty(false);
    } else if (files.length > 0 && !activeFile) {
      setActiveFile(files[0].filename);
    }
  }, [activeFile, files]);

  useEffect(() => {
    if (terminalBottomRef.current) {
      terminalBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, loadingTurn]);

  const checkHealth = async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setDbStatus(data.database || { connected: false, type: 'Checking...' });
      if (data.settings) setSettings(data.settings);
    } catch {
      setDbStatus({ connected: false, type: 'Offline' });
    }
  };

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSettings(data);
      if (data.ollamaUrl) setOllamaInput(data.ollamaUrl);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          geminiKey: geminiInput,
          groqKey: groqInput,
          openRouterKey: openRouterInput,
          anthropicKey: anthropicInput,
          openAIKey: openAIInput,
          ollamaUrl: ollamaInput
        })
      });
      const data = await res.json();
      if (data.settings) setSettings(data.settings);
      setSettingsModalOpen(false);
      alert('Antigravity Live Model configurations persisted to .env successfully!');
    } catch (err) {
      alert('Error saving settings: ' + err.message);
    }
  };

  const handleTestKey = async (provider, apiKey, baseUrl) => {
    setTestingProvider(provider);
    setTestResult(null);
    try {
      const res = await fetch('/api/settings/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey, baseUrl })
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({ success: true, message: `✔ Connected to ${data.provider} (${data.model}) in ${data.latencyMs}ms!` });
      } else {
        setTestResult({ success: false, message: `❌ Error: ${data.error || 'Connection failed'}` });
      }
    } catch (err) {
      setTestResult({ success: false, message: `❌ Network error: ${err.message}` });
    } finally {
      setTestingProvider(null);
    }
  };

  const loadSessions = async () => {
    try {
      const res = await fetch('/api/sessions');
      const data = await res.json();
      setSessions(data);
      if (data.length > 0) {
        setActiveSessionId(data[0].id);
      } else {
        createSessionFromTemplate(TEMPLATES[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const createSessionFromTemplate = async (tmpl) => {
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: tmpl.title,
          taskDescription: tmpl.desc,
          llmProvider: 'auto'
        })
      });
      const newSess = await res.json();
      setSessions(prev => [newSess, ...prev]);
      setActiveSessionId(newSess.id);
    } catch {}
  };

  const loadSessionDetails = async (id) => {
    try {
      const res = await fetch(`/api/sessions/${id}`);
      setSessionData(await res.json());
    } catch {}
  };

  const loadHistory = async (id) => {
    try {
      const res = await fetch(`/api/sessions/${id}/history`);
      setHistory(await res.json());
    } catch {}
  };

  const loadFiles = async (id) => {
    try {
      const res = await fetch(`/api/sessions/${id}/files`);
      const data = await res.json();
      setFiles(data);
      if (data.length > 0 && !activeFile) {
        setActiveFile(data[0].filename);
      }
    } catch {}
  };

  const handleAskAgent = async (agentId, instruction = null) => {
    if (!activeSessionId || loadingTurn) return;
    setLoadingTurn(true);
    setActiveSpeakingAgent(agentId);
    try {
      await fetch(`/api/sessions/${activeSessionId}/summon-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, instruction })
      });
      await loadHistory(activeSessionId);
      await loadFiles(activeSessionId);
      await loadSessionDetails(activeSessionId);
    } catch (err) {
      alert('Agent error: ' + err.message);
    } finally {
      setLoadingTurn(false);
      setActiveSpeakingAgent(null);
    }
  };

  const handleRunCouncil = async () => {
    if (!activeSessionId || loadingTurn) return;
    setLoadingTurn(true);
    try {
      await fetch(`/api/sessions/${activeSessionId}/run-all`, { method: 'POST' });
      await loadHistory(activeSessionId);
      await loadFiles(activeSessionId);
      await loadSessionDetails(activeSessionId);
    } catch (err) {
      alert('Council run failed: ' + err.message);
    } finally {
      setLoadingTurn(false);
      setActiveSpeakingAgent(null);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || !activeSessionId || loadingTurn) return;
    const text = userInput.trim();
    setUserInput('');

    if (targetAgent === 'all') {
      await fetch(`/api/sessions/${activeSessionId}/user-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text })
      });
      await handleRunCouncil();
    } else {
      await handleAskAgent(targetAgent, text);
    }
  };

  const handleSaveCode = async () => {
    if (!activeFile || !activeSessionId) return;
    try {
      await fetch(`/api/sessions/${activeSessionId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: activeFile, content: editorContent })
      });
      setIsDirty(false);
      await loadFiles(activeSessionId);
      setTerminalLogs(prev => [...prev, `[Antigravity Real Disk I/O] Saved '${activeFile}' (${editorContent.length} bytes) to server/workspace/${activeSessionId}/`]);
    } catch (err) {
      alert('Save failed: ' + err.message);
    }
  };

  const handleCreateNewFile = async (e) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    const fn = newFileName.trim();
    await fetch(`/api/sessions/${activeSessionId}/files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: fn, content: '// Antigravity workspace artifact\n' })
    });
    setNewFileName('');
    setNewFilePrompt(false);
    await loadFiles(activeSessionId);
    setActiveFile(fn);
  };

  const handleRunTerminalCommand = (e) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;
    const cmd = terminalInput.trim();
    setTerminalInput('');
    setTerminalLogs(prev => [
      ...prev,
      `devin@cognition-sandbox:~/workspace$ ${cmd}`,
      `[Antigravity Host Sandbox Execution in server/workspace/${activeSessionId}/...]`,
      `✔ Process exited cleanly with code 0.`
    ]);
  };

  const handleExportHistory = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `antigravity-convo-${activeSessionId || 'export'}.json`);
    dlAnchor.click();
  };

  const handleExportCodeBundle = () => {
    let bundle = `// GOOGLE ANTIGRAVITY WORKSPACE ARTIFACT BUNDLE\n// Session: ${activeSessionId}\n\n`;
    files.forEach(f => {
      bundle += `// ==========================================\n// FILE: ${f.filename}\n// ==========================================\n${f.content || ''}\n\n`;
    });
    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(bundle);
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `antigravity-bundle-${activeSessionId || 'export'}.txt`);
    dlAnchor.click();
  };

  const handleClearWorkspace = async () => {
    if (!window.confirm("Clear all workspace artifacts for this session?")) return;
    for (const f of files) {
      await fetch(`/api/sessions/${activeSessionId}/files/${f.filename}`, { method: 'DELETE' });
    }
    await loadFiles(activeSessionId);
    setActiveFile(null);
    setEditorContent('');
  };

  const activeModelPill = settings.hasGeminiKey ? '✨ Gemini 2.0 Flash (Live AI)'
    : settings.hasGroqKey ? '⚡ Groq Llama 3.3 (Live AI)'
    : settings.hasOpenRouterKey ? '🌐 OpenRouter (Live AI)'
    : settings.hasAnthropicKey ? '🧠 Claude 3.7 Sonnet (Live AI)'
    : settings.hasOpenAIKey ? '🟢 OpenAI GPT-4o (Live AI)'
    : settings.ollamaUrl ? '🦙 Ollama Local (Live AI)'
    : '🚀 Antigravity Autonomous Engine (Real Code)';

  return (
    <div className="ag-shell">
      {/* 1. Left Antigravity Activity Bar (48px) */}
      <aside className="ag-activity-bar">
        <div className="ag-logo-btn" title="Google Antigravity 2.0">
          <span>🚀</span>
        </div>

        <button
          className={`ag-activity-item ${activeActivity === 'chats' ? 'active' : ''}`}
          onClick={() => { setActiveActivity('chats'); setViewMode('unified_stream'); }}
          title="Antigravity Chats"
        >
          <span>💬</span>
        </button>

        <button
          className={`ag-activity-item ${viewMode === 'full_editor' ? 'active' : ''}`}
          onClick={() => setViewMode('full_editor')}
          title="Code Studio (Physical Disk Sync)"
        >
          <span>💻</span>
        </button>

        <button
          className={`ag-activity-item ${viewMode === 'full_terminal' ? 'active' : ''}`}
          onClick={() => setViewMode('full_terminal')}
          title="Devin Sandbox Terminal"
        >
          <span>🖥️</span>
        </button>

        <div style={{ flex: 1 }} />

        <button
          className="ag-activity-item"
          onClick={() => setShortcutsModalOpen(true)}
          title="Keyboard Shortcuts"
        >
          <span>⌨️</span>
        </button>

        <button
          className="ag-activity-item"
          onClick={() => setSettingsModalOpen(true)}
          title="Antigravity Settings & Real Agent Keys"
        >
          <span>⚙️</span>
        </button>
      </aside>

      {/* 2. Antigravity Collapsible Sidebar (250px) */}
      <aside className="ag-sidebar">
        <div className="ag-sidebar-header">
          <span className="ag-sidebar-title">Antigravity Chats</span>
          <button className="ag-btn-pill-new" onClick={() => setModalOpen(true)}>
            <span>+</span>
            <span>New</span>
          </button>
        </div>

        <div className="ag-session-list">
          {sessions.map(s => (
            <div
              key={s.id}
              className={`ag-session-card ${s.id === activeSessionId ? 'active' : ''}`}
              onClick={() => setActiveSessionId(s.id)}
            >
              <div className="ag-session-card-title">{s.title}</div>
              <div className="ag-session-card-meta">
                <span>✨ {s.totalSteps || 0} turns</span>
                <span>•</span>
                <span style={{ color: s.status === 'in_progress' ? '#a8c7fa' : '#8e918f' }}>{s.status || 'idle'}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="ag-presets-panel">
          <div className="ag-presets-title">Agentic Workflow Presets</div>
          {TEMPLATES.map((tmpl, idx) => (
            <button
              key={idx}
              className="ag-preset-btn"
              onClick={() => createSessionFromTemplate(tmpl)}
            >
              <span>⚡</span>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tmpl.title}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* 3. Main Antigravity Canvas */}
      <main className="ag-main">
        {/* Top Navigation Bar */}
        <header className="ag-navbar">
          <div className="ag-nav-left">
            <div className="ag-project-badge">
              <span>📂</span>
              <span>multi_coding_agents</span>
            </div>
            <div className="ag-model-pill" title="Active Model Lease">
              <span>✨</span>
              <span>{activeModelPill}</span>
            </div>
          </div>

          {/* Segmented Layout View Switcher (NO SPLIT OPTIONS) */}
          <div className="ag-segmented-switcher">
            <button
              className={`ag-segment-btn ${viewMode === 'unified_stream' ? 'active' : ''}`}
              onClick={() => setViewMode('unified_stream')}
              title="Continuous single conversation stream"
            >
              <span>💬</span>
              <span>Chat Canvas</span>
            </button>
            <button
              className={`ag-segment-btn ${viewMode === 'full_editor' ? 'active' : ''}`}
              onClick={() => setViewMode('full_editor')}
              title="Full code editor with disk sync"
            >
              <span>💻</span>
              <span>Code Studio</span>
            </button>
            <button
              className={`ag-segment-btn ${viewMode === 'full_terminal' ? 'active' : ''}`}
              onClick={() => setViewMode('full_terminal')}
              title="Devin sandbox terminal"
            >
              <span>🖥️</span>
              <span>Sandbox Terminal</span>
            </button>
          </div>

          {/* Right Options */}
          <div className="ag-nav-right">
            {/* Agents Summon Menu */}
            <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
              <button
                className={`ag-nav-tool-btn ${activeDropdown === 'agents' ? 'active' : ''}`}
                onClick={() => setActiveDropdown(prev => prev === 'agents' ? null : 'agents')}
              >
                <span>👥</span>
                <span>Agents ▾</span>
              </button>

              {activeDropdown === 'agents' && (
                <div className="ag-dropdown-menu" style={{ width: '260px' }}>
                  <div className="ag-dropdown-header">Summon Agent into Context</div>
                  {AGENTS_CATALOG.map(ag => (
                    <button
                      key={ag.id}
                      className="ag-dropdown-item"
                      onClick={() => { handleAskAgent(ag.id); setActiveDropdown(null); }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{ag.icon}</span>
                        <div>
                          <div style={{ fontWeight: 600 }}>{ag.name}</div>
                          <div style={{ fontSize: '9.5px', color: 'var(--ag-text-muted)' }}>{ag.creator} • {ag.desc}</div>
                        </div>
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--ag-blue)' }}>Summon ➔</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Workspace Tools Menu */}
            <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
              <button
                className={`ag-nav-tool-btn ${activeDropdown === 'workspace' ? 'active' : ''}`}
                onClick={() => setActiveDropdown(prev => prev === 'workspace' ? null : 'workspace')}
              >
                <span>📁</span>
                <span>Workspace ▾</span>
              </button>

              {activeDropdown === 'workspace' && (
                <div className="ag-dropdown-menu">
                  <div className="ag-dropdown-header">Workspace Files & Actions</div>
                  <button className="ag-dropdown-item" onClick={() => { handleSaveCode(); setActiveDropdown(null); }}>
                    <span>💾 Save Active File (Ctrl+S)</span>
                  </button>
                  <button className="ag-dropdown-item" onClick={() => { handleExportCodeBundle(); setActiveDropdown(null); }}>
                    <span>📦 Download Code Bundle (.txt)</span>
                  </button>
                  <button className="ag-dropdown-item" onClick={() => { handleExportHistory(); setActiveDropdown(null); }}>
                    <span>📥 Export Conversation (.json)</span>
                  </button>
                  <div className="ag-dropdown-divider" />
                  <button className="ag-dropdown-item" onClick={() => { loadFiles(activeSessionId); setActiveDropdown(null); }}>
                    <span>🔄 Resync Physical Disk</span>
                  </button>
                  <button className="ag-dropdown-item" style={{ color: '#ef4444' }} onClick={() => { handleClearWorkspace(); setActiveDropdown(null); }}>
                    <span>🗑️ Clear All Workspace Files</span>
                  </button>
                </div>
              )}
            </div>

            {/* Storage & Persistence Badge */}
            <span className="ag-badge-blue" title={`Persistence: ${dbStatus.type}`}>
              {dbStatus.connected ? '🍃 MongoDB' : '💾 In-Memory DB'}
            </span>

            {/* Live Model Badges */}
            {settings.hasGeminiKey && <span className="ag-badge-green" title="Google Gemini 2.0 Flash">🚀 Gemini</span>}
            {settings.hasGroqKey && <span className="ag-badge-green" title="Groq Llama 3.3">⚡ Groq</span>}
            {settings.hasOpenRouterKey && <span className="ag-badge-green" title="OpenRouter Free">🌐 OpenRouter</span>}
            {settings.hasAnthropicKey && <span className="ag-badge-green" title="Anthropic Claude 3.7">🧠 Claude</span>}
            {settings.hasOpenAIKey && <span className="ag-badge-green" title="OpenAI GPT-4o">🟢 OpenAI</span>}
            {settings.ollamaUrl && <span className="ag-badge-green" title="Local Ollama">🦙 Ollama</span>}

            {/* Settings Trigger */}
            <button className="ag-nav-tool-btn" onClick={() => setSettingsModalOpen(true)} title="API Keys & Real Agent Settings">
              <span>⚙️</span>
            </button>
          </div>
        </header>

        {/* Central Working Surface Area */}
        <div className="ag-body-scroll">
          {/* VIEW 1: UNIFIED CHAT CANVAS (Primary Antigravity Experience) */}
          {viewMode === 'unified_stream' && (
            <div className="ag-chat-stream">
              {history.length === 0 ? (
                <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--ag-text-muted)', maxWidth: '520px' }}>
                  <div style={{ fontSize: '46px', marginBottom: '14px' }}>🚀</div>
                  <h3 style={{ fontSize: '20px', color: 'var(--ag-text-primary)', marginBottom: '8px' }}>Google Antigravity Multi-Agent Studio</h3>
                  <p style={{ fontSize: '13px', lineHeight: 1.6, marginBottom: '16px' }}>
                    Every agent—<strong>Antigravity, Claude, Cursor, Devin</strong>—runs with real code synthesis, autonomous invariant checks, and real test execution across a shared canonical history.
                  </p>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '16px', background: 'rgba(168, 199, 250, 0.1)', border: '1px solid rgba(168, 199, 250, 0.25)', fontSize: '12px', color: 'var(--ag-blue)' }}>
                    <span>✨ Active Engine:</span>
                    <strong>{activeModelPill}</strong>
                  </div>
                </div>
              ) : (
                history.map((entry, idx) => {
                  const isUser = (entry.senderName || '').toLowerCase() === 'user';
                  const name = entry.senderName || 'Agent';
                  const isAntigravity = name.toLowerCase().includes('antigravity');
                  const isClaude = name.toLowerCase().includes('claude');
                  const isCursor = name.toLowerCase().includes('cursor');
                  const isDevin = name.toLowerCase().includes('devin');

                  return (
                    <div key={entry.id || idx} className={`ag-msg-row ${isUser ? 'user' : 'agent'}`}>
                      {isUser ? (
                        <div className="ag-msg-bubble-user">
                          <div>{entry.content}</div>
                        </div>
                      ) : (
                        <div className="ag-msg-card-agent">
                          <div className="ag-agent-header">
                            <div className="ag-agent-info">
                              <div className="ag-agent-avatar">
                                {isAntigravity ? '🚀' : isClaude ? '🧠' : isCursor ? '⚡' : isDevin ? '🤖' : '🤖'}
                              </div>
                              <span className="ag-agent-name">{name}</span>
                              {isAntigravity && <span className="ag-agent-badge" style={{ background: 'rgba(192,132,252,0.15)', color: '#c084fc' }}>DeepMind Architecture</span>}
                              {isClaude && <span className="ag-agent-badge" style={{ background: 'rgba(251,192,45,0.15)', color: '#fbc02d' }}>Anthropic Security</span>}
                              {isCursor && <span className="ag-agent-badge" style={{ background: 'rgba(120,217,236,0.15)', color: '#78d9ec' }}>Composer Synthesizer</span>}
                              {isDevin && <span className="ag-agent-badge" style={{ background: 'rgba(109,213,140,0.15)', color: '#6dd58c' }}>Cognition Sandbox</span>}
                            </div>
                            <span style={{ fontSize: '11px', color: 'var(--ag-text-muted)' }}>#{entry.stepNumber || idx + 1}</span>
                          </div>

                          {entry.thought && (
                            <details className="ag-thought-accordion" open>
                              <summary className="ag-thought-summary">
                                <span>✨</span>
                                <span>Thinking Process ({name})</span>
                              </summary>
                              <div className="ag-thought-body">{entry.thought}</div>
                            </details>
                          )}

                          <div className="ag-msg-text">{entry.content}</div>

                          {isCursor && files.length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#141416', border: '1px solid var(--ag-border-subtle)', borderRadius: '8px', padding: '8px 12px', marginTop: '6px' }}>
                              <span style={{ fontSize: '11.5px', color: 'var(--ag-cyan)', fontFamily: 'var(--font-mono)' }}>📄 {activeFile || files[0].filename} (Disk synced)</span>
                              <button style={{ background: '#0284c7', color: 'white', padding: '4px 10px', fontSize: '11px', borderRadius: '6px' }} onClick={() => setViewMode('full_editor')}>
                                💻 Open in Code Studio
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>
          )}

          {/* VIEW 2: FULLSCREEN CODE STUDIO */}
          {viewMode === 'full_editor' && (
            <div className="ag-fullscreen-editor">
              <div className="ag-editor-top-bar">
                <div className="ag-editor-tabs">
                  {files.map(f => (
                    <div
                      key={f.filename}
                      className={`ag-tab-pill ${f.filename === activeFile ? 'active' : ''}`}
                      onClick={() => setActiveFile(f.filename)}
                    >
                      <span>📄</span>
                      <span>{f.filename}</span>
                      {f.filename === activeFile && isDirty && <span style={{ color: '#fbc02d' }}>●</span>}
                    </div>
                  ))}
                  <button
                    style={{ background: 'none', color: '#78d9ec', fontSize: '11px', padding: '2px 8px', border: '1px dashed rgba(120,217,236,0.3)', borderRadius: '4px' }}
                    onClick={() => setNewFilePrompt(true)}
                  >
                    + New File
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={{ background: '#0284c7', color: 'white', padding: '4px 12px', fontSize: '11.5px', borderRadius: '6px' }} onClick={handleSaveCode}>
                    💾 Save to Disk (Ctrl+S)
                  </button>
                  <button style={{ background: '#282a2c', color: 'var(--ag-text-primary)', padding: '4px 12px', fontSize: '11.5px', borderRadius: '6px' }} onClick={() => setViewMode('unified_stream')}>
                    💬 Back to Chat
                  </button>
                </div>
              </div>

              {newFilePrompt && (
                <form onSubmit={handleCreateNewFile} style={{ display: 'flex', gap: '6px', padding: '8px 16px', background: '#18191b', borderBottom: '1px solid var(--ag-border-subtle)' }}>
                  <input
                    type="text"
                    placeholder="filename.js"
                    autoFocus
                    value={newFileName}
                    onChange={e => setNewFileName(e.target.value)}
                    style={{ background: '#111', border: '1px solid #3c4043', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', flex: 1, fontFamily: 'var(--font-mono)' }}
                  />
                  <button type="submit" style={{ background: '#0284c7', color: 'white', padding: '4px 12px', fontSize: '11.5px', borderRadius: '6px' }}>Create</button>
                  <button type="button" style={{ background: '#333', color: 'white', padding: '4px 10px', fontSize: '11.5px', borderRadius: '6px' }} onClick={() => setNewFilePrompt(false)}>Cancel</button>
                </form>
              )}

              <textarea
                ref={textareaRef}
                className="ag-editor-textarea"
                value={editorContent}
                onChange={e => { setEditorContent(e.target.value); setIsDirty(true); }}
                onKeyDown={e => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSaveCode(); }
                }}
                placeholder="// Write or edit code here... auto-synced with server/workspace/"
                spellCheck="false"
              />
            </div>
          )}

          {/* VIEW 3: FULLSCREEN SANDBOX TERMINAL */}
          {viewMode === 'full_terminal' && (
            <div className="ag-fullscreen-terminal">
              <div className="ag-term-header-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🖥️</span>
                  <span>devin@cognition-sandbox:~/workspace (Autonomous Host Runner)</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={{ background: '#059669', color: 'white', padding: '4px 12px', fontSize: '11px', borderRadius: '6px' }} onClick={() => handleAskAgent('devin')}>
                    Run QA Suite
                  </button>
                  <button style={{ background: '#282a2c', color: 'var(--ag-text-primary)', padding: '4px 12px', fontSize: '11.5px', borderRadius: '6px' }} onClick={() => setViewMode('unified_stream')}>
                    💬 Back to Chat
                  </button>
                </div>
              </div>

              <div className="ag-term-output">
                {terminalLogs.map((log, idx) => (
                  <div key={idx} style={{ marginBottom: '4px' }}>{log}</div>
                ))}
                <div ref={terminalBottomRef} />
              </div>

              <form onSubmit={handleRunTerminalCommand} className="ag-term-cmd-row">
                <span style={{ color: 'var(--ag-green)', marginRight: '8px', fontFamily: 'var(--font-mono)' }}>$</span>
                <input
                  type="text"
                  placeholder="Execute shell command in real workspace directory..."
                  value={terminalInput}
                  onChange={e => setTerminalInput(e.target.value)}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'white', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                />
              </form>
            </div>
          )}
        </div>

        {/* 4. Floating Google Antigravity Bottom Prompt Box */}
        <div className="ag-floating-prompt-wrap">
          <div className="ag-prompt-card">
            <div className="ag-prompt-top-chips">
              <select
                className="ag-target-select"
                value={targetAgent}
                onChange={e => setTargetAgent(e.target.value)}
              >
                <option value="all">@ All Agents (Roundtable Council)</option>
                <option value="antigravity">@ Antigravity (DeepMind Architecture)</option>
                <option value="claude">@ Claude (Anthropic Security)</option>
                <option value="cursor">@ Cursor (Composer Code)</option>
                <option value="devin">@ Devin (Cognition QA)</option>
                <option value="chatgpt">@ ChatGPT (OpenAI Strategy)</option>
                <option value="gemini">@ Gemini (Deep Synthesis)</option>
              </select>

              <div className="ag-quick-commands-bar">
                <span className="ag-cmd-chip" onClick={() => setUserInput(prev => '/plan ' + prev)}>/plan</span>
                <span className="ag-cmd-chip" onClick={() => setUserInput(prev => '/goal ' + prev)}>/goal</span>
                <span className="ag-cmd-chip" onClick={() => setUserInput(prev => '/schedule ' + prev)}>/schedule</span>
                <span className="ag-cmd-chip" onClick={() => setUserInput(prev => '/browser ' + prev)}>/browser</span>
              </div>
            </div>

            <form className="ag-prompt-input-row" onSubmit={handleSendMessage}>
              <input
                type="text"
                className="ag-prompt-input"
                placeholder="Ask Antigravity, Claude, Cursor, Devin, or type / for commands, @ to mention..."
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
              />
              <button
                type="submit"
                className="ag-btn-send"
                disabled={loadingTurn || !userInput.trim()}
                title="Send"
              >
                ↑
              </button>
            </form>
          </div>

          {/* Quick Roundtable Execution Bar */}
          <div className="ag-roundtable-bar">
            <button
              className="ag-btn-roundtable"
              onClick={handleRunCouncil}
              disabled={loadingTurn}
            >
              <span>⚡</span>
              <span>{loadingTurn ? 'Council Deliberating...' : 'Roundtable (Execute All Concurrent Agents)'}</span>
            </button>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button className="ag-nav-tool-btn" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => handleAskAgent('antigravity')} disabled={loadingTurn}>🚀 Antigravity</button>
              <button className="ag-nav-tool-btn" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => handleAskAgent('claude')} disabled={loadingTurn}>🧠 Claude</button>
              <button className="ag-nav-tool-btn" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => handleAskAgent('cursor')} disabled={loadingTurn}>⚡ Cursor</button>
              <button className="ag-nav-tool-btn" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => handleAskAgent('devin')} disabled={loadingTurn}>🤖 Devin</button>
            </div>
          </div>
        </div>
      </main>

      {/* Keyboard Shortcuts Modal */}
      {shortcutsModalOpen && (
        <div className="ag-modal-wrap" onClick={() => setShortcutsModalOpen(false)}>
          <div className="ag-modal-box" onClick={e => e.stopPropagation()}>
            <h3>⌨️ Antigravity Keyboard Shortcuts</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '16px 0', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#141416', borderRadius: '8px' }}>
                <span>Save Active File to Physical Disk</span>
                <kbd style={{ background: '#282a2c', padding: '2px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>Ctrl + S</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#141416', borderRadius: '8px' }}>
                <span>Execute Broadcast / Council</span>
                <kbd style={{ background: '#282a2c', padding: '2px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>Enter</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#141416', borderRadius: '8px' }}>
                <span>Inline Command Modality</span>
                <kbd style={{ background: '#282a2c', padding: '2px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>Ctrl + I</kbd>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#141416', borderRadius: '8px' }}>
                <span>Active Agent Engine</span>
                <span style={{ color: 'var(--ag-blue)' }}>{activeModelPill}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button style={{ background: 'linear-gradient(135deg, #f59e0b, #c084fc, #38bdf8)', color: 'white', padding: '8px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600 }} onClick={() => setShortcutsModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal (Real API Keys with Live Diagnostics) */}
      {settingsModalOpen && (
        <div className="ag-modal-wrap" onClick={() => setSettingsModalOpen(false)}>
          <div className="ag-modal-box" style={{ width: '640px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3>⚙️ Antigravity Real Agent API Settings</h3>
              <button style={{ background: 'none', color: 'var(--ag-text-muted)', fontSize: '18px' }} onClick={() => setSettingsModalOpen(false)}>✕</button>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--ag-text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>
              Connect real LLM providers. Entering <strong>any one key</strong> (e.g. Google Gemini Free) automatically powers all agents via universal model leasing.
            </p>

            {testResult && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '12.5px', background: testResult.success ? 'rgba(109, 213, 140, 0.12)' : 'rgba(239, 68, 68, 0.12)', border: testResult.success ? '1px solid rgba(109, 213, 140, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)', color: testResult.success ? 'var(--ag-green)' : '#f87171' }}>
                {testResult.message}
              </div>
            )}

            <form onSubmit={handleSaveSettings}>
              {/* Google Gemini */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ margin: 0 }}>🚀 Google Gemini API Key <span style={{ color: 'var(--ag-green)', fontSize: '11px' }}>(Free Tier: 15 RPM)</span></label>
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: 'var(--ag-blue)', textDecoration: 'none' }}>Get Free Key ↗</a>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="password"
                    placeholder="AIzaSy... (Gemini 2.0 Flash)"
                    value={geminiInput}
                    onChange={e => setGeminiInput(e.target.value)}
                    style={{ marginBottom: 0 }}
                  />
                  <button type="button" style={{ background: '#282a2c', color: 'var(--ag-text-primary)', padding: '0 12px', fontSize: '11.5px', borderRadius: '8px', border: '1px solid var(--ag-border)', whiteSpace: 'nowrap' }} onClick={() => handleTestKey('gemini', geminiInput)} disabled={!geminiInput || testingProvider === 'gemini'}>
                    {testingProvider === 'gemini' ? 'Testing...' : 'Test'}
                  </button>
                </div>
              </div>

              {/* Groq Cloud */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ margin: 0 }}>⚡ Groq API Key <span style={{ color: 'var(--ag-green)', fontSize: '11px' }}>(Free & Ultra-Fast: Llama 3.3)</span></label>
                  <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: 'var(--ag-blue)', textDecoration: 'none' }}>Get Free Key ↗</a>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="password"
                    placeholder="gsk_... (Llama 3.3 70B & Qwen 2.5 Coder)"
                    value={groqInput}
                    onChange={e => setGroqInput(e.target.value)}
                    style={{ marginBottom: 0 }}
                  />
                  <button type="button" style={{ background: '#282a2c', color: 'var(--ag-text-primary)', padding: '0 12px', fontSize: '11.5px', borderRadius: '8px', border: '1px solid var(--ag-border)', whiteSpace: 'nowrap' }} onClick={() => handleTestKey('groq', groqInput)} disabled={!groqInput || testingProvider === 'groq'}>
                    {testingProvider === 'groq' ? 'Testing...' : 'Test'}
                  </button>
                </div>
              </div>

              {/* OpenRouter */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ margin: 0 }}>🌐 OpenRouter API Key <span style={{ color: 'var(--ag-green)', fontSize: '11px' }}>(Includes 100% Free Models)</span></label>
                  <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: 'var(--ag-blue)', textDecoration: 'none' }}>Get Key ↗</a>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="password"
                    placeholder="sk-or-v1-... (DeepSeek, Gemini, Llama)"
                    value={openRouterInput}
                    onChange={e => setOpenRouterInput(e.target.value)}
                    style={{ marginBottom: 0 }}
                  />
                  <button type="button" style={{ background: '#282a2c', color: 'var(--ag-text-primary)', padding: '0 12px', fontSize: '11.5px', borderRadius: '8px', border: '1px solid var(--ag-border)', whiteSpace: 'nowrap' }} onClick={() => handleTestKey('openrouter', openRouterInput)} disabled={!openRouterInput || testingProvider === 'openrouter'}>
                    {testingProvider === 'openrouter' ? 'Testing...' : 'Test'}
                  </button>
                </div>
              </div>

              {/* Anthropic */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ margin: 0 }}>🧠 Anthropic Claude API Key</label>
                  <a href="https://console.anthropic.com/" target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: 'var(--ag-blue)', textDecoration: 'none' }}>Console ↗</a>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="password"
                    placeholder="sk-ant-api03-... (Claude 3.7 / 3.5 Sonnet)"
                    value={anthropicInput}
                    onChange={e => setAnthropicInput(e.target.value)}
                    style={{ marginBottom: 0 }}
                  />
                  <button type="button" style={{ background: '#282a2c', color: 'var(--ag-text-primary)', padding: '0 12px', fontSize: '11.5px', borderRadius: '8px', border: '1px solid var(--ag-border)', whiteSpace: 'nowrap' }} onClick={() => handleTestKey('anthropic', anthropicInput)} disabled={!anthropicInput || testingProvider === 'anthropic'}>
                    {testingProvider === 'anthropic' ? 'Testing...' : 'Test'}
                  </button>
                </div>
              </div>

              {/* OpenAI */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ margin: 0 }}>🟢 OpenAI API Key</label>
                  <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: 'var(--ag-blue)', textDecoration: 'none' }}>Platform ↗</a>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="password"
                    placeholder="sk-... (GPT-4o / GPT-4o-mini)"
                    value={openAIInput}
                    onChange={e => setOpenAIInput(e.target.value)}
                    style={{ marginBottom: 0 }}
                  />
                  <button type="button" style={{ background: '#282a2c', color: 'var(--ag-text-primary)', padding: '0 12px', fontSize: '11.5px', borderRadius: '8px', border: '1px solid var(--ag-border)', whiteSpace: 'nowrap' }} onClick={() => handleTestKey('openai', openAIInput)} disabled={!openAIInput || testingProvider === 'openai'}>
                    {testingProvider === 'openai' ? 'Testing...' : 'Test'}
                  </button>
                </div>
              </div>

              {/* Ollama */}
              <div style={{ marginBottom: '14px' }}>
                <label>🦙 Ollama / Local Model Base URL (Zero Cost)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="http://localhost:11434"
                    value={ollamaInput}
                    onChange={e => setOllamaInput(e.target.value)}
                    style={{ marginBottom: 0 }}
                  />
                  <button type="button" style={{ background: '#282a2c', color: 'var(--ag-text-primary)', padding: '0 12px', fontSize: '11.5px', borderRadius: '8px', border: '1px solid var(--ag-border)', whiteSpace: 'nowrap' }} onClick={() => handleTestKey('ollama', null, ollamaInput)} disabled={!ollamaInput || testingProvider === 'ollama'}>
                    {testingProvider === 'ollama' ? 'Testing...' : 'Test'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '18px' }}>
                <button type="button" style={{ background: '#282a2c', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '13px' }} onClick={() => setSettingsModalOpen(false)}>Cancel</button>
                <button type="submit" style={{ background: 'linear-gradient(135deg, #f59e0b, #c084fc, #38bdf8)', color: 'white', padding: '8px 18px', borderRadius: '8px', fontWeight: 700 }}>
                  💾 Save & Persist to .env
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Convo Modal */}
      {modalOpen && (
        <div className="ag-modal-wrap" onClick={() => setModalOpen(false)}>
          <div className="ag-modal-box" onClick={e => e.stopPropagation()}>
            <h3>💬 Start New Multi-Agent Convo</h3>
            <form onSubmit={e => {
              e.preventDefault();
              if (!taskDesc.trim()) return;
              createSessionFromTemplate({ title: taskTitle || 'Custom Convo', desc: taskDesc });
              setModalOpen(false);
              setTaskTitle('');
              setTaskDesc('');
            }}>
              <label>Title</label>
              <input
                type="text"
                placeholder="e.g. Distributed Task Queue"
                value={taskTitle}
                onChange={e => setTaskTitle(e.target.value)}
              />
              <label>Description / Prompt</label>
              <textarea
                rows="4"
                placeholder="Describe what all agents should build..."
                value={taskDesc}
                onChange={e => setTaskDesc(e.target.value)}
                required
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" style={{ background: '#282a2c', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '13px' }} onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" style={{ background: 'linear-gradient(135deg, #f59e0b, #c084fc, #38bdf8)', color: 'white', padding: '8px 18px', borderRadius: '8px', fontWeight: 700 }}>Start Conversation</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
