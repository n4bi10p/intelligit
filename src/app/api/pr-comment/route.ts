import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { owner, repo, pull_number, githubToken, comment } = await req.json();
    if (!owner || !repo || !pull_number || !githubToken || !comment) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const url = `https://api.github.com/repos/${owner}/${repo}/issues/${pull_number}/comments`;
    const ghRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ body: comment }),
    });
    const data = await ghRes.json();
    if (!ghRes.ok) {
      return NextResponse.json({ error: data.message || 'Failed to post comment' }, { status: 500 });
    }
    return NextResponse.json({ success: true, comment: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Unknown error' }, { status: 500 });
  }
}
