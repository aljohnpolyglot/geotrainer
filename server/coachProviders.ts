import { callGeminiCoach, buildCoachPrompt, normalizeCoachAnalysis, coachLanguageMatches, coachRationalesAreSpecific, rules, GeminiKeyCarousel } from './aiCoach.js';
import { getCountryKnowledge, getCountryMetaKnowledge } from './geoguessrKnowledge.js';

type CoachProvider = 'gemini' | 'openai' | 'anthropic';
type ProviderRequest = Parameters<typeof callGeminiCoach>[1] & { provider: CoachProvider; apiKey: string; endpoint?: string };
const compatibleHosts = ['api.openai.com', 'openrouter.ai', 'api.groq.com', 'api.together.xyz', 'api.mistral.ai', 'api.deepseek.com', 'api.fireworks.ai', 'api.x.ai'];
export function compatibleChatUrl(value = 'https://api.openai.com/v1') {
  let url: URL;
  try { url = new URL(value); } catch { throw new Error('Enter a valid OpenAI-compatible API URL.'); }
  const allowedPath = url.hostname.toLowerCase() === 'openrouter.ai' ? /^\/api\/v1\/?$/u : url.hostname.toLowerCase() === 'api.fireworks.ai' ? /^\/inference\/v1\/?$/u : /^\/(?:v1)?\/?$/u;
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || !compatibleHosts.includes(url.hostname.toLowerCase()) || !allowedPath.test(url.pathname)) throw new Error('This OpenAI-compatible API URL is not supported.');
  return `${url.origin}${url.pathname.replace(/\/$/u, '')}/chat/completions`;
}
function extractJson(text: string) {
  const clean = text.trim().replace(/^```(?:json)?\s*/iu, '').replace(/\s*```$/u, '');
  try { return JSON.parse(clean); } catch { throw new Error('The AI provider returned an invalid Coach response. Try again.'); }
}
export async function callCoachWithProvider(request: ProviderRequest, fetcher: typeof fetch = fetch) {
  if (!request.apiKey || request.apiKey.length > 500) throw new Error('Add a valid provider API key in Settings.');
  const model = request.model?.trim().slice(0, 100) || (request.provider === 'gemini' ? 'gemini-2.5-flash' : request.provider === 'anthropic' ? 'claude-sonnet-4-5' : 'gpt-4.1-mini');
  if (request.provider === 'gemini') {
    try { return await callGeminiCoach(new GeminiKeyCarousel([request.apiKey]), { ...request, model }, fetcher); }
    catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (/quota/i.test(message)) throw new Error('Provider quota exceeded. Check your provider account.');
      if (/timed out/i.test(message)) throw new Error('Coach request timed out.');
      if (/rejected/i.test(message)) throw new Error('Provider rejected the request. Check the key, model, and provider settings.');
      if (/mixed-language/i.test(message)) throw new Error('The AI provider returned mixed-language output. Try again.');
      if (/vague candidate/i.test(message)) throw new Error('The AI provider returned incomplete country reasoning. Try again.');
      throw new Error('The AI provider could not complete this analysis.');
    }
  }
  const frames = request.frames || [request];
  const context = ['hints', 'analyze', 'clue', 'clue-safe'].includes(request.mode) ? undefined : request.context;
  const knowledge = context ? getCountryKnowledge(String(context.actualCountry || ''), 6) : [];
  const metaKnowledge = context && request.mode === 'explain' ? getCountryMetaKnowledge(String(context.actualCountry || ''), 8) : [];
  const prompt = `${rules}\n${buildCoachPrompt(request.mode, context, knowledge, metaKnowledge, request.language, request.style, request.depth)}\nReturn only a valid JSON object with the Coach response fields.`;
  const imageContent = frames.map((frame) => request.provider === 'anthropic'
    ? { type: 'image', source: { type: 'base64', media_type: frame.mimeType, data: frame.imageData } }
    : { type: 'image_url', image_url: { url: `data:${frame.mimeType};base64,${frame.imageData}` } });
  const url = request.provider === 'anthropic' ? 'https://api.anthropic.com/v1/messages' : compatibleChatUrl(request.endpoint);
  const headers = request.provider === 'anthropic'
    ? { 'content-type': 'application/json', 'x-api-key': request.apiKey, 'anthropic-version': '2023-06-01' }
    : { 'content-type': 'application/json', authorization: `Bearer ${request.apiKey}` };
  const body = request.provider === 'anthropic'
    ? { model, max_tokens: request.depth === 'deep' ? 8192 : request.depth === 'short' ? 2048 : 4096, system: prompt, messages: [{ role: 'user', content: [{ type: 'text', text: 'Analyze the supplied Street View image(s).' }, ...frames.map((frame) => ({ type: 'image', source: { type: 'base64', media_type: frame.mimeType, data: frame.imageData } }))] }] }
    : { model, messages: [{ role: 'system', content: prompt }, { role: 'user', content: [{ type: 'text', text: 'Analyze the supplied Street View image(s).' }, ...imageContent] }], response_format: { type: 'json_object' }, max_tokens: request.depth === 'deep' ? 8192 : request.depth === 'short' ? 2048 : 4096 };
  let response: Response;
  try { response = await fetcher(url, { method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(60_000), redirect: 'error' }); }
  catch (error) { if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) throw new Error('Coach request timed out.'); throw new Error('Could not reach the selected AI provider.'); }
  if (!response.ok) throw new Error(response.status === 429 ? 'Provider quota exceeded. Check your provider account.' : response.status >= 500 ? 'AI provider service error.' : 'Provider rejected the request. Check the key, model, and provider settings.');
  let raw: { choices?: Array<{ message?: { content?: string | Array<{ text?: string }> } }>; content?: Array<{ type?: string; text?: string }> };
  try { raw = await response.json(); } catch { throw new Error('The AI provider returned an unreadable response. Try again.'); }
  const content = request.provider === 'anthropic' ? raw.content?.find((item) => item.type === 'text')?.text : raw.choices?.[0]?.message?.content;
  const text = typeof content === 'string' ? content : Array.isArray(content) ? content.map((item) => item.text || '').join('\n') : '';
  if (!text) throw new Error('The AI provider returned an empty response.');
  let analysis: ReturnType<typeof normalizeCoachAnalysis>;
  try { analysis = normalizeCoachAnalysis(extractJson(text), request.mode, String(context?.actualCountry || '')); }
  catch { throw new Error('The AI provider returned an invalid Coach response. Try again.'); }
  if (!coachLanguageMatches(analysis, request.language)) throw new Error('The AI provider returned mixed-language output. Try again.');
  if (['analyze', 'analyze360', 'clue'].includes(request.mode) && !coachRationalesAreSpecific(analysis)) throw new Error('The AI provider returned incomplete country reasoning. Try again.');
  return { analysis, model, generatedAt: Date.now() };
}
