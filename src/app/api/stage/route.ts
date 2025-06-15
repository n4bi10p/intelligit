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

export async function POST(req: NextRequest) {
  try {
    console.log('[GIT] Using CWD:', GIT_REPO_PATH);
    console.log('[GIT] .git exists:', GIT_EXISTS);
    console.log('[GIT] process.cwd():', process.cwd());
    // Check for unstaged changes
    const { stdout: status } = await execAsync('git status --porcelain', { cwd: GIT_REPO_PATH });
    console.log('[GIT] git status --porcelain:', status);
    if (!status.trim()) {
      return NextResponse.json({ success: false, message: 'No unstaged changes to stage.' }, { status: 200 });
    }
    const addResult = await execAsync('git add .', { cwd: GIT_REPO_PATH });
    console.log('[GIT] git add . result:', addResult);
    return NextResponse.json({ success: true, message: 'Changes staged.' });
  } catch (e: any) {
    console.error('[GIT] Stage API error:', e);
    return NextResponse.json({ success: false, message: e.message || 'Failed to stage changes.' }, { status: 500 });
  }
}
