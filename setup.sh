#!/bin/bash

# Create directory structure
mkdir -p src
mkdir -p dist

# Create BaseAgent.ts
cat > src/BaseAgent.ts << 'EOF'
import Anthropic from "@anthropic-ai/sdk";

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
}
EOF

# Create ResearcherAgent.ts
cat > src/ResearcherAgent.ts << 'EOF'
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
EOF

echo "Project structure created successfully!"
