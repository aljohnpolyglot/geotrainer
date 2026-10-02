// Usage: node scripts/import-plonkit-captures.mjs <capture-folder> [repo-root]
// Imports all captured Plonk It images into local Meta courses without repeatedly rewriting each course.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, rename, stat, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const imagePath = /^images\/[A-Za-z0-9._-]+\.(?:jpg|jpeg|png|webp|gif|avif|img)$/i;

async function manifestFolders(input) {
  if (existsSync(join(input, 'manifest.json'))) return [input];
  const folders = (await readdir(input, { withFileTypes: true }))
    .filter(item => item.isDirectory() && existsSync(join(input, item.name, 'manifest.json')))
    .map(item => join(input, item.name)).sort();
  if (!folders.length) throw new Error('No Plonkit capture folders found.');
  return folders;
}

const isPlonkit = value => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && /(^|\.)plonkit\.net$/i.test(url.hostname);
  } catch { return false; }
};

async function writeAtomic(path, data) {
  const temporary = `${path}.${process.pid}.tmp`;
  await writeFile(temporary, data);
  await rename(temporary, path);
}

async function saveImage(source, destination) {
  if (existsSync(destination)) return;
  const temporary = `${destination}.${process.pid}.tmp.webp`;
  if (source.toLowerCase().endsWith('.webp')) {
    const bytes = await readFile(source);
    if (bytes.length < 12 || bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WEBP') {
      throw new Error(`Invalid WebP capture: ${source}`);
    }
    await writeFile(temporary, bytes);
  } else {
    const result = spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', source,
      '-vf', "scale=w='min(1280,iw)':h='min(1280,ih)':force_original_aspect_ratio=decrease",
      '-c:v', 'libwebp', '-q:v', '78', '-compression_level', '6', '-frames:v', '1', temporary],
    { encoding: 'utf8' });
    if (result.status !== 0) throw new Error(`Could not convert ${source}: ${result.stderr || result.error?.message || 'ffmpeg failed'}`);
  }
  await rename(temporary, destination);
}

export async function importCaptures(input, root = repoRoot) {
  const folders = await manifestFolders(resolve(input));
  root = resolve(root);
  const reportPath = join(root, 'scripts/meta-course-image-report.json');
  const imageDir = join(root, 'public/meta-courses/images');
  const report = JSON.parse(await readFile(reportPath, 'utf8'));
  if (!Array.isArray(report.missingImages)) throw new Error('Meta image report has no missingImages array.');
  await mkdir(imageDir, { recursive: true });
  const needed = new Map(report.missingImages.map(item => [item.url, item]));
  const courses = new Map(), completed = new Set();
  let imported = 0;
  for (const folder of folders) {
    const manifest = JSON.parse(await readFile(join(folder, 'manifest.json'), 'utf8'));
    if (!isPlonkit(manifest.pageUrl) || !Array.isArray(manifest.entries)) throw new Error(`Invalid capture manifest: ${folder}`);
    for (const entry of manifest.entries) {
      if (!imagePath.test(entry.file || '') || !isPlonkit(entry.url) || !new URL(entry.url).pathname.startsWith('/images/')) {
        throw new Error(`Invalid capture entry in ${folder}`);
      }
      const missing = needed.get(entry.url);
      if (!missing || completed.has(entry.url)) continue;
      const source = join(folder, entry.file);
      if (!(await stat(source)).size) throw new Error(`Empty capture image: ${source}`);
      const hash = createHash('sha256').update(entry.url).digest('hex');
      const image = `meta-courses/images/${hash}.webp`;
      const references = [];
      for (const reference of missing.references || []) {
        const code = /^([A-Z]{2})-/.exec(reference)?.[1];
        if (!code) continue;
        if (!courses.has(code)) {
          const path = join(root, `public/meta-courses/${code}.json`);
          if (!existsSync(path)) continue;
          courses.set(code, { path, data: JSON.parse(await readFile(path, 'utf8')), dirty: false });
        }
        const course = courses.get(code);
        const tip = course?.data.tips?.find(item => item.id === reference);
        if (tip) references.push({ course, tip });
      }
      if (!references.length) continue;
      await saveImage(source, join(imageDir, `${hash}.webp`));
      for (const { course, tip } of references) { tip.image = image; course.dirty = true; }
      completed.add(entry.url);
      imported++;
    }
  }
  for (const { path, data, dirty } of courses.values()) if (dirty) await writeAtomic(path, JSON.stringify(data));
  report.missingImages = report.missingImages.filter(item => !completed.has(item.url));
  report.hostedImages = report.uniqueSourceImages - report.missingImages.length;
  report.hostedBytes = (await Promise.all((await readdir(imageDir)).filter(name => name.endsWith('.webp'))
    .map(async name => (await stat(join(imageDir, name))).size))).reduce((sum, size) => sum + size, 0);
  report.generatedAt = new Date().toISOString();
  await writeAtomic(reportPath, JSON.stringify(report, null, 2));
  return { imported, remaining: report.missingImages.length, courses: [...courses.values()].filter(item => item.dirty).length };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) { console.error('Usage: node scripts/import-plonkit-captures.mjs <capture-folder> [repo-root]'); process.exitCode = 1; }
  else importCaptures(process.argv[2], process.argv[3]).then(result =>
    console.log(`Imported ${result.imported} images into ${result.courses} courses; ${result.remaining} remain unavailable.`)
  ).catch(error => { console.error(error.message); process.exitCode = 1; });
}
