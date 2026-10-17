/**
 * Načítanie TypeScript modulov webu do Node skriptov (prevod, testy).
 *
 * Projekt nemá tsx ani ts-node; esbuild je v node_modules ako závislosť Vite.
 * Modul sa zbalí so všetkými importmi do jedného ESM súboru v `vystup/.ts/`
 * a ten sa importuje. `import.meta.env` v Node neexistuje — `lib/api-adresa.ts`
 * vtedy vráti vývojovú adresu, čo skriptom nevadí (adresu API nepoužívajú).
 */
import { build } from 'esbuild';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const TU = dirname(fileURLToPath(import.meta.url));
export const KOREN = resolve(TU, '..', '..');

export async function nacitajTs(relCesta) {
  const vstup = join(KOREN, relCesta);
  const r = await build({
    entryPoints: [vstup], bundle: true, platform: 'node', format: 'esm', write: false,
    logLevel: 'silent', jsx: 'automatic', loader: { '.tsx': 'tsx', '.ts': 'ts' },
  });
  const priecinok = join(TU, 'vystup', '.ts');
  mkdirSync(priecinok, { recursive: true });
  const subor = join(priecinok, basename(relCesta).replace(/\.tsx?$/, '') + `.${Date.now()}.mjs`);
  writeFileSync(subor, r.outputFiles[0].text);
  return import(pathToFileURL(subor).href);
}
