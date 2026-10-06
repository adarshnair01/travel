/* ══════════════════════════════════════════════════════════════════════
   Souvenir stickers
   Every trip page loads this after its own app.js. It reads the page's
   TRIP data, works out the best-known sight for each day, and sticks a
   die-cut badge onto the day cards, the timeline rows and the day modal.
   Nothing to wire up per page — matching is by place name.
   ══════════════════════════════════════════════════════════════════════ */
(() => {
  "use strict";

  if (typeof TRIP === "undefined" || !TRIP || !Array.isArray(TRIP.days)) return;

  /* ── Glyphs ───────────────────────────────────────────────────────── */
  const GLYPH = {
    tower: `<path d="M9.5 21h5M10 21V9h4v12M10 9l2-3 2 3M12 3v3M9 12h6M9 15h6M9 18h6"/>`,
    temple: `<path d="M4 21h16M6 21v-7h12v7M12 3l6 11H6L12 3ZM11 21v-4h2v4"/>`,
    pagoda: `<path d="M4 21h16M12 3l5 4H7l5-4ZM7.5 7h9l1.5 4H6l1.5-4ZM6 11h12M8 15h8M7.5 11 9 15M16.5 11 15 15M9.5 21v-4h5v4"/>`,
    castle: `<path d="M4 21h16M6 21V8h12v13M6 8V4l2 1.5L10 4v4M14 8V4l2 1.5L18 4v4M10 21v-6h4v6M12 11v2"/>`,
    cathedral: `<path d="M4 21h16M6 21v-7a6 6 0 0 1 12 0v7M12 3v4M10.5 4.5h3M9.5 21v-5a2.5 2.5 0 0 1 5 0v5"/>`,
    church: `<path d="M4 21h16M7 21v-9l5-4 5 4v9M12 8V4M10.5 5.5h3M10 21v-5h4v5"/>`,
    mosque: `<path d="M3 21h18M6 21v-7a6 6 0 0 1 12 0v7M12 4c0 1.6-1.8 2.2-1.8 3.6M4 21V10M20 21V10M4 10V8.5M20 10V8.5M10 21v-4a2 2 0 0 1 4 0v4"/>`,
    dome: `<path d="M3 21h18M5 21v-6a7 7 0 0 1 14 0v6M12 4v4M9 15h6M9 21v-3h6v3"/>`,
    stupa: `<path d="M4 21h16M7 21v-4a5 5 0 0 1 10 0v4M12 3v4M10.5 7h3M8 13h8"/>`,
    buddha: `<path d="M12 4a2.6 2.6 0 1 1 0 5.2A2.6 2.6 0 0 1 12 4ZM7 21c0-4 2.2-7.2 5-7.2s5 3.2 5 7.2M5 21h14M9.6 9.6 12 13.8l2.4-4.2"/>`,
    statue: `<path d="M5 21h14M8 21v-3h8v3M12 5.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM12 9.5V18M9 12l3-1.4 3 1.4"/>`,
    fort: `<path d="M3 21h18M5 21v-9h14v9M5 12V8h2v2h3V8h4v2h3V8h2v4M11 21v-5h2v5"/>`,
    palace: `<path d="M4 21h16M6 21V7h12v14M6 7l6-4 6 4M9.5 21v-5h5v5M8.5 10.5h2v3h-2zM13.5 10.5h2v3h-2z"/>`,
    gate: `<path d="M4 21h16M6 21V6h12v15M9 21v-7a3 3 0 0 1 6 0v7M6 6l6-3 6 3"/>`,
    ruins: `<path d="M3 21h18M6 21v-8M10 21V6M14 21v-10M18 21V9M5 13h2M9 6h2M13 11h2M17 9h2"/>`,
    cave: `<path d="M3 21h18M5 21c0-7 3-11.5 7-11.5S19 14 19 21M9.5 21c0-3.6 1.1-6 2.5-6s2.5 2.4 2.5 6"/>`,
    clock: `<path d="M5 21h14M8 21V7h8v14M12 3l4.5 4h-9L12 3ZM12 9.6a2.6 2.6 0 1 1 0 5.2 2.6 2.6 0 0 1 0-5.2ZM12 11v1.3l.9.7"/>`,
    skyline: `<path d="M3 21h18M5 21v-8h4v8M9 21V9h5v12M14 21v-6h5v6M6.6 15.5v1M6.6 18v1M11 12v1M11 15v1M11 18v1M16.4 17.5v1"/>`,
    lantern: `<path d="M12 3v2.2M8 7h8l1.4 5-1.4 5H8l-1.4-5L8 7ZM12 17v3.4M9.5 12h5"/>`,
    mountain: `<path d="M2 20h20L14 5.5l-3.4 6-2-2L2 20ZM14 5.5l2.4 4.4M10.6 11.5l1.6 2.2"/>`,
    waterfall: `<path d="M4 4h16M7.5 4v9M11 4v11M14.5 4v8M18 4v10M4.5 18c2-1.2 3.2.8 5.2 0s3.2.8 5.2 0 3 .8 4.1 0M4.5 21c2-1.2 3.2.8 5.2 0s3.2.8 5.2 0 3 .8 4.1 0"/>`,
    lake: `<path d="M3 16.5c3-1.4 5 1.4 8 0s6 1.4 10 0M3 20c3-1.4 5 1.4 8 0s6 1.4 10 0M5 12.5 9 6l3 4 2-2.6 5 5.1"/>`,
    beach: `<path d="M9 21V11M9 11c-2-1.6-4.2-1.6-5.8-.5M9 11c-1-2.1-1-4.2 0-5.9M9 11c1.1-2 3.2-3 5.3-3M9 11c2.6 0 4.7 1.1 5.8 2.7M3 20.5c2.2-1.3 3.7.9 5.9 0M13 19.6c2.6-1.3 4.2.9 6 0"/>`,
    boat: `<path d="M3.5 16.5c3.2 3 13.8 3 17 0M5.5 16.5 7.5 12h9l2 4.5M9.5 12V8M9.5 8l4 1.6-4 1.6"/>`,
    ship: `<path d="M3 18.4c2.1 2 4.2 2 6.2 1s4.1-1 6.1 0 4 1 5.7-1M4.5 16.4 5.6 11h12.8l1.1 5.4M8.5 11V6.6h3V11M14 11V8h2.2v3"/>`,
    bridge: `<path d="M2 17.5h20M6 17.5V6.5M18 17.5V6.5M6 8c3.4 4.2 8.6 4.2 12 0M6 8c-1.4 2-2.8 3.1-4 3.6M18 8c1.4 2 2.8 3.1 4 3.6M9.5 17.5v-5.2M12 17.5v-6M14.5 17.5v-5.2"/>`,
    train: `<path d="M6.5 4h11v10h-11zM6.5 9h11M9 6.3h2M13 6.3h2M7 14h10l1.2 4.4H5.8L7 14ZM8 21l1.5-2.4M16 21l-1.5-2.4"/>`,
    cablecar: `<path d="M2 5.2 22 9M11.4 7.6v2.2M7 9.8h9.4v5.8a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V9.8ZM7 13h9.4"/>`,
    camel: `<path d="M4.5 20.5v-5M8 20.5v-4.2M13 20.5v-4.8M16.5 20.5v-4M4.5 15.5c0-3 1.4-4.2 3-5.7 1.5-1.5 2 .7 4 .7s3-2.2 4.5-.7c1.5 1.5 2.5 2.7 2.5 5.7M18.5 12c1-1 1.8-2 1.8-3.8M20.3 8.2 21.8 7M20.3 8.2c-.7 0-1.3.3-1.7.9"/>`,
    tea: `<path d="M5 19.5c0-7.2 5.2-12.2 14-13 1 9-4 14-11 14H5ZM8 19.5c2-4.2 5-7.2 9-9.2"/>`,
    pine: `<path d="M12 3l3.6 5.6h-2.2l3 4.8h-2.3l3.2 5H6.7l3.2-5H7.6l3-4.8H8.4L12 3ZM12 18.4V21"/>`,
    wheel: `<path d="M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18ZM12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4M12 8.2a3.8 3.8 0 1 1 0 7.6 3.8 3.8 0 0 1 0-7.6Z"/>`,
    snow: `<path d="M12 2.4v19.2M3.8 7.2l16.4 9.6M20.2 7.2 3.8 16.8M12 6.2 9.6 4M12 6.2 14.4 4M12 17.8l-2.4 2.2M12 17.8l2.4 2.2M5.6 11.4 3.4 12.6M18.4 11.4l2.2 1.2"/>`,
    flags: `<path d="M3 4.5h18M5 4.5v16M19 4.5v10.5M6.2 4.5 8 8.8l1.8-4.3M10.2 4.5 12 8.8l1.8-4.3M14.2 4.5 16 8.8l1.8-4.3"/>`,
    fountain: `<path d="M12 21V8.4M12 8.4c0-3 1.6-4 1.6-5.6M12 8.4c0-3-1.6-4-1.6-5.6M12 8.4c.2-2.6 3.1-4.4 4.7-4.9M12 8.4C11.8 5.8 8.9 4 7.3 3.5M3 17.6c3-1.4 5 1.4 8 0s6 1.4 10 0M3 20.8c3-1.4 5 1.4 8 0s6 1.4 10 0"/>`,
    arena: `<path d="M3 20.5h18M4.5 20.5V10a7.5 3.6 0 0 1 15 0v10.5M4.5 13.6h15M7.5 13.6v-3.8M10.6 13.6V9.4M13.4 13.6V9.4M16.5 13.6v-3.8M7.5 20.5v-4.4M10.6 20.5v-4.4M13.4 20.5v-4.4M16.5 20.5v-4.4"/>`,
    coast: `<path d="M2 20.5h20M3.5 20.5c1.6-4.4 3.8-6.2 5.6-3.4M9.1 17.1c.9-5.2 3.1-7 5.1-4M14.2 13.1c1.4-2 3.4-1 4.1 3M8 9.6a2 2 0 1 1 0-4 2 2 0 0 1 0 4ZM8 9.6v4"/>`,
    net: `<path d="M3 20.5h18M6 20.5V7M6 7l8.5 6.4M6 7 3.5 12M14.5 13.4 17 8.6M12.5 20.5c0-3 2-5.2 4.5-5.2M6 12h3"/>`,
    market: `<path d="M3.5 9.5h17l-1.4 11H4.9l-1.4-11ZM3.5 9.5 6 4.2h12l2.5 5.3M9 9.5V4.2M15 9.5V4.2M9.5 20.5V15h5v5.5"/>`,
    pin: `<path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11ZM12 12.4a2.6 2.6 0 1 1 0-5.2 2.6 2.6 0 0 1 0 5.2Z"/>`,
  };

  /* ── What each place is known for ─────────────────────────────────── */
  /* [terms that appear in a day's text, glyph, the sight's name]
     Landmarks come first so they beat the plain city entry. */
  const SIGHTS = [
    /* Kota Kinabalu */
    [["gaya street"], "market", "Gaya Street"],
    [["manukan", "mamutik", "tunku abdul rahman"], "boat", "Tunku Abdul Rahman Park"],
    [["tanjung aru"], "beach", "Tanjung Aru"],
    [["imago"], "market", "Imago"],
    [["padang merdeka", "merdeka"], "pin", "Padang Merdeka"],
    [["pasupathinath", "pashupatinath"], "temple", "Sri Pasupathinath Alayam"],
    [["mari mari"], "pine", "Mari Mari Cultural Village"],
    [["desa dairy"], "mountain", "Desa Dairy Farm"],
    [["rafflesia", "kundasang"], "mountain", "Kundasang"],
    [["likas"], "coast", "Likas"],
    [["sabah international", "convention centre"], "skyline", "Sabah Convention Centre"],
    [["kota kinabalu", "inanam"], "coast", "Kota Kinabalu"],

    /* Chennai · Vizag */
    [["mahabalipuram", "mamallapuram"], "temple", "Mahabalipuram"],
    [["kanchipuram"], "temple", "Kanchipuram"],
    [["rushikonda"], "beach", "Rushikonda Beach"],
    [["kailasagiri"], "mountain", "Kailasagiri"],
    [["tenneti"], "coast", "Tenneti Beach Park"],
    [["simhachalam", "varaha lakshmi narasimha"], "temple", "Simhachalam"],
    [["lumbini park"], "lake", "Lumbini Park"],
    [["visakhapatnam", "vizag"], "coast", "Vizag"],
    [["sipcot", "novotel"], "skyline", "Novotel SIPCOT"],

    /* Ujjain */
    [["mahakal"], "temple", "Mahakaleshwar"],
    [["omkareshwar", "omkar"], "temple", "Omkareshwar"],
    [["khajrana"], "temple", "Khajrana Ganesh"],
    [["ram ghat"], "boat", "Ram Ghat"],
    [["ujjain"], "temple", "Ujjain"],
    [["gwalior fort"], "fort", "Gwalior Fort"],
    [["jai vilas"], "palace", "Jai Vilas Palace"],
    [["sun temple, gwalior"], "temple", "Sun Temple"],
    [["vande bharat"], "train", "Vande Bharat"],
    [["gwalior junction"], "train", "Gwalior Junction"],
    [["playotel", "vijay nagar", "indore"], "skyline", "Indore"],

    /* Tirupati */
    [["tirumala", "tirupati", "vip darshan"], "temple", "Tirumala"],

    /* Finland · Estonia · Sweden */
    [["suomenlinna"], "fort", "Suomenlinna"],
    [["temppeliaukio"], "church", "Rock Church"],
    [["santa claus village", "arctic circle", "rovaniemi"], "snow", "Santa Claus Village"],
    [["vasa museum", "vasa"], "ship", "Vasa Museum"],
    [["gamla stan"], "clock", "Gamla Stan"],
    [["drottningholm"], "castle", "Drottningholm"],
    [["skansen", "djurgarden", "djurgården"], "pine", "Skansen"],
    [["helsinki"], "cathedral", "Helsinki Cathedral"],
    [["tallinn"], "clock", "Raekoja plats"],
    [["stockholm"], "ship", "Vasa Museum"],

    /* Japan */
    [["teamlab"], "lantern", "teamLab Planets"],
    [["tokyo tower"], "tower", "Tokyo Tower"],
    [["akihabara"], "market", "Akihabara"],
    [["nakano broadway"], "market", "Nakano Broadway"],
    [["chureito"], "pagoda", "Chureito Pagoda"],
    [["fuji-q", "fuji q"], "castle", "Fuji-Q Highland"],
    [["mount fuji"], "mountain", "Mount Fuji"],
    [["nikko"], "temple", "Nikko"],
    [["shibuya sky", "shibuya"], "skyline", "Shibuya Sky"],
    [["golden-gai", "gyoen", "hanazono"], "lantern", "Shinjuku"],
    [["philosopher"], "gate", "Philosopher’s Path"],
    [["kinkaku"], "temple", "Kinkaku-ji"],
    [["nara"], "temple", "Nara Park"],
    [["kiyomizu"], "temple", "Kiyomizu-dera"],
    [["nishiki"], "market", "Nishiki Market"],
    [["fushimi"], "gate", "Fushimi Inari"],
    [["dotonbori"], "lantern", "Dotonbori"],
    [["kaiyukan", "aquarium"], "ship", "Kaiyukan"],
    [["harukas"], "tower", "Abeno Harukas"],
    [["osaka castle"], "castle", "Osaka Castle"],
    [["umeda sky"], "skyline", "Umeda Sky"],
    [["universal studios"], "castle", "Universal Studios Japan"],
    [["kyoto"], "temple", "Kyoto"],
    [["osaka", "namba"], "lantern", "Osaka"],
    [["narita", "itami"], "skyline", "Japan Airlines"],
    [["tokyo"], "tower", "Tokyo"],

    /* Hong Kong · Macau */
    [["victoria peak", "the peak"], "mountain", "Victoria Peak"],
    [["tian tan", "big buddha", "ngong ping"], "buddha", "Tian Tan Buddha"],
    [["tai o"], "boat", "Tai O stilt houses"],
    [["disneyland"], "castle", "HK Disneyland"],
    [["ruins of st", "senado", "macau", "macao"], "ruins", "Ruins of St Paul’s"],
    [["tsim sha tsui", "kowloon", "symphony of lights"], "skyline", "Victoria Harbour"],
    [["hong kong"], "skyline", "Victoria Harbour"],

    /* Taiwan */
    [["taipei 101"], "tower", "Taipei 101"],
    [["shilin", "raohe", "liuhe", "night market"], "market", "Night market"],
    [["beitou"], "fountain", "Beitou hot springs"],
    [["longshan"], "pagoda", "Longshan Temple"],
    [["elephant mountain", "xiangshan"], "mountain", "Elephant Mountain"],
    [["sun yat-sen", "sun yat sen"], "dome", "Sun Yat-sen Memorial"],
    [["ximending"], "market", "Ximending"],
    [["fo guang shan"], "buddha", "Fo Guang Shan"],
    [["cijin"], "coast", "Cijin Island"],
    [["pier-2", "pier 2"], "market", "Pier-2 Art Centre"],
    [["yehliu"], "coast", "Queen’s Head"],
    [["jiufen"], "lantern", "Jiufen old street"],
    [["shifen"], "lantern", "Sky lanterns"],
    [["kaohsiung", "lotus pond"], "pagoda", "Dragon & Tiger Pagodas"],
    [["taipei"], "tower", "Taipei 101"],

    /* Europe */
    [["jet d", "geneva", "genève"], "fountain", "Jet d’Eau"],
    [["annecy"], "lake", "Canals of Annecy"],
    [["matterhorn", "zermatt", "täsch", "tasch", "gornergrat", "riffelsee"], "mountain", "Matterhorn"],
    [["rhine falls", "schaffhausen"], "waterfall", "Rhine Falls"],
    [["konstanz", "constance"], "lake", "Lake Constance"],
    [["zürich", "zurich", "grossmünster"], "cathedral", "Grossmünster"],
    [["duomo", "milan", "milano"], "cathedral", "Duomo di Milano"],
    [["venice", "venezia", "gondola"], "boat", "Grand Canal"],
    [["arena di verona", "verona", "aida"], "arena", "Arena di Verona"],
    [["val gardena", "dolomites", "seceda", "ortisei"], "mountain", "Dolomites"],
    [["innsbruck", "goldenes dachl"], "clock", "Goldenes Dachl"],
    [["hallstatt", "salt mine"], "lake", "Hallstatt"],
    [["neuschwanstein", "hohenschwangau"], "castle", "Neuschwanstein"],
    [["marienplatz", "munich", "münchen"], "clock", "Marienplatz"],
    [["passau"], "church", "Passau Dom"],
    [["wels", "linz"], "clock", "Old town square"],
    [["abu dhabi", "sheikh zayed"], "mosque", "Sheikh Zayed Mosque"],

    /* Odisha · Bihar · Jharkhand */
    [["jagannath", "puri"], "temple", "Jagannath Temple"],
    [["konark", "sun temple"], "wheel", "Konark Sun Temple"],
    [["chilika", "satpada"], "boat", "Chilika lagoon"],
    [["lingaraj", "bhubaneswar", "udayagiri"], "temple", "Lingaraj Temple"],
    [["baidyanath", "deoghar"], "temple", "Baidyanath Dham"],
    [["mahabodhi", "bodh gaya", "bodhgaya", "gaya"], "buddha", "Mahabodhi Temple"],
    [["nalanda", "rajgir"], "ruins", "Nalanda ruins"],
    [["golghar", "patna"], "dome", "Golghar"],

    /* North & west India */
    [["hawa mahal", "jaipur", "pink city"], "palace", "Hawa Mahal"],
    [["amer", "amber fort", "nahargarh", "jaigarh"], "fort", "Amer Fort"],
    [["india gate", "red fort", "qutub", "humayun", "chandni chowk"], "gate", "India Gate"],
    [["gateway of india", "mumbai", "colaba", "chhatrapati shivaji"], "gate", "Gateway of India"],
    [["golden temple", "amritsar", "wagah"], "dome", "Golden Temple"],
    [["dal lake", "srinagar", "shikara", "mughal garden"], "boat", "Dal Lake shikara"],
    [["gulmarg", "gondola"], "cablecar", "Gulmarg Gondola"],
    [["pahalgam", "betaab"], "mountain", "Betaab Valley"],
    [["katra", "vaishno"], "temple", "Vaishno Devi"],
    [["jammu"], "temple", "Raghunath Temple"],
    [["hadimba", "manali", "old manali"], "temple", "Hadimba Temple"],
    [["solang"], "cablecar", "Solang ropeway"],
    [["kasol", "parvati", "manikaran"], "pine", "Parvati Valley"],
    [["junagarh", "bikaner"], "fort", "Junagarh Fort"],
    [["jaisalmer", "sam dunes", "thar"], "camel", "Sam sand dunes"],
    [["mehrangarh", "jodhpur"], "fort", "Mehrangarh"],
    [["chittorgarh", "kumbhalgarh"], "fort", "Chittorgarh Fort"],
    [["udaipur", "pichola", "lake palace"], "palace", "Udaipur City Palace"],
    [["dwarka", "dwarkadhish"], "temple", "Dwarkadhish"],
    [["somnath"], "temple", "Somnath"],
    [["okha", "beyt"], "boat", "Beyt Dwarka ferry"],
    [["bibi ka maqbara", "aurangabad"], "dome", "Bibi ka Maqbara"],
    [["ajanta", "ellora", "kailasa"], "cave", "Rock-cut caves"],
    [["shirdi", "sai baba"], "temple", "Sai Baba Temple"],
    [["shaniwar", "pune"], "fort", "Shaniwar Wada"],
    [["adalaj", "sabarmati", "ahmedabad"], "mosque", "Adalaj Stepwell"],
    [["laxmi vilas", "vadodara", "baroda"], "palace", "Laxmi Vilas Palace"],
    [["jamnagar"], "temple", "Bala Hanuman"],

    /* Himalaya & north-east */
    [["triund"], "mountain", "Triund ridge"],
    [["bhagsu", "bhagsunag"], "waterfall", "Bhagsu Falls"],
    [["mcleodganj", "dharamshala", "dalai lama"], "stupa", "Tsuglagkhang"],
    [["khajjiar"], "lake", "Khajjiar lake"],
    [["dalhousie"], "pine", "Dalhousie pines"],
    [["kangra"], "fort", "Kangra Fort"],
    [["gurudongmar"], "lake", "Gurudongmar Lake"],
    [["nathu la", "nathula"], "flags", "Nathu La pass"],
    [["lachen", "lachung", "yumthang", "zero point"], "mountain", "Yumthang Valley"],
    [["gangtok", "mg marg", "rumtek"], "flags", "MG Marg"],
    [["darjeeling", "toy train", "tiger hill"], "train", "Darjeeling toy train"],
    [["nohkalikai", "cherrapunji", "sohra", "seven sisters"], "waterfall", "Nohkalikai Falls"],
    [["living root", "mawlynnong"], "bridge", "Living root bridge"],
    [["dawki", "umngot"], "boat", "Umngot river"],
    [["umiam"], "lake", "Umiam Lake"],
    [["elephant falls", "shillong"], "waterfall", "Elephant Falls"],
    [["kamakhya", "guwahati", "brahmaputra"], "temple", "Kamakhya Temple"],
    [["laxman jhula", "ram jhula", "rishikesh", "triveni"], "bridge", "Laxman Jhula"],
    [["har ki pauri", "haridwar", "ganga aarti"], "temple", "Har ki Pauri"],
    [["tiger falls", "chakrata"], "waterfall", "Tiger Falls"],
    [["mussoorie", "gun hill", "kempty"], "cablecar", "Gun Hill"],
    [["robber", "dehradun", "sahastradhara"], "cave", "Robber’s Cave"],
    [["tip-in-top", "tip in top", "lansdowne", "bhulla"], "pine", "Tip-in-Top"],

    /* South India */
    [["vivekananda rock", "kanyakumari", "thiruvalluvar"], "statue", "Vivekananda Rock"],
    [["meenakshi", "madurai"], "temple", "Meenakshi Amman"],
    [["ramanathaswamy", "rameswaram", "pamban"], "temple", "Ramanathaswamy"],
    [["dhanushkodi"], "beach", "Dhanushkodi shore"],
    [["palani", "murugan"], "temple", "Palani Murugan"],
    [["tirupati", "tirumala"], "temple", "Tirumala"],
    [["padmanabhaswamy", "thiruvananthapuram", "trivandrum", "kovalam"], "temple", "Padmanabhaswamy"],
    [["varkala"], "beach", "Varkala cliff"],
    [["kolukkumalai", "tea estate", "tea garden", "munnar"], "tea", "Munnar tea estates"],
    [["mattupetty", "echo point"], "lake", "Mattupetty Dam"],
    [["eravikulam", "anamudi"], "mountain", "Eravikulam"],
    [["mysore pak", "pak experience"], "market", "World of Mysore Pak"],
    [["chamundi"], "temple", "Chamundi Hills"],
    [["philomena"], "cathedral", "St. Philomena’s Cathedral"],
    [["mysore", "mysuru"], "palace", "Mysore"],
    [["ibm"], "skyline", "IBM Kochi"],
    [["water metro"], "boat", "Kochi Water Metro"],
    [["kimchi culture", "kimchi"], "market", "Kimchi Culture"],
    /* Bare "Kochi" is the city. Fort Kochi / Ernakulam still get the nets. */
    [["chinese fishing", "fort kochi", "ernakulam"], "net", "Chinese fishing nets"],
    [["edakkal", "wayanad", "chembra"], "cave", "Edakkal Caves"],
    [["guruvayur"], "temple", "Guruvayur Temple"],
    [["ambalappuzha", "ambalapuzha"], "temple", "Ambalappuzha Temple"],
    [["mannarasala", "mannarsala"], "temple", "Mannarasala Temple"],
    [["payyambalam", "thalassery"], "beach", "Payyambalam Beach"],
    [["palakkad"], "fort", "Palakkad Fort"],
    [["tirunelveli", "ramanathapuram"], "temple", "Nellaiappar Temple"],
    [["marina beach"], "beach", "Marina Beach"],
    [["mahabalipuram", "mamallapuram", "shore temple"], "coast", "Shore Temple"],
    [["velankanni"], "church", "Velankanni Basilica"],
    [["old goa", "bom jesus", "se cathedral"], "church", "Basilica of Bom Jesus"],
    [["dudhsagar"], "waterfall", "Dudhsagar Falls"],
    [["cabo de rama"], "fort", "Cabo de Rama"],
    [["palolem", "colva", "calangute", "baga", "goa", "margao"], "beach", "Goa beaches"],

    /* South-east Asia */
    [["petronas", "kuala lumpur", "batu caves"], "tower", "Petronas Towers"],
    [["kek lok si", "george town", "penang"], "pagoda", "Kek Lok Si"],
    [["wat arun", "grand palace", "bangkok"], "pagoda", "Wat Arun"],
    [["tanah lot"], "pagoda", "Tanah Lot"],
    [["uluwatu", "kecak"], "pagoda", "Uluwatu Temple"],
    [["tegallalang", "ubud", "monkey forest"], "tea", "Tegallalang terraces"],
    [["nusa penida", "kelingking"], "coast", "Kelingking Beach"],
    [["canggu", "seminyak", "kuta", "nusa dua", "denpasar", "bali"], "beach", "Bali beaches"],
  ];

  /* A day with no recognised sight is stamped with its own name instead,
     drawn with whatever glyph suits the day's theme. */
  const THEME_GLYPH = {
    lake: "lake",
    peak: "mountain",
    mountain: "mountain",
    hill: "mountain",
    rail: "train",
    city: "skyline",
    skyline: "skyline",
    water: "boat",
    river: "boat",
    sea: "ship",
    coast: "coast",
    island: "coast",
    beach: "beach",
    town: "clock",
    baroque: "cathedral",
    temple: "temple",
    castle: "castle",
    forest: "pine",
    desert: "camel",
    market: "market",
    food: "market",
    air: "skyline",
    home: "train",
    south: "pagoda",
    farewell: "lantern",
  };

  const ROT = [-6, 4, -3, 6, -5, 3];

  const norm = (value) =>
    String(value == null ? "" : value)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[’']/g, "'");

  const esc = (value) =>
    String(value).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* Word-boundary test so "goa" can't match inside "goalpara". */
  function hasTerm(text, term) {
    const needle = norm(term);
    let from = 0;
    for (;;) {
      const at = text.indexOf(needle, from);
      if (at < 0) return false;
      const before = text[at - 1];
      const after = text[at + needle.length];
      const word = (ch) => ch !== undefined && /[a-z0-9]/.test(ch);
      if (!word(before) && !word(after)) return true;
      from = at + 1;
    }
  }

  /* Day objects differ from trip to trip (city/place/title, activities/
     schedule/story), so read every string on the day rather than guess. */
  function collectText(value, depth, out) {
    if (value == null || depth > 4) return out;
    if (typeof value === "string") out.push(value);
    else if (Array.isArray(value)) value.forEach((item) => collectText(item, depth + 1, out));
    else if (typeof value === "object") Object.values(value).forEach((item) => collectText(item, depth + 1, out));
    return out;
  }

  const dayText = (day) => norm(collectText(day, 0, []).join(" · "));

  const placeText = (day) => norm([day.city, day.place, day.title, day.also, day.badge, day.label].join(" · "));

  const dayName = (day) => day.city || day.place || day.title || TRIP.title || "This trip";

  /* "Helsinki → overnight to Stockholm" reads better as just "Helsinki". */
  const shortPlace = (day) => String(dayName(day)).split(/[→·]/)[0].trim() || dayName(day);

  /* Where the day actually is beats something merely mentioned in passing,
     so a Delhi flight on a Helsinki day doesn't win the sticker. */
  function stickersFor(day, max = 3) {
    const text = dayText(day);
    const here = placeText(day);
    const hits = [];
    SIGHTS.forEach(([terms, glyph, label], index) => {
      const inPlace = terms.some((term) => hasTerm(here, term));
      if (!inPlace && !terms.some((term) => hasTerm(text, term))) return;
      hits.push({ glyph, label, index, rank: inPlace ? 0 : 1 });
    });
    hits.sort((a, b) => a.rank - b.rank || a.index - b.index);

    const picked = [];
    const seen = new Set();
    hits.forEach((hit) => {
      if (picked.length >= max || seen.has(hit.label)) return;
      seen.add(hit.label);
      picked.push({ glyph: hit.glyph, label: hit.label });
    });
    if (!picked.length) {
      picked.push({ glyph: THEME_GLYPH[day.theme] || "pin", label: shortPlace(day) });
    }
    return picked;
  }

  function stickerHTML(sticker, seed) {
    return `<span class="sticker" style="--rot:${ROT[seed % ROT.length]}deg" title="${esc(sticker.label)}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
        stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${GLYPH[sticker.glyph] || GLYPH.pin}</svg>
      <em>${esc(sticker.label)}</em>
    </span>`;
  }

  function rowHTML(day, max) {
    return `<div class="sticker-row">${stickersFor(day, max)
      .map((sticker, i) => stickerHTML(sticker, day.n + i))
      .join("")}</div>`;
  }

  const dayByN = (n) => TRIP.days.find((day) => String(day.n) === String(n));

  /* ── Stick them onto the page ─────────────────────────────────────── */
  function decorateDays() {
    document.querySelectorAll("#dayGrid [data-day]").forEach((el) => {
      if (el.querySelector(".sticker-row")) return;
      const day = dayByN(el.dataset.day);
      if (!day) return;
      const host = el.querySelector(".card-body") || el.querySelector(".tl-card") || el;
      host.insertAdjacentHTML("beforeend", rowHTML(day, 2));
    });
  }

  function decorateModal() {
    const body = document.getElementById("modalBody");
    const numEl = document.getElementById("modalDayNum");
    if (!body || !numEl || body.querySelector(".sticker-row")) return;
    const day = dayByN(Number(numEl.textContent));
    if (!day) return;
    body.insertAdjacentHTML("afterbegin", rowHTML(day, 3));
  }

  /* One sheet of everything collected on the trip, under the glance row. */
  function buildSheet() {
    const anchor = document.querySelector(".glance-wrap");
    if (!anchor || document.querySelector(".sticker-sheet")) return;

    const seen = new Set();
    const all = [];
    TRIP.days.forEach((day) => {
      stickersFor(day, 3).forEach((sticker) => {
        if (seen.has(sticker.label)) return;
        seen.add(sticker.label);
        all.push(sticker);
      });
    });
    if (all.length < 2) return;

    anchor.insertAdjacentHTML(
      "afterend",
      `<section class="sticker-sheet-wrap">
        <div class="sticker-sheet">
          <p class="sheet-label">Stickers collected</p>
          <div class="sticker-row">${all.map((s, i) => stickerHTML(s, i)).join("")}</div>
        </div>
      </section>`
    );
  }

  function watch(id, run) {
    const target = document.getElementById(id);
    if (!target || !("MutationObserver" in window)) return;
    new MutationObserver(run).observe(target, { childList: true });
  }

  buildSheet();
  decorateDays();
  watch("dayGrid", decorateDays);
  watch("modalBody", decorateModal);
})();

