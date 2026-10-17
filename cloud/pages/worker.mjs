import { signProxyRequest } from './proxy-auth.mjs';

const jsonError = (message, status) => Response.json({ message }, {
  status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
});

function secure(response, dynamic = false) {
  const headers = new Headers(response.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Referrer-Policy', 'same-origin');
  headers.set('Content-Security-Policy', "frame-ancestors 'none'; base-uri 'self'; object-src 'none'");
  if (dynamic) headers.set('Cache-Control', 'no-store');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export async function handlePages(request, env, fetchUpstream = fetch) {
  const url = new URL(request.url);
  if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
    if (!env.TASKHUB_PROXY_SECRET || env.TASKHUB_PROXY_SECRET.length < 32) {
      return jsonError('Kết nối dịch vụ chưa được cấu hình.', 503);
    }
    // Validate the browser's origin before substituting the API origin.
    const origin = request.headers.get('Origin');
    if (origin && origin !== url.origin) return jsonError('Nguồn yêu cầu không hợp lệ.', 403);
    let backend;
    try { backend = new URL(env.TASKHUB_BACKEND_URL); } catch { return jsonError('Kết nối dịch vụ chưa được cấu hình.', 503); }
    if (backend.protocol !== 'https:' || backend.hostname !== 'taskhub.ninaninohihi.chatgpt.site' || backend.port || backend.username || backend.password) {
      return jsonError('Kết nối dịch vụ chưa được cấu hình.', 503);
    }
    backend.pathname = url.pathname;
    backend.search = url.search;
    const headers = new Headers();
    for (const name of ['Accept', 'Content-Type', 'X-TaskHub']) {
      if (request.headers.has(name)) headers.set(name, request.headers.get(name));
    }
    const cookie = (request.headers.get('Cookie') || '').split(';')
      .find(value => value.trim().startsWith('taskhub_session='));
    if (cookie) headers.set('Cookie', cookie.trim());
    if (origin) headers.set('Origin', backend.origin);
    // Cross-zone Worker fetches otherwise share a Cloudflare IP and a rate limit.
    const local = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
    const ip = request.headers.get('CF-Connecting-IP') || (local ? '127.0.0.1' : null);
    let attestation;
    try { attestation = signProxyRequest(request, ip, env.TASKHUB_PROXY_SECRET); }
    catch { return jsonError('Không xác định được kết nối. Vui lòng thử lại.', 503); }
    for (const [key, value] of Object.entries(attestation)) headers.set(key, value);
    const chunks = [];
    let bytes = 0;
    if (request.body) for await (const chunk of request.body) {
      bytes += chunk.length;
      if (bytes > 32768) return jsonError('Dữ liệu quá lớn.', 413);
      chunks.push(Buffer.from(chunk));
    }
    try {
      // Never retry a write automatically. Preserve API status and cookies.
      const response = await fetchUpstream(backend, {
        method: request.method, headers, redirect: 'manual',
        ...(!['GET', 'HEAD'].includes(request.method) ? { body: Buffer.concat(chunks) } : {}),
        signal: AbortSignal.timeout(25000),
      });
      const outgoing = new Headers(response.headers);
      outgoing.delete('Set-Cookie');
      for (const value of response.headers.getSetCookie()) {
        if (/^taskhub_session=/.test(value)) outgoing.append('Set-Cookie', value);
      }
      const location = outgoing.get('Location');
      if (location) {
        const redirect = new URL(location, backend);
        if (redirect.origin === backend.origin) outgoing.set('Location', url.origin + redirect.pathname + redirect.search + redirect.hash);
      }
      return secure(new Response(request.method === 'HEAD' ? null : response.body, {
        status: response.status, headers: outgoing,
      }), true);
    } catch {
      return jsonError('Chưa kết nối được dịch vụ. Vui lòng thử lại.', 503);
    }
  }
  if (!['GET', 'HEAD'].includes(request.method)) return jsonError('Phương thức không được hỗ trợ.', 405);
  const appRoute = url.pathname === '/' || url.pathname === '/app' || /^\/portal\/[^/]+\/?$/.test(url.pathname);
  // Pages canonicalizes /index.html to /; fetch / directly to avoid a redirect loop.
  const assetRequest = appRoute ? new Request(new URL('/', url), request) : request;
  return secure(await env.ASSETS.fetch(assetRequest), appRoute);
}

export default { fetch(request, env) { return handlePages(request, env); } };
