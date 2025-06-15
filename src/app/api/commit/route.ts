import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

interface CommitRequestBody {
  message: string;
  autoPush?: boolean;
  repoPath?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as CommitRequestBody;
    const { message, autoPush, repoPath } = body;
    if (!message || typeof message !== 'string' || message.trim().length < 5) {
      return NextResponse.json({ error: 'Commit message is too short.' }, { status: 400 });
    }
    if (!repoPath || !fs.existsSync(path.join(repoPath, '.git'))) {
      return NextResponse.json({ error: 'Invalid or missing repoPath' }, { status: 400 });
    }
    console.log('[GIT] Using repoPath:', repoPath);
    // Optionally trim to 72 chars for conventional commits
    const commitMsg = message.trim();
    // Split commit message into subject and body
    const [subject, ...bodyLines] = commitMsg.split(/\r?\n/);
    const commitArgs = [
      'commit',
      '-m', subject.trim(),
    ];
    if (bodyLines.length > 0) {
      commitArgs.push('-m', bodyLines.join('\n').trim());
    }
    // Stage all changes
    const addResult = await execAsync('git add .', { cwd: repoPath });
    console.log('[GIT] git add . result:', addResult);
    // Commit with subject and body
    const commitCmd = `git ${commitArgs.map(arg => JSON.stringify(arg)).join(' ')}`;
    const commitResult = await execAsync(commitCmd, { cwd: repoPath });
    console.log('[GIT] git commit result:', commitResult);

    let pushResult = null;
    if (autoPush) {
      // Get current branch
      const { stdout: branchStdout } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: repoPath });
      const branch = branchStdout.trim();
      console.log('[GIT] Current branch:', branch);
      // Check if remote exists
      const { stdout: remoteStdout } = await execAsync('git remote', { cwd: repoPath });
      const remotes = remoteStdout.trim().split('\n').filter(Boolean);
      console.log('[GIT] Remotes:', remotes);
      if (remotes.length === 0) {
        return NextResponse.json({ success: true, push: false, pushError: 'No git remote configured.' });
      }
      try {
        const { stdout: pushOut, stderr: pushErr } = await execAsync(`git push origin ${branch}`, { cwd: repoPath });
        console.log('[GIT] git push result:', { pushOut, pushErr });
        pushResult = { push: true, pushOut, pushErr };
      } catch (pushError: any) {
        console.error('[GIT] git push error:', pushError);
        return NextResponse.json({ success: true, push: false, pushError: pushError.message || 'Push failed.' });
      }
    }
    return NextResponse.json({ success: true, ...pushResult });
  } catch (e: any) {
    console.error('[GIT] Commit API error:', e);
    return NextResponse.json({ error: e.message || 'Failed to commit.' }, { status: 500 });
  }
}
