import type { IncomingMessage, ServerResponse } from 'node:http';
import { createAiCoachMiddleware } from '../server/aiCoach.js';

const deployedAppOrigin = 'https://aljohnpolyglot.github.io';
const coach = createAiCoachMiddleware();

export function isAllowedCoachOrigin(
  origin: string | undefined,
  configured = process.env.COACH_ALLOWED_ORIGINS,
  vercelUrl = process.env.VERCEL_URL,
) {
  if (!origin) return false;
  const allowed = new Set([deployedAppOrigin, ...(configured || '').split(',').map((value) => value.trim()).filter(Boolean)]);
  if (vercelUrl) allowed.add(`https://${vercelUrl}`);
  return allowed.has(origin) || /^http:\/\/(?:localhost|127\.0\.0\.1):\d+$/.test(origin);
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const origin = req.headers.origin;
  if (!isAllowedCoachOrigin(origin)) {
    res.statusCode = 403;
    res.end('Origin not allowed.');
    return;
  }
  res.setHeader('access-control-allow-origin', origin!);
  res.setHeader('access-control-allow-methods', 'POST, OPTIONS');
  res.setHeader('access-control-allow-headers', 'content-type');
  res.setHeader('access-control-max-age', '86400');
  res.setHeader('vary', 'Origin');
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }
  await coach(req, res, () => {
    res.statusCode = 405;
    res.end('Method not allowed.');
  });
}
