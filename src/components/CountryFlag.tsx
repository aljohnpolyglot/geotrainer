import { getFlagCdnUrl } from '../services/geocoding';

export function CountryFlag({ code }: { code: string }) {
  if (!code) return null;
  return <img className="country-flag" src={getFlagCdnUrl(code, 40)} srcSet={`${getFlagCdnUrl(code, 40)} 1x, ${getFlagCdnUrl(code, 80)} 2x`} width="24" height="16" alt="" referrerPolicy="no-referrer" />;
}
