# 🚀 Google Antigravity Multi-Agent Studio

> **Universal Collaborative AI Coding Studio uniting Antigravity, Claude, Cursor, Devin, ChatGPT & Gemini over a Single Shared History with real disk synchronization and autonomous execution.**

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4.x-black.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-emerald.svg)](https://www.mongodb.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🌟 Overview

**Google Antigravity Multi-Agent Studio** is an open-source development environment designed around a revolutionary paradigm: **a Single Canonical Shared History**.

Traditional AI coding assistants operate in isolated silos, forcing developers to manually copy-paste specifications, code blocks, audits, and test results between different tabs. This studio binds the world's most specialized AI agents into **one continuous document canvas**, where every agent deliberation, architectural contract, code diff, security audit, and sandbox execution is visible to all other agents in real time.

```
       ┌────────────────────────────────────────────────────────┐
       │               Single Shared History                    │
       │       (MongoDB & Physical Disk Event Stream)           │
       └───────────────────────────┬────────────────────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
  🚀 Antigravity             🧠 Claude                 ⚡ Cursor
(DeepMind Architecture)     (Anthropic Security)      (Composer Synthesizer)
         │                         │                         │
         └─────────────────────────┼─────────────────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
   🤖 Devin                  🟢 ChatGPT                ♊ Gemini
(Cognition Sandbox SWE)     (OpenAI Strategy)       (Google Context Engine)
```

---

## 👥 The Agent Council

| Agent | Creator | Default Model | Primary Specialization |
| :--- | :--- | :--- | :--- |
| **🚀 Antigravity** | Google DeepMind | `gemini-2.0-flash` | System architecture, mathematical invariants, boundary contracts, and modular file topology. |
| **🧠 Claude** | Anthropic | `claude-3-7-sonnet` | Deep security analysis, boundary condition verification, memory leak defense, and zero-waste refactoring. |
| **⚡ Cursor** | Anysphere | `composer-v2` | Surgical code synthesis, multi-file code authoring, and direct physical disk synchronization. |
| **🤖 Devin** | Cognition AI | `sandbox-v2` | Autonomous environment QA, automated unit test authoring, and real child-process execution. |
| **🟢 ChatGPT** | OpenAI | `gpt-4o` | Ecosystem strategy, API ergonomics, framework compatibility, and production scalability. |
| **♊ Gemini** | Google | `gemini-2.0` | Cross-system context synthesis, large-scale timeline audits, and repo-wide invariants. |

---

## 💡 Key Architectural Breakthroughs

### 1. Single Shared History (Inter-Agent Awareness)
Every prompt and turn is committed to an immutable chronological timeline. When Cursor synthesizes code, it has full context of Antigravity's architectural specifications and Claude's defensive security rules. When Devin writes tests, it verifies the exact methods authored by Cursor.

### 2. Universal Model Leasing
You do not need subscriptions to every AI provider. **Supplying any single key** (such as a 100% free Google Gemini key or Groq key) leases all 6+ agents automatically. The system routes every agent through your active key while preserving their authentic system prompts, personas, and specialized missions.

### 3. Physical Disk Workspace Sync
Files created or modified by agents are not merely rendered as text bubbles—they are written directly to `server/workspace/<sessionId>/` on your physical file system. Edits in the **Code Studio** save with `Ctrl+S` directly to disk, and Devin's tests run using real Node.js child processes.

### 4. Dynamic Autonomous Fallback Engine
When running offline or without API keys, the built-in **Dynamic Autonomous Engine** parses the user's specific prompt (e.g., games, algorithms, REST APIs, auth systems), generates custom, non-mock, executable code, audits it, and executes real automated tests.

---

## 🖥️ User Interface: Google Antigravity Design System

The frontend interface embodies the **Google Antigravity 2.0** design language:
- **Obsidian Dark Palette**: `#131314` base background, `#1e1f20` surface cards, `#3c4043` border hierarchy.
- **DeepMind & Google Accents**: Violet (`#c084fc`), Google Blue (`#a8c7fa`), Anthropic Gold (`#fbc02d`), and Terminal Green (`#6dd58c`).
- **48px Activity Bar**: Quick access to chats, Code Studio, Sandbox Terminal, shortcuts, and settings.
- **Three Core Working Surfaces**:
  1. **💬 Chat Canvas**: Primary chronological stream featuring agent turns with collapsible `<details>` thinking process accordions.
  2. **💻 Code Studio**: Full-screen code editor with multi-file tabs, physical disk sync, line numbers, and keyboard shortcuts (`Ctrl+S`).
  3. **🖥️ Sandbox Terminal**: Cognition Devin terminal runner capturing real child process stdout, stderr, and exit codes.
- **Floating Prompt Card**: Bottom input card featuring `@ Agent` summon chips, quick command helpers (`/plan`, `/goal`, `/schedule`, `/browser`), and circular send button (`↑`).

---

## 🔌 Supported LLM Providers

| Provider | Free Tier Available? | Recommended Model | Configuration |
| :--- | :--- | :--- | :--- |
| **Google Gemini** | ✅ Yes (15 RPM free) | `gemini-2.0-flash` | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| **Groq Cloud** | ✅ Yes (Ultra-fast free tier) | `llama-3.3-70b-versatile` | [Groq Console](https://console.groq.com/keys) |
| **OpenRouter** | ✅ Yes (Includes 100% free models) | `google/gemini-2.0-flash-exp:free` | [OpenRouter Keys](https://openrouter.ai/keys) |
| **Anthropic** | Paid API | `claude-3-7-sonnet-20250219` | [Anthropic Console](https://console.anthropic.com/) |
| **OpenAI** | Paid API | `gpt-4o` / `gpt-4o-mini` | [OpenAI Platform](https://platform.openai.com/api-keys) |
| **Ollama / Local** | ✅ Yes (100% Free & Local) | `llama3`, `qwen2.5-coder` | `http://localhost:11434` |

---

## 📁 Repository Structure

```
multi_coding_agents/
├── client/                      # React Frontend (Vite)
│   ├── dist/                    # Production static build
│   │   └── index.html           # Standalone production UI
│   ├── src/
│   │   ├── App.jsx              # Main Antigravity React Application
│   │   ├── index.css            # Antigravity Design System stylesheet
│   │   └── main.jsx             # React entrypoint
│   ├── index.html               # Vite HTML template
│   └── package.json             # Frontend dependencies
├── server/                      # Express Backend
│   ├── agents/                  # Orchestrator & Multi-Agent Core
│   │   ├── UniversalOrchestrator.js # Universal multi-agent pipeline
│   │   ├── SingleSharedHistory.js   # Canonical shared event stream
│   │   └── BaseAgent.js             # Base agent contract
│   ├── config/
│   │   ├── agentsCatalog.js     # Agent catalog & metadata
│   │   └── db.js                # MongoDB connection & in-memory fallback
│   ├── models/                  # Data Models
│   │   ├── Session.js           # Session schema
│   │   ├── HistoryEntry.js      # Chronological turn schema
│   │   └── WorkspaceFile.js     # Code file schema
│   ├── public/                  # Static fallback distribution
│   │   └── index.html           # Standalone single-file app
│   ├── routes/
│   │   └── api.js               # REST API endpoints
│   ├── services/
│   │   ├── dynamicAgentEngine.js# Autonomous prompt-to-code synthesizer
│   │   ├── realLLMProvider.js   # Multi-provider HTTPS connector
│   │   ├── realToolRunner.js    # Child process runner & disk I/O
│   │   └── settingsManager.js   # API key persistence & diagnostics
│   ├── workspace/               # Physical disk workspace directory
│   └── server.js                # Express server entrypoint (Port 5000)
├── multi_agent/                 # Python reference SDK for agent tools
├── .env.example                 # Environment template
├── .gitignore                   # Git ignore rules
├── package.json                 # Root dependencies & scripts
├── README.md                    # Project documentation
└── Run_Multi_Agents.bat         # One-click Windows launch script
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Optional — application automatically switches to **In-Memory Resilient Mode** if MongoDB is offline)

### Installation

1. **Clone the repository and checkout the `Multi-agent` branch:**
   ```bash
   git clone -b Multi-agent https://github.com/samipatel12345678/Github_Papers.git
   cd Github_Papers
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment (Optional):**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   *(You can also configure API keys directly inside the application UI via the ⚙️ Settings modal).*

4. **Start the Application:**

   - **Option A: One-Click Windows Launcher:**
     Double-click `Run_Multi_Agents.bat`.

   - **Option B: Command Line:**
     ```bash
     npm run server
     ```

5. **Open in Browser:**
   Navigate to [http://localhost:5000](http://localhost:5000).

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + S` | Save active file in Code Studio to physical disk |
| `Enter` | Send message or execute council broadcast |
| `Ctrl + I` | Focus bottom prompt input card |

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check, DB status, and active key diagnostics |
| `GET` | `/api/settings` | Retrieve active LLM provider configurations |
| `POST` | `/api/settings` | Update and persist API keys to `.env` |
| `POST` | `/api/settings/test` | Test live API connectivity and measure latency |
| `GET` | `/api/sessions` | List all conversation sessions |
| `POST` | `/api/sessions` | Create a new session with an initial prompt |
| `GET` | `/api/sessions/:id/history` | Retrieve the canonical chronological history |
| `POST` | `/api/sessions/:id/summon-agent` | Summon a specific agent to take a turn |
| `POST` | `/api/sessions/:id/run-all` | Execute full Roundtable Council across all agents |
| `GET` | `/api/sessions/:id/files` | List physical disk workspace files |
| `POST` | `/api/sessions/:id/files` | Create or update a workspace file |

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
