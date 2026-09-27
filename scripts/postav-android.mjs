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

const ulohy = process.argv.slice(2);
const proces = spawn(obal, ulohy.length ? ulohy : ['assembleDebug'], {
  cwd: KOREN,
  stdio: 'inherit',
  shell: jeWindows,
});

proces.on('exit', (kod) => {
  if (kod === 0) {
    const apk = path.join(KOREN, 'app/build/outputs/apk/debug/app-debug.apk');
    if (fs.existsSync(apk)) {
      const mb = (fs.statSync(apk).size / 1024 / 1024).toFixed(1);
      console.log(`\n[app] hotovo: ${apk} (${mb} MB)`);
    }
  }
  process.exit(kod ?? 1);
});
