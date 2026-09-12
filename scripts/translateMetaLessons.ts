import fs from 'node:fs/promises';
import { loadGeminiKeys } from '../server/aiCoach';

type Lesson = { id: string; text: string };
type Translations = Record<string, Record<string, string>>;

const languages = { es: 'Spanish', pt: 'Portuguese', fr: 'French', de: 'German', it: 'Italian', ru: 'Russian', sv: 'Swedish' } as const;
const lessons = JSON.parse(await fs.readFile('src/data/metaLessons.json', 'utf8')) as Lesson[];
const outputPath = 'src/data/metaLessonTranslations.json';
const translations: Translations = await fs.readFile(outputPath, 'utf8').then(JSON.parse).catch(() => ({}));
const keys = loadGeminiKeys();
if (!keys.length) throw new Error('No Gemini keys are configured.');

async function translateBatch(language: string, batch: Lesson[], offset: number) {
  const prompt = `Translate these concise GeoGuessr visual-learning hints from English to ${language}. Preserve country/place names, quoted words, road codes, abbreviations, numbers, and factual meaning. Use natural educational language. Return every ID exactly once and only the requested JSON.\n${JSON.stringify(batch)}`;
  let error = '';
  for (let attempt = 0; attempt < Math.max(3, keys.length); attempt++) {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent', {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': keys[(offset + attempt) % keys.length] },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0, maxOutputTokens: 8192, thinkingConfig: { thinkingBudget: 0 }, responseMimeType: 'application/json', responseSchema: { type: 'ARRAY', items: { type: 'OBJECT', properties: { id: { type: 'STRING' }, text: { type: 'STRING' } }, required: ['id', 'text'] } } } }),
    });
    if (!response.ok) { error = `Gemini returned ${response.status}`; continue; }
    const raw = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = raw.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text;
    if (!text) { error = 'Gemini returned no translation'; continue; }
    const translated = JSON.parse(text) as Lesson[];
    if (translated.length !== batch.length || translated.some((item, index) => item.id !== batch[index].id || !item.text.trim())) { error = 'Gemini returned an incomplete batch'; continue; }
    return translated;
  }
  throw new Error(error || 'Translation failed');
}

for (const [code, language] of Object.entries(languages)) {
  const pending = lessons.filter((lesson) => !translations[lesson.id]?.[code]);
  for (let index = 0; index < pending.length; index += 60) {
    const translated = await translateBatch(language, pending.slice(index, index + 60), index / 60);
    translated.forEach((item) => { translations[item.id] = { ...translations[item.id], [code]: item.text }; });
    await fs.writeFile(outputPath, `${JSON.stringify(translations, null, 2)}\n`, 'utf8');
    console.log(`${code}: ${Math.min(index + 60, pending.length)}/${pending.length}`);
  }
}

const missing = lessons.flatMap((lesson) => Object.keys(languages).filter((code) => !translations[lesson.id]?.[code]).map((code) => `${lesson.id}:${code}`));
if (missing.length) throw new Error(`Missing ${missing.length} translations`);
