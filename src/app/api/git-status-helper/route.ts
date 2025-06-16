import { NextRequest } from 'next/server';
import { spawn } from 'child_process';
import { getGeminiExplanation } from '@/ai/genkit';

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

  try {
    // Check for .git directory
    const fs = await import('fs/promises');
    const gitDir = repoPath.endsWith('/') ? repoPath + '.git' : repoPath + '/.git';
    try {
      await fs.access(gitDir);
    } catch {
      return Response.json({ error: 'Not a git repository (no .git found)' }, { status: 400 });
    }

    // Get git status and latest commit
    const [gitStatus, gitLog] = await Promise.all([
      runCommand('git', ['status', '--short', '--branch'], repoPath),
      runCommand('git', ['log', '-1', '--pretty=oneline'], repoPath),
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
