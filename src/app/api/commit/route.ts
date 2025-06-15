import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

function findGitRoot(startDir = process.cwd()) {
  let dir = startDir;
  while (dir !== path.parse(dir).root) {
    if (fs.existsSync(path.join(dir, '.git'))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  return null;
}

const GIT_REPO_PATH = findGitRoot() || process.cwd();
const GIT_EXISTS = fs.existsSync(path.join(GIT_REPO_PATH, '.git'));

interface CommitRequestBody {
  message: string;
  autoPush?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    console.log('[GIT] Using CWD:', GIT_REPO_PATH);
    console.log('[GIT] .git exists:', GIT_EXISTS);
    console.log('[GIT] process.cwd():', process.cwd());
    const body = await req.json() as CommitRequestBody;
    const { message, autoPush } = body;
    if (!message || typeof message !== 'string' || message.trim().length < 5) {
      return NextResponse.json({ error: 'Commit message is too short.' }, { status: 400 });
    }
    // Optionally trim to 72 chars for conventional commits
    const commitMsg = message.trim().slice(0, 72);
    // Stage all changes
    const addResult = await execAsync('git add .', { cwd: GIT_REPO_PATH });
    console.log('[GIT] git add . result:', addResult);
    // Commit
    const commitResult = await execAsync(`git commit -m ${JSON.stringify(commitMsg)}`, { cwd: GIT_REPO_PATH });
    console.log('[GIT] git commit result:', commitResult);

    let pushResult = null;
    if (autoPush) {
      // Get current branch
      const { stdout: branchStdout } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: GIT_REPO_PATH });
      const branch = branchStdout.trim();
      console.log('[GIT] Current branch:', branch);
      // Check if remote exists
      const { stdout: remoteStdout } = await execAsync('git remote', { cwd: GIT_REPO_PATH });
      const remotes = remoteStdout.trim().split('\n').filter(Boolean);
      console.log('[GIT] Remotes:', remotes);
      if (remotes.length === 0) {
        return NextResponse.json({ success: true, push: false, pushError: 'No git remote configured.' });
      }
      try {
        const { stdout: pushOut, stderr: pushErr } = await execAsync(`git push origin ${branch}`, { cwd: GIT_REPO_PATH });
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
