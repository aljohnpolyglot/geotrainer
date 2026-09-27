import type { IncomingMessage, ServerResponse } from 'node:http';
import { isAllowedCoachOrigin } from './coach.js';
import { createPoolMiddleware } from '../server/aiCoach.js';

const pool = createPoolMiddleware();

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const origin = req.headers.origin;
  if (!isAllowedCoachOrigin(origin)) { res.statusCode = 403; res.end('Origin not allowed.'); return; }
  res.setHeader('access-control-allow-origin', origin!);
  res.setHeader('access-control-allow-methods', 'POST, OPTIONS');
  res.setHeader('access-control-allow-headers', 'content-type');
  res.setHeader('access-control-max-age', '86400'); res.setHeader('vary', 'Origin');
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
  await pool(req, res, () => { res.statusCode = 405; res.end('Method not allowed.'); });
}
