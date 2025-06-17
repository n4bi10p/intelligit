import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import * as fs from 'fs';

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    const { repoPath } = await req.json();
    let resolvedRepoPath = repoPath;
    if (!resolvedRepoPath) {
      try {
        // @ts-ignore
        const vscode = require('vscode');
        resolvedRepoPath = vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath;
      } catch {}
    }
    if (!resolvedRepoPath) {
      return NextResponse.json({ success: false, message: 'No workspace is open. Please open a folder in VS Code to use IntelliGit features.' }, { status: 400 });
    }
    if (!fs.existsSync(path.join(resolvedRepoPath, '.git'))) {
      return NextResponse.json({ success: false, message: 'The selected folder is not a Git repository.' }, { status: 400 });
    }
    console.log('[GIT] Using repoPath:', resolvedRepoPath);
    // Check for unstaged changes
    const { stdout: status } = await execAsync('git status --porcelain', { cwd: resolvedRepoPath });
    console.log('[GIT] git status --porcelain:', status);
    if (!status.trim()) {
      return NextResponse.json({ success: false, message: 'No unstaged changes to stage.' }, { status: 200 });
    }
    const addResult = await execAsync('git add .', { cwd: resolvedRepoPath });
    console.log('[GIT] git add . result:', addResult);
    return NextResponse.json({ success: true, message: 'Changes staged.' });
  } catch (e: any) {
    console.error('[GIT] Stage API error:', e);
    return NextResponse.json({ success: false, message: e.message || 'Failed to stage changes.' }, { status: 500 });
  }
}
