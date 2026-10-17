import { createHmac, timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';

const payload = (request, ip, timestamp) => {
  const url = new URL(request.url);
  return [timestamp, ip, request.method, url.pathname + url.search].join('\n');
};

export function signProxyRequest(request, ip, secret, timestamp = Date.now()) {
  if (!isIP(ip) || !secret || secret.length < 32) throw Error('Invalid proxy configuration.');
  const time = String(timestamp);
  return {
    'x-taskhub-proxy-ip': ip,
    'x-taskhub-proxy-time': time,
    'x-taskhub-proxy-signature': createHmac('sha256', secret).update(payload(request, ip, time)).digest('hex'),
  };
}

export function verifyProxyRequest(request, secret, now = Date.now()) {
  const ip = request.headers.get('x-taskhub-proxy-ip');
  const time = request.headers.get('x-taskhub-proxy-time');
  const signature = request.headers.get('x-taskhub-proxy-signature');
  if (!secret || secret.length < 32 || !isIP(ip || '') || !/^\d{13}$/.test(time || '') ||
      Math.abs(now - Number(time)) > 60000 || !/^[a-f0-9]{64}$/.test(signature || '')) return null;
  const expected = createHmac('sha256', secret).update(payload(request, ip, time)).digest();
  return timingSafeEqual(expected, Buffer.from(signature, 'hex')) ? ip : null;
}
