import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { FeedbackLoopOrchestrator } from "./FeedbackLoopOrchestrator";
import { ContentFormat } from "./WriterAgent";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5000;
const apiKey =
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  process.env.ANTHROPIC_API_KEY ||
  "";

if (!apiKey) {
  console.warn(
    "⚠️ Warning: Neither GEMINI_API_KEY, GOOGLE_API_KEY, nor ANTHROPIC_API_KEY is set. Please add your key to the .env file."
  );
}

const orchestrator = new FeedbackLoopOrchestrator(apiKey);

app.use(cors());
app.use(express.json());

app.post("/api/sessions", (req: Request, res: Response) => {
  try {
    const { topic, format, targetAudience, customInstructions } = req.body;

    if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
      return res
        .status(400)
        .json({ error: "Topic is required and must be a non-empty string" });
    }

    const validFormats: ContentFormat[] = ["blog", "paragraph", "report", "file"];
    const chosenFormat: ContentFormat = validFormats.includes(format) ? format : "blog";

    const sessionId = uuidv4();
    const session = orchestrator.createSession(
      sessionId,
      topic.trim(),
      chosenFormat,
      targetAudience || "General / Professional",
      customInstructions
    );

    res.status(201).json({
      success: true,
      sessionId: session.id,
      topic: session.topic,
      format: session.format,
      targetAudience: session.targetAudience,
      status: session.status,
    });
  } catch (error: any) {
    console.error("Error creating session:", error);
    res.status(500).json({ error: error.message || "Failed to create session" });
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
  } catch (error: any) {
    console.error("Error executing step:", error);
    res.status(500).json({ error: error.message || "Failed to execute step" });
  }
});

app.post("/api/sessions/:id/user-feedback", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;

    if (!feedback || typeof feedback !== "string" || feedback.trim().length === 0) {
      return res.status(400).json({ error: "Feedback instruction is required." });
    }

    const session = orchestrator.getSession(id);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const result = await orchestrator.applyUserFeedback(id, feedback.trim());
    const updatedSession = orchestrator.getSession(id);

    res.json({
      success: true,
      result,
      session: updatedSession,
    });
  } catch (error: any) {
    console.error("Error applying user feedback:", error);
    res.status(500).json({ error: error.message || "Failed to apply user feedback" });
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
  } catch (error: any) {
    console.error("Error fetching session:", error);
    res.status(500).json({ error: error.message || "Failed to fetch session" });
  }
});

app.get("/api/sessions", (_req: Request, res: Response) => {
  try {
    const sessions = orchestrator.getSessions();
    res.json({
      success: true,
      sessions,
      count: sessions.length,
    });
  } catch (error: any) {
    console.error("Error fetching sessions:", error);
    res.status(500).json({ error: error.message || "Failed to fetch sessions" });
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
  } catch (error: any) {
    console.error("Error ending session:", error);
    res.status(500).json({ error: error.message || "Failed to end session" });
  }
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log("Available endpoints:");
  console.log("  POST   /api/sessions - Create new session");
  console.log("  POST   /api/sessions/:id/step - Execute feedback loop step");
  console.log("  POST   /api/sessions/:id/user-feedback - Apply human-in-the-loop revision");
  console.log("  GET    /api/sessions/:id - Get session details");
  console.log("  GET    /api/sessions - Get all sessions");
  console.log("  DELETE /api/sessions/:id - End session");
  console.log("  GET    /health - Health check");
});

export default app;
