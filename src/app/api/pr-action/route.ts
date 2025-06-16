import { NextRequest } from 'next/server';

async function githubApi(path: string, method: string, token: string, body?: any) {
  const url = `https://api.github.com${path}`;
  const headers: Record<string, string> = {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'IntelliGit-AI',
  };
  const options: any = { method, headers };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(url, options);
  const data = await res.json();
  return { status: res.status, data };
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, repoPath, githubToken, owner, repo, pull_number, commit_title, merge_method } = body;

  if (!githubToken) return Response.json({ error: 'Missing GitHub token' }, { status: 400 });

  try {
    if (action === 'list') {
      // Try to get owner/repo from repoPath if not provided
      let repoOwner = owner, repoName = repo;
      if ((!repoOwner || !repoName) && repoPath) {
        // Try to parse .git/config for origin url
        const fs = await import('fs/promises');
        const path = await import('path');
        const configPath = path.join(repoPath, '.git', 'config');
        try {
          const config = await fs.readFile(configPath, 'utf8');
          const match = config.match(/url = .*github.com[/:]([^/]+)\/(.+?)(\.git)?$/m);
          if (match) {
            repoOwner = match[1];
            repoName = match[2];
          }
        } catch {}
      }
      if (!repoOwner || !repoName) return Response.json({ prs: [] });
      // List open PRs
      const { data } = await githubApi(`/repos/${repoOwner}/${repoName}/pulls?state=open`, 'GET', githubToken);
      return Response.json({ prs: data });
    }
    if (action === 'merge') {
      if (!owner || !repo || !pull_number) return Response.json({ error: 'Missing PR info' }, { status: 400 });
      const { data } = await githubApi(`/repos/${owner}/${repo}/pulls/${pull_number}/merge`, 'PUT', githubToken, {
        commit_title: commit_title || undefined,
        merge_method: merge_method || 'merge',
      });
      return Response.json({ merged: !!data.merged, message: data.message });
    }
    if (action === 'close') {
      if (!owner || !repo || !pull_number) return Response.json({ error: 'Missing PR info' }, { status: 400 });
      const { data } = await githubApi(`/repos/${owner}/${repo}/pulls/${pull_number}`, 'PATCH', githubToken, {
        state: 'closed',
      });
      return Response.json({ closed: data.state === 'closed', message: data.message });
    }
    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    return Response.json({ error: e.message || 'Internal error' }, { status: 500 });
  }
}
