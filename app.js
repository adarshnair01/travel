(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const byId = (id) => document.getElementById(id);

  /* Shown in a photo slot until a real cover.jpg is dropped into the trip folder. */
  const PHOTO_GLYPH = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
    <rect x="3" y="6" width="18" height="14" rx="2"/><circle cx="12" cy="13" r="3.4"/>
    <path d="M8 6l1.4-2h5.2L16 6" stroke-linejoin="round"/></svg>`;

  const ART = {
    lantern: `<svg class="art-lantern" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect class="sky" width="400" height="240"/>
      <g class="bld"><rect x="30" y="130" width="36" height="110"/><rect x="80" y="100" width="28" height="140"/>
      <rect x="320" y="110" width="40" height="130"/><rect x="280" y="140" width="30" height="100"/></g>
      <g transform="translate(150 20)"><path class="bld" d="M40 180H90V45H40Z"/><path class="bld" d="M35 45H95L88 12H42Z"/>
      <rect class="glow" x="61" y="0" width="8" height="14"/>
      <g class="glow" opacity=".9"><rect x="48" y="60" width="34" height="3"/><rect x="48" y="90" width="34" height="3"/>
      <rect x="48" y="120" width="34" height="3"/><rect x="48" y="150" width="34" height="3"/></g></g>
      <circle class="glow" cx="60" cy="70" r="5" opacity=".8"/><circle class="glow" cx="340" cy="60" r="4" opacity=".7"/>
      <rect class="land" y="210" width="400" height="30"/>
    </svg>`,
    alps: `<svg class="art-alps" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect class="sky" width="400" height="240"/>
      <path class="m2" d="M0 160 L90 50 L150 120 L220 40 L300 130 L360 70 L400 140 V240 H0Z"/>
      <path class="snow" d="M90 50 L115 80 L95 85 L80 70Z"/><path class="snow" d="M220 40 L245 70 L225 75 L205 60Z"/>
      <path class="m1" d="M0 190 L80 140 L160 175 L240 120 L320 170 L400 145 V240 H0Z"/>
      <path class="ground" d="M0 210 H400 V240 H0Z"/>
    </svg>`,
    temple: `<svg class="art-temple" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect class="sky" width="400" height="240"/>
      <circle class="sun" cx="300" cy="58" r="28"/>
      <path class="water" d="M0 168 Q80 150 160 168 T320 168 T400 160 V240 H0Z"/>
      <path class="spire" d="M168 176 V96 L200 48 L232 96 V176Z"/>
      <rect class="base" x="158" y="168" width="84" height="24"/>
      <path class="sand" d="M0 200 H400 V240 H0Z"/>
    </svg>`,
      palace: `<svg class="art-palace" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect class="sky" width="400" height="240"/>
      <path class="ridge" d="M0 150 L70 90 L130 130 L200 70 L280 120 L340 80 L400 130 V240 H0Z"/>
      <path class="palace" d="M140 176 V100 H180 V70 H220 V100 H260 V176Z"/>
      <path class="dome" d="M180 70 Q200 36 220 70Z"/>
      <rect class="sand" y="176" width="400" height="64"/>
    </svg>`,
    beach: `<svg class="art-beach" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect class="sky" width="400" height="240"/>
      <circle class="sun" cx="318" cy="52" r="26"/>
      <path class="water" d="M0 128 Q70 112 140 128 T280 124 T400 118 V240 H0Z"/>
      <path class="sand" d="M0 188 Q120 168 240 188 T400 178 V240 H0Z"/>
      <path class="palm" d="M86 210 V128 M86 128 Q50 110 40 96 M86 128 Q70 88 86 78 M86 128 Q110 88 120 78 M86 128 Q130 118 148 108"/>
    </svg>`,
    vale: `<svg class="art-vale" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect class="sky" width="400" height="240"/>
      <path class="m2" d="M0 150 L80 70 L140 120 L210 40 L290 115 L350 65 L400 130 V240 H0Z"/>
      <path class="snow" d="M210 40 L235 72 L215 76 L198 58Z"/>
      <path class="m1" d="M0 185 L90 145 L170 168 L250 128 L330 165 L400 148 V240 H0Z"/>
      <path class="lake" d="M40 188 Q120 168 200 186 T360 176 V220 H40Z"/>
    </svg>`,
    mist: `<svg class="art-mist" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect class="sky" width="400" height="240"/>
      <path class="far" d="M0 130 L60 90 L110 120 L180 70 L250 115 L320 80 L400 120 V240 H0Z"/>
      <path class="near" d="M0 175 L90 140 L160 165 L240 125 L320 160 L400 145 V240 H0Z"/>
      <path class="fog" d="M0 185 Q80 170 160 185 T320 180 T400 188 V220 H0Z"/>
    </svg>`,
    backwater: `<svg class="art-backwater" viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect class="sky" width="400" height="240"/>
      <circle class="sun" cx="300" cy="48" r="22"/>
      <path class="water" d="M0 130 Q90 118 180 132 T400 124 V240 H0Z"/>
      <path class="land" d="M0 196 H400 V240 H0Z"/>
      <path class="palm" d="M70 210 V118 M70 118 Q40 100 28 88 M70 118 Q58 78 70 68 M70 118 Q95 78 108 68 M70 118 Q118 108 136 98"/>
      <path class="boat" d="M210 168 Q250 158 290 168 L280 176 H220 Z"/>
    </svg>`,
  };

  const trips = [...PORTFOLIO.trips].sort(
    (a, b) => new Date(b.startDate) - new Date(a.startDate)
  );

  const years = [...new Set(trips.map((t) => t.year))].sort((a, b) => b - a);
  const VIEW_KEY = "adarsh.travels.view";
  const state = {
    filter: "all",
    q: "",
    view: localStorage.getItem(VIEW_KEY) === "grid" ? "grid" : "line",
  };

  byId("heroLead").textContent = PORTFOLIO.blurb;

  /* Interactive globe — orthographic projection over a real land grid */
  const GLOBE_POINTS = {
    "taiwan-2026": [25.03, 121.57],
    "europe-2026": [46.82, 8.23],
    "puri-2026": [19.81, 85.83],
    "kerala-temples-2026": [10.595, 76.039],
    "mysore-2026": [12.305, 76.655],
    "kochi-2026": [9.931, 76.267],
    "tawang-2026": [27.59, 91.86],
    "jaipur-2021": [26.91, 75.79],
    "goa-2021": [15.3, 73.95],
    "srinagar-2022": [34.08, 74.8],
    "gangtok-2022": [27.33, 88.61],
    "manali-2022": [32.24, 77.19],
    "kerala-2022": [9.93, 76.27],
    "rajasthan-2022": [26.92, 70.91],
    "munnar-2022": [10.09, 77.06],
    "thailand-2022": [8.04, 98.82],
    "singapore-2023": [1.35, 103.82],
    "bali-2024": [-8.65, 115.22],
    "gujarat-2024": [22.3, 72.0],
    "dharamshala-2024": [32.22, 76.32],
    "shillong-2024": [25.58, 91.89],
    "rishikesh-2024": [30.09, 78.27],
    "kanyakumari-2024": [8.09, 77.54],
    "lansdowne-2025": [29.84, 78.69],
    "chennai-vizag-2025": [13.08, 80.27],
    "hong-kong-2025": [22.3, 114.17],
    "japan-2025": [35.68, 139.76],
    "tirupati-2025": [13.63, 79.42],
    "ujjain-2025": [23.18, 75.79],
    "finland-2026": [60.17, 24.94],
  };
  /* Every city/stop we actually set foot in, in travel order per trip.
     A city listed under more than one trip becomes a single pin. */
  const TRIP_CITIES = {
    "taiwan-2026": [
      ["Taipei", 25.033, 121.565, "TW"],
      ["Yehliu", 25.208, 121.69, "TW"],
      ["Jiufen", 25.109, 121.844, "TW"],
      ["Shifen", 25.041, 121.775, "TW"],
      ["Kaohsiung", 22.627, 120.302, "TW"],
    ],
    "europe-2026": [
      ["Geneva", 46.204, 6.143, "CH"],
      ["Annecy", 45.899, 6.129, "FR"],
      ["Täsch", 46.068, 7.779, "CH"],
      ["Zermatt", 46.021, 7.749, "CH"],
      ["Schaffhausen", 47.678, 8.615, "CH"],
      ["Konstanz", 47.663, 9.175, "DE"],
      ["Zürich", 47.377, 8.542, "CH"],
      ["Milan", 45.464, 9.19, "IT"],
      ["Venice", 45.44, 12.316, "IT"],
      ["Verona", 45.438, 10.993, "IT"],
      ["Val Gardena", 46.556, 11.744, "IT"],
      ["Innsbruck", 47.269, 11.404, "AT"],
      ["Wels", 48.166, 14.025, "AT"],
      ["Passau", 48.573, 13.458, "DE"],
      ["Hallstatt", 47.562, 13.649, "AT"],
      ["Munich", 48.135, 11.582, "DE"],
      ["Neuschwanstein", 47.557, 10.75, "DE"],
      ["Abu Dhabi", 24.453, 54.377, "AE"],
    ],
    "puri-2026": [
      ["Bhubaneswar", 20.296, 85.825, "IN"],
      ["Puri", 19.813, 85.831, "IN"],
      ["Konark", 19.888, 86.094, "IN"],
      ["Satpada", 19.717, 85.317, "IN"],
      ["Deoghar", 24.482, 86.696, "IN"],
      ["Gaya", 24.796, 85.001, "IN"],
      ["Nalanda", 25.136, 85.444, "IN"],
      ["Patna", 25.594, 85.137, "IN"],
    ],
    "kerala-temples-2026": [
      ["Kannur", 11.874, 75.37, "IN"],
      ["Guruvayur", 10.5945, 76.039, "IN"],
      ["Ambalappuzha", 9.3836, 76.3695, "IN"],
      ["Mannarasala", 9.2898, 76.4457, "IN"],
    ],
    "mysore-2026": [
      ["Bengaluru", 12.972, 77.595, "IN"],
      ["Mysore Junction", 12.316, 76.648, "IN"],
      ["Chamundi Hills", 12.273, 76.671, "IN"],
      ["World of Mysore Pak", 12.296, 76.666, "IN"],
      ["St. Philomena’s Cathedral", 12.321, 76.658, "IN"],
      ["Maya Bazaar", 12.312, 76.654, "IN"],
    ],
    "kochi-2026": [
      ["Kannur", 11.874, 75.37, "IN"],
      ["IBM Kochi", 9.931, 76.267, "IN"],
      ["High Court Water Metro", 9.9839, 76.2728, "IN"],
      ["Fort Kochi", 9.9672, 76.2427, "IN"],
    ],
    "tawang-2026": [
      ["Guwahati", 26.144, 91.736, "IN"],
      ["Bhairabkunda", 26.89, 92.115, "IN"],
      ["Rupa", 27.203, 92.401, "IN"],
      ["Dirang", 27.36, 92.241, "IN"],
      ["Sela", 27.509, 92.104, "IN"],
      ["Tawang", 27.586, 91.859, "IN"],
      ["Sangetsar", 27.72, 91.82, "IN"],
      ["Bumla Pass", 27.727, 91.783, "IN"],
      ["Daifam", 26.88, 92.13, "BT"],
      ["Silchar", 24.833, 92.779, "IN"],
      ["Khaspur", 24.86, 92.96, "IN"],
      ["Kolkata", 22.572, 88.363, "IN"],
    ],
    "jaipur-2021": [
      ["Jaipur", 26.912, 75.787, "IN"],
      ["Amer", 26.985, 75.851, "IN"],
    ],
    "goa-2021": [
      ["Margao", 15.275, 73.958, "IN"],
      ["Colva", 15.279, 73.922, "IN"],
      ["Cabo de Rama", 15.091, 73.922, "IN"],
      ["Dudhsagar", 15.314, 74.314, "IN"],
      ["Palolem", 15.01, 74.023, "IN"],
      ["Calangute", 15.545, 73.755, "IN"],
    ],
    "srinagar-2022": [
      ["Srinagar", 34.084, 74.797, "IN"],
      ["Gulmarg", 34.05, 74.38, "IN"],
      ["Pahalgam", 34.016, 75.315, "IN"],
      ["Jammu", 32.727, 74.857, "IN"],
      ["Delhi", 28.614, 77.209, "IN"],
    ],
    "gangtok-2022": [
      ["Gangtok", 27.339, 88.606, "IN"],
      ["Lachen", 27.716, 88.554, "IN"],
      ["Gurudongmar", 28.026, 88.711, "IN"],
      ["Lachung", 27.689, 88.744, "IN"],
      ["Nathu La", 27.387, 88.842, "IN"],
      ["Darjeeling", 27.036, 88.263, "IN"],
    ],
    "manali-2022": [
      ["Gurugram", 28.459, 77.027, "IN"],
      ["Manali", 32.24, 77.188, "IN"],
      ["Solang", 32.317, 77.157, "IN"],
      ["Kasol", 32.01, 77.315, "IN"],
      ["Amritsar", 31.634, 74.873, "IN"],
    ],
    "kerala-2022": [
      ["Wayanad", 11.685, 76.132, "IN"],
      ["Kannur", 11.874, 75.37, "IN"],
      ["Munnar", 10.089, 77.06, "IN"],
      ["Varkala", 8.733, 76.716, "IN"],
      ["Rameswaram", 9.288, 79.313, "IN"],
      ["Tirupati", 13.628, 79.419, "IN"],
    ],
    "rajasthan-2022": [
      ["Bikaner", 28.022, 73.312, "IN"],
      ["Jaisalmer", 26.915, 70.913, "IN"],
      ["Jodhpur", 26.238, 73.024, "IN"],
      ["Chittorgarh", 24.879, 74.629, "IN"],
      ["Udaipur", 24.585, 73.713, "IN"],
    ],
    "munnar-2022": [
      ["Kochi", 9.931, 76.267, "IN"],
      ["Munnar", 10.089, 77.06, "IN"],
      ["Mattupetty", 10.104, 77.126, "IN"],
      ["Kolukkumalai", 9.988, 77.226, "IN"],
      ["Eravikulam", 10.183, 77.05, "IN"],
    ],
    "thailand-2022": [
      ["Bangkok", 13.756, 100.502, "TH"],
      ["Krabi", 8.086, 98.906, "TH"],
      ["Maya Bay", 7.679, 98.766, "TH"],
      ["Phi Phi", 7.741, 98.778, "TH"],
      ["Phuket", 7.88, 98.392, "TH"],
      ["Banana Island", 7.816, 98.495, "TH"],
    ],
    "singapore-2023": [
      ["Kuala Lumpur", 3.139, 101.687, "MY"],
      ["Batu Caves", 3.238, 101.684, "MY"],
      ["Singapore", 1.352, 103.82, "SG"],
      ["Sentosa", 1.249, 103.83, "SG"],
    ],
    "gujarat-2024": [
      ["Pune", 18.52, 73.856, "IN"],
      ["Ajanta", 20.551, 75.707, "IN"],
      ["Aurangabad", 19.876, 75.343, "IN"],
      ["Ellora", 20.027, 75.177, "IN"],
      ["Shirdi", 19.765, 74.477, "IN"],
      ["Mumbai", 19.076, 72.878, "IN"],
      ["Ahmedabad", 23.023, 72.571, "IN"],
      ["Jamnagar", 22.471, 70.058, "IN"],
      ["Dwarka", 22.239, 68.968, "IN"],
      ["Okha", 22.471, 69.069, "IN"],
      ["Somnath", 20.888, 70.401, "IN"],
      ["Vadodara", 22.307, 73.181, "IN"],
    ],
    "kanyakumari-2024": [
      ["Kannur", 11.874, 75.37, "IN"],
      ["Palakkad", 10.786, 76.654, "IN"],
      ["Palani", 10.439, 77.52, "IN"],
      ["Madurai", 9.925, 78.12, "IN"],
      ["Ramanathapuram", 9.359, 78.844, "IN"],
      ["Rameswaram", 9.288, 79.313, "IN"],
      ["Dhanushkodi", 9.178, 79.417, "IN"],
      ["Tirunelveli", 8.713, 77.756, "IN"],
      ["Kanyakumari", 8.088, 77.538, "IN"],
      ["Thiruvananthapuram", 8.524, 76.937, "IN"],
    ],
    "finland-2026": [
      ["Helsinki", 60.17, 24.938, "FI"],
      ["Tallinn", 59.437, 24.754, "EE"],
      ["Rovaniemi", 66.504, 25.729, "FI"],
      ["Stockholm", 59.329, 18.069, "SE"],
    ],
    "japan-2025": [
      ["Bengaluru", 13.199, 77.706, "IN"],
      ["Narita", 35.772, 140.393, "JP"],
      ["Tokyo", 35.666, 139.737, "JP"],
      ["Mount Fuji", 35.361, 138.727, "JP"],
      ["Nikko", 36.72, 139.698, "JP"],
      ["Kyoto", 35.012, 135.768, "JP"],
      ["Nara", 34.685, 135.843, "JP"],
      ["Osaka", 34.669, 135.503, "JP"],
      ["Itami", 34.785, 135.438, "JP"],
    ],
    "ujjain-2025": [
      ["Bengaluru", 13.199, 77.707, "IN"],
      ["Delhi", 28.556, 77.1, "IN"],
      ["Indore", 22.757, 75.903, "IN"],
      ["Ujjain", 23.179, 75.785, "IN"],
      ["Omkareshwar", 22.245, 76.151, "IN"],
      ["Gwalior Junction", 26.216, 78.183, "IN"],
      ["Gwalior Fort", 26.23, 78.169, "IN"],
      ["Sun Temple, Gwalior", 26.236, 78.219, "IN"],
      ["Jai Vilas Palace", 26.205, 78.169, "IN"],
      ["Hazrat Nizamuddin", 28.589, 77.253, "IN"],
    ],
    "tirupati-2025": [
      ["Bengaluru", 12.972, 77.595, "IN"],
      ["Peenya", 13.029, 77.519, "IN"],
      ["Tirupati", 13.629, 79.419, "IN"],
      ["Tirumala", 13.683, 79.347, "IN"],
    ],
    "chennai-vizag-2025": [
      ["Bengaluru", 12.972, 77.595, "IN"],
      ["Kannur", 11.874, 75.37, "IN"],
      ["Chennai", 13.083, 80.275, "IN"],
      ["Novotel SIPCOT", 12.83, 80.227, "IN"],
      ["Mahabalipuram", 12.62, 80.192, "IN"],
      ["Kanchipuram", 12.834, 79.704, "IN"],
      ["Visakhapatnam", 17.723, 83.323, "IN"],
    ],
    "hong-kong-2025": [
      ["Central", 22.283, 114.154, "HK"],
      ["Victoria Peak", 22.276, 114.146, "HK"],
      ["Kowloon", 22.32, 114.17, "HK"],
      ["Tsim Sha Tsui", 22.297, 114.178, "HK"],
      ["Hong Kong Disneyland", 22.313, 114.041, "HK"],
      ["Tian Tan Buddha", 22.254, 113.905, "HK"],
      ["Tai O", 22.253, 113.863, "HK"],
      ["Macau", 22.199, 113.544, "MO"],
    ],
    "lansdowne-2025": [
      ["Rishikesh", 30.086, 78.268, "IN"],
      ["Lansdowne", 29.838, 78.687, "IN"],
      ["Dehradun", 30.316, 78.032, "IN"],
    ],
    "rishikesh-2024": [
      ["Delhi", 28.614, 77.209, "IN"],
      ["Haridwar", 29.945, 78.164, "IN"],
      ["Rishikesh", 30.086, 78.268, "IN"],
      ["Dehradun", 30.316, 78.032, "IN"],
      ["Chakrata", 30.66, 77.895, "IN"],
      ["Mussoorie", 30.459, 78.069, "IN"],
      ["Chennai", 13.083, 80.27, "IN"],
      ["Kannur", 11.874, 75.37, "IN"],
    ],
    "shillong-2024": [
      ["Guwahati", 26.144, 91.736, "IN"],
      ["Umiam", 25.665, 91.893, "IN"],
      ["Shillong", 25.578, 91.893, "IN"],
      ["Cherrapunji", 25.27, 91.732, "IN"],
      ["Mawlynnong", 25.202, 91.917, "IN"],
      ["Dawki", 25.183, 92.017, "IN"],
    ],
    "dharamshala-2024": [
      ["Amb Andaura", 31.991, 76.161, "IN"],
      ["Dalhousie", 32.539, 75.971, "IN"],
      ["Khajjiar", 32.556, 76.065, "IN"],
      ["Dharamshala", 32.219, 76.323, "IN"],
      ["McLeodganj", 32.243, 76.321, "IN"],
      ["Bhagsu", 32.245, 76.333, "IN"],
      ["Triund", 32.256, 76.288, "IN"],
      ["Kangra", 32.103, 76.269, "IN"],
    ],
    "bali-2024": [
      ["Kuala Lumpur", 3.139, 101.687, "MY"],
      ["George Town", 5.414, 100.329, "MY"],
      ["Denpasar", -8.67, 115.212, "ID"],
      ["Kuta", -8.723, 115.177, "ID"],
      ["Tanah Lot", -8.621, 115.087, "ID"],
      ["Canggu", -8.648, 115.138, "ID"],
      ["Ubud", -8.507, 115.263, "ID"],
      ["Uluwatu", -8.829, 115.087, "ID"],
      ["Nusa Penida", -8.727, 115.544, "ID"],
      ["Nusa Dua", -8.797, 115.228, "ID"],
      ["Bangkok", 13.756, 100.502, "TH"],
    ],
  };

  const HOME = [13.0, 77.6];
  const HOME_COUNTRY = "IN";
  const DEG = Math.PI / 180;

  const COUNTRIES = {
    IN: "India", TW: "Taiwan", TH: "Thailand", SG: "Singapore", MY: "Malaysia",
    ID: "Indonesia", HK: "Hong Kong", MO: "Macau", JP: "Japan", AE: "United Arab Emirates",
    CH: "Switzerland", FR: "France", IT: "Italy", AT: "Austria", DE: "Germany",
    FI: "Finland", EE: "Estonia", SE: "Sweden", BT: "Bhutan",
  };
  const FLAGS = {
    IN: "🇮🇳", TW: "🇹🇼", TH: "🇹🇭", SG: "🇸🇬", MY: "🇲🇾", ID: "🇮🇩", HK: "🇭🇰",
    MO: "🇲🇴", JP: "🇯🇵", AE: "🇦🇪", CH: "🇨🇭", FR: "🇫🇷", IT: "🇮🇹", AT: "🇦🇹", DE: "🇩🇪",
    FI: "🇫🇮", EE: "🇪🇪", SE: "🇸🇪", BT: "🇧🇹",
  };

  /* Stats — "cities" counts the same pins the globe shows. */
  const done = trips.filter((t) => t.status === "done").length;
  const upcoming = trips.filter((t) => t.status === "upcoming").length;
  const places = new Set(
    Object.values(TRIP_CITIES).flatMap((list) => list.map(([name]) => name.toLowerCase()))
  ).size;
  byId("stats").innerHTML = [
    { value: trips.length, label: "Trips logged" },
    { value: done, label: "Completed" },
    { value: upcoming, label: "Upcoming" },
    { value: places, label: "Cities visited" },
  ]
    .map((s) => `<div class="stat-cell reveal"><b>${s.value}</b><span>${s.label}</span></div>`)
    .join("");

  function unitVec(lat, lon) {
    const p = lat * DEG;
    const l = lon * DEG;
    const c = Math.cos(p);
    return [c * Math.sin(l), Math.sin(p), c * Math.cos(l)];
  }

  function setupGlobe() {
    const wrap = byId("globeWrap");
    const stage = byId("globeStage");
    const canvas = byId("globeCanvas");
    const pinLayer = byId("globePins");
    const strip = byId("mapTripStrip");
    const resetBtn = byId("globeReset");
    if (!wrap || !stage || !canvas || !pinLayer || !strip) return;

    let ctx = null;
    try {
      ctx = canvas.getContext("2d");
    } catch (err) {
      ctx = null;
    }

    const reduceMotion =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const mapped = trips.filter((t) => GLOBE_POINTS[t.id]);
    if (!mapped.length) return;

    pinLayer.innerHTML = mapped
      .map(
        (t) => `<button type="button" class="globe-pin ${t.status}" data-map-trip="${t.id}"
          aria-label="${t.title} — ${t.when}">
          <span class="pin-dot"></span><span class="pin-name">${t.title}</span>
        </button>`
      )
      .join("");

    strip.innerHTML = mapped
      .map(
        (t) => `<button type="button" data-map-trip="${t.id}">
          <span class="strip-dot ${t.status}"></span>
          <span><b>${t.title}</b><small>${t.year}</small></span>
        </button>`
      )
      .join("");

    const pinEls = new Map(
      mapped.map((t) => [t.id, pinLayer.querySelector(`[data-map-trip="${t.id}"]`)])
    );
    const homeVec = unitVec(HOME[0], HOME[1]);
    const arcs = mapped.map((t) => ({
      id: t.id,
      status: t.status,
      points: greatCircle(homeVec, unitVec(...GLOBE_POINTS[t.id])),
    }));

    function greatCircle(a, b) {
      const dot = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
      const omega = Math.acos(dot);
      const steps = Math.max(12, Math.round(omega * 46));
      const lift = 0.055 + Math.min(0.14, omega * 0.1);
      const pts = [];
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        let v;
        if (omega < 1e-4) {
          v = a.slice();
        } else {
          const s = Math.sin(omega);
          const k0 = Math.sin((1 - t) * omega) / s;
          const k1 = Math.sin(t * omega) / s;
          v = [a[0] * k0 + b[0] * k1, a[1] * k0 + b[1] * k1, a[2] * k0 + b[2] * k1];
        }
        pts.push([v[0], v[1], v[2], 1 + lift * Math.sin(Math.PI * t)]);
      }
      return pts;
    }

    /* Rotation state */
    const view = { lam: -HOME[1] * DEG, phi: HOME[0] * DEG, zoom: 1 };
    const goal = { lam: view.lam, phi: view.phi, zoom: 1 };
    let spin = goal.lam;
    let tiltLam = 0;
    let tiltPhi = 0;
    let velocity = 0;
    let dragging = false;
    let hovering = false;
    let selectedId = null;
    let pointerId = null;
    let lastX = 0;
    let lastY = 0;

    let cx = 0;
    let cy = 0;
    let radius = 0;

    function resize() {
      const rect = stage.getBoundingClientRect();
      if (!rect.width || !rect.height || !ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = rect.width / 2;
      cy = rect.height / 2;
      radius = Math.min(rect.width, rect.height) * 0.4;
    }

    /* Project a world-space unit vector into screen space */
    let cosLam = 1;
    let sinLam = 0;
    let cosPhi = 1;
    let sinPhi = 0;
    function updateTrig() {
      cosLam = Math.cos(view.lam);
      sinLam = Math.sin(view.lam);
      cosPhi = Math.cos(view.phi);
      sinPhi = Math.sin(view.phi);
    }
    function project(v, r) {
      const x1 = v[0] * cosLam + v[2] * sinLam;
      const z1 = -v[0] * sinLam + v[2] * cosLam;
      const y1 = v[1];
      const y2 = y1 * cosPhi - z1 * sinPhi;
      const z2 = y1 * sinPhi + z1 * cosPhi;
      const scale = radius * view.zoom * (r || 1);
      return { x: cx + x1 * scale, y: cy - y2 * scale, z: z2, nx: x1, ny: y2 };
    }

    const LIGHT = (() => {
      const v = [-0.42, 0.46, 0.78];
      const len = Math.hypot(v[0], v[1], v[2]);
      return [v[0] / len, v[1] / len, v[2] / len];
    })();

    const LAND_TIERS = [
      "rgba(24, 92, 96, 0.85)",
      "rgba(41, 133, 130, 0.9)",
      "rgba(64, 176, 163, 0.94)",
      "rgba(104, 214, 194, 0.97)",
      "rgba(158, 240, 220, 1)",
    ];

    function drawGraticule(R) {
      ctx.lineWidth = 0.6;
      ctx.strokeStyle = "rgba(168, 222, 218, 0.13)";
      ctx.beginPath();
      for (let lon = -180; lon < 180; lon += 20) {
        let started = false;
        for (let lat = -80; lat <= 80; lat += 4) {
          const p = project(unitVec(lat, lon));
          if (p.z > 0) {
            if (started) ctx.lineTo(p.x, p.y);
            else ctx.moveTo(p.x, p.y);
            started = true;
          } else started = false;
        }
      }
      for (let lat = -60; lat <= 60; lat += 20) {
        let started = false;
        for (let lon = -180; lon <= 180; lon += 4) {
          const p = project(unitVec(lat, lon));
          if (p.z > 0) {
            if (started) ctx.lineTo(p.x, p.y);
            else ctx.moveTo(p.x, p.y);
            started = true;
          } else started = false;
        }
      }
      ctx.stroke();
    }

    function drawLand(R) {
      const size = Math.max(1.05, R * 0.0092);
      const half = size / 2;
      const paths = LAND_TIERS.map(() => new Path2D());
      for (let i = 0; i < GLOBE_LAND.length; i += 2) {
        const v = unitVec(GLOBE_LAND[i + 1], GLOBE_LAND[i]);
        const x1 = v[0] * cosLam + v[2] * sinLam;
        const z1 = -v[0] * sinLam + v[2] * cosLam;
        const y2 = v[1] * cosPhi - z1 * sinPhi;
        const z2 = v[1] * sinPhi + z1 * cosPhi;
        if (z2 <= 0.012) continue;
        const scale = R;
        const px = cx + x1 * scale;
        const py = cy - y2 * scale;
        const lit = x1 * LIGHT[0] + y2 * LIGHT[1] + z2 * LIGHT[2];
        let tier = Math.floor((lit * 0.5 + 0.5) * LAND_TIERS.length);
        if (tier < 0) tier = 0;
        if (tier > LAND_TIERS.length - 1) tier = LAND_TIERS.length - 1;
        paths[tier].rect(px - half, py - half, size, size);
      }
      paths.forEach((path, i) => {
        ctx.fillStyle = LAND_TIERS[i];
        ctx.fill(path);
      });
    }

    function drawArcs(R, time) {
      arcs.forEach((arc) => {
        const active = arc.id === selectedId;
        ctx.setLineDash(active ? [5, 7] : [3, 8]);
        ctx.lineDashOffset = active ? -time * 0.022 : 0;
        ctx.lineWidth = active ? 1.9 : 0.9;
        ctx.strokeStyle =
          arc.status === "upcoming"
            ? active
              ? "rgba(251, 146, 60, 0.95)"
              : "rgba(251, 146, 60, 0.22)"
            : active
              ? "rgba(94, 234, 212, 0.95)"
              : "rgba(94, 234, 212, 0.18)";
        ctx.beginPath();
        let started = false;
        for (let i = 0; i < arc.points.length; i++) {
          const pt = arc.points[i];
          const p = project(pt, pt[3]);
          const outside = Math.hypot(p.x - cx, p.y - cy) > R;
          if (p.z > 0 || outside) {
            if (started) ctx.lineTo(p.x, p.y);
            else ctx.moveTo(p.x, p.y);
            started = true;
          } else started = false;
        }
        ctx.stroke();
      });
      ctx.setLineDash([]);
      ctx.lineDashOffset = 0;
    }

    function drawSphere(R) {
      const lx = cx - R * 0.34;
      const ly = cy - R * 0.38;
      const ocean = ctx.createRadialGradient(lx, ly, R * 0.05, cx, cy, R * 1.05);
      ocean.addColorStop(0, "#14384d");
      ocean.addColorStop(0.45, "#0d2536");
      ocean.addColorStop(1, "#050d16");
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = ocean;
      ctx.fill();
    }

    function drawAtmosphere(R) {
      const glow = ctx.createRadialGradient(cx, cy, R * 0.96, cx, cy, R * 1.22);
      glow.addColorStop(0, "rgba(45, 212, 191, 0.3)");
      glow.addColorStop(0.45, "rgba(45, 212, 191, 0.09)");
      glow.addColorStop(1, "rgba(45, 212, 191, 0)");
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.22, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();
    }

    function drawShading(R) {
      const lx = cx - R * 0.36;
      const ly = cy - R * 0.4;
      const shade = ctx.createRadialGradient(lx, ly, R * 0.15, cx + R * 0.2, cy + R * 0.24, R * 1.25);
      shade.addColorStop(0, "rgba(255, 255, 255, 0.07)");
      shade.addColorStop(0.5, "rgba(0, 0, 0, 0)");
      shade.addColorStop(1, "rgba(1, 6, 12, 0.72)");
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = shade;
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
      ctx.restore();

      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(147, 224, 214, 0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    function positionPins(R) {
      mapped.forEach((trip) => {
        const el = pinEls.get(trip.id);
        if (!el) return;
        const p = project(unitVec(...GLOBE_POINTS[trip.id]));
        const front = p.z > 0.05;
        el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%)`;
        el.style.opacity = front ? String(Math.min(1, 0.45 + p.z)) : "0";
        el.style.zIndex = String(10 + Math.round(p.z * 40));
        el.style.pointerEvents = front ? "auto" : "none";
        el.tabIndex = front ? 0 : -1;
        el.classList.toggle("is-back", !front);
      });
    }

    function frame(time) {
      if (!ctx || !radius) {
        rafId = requestAnimationFrame(frame);
        return;
      }
      if (!dragging) {
        if (!reduceMotion) {
          if (Math.abs(velocity) > 0.00002) {
            spin += velocity;
            velocity *= 0.94;
          } else if (!hovering && !centered) {
            spin += 0.0013;
          }
        }
        goal.lam = spin + tiltLam;
        goal.phi = basePhi + tiltPhi;
      }
      const ease = reduceMotion ? 1 : 0.09;
      view.lam += (goal.lam - view.lam) * ease;
      view.phi += (goal.phi - view.phi) * ease;
      view.zoom += (goal.zoom - view.zoom) * ease;
      updateTrig();

      const R = radius * view.zoom;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawAtmosphere(R);
      drawSphere(R);
      drawGraticule(R);
      drawLand(R);
      drawArcs(R, time);
      drawShading(R);
      positionPins(R);

      rafId = requestAnimationFrame(frame);
    }

    let basePhi = HOME[0] * DEG;
    let centered = false;
    let rafId = null;

    function selectTrip(id, opts = {}) {
      const trip = trips.find((t) => t.id === id);
      if (!trip) return;
      selectedId = id;
      [...pinEls.values(), ...$$("button", strip)].forEach((el) =>
        el.classList.toggle("is-active", el.dataset.mapTrip === id)
      );
      if (opts.center !== false) {
        centered = true;
        if (resetBtn) resetBtn.hidden = false;
        const [lat, lon] = GLOBE_POINTS[id];
        spin = -lon * DEG;
        basePhi = lat * DEG;
        tiltLam = 0;
        tiltPhi = 0;
        velocity = 0;
        goal.lam = spin;
        goal.phi = basePhi;
        goal.zoom = 1.15;
      }
    }

    function resetView() {
      selectedId = null;
      centered = false;
      goal.zoom = 1;
      basePhi = 14 * DEG;
      [...pinEls.values(), ...$$("button", strip)].forEach((el) => el.classList.remove("is-active"));
      if (resetBtn) resetBtn.hidden = true;
    }

    /* Pointer interaction */
    stage.addEventListener("pointerdown", (e) => {
      dragging = true;
      pointerId = e.pointerId;
      lastX = e.clientX;
      lastY = e.clientY;
      velocity = 0;
      stage.setPointerCapture(pointerId);
      stage.classList.add("is-dragging");
    });

    stage.addEventListener("pointermove", (e) => {
      const rect = stage.getBoundingClientRect();
      if (dragging) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        const k = 1 / (radius * view.zoom);
        spin += dx * k;
        basePhi = Math.max(-1.25, Math.min(1.25, basePhi + dy * k));
        velocity = dx * k * 0.6;
        goal.lam = spin;
        goal.phi = basePhi;
        return;
      }
      if (reduceMotion) return;
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      tiltLam = px * 0.5;
      tiltPhi = -py * 0.36;
    });

    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      stage.classList.remove("is-dragging");
      if (pointerId !== null && stage.hasPointerCapture && stage.hasPointerCapture(pointerId)) {
        stage.releasePointerCapture(pointerId);
      }
      pointerId = null;
    };
    stage.addEventListener("pointerup", endDrag);
    stage.addEventListener("pointercancel", endDrag);

    stage.addEventListener("pointerenter", () => (hovering = true));
    stage.addEventListener("pointerleave", () => {
      hovering = false;
      tiltLam = 0;
      tiltPhi = 0;
      endDrag();
    });

    pinLayer.addEventListener("pointerover", (e) => {
      const btn = e.target.closest("[data-map-trip]");
      if (btn && !dragging) selectTrip(btn.dataset.mapTrip, { center: false });
    });

    wrap.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-map-trip]");
      if (btn) selectTrip(btn.dataset.mapTrip);
    });
    strip.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-map-trip]");
      if (btn) selectTrip(btn.dataset.mapTrip);
    });
    wrap.addEventListener("focusin", (e) => {
      const btn = e.target.closest("[data-map-trip]");
      if (btn) selectTrip(btn.dataset.mapTrip);
    });
    if (resetBtn) resetBtn.addEventListener("click", resetView);

    /* Size + lifecycle */
    resize();
    if ("ResizeObserver" in window) new ResizeObserver(resize).observe(stage);
    else window.addEventListener("resize", resize);

    const initial = next && GLOBE_POINTS[next.id] ? next.id : mapped[mapped.length - 1].id;
    selectTrip(initial, { center: false });

    if (ctx && typeof requestAnimationFrame === "function") {
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(
          (entries) => {
            entries.forEach((en) => {
              if (en.isIntersecting && rafId === null) rafId = requestAnimationFrame(frame);
              else if (!en.isIntersecting && rafId !== null) {
                cancelAnimationFrame(rafId);
                rafId = null;
              }
            });
          },
          { threshold: 0.02 }
        ).observe(wrap);
      } else {
        rafId = requestAnimationFrame(frame);
      }
    }
  }

  /* Set once the vector map exists, so the overlay can resize it on open. */
  let mapInstance = null;
  /* Set once the map is wired up, so opening the sheet can land somewhere. */
  let focusRandomTrip = null;

  /* Real vector globe — MapLibre + OpenFreeMap */
  function setupRealMap() {
    const container = byId("realMap");
    const strip = byId("mapTripStrip");
    const loading = byId("mapLoading");
    const resetBtn = byId("globeReset");
    if (!container || !strip || !loading || !resetBtn) return;

    const mapped = trips.filter((trip) => GLOBE_POINTS[trip.id]);
    const tripById = new Map(mapped.map((trip) => [trip.id, trip]));
    let map = null;
    let mapReady = false;
    let selectedTrip = null;

    /* Merge the per-trip city lists into one pin per city. */
    const cityIndex = new Map();
    mapped.forEach((trip) => {
      (TRIP_CITIES[trip.id] || []).forEach(([name, lat, lon, code]) => {
        const key = name.toLowerCase();
        let city = cityIndex.get(key);
        if (!city) {
          city = { name, lat, lon, code, trips: [] };
          cityIndex.set(key, city);
        }
        if (!city.trips.includes(trip.id)) city.trips.push(trip.id);
      });
    });
    const cities = [...cityIndex.values()];
    const cityStatus = (city) =>
      city.trips.some((id) => tripById.get(id).status === "upcoming") ? "upcoming" : "done";

    /* The index: cities filed under their country, or the trip list. One
       search box serves whichever tab is showing. */
    const indexEl = byId("cityIndex");
    const searchEl = byId("indexSearch");
    const clearEl = byId("indexClear");
    const countries = [...new Set(cities.map((city) => city.code))].sort((a, b) => {
      if (a === HOME_COUNTRY) return -1;
      if (b === HOME_COUNTRY) return 1;
      return (COUNTRIES[a] || a).localeCompare(COUNTRIES[b] || b);
    });

    let indexMode = "cities";
    let selectedCity = null;

    const tallyEl = byId("sheetTally");
    if (tallyEl) {
      tallyEl.textContent = `${cities.length} cities · ${countries.length} countries · ${mapped.length} trips`;
    }
    const setCount = (id, n) => {
      const el = byId(id);
      if (el) el.textContent = n;
    };
    setCount("countCities", cities.length);
    setCount("countTrips", mapped.length);

    /* A trip's searchable text: title, year, and everywhere it went. */
    const tripHaystack = new Map(
      mapped.map((trip) => [
        trip.id,
        [
          trip.title,
          trip.year,
          trip.when,
          ...(trip.places || []),
          ...(TRIP_CITIES[trip.id] || []).map(([name, , , code]) => `${name} ${COUNTRIES[code] || code}`),
        ]
          .join(" ")
          .toLowerCase(),
      ])
    );

    function renderCityIndex(q) {
      const groups = countries
        .map((code) => {
          const name = COUNTRIES[code] || code;
          const inCountry = cities
            .filter((city) => city.code === code)
            .filter(
              (city) =>
                !q || city.name.toLowerCase().includes(q) || name.toLowerCase().includes(q)
            )
            .sort((a, b) => a.name.localeCompare(b.name));
          if (!inCountry.length) return "";
          return `<section class="index-group">
            <h4>${FLAGS[code] || "•"} ${name} <i>${inCountry.length}</i></h4>
            <div class="index-cities">
              ${inCountry
                .map(
                  (city) => `<button type="button" data-map-city="${city.name}"${
                    city.name === selectedCity ? ' class="is-active"' : ""
                  }>
                    <span class="strip-dot ${cityStatus(city)}"></span>${city.name}
                    ${city.trips.length > 1 ? `<i title="On ${city.trips.length} trips">×${city.trips.length}</i>` : ""}
                  </button>`
                )
                .join("")}
            </div>
          </section>`;
        })
        .join("");
      indexEl.innerHTML = groups || emptyNote("city", q);
    }

    function renderTripStrip(q) {
      const hits = mapped.filter((trip) => !q || tripHaystack.get(trip.id).includes(q));
      if (!hits.length) {
        strip.innerHTML = emptyNote("trip", q);
        return;
      }
      strip.innerHTML = hits
        .map((trip) => {
          const own = cities.filter((city) => city.trips.includes(trip.id)).length;
          return `<button type="button" data-map-trip="${trip.id}"${
            trip.id === selectedTrip ? ' class="is-active"' : ""
          }>
            <span class="strip-dot ${trip.status}"></span>
            <span>
              <b>${trip.title}</b>
              <small>${trip.year} · ${own} ${own === 1 ? "city" : "cities"}</small>
            </span>
          </button>`;
        })
        .join("");
    }

    const emptyNote = (kind, q) =>
      `<p class="index-empty">No ${kind} matches <b>“${q}”</b>.</p>`;

    function renderIndex() {
      const q = searchEl ? searchEl.value.trim().toLowerCase() : "";
      if (clearEl) clearEl.hidden = !q;
      if (indexMode === "cities") renderCityIndex(q);
      else renderTripStrip(q);
    }

    renderCityIndex("");
    renderTripStrip("");

    if (searchEl) {
      searchEl.addEventListener("input", renderIndex);
    }
    if (clearEl) {
      clearEl.addEventListener("click", () => {
        searchEl.value = "";
        renderIndex();
        searchEl.focus();
      });
    }
    indexEl.addEventListener("click", (event) => {
      const button = event.target.closest("[data-map-city]");
      if (button) setCityDetails(button.dataset.mapCity);
    });

    /* Cities / trips toggle — the search follows whichever list is up. */
    function showIndex(mode, focus) {
      indexMode = mode;
      $$("[data-index]").forEach((tab) => {
        const on = tab.dataset.index === mode;
        tab.classList.toggle("is-on", on);
        tab.setAttribute("aria-selected", String(on));
      });
      const showCities = mode === "cities";
      indexEl.hidden = !showCities;
      strip.hidden = showCities;
      if (searchEl) {
        searchEl.placeholder = showCities
          ? "Find a city or country…"
          : "Find a trip, year or place…";
        searchEl.value = "";
        if (focus) searchEl.focus();
      }
      renderIndex();
    }
    $$("[data-index]").forEach((tab) => {
      tab.addEventListener("click", () => showIndex(tab.dataset.index, true));
    });

    function markStrip(id) {
      $$("[data-map-trip]", strip).forEach((button) =>
        button.classList.toggle("is-active", button.dataset.mapTrip === id)
      );
      $$("[data-map-city]", indexEl).forEach((button) =>
        button.classList.toggle("is-active", button.dataset.mapCity === selectedCity)
      );
    }

    function frame(points, fly) {
      if (!mapReady || !map || !fly || !points.length) return;
      if (points.length === 1) {
        map.flyTo({
          center: [points[0].lon, points[0].lat],
          zoom: Math.max(map.getZoom(), 8.5),
          duration: 1450,
          essential: true,
        });
        return;
      }
      const lons = points.map((p) => p.lon);
      const lats = points.map((p) => p.lat);
      map.fitBounds(
        [
          [Math.min(...lons), Math.min(...lats)],
          [Math.max(...lons), Math.max(...lats)],
        ],
        { padding: 90, maxZoom: 9, duration: 1450, essential: true }
      );
    }

    /* Highlight one trip — i.e. every city on it. */
    function setTripDetails(id, fly = true) {
      const trip = tripById.get(id);
      if (!trip) return;
      const own = cities.filter((city) => city.trips.includes(id));

      selectedTrip = id;
      selectedCity = null;
      markStrip(id);
      resetBtn.hidden = false;

      if (mapReady && map && map.getLayer("city-selected")) {
        map.setFilter("city-selected", ["in", `,${id},`, ["get", "tripKey"]]);
      }
      frame(own, fly);
    }

    /* Highlight a single city. */
    function setCityDetails(name, fly = true) {
      const city = cityIndex.get(String(name).toLowerCase());
      if (!city) return;
      const visits = city.trips.map((id) => tripById.get(id));
      const primary = visits[0];

      selectedTrip = primary.id;
      selectedCity = city.name;
      markStrip(primary.id);
      resetBtn.hidden = false;

      if (mapReady && map && map.getLayer("city-selected")) {
        map.setFilter("city-selected", ["==", ["get", "name"], city.name]);
      }
      frame([city], fly);
    }

    function resetMap() {
      selectedTrip = null;
      selectedCity = null;
      markStrip(null);
      resetBtn.hidden = true;
      if (mapReady && map) {
        if (map.getLayer("city-selected")) {
          map.setFilter("city-selected", ["==", ["get", "name"], ""]);
        }
        map.flyTo({
          center: [72, 21],
          zoom: 1.8,
          bearing: 0,
          pitch: 0,
          duration: 1300,
          essential: true,
        });
      }
    }

    /* Opening the sheet drops you somewhere we've been rather than on a
       blank globe. Never the same trip twice running. */
    focusRandomTrip = function pickTrip() {
      if (!mapped.length) return;
      /* The sheet opens on a trip, not a city. The trip list is what should
         be showing, with that trip marked. */
      showIndex("trips");
      const pool = mapped.filter((trip) => trip.id !== selectedTrip);
      const list = pool.length ? pool : mapped;
      setTripDetails(list[Math.floor(Math.random() * list.length)].id);
    };

    strip.addEventListener("click", (event) => {
      const button = event.target.closest("[data-map-trip]");
      if (button) setTripDetails(button.dataset.mapTrip);
    });
    resetBtn.addEventListener("click", resetMap);

    function greatCircle(start, end, steps = 52) {
      const a = unitVec(start[0], start[1]);
      const b = unitVec(end[0], end[1]);
      const dot = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
      const angle = Math.acos(dot);
      if (angle < 0.0001) return [[start[1], start[0]], [end[1], end[0]]];
      const sinAngle = Math.sin(angle);
      return Array.from({ length: steps + 1 }, (_, index) => {
        const t = index / steps;
        const p = Math.sin((1 - t) * angle) / sinAngle;
        const q = Math.sin(t * angle) / sinAngle;
        const x = a[0] * p + b[0] * q;
        const y = a[1] * p + b[1] * q;
        const z = a[2] * p + b[2] * q;
        return [
          Math.atan2(x, z) / DEG,
          Math.atan2(y, Math.hypot(x, z)) / DEG,
        ];
      });
    }

    const pointData = {
      type: "FeatureCollection",
      features: cities.map((city) => ({
        type: "Feature",
        properties: {
          name: city.name,
          /* Comma-wrapped so a substring test can't match a partial id. */
          tripKey: `,${city.trips.join(",")},`,
          visits: city.trips.length,
          status: cityStatus(city),
        },
        geometry: { type: "Point", coordinates: [city.lon, city.lat] },
      })),
    };

    const routeData = {
      type: "FeatureCollection",
      features: mapped.map((trip) => ({
        type: "Feature",
        properties: { id: trip.id, status: trip.status },
        geometry: {
          type: "LineString",
          coordinates: greatCircle(HOME, GLOBE_POINTS[trip.id]),
        },
      })),
    };

    const DONE_INK = "#5f6b3a";
    const SOON_INK = "#c9a227";

    function addTripLayers() {
      if (!map || map.getSource("portfolio-cities")) return;

      map.addSource("portfolio-routes", { type: "geojson", data: routeData });
      map.addLayer({
        id: "trip-routes",
        type: "line",
        source: "portfolio-routes",
        paint: {
          "line-color": ["case", ["==", ["get", "status"], "upcoming"], SOON_INK, DONE_INK],
          "line-width": ["interpolate", ["linear"], ["zoom"], 1, 1, 7, 2.4],
          "line-opacity": ["interpolate", ["linear"], ["zoom"], 1, 0.3, 7, 0.14],
          "line-dasharray": [2, 2],
        },
      });

      map.addSource("portfolio-cities", {
        type: "geojson",
        data: pointData,
        cluster: true,
        clusterMaxZoom: 8,
        clusterRadius: 38,
      });
      map.addLayer({
        id: "city-clusters",
        type: "circle",
        source: "portfolio-cities",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": DONE_INK,
          "circle-radius": ["step", ["get", "point_count"], 16, 5, 20, 12, 25],
          "circle-stroke-color": "rgba(255,255,255,0.92)",
          "circle-stroke-width": 2,
          "circle-opacity": 0.92,
        },
      });
      map.addLayer({
        id: "city-cluster-count",
        type: "symbol",
        source: "portfolio-cities",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-size": 12,
          "text-allow-overlap": true,
          "text-font": ["Noto Sans Regular"],
        },
        paint: { "text-color": "#ffffff" },
      });
      map.addLayer({
        id: "city-points",
        type: "circle",
        source: "portfolio-cities",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": ["case", ["==", ["get", "status"], "upcoming"], SOON_INK, DONE_INK],
          /* Cities visited on more than one trip read a little larger. */
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            1,
            ["case", [">", ["get", "visits"], 1], 6, 4.5],
            9,
            ["case", [">", ["get", "visits"], 1], 10, 8],
          ],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 1.8,
          "circle-opacity": 0.97,
        },
      });
      map.addLayer({
        id: "city-selected",
        type: "circle",
        source: "portfolio-cities",
        filter: ["==", ["get", "name"], ""],
        paint: {
          "circle-color": "rgba(255,255,255,0)",
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 1, 10, 9, 17],
          "circle-stroke-color": "#c9a227",
          "circle-stroke-width": 3,
          "circle-blur": 0.12,
        },
      });
      map.addLayer({
        id: "city-labels",
        type: "symbol",
        source: "portfolio-cities",
        minzoom: 3,
        filter: ["!", ["has", "point_count"]],
        layout: {
          "text-field": ["get", "name"],
          "text-size": 12,
          "text-offset": [0, 1.25],
          "text-anchor": "top",
          "text-font": ["Noto Sans Regular"],
        },
        paint: {
          "text-color": "#4e3228",
          "text-halo-color": "rgba(255,255,255,0.95)",
          "text-halo-width": 2,
        },
      });

      map.on("click", "city-points", (event) => {
        const feature = event.features && event.features[0];
        if (feature) setCityDetails(feature.properties.name, false);
      });
      map.on("click", "city-clusters", (event) => {
        const feature = event.features && event.features[0];
        if (!feature) return;
        const source = map.getSource("portfolio-cities");
        Promise.resolve(source.getClusterExpansionZoom(feature.properties.cluster_id))
          .then((zoom) =>
            map.easeTo({
              center: feature.geometry.coordinates,
              zoom,
              duration: 900,
            })
          )
          .catch(() => {});
      });
      ["city-points", "city-clusters"].forEach((layer) => {
        map.on("mouseenter", layer, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", layer, () => {
          map.getCanvas().style.cursor = "";
        });
      });
    }

    resetMap();
    resetBtn.hidden = true;

    import("https://unpkg.com/maplibre-gl@6.5.0/dist/maplibre-gl.mjs")
      .then((maplibregl) => {
        map = new maplibregl.Map({
          container,
          style: "https://tiles.openfreemap.org/styles/liberty",
          center: [72, 21],
          zoom: 1.8,
          minZoom: 0.7,
          maxZoom: 16,
          pitch: 0,
          bearing: 0,
          renderWorldCopies: false,
          attributionControl: false,
        });
        mapInstance = map;
        map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
        map.addControl(
          new maplibregl.AttributionControl({
            compact: true,
            customAttribution: "OpenFreeMap · OpenStreetMap",
          }),
          "bottom-right"
        );
        map.on("style.load", () => {
          map.setProjection({ type: "globe" });
          addTripLayers();
          mapReady = true;
          loading.classList.add("is-done");
          /* A trip may have been picked while the tiles were still coming
             in — frame it now that the map can actually move. */
          if (selectedTrip) {
            if (map.getLayer("city-selected")) {
              map.setFilter("city-selected", ["in", `,${selectedTrip},`, ["get", "tripKey"]]);
            }
            frame(cities.filter((city) => city.trips.includes(selectedTrip)), true);
          }
        });
      })
      .catch(() => {
        loading.classList.add("is-error");
        loading.querySelector("p").textContent =
          "The live map needs an internet connection. Trip links are still available below.";
      });
  }

  /* The plate stays folded until asked for — the map only boots on the
     first unfold, so the page never pays for tiles nobody looked at. */
  function setupMapOverlay() {
    const plate = byId("mapPlate");
    const overlay = byId("mapOverlay");
    if (!plate || !overlay) return;

    const backdrop = byId("mapOverlayBackdrop");
    const closeBtn = byId("mapClose");
    const stats = byId("plateStats");
    const sheet = overlay.querySelector(".map-sheet");
    const stillness = window.matchMedia("(prefers-reduced-motion: reduce)");

    const GROW = 640;
    const SHRINK = 420;

    let booted = false;
    let opened = false;
    let lastFocus = null;
    let timers = [];

    const after = (ms, fn) => timers.push(window.setTimeout(fn, ms));
    const clearTimers = () => {
      timers.forEach(window.clearTimeout);
      timers = [];
    };

    /* The transform that lays the sheet exactly over another box. */
    const onto = (box, sheetBox) =>
      `translate(${box.left - sheetBox.left}px, ${box.top - sheetBox.top}px)` +
      ` scale(${box.width / sheetBox.width}, ${box.height / sheetBox.height})`;

    /* Measure the sheet at its true size, then start it on the plate. */
    function stretchFrom(box) {
      sheet.style.transition = "none";
      sheet.style.transform = "none";
      const sheetBox = sheet.getBoundingClientRect();
      sheet.style.transform = onto(box, sheetBox);
      void sheet.offsetWidth;
      sheet.style.transition = "";
    }

    if (stats) {
      const cityCount = new Set(
        Object.values(TRIP_CITIES).flatMap((list) => list.map(([name]) => name.toLowerCase()))
      ).size;
      const countryCount = new Set(
        Object.values(TRIP_CITIES).flatMap((list) => list.map(([, , , code]) => code))
      ).size;
      stats.textContent = `${cityCount} cities · ${countryCount} countries · ${trips.length} trips`;
    }

    function settle() {
      if (mapInstance) mapInstance.resize();
      if (focusRandomTrip) focusRandomTrip();
      const search = byId("indexSearch");
      if (search) search.focus({ preventScroll: true });
    }

    function open() {
      if (opened) return;
      opened = true;
      clearTimers();
      lastFocus = document.activeElement;

      /* Measured before the body locks, so the sheet starts on the plate. */
      const from = plate.getBoundingClientRect();
      overlay.hidden = false;
      document.body.classList.add("map-is-open");
      overlay.classList.add("is-lit");
      plate.classList.add("is-unfolded");

      if (!booted) {
        booted = true;
        setupRealMap();
      }

      if (stillness.matches) {
        overlay.classList.add("is-open");
        settle();
        return;
      }

      stretchFrom(from);
      requestAnimationFrame(() => {
        overlay.classList.add("is-open");
        sheet.style.transform = "none";
      });
      after(GROW, settle);
    }

    function done() {
      overlay.hidden = true;
      document.body.classList.remove("map-is-open");
      if (lastFocus) lastFocus.focus({ preventScroll: true });
    }

    function close() {
      if (!opened) return;
      opened = false;
      clearTimers();
      overlay.classList.remove("is-open");
      plate.classList.remove("is-unfolded");

      if (stillness.matches) {
        overlay.classList.remove("is-lit");
        done();
        return;
      }

      /* Back down onto the plate, a touch quicker than it came up. */
      const sheetBox = sheet.getBoundingClientRect();
      const plateBox = plate.getBoundingClientRect();
      sheet.style.transition = `transform ${SHRINK}ms cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease`;
      sheet.style.transform = onto(plateBox, sheetBox);

      after(160, () => overlay.classList.remove("is-lit"));
      after(SHRINK, () => {
        sheet.style.transition = "";
        done();
      });
    }

    plate.addEventListener("click", open);
    if (closeBtn) closeBtn.addEventListener("click", close);
    if (backdrop) backdrop.addEventListener("click", close);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        close();
        return;
      }
      /* Keep Tab inside the sheet while it's open. */
      if (event.key !== "Tab" || !opened) return;
      const stops = $$(
        'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
        overlay
      ).filter((el) => el.offsetParent !== null);
      if (!stops.length) return;
      const first = stops[0];
      const last = stops[stops.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (!overlay.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  /* Next trip countdown */
  const next = trips
    .filter((t) => t.status === "upcoming")
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))[0];

  if (next) {
    const nextBtn = byId("nextBtn");
    nextBtn.hidden = false;
    nextBtn.href = next.href;
    nextBtn.textContent = `Next up: ${next.title} →`;
    byId("heroNext").href = next.href;
  }

  function tick() {
    if (!next) return;
    const box = byId("heroNext");
    box.hidden = false;
    byId("nextName").textContent = next.title;
    byId("nextWhen").textContent = next.when;
    const start = new Date(next.startDate + "T08:00:00");
    const end = new Date(next.endDate + "T23:59:59");
    const now = new Date();
    let target = start;
    let label = "Next departure";

    if (now >= start && now <= end) {
      label = "Happening now";
      target = end;
    } else if (now > end) {
      $$("[data-cd]").forEach((el) => (el.textContent = "✓"));
      $(".next-label").textContent = "Just wrapped";
      return;
    }

    $(".next-label").textContent = label;
    const diff = Math.max(0, target - now);
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff / 3600000) % 24);
    const m = Math.floor((diff / 60000) % 60);
    const s = Math.floor((diff / 1000) % 60);
    const set = (k, v) => {
      const el = $(`[data-cd="${k}"]`);
      if (el) el.textContent = String(v).padStart(2, "0");
    };
    set("days", d);
    set("hours", h);
    set("mins", m);
    set("secs", s);
  }

  const dayCount = (t) =>
    Math.round((new Date(t.endDate) - new Date(t.startDate)) / 86400000) + 1;

  const tripScope = (t) => (t.scope === "international" ? "international" : "domestic");
  const scopeLabel = (t) => (tripScope(t) === "international" ? "International" : "Domestic");

  function cardHTML(t) {
    const chips = t.places.slice(0, 3);
    const rest = t.places.length - chips.length;
    const cover = encodeURI(t.cover || "");
    const scope = tripScope(t);
    return `<a class="trip-card reveal" href="${t.href}" data-status="${t.status}" data-scope="${scope}"
        aria-label="${t.title} — ${scopeLabel(t)}. ${t.when}. ${t.cta}.">
      <div class="trip-art photo-frame is-empty">
        <img src="${cover}" alt="" loading="lazy" data-fallback="card" />
        <div class="photo-empty" aria-hidden="true">${PHOTO_GLYPH}<span>${t.title}</span></div>
        <span class="status-pill ${t.status}">${t.status === "done" ? "Completed" : "Upcoming"}</span>
      </div>
      <div class="trip-body">
        <p class="trip-meta">
          <span class="trip-when">${t.when}</span>
          <span class="scope-tag ${scope}">${scopeLabel(t)}</span>
        </p>
        <h3>${t.title}</h3>
        <p class="trip-tag">${t.tagline}</p>
        <div class="trip-places">
          ${chips.map((p) => `<span>${p}</span>`).join("")}
          ${rest > 0 ? `<span class="more">+${rest} more</span>` : ""}
        </div>
        <div class="trip-foot">
          <span class="trip-days">${dayCount(t)} days</span>
          <span class="trip-cta">${t.cta} <i aria-hidden="true">→</i></span>
        </div>
      </div>
    </a>`;
  }

  /* Coloured card stock for the prints. Muted and nudged warm so they sit
     on the cream paper rather than shouting off it, and every one deep
     enough to carry the pale caption written across it. */
  const FRAME_STOCK = [
    "#6b7a4a", "#9e7222", "#a85f42", "#9c4a5c",
    "#3d7a74", "#4f6690", "#6f4c7d", "#8a6a3f",
  ];
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const HANGERS = ["pin", "pin", "pin", "clip"];

  /* How an entry hangs comes from a hash of its id rather than its
     position. Cycling on the index made every Nth entry identical, and N
     tends to land on the column count — which lines the repeats up into
     stripes down the grid. Hashing breaks that up, and still gives each
     trip the same look on every re-render. */
  function scatter(seed) {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i += 1) {
      h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
    }
    return function roll(range) {
      h = Math.imul(h ^ (h >>> 15), 2246822507);
      h ^= h >>> 13;
      return ((h >>> 0) % 4096) / 4096 * range;
    };
  }

  function hangHTML(t) {
    const cover = encodeURI(t.cover || "");
    const scope = tripScope(t);
    const roll = scatter(t.id || t.href);
    const frame = FRAME_STOCK[Math.floor(roll(FRAME_STOCK.length))];
    const hanger = HANGERS[Math.floor(roll(HANGERS.length))];
    /* Only two things actually vary: how square the print got pegged, and
       where along its edge the peg landed. The print's proportions aren't
       invented — they come from the photo, in fitPrints below. */
    const tilt = (Math.round(roll(44)) - 22) / 10;
    const pegX = Math.round(roll(30)) - 15;
    const capTilt = (Math.round(roll(18)) - 9) / 10;
    const start = new Date(t.startDate);
    return `<a class="hang" href="${t.href}" data-status="${t.status}" data-scope="${scope}"
        style="--frame:${frame}; --tilt:${tilt}deg; --peg-x:${pegX}px; --cap-tilt:${capTilt}deg"
        aria-label="${t.title} — ${scopeLabel(t)}. ${t.when}. ${t.cta}.">
      <span class="hang-peg peg-${hanger}" aria-hidden="true"></span>
      <span class="hang-frame">
        ${t.status === "upcoming" ? '<span class="hang-soon" aria-hidden="true">💛</span>' : ""}
        <span class="hang-shot is-empty">
          <img src="${cover}" alt="" loading="lazy" data-fallback="remove" />
          <span class="hang-blank" aria-hidden="true">${PHOTO_GLYPH}</span>
        </span>
        <span class="hang-cap">
          <b>${t.title}</b><i>${MONTHS[start.getMonth()]} '${String(start.getFullYear()).slice(2)}</i>
        </span>
      </span>
      <span class="hang-note">${t.tagline}</span>
      <span class="hang-when">${dayCount(t)} days</span>
    </a>`;
  }

  /* A print is cut to its photo, so each frame takes the proportions of
     the image that lands in it rather than a shape we picked. Clamped at
     both ends because one panorama or one tall portrait would otherwise
     set the height of every row it sits in. Trips with no cover yet keep
     the square the stylesheet starts them at. */
  function fitPrints(root) {
    $$(".hang-shot img", root).forEach((img) => {
      const fit = () => {
        const shot = img.parentElement;
        if (!shot || !img.naturalWidth || !img.naturalHeight) return;
        shot.classList.remove("is-empty");
        const ratio = img.naturalWidth / img.naturalHeight;
        shot.style.aspectRatio = String(Math.min(1.25, Math.max(0.8, ratio)));
      };
      img.addEventListener("load", fit);
      if (img.complete && img.naturalWidth) fit();
    });
  }

  /* ── One thread per year ─────────────────────────────────────────── */
  /* The prints wrap onto however many rows the width allows, so the line
     is drawn to fit the layout we actually got: across a row, a rounded
     turn at the end, back across the next. Rows are read off the laid-out
     positions rather than assumed, which is also what lets the last run
     stop at the final print instead of trailing over empty paper. */
  const SVG_NS = "http://www.w3.org/2000/svg";
  const THREAD_Y = 6;      /* where the cord sits inside a row */
  const THREAD_EDGE = 7;   /* how far the turns stay off the sides */
  const THREAD_R = 14;     /* radius of a turn */
  const RETURN_LIFT = 26;  /* how far above the next row the return runs */
  const THREAD_SAG = 15;   /* deepest dip on a run carrying prints */

  /* A cubic whose midpoint sits exactly `dip` below a level run. The
     control points need 4/3 of the dip to land it there, since a cubic
     only reaches three quarters of the way to its controls. */
  function slack(from, to, y, dip, px) {
    const pull = (dip * 4) / 3;
    const third = (to - from) / 3;
    return (
      ` C${px(from + third)} ${px(y + pull)}` +
      ` ${px(from + third * 2)} ${px(y + pull)} ${px(to)} ${px(y)}`
    );
  }

  function threadPath(line) {
    const hangs = $$(".hang", line);
    if (!hangs.length) return null;

    const rows = [];
    hangs.forEach((el) => {
      const right = el.offsetLeft + el.offsetWidth;
      const row = rows.find((r) => Math.abs(r.top - el.offsetTop) < 2);
      if (row) {
        row.min = Math.min(row.min, el.offsetLeft);
        row.max = Math.max(row.max, right);
        row.items.push(el);
      } else {
        rows.push({ top: el.offsetTop, min: el.offsetLeft, max: right, items: [el] });
      }
    });
    rows.sort((a, b) => a.top - b.top);

    const left = THREAD_EDGE;
    const right = line.clientWidth - THREAD_EDGE;
    const R = THREAD_R;
    const px = (n) => Math.round(n * 10) / 10;
    const sags = [];
    let d = "";
    let start = null;
    let end = null;

    rows.forEach((row, i) => {
      const y = row.top + THREAD_Y;
      const last = i === rows.length - 1;
      /* Tie off a little past the last print rather than running the
         thread out to an edge with nothing hanging on it. */
      const from = i === 0 ? left : left + R;
      const to = last ? Math.min(right, row.max - 12) : right - R;
      const span = Math.max(1, to - from);
      const dip = Math.min(THREAD_SAG, span * 0.017);

      if (i === 0) {
        start = [from, y];
        d += `M${px(from)} ${px(y)}`;
      }
      d += slack(from, to, y, dip, px);

      /* The prints ride the curve instead of sitting level above it, so
         the ones out in the middle of a run hang lowest. */
      row.items.forEach((el) => {
        const at = el.offsetLeft + el.offsetWidth / 2;
        const t = Math.min(1, Math.max(0, (at - from) / span));
        sags.push([el, dip * 4 * t * (1 - t)]);
      });

      if (last) {
        end = [to, y];
        return;
      }
      /* Every run that carries prints goes left to right, so the twine
         travels the same way the prints are read. Getting back to the
         start of the next row is a separate empty run, dropped into the
         gap between rows where nothing hangs from it — so it barely
         dips at all. */
      const next = rows[i + 1].top + THREAD_Y;
      const ret = rows[i + 1].top - RETURN_LIFT;
      d += ` Q${px(right)} ${px(y)} ${px(right)} ${px(y + R)}`;
      d += ` L${px(right)} ${px(ret - R)}`;
      d += ` Q${px(right)} ${px(ret)} ${px(right - R)} ${px(ret)}`;
      d += slack(right - R, left + R, ret, Math.min(7, (right - left) * 0.007), px);
      d += ` Q${px(left)} ${px(ret)} ${px(left)} ${px(ret + R)}`;
      d += ` L${px(left)} ${px(next - R)}`;
      d += ` Q${px(left)} ${px(next)} ${px(left + R)} ${px(next)}`;
    });

    return { d, start, end, sags };
  }

  function stringUp(line) {
    const path = threadPath(line);
    if (!path) return;
    let svg = line.querySelector(".line-thread");
    if (!svg) {
      svg = document.createElementNS(SVG_NS, "svg");
      svg.setAttribute("class", "line-thread");
      svg.setAttribute("aria-hidden", "true");
      svg.innerHTML =
        '<path class="lt-shadow"/><path class="lt-under"/><path class="lt-cord"/>' +
        '<path class="lt-twist"/><path class="lt-sheen"/>' +
        '<circle class="lt-knot" r="3.6"/><circle class="lt-knot" r="3.6"/>';
      line.prepend(svg);
    }
    $$("path", svg).forEach((p) => p.setAttribute("d", path.d));
    $$("circle", svg).forEach((c, i) => {
      const at = i === 0 ? path.start : path.end;
      c.setAttribute("cx", at[0]);
      c.setAttribute("cy", at[1]);
    });
    path.sags.forEach(([el, dip]) => {
      el.style.setProperty("--sag", `${Math.round(dip * 10) / 10}px`);
    });
  }

  /* Column count changes with the width, which changes where the rows
     break, so the thread is redrawn whenever a line resizes. */
  const threadWatch =
    typeof ResizeObserver === "function"
      ? new ResizeObserver((entries) => entries.forEach((e) => stringUp(e.target)))
      : null;

  function stringUpAll(root) {
    if (threadWatch) threadWatch.disconnect();
    $$(".trip-line", root).forEach((line) => {
      stringUp(line);
      if (threadWatch) threadWatch.observe(line);
    });
  }

  function matches(t) {
    if (state.filter !== "all" && t.status !== state.filter) return false;
    if (!state.q) return true;
    return [t.title, t.when, t.tagline, t.summary, t.year, t.scope, scopeLabel(t), ...t.places]
      .join(" ")
      .toLowerCase()
      .includes(state.q);
  }

  function renderTrips() {
    const list = trips.filter(matches);

    byId("tripYears").innerHTML = years
      .map((y) => {
        const items = list.filter((t) => t.year === y);
        if (!items.length) return "";
        const domestic = items.filter((t) => tripScope(t) === "domestic").length;
        const intl = items.length - domestic;
        return `<section class="year-group" id="y${y}">
          <header class="year-head">
            <h3>${y}</h3>
            <span class="year-count">${items.length} ${items.length === 1 ? "trip" : "trips"}</span>
            <span class="year-split">${domestic} domestic</span>
            <span class="year-split">${intl} international</span>
          </header>
          ${
            state.view === "line"
              ? `<div class="trip-line">${items.map(hangHTML).join("")}</div>`
              : `<div class="trip-grid">${items.map(cardHTML).join("")}</div>`
          }
        </section>`;
      })
      .join("");

    const jump = byId("yearJump");
    const kept = jump.value;
    const options = years
      .map((y) => {
        const n = list.filter((t) => t.year === y).length;
        return n ? `<option value="${y}">${y} · ${n}</option>` : "";
      })
      .join("");
    jump.innerHTML = `<option value="">Jump to year</option>${options}`;
    jump.disabled = !options;
    if (kept && [...jump.options].some((o) => o.value === kept)) jump.value = kept;

    byId("emptyState").hidden = list.length > 0;
    byId("resultCount").textContent = list.length
      ? `${list.length} of ${trips.length} trips`
      : "";
    fitPrints(byId("tripYears"));
    stringUpAll(byId("tripYears"));
    observeReveals();
    setupNavObserver();
  }

  function renderSideYears() {
    byId("sideYears").innerHTML = years
      .map((y) => {
        const items = trips.filter((t) => t.year === y);
        const soon = items.some((t) => t.status === "upcoming");
        return `<a href="#y${y}" data-nav="y${y}">
          <span class="dot ${soon ? "soon" : "done"}"></span>
          ${y}
          <span class="yr-count">${items.length}</span>
        </a>`;
      })
      .join("");
  }

  byId("viewToggle").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-view]");
    if (!btn || btn.dataset.view === state.view) return;
    state.view = btn.dataset.view;
    localStorage.setItem(VIEW_KEY, state.view);
    $$("[data-view]").forEach((b) => b.classList.toggle("is-on", b === btn));
    renderTrips();
  });
  $$("[data-view]").forEach((b) => b.classList.toggle("is-on", b.dataset.view === state.view));

  byId("yearJump").addEventListener("change", (e) => {
    const id = e.target.value;
    if (!id) return;
    const el = byId(`y${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  byId("filters").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-filter]");
    if (!btn) return;
    state.filter = btn.dataset.filter;
    $$(".filter").forEach((b) => b.classList.toggle("is-on", b === btn));
    renderTrips();
  });

  const searchInput = byId("search");
  searchInput.addEventListener("input", () => {
    state.q = searchInput.value.trim().toLowerCase();
    renderTrips();
  });

  byId("clearFilters").addEventListener("click", () => {
    state.filter = "all";
    state.q = "";
    searchInput.value = "";
    $$(".filter").forEach((b) => b.classList.toggle("is-on", b.dataset.filter === "all"));
    renderTrips();
  });

  /* Theme */
  const THEME_KEY = "adarsh.travels.theme";
  function applyTheme(t) {
    document.documentElement.dataset.theme = t;
    localStorage.setItem(THEME_KEY, t);
  }
  function toggleTheme() {
    applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  }
  applyTheme(
    localStorage.getItem(THEME_KEY) ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
  );
  byId("themeBtn").addEventListener("click", toggleTheme);

  /* Sidebar (mobile drawer) */
  const menuBtn = byId("menuBtn");
  const backdrop = byId("sidebarBackdrop");
  function setNav(open) {
    document.body.classList.toggle("nav-open", open);
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    backdrop.hidden = !open;
  }
  menuBtn.addEventListener("click", () => setNav(!document.body.classList.contains("nav-open")));
  backdrop.addEventListener("click", () => setNav(false));
  $(".sidebar").addEventListener("click", (e) => {
    if (e.target.closest("a")) setNav(false);
  });

  document.addEventListener("keydown", (e) => {
    if (/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) {
      if (e.key === "Escape") document.activeElement.blur();
      return;
    }
    if (e.key === "/") {
      e.preventDefault();
      searchInput.focus();
      return;
    }
    if (e.key.toLowerCase() === "t") toggleTheme();
    if (e.key === "Escape") setNav(false);
  });

  /* Active section highlight — rebuilt whenever the year groups change */
  let navIo;
  function setupNavObserver() {
    if (!("IntersectionObserver" in window)) return;
    if (navIo) navIo.disconnect();
    const navLinks = $$(".side-nav [data-nav]");
    const sections = navLinks.map((a) => byId(a.dataset.nav)).filter(Boolean);
    if (!sections.length) return;
    navIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          navLinks.forEach((a) => a.classList.toggle("is-active", a.dataset.nav === en.target.id));
        });
      },
      { rootMargin: "-35% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach((s) => navIo.observe(s));
  }

  /* Scroll */
  const bar = byId("scrollBar");
  const toTop = byId("toTop");
  function onScroll() {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = `${Math.min(100, (window.scrollY / (h || 1)) * 100)}%`;
    toTop.hidden = window.scrollY < 500;
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  let io;
  function observeReveals() {
    if (!io) {
      io = new IntersectionObserver(
        (entries) =>
          entries.forEach((en) => {
            if (en.isIntersecting) {
              en.target.classList.add("in");
              io.unobserve(en.target);
            }
          }),
        { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
      );
    }
    $$(".reveal:not(.in)").forEach((el) => io.observe(el));
  }

  renderSideYears();
  setupMapOverlay();
  renderTrips();
  tick();
  setInterval(tick, 1000);
  onScroll();
  observeReveals();
})();

