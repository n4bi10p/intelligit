import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fetch from 'node-fetch';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    const { repoPath, title, body, reviewers, githubToken } = await req.json();
    if (!repoPath || !title) {
      return NextResponse.json({ error: 'Missing repoPath or title' }, { status: 400 });
    }
    // Use githubToken from request body if provided, else fallback to env var
    const token = githubToken || process.env.GITHUB_TOKEN;
    if (!token) {
      return NextResponse.json({ error: 'Missing GitHub token' }, { status: 500 });
    }
    // Debug logging for repoPath and remote URL
    console.log('[PR API] repoPath:', repoPath);
    const { stdout: remoteUrl } = await execAsync('git config --get remote.origin.url', { cwd: repoPath });
    console.log('[PR API] remote.origin.url:', remoteUrl);
    // Debug logging for GitHub token
    console.log('[PR API] githubToken:', token);
    // Use improved regex to match both / and : separators and .git ending
    const match = remoteUrl.match(/github.com[:/](.+)\.git/);
    if (!match) {
      console.error('[PR API] Invalid remote URL or not a GitHub repo:', remoteUrl);
      return NextResponse.json({ error: 'Not a GitHub repo or invalid remote URL', remoteUrl, repoPath }, { status: 400 });
    }
    const repoFullName = match[1]; // e.g. user/repo
    // Get current branch
    const { stdout: branchStdout } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: repoPath });
    const branch = branchStdout.trim();
    // Create PR via GitHub API
    const prRes = await fetch(`https://api.github.com/repos/${repoFullName}/pulls`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        body,
        head: branch,
        base: 'main', // or detect default branch
      }),
    });
    const prData: any = await prRes.json();
    // Debug log PR API response from GitHub
    console.log('[PR API] GitHub PR API response:', prData);
    if (!prRes.ok) {
      return NextResponse.json({ error: prData.message || 'Failed to create PR', githubApiResponse: prData }, { status: 500 });
    }
    // Optionally assign reviewers
    if (reviewers && reviewers.length > 0) {
      await fetch(`https://api.github.com/repos/${repoFullName}/pulls/${prData.number}/requested_reviewers`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reviewers }),
      });
    }
    return NextResponse.json({ url: prData.html_url, number: prData.number, success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to create PR' }, { status: 500 });
  }
}
