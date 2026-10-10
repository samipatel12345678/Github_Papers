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
    const lowerContent = content.toLowerCase();
    const shouldContinue =
      iterationCount < maxIterations &&
      lowerContent.includes("yes") &&
      !lowerContent.includes("should we continue the loop? no") &&
      !lowerContent.includes("continue: no") &&
      !lowerContent.includes("done");

    let nextAgent: "researcher" | "writer" | "done" = "done";
    if (shouldContinue) {
      if (
        lowerContent.includes("researcher") &&
        !lowerContent.includes("writer")
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
