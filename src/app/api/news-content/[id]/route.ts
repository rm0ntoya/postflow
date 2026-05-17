import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEWS_API_URL ?? 'http://localhost:3001';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const res = await fetch(`${API_BASE}/api/news/${id}/content`, {
      headers: { 'Content-Type': 'application/json' },
      // No cache — always fresh scrape
      cache: 'no-store',
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    return NextResponse.json(
      { success: false, error: { code: 'PROXY_ERROR', message: msg } },
      { status: 502 }
    );
  }
}
