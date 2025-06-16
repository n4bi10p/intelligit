import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    const { repoPath, branch } = await req.json();
    if (!repoPath || !fs.existsSync(path.join(repoPath, '.git'))) {
      return NextResponse.json({ success: false, message: 'Invalid or missing repoPath' }, { status: 400 });
    }
    // Get current branch if not provided
    let branchName = branch;
    if (!branchName) {
      const { stdout: branchStdout } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: repoPath });
      branchName = branchStdout.trim();
    }
    // Check if remote exists
    const { stdout: remoteStdout } = await execAsync('git remote', { cwd: repoPath });
    const remotes = remoteStdout.trim().split('\n').filter(Boolean);
    if (remotes.length === 0) {
      return NextResponse.json({ success: false, message: 'No git remote configured.' });
    }
    // Push changes
    try {
      const { stdout: pushOut, stderr: pushErr } = await execAsync(`git push origin ${branchName}`, { cwd: repoPath });
      const alreadyUpToDate = /Everything up[- ]to[- ]date|Already up[- ]to[- ]date/i.test(pushOut + pushErr);
      return NextResponse.json({ success: true, pushOut, pushErr, alreadyUpToDate });
    } catch (pushError: any) {
      // Even on error, check if it's just up to date
      const errMsg = pushError.stdout + pushError.stderr;
      const alreadyUpToDate = /Everything up[- ]to[- ]date|Already up[- ]to[- ]date/i.test(errMsg);
      if (alreadyUpToDate) {
        return NextResponse.json({ success: true, pushOut: errMsg, alreadyUpToDate: true });
      }
      return NextResponse.json({ success: false, message: pushError.message || 'Push failed.' });
    }
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message || 'Failed to push.' }, { status: 500 });
  }
}
