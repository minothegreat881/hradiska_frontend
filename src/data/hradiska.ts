export interface Hradisko {
  name: string;
  type: 'hrad' | 'hradisko' | 'zamok';
  coordinates: [number, number]; // [longitude, latitude]
  description: string;
  rok: string;
  stav: string;
  okres: string;
  kraj: string;
  nadmorskaVyska: number;
  fotka?: string;
  unesco?: boolean;
}

export const hradiskaData: Hradisko[] = [
  // UNESCO Svetové dedičstvo
  {
    name: "Spišský hrad",
    type: "hrad",
    coordinates: [20.7677, 49.0017],
    description: "Jeden z najväčších hradných komplexov v strednej Európe, zapísaný do zoznamu UNESCO. Mohutná stavba dominuje Spišskému Podhradu a okoliu.",
    rok: "12. storočie",
    stav: "ruiny",
    okres: "Levoča",
    kraj: "Prešovský",
    nadmorskaVyska: 634,
    unesco: true,
    fotka: "https://images.unsplash.com/photo-1568797629485-c2a3f1e37e14?w=1280&h=720&fit=crop&q=80"
  },
  
  // Bratislavský kraj
  {
    name: "Bratislavský hrad",
    type: "hrad",
    coordinates: [17.1000, 48.1425],
    description: "Dominanta hlavného mesta SR, zrekonštruovaný hrad s bohatou históriou. Sídlo slovenských panovníkov a významné národné kultúrne centrum.",
    rok: "9. storočie",
    stav: "rekonštruovaný",
    kraj: "Bratislavský",
    nadmorskaVyska: 212,
    fotka: "https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?w=1280&h=720&fit=crop&q=80"
  },
  {
    name: "Devín",
    type: "hrad",
    coordinates: [16.9789, 48.1733],
    description: "Významné slovanské hradisko na sútoku Dunaja a Moravy. Archeologické nálezy dokazujú osídlenie už v mladšej dobe kamennej.",
    rok: "9. storočie",
    stav: "ruiny",
    okres: "Bratislava IV",
    kraj: "Bratislavský",
    nadmorskaVyska: 212,
    fotka: "https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=1280&h=720&fit=crop&q=80"
  },
  {
    name: "Pajštún",
    type: "hrad",
    coordinates: [17.0444, 48.3056],
    description: "Strážny hrad v Malých Karpatoch, ktorý chránil obchodnú cestu z Uhorska do Čiech. Obľúbený cieľ turistov z Bratislavy.",
    rok: "13. storočie",
    stav: "ruiny",
    okres: "Pezinok",
    kraj: "Bratislavský",
    nadmorskaVyska: 486
  },
  {
    name: "Červený Kameň",
    type: "hrad",
    coordinates: [17.2867, 48.3869],
    description: "Pôvodne strážny hrad, neskôr prestavaný na renesančný zámok. Dobre zachovaný s múzeom a historickým nábytkom.",
    rok: "13. storočie",
    stav: "zachovaný",
    okres: "Pezinok",
    kraj: "Bratislavský",
    nadmorskaVyska: 390,
    fotka: "https://images.unsplash.com/photo-1555990538-1c5c9f04ca58?w=1280&h=720&fit=crop&q=80"
  },
  {
    name: "Plavecký hrad",
    type: "hrad",
    coordinates: [16.9736, 48.5075],
    description: "Rozsiahle hradné ruiny na skalnom vrchu v Malých Karpatoch, strážiace moravskú hranicu.",
    rok: "13. storočie",
    stav: "ruiny",
    okres: "Malacky",
    kraj: "Bratislavský",
    nadmorskaVyska: 420
  },
  
  // Trnavský kraj
  {
    name: "Beckov",
    type: "hrad",
    coordinates: [17.9394, 48.7808],
    description: "Malebné ruiny hradu na vysokom brale nad obcou Beckov. Hrad slúžil ako strážny objekt na Váhu.",
    rok: "13. storočie",
    stav: "ruiny",
    okres: "Nové Mesto nad Váhom",
    kraj: "Trnavský",
    nadmorskaVyska: 373,
    fotka: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1280&h=720&fit=crop&q=80"
  },
  {
    name: "Čachtický hrad",
    type: "hrad",
    coordinates: [17.7722, 48.7111],
    description: "Známy ako hrad krvavej grófky Alžbety Báthoryovej. Rozsiahle ruiny s temnou históriou.",
    rok: "13. storočie",
    stav: "ruiny",
    okres: "Nové Mesto nad Váhom",
    kraj: "Trnavský",
    nadmorskaVyska: 379
  },
  {
    name: "Branč",
    type: "hrad",
    coordinates: [18.4139, 48.7272],
    description: "Kráľovský hrad postavený kráľom Ondrejom III. na ochranu obchodných ciest.",
    rok: "13. storočie",
    stav: "ruiny",
    okres: "Nitra",
    kraj: "Trnavský",
    nadmorskaVyska: 364
  },
  {
    name: "Smolenice",
    type: "zamok",
    coordinates: [17.4322, 48.5100],
    description: "Zámok v duchu romantizmu, prestavaný na základoch stredovekého hradu. Sídlo Slovenskej akadémie vied.",
    rok: "20. storočie (rekonštrukcia)",
    stav: "zachovaný",
    okres: "Trnava",
    kraj: "Trnavský",
    nadmorskaVyska: 350
  },
  
  // Trenčiansky kraj
  {
    name: "Trenčiansky hrad",
    type: "hrad",
    coordinates: [18.0444, 48.8942],
    description: "Dominanta mesta Trenčín, jeden z najväčších hradných komplexov na Slovensku. Známy vykonanou studňou a hradnými pamiatkami.",
    rok: "11. storočie",
    stav: "čiastočne zachovaný",
    okres: "Trenčín",
    kraj: "Trenčiansky",
    nadmorskaVyska: 352
  },
  {
    name: "Strečno",
    type: "hrad",
    coordinates: [18.8514, 49.1786],
    description: "Malebný hrad nad meandrami rieky Váh, postavený na strmej skale. Významné turistické miesto.",
    rok: "14. storočie",
    stav: "ruiny",
    okres: "Žilina",
    kraj: "Žilinský",
    nadmorskaVyska: 495
  },
  {
    name: "Lietava",
    type: "hrad",
    coordinates: [18.6167, 49.1644],
    description: "Rozsiahly hradný komplex severne od Žiliny, jeden z najväčších hradov na Slovensku.",
    rok: "13. storočie",
    stav: "ruiny",
    okres: "Žilina",
    kraj: "Žilinský",
    nadmorskaVyska: 632
  },
  {
    name: "Považský hrad",
    type: "hrad",
    coordinates: [18.4442, 48.9881],
    description: "Ruiny hradu nad mestom Považská Bystrica, strážiace dolné Považie.",
    rok: "13. storočie",
    stav: "ruiny",
    okres: "Považská Bystrica",
    kraj: "Trenčiansky",
    nadmorskaVyska: 497
  },
  
  // Nitriansky kraj
  {
    name: "Levický hrad",
    type: "hrad",
    coordinates: [18.6069, 48.2156],
    description: "Komplex hradu a zámku v meste Levice, významná stredoveká pevnosť protitureckej obrany.",
    rok: "13. storočie",
    stav: "čiastočne zachovaný",
    okres: "Levice",
    kraj: "Nitriansky",
    nadmorskaVyska: 190
  },
  {
    name: "Topoľčiansky zámok",
    type: "zamok",
    coordinates: [18.1706, 48.5536],
    description: "Zachovalý zámok s bohatou históriou, sídlo panovníkov a šľachty. Dnes múzeum a park.",
    rok: "13. storočie",
    stav: "zachovaný",
    okres: "Topoľčany",
    kraj: "Nitriansky",
    nadmorskaVyska: 252
  },
  {
    name: "Gýmeš",
    type: "hrad",
    coordinates: [18.6667, 48.3667],
    description: "Význ amný pohraničný hrad na rozhraní Slovenska a Maďarska.",
    rok: "13. storočie",
    stav: "ruiny",
    okres: "Levice",
    kraj: "Nitriansky",
    nadmorskaVyska: 320
  },
  {
    name: "Hrušov",
    type: "hrad",
    coordinates: [18.2833, 48.3167],
    description: "Mohutné hradné ruiny na výraznom kopci neďaleko Nových Zámkov.",
    rok: "13. storočie",
    stav: "ruiny",
    okres: "Nové Zámky",
    kraj: "Nitriansky",
    nadmorskaVyska: 253
  },
  
  // Žilinský kraj
  {
    name: "Oravský hrad",
    type: "hrad",
    coordinates: [19.3567, 49.2589],
    description: "Jeden z najkrajších slovenských hradov, postavený na vysokej skale nad Oravskou priehradou. Zachovaný a sprístupnený.",
    rok: "13. storočie",
    stav: "zachovaný",
    okres: "Dolný Kubín",
    kraj: "Žilinský",
    nadmorskaVyska: 632
  },
  {
    name: "Budatínsky zámok",
    type: "zamok",
    coordinates: [18.6933, 49.2303],
    description: "Zámok na sútoku riek Váh a Kysuca v Žiline, dnes múzeum s expozíciou drôtarstva.",
    rok: "13. storočie",
    stav: "zachovaný",
    okres: "Žilina",
    kraj: "Žilinský",
    nadmorskaVyska: 345
  },
  {
    name: "Starý hrad (Stará Ľubovňa)",
    type: "hrad",
    coordinates: [20.6978, 49.3022],
    description: "Hradný komplex s múzeom, zachovalý hrad na severovýchode Slovenska.",
    rok: "13. storočie",
    stav: "zachovaný",
    okres: "Stará Ľubovňa",
    kraj: "Prešovský",
    nadmorskaVyska: 560
  },
  {
    name: "Sklabina",
    type: "hrad",
    coordinates: [18.5083, 49.0417],
    description: "Zrúcaniny hradu v Martine, významné archeologické nálezisko.",
    rok: "13. storočie",
    stav: "ruiny",
    okres: "Martin",
    kraj: "Žilinský",
    nadmorskaVyska: 475
  },
  
  // Banskobystrický kraj
  {
    name: "Zvolen",
    type: "zamok",
    coordinates: [19.1347, 48.5769],
    description: "Zachovalý gotický zámok v centre Zvolena, pôvodne kráľovský poľovnícky kaštieľ.",
    rok: "14. storočie",
    stav: "zachovaný",
    okres: "Zvolen",
    kraj: "Banskobystrický",
    nadmorskaVyska: 325
  },
  {
    name: "Ľupča",
    type: "hrad",
    coordinates: [19.4228, 48.8519],
    description: "Rozsiahle hradné ruiny v Ľupči, dôležitý bod obrany stredného Slovenska.",
    rok: "13. storočie",
    stav: "ruiny",
    okres: "Banská Bystrica",
    kraj: "Banskobystrický",
    nadmorskaVyska: 642
  },
  {
    name: "Fiľakovo",
    type: "hrad",
    coordinates: [19.8264, 48.2694],
    description: "Mohutný hrad na vulkanickom kuželi, dominanta južného Slovenska.",
    rok: "13. storočie",
    stav: "ruiny",
    okres: "Lučenec",
    kraj: "Banskobystrický",
    nadmorskaVyska: 373
  },
  {
    name: "Šomoška",
    type: "hrad",
    coordinates: [19.9806, 48.2597],
    description: "Hraničný hrad na slovensko-maďarskej hranici, postavený na bazaltovom podklade.",
    rok: "13. storočie",
    stav: "ruiny",
    okres: "Revúca",
    kraj: "Banskobystrický",
    nadmorskaVyska: 526
  },
  {
    name: "Banská Štiavnica - Starý zámok",
    type: "hrad",
    coordinates: [18.8903, 48.4583],
    description: "Opevnený komplex v banskom meste Banská Štiavnica, UNESCO pamiatka.",
    rok: "13. storočie",
    stav: "zachovaný",
    okres: "Banská Štiavnica",
    kraj: "Banskobystrický",
    nadmorskaVyska: 586,
    unesco: true
  },
  {
    name: "Banská Štiavnica - Nový zámok",
    type: "hrad",
    coordinates: [18.8889, 48.4553],
    description: "Protitureckáopevnenie v Banskej Štiavnici, dominanta mesta.",
    rok: "16. storočie",
    stav: "zachovaný",
    okres: "Banská Štiavnica",
    kraj: "Banskobystrický",
    nadmorskaVyska: 585,
    unesco: true
  },
  {
    name: "Modrý Kameň",
    type: "hrad",
    coordinates: [19.1500, 48.3500],
    description: "Renesančný zámok s hradnou vežou, významná historická pamiatka.",
    rok: "13. storočie",
    stav: "čiastočne zachovaný",
    okres: "Veľký Krtíš",
    kraj: "Banskobystrický",
    nadmorskaVyska: 320
  },
  {
    name: "Pustý hrad (Zvolen)",
    type: "hrad",
    coordinates: [19.0889, 48.6283],
    description: "Rozsiahle hradné ruiny nad Zvolenom, najväčšie hradné ruiny na Slovensku.",
    rok: "13. storočie",
    stav: "ruiny",
    okres: "Zvolen",
    kraj: "Banskobystrický",
    nadmorskaVyska: 762
  },
  
  // Prešovský kraj
  {
    name: "Kapušany",
    type: "hrad",
    coordinates: [21.7667, 48.9167],
    description: "Ruiny kláštorného hradu Kapušianskeho kláštora, významné duchovné miesto.",
    rok: "13. storočie",
    stav: "ruiny",
    okres: "Prešov",
    kraj: "Prešovský",
    nadmorskaVyska: 465
  },
  {
    name: "Plaveč",
    type: "hrad",
    coordinates: [20.9694, 49.3347],
    description: "Gotický hrad na severovýchode Slovenska s dobre zachovanými freskami.",
    rok: "13. storočie",
    stav: "ruiny",
    okres: "Stará Ľubovňa",
    kraj: "Prešovský",
    nadmorskaVyska: 606
  },
  {
    name: "Šariš",
    type: "hrad",
    coordinates: [21.2614, 49.0111],
    description: "Ruiny hradného komplexu nad mestom Veľký Šariš, významný šarišský hrad.",
    rok: "13. storočie",
    stav: "ruiny",
    okres: "Prešov",
    kraj: "Prešovský",
    nadmorskaVyska: 481
  },
  {
    name: "Kamenica",
    type: "hrad",
    coordinates: [20.5833, 49.0333],
    description: "Zrúcaniny hradu severne od Sabinova.",
    rok: "13. storočie",
    stav: "ruiny",
    okres: "Sabinov",
    kraj: "Prešovský",
    nadmorskaVyska: 520
  },
  {
    name: "Ľubovňa",
    type: "hrad",
    coordinates: [20.6978, 49.3022],
    description: "Jeden z najnavštevovanejších hradov na Slovensku s komplexnou expozíciou.",
    rok: "13. storočie",
    stav: "zachovaný",
    okres: "Stará Ľubovňa",
    kraj: "Prešovský",
    nadmorskaVyska: 560
  },
  
  // Košický kraj
  {
    name: "Krásna Hôrka",
    type: "hrad",
    coordinates: [20.5831, 48.6653],
    description: "Jeden z najlepšie zachovaných slovenských hradov, dominanta Rožňavskej kotliny.",
    rok: "14. storočie",
    stav: "zachovaný",
    okres: "Rožňava",
    kraj: "Košický",
    nadmorskaVyska: 448
  },
  {
    name: "Spiš",
    type: "hrad",
    coordinates: [20.7677, 49.0017],
    description: "Spišský hrad - najväčší hradný komplex v strednej Európe, UNESCO.",
    rok: "12. storočie",
    stav: "ruiny",
    okres: "Levoča",
    kraj: "Košický",
    nadmorskaVyska: 634,
    unesco: true
  },
  {
    name: "Jasov",
    type: "hrad",
    coordinates: [21.0256, 48.6803],
    description: "Hradné ruiny a kláštor premonštrátov, významná pamiatka východného Slovenska.",
    rok: "13. storočie",
    stav: "ruiny",
    okres: "Košice-okolie",
    kraj: "Košický",
    nadmorskaVyska: 320
  },
  {
    name: "Parič",
    type: "hrad",
    coordinates: [20.4333, 48.6667],
    description: "Ruiny hradu nad obcou Pača, pozoruhodné hradné torzo.",
    rok: "13. storočie",
    stav: "ruiny",
    okres: "Rožňava",
    kraj: "Košický",
    nadmorskaVyska: 540
  },
  {
    name: "Turňa",
    type: "hrad",
    coordinates: [20.8528, 48.6292],
    description: "Hradné ruiny na vulkanickej sopke, hraničný hrad s výhľadom na Maďarsko.",
    rok: "13. storočie",
    stav: "ruiny",
    okres: "Košice-okolie",
    kraj: "Košický",
    nadmorskaVyska: 444
  },
  {
    name: "Boldogkő",
    type: "hrad",
    coordinates: [21.1597, 48.3636],
    description: "Menšie hradné ruiny na slovensko-maďarskej hranici.",
    rok: "13. storočie",
    stav: "ruiny",
    okres: "Košice-okolie",
    kraj: "Košický",
    nadmorskaVyska: 375
  },
  
  // Hradiská (slovanské a predslovanské)
  {
    name: "Devínska Nová Ves - hradisko",
    type: "hradisko",
    coordinates: [17.0500, 48.2000],
    description: "Slovanské hradisko z 9. storočia, významná lokalita veľkomoravského obdobia.",
    rok: "9. storočie",
    stav: "archeologické nálezisko",
    okres: "Bratislava IV",
    kraj: "Bratislavský",
    nadmorskaVyska: 280
  },
  {
    name: "Bojná",
    type: "hradisko",
    coordinates: [18.1972, 48.6972],
    description: "Veľkomoravské hradisko s bohatými archeologickými nálezmi militárií a šperkov.",
    rok: "9. storočie",
    stav: "archeologické nálezisko",
    okres: "Topoľčany",
    kraj: "Nitriansky",
    nadmorskaVyska: 340
  },
  {
    name: "Molpír",
    type: "hradisko",
    coordinates: [18.0833, 48.3167],
    description: "Keltské oppidium a slovanské hradisko, významná archeologická lokalita.",
    rok: "4. storočie pred n.l.",
    stav: "archeologické nálezisko",
    okres: "Nitra",
    kraj: "Nitriansky",
    nadmorskaVyska: 220
  },
  {
    name: "Pobedim",
    type: "hradisko",
    coordinates: [18.2667, 48.3500],
    description: "Slovanské hradisko neďaleko Nitry s nálezmiscerámiky a kovových predmetov.",
    rok: "9. storočie",
    stav: "archeologické nálezisko",
    okres: "Nitra",
    kraj: "Nitriansky",
    nadmorskaVyska: 195
  },
  {
    name: "Ducové",
    type: "hradisko",
    coordinates: [17.7833, 48.3167],
    description: "Nálezisko z doby halštatskej a laténskej, hradisko s opevnením.",
    rok: "6. storočie pred n.l.",
    stav: "archeologické nálezisko",
    okres: "Trnava",
    kraj: "Trnavský",
    nadmorskaVyska: 215
  },
  {
    name: "Majcichov",
    type: "hradisko",
    coordinates: [18.5000, 48.5833],
    description: "Slovanské hradisko z 9. storočia s nálezmiodevných nástrojov.",
    rok: "9. storočie",
    stav: "archeologické nálezisko",
    okres: "Topoľčany",
    kraj: "Nitriansky",
    nadmorskaVyska: 260
  },
  {
    name: "Nitrianske Hrady",
    type: "hradisko",
    coordinates: [18.3500, 48.3167],
    description: "Rozsiahle hradisko nad Nitrou, sídliskové a mocenské centrum.",
    rok: "9. storočie",
    stav: "archeologické nálezisko",
    okres: "Nitra",
    kraj: "Nitriansky",
    nadmorskaVyska: 310
  },
  
  // Ďalšie významné zámky
  {
    name: "Bojnický zámok",
    type: "zamok",
    coordinates: [18.5789, 48.7800],
    description: "Rozprávkový zámok v štýle romantizmu, jeden z najnavštevovanejších zámkov na Slovensku. Známy pre svoju architektúru a múzeum.",
    rok: "12. storočie (prestavaný v 19.-20. storočí)",
    stav: "zachovaný",
    okres: "Prievidza",
    kraj: "Trenčiansky",
    nadmorskaVyska: 312
  },
  {
    name: "Betliar",
    type: "zamok",
    coordinates: [20.5214, 48.6772],
    description: "Pôvodne renesančný kaštieľ premenený na klasicistický zámok, známy historickým nábytkom a parkom.",
    rok: "18. storočie",
    stav: "zachovaný",
    okres: "Rožňava",
    kraj: "Košický",
    nadmorskaVyska: 325
  },
  {
    name: "Strážky",
    type: "zamok",
    coordinates: [20.8339, 49.0617],
    description: "Barokovo-klasicistický kaštieľ s anglickým parkom a vzácnymi drevinami.",
    rok: "18. storočie",
    stav: "zachovaný",
    okres: "Kežmarok",
    kraj: "Prešovský",
    nadmorskaVyska: 640
  },
  {
    name: "Markušovce",
    type: "zamok",
    coordinates: [20.6583, 48.9917],
    description: "Klasicistický kaštieľ so zachovalou zariadením a anglickým parkom.",
    rok: "18. storočie",
    stav: "zachovaný",
    okres: "Spišská Nová Ves",
    kraj: "Košický",
    nadmorskaVyska: 575
  }
];
