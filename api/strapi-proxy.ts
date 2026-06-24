// Vercel Edge Function: proxy /strapi/* → STRAPI_URL/*
// Adds `ngrok-skip-browser-warning` and a non-browser User-Agent so that
// ngrok free-tier doesn't return its browser interstitial page for <img> /
// fetch requests originating from the deployed frontend.
//
// Configure VITE_STRAPI_URL (ngrok URL) in Vercel project env vars.

export const config = { runtime: 'edge' };

const STRAPI_BACKEND = process.env.STRAPI_BACKEND_URL || '';

export default async function handler(req: Request): Promise<Response> {
  if (!STRAPI_BACKEND) {
    return new Response('STRAPI_BACKEND_URL not configured', { status: 500 });
  }

  const url = new URL(req.url);
  // /strapi/<rest> → STRAPI_BACKEND/<rest>
  const rest = url.pathname.replace(/^\/strapi/, '');
  const targetUrl = STRAPI_BACKEND.replace(/\/+$/, '') + rest + url.search;

  // Forward request headers; override UA + add ngrok skip
  const headers = new Headers(req.headers);
  headers.set('ngrok-skip-browser-warning', 'true');
  headers.set('User-Agent', 'hradiska-vercel-proxy/1.0');
  headers.delete('host'); // Strapi/ngrok manage own host header

  try {
    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : req.body,
      redirect: 'follow',
    });

    // Pass through response with same headers (CORS allowed origins are
    // handled by Strapi itself; here we're just relaying bytes).
    const respHeaders = new Headers(upstream.headers);
    respHeaders.delete('content-encoding'); // edge runtime decodes already
    respHeaders.delete('transfer-encoding');

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: respHeaders,
    });
  } catch (err: any) {
    return new Response(`Proxy error: ${err?.message || 'unknown'}`, { status: 502 });
  }
}
