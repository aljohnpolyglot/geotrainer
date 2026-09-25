import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const normalize = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const distance = (left, right) => {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let index = 0; index < left.length; index += 1) {
    let previous = row[0]; row[0] = index + 1;
    for (let column = 0; column < right.length; column += 1) {
      const next = Math.min(row[column + 1] + 1, row[column] + 1, previous + Number(left[index] !== right[column]));
      previous = row[column + 1]; row[column + 1] = next;
    }
  }
  return row[right.length];
};
const readJson = async (path, fallback) => {
  try { return JSON.parse(await readFile(path, 'utf8')); } catch { return fallback; }
};
const nearbyName = (left, right) => {
  const a = normalize(left); const b = normalize(right); const length = Math.max(a.length, b.length);
  return a === b || (length >= 6 && (a.slice(0, 4) === b.slice(0, 4)) && distance(a, b) <= Math.ceil(length / 4));
};
const paddedBounds = (cities) => {
  const lats = cities.map((city) => city.lat); const lngs = cities.map((city) => city.lng);
  const minLat = Math.min(...lats); const maxLat = Math.max(...lats); const minLng = Math.min(...lngs); const maxLng = Math.max(...lngs);
  const latPad = Math.max(0.15, (maxLat - minLat) * 0.08); const lngPad = Math.max(0.15, (maxLng - minLng) * 0.08);
  return { minLat: minLat - latPad, maxLat: maxLat + latPad, minLng: minLng - lngPad, maxLng: maxLng + lngPad };
};

const directory = join(root, 'public', 'city-pools');
const files = (await readdir(directory)).filter((file) => file.endsWith('.json')).sort();
const regions = [];
for (const file of files) {
  const countryCode = file.slice(0, -5).toUpperCase();
  const pools = await readJson(join(directory, file), []);
  const adminRegions = Object.values(await readJson(join(root, 'public', 'admin1-regions', countryCode.toLowerCase(), 'regions.json'), {}));
  for (const region of pools) {
    if (!region.cities?.length) continue;
    const aliases = adminRegions.filter((name) => nearbyName(region.name, name));
    const bounds = paddedBounds(region.cities);
    regions.push({ id: region.id, countryCode, name: region.name, aliases, lat: (bounds.minLat + bounds.maxLat) / 2, lng: (bounds.minLng + bounds.maxLng) / 2, bounds, population: region.cities.reduce((total, city) => total + city.population, 0) });
  }
}
await mkdir(join(root, 'src', 'data'), { recursive: true });
await writeFile(join(root, 'src', 'data', 'mapRegions.json'), `${JSON.stringify(regions)}\n`);
