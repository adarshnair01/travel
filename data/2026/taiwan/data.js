/* Taiwan 2026 trip recap. Dates follow the portfolio catalog (1–4 Aug 2026).
   PNRs below are the ones already on the tickets — do not add others. */

const TRIP = {
  id: "taiwan-2026",
  countdownLabel: "until AirAsia leaves Bengaluru",
  title: "Taiwan",
  kicker: "Trip recap",
  tagline: "Night markets, near-miss connections & a birthday at 300 km/h",
  startDate: "2026-08-01",
  endDate: "2026-08-04",
  intro:
    "Adarsh & co. From a delayed midnight takeoff to sunset at Taipei 101, a north-coast day trip, and a birthday cake under Kaohsiung’s city lights. Four chapters: arrival in Taipei, Yehliu / Jiufen / Shifen, a birthday in Kaohsiung, then home via Bangkok.",
  countries: [
    { code: "TW", name: "Taiwan", flag: "🇹🇼" },
    { code: "TH", name: "Thailand", flag: "🇹🇭" },
  ],
  glance: [
    { icon: "plane", value: "2", label: "Cities" },
    { icon: "train", value: "300", label: "km/h HSR" },
    { icon: "ticket", value: "5", label: "Klook bookings" },
    { icon: "cake", value: "1", label: "Birthday abroad" },
  ],
  highlights: [
    {
      icon: "lounge",
      title: "Both cards worked",
      text: "International lounge access on two credit cards at once — unexpected and perfect for a delayed night.",
    },
    {
      icon: "run",
      title: "The Bangkok sprint",
      text: "AirAsia crew rushed the transfer after a late inbound. Connection saved.",
    },
    {
      icon: "spin",
      title: "Beyblade at the station",
      text: "Teenagers battling Beyblade when the north-coast tour rolled back into Taipei Station.",
    },
    {
      icon: "banana",
      title: "Two bananas each",
      text: "Joined an event at Kaohsiung Music Center and walked away with the prize.",
    },
    {
      icon: "cake",
      title: "Lemonesse & Love Lookout",
      text: "Birthday cake after a day in the south, then the whole city glowing from Shoushan.",
    },
    {
      icon: "rail",
      title: "400 km in 90 minutes",
      text: "THSR with the Klook B1G1 deal — Taipei to Kaohsiung at up to 300 km/h.",
    },
  ],
  tips: [
    "EasyCard × 2, 400 TWD each, picked up on arrival. Works on the MRT, buses, and convenience stores.",
    "Airport MRT ticket to Taipei Station, collected with the EasyCards. Immigration was under 30 minutes.",
    "The Yehliu / Jiufen / Shifen day was booked from bed on night one — an AC bus, with 30–32°C outside.",
    "THSR B1G1 on Klook, promo G02TAIWAN. Tickets collected at the high-speed desk beside the tour queue at Taipei Station.",
    "Kindness Hotel sits across the street from Kaohsiung HSR. About 400 km and 90 minutes from Taipei, up to 300 km/h.",
    "Outbound is AirAsia, PNR HYSBKC: planned 11:20 from Bengaluru, boarded 00:16, took off 00:45, Bangkok connection 07:25, Taipei by 12:20.",
    "Home is IndiGo, PNR N4SB4Y. 6E 1214 Bangkok to Bengaluru T2 on 4 Aug 2026, depart 08:05, board 07:05, seat 11A. About 8 hours in Bangkok — Sampeng Market.",
  ],
  stays: [
    { place: "Aloft Beitou, Taipei", detail: "1–2 Aug 2026 · arrival nights" },
    {
      place: "Kindness Hotel, Kaohsiung",
      detail: "3 Aug 2026 · birthday night · across the street from the HSR station",
    },
  ],
  bookings: [
    {
      kind: "flight",
      title: "AirAsia · Bengaluru → Taipei",
      detail: "Bengaluru (BLR) → Bangkok (DMK) → Taipei (TPE).",
      when: "1 Aug 2026",
      ref: "HYSBKC",
      arrive: "Taipei by 12:20 — immigration under 30 minutes.",
      legs: [
        {
          from: "Bengaluru (BLR)",
          to: "Bangkok (DMK)",
          when: "Planned 11:20 departure · Boarded 00:16 · took off 00:45",
          note: "Long delay — dinner in the international lounge (both cards worked), then roaming the open walk near the gate.",
        },
        {
          from: "Bangkok (DMK)",
          to: "Taipei (TPE)",
          when: "Planned 07:25 connecting · Made it — crew rushed the transfer",
          note: "~3 hrs sleep on the late flight. Tight connection, but AirAsia staff guided us through the right gates.",
        },
      ],
    },
    {
      id: "mrt",
      kind: "ticket",
      title: "Airport MRT to Taipei Station",
      detail: "Picked up on arrival — smooth hop into the city.",
      when: "1 Aug 2026",
      href: "https://affiliate.klook.com/sl/1MZ2Uhw",
      image: "assets/klook-mrt.png",
      qr: "assets/qr-mrt.png",
    },
    {
      id: "easycard",
      kind: "ticket",
      title: "EasyCard × 2 (400 TWD each)",
      detail: "Works almost everywhere — MRT, buses, convenience stores.",
      when: "1 Aug 2026",
      href: "https://affiliate.klook.com/sl/28NYQEW",
      image: "assets/klook-easycard.png",
      qr: "assets/qr-easycard.png",
    },
    {
      id: "taipei101",
      kind: "ticket",
      title: "Taipei 101 Observatory",
      detail: "Sunset from the top on arrival night.",
      when: "1 Aug 2026",
      href: "https://affiliate.klook.com/sl/153jZNe",
      image: "assets/klook-taipei101.png",
      qr: "assets/qr-taipei101.png",
    },
    {
      kind: "hotel",
      title: "Aloft Beitou",
      detail: "Taipei",
      when: "1–2 Aug 2026 · arrival nights",
    },
    {
      id: "shifen",
      kind: "ticket",
      title: "Yehliu · Jiufen · Shifen Day Trip",
      detail: "Booked from bed on night one — AC bus over DIY transit.",
      when: "2 Aug 2026",
      href: "https://affiliate.klook.com/sl/2hsHIia",
      image: "assets/klook-shifen.png",
      qr: "assets/qr-shifen.png",
    },
    {
      id: "hsr",
      kind: "ticket",
      title: "THSR Taipei ⇄ Kaohsiung (B1G1)",
      detail: "50% off high-speed rail — ~400 km in about 90 minutes.",
      when: "3–4 Aug 2026",
      promo: "G02TAIWAN",
      href: "https://affiliate.klook.com/sl/YOQ4JoY",
      image: "assets/klook-hsr.png",
      qr: "assets/qr-hsr.png",
    },
    {
      kind: "hotel",
      title: "Kindness Hotel",
      detail: "Kaohsiung · across the street from the HSR station",
      when: "3 Aug 2026 · birthday night",
    },
    {
      kind: "flight",
      title: "IndiGo · Taipei → Bengaluru",
      detail: "Taipei → Bangkok (BKK) → Bengaluru T2.",
      when: "4 Aug 2026",
      ref: "N4SB4Y",
      image: "assets/boarding-return.jpg",
      imageAlt: "IndiGo check-in confirmation Bangkok to Bengaluru",
      legs: [
        {
          from: "Taipei",
          to: "Bangkok",
          note: "Evening departure after Chiang Kai-shek Memorial. Landed Bangkok for an ~8 hour layover.",
        },
        {
          from: "Bangkok (BKK)",
          to: "Bengaluru T2",
          when: "6E 1214 · 4 Aug 2026 · Depart 08:05 · Board 07:05 · Seat 11A",
          note: "Sampeng Market during layover — earrings + mix ice cream, then home with the memories.",
        },
      ],
    },
  ],
  days: [
    {
      n: 1,
      date: "2026-08-01",
      city: "Taipei · Beitou",
      country: "TW",
      subtitle:
        "Delayed takeoff, a saved connection, EasyCards in hand, and sunset from Taipei 101 — then Raohe until half past eleven.",
      theme: "skyline",
      badge: "Arrival",
      activities: ["Taipei 101 sunset", "Songshan Ciyou Temple", "Raohe Night Market", "EasyCard + Airport MRT"],
      stay: "Aloft Beitou",
      legs: [
        { mode: "plane", text: "BLR → DMK → TPE (AirAsia)", duration: "boarded 00:16 · Taipei 12:20" },
        { mode: "train", text: "Airport MRT to Taipei Station" },
      ],
      tickets: ["mrt", "easycard", "taipei101", "shifen", "hsr"],
      note: "Taipei after a long night. Relief, sunset, night market energy.",
      story: [
        {
          t: "Night before",
          text: "Left for the airport around 8:30 for an 11:20 flight that only started boarding at 00:16 and took off at 00:45.",
        },
        {
          t: "Lounge surprise",
          text: "Both credit cards worked for the international lounge — a small win that made the long wait feel generous.",
        },
        {
          t: "Bangkok sprint",
          text: "Connecting flight at 07:25. Three hours of sleep, then a last-half-hour panic — until AirAsia crew rushed us through transfers on time.",
        },
        {
          t: "Touchdown",
          text: "Taiwan by 12:20. Immigration done in under 30 minutes. Collected EasyCards (400 TWD each) and the Airport MRT ticket to Taipei Station.",
        },
        {
          t: "Evening",
          text: "Checked into Aloft Beitou, freshened up, then Taipei 101 for a beautiful sunset. At Raohe Night Market we ducked into Songshan Ciyou Temple at the entrance, tried local snacks, and wandered until 11:30.",
        },
        {
          t: "Goodnight",
          text: "Called parents back in India — 9:30 pm IST while it was midnight in Taiwan — and slept hard. From bed we booked the Yehliu / Jiufen / Shifen day trip, and pivoted south: Kaohsiung over the balloon festival, with HSR B1G1 on Klook.",
        },
      ],
    },
    {
      n: 2,
      date: "2026-08-02",
      city: "Yehliu, Jiufen & Shifen",
      country: "TW",
      subtitle:
        "Thirty spare minutes at Dr. Sun Yat-sen Memorial, HSR tickets collected for tomorrow, then a full-day Klook tour — and Longshan + Ximending after dark.",
      theme: "coast",
      badge: "North coast",
      activities: ["Yehliu Geopark", "Jiufen / Shifen", "Lungshan Temple", "Ximending", "Beyblade at the station"],
      stay: "Aloft Beitou",
      legs: [
        { mode: "bus", text: "Yehliu · Jiufen · Shifen AC bus", duration: "back ~19:30–20:00" },
        { mode: "day", text: "Sun Yat-sen Memorial, then Lungshan and Ximending" },
      ],
      tickets: ["shifen", "hsr"],
      note: "Yehliu, Jiufen & Shifen. Hot outside, AC bus, old streets & rock formations. Taipei → North Coast → back.",
      story: [
        {
          t: "Morning",
          text: "Back to Taipei Station — the day's start point. With ~30 minutes free we walked to Dr. Sun Yat-sen Memorial Hall for photos and a quick breath.",
        },
        {
          t: "HSR desk",
          text: "The high-speed ticketing office was right by the tour queue. Grabbed Kaohsiung return tickets there before boarding the AC bus (30–32°C outside).",
        },
        {
          t: "The tour",
          text: "Started at Yehliu Geopark, wound through Jiufen / Shifen country, and rolled back to the station around 7:30–8:00. Bonus scene at the station: teenagers battling Beyblade.",
        },
        {
          t: "Night",
          text: "Banga Lungshan Temple, then Ximending for night shopping — brands everywhere. Dinner at McD, then a peaceful sleep with THSR on the mind.",
        },
      ],
    },
    {
      n: 3,
      date: "2026-08-03",
      city: "Kaohsiung",
      country: "TW",
      subtitle:
        "Beitou hot springs before the train, then ~400 km south in about 90 minutes. Cijin, Pier-2, Music Center bananas, lemonesse cake, and the city lights from Shoushan.",
      theme: "south",
      badge: "Birthday",
      activities: [
        "Beitou hot springs",
        "THSR 300 km/h",
        "Cijin Beach & Rainbow Church",
        "Pier-2 & Music Center",
        "Shoushan Love Lookout",
        "Birthday cake",
      ],
      stay: "Kindness Hotel, Kaohsiung",
      legs: [
        { mode: "train", text: "THSR Taipei → Kaohsiung", duration: "~90 min · up to 300 km/h" },
        { mode: "day", text: "Cijin, Pier-2, Music Center, Shoushan" },
      ],
      tickets: ["hsr"],
      note: "Kaohsiung at 300 km/h. Hot springs, bullet train, beach kites & cake. Beitou → Taipei → Kaohsiung.",
      story: [
        {
          t: "Beitou first",
          text: "Quick photos and a look at the hot springs, then Uber to Taipei Station to make the THSR on time.",
        },
        {
          t: "Bullet south",
          text: "Boom — about 1 hour 30 minutes later we were in Kaohsiung, ~400 km from Taipei at up to 300 km/h. The station itself was epic. Kindness Hotel sat just across the street.",
        },
        {
          t: "Cijin",
          text: "Beach packed with kites, surfers in the water, then Rainbow Church. Back via Cijin port to Pier-2 — eats everywhere — and on to Kaohsiung Music Center for stalls and an event where we each won two bananas.",
        },
        {
          t: "Birthday night",
          text: "Picked up a small lemonesse cake for the celebration. After dark we went up to Shoushan Love Lookout — the whole city lit up in front of us.",
        },
      ],
    },
    {
      n: 4,
      date: "2026-08-04",
      city: "Kaohsiung → Taipei → Bengaluru",
      country: "TW",
      also: "TH",
      subtitle:
        "Birthday cake on a call with family, Tiger & Dragon Pagoda, HSR north, Chiang Kai-shek Memorial, then Bangkok's Sampeng Market before the IndiGo hop home.",
      theme: "farewell",
      badge: "Homeward",
      activities: [
        "Birthday call home",
        "Tiger & Dragon Pagoda",
        "Chiang Kai-shek Memorial",
        "Sampeng Market",
        "Home with memories",
      ],
      stay: "In the air / layover",
      legs: [
        { mode: "train", text: "THSR Kaohsiung → Taipei" },
        { mode: "plane", text: "TPE → BKK → BLR (IndiGo 6E 1214)", duration: "4 Aug · seat 11A · depart 08:05" },
      ],
      tickets: ["hsr"],
      note: "Pagodas, memorial & Sampeng. Cake on a call, last photos, layover snacks.",
      story: [
        {
          t: "Cake & calls",
          text: "Cut the birthday cake on a call with parents and brother — celebrating from Kaohsiung while India was on the line.",
        },
        {
          t: "Lotus Pond",
          text: "Tiger & Dragon Pagoda and the nearby area before boarding the HSR back to Taipei.",
        },
        {
          t: "Last Taipei stop",
          text: "From the station we walked Chiang Kai-shek Memorial — photos, a slow roam — then back to start the journey home via Bangkok.",
        },
        {
          t: "Bangkok layover",
          text: "~8 hours on the ground. Sampeng Market for a short wander — earrings and mix ice cream — then back to the airport for IndiGo 6E 1214 (seat 11A) to Bengaluru T2.",
        },
      ],
    },
  ],
  regions: [{ name: "TAIWAN", lat: 23.8, lon: 121.0 }],
  places: [
    { id: "tpe", name: "Taipei", lat: 25.048, lon: 121.517, day: 1, ldx: -28, ldy: -18 },
    { id: "yeh", name: "Yehliu", lat: 25.206, lon: 121.691, day: 2, side: true, ldx: 22, ldy: -16 },
    { id: "jiu", name: "Jiufen", lat: 25.11, lon: 121.844, day: 2, side: true, ldx: 28, ldy: 6 },
    { id: "shi", name: "Shifen", lat: 25.043, lon: 121.777, day: 2, side: true, ldx: -36, ldy: 14 },
    { id: "khh", name: "Kaohsiung", lat: 22.627, lon: 120.301, day: 3, ldx: 22, ldy: -18 },
    { id: "cij", name: "Cijin", lat: 22.561, lon: 120.27, day: 3, side: true, ldx: -28, ldy: 16 },
  ],
  route: [
    ["tpe", "yeh", "bus"],
    ["yeh", "jiu", "bus"],
    ["jiu", "shi", "bus"],
    ["shi", "tpe", "bus"],
    ["tpe", "khh", "train"],
    ["khh", "cij", "day"],
    ["khh", "tpe", "train"],
  ],
};
