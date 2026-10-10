import React, { useState, useEffect } from "react";
import "./App.css";

export type ContentFormat = "blog" | "paragraph" | "report" | "file";

interface IterationHistoryItem {
  iteration: number;
  stage: "research" | "writing" | "critique" | "feedback";
  content: string;
  timestamp: string;
}

interface Session {
  id: string;
  topic: string;
  format: ContentFormat;
  targetAudience?: string;
  customInstructions?: string;
  currentArticle: string;
  research: string;
  iterationCount: number;
  status: "active" | "completed" | "paused";
  history: IterationHistoryItem[];
  createdAt: string;
  updatedAt: string;
}

const FORMAT_OPTIONS: { id: ContentFormat; title: string; icon: string; desc: string; badge: string }[] = [
  {
    id: "blog",
    title: "Blog Post",
    icon: "📝",
    badge: "Engaging & SEO",
    desc: "Hook readers with punchy subheaders, actionable takeaways & clear narrative flow.",
  },
  {
    id: "paragraph",
    title: "Single Paragraph",
    icon: "📄",
    badge: "150 Words",
    desc: "Distill the core essence into a dense, high-impact paragraph without fluff.",
  },
  {
    id: "report",
    title: "Executive Report",
    icon: "📊",
    badge: "Formal & Deep",
    desc: "Structured analysis with Executive Summary, Findings, Risk Audit & Strategy.",
  },
  {
    id: "file",
    title: "Exportable File",
    icon: "📁",
    badge: "Markdown Doc",
    desc: "Complete production-ready document with Metadata, TOC & Reference tables.",
  },
];

const AUDIENCE_OPTIONS = [
  "General / Public Audience",
  "Business & Executive Leadership",
  "Technical & Engineering Specialists",
  "Academic & Research Community",
  "Founders & Tech Investors",
];

const QUICK_TOPICS = [
  "Autonomous AI Agents in Software Engineering",
  "Commercialization of Solid-State EV Batteries",
  "Neuroplasticity & Deep Work in the Remote Era",
  "Zero-Trust Cloud Architecture for Enterprise",
];

const QUICK_REVISIONS = [
  "Make the opening hook more captivating",
  "Add 3 concrete real-world implementation examples",
  "Condense into punchier, high-impact bullet points",
  "Emphasize strategic risk mitigation and security",
];

export default function App() {
  const [topic, setTopic] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<ContentFormat>("blog");
  const [targetAudience, setTargetAudience] = useState(AUDIENCE_OPTIONS[0]);
  const [customInstructions, setCustomInstructions] = useState("");

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoRunning, setAutoRunning] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"draft" | "research" | "history">("draft");
  const [viewMode, setViewMode] = useState<"magazine" | "raw">("magazine");
  const [copied, setCopied] = useState(false);
  const [userFeedbackInput, setUserFeedbackInput] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const parseJsonResponse = async (response: Response) => {
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      if (!response.ok) {
        throw new Error(
          `Server returned status ${response.status}. Please make sure backend is running on port 5000 ('npm run server:dev').`
        );
      }
      throw new Error("Invalid response from server.");
    }
  };

  const createSession = async () => {
    if (!topic.trim()) {
      setErrorMessage("Please enter an article topic");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setMessage("");

    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          format: selectedFormat,
          targetAudience,
          customInstructions: customInstructions.trim() || undefined,
        }),
      });

      const data = await parseJsonResponse(response);
      if (!response.ok) {
        throw new Error(data.error || "Failed to create session");
      }

      setSessionId(data.sessionId);
      setMessage("✨ Session created! Review the pipeline below and click 'Proceed with Research' to start.");
      setTopic("");
      await fetchSession(data.sessionId);
    } catch (error: any) {
      setErrorMessage(error.message || "Error creating session");
    } finally {
      setLoading(false);
    }
  };

  const executeStep = async () => {
    if (!sessionId) return;

    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/sessions/${sessionId}/step`, {
        method: "POST",
      });

      const data = await parseJsonResponse(response);
      if (!response.ok) {
        throw new Error(data.error || "Failed to execute step");
      }

      setSession(data.session);
      setMessage(data.result);

      if (data.session.history?.length === 1) {
        setActiveTab("research");
      } else {
        setActiveTab("draft");
      }

      return data.session;
    } catch (error: any) {
      setErrorMessage(error.message || "Error executing step");
      setAutoRunning(false);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const applyUserFeedback = async () => {
    if (!sessionId || !userFeedbackInput.trim()) return;

    setSubmittingFeedback(true);
    setErrorMessage("");
    try {
      const response = await fetch(`/api/sessions/${sessionId}/user-feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: userFeedbackInput.trim() }),
      });

      const data = await parseJsonResponse(response);
      if (!response.ok) {
        throw new Error(data.error || "Failed to apply user feedback");
      }

      setSession(data.session);
      setMessage("✨ Your feedback has been applied! The Writer Agent has produced a new revision.");
      setUserFeedbackInput("");
      setActiveTab("draft");
    } catch (error: any) {
      setErrorMessage(error.message || "Error applying your feedback");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const runFullLoop = async () => {
    if (!sessionId || autoRunning) return;
    setAutoRunning(true);
    setErrorMessage("");

    let current = session;
    while (current && current.status === "active") {
      const updated = await executeStep();
      if (!updated || updated.status !== "active") {
        break;
      }
      await new Promise((r) => setTimeout(r, 1400));
    }
    setAutoRunning(false);
  };

  const fetchSession = async (idToFetch?: string) => {
    const id = idToFetch || sessionId;
    if (!id) return;

    try {
      const response = await fetch(`/api/sessions/${id}`);
      if (!response.ok) return;

      const data = await parseJsonResponse(response);
      setSession(data.session);
    } catch (error) {
      console.error("Error fetching session:", error);
    }
  };

  const endSession = async () => {
    if (!sessionId) return;

    setLoading(true);
    setAutoRunning(false);
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: "DELETE",
      });

      const data = await parseJsonResponse(response);
      if (!response.ok) {
        throw new Error(data.error || "Failed to end session");
      }

      setSession(data.session);
      setMessage("✅ Session finalized successfully.");
    } catch (error: any) {
      setErrorMessage(error.message || "Error ending session");
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = () => {
    if (!session?.currentArticle) return;
    const cleanTopic = session.topic.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const ext = session.format === "file" ? "md" : "txt";
    const filename = `${cleanTopic}_${session.format}.${ext}`;

    const element = document.createElement("a");
    const file = new Blob([session.currentArticle], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const copyContent = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startNewSession = () => {
    setSessionId(null);
    setSession(null);
    setMessage("");
    setErrorMessage("");
    setAutoRunning(false);
    setUserFeedbackInput("");
  };

  useEffect(() => {
    if (sessionId) {
      fetchSession();
      const interval = setInterval(() => fetchSession(), 5000);
      return () => clearInterval(interval);
    }
  }, [sessionId]);

  const getStageIndex = () => {
    if (!session || session.history.length === 0) return 0;
    const last = session.history[session.history.length - 1].stage;
    if (last === "research") return 1;
    if (last === "writing") return 2;
    if (last === "critique") return 3;
    if (last === "feedback" || session.status === "completed") return 4;
    return 1;
  };

  const currentStageIdx = getStageIndex();

  const getConfirmationPrompt = () => {
    if (!session || session.history.length === 0) {
      return {
        stepNumber: "Step 1 of 4",
        agentName: "🔍 Researcher Agent",
        promptText: `Ready to research "${session?.topic}". The AI will curate authoritative sources, verified statistics, and citations before drafting.`,
        buttonLabel: "🔍 Start Background Research",
      };
    }
    const last = session.history[session.history.length - 1].stage;
    if (last === "research") {
      return {
        stepNumber: "Step 2 of 4",
        agentName: "✍️ Writer Agent",
        promptText: `Research is complete! Ready to draft your ${session.format.toUpperCase()} tailored for "${session.targetAudience}".`,
        buttonLabel: `✍️ Draft ${session.format.toUpperCase()}`,
      };
    }
    if (last === "writing") {
      return {
        stepNumber: "Step 3 of 4",
        agentName: "🧐 Critic Agent",
        promptText: `Initial draft generated. Ready to run editorial audit for clarity, depth, tone, and scoring (1-10)?`,
        buttonLabel: "🧐 Audit with Critic Agent",
      };
    }
    if (last === "critique") {
      return {
        stepNumber: "Step 4 of 4",
        agentName: "🔄 Feedback & Polish Agent",
        promptText: `Critic review received. Ready to refine and elevate the content based on recommendations?`,
        buttonLabel: "🔄 Apply Polish & Improvements",
      };
    }
    return {
      stepNumber: "Completed",
      agentName: "✅ Final Polish",
      promptText: "The feedback loop has finalized your content with maximum quality.",
      buttonLabel: "✅ Pipeline Complete",
    };
  };

  const confirmInfo = getConfirmationPrompt();

  const getWordCount = (text: string) => {
    if (!text) return 0;
    return text.trim().split(/\s+/).length;
  };

  // Helper to render markdown-like content into beautiful styled elements
  const renderRichContent = (text: string) => {
    if (!text) return null;
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let inList = false;
    let listItems: string[] = [];

    const flushList = (key: string) => {
      if (inList && listItems.length > 0) {
        elements.push(
          <ul key={key} className="rich-list">
            {listItems.map((li, i) => (
              <li key={i}>{li}</li>
            ))}
          </ul>
        );
        inList = false;
        listItems = [];
      }
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      if (trimmed.startsWith("# ")) {
        flushList(`list-${idx}`);
        elements.push(
          <h1 key={idx} className="rich-h1">
            {trimmed.replace(/^#\s+/, "")}
          </h1>
        );
      } else if (trimmed.startsWith("## ")) {
        flushList(`list-${idx}`);
        elements.push(
          <h2 key={idx} className="rich-h2">
            {trimmed.replace(/^##\s+/, "")}
          </h2>
        );
      } else if (trimmed.startsWith("### ")) {
        flushList(`list-${idx}`);
        elements.push(
          <h3 key={idx} className="rich-h3">
            {trimmed.replace(/^###\s+/, "")}
          </h3>
        );
      } else if (trimmed.startsWith("---") || trimmed.startsWith("***")) {
        flushList(`list-${idx}`);
        elements.push(<hr key={idx} className="rich-divider" />);
      } else if (trimmed.startsWith("• ") || trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        inList = true;
        listItems.push(trimmed.replace(/^[-•*]\s+/, ""));
      } else if (/^\d+\.\s+/.test(trimmed)) {
        flushList(`list-${idx}`);
        elements.push(
          <div key={idx} className="rich-numbered-item">
            <span className="num-badge">{trimmed.match(/^\d+/)?.[0]}</span>
            <span>{trimmed.replace(/^\d+\.\s+/, "")}</span>
          </div>
        );
      } else if (trimmed.startsWith(">")) {
        flushList(`list-${idx}`);
        elements.push(
          <blockquote key={idx} className="rich-blockquote">
            {trimmed.replace(/^>\s*/, "")}
          </blockquote>
        );
      } else if (trimmed.length > 0) {
        flushList(`list-${idx}`);
        elements.push(
          <p key={idx} className="rich-p">
            {trimmed}
          </p>
        );
      }
    });

    flushList("final-list");
    return elements;
  };

  return (
    <div className="app-wrapper">
      <div className="container">
        {/* Header */}
        <header className="header">
          <div className="header-badge">🚀 Next-Gen Autonomous AI Lab</div>
          <h1>Multi-Agent Feedback Studio</h1>
          <p className="subtitle">
            Autonomous AI collaboration: <strong>Source Intelligence</strong> ➔ <strong>Format-Aware Drafting</strong> ➔ <strong>Editorial Critique</strong> ➔ <strong>Iterative Polish</strong>
          </p>
        </header>

        {errorMessage && <div className="error-banner">⚠️ {errorMessage}</div>}
        {message && <div className="message">{message}</div>}

        {!sessionId ? (
          <div className="form-section">
            <div className="section-title-group">
              <h2>Configure New Article Project</h2>
              <p className="description">
                Pick your output structure, choose your audience, and enter a topic. The system will consult authoritative sources before writing.
              </p>
            </div>

            {/* Quick Inspiration Chips */}
            <div className="quick-topics-group">
              <span className="quick-label">⚡ Trending Inspirations:</span>
              <div className="chips-row">
                {QUICK_TOPICS.map((qt, idx) => (
                  <button
                    key={idx}
                    className="chip-btn"
                    onClick={() => setTopic(qt)}
                  >
                    {qt}
                  </button>
                ))}
              </div>
            </div>

            {/* 1. Format Selection */}
            <div className="section-block">
              <label className="field-label">1. Choose Target Output Format</label>
              <div className="format-grid">
                {FORMAT_OPTIONS.map((opt) => (
                  <div
                    key={opt.id}
                    className={`format-card ${selectedFormat === opt.id ? "selected" : ""}`}
                    onClick={() => setSelectedFormat(opt.id)}
                  >
                    <div className="format-card-header">
                      <span className="format-icon">{opt.icon}</span>
                      <span className="format-pill">{opt.badge}</span>
                    </div>
                    <strong className="format-title">{opt.title}</strong>
                    <p className="format-desc">{opt.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Target Audience */}
            <div className="section-block">
              <label className="field-label">2. Target Audience & Tone of Voice</label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="select-input"
              >
                {AUDIENCE_OPTIONS.map((aud) => (
                  <option key={aud} value={aud}>
                    {aud}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Topic Input */}
            <div className="section-block">
              <label className="field-label">3. Core Topic or Headline</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. The Economic Impact of Generative AI on Global Supply Chains"
                className="text-input"
                onKeyDown={(e) => e.key === "Enter" && !loading && createSession()}
                disabled={loading}
              />
            </div>

            {/* 4. Special Instructions */}
            <div className="section-block">
              <label className="field-label">4. Special Custom Requirements (Optional)</label>
              <textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="e.g. Include 2026 data points, focus on risk mitigation strategies, and use bulleted action items."
                className="textarea-input"
                rows={2}
              />
            </div>

            <button
              onClick={createSession}
              disabled={loading || !topic.trim()}
              className="btn-primary btn-large glow-btn"
            >
              {loading ? "Initializing..." : "🚀 Launch Multi-Agent Studio"}
            </button>
          </div>
        ) : (
          <div className="session-section">
            {/* Stepper */}
            <div className="stepper-wrapper">
              <div className="stepper">
                <div className={`step-node ${currentStageIdx >= 1 ? "completed" : currentStageIdx === 0 ? "active" : ""}`}>
                  <div className="step-circle">{currentStageIdx >= 1 ? "✓" : "1"}</div>
                  <span className="step-label">Research & Sources</span>
                </div>
                <div className={`step-line ${currentStageIdx >= 1 ? "filled" : ""}`}></div>

                <div className={`step-node ${currentStageIdx >= 2 ? "completed" : currentStageIdx === 1 ? "active" : ""}`}>
                  <div className="step-circle">{currentStageIdx >= 2 ? "✓" : "2"}</div>
                  <span className="step-label">{session?.format.toUpperCase()} Drafting</span>
                </div>
                <div className={`step-line ${currentStageIdx >= 2 ? "filled" : ""}`}></div>

                <div className={`step-node ${currentStageIdx >= 3 ? "completed" : currentStageIdx === 2 ? "active" : ""}`}>
                  <div className="step-circle">{currentStageIdx >= 3 ? "✓" : "3"}</div>
                  <span className="step-label">Editorial Critique</span>
                </div>
                <div className={`step-line ${currentStageIdx >= 3 ? "filled" : ""}`}></div>

                <div className={`step-node ${currentStageIdx >= 4 ? "completed" : currentStageIdx === 3 ? "active" : ""}`}>
                  <div className="step-circle">{currentStageIdx >= 4 ? "✓" : "4"}</div>
                  <span className="step-label">Refinement Polish</span>
                </div>
              </div>
            </div>

            {/* Session Info Bar */}
            <div className="session-header-row">
              <div className="topic-meta">
                <h2>{session?.topic}</h2>
                <div className="meta-tags">
                  <span className="tag format-tag">
                    {FORMAT_OPTIONS.find((f) => f.id === session?.format)?.icon} {session?.format?.toUpperCase()}
                  </span>
                  <span className="tag audience-tag">🎯 {session?.targetAudience}</span>
                  <span className={`tag status-tag status-${session?.status}`}>
                    ● {session?.status?.toUpperCase()}
                  </span>
                  {session?.currentArticle && (
                    <span className="tag word-tag">
                      📊 {getWordCount(session.currentArticle)} words (~{Math.max(1, Math.ceil(getWordCount(session.currentArticle) / 200))} min read)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Interactive "Ask / Confirm Next Step" Action Card */}
            {session?.status === "active" && (
              <div className="interactive-prompt-card">
                <div className="prompt-badge">{confirmInfo.stepNumber} • {confirmInfo.agentName}</div>
                <p className="prompt-text">{confirmInfo.promptText}</p>
                <div className="prompt-actions">
                  <button
                    onClick={executeStep}
                    disabled={loading || autoRunning}
                    className="btn-primary glow-btn"
                  >
                    {loading && !autoRunning ? "⚡ Processing Step..." : confirmInfo.buttonLabel}
                  </button>
                  <button
                    onClick={runFullLoop}
                    disabled={loading || autoRunning}
                    className="btn-accent"
                  >
                    {autoRunning ? "⚡ Auto-Executing Loop..." : "⚡ Auto-Run All Remaining Steps"}
                  </button>
                  <button
                    onClick={endSession}
                    disabled={loading || autoRunning}
                    className="btn-secondary"
                  >
                    End Session
                  </button>
                  <button onClick={startNewSession} className="btn-outline">
                    + New Topic
                  </button>
                </div>
              </div>
            )}

            {/* Content Tabs */}
            <div className="tabs-nav">
              <button
                className={`tab-btn ${activeTab === "draft" ? "active" : ""}`}
                onClick={() => setActiveTab("draft")}
              >
                📄 {session?.format?.toUpperCase() || "Content"} Output {session?.currentArticle ? "✓" : ""}
              </button>
              <button
                className={`tab-btn ${activeTab === "research" ? "active" : ""}`}
                onClick={() => setActiveTab("research")}
              >
                🔍 Curated Resources & Data {session?.research ? "✓" : ""}
              </button>
              <button
                className={`tab-btn ${activeTab === "history" ? "active" : ""}`}
                onClick={() => setActiveTab("history")}
              >
                📜 Agent Execution Logs ({session?.history?.length || 0})
              </button>
            </div>

            {/* Tab 1: Draft Viewer */}
            {activeTab === "draft" && (
              <div className="tab-content">
                {session?.currentArticle ? (
                  <div>
                    <div className="article-section">
                      <div className="article-header">
                        <div className="article-title-bar">
                          <div className="view-mode-toggle">
                            <button
                              className={`toggle-btn ${viewMode === "magazine" ? "active" : ""}`}
                              onClick={() => setViewMode("magazine")}
                            >
                              📖 Magazine View
                            </button>
                            <button
                              className={`toggle-btn ${viewMode === "raw" ? "active" : ""}`}
                              onClick={() => setViewMode("raw")}
                            >
                              💻 Markdown Text
                            </button>
                          </div>
                          <span className="stats-pill">{getWordCount(session.currentArticle)} words</span>
                        </div>
                        <div className="action-buttons">
                          <button className="btn-sm" onClick={() => copyContent(session.currentArticle)}>
                            {copied ? "✅ Copied!" : "📋 Copy Text"}
                          </button>
                          <button className="btn-sm btn-export" onClick={downloadFile}>
                            📥 Download .{session.format === "file" ? "md" : "txt"}
                          </button>
                        </div>
                      </div>

                      {/* Display Mode: Magazine Render or Raw Text */}
                      {viewMode === "magazine" ? (
                        <div className="magazine-view">
                          <div className="article-hero-banner">
                            <span className="hero-format-badge">{session.format.toUpperCase()}</span>
                            <span className="hero-read-time">⏳ ~{Math.max(1, Math.ceil(getWordCount(session.currentArticle) / 200))} min read</span>
                          </div>
                          <div className="rich-article-body">
                            {renderRichContent(session.currentArticle)}
                          </div>
                        </div>
                      ) : (
                        <div className="article-content">
                          <pre>{session.currentArticle}</pre>
                        </div>
                      )}
                    </div>

                    {/* Human-in-the-Loop: User Custom Iteration Box */}
                    <div className="user-iteration-card">
                      <div className="iteration-card-header">
                        <div className="iteration-badge-title">
                          <span>✨ Human-in-the-Loop Refinement</span>
                        </div>
                        <span className="iteration-subtitle">Give specific custom instructions to refine this draft</span>
                      </div>

                      <div className="quick-suggestions-row">
                        <span className="suggest-label">💡 Quick Feedback Ideas:</span>
                        {QUICK_REVISIONS.map((qr, i) => (
                          <button
                            key={i}
                            className="suggest-chip"
                            onClick={() => setUserFeedbackInput(qr)}
                          >
                            + {qr}
                          </button>
                        ))}
                      </div>

                      <div className="feedback-input-row">
                        <textarea
                          value={userFeedbackInput}
                          onChange={(e) => setUserFeedbackInput(e.target.value)}
                          placeholder="e.g. Make the conclusion bolder, shorten paragraph 2, and add 3 key bullet points on risk management..."
                          className="feedback-textarea"
                          rows={2}
                          disabled={submittingFeedback}
                        />
                        <button
                          onClick={applyUserFeedback}
                          disabled={submittingFeedback || !userFeedbackInput.trim()}
                          className="btn-primary feedback-submit-btn glow-btn"
                        >
                          {submittingFeedback ? "⚡ Revising Draft..." : "🚀 Apply My Feedback & Re-Draft"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="empty-state">
                    <span className="empty-icon">✍️</span>
                    <h3>Draft in Waiting</h3>
                    <p>Click <strong>"{confirmInfo.buttonLabel}"</strong> above to begin researching and drafting your {session?.format}.</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Research Viewer */}
            {activeTab === "research" && (
              <div className="tab-content">
                {session?.research ? (
                  <div className="research-section">
                    <div className="article-header">
                      <h3>🌐 Intelligence Dossier & Reference Material</h3>
                      <button className="btn-sm" onClick={() => copyContent(session.research)}>
                        {copied ? "✅ Copied!" : "📋 Copy Notes"}
                      </button>
                    </div>
                    <div className="magazine-view">
                      <div className="rich-article-body">
                        {renderRichContent(session.research)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="empty-state">
                    <span className="empty-icon">🔍</span>
                    <h3>No Research Gathered Yet</h3>
                    <p>Click <strong>"🔍 Start Background Research"</strong> to curate resources, metrics, and sources.</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: History Viewer */}
            {activeTab === "history" && (
              <div className="tab-content">
                {session?.history && session.history.length > 0 ? (
                  <div className="history-list">
                    {session.history.map((item, idx) => (
                      <div key={idx} className={`history-item stage-${item.stage}`}>
                        <div className="history-header">
                          <span className="stage-title">
                            {item.stage === "research" && "🔍 Stage 1: Resource & Fact Gathering (Researcher Agent)"}
                            {item.stage === "writing" && (item.content.startsWith("[User Iteration") ? "✨ User-Driven Refinement (Writer Agent)" : `✍️ Stage 2: ${session.format.toUpperCase()} Generation (Writer Agent)`)}
                            {item.stage === "critique" && "🧐 Stage 3: Editorial Critique & Audit (Critic Agent)"}
                            {item.stage === "feedback" && "🔄 Stage 4: Feedback Evaluation & Polish (Feedback Agent)"}
                          </span>
                          <span className="history-time">
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="history-body">
                          <pre>{item.content}</pre>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <span className="empty-icon">📜</span>
                    <h3>No history steps yet</h3>
                    <p>As agents collaborate, each iteration and critique will be logged here.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
