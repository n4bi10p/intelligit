import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, Part, Content } from "@google/generative-ai";

const MODEL_NAME = "gemini-1.5-flash-latest"; // Or your preferred Gemini model for refactoring
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

// This console.error should ideally be inside a function or handled differently
// if you want to prevent server startup on missing key, but for now, it's a warning.
if (!API_KEY) {
  console.error("GEMINI_API_KEY environment variable is not set for /api/refactor.");
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

interface RefactorRequestBody {
  provider: string; // e.g., "gemini"
  author: string;
  complexity: "low" | "medium" | "high";
  collaborators: string; // Comma-separated string
  goal: string;
  code: string;
}

export async function POST(req: NextRequest) {
  console.log("POST /api/refactor hit");

  if (!genAI) {
    return NextResponse.json(
      { error: "AI provider not configured for refactor. GEMINI_API_KEY is missing." },
      { status: 500 }
    );
  }

  try {
    const body = await req.json() as RefactorRequestBody;
    console.log("Refactor request body:", body);

    const { code, author, complexity, collaborators, goal, provider } = body;

    if (!code || !author || !complexity || !collaborators || !goal) {
      return NextResponse.json({ error: "Missing required fields for refactoring." }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const generationConfig = {
      temperature: 0.3,
      topK: 1,
      topP: 1,
      maxOutputTokens: 4096,
    };

    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ];

    const promptParts: Content[] = [
      { role: "user", parts: [{ text: `Refactor the following code to improve its structure and readability, without changing its functionality.` }] },
      { role: "user", parts: [{ text: `### Author: ${author}` }] },
      { role: "user", parts: [{ text: `### Complexity: ${complexity}` }] },
      { role: "user", parts: [{ text: `### Collaborators: ${collaborators}` }] },
      { role: "user", parts: [{ text: `### Goal: ${goal}` }] },
      { role: "user", parts: [{ text: `\`\`\`javascript\n${code}\n\`\`\`` }] },
      { role: "assistant", parts: [{ text: `### Suggested Refactor:` }] },
    ];

    const result = await model.generateContent({
        contents: promptParts,
        generationConfig,
        safetySettings,
    });

    console.log("Gemini response:", result);

    const suggestionText = result.response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    return NextResponse.json(
      {
        suggestion: suggestionText || "No suggestion generated.",
        rationale: "This is a detailed rationale for the suggestion.",
        priorityDeveloper: collaborators.split(',')[0]?.trim() || "Lead Developer",
        aiProviderName: provider || "gemini",
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error in /api/refactor:", error);
    let errorMessage = "Failed to process refactor request";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
