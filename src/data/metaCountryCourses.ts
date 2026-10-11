import manifest from './metaCountryCoursesManifest.json';
import topicManifest from './metaTopicCoursesManifest.json';
import type { MetaLesson, SupportedLanguage } from '../types';
import { loadMetaCountryViews, viewFromGoogleMapsUrl, type MetaMapView } from './metaCountryViews';

export interface MetaCountryCourseSummary {
  code: string;
  name: string;
  lessonCount: number;
  sourceUrl?: string;
  creator?: string;
}

export interface MetaCountryCourseTip {
  id: string;
  section: string;
  mapUrl: string;
  image?: string;
  text: string;
  note?: string;
  temporallySensitive?: boolean;
}

export const META_COUNTRY_COURSES = manifest as MetaCountryCourseSummary[];
export const META_TOPIC_COURSES = topicManifest as MetaCountryCourseSummary[];
export const META_ALL_COURSES = [...META_COUNTRY_COURSES, ...META_TOPIC_COURSES];
export const metaCourseForLesson = (id: string) => META_ALL_COURSES.find((course) => id.startsWith(`${course.code}-`));
const TOPIC_NAMES: Record<string, Record<SupportedLanguage, string>> = {
  'geocoach-plates': { en: 'US license plates', es: 'Matrículas de EE. UU.', pt: 'Matrículas dos EUA', fr: 'Plaques des États-Unis', de: 'US-Kennzeichen', it: 'Targhe degli Stati Uniti', ru: 'Номерные знаки США', sv: 'Registreringsskyltar i USA' },
  'geocoach-bollards': { en: 'World bollards', es: 'Bolardos del mundo', pt: 'Balizadores do mundo', fr: 'Balises du monde', de: 'Leitpfosten weltweit', it: 'Delineatori nel mondo', ru: 'Дорожные столбики мира', sv: 'Vägstolpar i världen' },
  'geocoach-latin-america': { en: 'Identify Latin America', es: 'Identificar Latinoamérica', pt: 'Identificar a América Latina', fr: 'Reconnaître l’Amérique latine', de: 'Lateinamerika erkennen', it: 'Riconoscere l’America Latina', ru: 'Как узнать Латинскую Америку', sv: 'Känn igen Latinamerika' },
  'geocoach-pedestrian-signs': { en: 'European pedestrian signs', es: 'Señales peatonales europeas', pt: 'Sinais de pedestres europeus', fr: 'Panneaux piétons européens', de: 'Europäische Fußgängerschilder', it: 'Segnali pedonali europei', ru: 'Пешеходные знаки Европы', sv: 'Europeiska gångskyltar' },
  'geocoach-google-cars': { en: 'World Google cars', es: 'Coches de Google del mundo', pt: 'Carros do Google pelo mundo', fr: 'Voitures Google dans le monde', de: 'Google-Autos weltweit', it: 'Auto Google nel mondo', ru: 'Автомобили Google в мире', sv: 'Google-bilar i världen' },
  'geocoach-baltics': { en: 'Identify the Baltics', es: 'Distinguir los países bálticos', pt: 'Identificar os países bálticos', fr: 'Reconnaître les pays baltes', de: 'Baltikum erkennen', it: 'Riconoscere i Paesi baltici', ru: 'Как различать страны Балтии', sv: 'Känn igen Baltikum' },
  'geocoach-malaysia-indonesia': { en: 'Malaysia vs Indonesia', es: 'Malasia o Indonesia', pt: 'Malásia ou Indonésia', fr: 'Malaisie ou Indonésie', de: 'Malaysia oder Indonesien', it: 'Malesia o Indonesia', ru: 'Малайзия или Индонезия', sv: 'Malaysia eller Indonesien' },
  'geocoach-south-asia-languages': { en: 'Languages of South Asia', es: 'Lenguas del sur de Asia', pt: 'Línguas do Sul da Ásia', fr: 'Langues d’Asie du Sud', de: 'Sprachen Südasiens', it: 'Lingue dell’Asia meridionale', ru: 'Языки Южной Азии', sv: 'Språk i Sydasien' },
  'geocoach-usa-bollards': { en: 'US roadside posts', es: 'Postes de carretera de EE. UU.', pt: 'Balizadores rodoviários dos EUA', fr: 'Balises routières des États-Unis', de: 'US-Leitpfosten', it: 'Delineatori stradali degli USA', ru: 'Дорожные столбики США', sv: 'Vägstolpar i USA' },
  'geocoach-canada-metas': { en: 'Canada clues', es: 'Pistas de Canadá', pt: 'Pistas do Canadá', fr: 'Indices du Canada', de: 'Kanada: Erkennungsmerkmale', it: 'Indizi del Canada', ru: 'Признаки Канады', sv: 'Ledtrådar för Kanada' },
  'geocoach-a-comprehensive-canada-regionguessing': { en: 'Canada regional guide', es: 'Canadá: guía completa por regiones', pt: 'Canadá: guia completo por regiões', fr: 'Canada : guide complet des régions', de: 'Kanada: umfassender Regionenführer', it: 'Canada: guida completa alle regioni', ru: 'Канада: подробный гид по регионам', sv: 'Kanada: komplett regionguide' },
  'geocoach-russia-basic-module': { en: 'Russia basics', es: 'Rusia: fundamentos', pt: 'Rússia: fundamentos', fr: 'Russie : les bases', de: 'Russland: Grundlagen', it: 'Russia: nozioni di base', ru: 'Россия: основы', sv: 'Ryssland: grunderna' },
  'geocoach-bangladesh-districts-bengali': { en: 'Bangladesh districts in Bengali', es: 'Distritos de Bangladés en bengalí', pt: 'Distritos de Bangladesh em bengali', fr: 'Districts du Bangladesh en bengali', de: 'Distrikte Bangladeschs auf Bengalisch', it: 'Distretti del Bangladesh in bengalese', ru: 'Округа Бангладеш на бенгальском', sv: 'Bangladeshs distrikt på bengali' },
  'geocoach-russia-antenna-seasons-car-basics': { en: 'Russia antennas, seasons and cars', es: 'Rusia: antenas, estaciones y coche', pt: 'Rússia: antenas, estações e carro', fr: 'Russie : antennes, saisons et voiture', de: 'Russland: Antennen, Jahreszeiten und Auto', it: 'Russia: antenne, stagioni e auto', ru: 'Россия: антенны, времена года и автомобиль', sv: 'Ryssland: antenner, årstider och bil' },
  'geocoach-new-zealand-vs-australia-how-to-identify': { en: 'New Zealand or Australia', es: 'Nueva Zelanda o Australia', pt: 'Nova Zelândia ou Austrália', fr: 'Nouvelle-Zélande ou Australie', de: 'Neuseeland oder Australien', it: 'Nuova Zelanda o Australia', ru: 'Новая Зеландия или Австралия', sv: 'Nya Zeeland eller Australien' },
  'geocoach-usa-windshield-stickers': { en: 'US windshield stickers', es: 'Pegatinas en parabrisas de EE. UU.', pt: 'Adesivos de para-brisa dos EUA', fr: 'Autocollants de pare-brise aux États-Unis', de: 'Windschutzscheiben-Aufkleber in den USA', it: 'Adesivi sui parabrezza negli USA', ru: 'Наклейки на лобовых стёклах США', sv: 'Vindrutemärken i USA' },
  'geocoach-unique-netherlands-n-road-markers': { en: 'Dutch N-road markers', es: 'Marcadores de rutas N neerlandesas', pt: 'Marcadores das estradas N neerlandesas', fr: 'Bornes des routes N néerlandaises', de: 'N-Straßenmarkierungen in den Niederlanden', it: 'Segnali delle strade N nei Paesi Bassi', ru: 'Указатели дорог N в Нидерландах', sv: 'N-vägsmarkörer i Nederländerna' },
  'geocoach-japanese-diamonds': { en: 'Japanese road diamonds', es: 'Rombos viales de Japón', pt: 'Losangos viários do Japão', fr: 'Losanges routiers du Japon', de: 'Straßenrauten in Japan', it: 'Rombi stradali in Giappone', ru: 'Дорожные ромбы Японии', sv: 'Vägromber i Japan' },
  'geocoach-sarawak-pole-numbers': { en: 'Sarawak pole numbers', es: 'Números de postes de Sarawak', pt: 'Números nos postes de Sarawak', fr: 'Numéros sur les poteaux du Sarawak', de: 'Mastnummer in Sarawak', it: 'Numeri sui pali del Sarawak', ru: 'Номера на столбах Саравака', sv: 'Stolpnummer i Sarawak' },
  'geocoach-austria-region-metas': { en: 'Austrian regional clues', es: 'Pistas regionales de Austria', pt: 'Pistas regionais da Áustria', fr: 'Indices régionaux d’Autriche', de: 'Regionale Hinweise in Österreich', it: 'Indizi regionali dell’Austria', ru: 'Региональные признаки Австрии', sv: 'Regionala ledtrådar i Österrike' },
  'geocoach-georgian-car-metas': { en: 'Georgia Google car clues', es: 'Pistas del coche de Google en Georgia', pt: 'Pistas do carro do Google na Geórgia', fr: 'Indices de la voiture Google en Géorgie', de: 'Hinweise am Google-Auto in Georgien', it: 'Indizi dell’auto Google in Georgia', ru: 'Признаки машины Google в Грузии', sv: 'Ledtrådar från Google-bilen i Georgien' },
  'geocoach-nordic-countries-how-to-identify': { en: 'Identify the Nordic countries', es: 'Cómo distinguir los países nórdicos', pt: 'Como distinguir os países nórdicos', fr: 'Reconnaître les pays nordiques', de: 'Nordische Länder erkennen', it: 'Riconoscere i paesi nordici', ru: 'Как различать страны Северной Европы', sv: 'Känn igen de nordiska länderna' },
  'geocoach-austria-bus-companies': { en: 'Austrian bus companies', es: 'Empresas de autobuses de Austria', pt: 'Empresas de ônibus da Áustria', fr: 'Compagnies de bus autrichiennes', de: 'Österreichische Busunternehmen', it: 'Compagnie di autobus austriache', ru: 'Автобусные компании Австрии', sv: 'Bussbolag i Österrike' },
  'geocoach-oman-vs-uae-how-to-identify': { en: 'Oman or the UAE', es: 'Omán o Emiratos Árabes Unidos', pt: 'Omã ou Emirados Árabes Unidos', fr: 'Oman ou Émirats arabes unis', de: 'Oman oder Vereinigte Arabische Emirate', it: 'Oman o Emirati Arabi Uniti', ru: 'Оман или ОАЭ', sv: 'Oman eller Förenade Arabemiraten' },
  'geocoach-germany-vs-austria-how-to-identify': { en: 'Germany or Austria', es: 'Alemania o Austria', pt: 'Alemanha ou Áustria', fr: 'Allemagne ou Autriche', de: 'Deutschland oder Österreich', it: 'Germania o Austria', ru: 'Германия или Австрия', sv: 'Tyskland eller Österrike' },
  'geocoach-hungarian-pole-stickers': { en: 'Hungarian pole stickers', es: 'Pegatinas en postes de Hungría', pt: 'Adesivos em postes da Hungria', fr: 'Autocollants sur les poteaux hongrois', de: 'Aufkleber an ungarischen Masten', it: 'Adesivi sui pali ungheresi', ru: 'Наклейки на столбах Венгрии', sv: 'Stolpdekaler i Ungern' },
  'geocoach-argentinian-taxi': { en: 'Argentinian taxis', es: 'Taxis de Argentina', pt: 'Táxis da Argentina', fr: 'Taxis argentins', de: 'Argentinische Taxis', it: 'Taxi argentini', ru: 'Такси Аргентины', sv: 'Taxibilar i Argentina' },
  'geocoach-us-possum-guards': { en: 'US possum guards', es: 'Protectores contra zarigüeyas en EE. UU.', pt: 'Proteções contra gambás nos EUA', fr: 'Protections anti-opossums aux États-Unis', de: 'Opossum-Schutz an US-Masten', it: 'Protezioni anti-opossum negli USA', ru: 'Защита столбов от опоссумов в США', sv: 'Opossumskydd på stolpar i USA' },
  'geocoach-malta-bus-stops': { en: 'Malta bus stops', es: 'Paradas de autobús de Malta', pt: 'Paradas de ônibus de Malta', fr: 'Arrêts de bus à Malte', de: 'Bushaltestellen auf Malta', it: 'Fermate degli autobus a Malta', ru: 'Автобусные остановки Мальты', sv: 'Busshållplatser på Malta' },
  'geocoach-south-korea-city-name': { en: 'South Korean city names', es: 'Nombres de ciudades de Corea del Sur', pt: 'Nomes de cidades da Coreia do Sul', fr: 'Noms des villes de Corée du Sud', de: 'Städtenamen in Südkorea', it: 'Nomi delle città della Corea del Sud', ru: 'Названия городов Южной Кореи', sv: 'Stadsnamn i Sydkorea' },
};
export const metaCourseName = (code: string, language: SupportedLanguage) => TOPIC_NAMES[code]?.[language]
  || META_COUNTRY_COURSES.find((course) => course.code === code)?.name || code;

export function normalizeMetaCountryCourse(code: string, value: unknown): MetaCountryCourseTip[] {
  if (!value || typeof value !== 'object' || (value as { code?: unknown }).code !== code || !Array.isArray((value as { tips?: unknown }).tips)) return [];
  const seen = new Set<string>();
  return (value as { tips: unknown[] }).tips.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const tip = item as Partial<MetaCountryCourseTip>;
    if (typeof tip.id !== 'string' || !tip.id.startsWith(`${code}-`) || seen.has(tip.id)
      || typeof tip.section !== 'string' || !tip.section.trim()
      || typeof tip.mapUrl !== 'string' || !/^https?:\/\//i.test(tip.mapUrl)
      || typeof tip.text !== 'string' || !tip.text.trim()
      || (tip.image !== undefined && (typeof tip.image !== 'string' || !/^meta-courses\/images\/[A-Za-z0-9._-]+$/.test(tip.image)))
      || (tip.note !== undefined && typeof tip.note !== 'string')
      || (tip.temporallySensitive !== undefined && typeof tip.temporallySensitive !== 'boolean')) return [];
    seen.add(tip.id);
    return [{ id: tip.id, section: tip.section, mapUrl: tip.mapUrl, ...(tip.image ? { image: tip.image } : {}), text: tip.text, ...(tip.note ? { note: tip.note } : {}), ...(tip.temporallySensitive ? { temporallySensitive: true } : {}) }];
  });
}

export function localizeMetaCountryCourse(code: string, language: SupportedLanguage, tips: MetaCountryCourseTip[], value: unknown): MetaCountryCourseTip[] {
  if (!value || typeof value !== 'object' || (value as { code?: unknown }).code !== code
    || (value as { language?: unknown }).language !== language || !Array.isArray((value as { tips?: unknown }).tips)) {
    throw new Error(`Invalid Meta country course translation: ${code}/${language}`);
  }
  const sourceById = new Map(tips.map((tip) => [tip.id, tip]));
  const localized = new Map<string, { section: string; text: string; note?: string }>();
  for (const item of (value as { tips: unknown[] }).tips) {
    if (!item || typeof item !== 'object') throw new Error(`Invalid Meta country course translation: ${code}/${language}`);
    const row = item as { id?: unknown; section?: unknown; text?: unknown; note?: unknown };
    if (typeof row.id !== 'string' || typeof row.section !== 'string' || !row.section.trim()
      || typeof row.text !== 'string' || !row.text.trim() || (row.note !== undefined && typeof row.note !== 'string')) {
      throw new Error(`Invalid Meta country course translation: ${code}/${language}`);
    }
    const source = sourceById.get(row.id) ?? tips.find((tip) => tip.id.endsWith(`-${row.id}`));
    if (!source || localized.has(source.id) || (source.note && (typeof row.note !== 'string' || !row.note.trim()))) {
      throw new Error(`Incomplete Meta country course translation: ${code}/${language}`);
    }
    localized.set(source.id, { section: row.section, text: row.text, ...(typeof row.note === 'string' && row.note ? { note: row.note } : {}) });
  }
  if (localized.size !== tips.length) throw new Error(`Incomplete Meta country course translation: ${code}/${language}`);
  return tips.map((tip) => ({ ...tip, ...localized.get(tip.id)! }));
}

const sourceLoads = new Map<string, Promise<MetaCountryCourseTip[]>>();
const courseLoads = new Map<string, Promise<MetaCountryCourseTip[]>>();

export function loadMetaCountryCourse(code: string, language: SupportedLanguage = 'en'): Promise<MetaCountryCourseTip[]> {
  const summary = META_ALL_COURSES.find((course) => course.code === code);
  if (!summary) return Promise.reject(new Error(`Unknown Meta country course: ${code}`));
  const cacheKey = `${code}:${language}`;
  const base = import.meta.env?.BASE_URL || '/';
  const directory = summary.sourceUrl ? 'meta-topics' : 'meta-courses';
  let loaded = courseLoads.get(cacheKey);
  if (!loaded) {
    let source = sourceLoads.get(code);
    if (!source) {
      source = fetch(`${base}${directory}/${encodeURIComponent(code)}.json`)
        .then((response) => {
          if (!response.ok) throw new Error(`Could not load Meta country course: ${code}`);
          return response.json();
        })
        .then((value) => {
          const tips = normalizeMetaCountryCourse(code, value);
          if (tips.length !== summary.lessonCount) throw new Error(`Invalid Meta country course data: ${code}`);
          return tips.map((tip) => tip.image?.startsWith('meta-courses/')
            ? { ...tip, image: `${base}${tip.image}` }
            : tip);
        })
        .catch((error) => {
          sourceLoads.delete(code);
          throw error;
        });
      sourceLoads.set(code, source);
    }
    loaded = (language === 'en' ? source : source.then(async (tips) => {
      const filename = summary.sourceUrl ? code : code.toLowerCase();
      const response = await fetch(`${base}${directory}/${encodeURIComponent(filename)}.${language}.json`);
      if (!response.ok) throw new Error(`Could not load Meta country course translation: ${code}/${language}`);
      return localizeMetaCountryCourse(code, language, tips, await response.json());
    }))
      .catch((error) => {
        courseLoads.delete(cacheKey);
        throw error;
      });
    courseLoads.set(cacheKey, loaded);
  }
  return loaded;
}

export function savedMetaCountryLesson(tip: MetaCountryCourseTip, fallback?: MetaMapView): MetaLesson {
  const view = viewFromGoogleMapsUrl(tip.mapUrl) || fallback;
  return { id: tip.id, panoId: view?.panoId || '', lat: view?.lat || 0, lng: view?.lng || 0, heading: view?.heading || 0, pitch: view?.pitch || 0, imageUrl: tip.image || '', text: tip.text, note: tip.note, section: tip.section, mapUrl: tip.mapUrl, temporallySensitive: tip.temporallySensitive };
}

export async function loadSavedMetaCountryLessons(code: string, language: SupportedLanguage): Promise<MetaLesson[]> {
  const [tips, views] = await Promise.all([loadMetaCountryCourse(code, language), loadMetaCountryViews(code)]);
  return tips.map((tip) => savedMetaCountryLesson(tip, views.get(tip.id)));
}
