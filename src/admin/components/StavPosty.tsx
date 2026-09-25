'use client';

/**
 * BUDÍČEK POŠTY — pruh nad obsahom administrácie.
 *
 * Odosielanie e-mailov je tichá časť webu: kým ho niekto nepotrebuje, nikto
 * nevie, že nefunguje. A potrebuje ho práve ten, kto sa nevie prihlásiť —
 * teda človek, ktorý už nemá ako dať vedieť. Preto sa stav pošty ukazuje
 * tam, kde správca beztak je.
 *
 * Keď je všetko v poriadku, pruh sa nevykreslí. Nič sa nehlási do prázdna.
 */

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { strapiFetch } from '../api/client';

interface Stav {
  smtp: { ok: boolean; kedy: string; sprava: string };
  caka: number;
  zlyhali: number;
  poslednaChyba: string | null;
  nahradnyOdosielatel: string | null;
  poplach: boolean;
}

export function StavPosty({ token }: { token: string }) {
  const [stav, setStav] = useState<Stav | null>(null);

  useEffect(() => {
    let zrusene = false;
    const nacitaj = () =>
      strapiFetch<Stav>('/api/account/stav-posty', { token })
        .then((s) => { if (!zrusene) setStav(s); })
        .catch(() => { /* nedostupný stav nie je dôvod na poplach v pruhu */ });

    nacitaj();
    // Raz za päť minút stačí: výpadok pošty nie je vec sekúnd.
    const t = setInterval(nacitaj, 5 * 60_000);
    return () => { zrusene = true; clearInterval(t); };
  }, [token]);

  if (!stav || !stav.poplach) return null;

  const dovody: string[] = [];
  if (!stav.smtp.ok) dovody.push(`server sa nevie prihlásiť na SMTP (${stav.smtp.sprava})`);
  if (stav.zlyhali > 0) dovody.push(`${stav.zlyhali} správ sa nepodarilo doručiť ani po piatich pokusoch`);
  if (stav.caka > 0) dovody.push(`${stav.caka} čaká vo fronte na ďalší pokus`);

  return (
    <div className="ad-poplach" role="status">
      <AlertTriangle style={{ width: 18, height: 18, flexShrink: 0 }} />
      <div>
        <strong>Odosielanie e-mailov nefunguje správne.</strong>{' '}
        {dovody.join(' · ')}.
        {!stav.nahradnyOdosielatel && (
          <> Náhradný odosielateľ nie je nastavený — kým sa hlavný neopraví, e-maily nepôjdu von.</>
        )}
        {stav.poslednaChyba && (
          <div className="ad-poplach-detail">Posledná chyba: {stav.poslednaChyba}</div>
        )}
      </div>
    </div>
  );
}

export default StavPosty;
