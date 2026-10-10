#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const files = {
  "src/BaseAgent.ts": `import Anthropic from "@anthropic-ai/sdk";

export interface AgentMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AgentResponse {
  content: string;
  messageHistory: AgentMessage[];
}

export abstract class BaseAgent {
  protected client: Anthropic;
  protected model: string = "claude-3-5-sonnet-20241022";
  protected messageHistory: AgentMessage[] = [];
  protected systemPrompt: string;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
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

    const assistantMessage =
      response.content[0].type === "text" ? response.content[0].text : "";

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
}`,

  "src/ResearcherAgent.ts": `import { BaseAgent } from "./BaseAgent";

export class ResearcherAgent extends BaseAgent {
  protected getSystemPrompt(): string {
    return \`You are a Research Agent. Your role is to:
1. Gather comprehensive research on a given topic
2. Find key facts, statistics, and insights
3. Identify gaps in knowledge
4. Provide well-structured research notes
5. Cite sources when possible

Focus on being thorough, factual, and objective. Structure your research with clear sections and bullet points.\`;
  }

  async research(topic: string): Promise<string> {
    const response = await this.chat(
      \`Please conduct comprehensive research on the following topic and provide detailed findings:\\n\\nTopic: \${topic}\`
    );
    return response.content;
  }
}`,

  "src/WriterAgent.ts": `import { BaseAgent } from "./BaseAgent";

export class WriterAgent extends BaseAgent {
  protected getSystemPrompt(): string {
    return \`You are a Professional Writer Agent. Your role is to:
1. Create engaging, well-structured articles and blog posts
2. Incorporate research and facts seamlessly
3. Write in an accessible, engaging tone
4. Use proper formatting with headers, subheaders, and lists
5. Ensure logical flow and coherent arguments
6. Make content suitable for target audience

Write high-quality content that is informative, engaging, and professional.\`;
  }

  async writeArticle(
    topic: string,
    researchNotes?: string
  ): Promise<string> {
    const prompt = researchNotes
      ? \`Please write a comprehensive article based on the following research:\\n\\n\${researchNotes}\\n\\nTopic: \${topic}\`
      : \`Please write a comprehensive article on the following topic:\\n\\nTopic: \${topic}\`;

    const response = await this.chat(prompt);
    return response.content;
  }

  async improveArticle(article: string, feedback: string): Promise<string> {
    const prompt = \`Please improve the following article based on this feedback:\\n\\nFeedback: \${feedback}\\n\\nOriginal Article:\\n\${article}\`;
    const response = await this.chat(prompt);
    return response.content;
  }
}`,

  "src/CriticAgent.ts": `import { BaseAgent } from "./BaseAgent";

export interface CriticFeedback {
  overallRating: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  needsRevision: boolean;
}

export class CriticAgent extends BaseAgent {
  protected getSystemPrompt(): string {
    return \`You are a Critical Review Agent. Your role is to:
1. Critically analyze written content for quality, accuracy, and clarity
2. Identify strengths and weaknesses
3. Provide constructive feedback for improvement
4. Check for factual accuracy, grammar, and style
5. Suggest specific improvements
6. Rate content quality (1-10)
7. Determine if revision is needed

Be thorough but fair. Provide actionable feedback that helps improve the content.\`;
  }

  async critique(article: string): Promise<CriticFeedback> {
    const prompt = \`Please provide a detailed critical review of the following article:

Article:
\${article}

Provide your feedback in the following structure:
1. Overall Rating (1-10)
2. Strengths (list 3-5 key strengths)
3. Weaknesses (list 3-5 key areas for improvement)
4. Specific Suggestions (list 4-6 actionable improvements)
5. Does this need revision? (Yes/No)\`;

    const response = await this.chat(prompt);
    return this.parseCriticResponse(response.content);
  }

  private parseCriticResponse(content: string): CriticFeedback {
    const ratingMatch = content.match(/Overall Rating[:\\s]+(\\d+)/i);
    const rating = ratingMatch ? parseInt(ratingMatch[1]) : 5;

    const strengths = this.extractList(
      content,
      /Strengths:?([\\s\\S]*?)(?:Weaknesses|$)/i
    );
    const weaknesses = this.extractList(
      content,
      /Weaknesses:?([\\s\\S]*?)(?:Suggestions|$)/i
    );
    const suggestions = this.extractList(
      content,
      /Suggestions:?([\\s\\S]*?)(?:Does|$)/i
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
      .split(/\\n/g)
      .filter((line) => line.trim().length > 0)
      .map((line) => line.replace(/^[-•*]\\s+/, "").trim())
      .filter((line) => line.length > 0);
  }
}`,

  "src/FeedbackAgent.ts": `import { BaseAgent } from "./BaseAgent";

export interface FeedbackDecision {
  shouldContinue: boolean;
  nextAgent: "researcher" | "writer" | "done";
  reasoning: string;
  feedback: string;
}

export class FeedbackAgent extends BaseAgent {
  protected getSystemPrompt(): string {
    return \`You are a Feedback Processing Agent. Your role is to:
1. Analyze critic feedback and article status
2. Determine if the feedback loop should continue
3. Decide whether to send feedback back to Researcher or Writer
4. Summarize key feedback points
5. Provide reasoning for the decision

Be decisive and clear about next steps. Consider iteration limits to avoid infinite loops.\`;
  }

  async processFeedback(
    article: string,
    criticFeedback: string,
    iterationCount: number
  ): Promise<FeedbackDecision> {
    const maxIterations = 3;

    const prompt = \`Please analyze the following article and critic feedback, then decide the next step:

Article:
\${article}

Critic Feedback:
\${criticFeedback}

Iteration Count: \${iterationCount}/\${maxIterations}

Based on the feedback:
1. Should we continue the loop? (Yes/No)
2. If yes, should the feedback go to Researcher or Writer?
3. What is your reasoning?
4. Summarize the key feedback to pass forward.

Consider:
- Quality improvements needed
- Whether more research is required
- Whether the iteration limit (\${maxIterations}) has been reached
- If the article quality is sufficient\`;

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
      content.toLowerCase().includes("yes") &&
      !content.toLowerCase().includes("no") &&
      !content.toLowerCase().includes("done");

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
}`,

  "src/App.css": `* {
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
}`,
};

function createFiles() {
  const dirs = new Set();

  // Extract directories
  for (const filePath of Object.keys(files)) {
    const dir = path.dirname(filePath);
    if (dir !== ".") {
      dirs.add(dir);
    }
  }

  // Create directories
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✓ Created directory: ${dir}`);
    }
  }

  // Create files
  let created = 0;
  for (const [filePath, content] of Object.entries(files)) {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, content);
      console.log(`✓ Created file: ${filePath}`);
      created++;
    } else {
      console.log(`✗ File already exists: ${filePath}`);
    }
  }

  console.log(`\n✅ Done! Created ${created} files.`);
  console.log("\nNext steps:");
  console.log("1. npm install");
  console.log("2. Update .env with ANTHROPIC_API_KEY");
  console.log("3. npm run dev");
}

createFiles();
