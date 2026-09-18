import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import catalog from '../src/data/countryCatalog.json';

type PoolCity = { name: string; lat: number; lng: number; population: number; class: 'major' | 'regional' | 'local'; urbanRadiusKm: number };
type PoolRegion = { id: string; name: string; cities: PoolCity[] };

const dumpDir = process.argv[2];
if (!dumpDir) throw new Error('Usage: tsx scripts/generate-city-regions.ts <GeoNames dump directory>');

const adminNames = new Map(readFileSync(join(dumpDir, 'admin1CodesASCII.txt'), 'utf8').trim().split(/\r?\n/).map((line) => {
  const [code, name] = line.split('\t'); return [code, name] as const;
}));
const pools = new Map<string, Map<string, PoolRegion>>();
for (const line of readFileSync(join(dumpDir, 'cities15000.txt'), 'utf8').trim().split(/\r?\n/)) {
  const fields = line.split('\t'); const countryCode = fields[8];
  if (!(countryCode in catalog) || !/^PPL(?:C|A[2-4]?)?$/.test(fields[7])) continue;
  const adminCode = fields[10] || '00'; const id = `${countryCode}.${adminCode}`;
  const regionName = adminNames.get(id) || (catalog as Record<string, { name: string }>)[countryCode].name;
  const population = Number(fields[14]) || 0;
  const city: PoolCity = {
    name: fields[1], lat: Number(fields[4]), lng: Number(fields[5]), population,
    class: population >= 750_000 ? 'major' : population >= 250_000 ? 'regional' : 'local',
    urbanRadiusKm: population >= 750_000 ? 16 : population >= 250_000 ? 11 : 8,
  };
  const country = pools.get(countryCode) || new Map<string, PoolRegion>();
  const region = country.get(id) || { id, name: regionName, cities: [] };
  region.cities.push(city); country.set(id, region); pools.set(countryCode, country);
}

const outputDir = join(process.cwd(), 'public', 'city-pools');
mkdirSync(outputDir, { recursive: true });
let cityCount = 0; let regionCount = 0;
for (const countryCode of Object.keys(catalog)) {
  const regions = [...(pools.get(countryCode)?.values() || [])]
    .map((region) => { const seen = new Set<string>(); return { ...region, cities: region.cities.sort((a, b) => b.population - a.population || a.name.localeCompare(b.name)).filter((city) => { const key = city.name.toLowerCase().replace(/\bcity\b/g, '').replace(/[^a-z0-9]/g, ''); if (seen.has(key)) return false; seen.add(key); return true; }) }; })
    .sort((a, b) => a.name.localeCompare(b.name));
  cityCount += regions.reduce((sum, region) => sum + region.cities.length, 0); regionCount += regions.length;
  writeFileSync(join(outputDir, `${countryCode.toLowerCase()}.json`), `${JSON.stringify(regions)}\n`);
}
console.log(`Generated ${regionCount} regional pools with ${cityCount} cities.`);
