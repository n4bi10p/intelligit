import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL_NAME = "gemini-1.5-flash-latest";
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error("GEMINI_API_KEY environment variable is not set for /api/commit-summary.");
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

interface CommitSummaryRequestBody {
  diff: string;
}

export async function POST(req: NextRequest) {
  if (!genAI) {
    return NextResponse.json(
      { error: "AI provider not configured for commit summary. GEMINI_API_KEY is missing." },
      { status: 500 }
    );
  }

  try {
    const body = await req.json() as CommitSummaryRequestBody;
    const { diff } = body;
    if (!diff || typeof diff !== 'string' || diff.length < 10) {
      return NextResponse.json({ error: "A valid git diff is required." }, { status: 400 });
    }

    // Prompt for Gemini
    const prompt = `You are an expert software engineer. Given the following git diff, write a concise, conventional commit message that summarizes the change.\n\nDiff:\n${diff}`;

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text().trim();

    return NextResponse.json({ summary });
  } catch (e: any) {
    console.error("Error in /api/commit-summary:", e);
    return NextResponse.json({ error: e.message || "Failed to generate commit summary." }, { status: 500 });
  }
}
