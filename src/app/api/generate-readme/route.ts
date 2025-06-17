import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import * as fs from 'fs';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

// Helper to detect languages from file extensions
function detectLanguages(dir: string): string[] {
  const exts = new Set<string>();
  function walk(current: string) {
    const entries = require('fs').readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && !['node_modules', '.git', 'dist', 'build', '.next', 'out'].includes(entry.name)) {
        walk(path.join(current, entry.name));
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (ext) exts.add(ext);
      }
    }
  }
  walk(dir);
  // Map extensions to languages
  const extToLang: Record<string, string> = {
    '.js': 'JavaScript', '.ts': 'TypeScript', '.tsx': 'TypeScript/React', '.jsx': 'JavaScript/React',
    '.py': 'Python', '.java': 'Java', '.rb': 'Ruby', '.go': 'Go', '.php': 'PHP', '.cs': 'C#', '.cpp': 'C++', '.c': 'C',
    '.rs': 'Rust', '.kt': 'Kotlin', '.swift': 'Swift', '.m': 'Objective-C', '.scala': 'Scala', '.sh': 'Shell',
    '.json': 'JSON', '.yml': 'YAML', '.yaml': 'YAML', '.md': 'Markdown', '.html': 'HTML', '.css': 'CSS',
  };
  const langs = Array.from(exts).map(e => extToLang[e] || e.replace(/^\./, '').toUpperCase());
  return Array.from(new Set(langs));
}

async function getGeminiReadme(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) return 'Gemini API key not set.';
  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=' + GEMINI_API_KEY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });
  const data = await res.json();
  if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
    return data.candidates[0].content.parts[0].text;
  }
  return 'No README generated.';
}

export async function POST(req: NextRequest) {
  try {
    const { userDescription, repoPath } = await req.json();
    const root = repoPath || (() => {
      try {
        // @ts-ignore
        const vscode = require('vscode');
        return vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath;
      } catch {
        return undefined;
      }
    })();
    if (!root) {
      return NextResponse.json({ error: 'No workspace is open. Please open a folder in VS Code to use IntelliGit features.' }, { status: 400 });
    }
    if (!fs.existsSync(path.join(root, '.git'))) {
      return NextResponse.json({ error: 'The selected folder is not a Git repository.' }, { status: 400 });
    }
    // Read package.json
    let pkg = {};
    try {
      pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
    } catch {}
    const name = (pkg as any).name || path.basename(root);
    const description = (pkg as any).description || '';
    // Detect languages
    const languages = detectLanguages(root);
    // Try to guess tech stack
    let techStack = languages.join(', ');
    if ((pkg as any).dependencies) {
      techStack += ', ' + Object.keys((pkg as any).dependencies).join(', ');
    }
    // Compose prompt
    const prompt = `Generate a professional markdown README for a project with the following info:\n\n` +
      `Project name: ${name}\n` +
      `Description: ${description}\n` +
      (userDescription ? `User description: ${userDescription}\n` : '') +
      `Tech stack: ${techStack}\n` +
      `Languages: ${languages.join(', ')}\n` +
      `GitHub repo link: (guess from context if possible)\n` +
      `Include sections for Installation, CLI usage if relevant, and any badges or shields.\n`;
    // Call Gemini
    const markdown = await getGeminiReadme(prompt);
    return NextResponse.json({ markdown });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to generate README', message: 'An error occurred while generating the README. Please try again later.' }, { status: 500 });
  }
}

// Optional: handle saving README.md
export async function PUT(req: NextRequest) {
  try {
    const { markdown, repoPath } = await req.json();
    if (!markdown || !repoPath) {
      return NextResponse.json({ error: 'Missing markdown or repoPath' }, { status: 400 });
    }
    const readmePath = path.join(repoPath, 'README.md');
    writeFileSync(readmePath, markdown, 'utf8');
    return NextResponse.json({ success: true, path: readmePath });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to save README.md', message: 'Could not save README.md. Please check your permissions and try again.' }, { status: 500 });
  }
}
