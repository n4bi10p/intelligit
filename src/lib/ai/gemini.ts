// lib/ai/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { CollaborativeRefactorInput, CollaborativeRefactorOutput } from "@/ai/flows/collaborative-refactoring";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function geminiRefactor(input: CollaborativeRefactorInput): Promise<CollaborativeRefactorOutput> {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `
You are an expert developer. Given the following:
- Code Snippet: ${input.codeSnippet}
- Original Author: ${input.originalAuthor}
- Code Complexity: ${input.codeComplexity}
- Collaborators: ${input.currentCollaborators.join(", ")}
- Goal: ${input.refactoringGoal}

Respond with:
1. Refactoring suggestion.
2. Rationale.
3. Who should be consulted first (priority developer).
  `;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  return {
    suggestion: text,
    rationale: "Generated rationale (can be parsed from text if needed)",
    priorityDeveloper: input.originalAuthor,
    aiProviderName: "Gemini"
  };
}

export interface CollaborativeRefactorOutput {
  suggestion: string;
  rationale: string;
  priorityDeveloper: string;
  aiProviderName: string;
}
