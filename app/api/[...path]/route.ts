// Server-side proxy: browser -> /api/* -> backend /api/*
// Adds the backend's X-Service-Secret and passes the session cookie both ways,
// so the secret never reaches the browser and no CORS is needed.
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const API_URL = (process.env.API_URL || 'http://localhost:4000').replace(/\/$/, '');
const SERVICE_SECRET = process.env.SERVICE_SECRET || '';

const SKIP_REQ = new Set(['host', 'connection', 'content-length', 'x-service-secret', 'accept-encoding']);
const SKIP_RES = new Set(['content-encoding', 'content-length', 'transfer-encoding', 'connection']);

async function handler(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  if (!SERVICE_SECRET) {
    return Response.json({ error: 'SERVICE_SECRET is not configured on the frontend' }, { status: 500 });
  }
  const { path } = await ctx.params;
  const url = `${API_URL}/api/${path.map(encodeURIComponent).join('/')}${req.nextUrl.search}`;

  const headers = new Headers();
  req.headers.forEach((v, k) => { if (!SKIP_REQ.has(k.toLowerCase())) headers.set(k, v); });
  headers.set('X-Service-Secret', SERVICE_SECRET);

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: req.method,
      headers,
      body: hasBody ? await req.arrayBuffer() : undefined,
      redirect: 'manual',
      cache: 'no-store',
    });
  } catch {
    return Response.json({ error: 'Backend unreachable' }, { status: 502 });
  }

  const out = new Headers();
  upstream.headers.forEach((v, k) => { if (k.toLowerCase() !== 'set-cookie' && !SKIP_RES.has(k.toLowerCase())) out.set(k, v); });
  for (const c of upstream.headers.getSetCookie()) out.append('set-cookie', c);
  return new Response(upstream.body, { status: upstream.status, headers: out });
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
