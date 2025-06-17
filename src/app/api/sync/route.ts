import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import * as fs from 'fs';

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    const { repoPath, branch } = await req.json();
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
    // Fetch and pull latest changes
    let fetchOut = '', fetchErr = '', pullOut = '', pullErr = '';
    try {
      const { stdout: fOut, stderr: fErr } = await execAsync('git fetch', { cwd: resolvedRepoPath });
      fetchOut = fOut; fetchErr = fErr;
      const { stdout: pOut, stderr: pErr } = await execAsync('git pull', { cwd: resolvedRepoPath });
      pullOut = pOut; pullErr = pErr;
      return NextResponse.json({ success: true, fetchOut, fetchErr, pullOut, pullErr });
    } catch (syncError: any) {
      return NextResponse.json({ success: false, message: syncError.message || 'Sync failed.' });
    }
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message || 'Failed to sync.' }, { status: 500 });
  }
}
