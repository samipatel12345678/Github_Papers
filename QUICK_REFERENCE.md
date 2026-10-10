# 🚀 Quick Reference Card

## Commands

```bash
# Install dependencies
npm install

# Development mode (both frontend & backend)
npm run dev

# Backend only
npm run server:dev

# Frontend only  
npm run client:dev

# Production build
npm run build

# Run production
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

---

## Environment Setup

```bash
# Create .env from template
cp .env.example .env

# Edit .env and add your key
OPENAI_API_KEY=sk-... 
PORT=5000
NODE_ENV=development
```

---

## URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

---

## Workflow Loop Phases

| # | Phase | Agent | Output |
|---|-------|-------|--------|
| 1 | Research | ResearcherAgent | Research notes & facts |
| 2 | Writing | WriterAgent | Initial article |
| 3 | Critique | CriticAgent | Rating, feedback, suggestions |
| 4 | Process | FeedbackAgent | Decision (continue/stop, next agent) |

**Repeats** until satisfied or max iterations (3) reached

---

## Files to Create

1. **Core Agents**: BaseAgent, Researcher, Writer, Critic, Feedback
2. **Orchestrator**: FeedbackLoopOrchestrator 
3. **Backend**: server.ts (Express REST API)
4. **Frontend**: App.tsx, main.tsx, App.css
5. **Config**: package.json, tsconfig.json, vite.config.ts, index.html

See IMPLEMENTATION_GUIDE.md and FRONTEND_GUIDE.md for complete code

---

## Key Classes

### BaseAgent (Abstract)
```typescript
- chat(message: string): AgentResponse
- clearHistory()
- getHistory()
```

### FeedbackLoopOrchestrator
```typescript
- createSession(id, topic): SessionState
- getSession(id): SessionState
- executeStep(id): Promise<string>
- endSession(id): SessionState
- getSessions(): SessionState[]
```

### SessionState
```typescript
{
  id: string
  topic: string
  currentArticle: string
  research: string
  iterationCount: number
  history: IterationHistory[]
  status: "active" | "completed" | "paused"
  createdAt: Date
  updatedAt: Date
}
```

---

## API Quick Reference

| Method | Endpoint | Body | Returns |
|--------|----------|------|---------|
| POST | /api/sessions | `{ topic }` | sessionId, status |
| POST | /api/sessions/:id/step | - | result, session |
| GET | /api/sessions/:id | - | session |
| GET | /api/sessions | - | sessions[], count |
| DELETE | /api/sessions/:id | - | message, session |
| GET | /health | - | status, timestamp |

---

## Next Steps

1. ✅ Install Node.js v18+
2. ✅ Clone/setup project folder
3. ✅ Run `npm install`
4. ✅ Setup `.env` file with OpenAI key
5. ✅ Run `npm run dev`
6. ✅ Open http://localhost:5173
7. ✅ Enter topic and click "Create Session"
8. ✅ Click "Next Step" to see agents work
9. ✅ Monitor progress and feedback loop

---

## Common Issues & Fixes

**Issue**: Port 5000/5173 already in use
**Fix**: Change PORT in .env or kill existing process

**Issue**: "Cannot find module" errors
**Fix**: Run `npm install` again

**Issue**: API key errors
**Fix**: Verify .env has OPENAI_API_KEY set correctly

**Issue**: Slow responses
**Fix**: OpenAI API takes time, be patient, check quota

---

## Architecture Overview

```
Client (React)
    ↓
Vite Dev Server (5173)
    ↓
API Proxy (/api → localhost:5000)
    ↓
Express Server (5000)
    ↓
FeedbackLoopOrchestrator
    ↓
Agent Classes
    ↓
OpenAI API (gpt-4-turbo-preview)
```

---

## Feature Checklist

- [x] Multi-agent architecture
- [x] Researcher Agent (gathers info)
- [x] Writer Agent (creates articles)
- [x] Critic Agent (reviews content)
- [x] Feedback Agent (processes feedback)
- [x] REST API endpoints
- [x] React frontend with real-time updates
- [x] Session management
- [x] Iteration history tracking
- [x] Status tracking
- [x] Responsive design

---

## Production Deployment

For production use:
1. Set `NODE_ENV=production`
2. Use environment variable management
3. Add rate limiting middleware
4. Implement authentication
5. Use database for session persistence
6. Add error logging/monitoring
7. Configure CORS properly
8. Use CDN for static assets

---

## Performance Considerations

- Each agent call takes 5-30 seconds (LLM processing)
- Total session: ~20-120 seconds depending on topic
- API costs: ~$0.05-0.50 per session (varies by token usage)
- Concurrent sessions: Limited by OpenAI rate limits
- Browser session storage: Auto-refreshes every 5 seconds

---

**Need help?** Check the full guides:
- SETUP_GUIDE.md - Detailed setup instructions
- IMPLEMENTATION_GUIDE.md - Complete code for agents & backend
- FRONTEND_GUIDE.md - Frontend code & styling
- PROJECT_STRUCTURE.md - Project overview
- README.md - General project information
