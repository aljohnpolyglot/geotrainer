import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { metaReferenceContent } from './MetaReferenceText';

test('Meta image links become local in-lesson figures without exposing paths', () => {
  assert.deepEqual(metaReferenceContent('See [this](/images/australia/rightleftdrive.png) infographic and [map](/images/guatemala/top_right_bar.png?).'), {
    copy: 'See this infographic and map.',
    images: [{ path: '/images/australia/rightleftdrive.png', label: 'this' }, { path: '/images/guatemala/top_right_bar.png', label: 'map' }],
  });
  assert.deepEqual(metaReferenceContent('Read [the guide](https://example.com/guide).'), { copy: 'Read [the guide](https://example.com/guide).', images: [] });
});

test('every country-course image reference is bundled locally', () => {
  const courseDir = join(process.cwd(), 'public', 'meta-courses');
  let references = 0;
  for (const file of readdirSync(courseDir).filter((name) => name.endsWith('.json'))) {
    const course = JSON.parse(readFileSync(join(courseDir, file), 'utf8'));
    if (!Array.isArray(course.tips)) continue;
    for (const tip of course.tips) for (const value of [tip.text, tip.note]) {
      if (typeof value !== 'string') continue;
      for (const image of metaReferenceContent(value).images) {
        references++;
        assert.ok(existsSync(join(process.cwd(), 'public', image.path.slice(1))), `${file}: ${image.path}`);
      }
    }
  }
  assert.ok(references > 0);
});
