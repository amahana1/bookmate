import { toAsciiDigits } from './format';

/** Berlin postcodes run 10115–14199; 12529 (Schönefeld, Brandenburg) is the one non-Berlin code in that range. */
export function isBerlinPostcode(s: string): boolean {
  const v = toAsciiDigits(s.trim());
  if (!/^\d{5}$/.test(v)) return false;
  const n = Number(v);
  return n >= 10115 && n <= 14199 && n !== 12529;
}

/** The 96 official Berlin Ortsteile, German names, sorted. */
export const BERLIN_ORTSTEILE: readonly string[] = [
  // Mitte
  'Mitte', 'Moabit', 'Hansaviertel', 'Tiergarten', 'Wedding', 'Gesundbrunnen',
  // Friedrichshain-Kreuzberg
  'Friedrichshain', 'Kreuzberg',
  // Pankow
  'Prenzlauer Berg', 'Weißensee', 'Blankenburg', 'Heinersdorf', 'Karow', 'Stadtrandsiedlung Malchow', 'Pankow', 'Blankenfelde', 'Buch', 'Französisch Buchholz', 'Niederschönhausen', 'Rosenthal', 'Wilhelmsruh',
  // Charlottenburg-Wilmersdorf
  'Charlottenburg', 'Wilmersdorf', 'Schmargendorf', 'Grunewald', 'Westend', 'Charlottenburg-Nord', 'Halensee',
  // Spandau
  'Spandau', 'Haselhorst', 'Siemensstadt', 'Staaken', 'Gatow', 'Kladow', 'Hakenfelde', 'Falkenhagener Feld', 'Wilhelmstadt',
  // Steglitz-Zehlendorf
  'Steglitz', 'Lichterfelde', 'Lankwitz', 'Zehlendorf', 'Dahlem', 'Nikolassee', 'Wannsee',
  // Tempelhof-Schöneberg
  'Schöneberg', 'Friedenau', 'Tempelhof', 'Mariendorf', 'Marienfelde', 'Lichtenrade',
  // Neukölln
  'Neukölln', 'Britz', 'Buckow', 'Rudow', 'Gropiusstadt',
  // Treptow-Köpenick
  'Alt-Treptow', 'Plänterwald', 'Baumschulenweg', 'Johannisthal', 'Niederschöneweide', 'Altglienicke', 'Adlershof', 'Bohnsdorf', 'Oberschöneweide', 'Köpenick', 'Friedrichshagen', 'Rahnsdorf', 'Grünau', 'Müggelheim', 'Schmöckwitz',
  // Marzahn-Hellersdorf
  'Marzahn', 'Biesdorf', 'Kaulsdorf', 'Mahlsdorf', 'Hellersdorf',
  // Lichtenberg
  'Friedrichsfelde', 'Karlshorst', 'Lichtenberg', 'Falkenberg', 'Malchow', 'Wartenberg', 'Neu-Hohenschönhausen', 'Alt-Hohenschönhausen', 'Fennpfuhl', 'Rummelsburg',
  // Reinickendorf
  'Reinickendorf', 'Tegel', 'Konradshöhe', 'Heiligensee', 'Frohnau', 'Hermsdorf', 'Waidmannslust', 'Lübars', 'Wittenau', 'Märkisches Viertel', 'Borsigwalde',
].sort((a, b) => a.localeCompare(b, 'de'));
