import type { NextApiRequest, NextApiResponse } from 'next';
import { spawn } from 'child_process';
import { getGeminiExplanation } from '@/ai/genkit'; // You may need to adjust this import

// Helper to run a shell command and return stdout
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { repoPath } = req.body;
  if (!repoPath) return res.status(400).json({ error: 'Missing repoPath' });

  try {
    // Check for .git directory
    const fs = await import('fs/promises');
    const gitDir = repoPath.endsWith('/') ? repoPath + '.git' : repoPath + '/.git';
    try {
      await fs.access(gitDir);
    } catch {
      return res.status(400).json({ error: 'Not a git repository (no .git found)' });
    }

    // Get git status and latest commit
    const [gitStatus, gitLog] = await Promise.all([
      runCommand('git', ['status', '--short', '--branch'], repoPath),
      runCommand('git', ['log', '-1', '--pretty=oneline'], repoPath),
    ]);

    // Compose prompt for Gemini
    const prompt = `Explain this git status to a developer and suggest next steps.\n\nGit status:\n${gitStatus}\n\nLatest commit:\n${gitLog}`;
    const aiResult = await getGeminiExplanation(prompt);
    // Expect aiResult to be { explanation: string, suggestions: string }

    res.status(200).json({
      gitStatus,
      gitLog,
      explanation: aiResult.explanation,
      suggestions: aiResult.suggestions,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Internal error' });
  }
}
