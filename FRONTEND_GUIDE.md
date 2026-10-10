# Frontend & Styling - Complete Code

## FILE 8: src/App.tsx

```typescript
import React, { useState, useEffect } from "react";
import "./App.css";

interface Session {
  id: string;
  topic: string;
  currentArticle: string;
  research: string;
  iterationCount: number;
  status: "active" | "completed" | "paused";
  history: any[];
  createdAt: string;
  updatedAt: string;
}

export default function App() {
  const [topic, setTopic] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const createSession = async () => {
    if (!topic.trim()) {
      setMessage("Please enter a topic");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });

      if (!response.ok) throw new Error("Failed to create session");

      const data = await response.json();
      setSessionId(data.sessionId);
      setMessage("Session created! Start the feedback loop.");
      setTopic("");
    } catch (error) {
      setMessage("Error creating session");
    } finally {
      setLoading(false);
    }
  };

  const executeStep = async () => {
    if (!sessionId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/sessions/${sessionId}/step`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to execute step");

      const data = await response.json();
      setSession(data.session);
      setMessage(data.result);
    } catch (error) {
      setMessage("Error executing step");
    } finally {
      setLoading(false);
    }
  };

  const fetchSession = async () => {
    if (!sessionId) return;

    try {
      const response = await fetch(`/api/sessions/${sessionId}`);
      if (!response.ok) throw new Error("Failed to fetch session");

      const data = await response.json();
      setSession(data.session);
    } catch (error) {
      setMessage("Error fetching session");
    }
  };

  const endSession = async () => {
    if (!sessionId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to end session");

      setSessionId(null);
      setSession(null);
      setMessage("Session ended");
    } catch (error) {
      setMessage("Error ending session");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId) {
      fetchSession();
      const interval = setInterval(fetchSession, 5000);
      return () => clearInterval(interval);
    }
  }, [sessionId]);

  return (
    <div className="container">
      <h1>🤖 AI Feedback Loop System</h1>

      {!sessionId ? (
        <div className="form-section">
          <h2>Create New Session</h2>
          <div className="input-group">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter article topic..."
              onKeyPress={(e) => e.key === "Enter" && createSession()}
            />
            <button onClick={createSession} disabled={loading}>
              {loading ? "Creating..." : "Create Session"}
            </button>
          </div>
        </div>
      ) : (
        <div className="session-section">
          <h2>Session: {sessionId?.substring(0, 8)}</h2>
          <div className="session-info">
            <p>
              <strong>Topic:</strong> {session?.topic}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <span className={`status-${session?.status}`}>
                {session?.status}
              </span>
            </p>
            <p>
              <strong>Iterations:</strong> {session?.iterationCount}
            </p>
          </div>

          <div className="controls">
            <button
              onClick={executeStep}
              disabled={loading || session?.status !== "active"}
              className="btn-primary"
            >
              {loading ? "Processing..." : "Next Step"}
            </button>
            <button onClick={endSession} disabled={loading} className="btn-secondary">
              End Session
            </button>
          </div>

          {message && <div className="message">{message}</div>}

          {session?.currentArticle && (
            <div className="article-section">
              <h3>Current Article</h3>
              <div className="article-content">
                {session.currentArticle.substring(0, 1000)}
                {session.currentArticle.length > 1000 && "..."}
              </div>
            </div>
          )}

          {session?.history && session.history.length > 0 && (
            <div className="history-section">
              <h3>Process History</h3>
              <div className="history-list">
                {session.history.map((item, idx) => (
                  <div key={idx} className={`history-item stage-${item.stage}`}>
                    <h4>{item.stage.toUpperCase()}</h4>
                    <p>{item.content.substring(0, 200)}...</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## FILE 9: src/main.tsx

```typescript
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

## FILE 10: src/App.css

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen",
    "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue",
    sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  padding: 20px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

h1 {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px 20px;
  text-align: center;
  font-size: 2.5em;
  margin-bottom: 0;
}

h2 {
  color: #333;
  margin-bottom: 20px;
  padding: 20px;
  border-bottom: 2px solid #f0f0f0;
}

.form-section,
.session-section {
  padding: 40px;
}

.input-group {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

input[type="text"] {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 16px;
  transition: all 0.3s ease;
}

input[type="text"]:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

button {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary,
button:not(.btn-secondary) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled),
button:not(.btn-secondary):hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.2);
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
  border: 2px solid #e0e0e0;
}

.btn-secondary:hover:not(:disabled) {
  background: #e0e0e0;
  border-color: #d0d0d0;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.session-info {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 6px;
  margin-bottom: 20px;
}

.session-info p {
  margin: 10px 0;
  color: #555;
  font-size: 16px;
}

.status-active {
  color: #4caf50;
  font-weight: bold;
}

.status-completed {
  color: #2196f3;
  font-weight: bold;
}

.status-paused {
  color: #ff9800;
  font-weight: bold;
}

.controls {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
}

.controls button {
  flex: 1;
}

.message {
  background: #e8f5e9;
  border-left: 4px solid #4caf50;
  padding: 15px;
  margin-bottom: 20px;
  border-radius: 4px;
  color: #2e7d32;
  white-space: pre-wrap;
  word-break: break-word;
}

.article-section {
  background: #f5f5f5;
  padding: 20px;
  border-radius: 6px;
  margin-bottom: 30px;
}

.article-section h3 {
  color: #333;
  margin-bottom: 15px;
  border-bottom: 2px solid #667eea;
  padding-bottom: 10px;
}

.article-content {
  line-height: 1.8;
  color: #555;
  background: white;
  padding: 20px;
  border-radius: 4px;
  border-left: 4px solid #667eea;
  max-height: 500px;
  overflow-y: auto;
}

.history-section {
  margin-top: 40px;
}

.history-section h3 {
  color: #333;
  margin-bottom: 15px;
  border-bottom: 2px solid #667eea;
  padding-bottom: 10px;
}

.history-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.history-item {
  background: #f9f9f9;
  padding: 15px;
  border-radius: 6px;
  border-left: 4px solid #667eea;
  transition: all 0.3s ease;
}

.history-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.history-item h4 {
  color: #667eea;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
}

.history-item p {
  color: #666;
  font-size: 14px;
  line-height: 1.6;
}

.stage-research {
  border-left-color: #4caf50;
}

.stage-research h4 {
  color: #4caf50;
}

.stage-writing {
  border-left-color: #2196f3;
}

.stage-writing h4 {
  color: #2196f3;
}

.stage-critique {
  border-left-color: #ff9800;
}

.stage-critique h4 {
  color: #ff9800;
}

.stage-feedback {
  border-left-color: #9c27b0;
}

.stage-feedback h4 {
  color: #9c27b0;
}

@media (max-width: 768px) {
  h1 {
    font-size: 2em;
  }

  .form-section,
  .session-section {
    padding: 20px;
  }

  .input-group {
    flex-direction: column;
  }

  .controls {
    flex-direction: column;
  }

  .history-list {
    grid-template-columns: 1fr;
  }
}

/* Scrollbar styling */
.article-content::-webkit-scrollbar {
  width: 8px;
}

.article-content::-webkit-scrollbar-track {
  background: #f0f0f0;
  border-radius: 4px;
}

.article-content::-webkit-scrollbar-thumb {
  background: #667eea;
  border-radius: 4px;
}

.article-content::-webkit-scrollbar-thumb:hover {
  background: #764ba2;
}
```

---

## Summary

These files create:
- **Backend**: Express server with REST API endpoints
- **Frontend**: React UI with interactive session management
- **Agents**: Four specialized AI agents (Researcher, Writer, Critic, Feedback)
- **Orchestrator**: Manages the complete feedback loop workflow
- **Styling**: Professional, responsive design with gradient effects

All files work together to provide a complete feedback loop system where users can:
1. Create a new session with a topic
2. Watch the agents collaborate to write and improve articles
3. See the feedback loop progress in real-time
4. Review the complete history of changes
