import React, { useState, useEffect, useRef } from 'react';

export default function CodeEditor({
  files,
  activeFilename,
  onSelectFile,
  onSaveFile,
  onDeleteFile,
  onCreateFile,
  onRequestReview
}) {
  const [content, setContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [newFilePrompt, setNewFilePrompt] = useState(false);
  const [newFileNameInput, setNewFileNameInput] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);

  const activeFileObj = files.find(f => f.filename === activeFilename);

  // Sync content when active file changes
  useEffect(() => {
    if (activeFileObj) {
      setContent(activeFileObj.content || '');
      setIsDirty(false);
    } else {
      setContent('');
      setIsDirty(false);
    }
  }, [activeFilename, files]);

  // Synchronize scrolling between line numbers and textarea
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Track cursor position
  const updateCursorPosition = () => {
    if (!textareaRef.current) return;
    const text = textareaRef.current.value;
    const selStart = textareaRef.current.selectionStart;

    const lines = text.substring(0, selStart).split('\n');
    const currentLine = lines.length;
    const currentCol = lines[lines.length - 1].length + 1;

    setCursorPos({ line: currentLine, col: currentCol });
  };

  // Keyboard shortcuts (Tab, Ctrl+S)
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = textareaRef.current;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;

      const newContent = content.substring(0, start) + '  ' + content.substring(end);
      setContent(newContent);
      setIsDirty(true);

      setTimeout(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
        updateCursorPosition();
      }, 0);
    }
  };

  const handleChange = (e) => {
    setContent(e.target.value);
    setIsDirty(true);
    updateCursorPosition();
  };

  const handleSave = async () => {
    if (!activeFilename || isSaving) return;
    setIsSaving(true);
    try {
      await onSaveFile(activeFilename, content);
      setIsDirty(false);
    } catch (err) {
      alert('Save failed: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestReview = async () => {
    if (!activeFilename) return;
    if (isDirty) {
      await handleSave();
    }
    onRequestReview(activeFilename, content);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newFileNameInput.trim()) return;
    onCreateFile(newFileNameInput.trim());
    setNewFileNameInput('');
    setNewFilePrompt(false);
  };

  // Compute line count
  const linesCount = Math.max(1, content.split('\n').length);
  const lineNumbers = Array.from({ length: linesCount }, (_, i) => i + 1);

  const getFileIcon = (fn) => {
    if (!fn) return '📄';
    if (fn.endsWith('.js') || fn.endsWith('.jsx')) return '🟨';
    if (fn.endsWith('.py')) return '🐍';
    if (fn.endsWith('.json')) return '⚙️';
    if (fn.endsWith('.md')) return '📝';
    if (fn.endsWith('.html')) return '🌐';
    if (fn.endsWith('.css')) return '🎨';
    return '📄';
  };

  return (
    <div className="editor-container">
      {/* Tab Bar */}
      <div className="editor-tab-bar">
        <div className="tabs-list">
          {files.map(f => {
            const isCurrent = f.filename === activeFilename;
            return (
              <div
                key={f.filename}
                className={`editor-tab ${isCurrent ? 'active' : ''}`}
                onClick={() => onSelectFile(f.filename)}
              >
                <span className="file-icon">{getFileIcon(f.filename)}</span>
                <span className="file-name">{f.filename}</span>
                {isCurrent && isDirty && <span className="dirty-dot" title="Unsaved changes">●</span>}
                <button
                  className="tab-close-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFile(f.filename);
                  }}
                  title="Delete file"
                >
                  ✕
                </button>
              </div>
            );
          })}

          <button
            className="add-file-btn"
            onClick={() => setNewFilePrompt(true)}
            title="Create new file in workspace"
          >
            + New File
          </button>
        </div>
      </div>

      {/* New File Inline Prompt */}
      {newFilePrompt && (
        <form className="new-file-bar" onSubmit={handleCreateSubmit}>
          <span>📄 New filename:</span>
          <input
            type="text"
            autoFocus
            placeholder="e.g. authMiddleware.js, utils.py"
            value={newFileNameInput}
            onChange={e => setNewFileNameInput(e.target.value)}
          />
          <button type="submit" className="btn-small btn-primary">Create</button>
          <button type="button" className="btn-small btn-secondary" onClick={() => setNewFilePrompt(false)}>
            Cancel
          </button>
        </form>
      )}

      {/* Editor Action Toolbar */}
      {activeFilename && (
        <div className="editor-toolbar">
          <div className="toolbar-left">
            <span className="active-filepath">
              📁 workspace / <strong>{activeFilename}</strong>
            </span>
            {isDirty ? (
              <span className="status-badge unsaved">Unsaved changes</span>
            ) : (
              <span className="status-badge saved">Saved</span>
            )}
          </div>

          <div className="toolbar-right">
            <button
              className="btn-toolbar btn-save"
              onClick={handleSave}
              disabled={!isDirty || isSaving}
              title="Save changes to real disk (Ctrl+S)"
              style={{ background: '#0284c7', color: 'white' }}
            >
              {isSaving ? 'Saving...' : '💾 Save'}
            </button>

            <button
              className="btn-toolbar"
              onClick={() => onRequestReview && onRequestReview(activeFilename, 'claude')}
              title="Ask Claude to audit code security & boundaries"
              style={{ background: '#d97706', color: 'white', fontWeight: 600 }}
            >
              🧠 Claude Audit
            </button>

            <button
              className="btn-toolbar"
              onClick={() => onRequestReview && onRequestReview(activeFilename, 'antigravity')}
              title="Ask Antigravity to review architecture & invariants"
              style={{ background: '#7c3aed', color: 'white', fontWeight: 600 }}
            >
              🚀 Antigravity Spec
            </button>

            <button
              className="btn-toolbar"
              onClick={() => onRequestReview && onRequestReview(activeFilename, 'devin')}
              title="Ask Devin to run tests in sandbox"
              style={{ background: '#059669', color: 'white', fontWeight: 600 }}
            >
              🤖 Devin Test
            </button>

            <button className="btn-toolbar" onClick={handleCopy} title="Copy code">
              {copySuccess ? '✓ Copied!' : '📋 Copy'}
            </button>
          </div>
        </div>
      )}

      {/* Code Editor Main Canvas */}
      {activeFilename ? (
        <div className="editor-main">
          {/* Line Numbers Gutter */}
          <div className="line-numbers" ref={lineNumbersRef}>
            {lineNumbers.map(n => (
              <div key={n} className={`line-num ${n === cursorPos.line ? 'active-line' : ''}`}>
                {n}
              </div>
            ))}
          </div>

          {/* Textarea Code Input */}
          <textarea
            ref={textareaRef}
            className="code-textarea"
            value={content}
            onChange={handleChange}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            onClick={updateCursorPosition}
            onKeyUp={updateCursorPosition}
            spellCheck="false"
            autoCapitalize="off"
            autoComplete="off"
          />
        </div>
      ) : (
        <div className="editor-empty">
          <div className="empty-icon">📁</div>
          <h3>Workspace Code Editor</h3>
          <p>No file selected. Select a file from the tabs above or create a new file.</p>
          <button className="btn-primary" onClick={() => setNewFilePrompt(true)}>
            + Create New File
          </button>
        </div>
      )}

      {/* Bottom Status Bar */}
      {activeFilename && (
        <div className="editor-status-bar">
          <div className="status-left">
            <span>{activeFileObj?.language?.toUpperCase() || 'JAVASCRIPT'}</span>
            <span>UTF-8</span>
            <span>Modified by: {activeFileObj?.lastModifiedBy || 'Coder'}</span>
          </div>
          <div className="status-right">
            <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
            <span>{linesCount} lines</span>
            <span>{content.length} chars</span>
          </div>
        </div>
      )}
    </div>
  );
}
