import type { SupportedLanguage } from '../types';

export const LOCATION_SETUP_COPY: Record<string, Record<SupportedLanguage, string>> = {
  'All regions': { en:'All regions', es:'Todas las regiones', pt:'Todas as regiões', fr:'Toutes les régions', de:'Alle Regionen', it:'Tutte le regioni', ru:'Все регионы', sv:'Alla regioner' },
  'Add region': { en:'Add region', es:'Añadir región', pt:'Adicionar região', fr:'Ajouter une région', de:'Region hinzufügen', it:'Aggiungi regione', ru:'Добавить регион', sv:'Lägg till region' },
  Cities: { en:'Cities', es:'Ciudades', pt:'Cidades', fr:'Villes', de:'Städte', it:'Città', ru:'Города', sv:'Städer' },
  'Add city': { en:'Add city', es:'Añadir ciudad', pt:'Adicionar cidade', fr:'Ajouter une ville', de:'Stadt hinzufügen', it:'Aggiungi città', ru:'Добавить город', sv:'Lägg till stad' },
  'Could not find a valid Street View panorama. Please click "Next Location" to try again.': {
    en:'No matching Street View panorama was found. Try the next location or change your filters.',
    es:'No se encontró un panorama de Street View que coincida. Prueba con el siguiente lugar o cambia los filtros.',
    pt:'Nenhum panorama do Street View corresponde aos filtros. Tente o próximo local ou altere os filtros.',
    fr:'Aucun panorama Street View ne correspond aux filtres. Essayez le lieu suivant ou modifiez les filtres.',
    de:'Kein passendes Street-View-Panorama gefunden. Versuche den nächsten Ort oder ändere deine Filter.',
    it:'Nessun panorama Street View corrisponde ai filtri. Prova il luogo successivo o modifica i filtri.',
    ru:'Не найдено подходящей панорамы Street View. Попробуйте следующее место или измените фильтры.',
    sv:'Inget Street View-panorama matchade filtren. Prova nästa plats eller ändra filtren.',
  },
};
