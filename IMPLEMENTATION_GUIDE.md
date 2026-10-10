# Complete Code Files for AI Feedback Loop System

## Quick Start

```bash
# 1. Navigate to project directory
cd C:\Users\Dell\OneDrive\Desktop\AiFeedback

# 2. Install dependencies
npm install

# 3. Setup environment
Copy .env.example to .env and add your OpenAI API key

# 4. Run development server
npm run dev
```

---

## FILE 1: src/BaseAgent.ts

```typescript
import OpenAI from "openai";

export interface AgentMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AgentResponse {
  content: string;
  messageHistory: AgentMessage[];
}

export abstract class BaseAgent {
  protected client: OpenAI;
  protected model: string = "gpt-4-turbo-preview";
  protected messageHistory: AgentMessage[] = [];
  protected systemPrompt: string;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
    this.systemPrompt = this.getSystemPrompt();
  }

  protected abstract getSystemPrompt(): string;

  async chat(userMessage: string): Promise<AgentResponse> {
    this.messageHistory.push({
      role: "user",
      content: userMessage,
    });

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 2000,
      system: this.systemPrompt,
      messages: this.messageHistory,
    });

    const contentBlock = response.content[0];
    const assistantMessage =
      contentBlock.type === "text" ? contentBlock.text : "";

    this.messageHistory.push({
      role: "assistant",
      content: assistantMessage,
    });

    return {
      content: assistantMessage,
      messageHistory: [...this.messageHistory],
    };
  }

  clearHistory(): void {
    this.messageHistory = [];
  }

  getHistory(): AgentMessage[] {
    return [...this.messageHistory];
  }
}
```

---

## FILE 2: src/ResearcherAgent.ts

```typescript
import { BaseAgent } from "./BaseAgent";

export class ResearcherAgent extends BaseAgent {
  protected getSystemPrompt(): string {
    return `You are a Research Agent. Your role is to:
1. Gather comprehensive research on a given topic
2. Find key facts, statistics, and insights
3. Identify gaps in knowledge
4. Provide well-structured research notes
5. Cite sources when possible

Focus on being thorough, factual, and objective. Structure your research with clear sections and bullet points.`;
  }

  async research(topic: string): Promise<string> {
    const response = await this.chat(
      `Please conduct comprehensive research on the following topic and provide detailed findings:\n\nTopic: ${topic}`
    );
    return response.content;
  }
}
```

---

## FILE 3: src/WriterAgent.ts

```typescript
import { BaseAgent } from "./BaseAgent";

export class WriterAgent extends BaseAgent {
  protected getSystemPrompt(): string {
    return `You are a Professional Writer Agent. Your role is to:
1. Create engaging, well-structured articles and blog posts
2. Incorporate research and facts seamlessly
3. Write in an accessible, engaging tone
4. Use proper formatting with headers, subheaders, and lists
5. Ensure logical flow and coherent arguments
6. Make content suitable for target audience

Write high-quality content that is informative, engaging, and professional.`;
  }

  async writeArticle(
    topic: string,
    researchNotes?: string
  ): Promise<string> {
    const prompt = researchNotes
      ? `Please write a comprehensive article based on the following research:\n\n${researchNotes}\n\nTopic: ${topic}`
      : `Please write a comprehensive article on the following topic:\n\nTopic: ${topic}`;

    const response = await this.chat(prompt);
    return response.content;
  }

  async improveArticle(article: string, feedback: string): Promise<string> {
    const prompt = `Please improve the following article based on this feedback:\n\nFeedback: ${feedback}\n\nOriginal Article:\n${article}`;
    const response = await this.chat(prompt);
    return response.content;
  }
}
```

---

## FILE 4: src/CriticAgent.ts

```typescript
import { BaseAgent } from "./BaseAgent";

export interface CriticFeedback {
  overallRating: number; // 1-10
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  needsRevision: boolean;
}

export class CriticAgent extends BaseAgent {
  protected getSystemPrompt(): string {
    return `You are a Critical Review Agent. Your role is to:
1. Critically analyze written content for quality, accuracy, and clarity
2. Identify strengths and weaknesses
3. Provide constructive feedback for improvement
4. Check for factual accuracy, grammar, and style
5. Suggest specific improvements
6. Rate content quality (1-10)
7. Determine if revision is needed

Be thorough but fair. Provide actionable feedback that helps improve the content.`;
  }

  async critique(article: string): Promise<CriticFeedback> {
    const prompt = `Please provide a detailed critical review of the following article:

Article:
${article}

Provide your feedback in the following structure:
1. Overall Rating (1-10)
2. Strengths (list 3-5 key strengths)
3. Weaknesses (list 3-5 key areas for improvement)
4. Specific Suggestions (list 4-6 actionable improvements)
5. Does this need revision? (Yes/No)`;

    const response = await this.chat(prompt);
    return this.parseCriticResponse(response.content);
  }

  private parseCriticResponse(content: string): CriticFeedback {
    const ratingMatch = content.match(/Overall Rating[:\s]+(\d+)/i);
    const rating = ratingMatch ? parseInt(ratingMatch[1]) : 5;

    const strengths = this.extractList(
      content,
      /Strengths:?([\s\S]*?)(?:Weaknesses|$)/i
    );
    const weaknesses = this.extractList(
      content,
      /Weaknesses:?([\s\S]*?)(?:Suggestions|$)/i
    );
    const suggestions = this.extractList(
      content,
      /Suggestions:?([\s\S]*?)(?:Does|$)/i
    );
    const needsRevision =
      content.toLowerCase().includes("needs revision") &&
      content.toLowerCase().includes("yes");

    return {
      overallRating: rating,
      strengths,
      weaknesses,
      suggestions,
      needsRevision,
    };
  }

  private extractList(text: string, regex: RegExp): string[] {
    const match = text.match(regex);
    if (!match || !match[1]) return [];

    return match[1]
      .split(/\n/g)
      .filter((line) => line.trim().length > 0)
      .map((line) => line.replace(/^[-•*]\s+/, "").trim())
      .filter((line) => line.length > 0);
  }
}
```

---

## FILE 5: src/FeedbackAgent.ts

```typescript
import { BaseAgent } from "./BaseAgent";

export interface FeedbackDecision {
  shouldContinue: boolean;
  nextAgent: "researcher" | "writer" | "done";
  reasoning: string;
  feedback: string;
}

export class FeedbackAgent extends BaseAgent {
  protected getSystemPrompt(): string {
    return `You are a Feedback Processing Agent. Your role is to:
1. Analyze critic feedback and article status
2. Determine if the feedback loop should continue
3. Decide whether to send feedback back to Researcher or Writer
4. Summarize key feedback points
5. Provide reasoning for the decision

Be decisive and clear about next steps. Consider iteration limits to avoid infinite loops.`;
  }

  async processFeedback(
    article: string,
    criticFeedback: string,
    iterationCount: number
  ): Promise<FeedbackDecision> {
    const maxIterations = 3;

    const prompt = `Please analyze the following article and critic feedback, then decide the next step:

Article:
${article}

Critic Feedback:
${criticFeedback}

Iteration Count: ${iterationCount}/${maxIterations}

Based on the feedback:
1. Should we continue the loop? (Yes/No)
2. If yes, should the feedback go to Researcher or Writer?
3. What is your reasoning?
4. Summarize the key feedback to pass forward.

Consider:
- Quality improvements needed
- Whether more research is required
- Whether the iteration limit (${maxIterations}) has been reached
- If the article quality is sufficient`;

    const response = await this.chat(prompt);
    return this.parseFeedbackDecision(
      response.content,
      iterationCount,
      maxIterations
    );
  }

  private parseFeedbackDecision(
    content: string,
    iterationCount: number,
    maxIterations: number
  ): FeedbackDecision {
    const shouldContinue =
      iterationCount < maxIterations &&
      (content.toLowerCase().includes("yes") &&
        !content.toLowerCase().includes("no") &&
        !content.toLowerCase().includes("done"));

    let nextAgent: "researcher" | "writer" | "done" = "done";
    if (shouldContinue) {
      if (
        content.toLowerCase().includes("researcher") &&
        !content.toLowerCase().includes("writer")
      ) {
        nextAgent = "researcher";
      } else {
        nextAgent = "writer";
      }
    }

    return {
      shouldContinue,
      nextAgent,
      reasoning: content.substring(0, 300),
      feedback: content,
    };
  }
}
```

---

## FILE 6: src/server.ts

```typescript
import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { FeedbackLoopOrchestrator, SessionState } from "./FeedbackLoopOrchestrator";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5000;
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error("OPENAI_API_KEY environment variable is not set");
}

const orchestrator = new FeedbackLoopOrchestrator(apiKey);

app.use(cors());
app.use(express.json());

app.post("/api/sessions", (req: Request, res: Response) => {
  try {
    const { topic } = req.body;

    if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
      return res
        .status(400)
        .json({ error: "Topic is required and must be a non-empty string" });
    }

    const sessionId = uuidv4();
    const session = orchestrator.createSession(sessionId, topic.trim());

    res.status(201).json({
      success: true,
      sessionId: session.id,
      topic: session.topic,
      status: session.status,
    });
  } catch (error) {
    console.error("Error creating session:", error);
    res.status(500).json({ error: "Failed to create session" });
  }
});

app.post("/api/sessions/:id/step", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const session = orchestrator.getSession(id);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    if (session.status !== "active") {
      return res.status(400).json({ error: `Session is ${session.status}` });
    }

    const result = await orchestrator.executeStep(id);
    const updatedSession = orchestrator.getSession(id);

    res.json({
      success: true,
      result,
      session: updatedSession,
    });
  } catch (error) {
    console.error("Error executing step:", error);
    res.status(500).json({ error: "Failed to execute step" });
  }
});

app.get("/api/sessions/:id", (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const session = orchestrator.getSession(id);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error("Error fetching session:", error);
    res.status(500).json({ error: "Failed to fetch session" });
  }
});

app.get("/api/sessions", (req: Request, res: Response) => {
  try {
    const sessions = orchestrator.getSessions();
    res.json({
      success: true,
      sessions,
      count: sessions.length,
    });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

app.delete("/api/sessions/:id", (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const session = orchestrator.endSession(id);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.json({
      success: true,
      message: "Session ended",
      session,
    });
  } catch (error) {
    console.error("Error ending session:", error);
    res.status(500).json({ error: "Failed to end session" });
  }
});

app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log("Available endpoints:");
  console.log("  POST   /api/sessions - Create new session");
  console.log("  POST   /api/sessions/:id/step - Execute feedback loop step");
  console.log("  GET    /api/sessions/:id - Get session details");
  console.log("  GET    /api/sessions - Get all sessions");
  console.log("  DELETE /api/sessions/:id - End session");
  console.log("  GET    /health - Health check");
});

export default app;
```

---

## FILE 7: src/FeedbackLoopOrchestrator.ts

```typescript
import { ResearcherAgent } from "./ResearcherAgent";
import { WriterAgent } from "./WriterAgent";
import { CriticAgent, CriticFeedback } from "./CriticAgent";
import { FeedbackAgent, FeedbackDecision } from "./FeedbackAgent";

export interface SessionState {
  id: string;
  topic: string;
  currentArticle: string;
  research: string;
  iterationCount: number;
  history: IterationHistory[];
  status: "active" | "completed" | "paused";
  createdAt: Date;
  updatedAt: Date;
}

export interface IterationHistory {
  iteration: number;
  stage: "research" | "writing" | "critique" | "feedback";
  content: string;
  timestamp: Date;
}

export class FeedbackLoopOrchestrator {
  private researcherAgent: ResearcherAgent;
  private writerAgent: WriterAgent;
  private criticAgent: CriticAgent;
  private feedbackAgent: FeedbackAgent;
  private sessions: Map<string, SessionState> = new Map();
  private readonly maxIterations = 3;

  constructor(apiKey: string) {
    this.researcherAgent = new ResearcherAgent(apiKey);
    this.writerAgent = new WriterAgent(apiKey);
    this.criticAgent = new CriticAgent(apiKey);
    this.feedbackAgent = new FeedbackAgent(apiKey);
  }

  createSession(sessionId: string, topic: string): SessionState {
    const session: SessionState = {
      id: sessionId,
      topic,
      currentArticle: "",
      research: "",
      iterationCount: 0,
      history: [],
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId: string): SessionState | undefined {
    return this.sessions.get(sessionId);
  }

  async executeStep(sessionId: string): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error("Session not found");
    if (session.status !== "active") throw new Error("Session not active");

    const iteration = session.iterationCount;

    if (iteration === 0) {
      return await this.executeResearch(session);
    } else if (iteration % 4 === 1) {
      return await this.executeWriting(session);
    } else if (iteration % 4 === 2) {
      return await this.executeCritique(session);
    } else {
      return await this.executeFeedbackProcessing(session);
    }
  }

  private async executeResearch(session: SessionState): Promise<string> {
    console.log(`[Session ${session.id}] Research phase started`);
    const research = await this.researcherAgent.research(session.topic);

    session.research = research;
    session.history.push({
      iteration: session.iterationCount,
      stage: "research",
      content: research,
      timestamp: new Date(),
    });

    session.iterationCount++;
    session.updatedAt = new Date();

    return `Research Complete:\n${research}`;
  }

  private async executeWriting(session: SessionState): Promise<string> {
    console.log(`[Session ${session.id}] Writing phase started`);
    const article = await this.writerAgent.writeArticle(
      session.topic,
      session.iterationCount > 1 ? undefined : session.research
    );

    if (session.iterationCount === 1) {
      session.currentArticle = article;
    }

    session.history.push({
      iteration: session.iterationCount,
      stage: "writing",
      content: article,
      timestamp: new Date(),
    });

    session.iterationCount++;
    session.updatedAt = new Date();

    return `Article Written:\n${article.substring(0, 500)}...`;
  }

  private async executeCritique(session: SessionState): Promise<string> {
    console.log(`[Session ${session.id}] Critique phase started`);
    const feedback = await this.criticAgent.critique(session.currentArticle);

    const feedbackSummary = `
Rating: ${feedback.overallRating}/10
Strengths: ${feedback.strengths.join(", ")}
Weaknesses: ${feedback.weaknesses.join(", ")}
Suggestions: ${feedback.suggestions.join(", ")}
Needs Revision: ${feedback.needsRevision ? "Yes" : "No"}
    `;

    session.history.push({
      iteration: session.iterationCount,
      stage: "critique",
      content: feedbackSummary,
      timestamp: new Date(),
    });

    session.iterationCount++;
    session.updatedAt = new Date();

    return `Critique Complete:\n${feedbackSummary}`;
  }

  private async executeFeedbackProcessing(
    session: SessionState
  ): Promise<string> {
    console.log(`[Session ${session.id}] Feedback processing phase started`);

    const lastCritique = session.history.findLast(
      (h) => h.stage === "critique"
    );
    const feedbackDecision = await this.feedbackAgent.processFeedback(
      session.currentArticle,
      lastCritique?.content || "No critique available",
      Math.floor(session.iterationCount / 4)
    );

    session.history.push({
      iteration: session.iterationCount,
      stage: "feedback",
      content: feedbackDecision.feedback,
      timestamp: new Date(),
    });

    if (!feedbackDecision.shouldContinue) {
      session.status = "completed";
      return `Feedback Loop Completed.\nReasoning: ${feedbackDecision.reasoning}`;
    }

    if (feedbackDecision.nextAgent === "writer") {
      const improvement = await this.writerAgent.improveArticle(
        session.currentArticle,
        feedbackDecision.feedback
      );
      session.currentArticle = improvement;
    }

    session.iterationCount++;
    session.updatedAt = new Date();

    return `Feedback Processed - Next Step: ${feedbackDecision.nextAgent}\nReasoning: ${feedbackDecision.reasoning}`;
  }

  endSession(sessionId: string): SessionState | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = "completed";
      session.updatedAt = new Date();
    }
    return session;
  }

  getSessions(): SessionState[] {
    return Array.from(this.sessions.values());
  }
}
```

---

## Continue to next section for frontend and styling files...
```
