import { BaseAgent } from "./BaseAgent";

export type ContentFormat = "blog" | "paragraph" | "report" | "file";

export class WriterAgent extends BaseAgent {
  protected getSystemPrompt(): string {
    return `You are a World-Class Professional Writer Agent. Your role is to:
1. Synthesize curated research and resources into exceptional content.
2. Adhere strictly to the requested format (Blog Post, Focused Paragraph, In-Depth Report, or Exportable File/Document).
3. Naturally weave verified data, statistics, and authoritative references into the narrative.
4. Maintain logical flow, flawless grammar, compelling tone, and appropriate formatting (headings, bullet points, callouts).
5. Ensure the content directly addresses the target audience.`;
  }

  async writeArticle(
    topic: string,
    researchNotes?: string,
    format: ContentFormat = "blog",
    targetAudience: string = "General / Professional",
    customInstructions?: string
  ): Promise<string> {
    const formatGuidelines = this.getFormatGuidelines(format);

    const prompt = `Please compose content on the following topic adhering to the specified format and guidelines:

Topic: ${topic}
Format: ${format.toUpperCase()} (${formatGuidelines})
Target Audience: ${targetAudience}
${customInstructions ? `Special User Requirements: ${customInstructions}\n` : ""}
${
  researchNotes
    ? `Curated Research & Resources to incorporate:\n${researchNotes}\n`
    : ""
}

Write exceptional content following the ${format} style guidelines.`;

    const response = await this.chat(prompt);
    return response.content;
  }

  async improveArticle(
    article: string,
    feedback: string,
    format: ContentFormat = "blog"
  ): Promise<string> {
    const prompt = `Please refine and improve the following ${format} based on this editorial critique:

Editorial Critique:
${feedback}

Original Draft:
${article}

Please provide the complete, improved revision incorporating all the feedback while preserving the ${format} format.`;

    const response = await this.chat(prompt);
    return response.content;
  }

  private getFormatGuidelines(format: ContentFormat): string {
    switch (format) {
      case "paragraph":
        return "Write exactly ONE powerful, cohesive, high-impact paragraph (120-200 words) summarizing key points and verified insights concisely without unnecessary fluff.";
      case "blog":
        return "Write an engaging, SEO-optimized blog post with a catchy title, compelling hook, structured subheadings (H2, H3), key takeaways bulleted, and an inspiring conclusion with a call to action.";
      case "report":
        return "Write a formal, comprehensive analytical report with Title, Executive Summary, Background & Research Findings, Data Analysis & Insights, Risk/Challenge Assessment, and Strategic Actionable Recommendations.";
      case "file":
        return "Write a complete, structured export-ready document/markdown file including Document Header (Title, Date, Version), Table of Contents, Detailed Core Content sections, Resource References table, and Appendices.";
      default:
        return "Write a comprehensive, engaging, well-structured article with clear headers and bullet points.";
    }
  }
}
