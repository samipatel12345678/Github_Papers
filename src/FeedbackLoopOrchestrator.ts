import fs from "fs";
import path from "path";
import { ResearcherAgent } from "./ResearcherAgent";
import { WriterAgent, ContentFormat } from "./WriterAgent";
import { CriticAgent, CriticFeedback } from "./CriticAgent";
import { FeedbackAgent, FeedbackDecision } from "./FeedbackAgent";

export interface SessionState {
  id: string;
  topic: string;
  format: ContentFormat;
  targetAudience?: string;
  customInstructions?: string;
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
  private dbFilePath: string;

  constructor(apiKey: string) {
    this.researcherAgent = new ResearcherAgent(apiKey);
    this.writerAgent = new WriterAgent(apiKey);
    this.criticAgent = new CriticAgent(apiKey);
    this.feedbackAgent = new FeedbackAgent(apiKey);

    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.dbFilePath = path.join(dataDir, "sessions.json");
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.dbFilePath)) {
        const raw = fs.readFileSync(this.dbFilePath, "utf-8");
        const data = JSON.parse(raw);
        if (Array.isArray(data)) {
          for (const s of data) {
            this.sessions.set(s.id, {
              ...s,
              format: s.format || "blog",
              createdAt: new Date(s.createdAt),
              updatedAt: new Date(s.updatedAt),
              history: s.history.map((h: any) => ({
                ...h,
                timestamp: new Date(h.timestamp),
              })),
            });
          }
        }
      }
    } catch (err) {
      console.warn("Could not load existing database file:", err);
    }
  }

  private saveToDisk(): void {
    try {
      const data = Array.from(this.sessions.values());
      fs.writeFileSync(this.dbFilePath, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {
      console.error("Failed to save database to disk:", err);
    }
  }

  createSession(
    sessionId: string,
    topic: string,
    format: ContentFormat = "blog",
    targetAudience: string = "General / Professional",
    customInstructions?: string
  ): SessionState {
    const session: SessionState = {
      id: sessionId,
      topic,
      format,
      targetAudience,
      customInstructions,
      currentArticle: "",
      research: "",
      iterationCount: 0,
      history: [],
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.sessions.set(sessionId, session);
    this.saveToDisk();
    return session;
  }

  getSession(sessionId: string): SessionState | undefined {
    return this.sessions.get(sessionId);
  }

  async executeStep(sessionId: string): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error("Session not found");
    if (session.status !== "active") throw new Error(`Session is ${session.status}`);

    const lastHistory = session.history.length > 0 ? session.history[session.history.length - 1] : null;

    let result = "";
    if (!lastHistory || session.history.length === 0) {
      result = await this.executeResearch(session);
    } else if (lastHistory.stage === "research") {
      result = await this.executeWriting(session);
    } else if (lastHistory.stage === "writing") {
      result = await this.executeCritique(session);
    } else if (lastHistory.stage === "critique") {
      result = await this.executeFeedbackProcessing(session);
    } else if (lastHistory.stage === "feedback") {
      result = await this.executeWriting(session);
    } else {
      result = await this.executeWriting(session);
    }

    this.saveToDisk();
    return result;
  }

  async applyUserFeedback(sessionId: string, userFeedback: string): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error("Session not found");

    console.log(`[Session ${session.id}] User-driven revision requested: "${userFeedback}"`);

    const improved = await this.writerAgent.improveArticle(
      session.currentArticle || session.research,
      `User Specific Revision Instructions:\n${userFeedback}`,
      session.format
    );

    session.currentArticle = improved;
    session.history.push({
      iteration: session.iterationCount,
      stage: "writing",
      content: `[User Iteration Request]: ${userFeedback}\n\n[Revised Draft]:\n${improved}`,
      timestamp: new Date(),
    });

    session.iterationCount++;
    session.updatedAt = new Date();
    this.saveToDisk();

    return `User Feedback Applied! Draft updated by Writer Agent.`;
  }

  private async executeResearch(session: SessionState): Promise<string> {
    console.log(`[Session ${session.id}] Research & Resource gathering started for '${session.topic}'`);
    const research = await this.researcherAgent.research(
      session.topic,
      session.format,
      session.customInstructions
    );

    session.research = research;
    session.history.push({
      iteration: session.iterationCount,
      stage: "research",
      content: research,
      timestamp: new Date(),
    });

    session.iterationCount++;
    session.updatedAt = new Date();

    return `Resource Gathering & Research Complete:\n\n${research}`;
  }

  private async executeWriting(session: SessionState): Promise<string> {
    console.log(`[Session ${session.id}] Writing phase (${session.format}) started`);
    const isInitialDraft = !session.currentArticle;
    const article = isInitialDraft
      ? await this.writerAgent.writeArticle(
          session.topic,
          session.research,
          session.format,
          session.targetAudience,
          session.customInstructions
        )
      : await this.writerAgent.writeArticle(
          session.topic,
          session.research || undefined,
          session.format,
          session.targetAudience,
          session.customInstructions
        );

    session.currentArticle = article;
    session.history.push({
      iteration: session.iterationCount,
      stage: "writing",
      content: article,
      timestamp: new Date(),
    });

    session.iterationCount++;
    session.updatedAt = new Date();

    return `${session.format.toUpperCase()} Draft Generated:\n\n${article}`;
  }

  private async executeCritique(session: SessionState): Promise<string> {
    console.log(`[Session ${session.id}] Critique phase started`);
    const feedback = await this.criticAgent.critique(
      session.currentArticle,
      session.format,
      session.targetAudience
    );

    const feedbackSummary = `Overall Rating: ${feedback.overallRating}/10\n\nStrengths:\n${feedback.strengths.map((s) => `• ${s}`).join("\n")}\n\nWeaknesses:\n${feedback.weaknesses.map((w) => `• ${w}`).join("\n")}\n\nSuggestions:\n${feedback.suggestions.map((s) => `• ${s}`).join("\n")}\n\nNeeds Revision: ${feedback.needsRevision ? "Yes" : "No"}`;

    session.history.push({
      iteration: session.iterationCount,
      stage: "critique",
      content: feedbackSummary,
      timestamp: new Date(),
    });

    session.iterationCount++;
    session.updatedAt = new Date();

    return `Critique Complete:\n\n${feedbackSummary}`;
  }

  private async executeFeedbackProcessing(
    session: SessionState
  ): Promise<string> {
    console.log(`[Session ${session.id}] Feedback processing phase started`);

    const lastCritique = [...session.history].reverse().find((h) => h.stage === "critique");
    const feedbackRound = session.history.filter((h) => h.stage === "feedback").length;

    const feedbackDecision = await this.feedbackAgent.processFeedback(
      session.currentArticle,
      lastCritique?.content || "No critique available",
      feedbackRound
    );

    session.history.push({
      iteration: session.iterationCount,
      stage: "feedback",
      content: feedbackDecision.feedback,
      timestamp: new Date(),
    });

    if (!feedbackDecision.shouldContinue || feedbackRound >= this.maxIterations - 1) {
      session.status = "completed";
      session.updatedAt = new Date();
      return `Feedback Loop Completed.\n\nDecision: Final ${session.format} approved.\nReasoning: ${feedbackDecision.reasoning}`;
    }

    if (feedbackDecision.nextAgent === "writer") {
      const improvement = await this.writerAgent.improveArticle(
        session.currentArticle,
        feedbackDecision.feedback,
        session.format
      );
      session.currentArticle = improvement;
      session.history.push({
        iteration: session.iterationCount + 1,
        stage: "writing",
        content: improvement,
        timestamp: new Date(),
      });
      session.iterationCount += 2;
      session.updatedAt = new Date();
      return `Feedback Processed:\n\n${session.format.toUpperCase()} revised by Writer Agent based on critique.\nReasoning: ${feedbackDecision.reasoning}`;
    }

    session.iterationCount++;
    session.updatedAt = new Date();

    return `Feedback Processed - Next Step: ${feedbackDecision.nextAgent}\n\nReasoning: ${feedbackDecision.reasoning}`;
  }

  endSession(sessionId: string): SessionState | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = "completed";
      session.updatedAt = new Date();
      this.saveToDisk();
    }
    return session;
  }

  getSessions(): SessionState[] {
    return Array.from(this.sessions.values());
  }
}
