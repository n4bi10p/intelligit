import { NextRequest, NextResponse } from 'next/server';
import { getPrHistory } from '@/lib/getPrHistory';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || 'all';
  const repo = searchParams.get('repo') || undefined;
  try {
    const history = await getPrHistory({ status, repo });
    return NextResponse.json({ history });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to fetch PR history' }, { status: 500 });
  }
}
