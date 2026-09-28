/**
 * Zostavenie APK pre Android.
 *
 * Prečo vlastný skript a nie jeden riadok v `package.json`: obal Gradle sa
 * na Windowse volá `gradlew.bat` a inde `./gradlew`, a npm na Windowse
 * spúšťa skripty cez `cmd`, ktorý `gradlew.bat` bez predpony `.\` nenájde
 * vôbec. Jeden riadok by teda fungoval len na jednom počítači.
 *
 * `ANDROID_HOME` sa tu nenastavuje — cestu k SDK berie Gradle
 * z `android/local.properties`, ktorý je pre každý počítač vlastný a do
 * gitu nepatrí.
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const KOREN = path.resolve(process.cwd(), 'android');
const jeWindows = process.platform === 'win32';
const obal = path.join(KOREN, jeWindows ? 'gradlew.bat' : 'gradlew');

if (!fs.existsSync(obal)) {
  console.error('[app] chýba priečinok `android` — najprv `npx cap add android`.');
  process.exit(1);
}
if (!fs.existsSync(path.join(KOREN, 'local.properties'))) {
  console.error('[app] chýba `android/local.properties` so `sdk.dir`.');
  console.error('      Napríklad: sdk.dir=C\\:/Users/<meno>/Android/Sdk');
  process.exit(1);
}

/**
 * Číslo verzie je na dvoch miestach: v `build.gradle` (to sa nainštaluje do
 * telefónu) a v `src/data/aplikacia.ts` (to vidí človek na stránke). Keby si
 * prestali sedieť, stránka by ponúkala niečo iné, než by sa nainštalovalo —
 * preto to tu radšej zastavíme, než by sme vydali klamúcu stránku.
 */
function skontrolujVerzie() {
  const gradle = fs.readFileSync(path.join(KOREN, 'app/build.gradle'), 'utf8');
  const vGradle = gradle.match(/versionName[ ]+"([^"]+)"/)?.[1];
  const web = fs.readFileSync(path.resolve(process.cwd(), 'src/data/aplikacia.ts'), 'utf8');
  const vWeb = web.match(/verzia:[ ]*'([^']+)'/)?.[1];
  if (!vGradle || !vWeb) {
    console.error('[app] nedá sa prečítať verzia z build.gradle alebo src/data/aplikacia.ts.');
    process.exit(1);
  }
  if (vGradle !== vWeb) {
    console.error(`[app] verzie si nesedia: build.gradle ${vGradle}, stránka ${vWeb}.`);
    console.error('      Zjednoť ich (obe miesta) a spusti znova.');
    process.exit(1);
  }
  return vWeb;
}

const verziaApp = skontrolujVerzie();

const ulohy = process.argv.slice(2);
const proces = spawn(obal, ulohy.length ? ulohy : ['assembleDebug'], {
  cwd: KOREN,
  stdio: 'inherit',
  shell: jeWindows,
});

proces.on('exit', (kod) => {
  if (kod === 0) {
    /* Podľa úlohy sa APK rodí inde — `assembleRelease` do `release/`. */
    const jeVydanie = (ulohy.length ? ulohy : ['assembleDebug']).some((u) => /release/i.test(u));
    const apk = path.join(
      KOREN,
      jeVydanie ? 'app/build/outputs/apk/release/app-release.apk' : 'app/build/outputs/apk/debug/app-debug.apk'
    );
    if (fs.existsSync(apk)) {
      const mb = fs.statSync(apk).size / 1024 / 1024;
      console.log(`\n[app] hotovo: ${apk} (${mb.toFixed(1)} MB), verzia ${verziaApp}`);
      /* Veľkosť na stránke má byť zaokrúhlená nahor a nie o 10 MB mimo. */
      const naStranke = Number(
        fs.readFileSync(path.resolve(process.cwd(), 'src/data/aplikacia.ts'), 'utf8').match(/velkostMB:[ ]*([0-9]+)/)?.[1] ?? 0
      );
      if (Math.abs(naStranke - mb) > 3) {
        console.warn(`[app] POZOR: stránka uvádza ${naStranke} MB, súbor má ${mb.toFixed(1)} MB — uprav src/data/aplikacia.ts.`);
      }
    }
  }
  process.exit(kod ?? 1);
});
