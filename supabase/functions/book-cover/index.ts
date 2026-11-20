// Fetches a Google Books front cover for the add-book form. Browsers can't read Google's cover images
// themselves (no CORS headers), so this returns the image with CORS for our site. Members only (JWT checked
// by Supabase); only books.google.com, only a volume id, so it can't be used as an open proxy.

const ALLOWED_ORIGINS = ['https://bookmate-8key.onrender.com', 'https://bookmate.onrender.com', 'http://localhost:5173'];
const MAX_BYTES = 3_000_000;

Deno.serve(async (req) => {
  const origin = req.headers.get('origin') ?? '';
  const cors = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    Vary: 'Origin',
  };
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'GET') return new Response('method', { status: 405, headers: cors });

  const id = new URL(req.url).searchParams.get('id') ?? '';
  if (!/^[A-Za-z0-9_-]{6,24}$/.test(id)) return new Response('bad id', { status: 400, headers: cors });

  const res = await fetch(`https://books.google.com/books/content?id=${id}&printsec=frontcover&img=1&zoom=1&fife=w600`);
  const type = res.headers.get('content-type') ?? '';
  if (!res.ok || !/^image\/(jpeg|png|webp)$/.test(type)) return new Response('no cover', { status: 404, headers: cors });
  const body = await res.arrayBuffer();
  if (body.byteLength > MAX_BYTES) return new Response('too big', { status: 413, headers: cors });
  return new Response(body, { headers: { ...cors, 'Content-Type': type, 'Cache-Control': 'private, max-age=3600' } });
});
