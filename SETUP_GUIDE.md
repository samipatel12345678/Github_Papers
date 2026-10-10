# 🤖 AI Feedback Loop System - Complete Setup Guide

## Overview

This is a **multi-agent AI system** for iterative article improvement through automated feedback loops.

**Agent Flow:**
```
Researcher → Writer → Critic → Feedback Processor → Loop or Complete
```

---

## 📋 Project Structure

```
AiFeedback/
├── src/
│   ├── BaseAgent.ts              # Abstract agent class
│   ├── ResearcherAgent.ts         # Research gathering agent
│   ├── WriterAgent.ts             # Article writing agent
│   ├── CriticAgent.ts             # Content critique agent
│   ├── FeedbackAgent.ts           # Feedback processing agent
│   ├── FeedbackLoopOrchestrator.ts # Main orchestrator
│   ├── server.ts                  # Express server
│   ├── App.tsx                    # React frontend
│   ├── main.tsx                   # React entry point
│   └── App.css                    # Styling
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript config
├── vite.config.ts                # Vite config
├── index.html                    # HTML entry point
├── .env.example                  # Environment template
└── .gitignore
```

---

## 🚀 Quick Start

### Step 1: Install Node.js (if not already installed)
- Download from https://nodejs.org/ (v18+)

### Step 2: Navigate to Project
```bash
cd C:\Users\Dell\OneDrive\Desktop\AiFeedback
```

### Step 3: Install Dependencies
```bash
npm install
```

### Step 4: Setup Environment Variables
Create `.env` file from `.env.example`:
```bash
# Copy or create .env file with:
OPENAI_API_KEY=your-actual-api-key-here
PORT=5000
NODE_ENV=development
```

Get your API key from: https://platform.openai.com/api-keys

### Step 5: Run Development Server
```bash
npm run dev
```

This starts:
- **Backend API**: http://localhost:5000
- **Frontend**: http://localhost:5173

---

## 📁 Creating Source Files Manually

If you need to create files manually, here's what to create:

### Create `src` directory structure:
```
mkdir src
mkdir src\client
```

### Copy each file content:

1. **src/BaseAgent.ts** - See IMPLEMENTATION_GUIDE.md (FILE 1)
2. **src/ResearcherAgent.ts** - See IMPLEMENTATION_GUIDE.md (FILE 2)
3. **src/WriterAgent.ts** - See IMPLEMENTATION_GUIDE.md (FILE 3)
4. **src/CriticAgent.ts** - See IMPLEMENTATION_GUIDE.md (FILE 4)
5. **src/FeedbackAgent.ts** - See IMPLEMENTATION_GUIDE.md (FILE 5)
6. **src/server.ts** - See IMPLEMENTATION_GUIDE.md (FILE 6)
7. **src/FeedbackLoopOrchestrator.ts** - See IMPLEMENTATION_GUIDE.md (FILE 7)
8. **src/App.tsx** - See FRONTEND_GUIDE.md (FILE 8)
9. **src/main.tsx** - See FRONTEND_GUIDE.md (FILE 9)
10. **src/App.css** - See FRONTEND_GUIDE.md (FILE 10)

---

## 🎯 Using the System

### 1. Create a Session
Open http://localhost:5173 and enter a topic (e.g., "The Future of AI")

### 2. Execute Steps
Click "Next Step" to advance through the feedback loop:

- **Step 1**: Researcher gathers information
- **Step 2**: Writer creates article
- **Step 3**: Critic reviews article
- **Step 4**: Feedback processor decides next action

### 3. Loop Continues
If article needs improvement:
- Feedback goes back to Writer or Researcher
- Process repeats (max 3 iterations)

### 4. Complete
When article quality is satisfactory or max iterations reached, loop ends

---

## 🔌 API Endpoints

### Create Session
```bash
POST /api/sessions
Content-Type: application/json

{ "topic": "Your article topic here" }

Response:
{
  "success": true,
  "sessionId": "uuid-here",
  "topic": "Your article topic here",
  "status": "active"
}
```

### Execute Step
```bash
POST /api/sessions/{sessionId}/step

Response:
{
  "success": true,
  "result": "Step output...",
  "session": { ... full session state ... }
}
```

### Get Session
```bash
GET /api/sessions/{sessionId}

Response:
{
  "success": true,
  "session": { ... full session state ... }
}
```

### Get All Sessions
```bash
GET /api/sessions

Response:
{
  "success": true,
  "sessions": [ ... array of sessions ... ],
  "count": 5
}
```

### End Session
```bash
DELETE /api/sessions/{sessionId}

Response:
{
  "success": true,
  "message": "Session ended",
  "session": { ... final session state ... }
}
```

### Health Check
```bash
GET /health

Response:
{ "status": "ok", "timestamp": "2024-01-15T10:30:00Z" }
```

---

## 🧠 Agent Responsibilities

### Researcher Agent
- Analyzes the topic thoroughly
- Gathers key facts and information
- Identifies important aspects to cover
- Provides structured research notes

### Writer Agent
- Creates engaging article content
- Incorporates research naturally
- Uses proper formatting and structure
- Improves articles based on feedback

### Critic Agent
- Reviews content quality (1-10 rating)
- Identifies strengths
- Points out weaknesses
- Provides actionable improvement suggestions
- Determines if revision is needed

### Feedback Agent
- Analyzes critic feedback
- Decides if loop should continue
- Routes feedback to appropriate agent
- Considers iteration limits
- Prevents infinite loops

---

## ⚙️ Configuration

### Max Iterations
Default: 3 feedback cycles
Modify in `FeedbackLoopOrchestrator.ts`:
```typescript
private readonly maxIterations = 3;
```

### Model Selection
Current: `gpt-4-turbo-preview`
Change in `BaseAgent.ts`:
```typescript
protected model: string = "gpt-4-turbo-preview";
```

### Max Tokens
Current: 2000 tokens per response
Change in `BaseAgent.ts` chat method:
```typescript
max_tokens: 2000,
```

---

## 🐛 Troubleshooting

### Error: "OPENAI_API_KEY is not set"
- Check `.env` file exists in project root
- Verify `OPENAI_API_KEY=...` is set correctly
- Restart server after changing .env

### Frontend shows "Error creating session"
- Check backend server is running (http://localhost:5000)
- Verify API endpoint in browser console
- Check browser network tab for API errors

### API calls timeout
- Increase timeout values (takes time for AI to process)
- Check OpenAI API status
- Verify internet connection
- Check rate limits on API key

### Out of API quota
- Check OpenAI account billing
- Review API usage at platform.openai.com
- Consider using cheaper models like gpt-3.5-turbo

---

## 📊 Session Structure

Each session tracks:
- **id**: Unique session identifier
- **topic**: Article topic
- **currentArticle**: Latest article version
- **research**: Researcher's findings
- **iterationCount**: Number of steps executed
- **status**: "active", "completed", or "paused"
- **history**: Array of all steps with timestamps
- **createdAt**: When session started
- **updatedAt**: When session last updated

---

## 🔄 Workflow Example

**Topic**: "Artificial Intelligence in Healthcare"

1. **Research Phase**
   - Gathers facts about AI in healthcare
   - Identifies key applications (diagnosis, treatment, research)
   - Compiles recent statistics and case studies

2. **Writing Phase**
   - Creates comprehensive article
   - Incorporates research seamlessly
   - Adds engaging introduction and conclusion

3. **Critique Phase**
   - Reviews for accuracy and completeness
   - Checks grammar and style
   - Rates: 7/10
   - Feedback: "Good structure, needs more recent examples"

4. **Feedback Processing**
   - Decides: Continue loop, send to Writer
   - Reasoning: Quality acceptable but needs enhancement

5. **Improvement Cycle**
   - Writer updates article with fresh examples
   - Critic reviews improved version
   - Rates: 8.5/10
   - Final decision: Completed, good quality

---

## 📈 Performance Tips

1. **Batch Requests**: Create multiple sessions for parallel processing
2. **Monitor Costs**: Track API usage, expensive LLM calls
3. **Cache Research**: Reuse research for similar topics
4. **Optimize Prompts**: Make system prompts more specific
5. **Iterate Wisely**: Set appropriate max iterations

---

## 🔐 Security Notes

- Never commit `.env` with real API keys
- Use environment variables for production
- Validate user input on backend
- Consider rate limiting for production
- Monitor API key usage

---

## 📚 Additional Resources

- OpenAI API Docs: https://platform.openai.com/docs
- Express.js Docs: https://expressjs.com
- React Docs: https://react.dev
- TypeScript Docs: https://www.typescriptlang.org
- Vite Docs: https://vitejs.dev

---

## 🤝 Support

For issues:
1. Check error messages in browser console
2. Review backend logs in terminal
3. Verify API key validity
4. Test endpoints with curl or Postman
5. Check OpenAI API status

---

## 📝 Notes

- Each agent maintains conversation history
- Articles improve iteratively based on feedback
- System designed to prevent infinite loops
- Frontend auto-refreshes session state
- All timestamps in ISO 8601 format

---

**Ready to get started? Run `npm install` and `npm run dev`!** 🚀
