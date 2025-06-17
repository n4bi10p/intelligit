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
    // Get git status and latest commit
    const [gitStatus, gitLog] = await Promise.all([
      runCommand('git', ['status', '--short', '--branch'], resolvedRepoPath),
      runCommand('git', ['log', '-1', '--pretty=oneline'], resolvedRepoPath),
    ]);

    // Compose prompt for Gemini
    const prompt = `Explain this git status to a developer and suggest next steps.\n\nGit status:\n${gitStatus}\n\nLatest commit:\n${gitLog}`;
    const aiResult = await getGeminiExplanation(prompt);

    return Response.json({
      gitStatus,
      gitLog,
      explanation: aiResult.explanation,
      suggestions: aiResult.suggestions,
    });
  } catch (e: any) {
    return Response.json({ error: e.message || 'Internal error' }, { status: 500 });
  }
}
