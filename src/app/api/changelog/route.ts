import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import path from 'path';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

async function getGeminiSummary(markdown: string): Promise<string> {
  if (!GEMINI_API_KEY) return 'Gemini API key not set.';
  try {
    console.log('[Gemini] Sending request to Gemini API...');
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=' + GEMINI_API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Summarize this changelog in 2-3 or 4-5 sentences for a release note:\n\n${markdown}` }] }]
      })
    });
    const data = await res.json();
    console.log('[Gemini] Raw response:', JSON.stringify(data, null, 2));
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      console.log('[Gemini] Summary:', data.candidates[0].content.parts[0].text);
      return data.candidates[0].content.parts[0].text;
    }
    console.warn('[Gemini] No summary returned from Gemini.');
    return 'No summary returned from Gemini.';
  } catch (e: any) {
    console.error('[Gemini] Gemini summary error:', e);
    return 'Gemini summary error: ' + (e.message || e.toString());
  }
}

// Helper to group commits by type
function groupCommits(commits: string[]): Record<string, string[]> {
  const sections: Record<string, string[]> = {
    Features: [],
    Fixes: [],
    Chores: [],
    Docs: [],
    Refactors: [],
    Others: [],
  };
  for (const msg of commits) {
    if (msg.startsWith('feat:')) sections.Features.push(msg.replace(/^feat:\s*/, ''));
    else if (msg.startsWith('fix:')) sections.Fixes.push(msg.replace(/^fix:\s*/, ''));
    else if (msg.startsWith('chore:')) sections.Chores.push(msg.replace(/^chore:\s*/, ''));
    else if (msg.startsWith('docs:')) sections.Docs.push(msg.replace(/^docs:\s*/, ''));
    else if (msg.startsWith('refactor:')) sections.Refactors.push(msg.replace(/^refactor:\s*/, ''));
    else sections.Others.push(msg);
  }
  return sections;
}

export async function GET(req: NextRequest) {
  try {
    // Get repoPath from query param, fallback to process.cwd()
    const { searchParams } = new URL(req.url);
    const repoPath = searchParams.get('repoPath') || process.cwd();

    // Get last 20 commit messages (excluding merges)
    const log = execSync('git log --pretty=format:"%s" --no-merges -n 20', { cwd: repoPath })
      .toString()
      .replace(/"/g, '');
    const commits = log.split('\n').map(line => line.trim()).filter(Boolean);
    const sections = groupCommits(commits);

    // Format as markdown
    let md = `## vX.Y.Z\n`;
    for (const [section, items] of Object.entries(sections)) {
      if (items.length) {
        md += `\n### ${section}\n`;
        items.forEach(item => (md += `- ${item}\n`));
      }
    }

    // --- Gemini AI-enhanced summary ---
    let aiSummary = '';
    try {
      aiSummary = await getGeminiSummary(md);
    } catch (aiErr) {
      aiSummary = 'AI summary unavailable.';
    }

    return NextResponse.json({ markdown: md.trim(), aiSummary });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to generate changelog', details: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { markdown, repoPath } = await req.json();
    if (!markdown || !repoPath) {
      return NextResponse.json({ error: 'Missing markdown or repoPath' }, { status: 400 });
    }
    const changelogPath = path.join(repoPath, 'CHANGELOG.md');
    writeFileSync(changelogPath, markdown, 'utf8');
    return NextResponse.json({ success: true, path: changelogPath });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to save CHANGELOG.md', details: err.message }, { status: 500 });
  }
}
