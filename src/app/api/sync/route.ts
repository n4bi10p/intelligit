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
    // Fetch and pull latest changes
    let fetchOut = '', fetchErr = '', pullOut = '', pullErr = '';
    try {
      const { stdout: fOut, stderr: fErr } = await execAsync('git fetch', { cwd: repoPath });
      fetchOut = fOut; fetchErr = fErr;
      const { stdout: pOut, stderr: pErr } = await execAsync('git pull', { cwd: repoPath });
      pullOut = pOut; pullErr = pErr;
      return NextResponse.json({ success: true, fetchOut, fetchErr, pullOut, pullErr });
    } catch (syncError: any) {
      return NextResponse.json({ success: false, message: syncError.message || 'Sync failed.' });
    }
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message || 'Failed to sync.' }, { status: 500 });
  }
}
