import { BaseAgent } from "./BaseAgent";

export class ResearcherAgent extends BaseAgent {
  protected getSystemPrompt(): string {
    return `You are a Senior Research & Intelligence Agent. Your role is to:
1. Conduct deep, multi-dimensional research on the given topic.
2. Fetch and curate authoritative resources, research papers, industry standards, and reference materials.
3. Identify verified statistics, empirical data, and real-world case studies.
4. Highlight key definitions, technical pillars, and current debates.
5. Provide structured, actionable research notes with a dedicated "Curated Resources & Citations" section.

Format your response clearly with:
- 📌 Executive Topic Summary
- 📊 Key Statistics & Verified Data
- 🌐 Curated Resources & Reference Material (Include relevant authoritative sources, websites, or academic bodies)
- 💡 Core Themes & Insights
- ⚠️ Potential Pitfalls / Knowledge Gaps

Ensure the output is rich, accurate, and ready for a writer to base high-quality content on.`;
  }

  async research(topic: string, format?: string, customInstructions?: string): Promise<string> {
    const prompt = `Please conduct comprehensive research and resource curation on the following topic:

Topic: ${topic}
Target Content Format: ${format || "general"}
${customInstructions ? `Special Instructions: ${customInstructions}` : ""}

Provide deep insights, verified statistics, and a curated list of top resources and reference materials before writing begins.`;

    const response = await this.chat(prompt);
    return response.content;
  }
}
