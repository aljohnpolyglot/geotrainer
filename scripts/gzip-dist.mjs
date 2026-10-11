import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

for (const name of readdirSync('dist', { recursive: true })) {
  if (!/\.(?:css|html|js|json|map|svg|txt|webmanifest|xml)$/i.test(name)) continue;
  const file = join('dist', name);
  if (statSync(file).isFile()) writeFileSync(`${file}.gz`, gzipSync(readFileSync(file)));
}
