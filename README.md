# 🤖 Multi-Agent AI Feedback Loop & Content Studio

An autonomous multi-agent content generation and iterative feedback loop system powered by Google Gemini and Anthropic Claude.

---

## 🌟 Overview & Architecture

```
User Input (Topic, Format & Audience)
                  │
                  ▼
       [1. 🔍 Researcher Agent] ─── Curates live intelligence, statistics & authoritative sources
                  │
                  ▼
       [2. ✍️ Writer Agent]     ─── Composes format-specific draft (Blog / Paragraph / Report / File)
                  │
                  ▼
       [3. 🧐 Critic Agent]     ─── Conducts rigorous editorial audit, scores 1-10 & notes improvements
                  │
                  ▼
       [4. 🔄 Feedback Agent]   ─── Evaluates review, applies enhancements & decides next iteration
                  │
                  ▼
       [✨ Human-in-the-Loop]  ─── User can supply custom refinement prompts for instant re-drafting
```

---

## ✨ Features

- **Multi-Format Synthesis**:
  - 📝 **Blog Post**: SEO-optimized, engaging headers, key takeaways & actionable conclusions.
  - 📄 **Single Paragraph**: High-density 150-word synthesis capturing the core essence.
  - 📊 **Executive Report**: Structured formal document with Executive Summary, Findings, Risk Audit & Recommendations.
  - 📁 **Exportable File**: Complete Markdown document with metadata, Table of Contents & References.
- **Source & Resource Intelligence**: Curates background data, metrics, and references before drafting.
- **Editorial Critique & Auto-Polish**: Critic Agent evaluates against format criteria and feeds recommendations back to the Writer.
- **Human-in-the-Loop Iterations**: Users can inject specific custom feedback to immediately refine the draft.
- **Magazine Reader View & Raw Mode**: Switch between an editorial magazine layout and raw markdown text.
- **Instant File Export**: One-click download as `.md` or `.txt` file.
- **Persistent Local Database**: Automatic state preservation in `data/sessions.json`.

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express, TypeScript, tsx
- **Frontend**: React 18, Vite, Custom Responsive CSS
- **AI Models**: Google Gemini (`gemini-1.5-flash`), Anthropic Claude (`claude-3-5-sonnet`)
- **Database**: Local JSON File Database (`data/sessions.json`)

---

## 🚀 Getting Started

### 1. Installation

```bash
git clone https://github.com/samipatel12345678/Github_Papers.git
cd AiFeedback
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# (Optional) Anthropic Claude API Key
# ANTHROPIC_API_KEY=your_claude_api_key_here

PORT=5000
NODE_ENV=development
```

### 3. Running the Application

**Option A: Separate Terminals (Recommended for Windows)**

```bash
# Terminal 1: Start Backend Server
npm run server:dev

# Terminal 2: Start Frontend UI
npm run client:dev
```

**Option B: Single Command**

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📡 REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/sessions` | Initialize a new multi-agent session |
| `POST` | `/api/sessions/:id/step` | Execute the next step in the pipeline |
| `POST` | `/api/sessions/:id/user-feedback` | Apply custom human-in-the-loop revision |
| `GET` | `/api/sessions/:id` | Retrieve session state, draft, and history |
| `GET` | `/api/sessions` | List all sessions from database |
| `DELETE` | `/api/sessions/:id` | Finalize and complete session |
| `GET` | `/health` | Health check endpoint |
