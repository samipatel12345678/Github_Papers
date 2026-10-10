const fs = require("fs");
const path = require("path");

// Define project structure
const projectStructure = {
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
};

// Create directories and files
function setupProject() {
  const dirs = new Set();

  // Extract unique directories
  for (const filePath of Object.keys(projectStructure)) {
    const dir = path.dirname(filePath);
    if (dir !== ".") {
      dirs.add(dir);
    }
  }

  // Create directories
  for (const dir of dirs) {
    const fullPath = path.join(__dirname, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  }

  // Create files
  for (const [filePath, content] of Object.entries(projectStructure)) {
    const fullPath = path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) {
      fs.writeFileSync(fullPath, content);
      console.log(`Created file: ${filePath}`);
    } else {
      console.log(`File already exists: ${filePath}`);
    }
  }

  console.log("\n✅ Project structure setup complete!");
  console.log("\nNext steps:");
  console.log("1. npm install");
  console.log("2. Copy .env.example to .env and add your OPENAI_API_KEY");
  console.log("3. npm run dev");
}

setupProject();
