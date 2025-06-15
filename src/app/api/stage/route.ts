import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    const { repoPath } = await req.json();
    if (!repoPath || !fs.existsSync(path.join(repoPath, '.git'))) {
      return NextResponse.json({ success: false, message: 'Invalid or missing repoPath' }, { status: 400 });
    }
    console.log('[GIT] Using repoPath:', repoPath);
    // Check for unstaged changes
    const { stdout: status } = await execAsync('git status --porcelain', { cwd: repoPath });
    console.log('[GIT] git status --porcelain:', status);
    if (!status.trim()) {
      return NextResponse.json({ success: false, message: 'No unstaged changes to stage.' }, { status: 200 });
    }
    const addResult = await execAsync('git add .', { cwd: repoPath });
    console.log('[GIT] git add . result:', addResult);
    return NextResponse.json({ success: true, message: 'Changes staged.' });
  } catch (e: any) {
    console.error('[GIT] Stage API error:', e);
    return NextResponse.json({ success: false, message: e.message || 'Failed to stage changes.' }, { status: 500 });
  }
}
