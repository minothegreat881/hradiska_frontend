/**
 * NEMECKÝ SLOVNÍK ROZHRANIA.
 *
 * Kľúč je slovenský originál — rovnako ako v anglickom slovníku, ktorý žije
 * priamo v `jazyk.ts`. Nemčina má vlastný súbor preto, že je dvakrát
 * ukecanejšia a v jednom súbore by sa obe vetvy prestali dať čítať.
 *
 * PRAVIDLÁ (podrobne v `hradiska-strapi/docs/TERMINOLOGIA-DE.md`):
 *   • vykanie — `Sie`, nie tykanie;
 *   • odborné termíny podľa slovníka: hradisko → Burgwall, val → Wall,
 *     predhradie → Vorburg, Veľká Morava → Großmähren;
 *   • čísla a datovania sa neprepočítavajú, len sa píšu po nemecky
 *     (`v. Chr.`, `n. Chr.`, `9. Jahrhundert`, `m ü. M.`);
 *   • čo tu nie je, `t()` vráti po slovensky — nie prázdne miesto, nech je
 *     na prvý pohľad vidieť, čo ešte nie je preložené.
 */

export const DE: Record<string, string> = {
  'Občianske združenie venované slovanským hradiskám, hradom a zámkom Slovenska.':
    'Ein Verein, der sich den slawischen Burgwällen, Burgen und Schlössern der Slowakei widmet.',
  'Súhlas s cookies':
    'Cookie-Einwilligung',
  'Vyberte, ktoré cookies smú stráže použiť. Nevyhnutné potrebujeme na chod hradiska, o analytické vás slušne prosíme.':
    'Wählen Sie, welche Cookies die Wachen verwenden dürfen. Die notwendigen brauchen wir für den Betrieb des Burgwalls; um die zur Analyse bitten wir höflich.',
  'Držia brány otvorené — prihlásenie a zapamätanie tohto rozhodnutia. Bez nich hradisko nefunguje, preto sa nedajú vypnúť.':
    'Sie halten die Tore offen — die Anmeldung und das Merken genau dieser Entscheidung. Ohne sie funktioniert der Burgwall nicht, deshalb lassen sie sich nicht abschalten.',
  'Anonymne nám prezradia, z ktorého kmeňa prichádzate a ktoré články čítate — aby sme blog vylepšovali. Bez cookies tretích strán.':
    'Sie verraten uns anonym, aus welchem Stamm Sie kommen und welche Artikel Sie lesen — damit wir den Blog verbessern können. Keine Cookies von Dritten.',
  'Analytické cookies':
    'Analyse-Cookies',
  'Mapa hradísk':
    'Karte der Burgwälle',
  'Interaktívna mapa lokalít. Kliknutím do nej zapnete koliesko na približovanie, ťahaním posúvate — zhluky sa priblížením rozpadnú na jednotlivé body. Prejdením po bode otvoríte kartu lokality, klikom do mapy ju zavriete.':
    'Eine interaktive Karte der Fundstellen. Mit einem Klick hinein schalten Sie das Mausrad zum Zoomen frei, durch Ziehen verschieben Sie den Ausschnitt — die Gruppen zerfallen beim Heranzoomen in einzelne Punkte. Fahren Sie über einen Punkt, um die Karte der Fundstelle zu öffnen; ein Klick in die Karte schließt sie.',
  'Reliéf: Copernicus DEM · Rieky a názvy miest: © prispievatelia OpenStreetMap · Hranica: geoBoundaries':
    'Relief: Copernicus DEM · Flüsse und Ortsnamen: © OpenStreetMap-Mitwirkende · Grenze: geoBoundaries',
  'Posledná aktualizácia: 22. júla 2026':
    'Zuletzt aktualisiert: 22. Juli 2026',
  /* ── Činnosť združenia ─────────────────────────────────────────────── */
  'ČINNOSŤ': 'TÄTIGKEIT',
  'Činnosť združenia': 'Tätigkeit des Vereins',
  'Čo združenie robí': 'Was der Verein macht',
  'Knihy a zborníky': 'Bücher und Sammelbände',
  '2 % z daní': '2 % der Steuer',
  '3D rekonštrukcie': '3D-Rekonstruktionen',
  'Archeologické výskumy': 'Archäologische Ausgrabungen',
  'Výpravy a podujatia': 'Exkursionen und Veranstaltungen',
  'Prednášky a médiá': 'Vorträge und Medien',
  'Tabule, ktoré združenie vyrobilo a osadilo priamo pri hradiskách.':
    'Tafeln, die der Verein angefertigt und direkt an den Burgwällen aufgestellt hat.',
  'Dva zborníky „Hradiská — Svedkovia dávnych čias“, kniha Oživená archeológia a časopis Digitálne hradiská.':
    'Zwei Sammelbände „Hradiská — Svedkovia dávnych čias“ (Burgwälle — Zeugen alter Zeiten), das Buch Oživená archeológia und die Zeitschrift Digitálne hradiská.',
  'Výzvy, z čoho sa platia tabule, výskumy a tlač — a ako sa dá prispieť.':
    'Wovon die Tafeln, die Ausgrabungen und der Druck bezahlt werden — und wie Sie dazu beitragen können.',
  'Ako hradiská vyzerali, kým z nich ostali valy — modely, kresby a letecké pohľady.':
    'Wie die Burgwälle aussahen, bevor nur noch die Wälle übrig blieben — Modelle, Zeichnungen und Luftaufnahmen.',
  'Vlastné výskumy a prieskumy v teréne — od mikrosond po ohlásené nálezy.':
    'Eigene Ausgrabungen und Begehungen im Gelände — von Kleinschnitten bis zu gemeldeten Funden.',
  'Cesty za hradiskami doma aj v cudzine, plavby, brigády a živá história.':
    'Fahrten zu Burgwällen im In- und Ausland, Schifffahrten, Arbeitseinsätze und gelebte Geschichte.',
  'Prednášky v školách a kluboch, podcasty, rozhovory a diskusie.':
    'Vorträge in Schulen und Vereinen, Podcasts, Interviews und Diskussionen.',
  'zápisov v téme': 'Einträge zum Thema',
  'Celá kronika': 'Die ganze Chronik',
  'Tabule, ktoré združenie vyrobilo a osadilo priamo pri hradiskách — čo je na nich napísané, ako vznikali a kde ich v teréne nájdete.':
    'Tafeln, die der Verein angefertigt und direkt an den Burgwällen aufgestellt hat — was darauf steht, wie sie entstanden und wo Sie sie im Gelände finden.',

  /* ── Mapa: uvedenie zdrojov ────────────────────────────────────────── */
  'Satelitné snímky: Esri, Maxar, Earthstar Geographics · Názvy miest: © prispievatelia OpenStreetMap · Hranica: geoBoundaries':
    'Satellitenbilder: Esri, Maxar, Earthstar Geographics · Ortsnamen: © OpenStreetMap-Mitwirkende · Grenze: geoBoundaries',
  'Reliéf: Copernicus DEM · Rieky: © prispievatelia OpenStreetMap · Hranica: geoBoundaries':
    'Relief: Copernicus DEM · Flüsse: © OpenStreetMap-Mitwirkende · Grenze: geoBoundaries',
  'Satelitné snímky: Esri, Maxar, Earthstar Geographics · Názvy miest: © prispievatelia OpenStreetMap':
    'Satellitenbilder: Esri, Maxar, Earthstar Geographics · Ortsnamen: © OpenStreetMap-Mitwirkende',

  /* ── Účet, prihlásenie, registrácia ────────────────────────────────── */
  'Zrušiť blokovanie': 'Blockierung aufheben',
  'Neprišiel e-mail? Poslať znova': 'Keine E-Mail erhalten? Erneut senden',
  'Časová os zápisov': 'Zeitleiste der Einträge',
  'Prázdny odsek': 'Leerer Absatz',
  'E-mail overený. Teraz sa môžete prihlásiť.':
    'E-Mail bestätigt. Sie können sich jetzt anmelden.',
  'Heslo musí mať aspoň 6 znakov.': 'Das Passwort muss mindestens 6 Zeichen haben.',
  'Pre registráciu je potrebný súhlas so spracovaním údajov.':
    'Für die Registrierung ist Ihre Einwilligung in die Datenverarbeitung nötig.',
  'Účet vytvorený. Poslali sme vám overovací e-mail — kliknite na odkaz v ňom a potom sa prihláste.':
    'Konto angelegt. Wir haben Ihnen eine Bestätigungs-E-Mail geschickt — klicken Sie auf den Link darin und melden Sie sich anschließend an.',
  'Ak taký e-mail existuje, poslali sme naň odkaz na obnovu hesla.':
    'Falls es diese E-Mail-Adresse gibt, haben wir einen Link zum Zurücksetzen des Passworts geschickt.',
  'Heslo zmenené. Presmerúvam na prihlásenie…':
    'Passwort geändert. Weiterleitung zur Anmeldung …',
  'Niečo sa pokazilo.': 'Etwas ist schiefgelaufen.',
  'Prihlásenie': 'Anmeldung',
  'Vitajte späť v komunite': 'Willkommen zurück in der Gemeinschaft',
  'Registrácia': 'Registrierung',
  'Staňte sa členom a zapojte sa do diskusie':
    'Werden Sie Mitglied und diskutieren Sie mit',
  'Zabudnuté heslo': 'Passwort vergessen',
  'Pošleme vám odkaz na obnovu': 'Wir schicken Ihnen einen Link zum Zurücksetzen',
  'Nové heslo': 'Neues Passwort',
  'Zadajte nové heslo k svojmu účtu': 'Geben Sie ein neues Passwort für Ihr Konto ein',
  'Meno (zobrazí sa pri komentároch)': 'Name (erscheint bei den Kommentaren)',
  'Heslo': 'Passwort',
  'Súhlasím so spracovaním e-mailu na účely účtu a diskusie. Údaje neposkytujeme tretím stranám. Viac v':
    'Ich willige in die Verarbeitung meiner E-Mail-Adresse für Konto und Diskussion ein. Die Daten geben wir nicht an Dritte weiter. Mehr in der',
  'ochrane osobných údajov': 'Datenschutzerklärung',
  'Moment…': 'Einen Moment …',
  'Poslať odkaz': 'Link senden',
  'Zmeniť heslo': 'Passwort ändern',
  'Nemáte účet?': 'Noch kein Konto?',
  'Zaregistrujte sa': 'Registrieren Sie sich',
  'Zabudli ste heslo?': 'Passwort vergessen?',
  'Už máte účet?': 'Sie haben schon ein Konto?',
  'Späť na prihlásenie': 'Zurück zur Anmeldung',
  'Overovací e-mail sme poslali znova.':
    'Wir haben die Bestätigungs-E-Mail erneut geschickt.',
  'Keď mi niekto odpovie': 'Wenn mir jemand antwortet',
  'Keď niekto ocení môj príspevok': 'Wenn jemandem mein Beitrag gefällt',
  'Keď pribudne nový článok': 'Wenn ein neuer Artikel erscheint',
  'Posielať aj e-mailom': 'Auch per E-Mail senden',
  'Fotografiu sa nepodarilo nahrať. Skúste JPG alebo PNG.':
    'Das Foto konnte nicht hochgeladen werden. Versuchen Sie es mit JPG oder PNG.',
  'Upozornenia v zariadení sú vypnuté.': 'Benachrichtigungen auf dem Gerät sind aus.',
  'Upozornenia v zariadení sú zapnuté.': 'Benachrichtigungen auf dem Gerät sind an.',
  'Prehliadač má upozornenia zakázané. Povolíte ich v jeho nastaveniach pre túto stránku.':
    'Der Browser blockiert Benachrichtigungen. Sie erlauben sie in dessen Einstellungen für diese Seite.',
  'Upozornenia sa nepodarilo zapnúť.': 'Die Benachrichtigungen ließen sich nicht einschalten.',
  'Účet sa nepodarilo zrušiť. Skúste to prosím znova.':
    'Das Konto konnte nicht gelöscht werden. Bitte versuchen Sie es noch einmal.',
  'Ako sa podpisujem': 'Wie ich unterschreibe',
  'Zobrazené meno': 'Angezeigter Name',
  'Pod týmto menom vás uvidia ostatní pri príspevkoch. E-mail':
    'Unter diesem Namen sehen Sie die anderen bei den Beiträgen. Die E-Mail-Adresse',
  'zostáva skrytý.': 'bleibt verborgen.',
  'Fotografia': 'Foto',
  'Zmeniť fotografiu': 'Foto ändern',
  'Nahrať fotografiu': 'Foto hochladen',
  'Kedy mi dať vedieť': 'Wann Sie mir Bescheid geben sollen',
  'Upozorniť priamo v zariadení': 'Direkt auf dem Gerät benachrichtigen',
  'Uložiť zmeny': 'Änderungen speichern',
  'Zablokovaní členovia': 'Blockierte Mitglieder',
  'Nikoho nemáte zablokovaného. Zablokovať člena sa dá pri jeho príspevku, cez „Nahlásiť".':
    'Sie haben niemanden blockiert. Ein Mitglied blockieren Sie bei seinem Beitrag über „Melden“.',
  'Príspevky týchto členov sa vám nezobrazujú. Oni o tom nevedia a ostatným sa ich príspevky ukazujú ďalej.':
    'Die Beiträge dieser Mitglieder werden Ihnen nicht angezeigt. Sie erfahren davon nichts und für die anderen bleiben ihre Beiträge sichtbar.',
  'Účet č.': 'Konto Nr.',
  'Zrušenie účtu': 'Konto löschen',
  'Zrušiť účet': 'Konto löschen',
  'Ponechať účet': 'Konto behalten',
  'Zmazať natrvalo': 'Endgültig löschen',
  'Účet sa zmaže natrvalo. Vaše príspevky zostanú v diskusiách podpísané ako':
    'Das Konto wird endgültig gelöscht. Ihre Beiträge bleiben in den Diskussionen, unterschrieben als',
  'Zmazaný účet': 'Gelöschtes Konto',
  'Vrátiť sa to nedá.': 'Das lässt sich nicht rückgängig machen.',

  /* ── Prehľad lokalít, kraje, datovanie ─────────────────────────────── */
  'z toho': 'davon',
  'zobrazených': 'angezeigt',
  'lokalita': 'Fundstelle',
  'lokalitu': 'Fundstelle',
  'lokalít': 'Fundstellen',
  'Kraj': 'Region',
  'Datovanie': 'Datierung',
  'Zoskupiť podľa': 'Gruppieren nach',
  'V tejto kategórii zatiaľ nie sú lokality.':
    'In dieser Kategorie gibt es noch keine Fundstellen.',
  'Zavrieť prehľad': 'Übersicht schließen',
  'Typy hradísk': 'Arten von Burgwällen',
  'Hľadať hradisko, obec alebo okres': 'Burgwall, Gemeinde oder Bezirk suchen',
  'Hľadať v kategórii': 'In der Kategorie suchen',
  'Načítavam zoznam…': 'Liste wird geladen …',
  'Nič sa nenašlo. Skúste obec alebo okres.':
    'Nichts gefunden. Versuchen Sie es mit einer Gemeinde oder einem Bezirk.',
  'Prehľad kategórie': 'Übersicht der Kategorie',
  'Bratislavský': 'Region Bratislava',
  'Trnavský': 'Region Trnava',
  'Trenčiansky': 'Region Trenčín',
  'Nitriansky': 'Region Nitra',
  'Žilinský': 'Region Žilina',
  'Banskobystrický': 'Region Banská Bystrica',
  'Prešovský': 'Region Prešov',
  'Košický': 'Region Košice',
  'Mimo Slovenska': 'Außerhalb der Slowakei',
  'Doba bronzová': 'Die Bronzezeit',
  'Doba laténska': 'Die Latènezeit',
  'Doba rímska': 'Die römische Kaiserzeit',
  '6.–7. storočie': '6.–7. Jahrhundert',
  '8.–9. storočie': '8.–9. Jahrhundert',
  '9. storočie': '9. Jahrhundert',
  '9.–10. storočie': '9.–10. Jahrhundert',
  '10.–11. storočie': '10.–11. Jahrhundert',
  '11.–13. storočie': '11.–13. Jahrhundert',
  'Bez udania': 'Ohne Angabe',
  'Ostatné články': 'Weitere Artikel',
  'Lokalita bola predmetom systematického archeologického výskumu v priebehu posledných desaťročí. Výskumy priniesli významné poznatky o osídlení v jednotlivých obdobiach a prispeli k pochopeniu kultúrneho vývoja regiónu.':
    'Die Fundstelle war in den letzten Jahrzehnten Gegenstand systematischer archäologischer Ausgrabungen. Diese brachten wichtige Erkenntnisse über die Besiedlung in den einzelnen Zeitabschnitten und trugen zum Verständnis der kulturellen Entwicklung der Region bei.',
  'patrí medzi významné archeologické lokality na Slovensku. Nálezy z tejto lokality sú vystavené v múzeách a sú predmetom odborných štúdií. Lokalita prispieva k poznaniu dejín osídlenia a kultúrneho vývoja na našom území.':
    'zählt zu den bedeutenden archäologischen Fundstellen der Slowakei. Die Funde von hier sind in Museen ausgestellt und Gegenstand wissenschaftlicher Studien. Die Fundstelle trägt zur Kenntnis der Siedlungsgeschichte und der kulturellen Entwicklung in unserem Gebiet bei.',
  'Zatiaľ žiadny obsah': 'Noch kein Inhalt',
  'V tejto kategórii zatiaľ nemáme pridané žiadne články. Pracujeme na pridávaní nového obsahu.':
    'In dieser Kategorie haben wir noch keine Artikel. Wir arbeiten daran.',
  'Preskúmať iné kategórie': 'Andere Kategorien ansehen',

  /* ── Diskusia, profil, kronika používateľa ─────────────────────────── */
  'Fotografia je zmenená.': 'Das Foto wurde geändert.',
  'k fotografii': 'zum Foto',
  'upravené': 'bearbeitet',
  'sa ozval': 'hat sich gemeldet',
  'odpovedal na váš komentár': 'hat auf Ihren Kommentar geantwortet',
  'čitateľov': 'Leser',
  'ocenil váš komentár': 'gefällt Ihr Kommentar',
  'ocenil váš komentár k fotografii': 'gefällt Ihr Kommentar zum Foto',
  'Kronika': 'Chronik',
  'mesiac v kronike': 'Monat in der Chronik',
  'mesiacov v kronike': 'Monate in der Chronik',
  'rok v kronike': 'Jahr in der Chronik',
  'rokov v kronike': 'Jahre in der Chronik',
  'Ozvalo sa': 'Rückmeldungen',
  'Moje príspevky': 'Meine Beiträge',
  'Odložené': 'Gemerkt',
  'Moje fotografie': 'Meine Fotos',
  'Nastavenia': 'Einstellungen',
  'príspevkov': 'Beiträge',
  'Zatiaľ sa nikto neozval. Záznam pribudne, keď niekto odpovie na váš príspevok alebo ho ocení.':
    'Bisher hat sich niemand gemeldet. Ein Eintrag erscheint, sobald jemand auf Ihren Beitrag antwortet oder ihm etwas daran gefällt.',
  'pred chvíľou': 'gerade eben',
  'Môj profil': 'Mein Profil',
  'Nastavenia účtu': 'Kontoeinstellungen',
  'Odhlásiť sa': 'Abmelden',
  'Vaše príspevky pred zverejnením číta správca.':
    'Ihre Beiträge liest vor der Veröffentlichung eine Moderatorin oder ein Moderator.',
  'Časti profilu': 'Bereiche des Profils',
  'Zatiaľ ste nič nenapísali. Do diskusie sa dá zapojiť pod každým článkom.':
    'Sie haben noch nichts geschrieben. Mitdiskutieren können Sie unter jedem Artikel.',
  'Zatiaľ ste si nič neodložili. Článok sa odkladá srdcom v jeho hlavičke.':
    'Sie haben noch nichts gemerkt. Einen Artikel merken Sie sich mit dem Herz in seinem Kopf.',
  'Úpravu sa nepodarilo uložiť. Skúste to prosím znova.':
    'Die Änderung konnte nicht gespeichert werden. Bitte versuchen Sie es noch einmal.',
  'Zmazať tento príspevok? Nedá sa to vrátiť.':
    'Diesen Beitrag löschen? Das lässt sich nicht rückgängig machen.',
  'Príspevok sa nepodarilo zmazať. Skúste to prosím znova.':
    'Der Beitrag konnte nicht gelöscht werden. Bitte versuchen Sie es noch einmal.',
  'Zmeny sa nepodarilo uložiť. Skúste to prosím znova.':
    'Die Änderungen konnten nicht gespeichert werden. Bitte versuchen Sie es noch einmal.',
  'Uložené.': 'Gespeichert.',
  'Odpoveď': 'Antwort',
  'Nový článok': 'Neuer Artikel',
  'Otvoriť fotografiu': 'Foto öffnen',
  'Zobraziť v diskusii': 'In der Diskussion anzeigen',
  'Správca': 'Moderation',
  'Znenie príspevku': 'Wortlaut des Beitrags',
  'Uložiť zmenu': 'Änderung speichern',
  'Upraviť': 'Bearbeiten',
  'Poslané ďalej': 'Weitergeleitet',
  'čaká na schválenie': 'wartet auf Freigabe',
  'nahlásený': 'gemeldet',
  'skrytý': 'verborgen',
  'odstránený': 'entfernt',
  'odpovedal na váš komentár k fotografii': 'hat auf Ihren Kommentar zum Foto geantwortet',
  'upozorňuje na nedodržanie pravidiel diskusie':
    'weist auf einen Verstoß gegen die Diskussionsregeln hin',
  'pribudol nový článok': 'es ist ein neuer Artikel erschienen',
  'pod článkom': 'unter dem Artikel',

  /* ── Stránka lokality ──────────────────────────────────────────────── */
  'Lokalita nenájdená': 'Fundstelle nicht gefunden',
  'Späť na vyhľadávanie': 'Zurück zur Suche',
  'Prehľad': 'Überblick',
  'Nálezy': 'Funde',
  'Obrázky': 'Bilder',
  'Archeologicky skúmané': 'Archäologisch untersucht',
  'História výskumu': 'Forschungsgeschichte',
  'Význam lokality': 'Bedeutung der Fundstelle',
  'Archeologické nálezy': 'Archäologische Funde',
  'Externý odkaz': 'Externer Link',
  'GPS súradnice': 'GPS-Koordinaten',
  'Zemepisná šírka': 'Geografische Breite',
  'Zemepisná dĺžka': 'Geografische Länge',
  'Artefakt objavený počas archeologického výskumu lokality.':
    'Bei der archäologischen Ausgrabung der Fundstelle entdecktes Artefakt.',
  'Články a štúdie': 'Artikel und Studien',
  'Odborné publikácie a výskum': 'Fachpublikationen und Forschung',
  'Zobraziť všetky výsledky': 'Alle Ergebnisse anzeigen',
  'Výpravy, obnovy tabúľ, prednášky a nálezy.':
    'Exkursionen, erneuerte Tafeln, Vorträge und Funde.',
  'Vybraná': 'Ausgewählt',
  'Načítavam administráciu…': 'Verwaltung wird geladen …',
  'Obrázok sa nepodarilo načítať': 'Das Bild konnte nicht geladen werden',
  'Populárne hradiská': 'Beliebte Burgwälle',
  'Video zatiaľ nemá adresu': 'Das Video hat noch keine Adresse',
  'Satelitné snímky: Esri, Maxar, Earthstar Geographics':
    'Satellitenbilder: Esri, Maxar, Earthstar Geographics',

  /* ── Popisy kategórií ──────────────────────────────────────────────── */
  'Sídla veľkomoravských kniežat a vládcov — Nitra, Mikulčice, Blatnohrad. Miesta, kde sa spájala politická moc s hospodárstvom a kde vyrastali prvé kamenné kostoly na našom území.':
    'Sitze der großmährischen Fürsten und Herrscher — Nitra (Neutra), Mikulčice, Mosaburg. Orte, an denen sich politische Macht mit Wirtschaft verband und an denen die ersten steinernen Kirchen unseres Gebietes entstanden.',
  'Správne a vojenské strediská, ktoré držali pod kontrolou celé územné celky. Okrem slovenských lokalít sem patria aj hradiská Slávnikovcov v Čechách a slovanské centrá v dnešnom Nemecku.':
    'Verwaltungs- und Militärzentren, die ganze Landschaften kontrollierten. Neben slowakischen Fundstellen gehören dazu auch die Burgwälle der Slavnikiden in Böhmen und slawische Zentren im heutigen Deutschland.',
  'Najpočetnejšia skupina — hradiská, ktoré strážili priesmyky, brody a obchodné cesty alebo slúžili remeslu. Práve tu vidno, ako hustou sieťou bolo územie pokryté.':
    'Die größte Gruppe — Burgwälle, die Pässe, Furten und Handelswege bewachten oder dem Handwerk dienten. Gerade hier zeigt sich, wie dicht das Netz über dem Land lag.',
  'Útočištné hradiská, kam sa obyvateľstvo sťahovalo v čase nebezpečenstva. Bývajú menšie, ťažko prístupné a bez stôp trvalého osídlenia — obývali sa len keď bolo treba.':
    'Fliehburgen, in die sich die Bevölkerung in Zeiten der Gefahr zurückzog. Sie sind meist kleiner, schwer zugänglich und ohne Spuren dauerhafter Besiedlung — bewohnt wurden sie nur, wenn es nötig war.',
  'Opevnené sídla z čias pred príchodom Slovanov — doba bronzová, halštat, keltské oppidá a púchovská kultúra. Mnohé z nich Slovania neskôr osídlili znova.':
    'Befestigte Siedlungen aus der Zeit vor der Ankunft der Slawen — Bronzezeit, Hallstattzeit, keltische Oppida und Púchov-Kultur. Viele davon besiedelten die Slawen später erneut.',
  'Dobové pramene, z ktorých o hradiskách vieme — Fuldské anály, Bavorský geograf, listiny a antickí autori. Texty aj s prekladom a zaradením do kontextu.':
    'Zeitgenössische Quellen, aus denen wir von den Burgwällen wissen — die Fuldaer Annalen, der Bayerische Geograph, Urkunden und antike Autoren. Die Texte mit Übersetzung und Einordnung.',
  'Legendy a ústne podania viazané na hradiská — bohovia, zakliate poklady, zaniknuté hrady. Ľudová pamäť miest, ktorá často prežila dlhšie než ich múry.':
    'Sagen und mündliche Überlieferungen zu den Burgwällen — Götter, verwunschene Schätze, verschwundene Burgen. Das Gedächtnis der Orte, das oft länger überdauerte als ihre Mauern.',
  'Kultové miesta pohanské aj kresťanské — obetiská, mohylníky, posvätné háje a najstaršie stojace kostoly. Vrátane mytológie a pohrebných zvyklostí Slovanov.':
    'Kultplätze, heidnische wie christliche — Opferplätze, Hügelgräberfelder, heilige Haine und die ältesten erhaltenen Kirchen. Einschließlich der Mythologie und der Bestattungssitten der Slawen.',
  'Články, ktoré sa neviažu na jednu lokalitu — konštrukcia valov, remeslá, vojenstvo, každodenný život a širšie dejinné súvislosti slovanského osídlenia.':
    'Artikel, die nicht an eine einzelne Fundstelle gebunden sind — Wallkonstruktionen, Handwerk, Kriegswesen, Alltag und die größeren historischen Zusammenhänge der slawischen Besiedlung.',
  'Vizuálne rekonštrukcie hradísk — 3D modely, kresby opevnení a brán, letecké pohľady. Ukazujú, ako miesta pravdepodobne vyzerali, kým z nich ostali len valy.':
    'Visuelle Rekonstruktionen der Burgwälle — 3D-Modelle, Zeichnungen von Befestigungen und Toren, Luftaufnahmen. Sie zeigen, wie die Orte vermutlich aussahen, bevor nur die Wälle übrig blieben.',
  'Archeologické výskumy, štúdie a state odborníkov — nálezové správy, rozbory lokalít a príspevky, ktoré idú hlbšie než populárny výklad.':
    'Archäologische Ausgrabungen, Studien und Fachbeiträge — Fundberichte, Analysen von Fundstellen und Texte, die tiefer gehen als eine populäre Darstellung.',
  'Kronika činnosti združenia od roku 2010 — brigády, prednášky, publikácie, výskumy a podujatia. Čo sme robili a čo nás čaká.':
    'Die Chronik des Vereins seit 2010 — Arbeitseinsätze, Vorträge, Publikationen, Ausgrabungen und Veranstaltungen. Was wir getan haben und was ansteht.',

  /* ── Hľadanie, chyby, kronika ──────────────────────────────────────── */
  'Nepodarilo sa načítať články. Skúste to prosím neskôr.':
    'Die Artikel konnten nicht geladen werden. Bitte versuchen Sie es später.',
  'Návrat na domovskú stránku': 'Zurück zur Startseite',
  'Výsledky vyhľadávania': 'Suchergebnisse',
  'Nič sme nenašli. Skúste iné alebo všeobecnejšie slovo.':
    'Wir haben nichts gefunden. Versuchen Sie ein anderes oder allgemeineres Wort.',
  'Načítavam článok…': 'Artikel wird geladen …',
  'Zápisy sa nepodarilo načítať. Skúste to prosím o chvíľu znova.':
    'Die Einträge konnten nicht geladen werden. Bitte versuchen Sie es gleich noch einmal.',
  'bez dátumu': 'ohne Datum',
  'Kronika združenia': 'Chronik des Vereins',
  'Zatiaľ tu nie je ani jeden zápis.': 'Hier gibt es noch keinen einzigen Eintrag.',
  'začiatok kroniky': 'Anfang der Chronik',
  'zápisov': 'Einträge',
  'rok': 'Jahr',
  'rokov': 'Jahre',
  'Táto stránka sa nenašla': 'Diese Seite wurde nicht gefunden',
  'Odkaz je možno starý alebo neúplný. Skúste hľadať konkrétne hradisko, alebo sa vráťte na úvod.':
    'Der Link ist womöglich alt oder unvollständig. Suchen Sie nach einem bestimmten Burgwall oder kehren Sie zur Startseite zurück.',
  'Na úvod': 'Zur Startseite',
  'Vyhľadávanie': 'Suche',
  'Stránka sa nenašla (404) — Hradiská.sk': 'Seite nicht gefunden (404) — Hradiská.sk',
  'Pre': 'Für',
  'hľadám…': 'suche …',
  'výsledok': 'Ergebnis',
  'výsledkov': 'Ergebnisse',
  'Zadajte hľadaný výraz v poli vyhľadávania.': 'Geben Sie einen Suchbegriff in das Suchfeld ein.',

  /* ── Aplikácia do telefónu ─────────────────────────────────────────── */
  'Aplikácia': 'App',
  'Hradiská vo vrecku': 'Burgwälle in der Hosentasche',
  'Celá encyklopédia aj s mapou v aplikácii, ktorú si nainštalujete do telefónu. Obsah je ten istý ako na webe a dopĺňa sa sám.':
    'Die ganze Enzyklopädie samt Karte in einer App, die Sie auf Ihrem Telefon installieren. Der Inhalt ist derselbe wie auf der Website und hält sich selbst aktuell.',
  'verzia': 'Version',
  'Stiahnuť aplikáciu': 'App herunterladen',
  'Aplikácia zatiaľ nie je v Google Play, preto sa telefón pri inštalácii spýta, či súboru veríte — potvrďte':
    'Die App ist noch nicht bei Google Play, deshalb fragt das Telefon bei der Installation, ob Sie der Datei vertrauen — bestätigen Sie',
  'Inštalovať aj tak': 'Trotzdem installieren',
  'Je podpísaná združením a nič iné do telefónu nepridá.':
    'Sie ist vom Verein signiert und bringt nichts weiter auf Ihr Telefon.',
  'web na plochu': 'Website auf den Startbildschirm',
  'Apple dovoľuje inštalovať aplikácie iba cez App Store a my tam ísť nechceme. Na iPhone si preto web pridajte na plochu — otvorí sa na celú obrazovku, s vlastnou ikonou, ako aplikácia:':
    'Apple erlaubt die Installation von Apps nur über den App Store, und dorthin wollen wir nicht. Legen Sie sich die Website auf dem iPhone deshalb auf den Startbildschirm — sie öffnet sich im Vollbild, mit eigenem Symbol, wie eine App:',
  'V Safari klepnite na': 'Tippen Sie in Safari auf',
  '(štvorček so šípkou nahor).': '(das Quadrat mit dem Pfeil nach oben).',
  'Vyberte': 'Wählen Sie',
  'Pridať na plochu': 'Zum Home-Bildschirm',
  'Potvrďte': 'Bestätigen Sie',
  'Pridať': 'Hinzufügen',
  'Čo aplikácia vie navyše': 'Was die App zusätzlich kann',
  'Funguje aj bez signálu': 'Sie funktioniert auch ohne Empfang',
  'Mapa hradísk je celá v aplikácii. V teréne, kde nechytá dáta, ju otvoríte rovnako ako doma.':
    'Die Karte der Burgwälle steckt vollständig in der App. Im Gelände, wo kein Netz ist, öffnen Sie sie genauso wie zu Hause.',
  'Hradiská v okolí': 'Burgwälle in der Nähe',
  'Aplikácia vie, kde stojíte, a ukáže, čo máte na dosah.':
    'Die App weiß, wo Sie stehen, und zeigt, was in Reichweite liegt.',
  'Upozornenia': 'Benachrichtigungen',
  'Keď na váš komentár niekto odpovie alebo pribudne nový článok, dozviete sa to hneď.':
    'Wenn jemand auf Ihren Kommentar antwortet oder ein neuer Artikel erscheint, erfahren Sie es sofort.',
  'Bez reklám a sledovania': 'Ohne Werbung und Tracking',
  'To isté, čo web — nič navyše nezbiera.':
    'Dasselbe wie die Website — mehr wird nicht erhoben.',
  'Aplikácia sa aktualizuje sama: nové verzie webu si stiahne na pozadí a nabudúce sa otvorí už s nimi — nemusíte na nič klikať ani nič inštalovať znova. Aplikáciu vydáva OZ Hradiská. Na čo natrafíte, napíšte v diskusii pod ktorýmkoľvek článkom — čítame to.':
    'Die App hält sich selbst aktuell: neue Fassungen der Website lädt sie im Hintergrund und öffnet sich beim nächsten Mal schon damit — Sie müssen nichts anklicken und nichts neu installieren. Herausgeber der App ist der Verein OZ Hradiská. Worauf Sie stoßen, schreiben Sie in die Diskussion unter einem beliebigen Artikel — wir lesen mit.',

  /* ── Fotoarchív ────────────────────────────────────────────────────── */
  'Fotoarchív': 'Fotoarchiv',
  'Zbierka': 'Sammlung',
  'Snímky z hradísk, výprav a nálezov — tak, ako prišli k jednotlivým článkom.':
    'Aufnahmen von Burgwällen, Exkursionen und Funden — so, wie sie zu den einzelnen Artikeln kamen.',
  'fotografií': 'Fotos',
  'článok': 'Artikel',
  'článkov': 'Artikel',
  'Zúžiť podľa článku': 'Nach Artikel eingrenzen',
  'Všetko': 'Alles',
  'Zatiaľ tu nie je ani jedna fotografia.': 'Hier gibt es noch kein einziges Foto.',
  'Načítať ďalšie': 'Weitere laden',
  'Fotografie sa nepodarilo načítať. Skúste to prosím o chvíľu znova.':
    'Die Fotos konnten nicht geladen werden. Bitte versuchen Sie es gleich noch einmal.',
  'Omrvinky': 'Brotkrumen',
  'Kategória nebola nájdená': 'Kategorie nicht gefunden',

  /* ── Domovská stránka ──────────────────────────────────────────────── */
  'Encyklopédia hradísk Slovenska': 'Enzyklopädie der Burgwälle der Slowakei',
  'Ďalší obsah': 'Weitere Inhalte',
  'KRONIKA': 'CHRONIK',
  'Zo života združenia': 'Aus dem Leben des Vereins',
  'Pramene a tradícia': 'Quellen und Überlieferung',
  'hradísk': 'Burgwälle',
  'prameňov': 'Quellen',
  'textov': 'Texte',
  'povestí': 'Sagen',
  'svätýň': 'Heiligtümer',
  'Nájdi hradisko vo svojom okolí': 'Finden Sie einen Burgwall in Ihrer Nähe',
  'Populárne:': 'Beliebt:',
  'Článok': 'Artikel',
  'Hľadať': 'Suchen',
  'Hľadám…': 'Suche …',
  'Hľadaj hradiská…': 'Burgwälle suchen …',
  'Hľadaj hradiská, články, kľúčové slová…': 'Burgwälle, Artikel, Stichwörter suchen …',
  'Vyhľadávanie lokalít a článkov': 'Suche nach Fundstellen und Artikeln',
  'Vymazať vyhľadávanie': 'Suche löschen',
  'Nenašli sme nič pre': 'Wir haben nichts gefunden für',
  'Novšie zápisy': 'Neuere Einträge',
  'Staršie zápisy': 'Ältere Einträge',
  'CELÁ KRONIKA': 'DIE GANZE CHRONIK',
  'CELÁ GALÉRIA': 'DIE GANZE GALERIE',
  'ZÁPISY Z AKTIVÍT': 'EINTRÄGE ZU UNSERER ARBEIT',
  'VYBRANÁ FOTOGALÉRIA': 'AUSGEWÄHLTE FOTOGALERIE',
  'listujte šípkami alebo potiahnite os':
    'blättern Sie mit den Pfeilen oder ziehen Sie die Achse',
  'ČÍTAŤ CELÉ': 'GANZ LESEN',
  'Prečo to vlastne robím': 'Warum ich das eigentlich mache',
  'zápisov v kronike': 'Einträge in der Chronik',
  'rokov činnosti': 'Jahre Tätigkeit',
  'článkov na webe': 'Artikel auf der Website',

  /* ── Výzva na spoluprácu ───────────────────────────────────────────── */
  'Buďme hrdí na naše dejiny': 'Seien wir stolz auf unsere Geschichte',
  'Staňte sa našimi spolupracovníkmi': 'Arbeiten Sie mit uns zusammen',
  'Možno sami neviete, aké poklady vlastníte.':
    'Vielleicht wissen Sie selbst nicht, welche Schätze Sie besitzen.',
  'Aj vy sa môžete podieľať na zveľaďovaní našej stránky. Ak máte doma zaujímavé fotografie z hradísk alebo obrázky a fotky nálezov, stačí sa s nami o ne podeliť — každý záber pomáha dopĺňať náš spoločný obraz o dávnej minulosti.':
    'Auch Sie können diese Website mit aufbauen. Wenn Sie zu Hause interessante Fotos von Burgwällen oder Bilder und Aufnahmen von Funden haben, teilen Sie sie mit uns — jede Aufnahme ergänzt unser gemeinsames Bild der fernen Vergangenheit.',
  'Pošlite fotky na': 'Schicken Sie die Fotos an',
  'Alebo nám napíšte rovno tu': 'Oder schreiben Sie uns gleich hier',
  'Ozveme sa vám späť na uvedený e-mail.':
    'Wir melden uns bei Ihnen unter der angegebenen E-Mail-Adresse.',
  'Vaše meno': 'Ihr Name',
  'Vaša správa': 'Ihre Nachricht',
  'Popíšte, čím by ste chceli prispieť…': 'Beschreiben Sie, womit Sie beitragen möchten …',
  'Odoslať správu': 'Nachricht senden',
  'Poslať ďalšiu správu': 'Weitere Nachricht senden',
  'Ďakujeme!': 'Vielen Dank!',
  'Vašu správu sme prijali. Ozveme sa vám čo najskôr s ďalšími informáciami o spolupráci.':
    'Wir haben Ihre Nachricht erhalten. Wir melden uns so bald wie möglich mit weiteren Informationen zur Zusammenarbeit.',
  'Vaše údaje použijeme len na odpoveď na túto správu. Neposkytujeme ich tretím stranám.':
    'Ihre Daten verwenden wir nur für die Antwort auf diese Nachricht. An Dritte geben wir sie nicht weiter.',
  'Meno je povinné': 'Der Name ist erforderlich',
  'E-mail je povinný': 'Die E-Mail-Adresse ist erforderlich',
  'Zadajte platnú adresu': 'Geben Sie eine gültige Adresse ein',
  'Správa nesmie byť prázdna': 'Die Nachricht darf nicht leer sein',
  'Čo pomôže najviac': 'Was am meisten hilft',
  'Valy a opevnenia': 'Wälle und Befestigungen',
  'Zábery na valy, pozostatky opevnení, budov a podobne — najmä pri hradiskách, na ktorých som ešte nebol a ku ktorým preto nemám žiadne fotky.':
    'Aufnahmen von Wällen, Resten von Befestigungen, Gebäuden und Ähnlichem — vor allem von Burgwällen, an denen ich noch nicht war und zu denen ich deshalb keine Fotos habe.',
  'Nálezy v zahraničí': 'Funde im Ausland',
  'Slovanské nálezy v Maďarsku a Rakúsku — múzeá vo Visegráde, Novohrade, Ostrihome či Zalavári. Šperky, zbrane, črepy a podobne.':
    'Slawische Funde in Ungarn und Österreich — die Museen in Visegrád, Nógrád, Esztergom oder Zalavár. Schmuck, Waffen, Scherben und Ähnliches.',
  'Máte doma nález?': 'Haben Sie einen Fund zu Hause?',
  'Platí to aj pre náhodných nálezcov, ktorí majú v pivnici či na povale zaujímavé nálezy, na ktoré len sadá prach a s ktorými sa boja oficiálne pochváliť. Urobiť fotku, napísať, kde sa nález našiel, a poslať to na mail sa predsa dá.':
    'Das gilt auch für Zufallsfinder, die im Keller oder auf dem Dachboden interessante Funde liegen haben, auf die nur Staub fällt und mit denen sie sich offiziell nicht zu melden trauen. Ein Foto machen, dazuschreiben, wo der Fund lag, und das Ganze per E-Mail schicken — das geht doch.',
  'meno@domena.sk': 'name@domain.de',

  /* ── Hlavička, pätička, stránka článku ─────────────────────────────── */
  'Domov': 'Startseite',
  'Mohlo by vás zaujímať': 'Das könnte Sie interessieren',
  'Článok sa nenašiel.': 'Der Artikel wurde nicht gefunden.',
  'Obsah článku zatiaľ nebol pridaný.': 'Der Inhalt des Artikels fehlt noch.',
  'min čítania': 'Min. Lesezeit',
  'Kľúčové fakty': 'Die wichtigsten Angaben',
  'Časová os': 'Zeitleiste',
  'Lokalita': 'Fundstelle',
  'Súvisiace články': 'Verwandte Artikel',
  'Témy': 'Themen',
  'Kategórie': 'Kategorien',
  'Články': 'Artikel',
  'Zdieľať': 'Teilen',
  'Zdieľať článok': 'Artikel teilen',
  'Komentáre': 'Kommentare',
  'Pridať komentár': 'Kommentar hinzufügen',
  'Skryť komentáre': 'Kommentare ausblenden',
  'Galéria': 'Galerie',
  'Fotogaléria': 'Fotogalerie',
  'Zdroje a literatúra': 'Quellen und Literatur',
  'Otvoriť v Google Mapách': 'In Google Maps öffnen',
  'Načítavam…': 'Wird geladen …',
  'Slovensky': 'Slowakisch',
  'English': 'Englisch',
  'Hradiská': 'Burgwälle',
  'Aktuality': 'Aktuelles',
  'Prihlásiť sa': 'Anmelden',
  'Účet': 'Konto',
  'Ponuka': 'Menü',
  'Hradiská — domov': 'Hradiská — Startseite',
  'Zatiaľ bez článkov.': 'Noch keine Artikel.',
  'Slovanské hradiská': 'Slawische Burgwälle',
  'Aplikácia do telefónu': 'App fürs Telefon',
  'Späť hore': 'Nach oben',
  'Listiny a pramene': 'Urkunden und Quellen',
  'Zavrieť ponuku': 'Menü schließen',
  'Otvoriť ponuku': 'Menü öffnen',
  'Zobraziť všetky': 'Alle anzeigen',
  'Načítavam články…': 'Artikel werden geladen …',
  'Ochrana osobných údajov': 'Datenschutz',
  'Podmienky používania': 'Nutzungsbedingungen',

  /* ── Cookies (v reči hradiska — stráž na palisáde) ─────────────────── */
  'Stoj! Kto tam?': 'Halt! Wer da?',
  'Prijať ako hosť': 'Als Gast einlassen',
  'Otočiť koňa': 'Das Pferd wenden',
  'Prijať všetko': 'Alles annehmen',
  'Uložiť voľbu': 'Auswahl speichern',
  'Nevyhnutné': 'Notwendig',
  'Analytické': 'Analyse',
  'VŽDY ZAPNUTÉ': 'IMMER AN',
  'Žiadne rabovanie, sľubujeme!': 'Keine Plünderung, versprochen!',
  'STRÁŽ': 'DIE WACHE',
  'Zvyky hradiska (nastavenia)': 'Bräuche des Burgwalls (Einstellungen)',
  'Zvyky hradiska (cookies)': 'Bräuche des Burgwalls (Cookies)',
  'Zvyky hradiska': 'Bräuche des Burgwalls',
  'Súhlasím': 'Ich stimme zu',
  'Nesúhlasím': 'Ich stimme nicht zu',

  /* ── Názvy kategórií ───────────────────────────────────────────────── */
  'Kniežacie sídla': 'Fürstensitze',
  'Mocenské centrá': 'Machtzentren',
  'Strážna a hospodárska funkcia': 'Wach- und Wirtschaftsfunktion',
  'Refugiá': 'Fliehburgen',
  'Staroveké sídla': 'Siedlungen der Vorzeit',
  'Všeobecne o hradiskách': 'Allgemein über Burgwälle',
  'Svätyne a sakrálne objekty': 'Heiligtümer und Kultbauten',
  'Povesti': 'Sagen',
  'Listiny a písomné zdroje': 'Urkunden und Schriftquellen',
  'Odborné texty': 'Fachtexte',
  '3D modely': '3D-Modelle',
  'Informačné tabule': 'Informationstafeln',
  'Ostatné': 'Sonstiges',

  /* ── Zdieľanie a prehliadač fotky ──────────────────────────────────── */
  'Zdieľať na': 'Teilen auf',
  'Kopírovať odkaz': 'Link kopieren',
  'Skopírované': 'Kopiert',
  'Odkaz skopírovaný': 'Link kopiert',
  'Nepodarilo sa skopírovať odkaz': 'Der Link ließ sich nicht kopieren',
  'Fotka z Hradiská.sk': 'Foto von Hradiská.sk',
  'Odkaz na fotku skopírovaný': 'Link zum Foto kopiert',
  'Prehliadač fotky': 'Fotoansicht',
  'Zavrieť': 'Schließen',
  'Zavrieť zväčšenie': 'Vergrößerung schließen',
  'Zväčšiť fotku': 'Foto vergrößern',
  'Predchádzajúca fotka': 'Vorheriges Foto',
  'Nasledujúca fotka': 'Nächstes Foto',
  'Zbaliť': 'Einklappen',
  'Čítať viac': 'Weiterlesen',
  'Zobraziť komentáre': 'Kommentare anzeigen',
  'Otvoriť obrázok': 'Bild öffnen',
  'Obrázok': 'Bild',

  /* ── Diskusia ──────────────────────────────────────────────────────── */
  'Diskusia': 'Diskussion',
  'Načítavam komentáre…': 'Kommentare werden geladen …',
  'Zatiaľ tu nie sú žiadne komentáre. Buďte prvý, kto napíše svoj názor.':
    'Hier gibt es noch keine Kommentare. Schreiben Sie als Erste oder Erster Ihre Meinung.',
  'Komentovanie tohto článku nie je momentálne dostupné.':
    'Kommentare sind bei diesem Artikel derzeit nicht möglich.',
  'Píšete ako': 'Sie schreiben als',
  'Napíšte svoj komentár…': 'Schreiben Sie Ihren Kommentar …',
  'Pridávam…': 'Wird hinzugefügt …',
  'Do diskusie sa môžu zapojiť prihlásení členovia.':
    'An der Diskussion können angemeldete Mitglieder teilnehmen.',
  'Zaregistrovať sa': 'Registrieren',
  'Prihláste sa': 'Melden Sie sich an',
  'z pôvodného blogu': 'aus dem alten Blog',
  'Páči sa mi': 'Gefällt mir',
  'Páči sa': 'Gefällt',
  'Zrušiť reakciu': 'Reaktion zurücknehmen',
  'Odpovedať': 'Antworten',
  'Odpovedať na tento komentár': 'Auf diesen Kommentar antworten',
  'Odpoveď pre': 'Antwort an',
  'Odoslať odpoveď': 'Antwort senden',
  'Zrušiť': 'Abbrechen',
  'Zmazať': 'Löschen',
  'Zmazať môj komentár': 'Meinen Kommentar löschen',
  'Zmazať tento komentár?': 'Diesen Kommentar löschen?',
  'Nahlásiť': 'Melden',
  'Nahlásiť tento komentár redakcii': 'Diesen Kommentar der Redaktion melden',
  'Komentovať': 'Kommentieren',
  'Napíš komentár…': 'Schreiben Sie einen Kommentar …',
  'Odoslať komentár': 'Kommentar senden',
  'Buď prvý, kto sa ozve ✦': 'Melden Sie sich als Erste oder Erster ✦',
  'a zapojte sa do diskusie': 'und diskutieren Sie mit',
  'komentár': 'Kommentar',
  'komentáre': 'Kommentare',
  'komentárov': 'Kommentare',
  'Lajkovať môžu len prihlásení. Prihláste sa.':
    'Nur angemeldete Mitglieder können das. Melden Sie sich an.',
  'Nepodarilo sa zaznamenať lajk.': 'Die Reaktion konnte nicht gespeichert werden.',
  'Nepodarilo sa zrušiť lajk.': 'Die Reaktion konnte nicht zurückgenommen werden.',
  'Komentár pridaný.': 'Kommentar hinzugefügt.',
  'Komentár zmazaný.': 'Kommentar gelöscht.',
  'Nepodarilo sa pridať komentár': 'Der Kommentar konnte nicht hinzugefügt werden',
  'Nepodarilo sa zmazať komentár.': 'Der Kommentar konnte nicht gelöscht werden.',
  'Odpoveď pridaná.': 'Antwort hinzugefügt.',
  'Nepodarilo sa pridať odpoveď.': 'Die Antwort konnte nicht hinzugefügt werden.',

  /* ── Nahlásenie a blokovanie ───────────────────────────────────────── */
  'Nahlásiť príspevok': 'Beitrag melden',
  'Nahlásené': 'Gemeldet',
  'Čo mu vyčítate?': 'Was stört Sie daran?',
  'Urážka alebo útok na človeka': 'Beleidigung oder Angriff auf eine Person',
  'Nevhodný obsah': 'Unangemessener Inhalt',
  'Nepravdivé tvrdenie': 'Unwahre Behauptung',
  'Iné': 'Sonstiges',
  'Chcete niečo doplniť? (nepovinné)': 'Möchten Sie etwas ergänzen? (freiwillig)',
  'Napríklad čím presne príspevok prekáža.': 'Zum Beispiel, was genau an dem Beitrag stört.',
  'Nahlásenie príspevok neskryje — pozrie sa naň redakcia.':
    'Eine Meldung blendet den Beitrag nicht aus — die Redaktion sieht ihn sich an.',
  'Odosielam…': 'Wird gesendet …',
  'Tento príspevok ste už nahlásili. Redakcia o ňom vie.':
    'Diesen Beitrag haben Sie bereits gemeldet. Die Redaktion weiß davon.',
  'Ďakujeme. Redakcia sa na príspevok pozrie.':
    'Vielen Dank. Die Redaktion sieht sich den Beitrag an.',
  'Nahlásenie sa nepodarilo odoslať. Skúste to prosím o chvíľu.':
    'Die Meldung konnte nicht gesendet werden. Bitte versuchen Sie es gleich noch einmal.',
  'Zablokovať sa ho nepodarilo — skúste to v nastaveniach účtu.':
    'Das Blockieren hat nicht geklappt — versuchen Sie es in den Kontoeinstellungen.',
  'tohto člena': 'dieses Mitglied',
  'Príspevok od': 'Beitrag von',
  'Príspevky od': 'Beiträge von',
  'vám už nebudeme zobrazovať.': 'zeigen wir Ihnen nicht mehr an.',
  'Príspevky tohto člena vám už nebudeme zobrazovať.':
    'Die Beiträge dieses Mitglieds zeigen wir Ihnen nicht mehr an.',
  'Zároveň': 'Gleichzeitig',
  'zablokovať — jeho príspevky sa mi prestanú zobrazovať. Zrušiť sa to dá v nastaveniach účtu.':
    'blockieren — seine Beiträge werden mir nicht mehr angezeigt. Rückgängig machen können Sie das in den Kontoeinstellungen.',

  /* ── Nástroj na pripomienky (len pre redakciu) ─────────────────────── */
  'Pripomienky': 'Hinweise',
  'Pripomienky k tejto stránke': 'Hinweise zu dieser Seite',
  'Pripomienky sa nepodarilo načítať.': 'Die Hinweise konnten nicht geladen werden.',
  'voľné miesto na stránke': 'freie Stelle auf der Seite',
  'Priveľa pripomienok za chvíľu. Skúste o minútu.':
    'Zu viele Hinweise in kurzer Zeit. Versuchen Sie es in einer Minute.',
  'Uloženie zlyhalo.': 'Das Speichern ist fehlgeschlagen.',
  'Zmazať túto pripomienku? Nedá sa to vrátiť.':
    'Diesen Hinweis löschen? Das lässt sich nicht rückgängig machen.',
  'Skopírované do schránky.': 'In die Zwischenablage kopiert.',
  'Kopírovanie zlyhalo.': 'Das Kopieren ist fehlgeschlagen.',
  'obsah': 'Inhalt',
  'chyba': 'Fehler',
  'Chyba': 'Fehler',
  'Obsah': 'Inhalt',
  'hosť': 'Gast',
  'Nová': 'Neu',
  'Rieši sa': 'In Arbeit',
  'Späť na novú': 'Zurück auf neu',
  'Hotová': 'Erledigt',
  'Zamietnutá': 'Abgelehnt',
  'Redakcia to už rieši.': 'Die Redaktion arbeitet schon daran.',
  'Čaká na redakciu.': 'Wartet auf die Redaktion.',
  'Čo je tu zle alebo čo treba zmeniť?': 'Was ist hier falsch oder was soll geändert werden?',
  'Ctrl+Enter uloží': 'Strg+Enter speichert',
  'Ukladám…': 'Wird gespeichert …',
  'Uložiť': 'Speichern',
  'Zavrieť nástroj': 'Werkzeug schließen',
  'Kliknite na prvok… (Esc zruší)': 'Klicken Sie ein Element an … (Esc bricht ab)',
  'Pridať pripomienku na prvok': 'Hinweis zu einem Element hinzufügen',
  'Na tejto stránke zatiaľ nič.': 'Auf dieser Seite bisher nichts.',
  'prvok sa na stránke nenašiel': 'Das Element wurde auf der Seite nicht gefunden',
  'Kopírovať pre vývojára': 'Für die Entwicklung kopieren',
  'Všetky v admine': 'Alle in der Verwaltung',
  'Píšete ako hosť — pripomienku uvidí redakcia.':
    'Sie schreiben als Gast — den Hinweis sieht die Redaktion.',

  /* ── Mapa hradísk ──────────────────────────────────────────────────── */
  'Terénny atlas': 'Geländeatlas',
  'Slovenska': 'der Slowakei',
  'lokalít leží za hranicami — ukázať': 'Fundstellen liegen jenseits der Grenze — anzeigen',
  'Podklad mapy': 'Kartengrundlage',
  'Reliéf': 'Relief',
  'Satelit': 'Satellit',
  'Kategórie lokalít': 'Kategorien der Fundstellen',
  'Zhluk — kliknutím priblížite': 'Gruppe — zum Heranzoomen anklicken',
  'Zhluk': 'Gruppe',
  'lokalít — priblížiť': 'Fundstellen — heranzoomen',
  'Ťuknutím otvoríte mapu na celú obrazovku': 'Tippen Sie, um die Karte im Vollbild zu öffnen',
  'Zavrieť mapu': 'Karte schließen',
  'Zavrieť vejár': 'Fächer schließen',
  'Zobraziť reliéf': 'Relief anzeigen',
  'Zobraziť satelitnú snímku': 'Satellitenbild anzeigen',
  'Priblíženie': 'Zoom',
  'Priblížiť': 'Heranzoomen',
  'Oddialiť': 'Herauszoomen',
  'Kliknutím presuniete pohľad': 'Klicken Sie, um den Ausschnitt zu verschieben',
  'Posunúť hore': 'Nach oben verschieben',
  'Posunúť vľavo': 'Nach links verschieben',
  'Posunúť vpravo': 'Nach rechts verschieben',
  'Posunúť dole': 'Nach unten verschieben',
  'Celé Slovensko': 'Die ganze Slowakei',
  'Čítať článok': 'Artikel lesen',
  'Kliknutím zobraziť v galérii': 'Zum Anzeigen in der Galerie klicken',
  'otvoriť v Google Mapách': 'in Google Maps öffnen',

  /* ── Rozcestník kategórií a témy ───────────────────────────────────── */
  'Kategórie hradísk': 'Kategorien der Burgwälle',
  'Hospodárska funkcia': 'Wirtschaftsfunktion',
  'Refúgiá': 'Fliehburgen',
  'Staroveké hradiská': 'Burgwälle der Vorzeit',
  'Listiny a pís. zdroje': 'Urkunden und Quellen',
  'Svätyne': 'Heiligtümer',
  'Pramene': 'Quellen',
  'Pravek': 'Urgeschichte',
  'Metodika': 'Methodik',
  'Vybrali sme články súvisiace s touto témou':
    'Wir haben Artikel zu diesem Thema ausgewählt',
  'Kultúra': 'Kultur',
  'Archeológia': 'Archäologie',
  'Výskum': 'Forschung',
  'História': 'Geschichte',
  'Veľká Morava': 'Großmähren',
  'Opevnenie a jeho stavba': 'Befestigung und ihr Bau',
  'Činnosť OZ Hradiská': 'Tätigkeit des Vereins OZ Hradiská',
  'Archeologický výskum a metódy': 'Archäologische Ausgrabung und Methoden',
  'Púchovská kultúra': 'Púchov-Kultur',
  'Doba bronzová a lužická kultúra': 'Bronzezeit und Lausitzer Kultur',
  'Hradiská v zahraničí': 'Burgwälle im Ausland',
  'Pohanský kult': 'Heidnischer Kult',
  'Náučné chodníky a ochrana pamiatok': 'Lehrpfade und Denkmalschutz',
  'Kelti a laténska doba': 'Kelten und Latènezeit',
  'Stredovek po Veľkej Morave': 'Das Mittelalter nach Großmähren',
  'Kostoly a kresťanstvo': 'Kirchen und Christentum',
  'Zbrane a vojenstvo': 'Waffen und Kriegswesen',
  'Slovania a Samova ríša': 'Die Slawen und das Reich des Samo',
  'Pohrebiská a mohyly': 'Gräberfelder und Hügelgräber',
  'Remeslá, železo a obchod': 'Handwerk, Eisen und Handel',
  'Keramika a každodenný život': 'Keramik und Alltag',
  'Praveké osídlenie': 'Urgeschichtliche Besiedlung',
  'Doba rímska a Germáni': 'Römische Kaiserzeit und Germanen',
  'Avari a starí Maďari': 'Awaren und Altungarn',
  'Šperky a ozdoby': 'Schmuck und Zierrat',
  'Doba halštatská': 'Die Hallstattzeit',

  /* Zástupné mená vo formulároch — nemecký čitateľ pozná Mustermanna. */
  'Jano Hradský': 'Max Mustermann',
  'Jana Nováková': 'Erika Mustermann',
};

export default DE;
