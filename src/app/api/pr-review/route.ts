import { NextRequest } from 'next/server';
import { spawn } from 'child_process';
import { getGeminiExplanation } from '@/ai/genkit';
import * as fs from 'fs';
import * as path from 'path';

function runCommand(cmd: string, args: string[], cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { cwd, shell: true });
    let out = '';
    let err = '';
    proc.stdout.on('data', d => { out += d.toString(); });
    proc.stderr.on('data', d => { err += d.toString(); });
    proc.on('close', code => {
      if (code === 0) resolve(out.trim());
      else reject(new Error(err || `Command failed with code ${code}`));
    });
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { repoPath } = body;
  if (!repoPath) return Response.json({ error: 'Missing repoPath' }, { status: 400 });

  let resolvedRepoPath = repoPath;
  if (!resolvedRepoPath) {
    try {
      // @ts-ignore
      const vscode = require('vscode');
      resolvedRepoPath = vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath;
    } catch {}
  }
  if (!resolvedRepoPath) {
    return Response.json({ error: 'No workspace is open. Please open a folder in VS Code to use IntelliGit features.' }, { status: 400 });
  }
  if (!fs.existsSync(path.join(resolvedRepoPath, '.git'))) {
    return Response.json({ error: 'The selected folder is not a Git repository.' }, { status: 400 });
  }

  try {
    // Check for .git directory
    const fs = await import('fs/promises');
    const gitDir = repoPath.endsWith('/') ? repoPath + '.git' : repoPath + '/.git';
    try {
      await fs.access(gitDir);
    } catch {
      return Response.json({ error: 'Not a git repository (no .git found)' }, { status: 400 });
    }

    // Get PR diff (current branch vs main)
    const diff = await runCommand('git', ['diff', 'origin/main...HEAD'], repoPath);
    if (!diff.trim()) {
      return Response.json({ feedback: 'No changes to review (diff is empty).' });
    }

    // Compose prompt for Gemini
    const prompt = `Act like a senior developer reviewing a pull request. Highlight bugs, refactor opportunities, and security risks.\n\nHere is the diff:\n${diff}`;
    const aiResult = await getGeminiExplanation(prompt);
    // Use explanation as feedback (or suggestions if split)
    const feedback = aiResult.explanation || aiResult.suggestions || 'No feedback.';

    return Response.json({ feedback });
  } catch (e: any) {
    return Response.json({ error: e.message || 'Internal error' }, { status: 500 });
  }
}
