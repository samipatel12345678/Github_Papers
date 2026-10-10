import { BaseAgent } from "./BaseAgent";

export interface CriticFeedback {
  overallRating: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  needsRevision: boolean;
}

export class CriticAgent extends BaseAgent {
  protected getSystemPrompt(): string {
    return `You are a Senior Editor and Critical Review Agent. Your role is to:
1. Critically evaluate content against quality standards and specific format criteria (Blog, Paragraph, Report, File).
2. Check for factual rigor, clarity, flow, tone suitability, and resource integration.
3. Identify 3-5 concrete strengths and 3-5 specific areas for improvement.
4. Give actionable, precise suggestions to elevate the content to a 10/10 level.
5. Rate content on a scale of 1-10 and state definitively whether revision is needed.`;
  }

  async critique(
    content: string,
    format: string = "blog",
    targetAudience: string = "General"
  ): Promise<CriticFeedback> {
    const prompt = `Please provide an editorial critique of the following ${format} written for ${targetAudience}:

Draft Content:
${content}

Target Format: ${format}

Provide your feedback in this exact structure:
1. Overall Rating (1-10)
2. Strengths (list 3-5 key strengths)
3. Weaknesses (list 3-5 key areas for improvement)
4. Specific Suggestions (list 3-5 actionable improvements)
5. Does this need revision? (Yes/No)`;

    const response = await this.chat(prompt);
    return this.parseCriticResponse(response.content);
  }

  private parseCriticResponse(content: string): CriticFeedback {
    const ratingMatch = content.match(/Overall Rating[:\s]+(\d+)/i);
    const rating = ratingMatch ? parseInt(ratingMatch[1], 10) : 5;

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
      (content.toLowerCase().includes("needs revision") &&
        content.toLowerCase().includes("yes")) ||
      content.toLowerCase().includes("revision: yes");

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
      .map((line) => line.replace(/^[-•*\d.]+\s+/, "").trim())
      .filter((line) => line.length > 0);
  }
}
