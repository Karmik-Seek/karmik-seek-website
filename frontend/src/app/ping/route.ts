import { NextResponse } from 'next/server';
import { BACKEND_RENDER_URL } from '@/lib/api';

export async function GET() {
  let backendStatus = 'unreachable';
  try {
    const res = await fetch(`${BACKEND_RENDER_URL}/ping`, {
      method: 'GET',
      cache: 'no-store',
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      backendStatus = 'connected';
    } else {
      backendStatus = `status_${res.status}`;
    }
  } catch (e: any) {
    backendStatus = `error: ${e.message}`;
  }

  return NextResponse.json({
    status: 'pong',
    service: 'Kaarmik Seek Web',
    backend_url: BACKEND_RENDER_URL,
    backend_status: backendStatus,
    timestamp: new Date().toISOString(),
  });
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}
