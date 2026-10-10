# Complete Project File Structure

## DIRECTORY LAYOUT
```
AiFeedback/
├── src/
│   ├── BaseAgent.ts
│   ├── ResearcherAgent.ts
│   ├── WriterAgent.ts
│   ├── CriticAgent.ts
│   ├── FeedbackAgent.ts
│   ├── FeedbackLoopOrchestrator.ts
│   ├── server.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── App.css
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
├── .env.example
├── .gitignore
└── README.md
```

## KEY FILES CONTENT

### 1. BaseAgent.ts (Abstract base class for all agents)
- Manages OpenAI/Claude API connections
- Handles message history
- Provides chat interface for all agents

### 2. ResearcherAgent.ts
- Conducts topic research
- Gathers facts and information
- Returns structured research notes

### 3. WriterAgent.ts
- Writes articles based on research
- Improves articles based on feedback
- Maintains writing quality and engagement

### 4. CriticAgent.ts
- Reviews article quality
- Provides structured feedback (rating, strengths, weaknesses, suggestions)
- Determines if revision is needed

### 5. FeedbackAgent.ts
- Processes critic feedback
- Decides whether to continue loop
- Routes feedback to appropriate agent (Researcher or Writer)
- Manages iteration limits

### 6. FeedbackLoopOrchestrator.ts
- Orchestrates the complete feedback loop
- Manages session state
- Executes steps sequentially
- Tracks iteration history

### 7. server.ts (Express API)
- POST /api/sessions - Create new session
- POST /api/sessions/:id/step - Execute feedback loop step
- GET /api/sessions/:id - Get session details
- GET /api/sessions - List all sessions
- DELETE /api/sessions/:id - End session
- GET /health - Health check

### 8. React Frontend (App.tsx + main.tsx)
- Create new feedback sessions
- Start feedback loop
- Monitor progress
- View results
- End sessions

## AGENT WORKFLOW

1. USER PROVIDES TOPIC
   ↓
2. RESEARCHER AGENT
   - Gathers research on topic
   ↓
3. WRITER AGENT
   - Writes article based on research
   ↓
4. CRITIC AGENT
   - Reviews article quality
   - Provides feedback
   ↓
5. FEEDBACK PROCESSOR
   - Analyzes critique
   - Decides next step
   ↓
6. DECISION POINT:
   - If article good: DONE
   - If needs improvement: Send feedback to WRITER or RESEARCHER
   - Loop continues (max 3 iterations)

## SETUP INSTRUCTIONS

1. Install Node.js (v18+)
2. Run: npm install
3. Set up .env file with OPENAI_API_KEY
4. Run: npm run dev
5. Open: http://localhost:5173 (frontend)
6. API available at: http://localhost:5000

## DEPENDENCIES

- express: REST API framework
- openai: OpenAI API client (or anthropic for Claude)
- react: UI framework
- vite: Frontend build tool
- typescript: Type safety
- dotenv: Environment variables
- cors: Cross-origin requests
- uuid: Session ID generation
