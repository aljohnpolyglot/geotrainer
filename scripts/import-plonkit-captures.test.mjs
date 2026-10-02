import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { importCaptures } from './import-plonkit-captures.mjs';

test('bulk capture import links each image once and resumes without changing the course', async () => {
  const temporary = await mkdtemp(join(tmpdir(), 'plonkit-import-bulk-test-'));
  try {
    const root = join(temporary, 'repo'), folder = join(temporary, 'captures/botswana');
    await mkdir(join(root, 'public/meta-courses/images'), { recursive: true });
    await mkdir(join(root, 'scripts'), { recursive: true });
    await mkdir(join(folder, 'images'), { recursive: true });
    const urls = ['https://www.plonkit.net/images/botswana/one.png', 'https://www.plonkit.net/images/botswana/two.png'];
    const ids = ['BW-a1B2', 'BW-c3D4'];
    const imageDir = 'public/meta-courses/images';
    const existing = (await readdir(imageDir)).find(name => name.endsWith('.webp'));
    assert.ok(existing);
    const bytes = await readFile(join(imageDir, existing));
    const entries = urls.map((url, index) => ({ url, file: `images/${ids[index]}.webp` }));
    for (const entry of entries) await writeFile(join(folder, entry.file), bytes);
    await writeFile(join(folder, 'manifest.json'), JSON.stringify({ pageUrl: 'https://www.plonkit.net/botswana', entries }));
    await writeFile(join(root, 'public/meta-courses/BW.json'), JSON.stringify({ code: 'BW', tips: ids.map(id => ({ id, text: id })) }));
    await writeFile(join(root, 'scripts/meta-course-image-report.json'), JSON.stringify({ uniqueSourceImages: 2, hostedImages: 0,
      missingImages: urls.map((url, index) => ({ url, references: [ids[index]] })) }));
    assert.deepEqual(await importCaptures(join(temporary, 'captures'), root), { imported: 2, remaining: 0, courses: 1 });
    const coursePath = join(root, 'public/meta-courses/BW.json');
    const courseText = await readFile(coursePath, 'utf8');
    const course = JSON.parse(courseText);
    for (let index = 0; index < urls.length; index++) {
      const hash = createHash('sha256').update(urls[index]).digest('hex');
      assert.equal(course.tips[index].image, `meta-courses/images/${hash}.webp`);
      assert.deepEqual(await readFile(join(root, imageDir, `${hash}.webp`)), bytes);
    }
    assert.deepEqual(await importCaptures(join(temporary, 'captures'), root), { imported: 0, remaining: 0, courses: 0 });
    assert.equal(await readFile(coursePath, 'utf8'), courseText);
  } finally {
    const target = resolve(temporary);
    if (dirname(target) === resolve(tmpdir()) && basename(target).startsWith('plonkit-import-bulk-test-')) {
      await rm(target, { recursive: true, force: true });
    }
  }
});
