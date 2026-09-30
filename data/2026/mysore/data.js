/* Mysore, 25 April 2026.
   Known: a day trip by train from Bangalore, Chamundi Hills by public
   bus and back, St. Philomena’s Cathedral, then the train home.
   Out: 12614, 2S coach D3, fare 230. Back: 16022, sleeper, fare 331.
   After the hill: World of Mysore Pak, a cab to the cathedral, a cab
   to Maya Bazaar, then a walk to Mysore Junction.
   PNRs and clock times were not provided. Maya Bazaar has no
   published door that matches the name, so that pin is only
   “a short walk from the station.” */

const TRIP = {
  id: "mysore-2026",
  countdownLabel: "until 25 April",
  title: "Mysore",
  kicker: "Trip recap",
  tagline: "Chamundi by bus, Mysore Pak, then a cab across the city",
  startDate: "2026-04-25",
  endDate: "2026-04-25",
  intro:
    "A day trip from Bangalore to Mysore on 25 April 2026. Out on 12614, the Wodeyar SF Express, in 2S coach D3 (₹230). A public bus up to Chamundi Hills and back down to the World of Mysore Pak experience centre on Chamundi Hills Road. A cab from there to St. Philomena’s Cathedral, another cab to Maya Bazaar, and a walk to Mysore Junction for 16022, the Kaveri Express, sleeper (₹331). PNRs and clock times were not kept.",
  countries: [{ code: "KA", name: "Karnataka", flag: "🌿" }],
  glance: [
    { icon: "clock", value: "1", label: "Day" },
    { icon: "train", value: "2", label: "Trains" },
    { icon: "bus", value: "1", label: "Bus ride" },
    { icon: "pin", value: "4", label: "Stops" },
  ],
  highlights: [
    {
      icon: "mountain",
      title: "Chamundi Hills",
      text: "Up to Chamundi Hills on a public bus, and the bus back down to the World of Mysore Pak experience centre on Chamundi Hills Road.",
    },
    {
      icon: "sparkle",
      title: "Cathedral, then Maya Bazaar",
      text: "A cab from the Mysore Pak centre to St. Philomena’s Cathedral, another cab to Maya Bazaar, and a walk from there to Mysore Junction.",
    },
    {
      icon: "train",
      title: "Out and back by train",
      text: "12614 Wodeyar SF Express out, 2S coach D3, ₹230. 16022 Kaveri Express back, sleeper, ₹331. No PNR and no clock time were kept.",
    },
  ],
  tips: [
    "Out: 12614 Wodeyar SF Express, Second Sitting (2S), coach D3, fare ₹230. Back: 16022 Kaveri Express, sleeper, fare ₹331. PNRs were not saved.",
    "Chamundi Hills was a public bus up, and the bus back down to the World of Mysore Pak experience centre on Chamundi Hills Road.",
    "A cab from there to St. Philomena’s Cathedral on Ashoka Road, then another cab to Maya Bazaar. The last stretch to Mysore Junction was on foot.",
    "Nothing was noted for the night. It was a day trip.",
  ],
  stays: [
    { place: "No night away", detail: "25 April 2026 · back to Bangalore the same day" },
  ],
  bookings: [
    {
      kind: "train",
      title: "12614 · Wodeyar SF Express",
      detail: "Bengaluru → Mysuru · Second Sitting (2S), coach D3",
      when: "25 Apr 2026",
      ref: "—",
      extra: "Fare ₹230 · PNR not on file",
    },
    {
      kind: "train",
      title: "16022 · Kaveri Express",
      detail: "Mysuru → Bengaluru · Sleeper",
      when: "25 Apr 2026",
      ref: "—",
      extra: "Fare ₹331 · coach and PNR not on file",
    },
  ],
  packing: ["No packing list was kept for this trip"],
  days: [
    {
      n: 1,
      date: "2026-04-25",
      city: "Bangalore → Mysore",
      country: "KA",
      subtitle: "The hill by bus, two cabs, a walk to the train",
      theme: "temple",
      badge: "25 April",
      activities: [
        "12614 Wodeyar SF Express to Mysore · 2S, coach D3 · ₹230",
        "Public bus to Chamundi Hills, and the bus back to World of Mysore Pak",
        "Cab to St. Philomena’s Cathedral",
        "Cab to Maya Bazaar, then a walk to Mysore Junction",
        "16022 Kaveri Express back to Bangalore · sleeper · ₹331",
      ],
      stay: "No night away",
      legs: [
        { mode: "train", text: "12614 · 2S D3 · ₹230" },
        { mode: "bus", text: "Mysore Junction → Chamundi Hills" },
        { mode: "bus", text: "Chamundi Hills → World of Mysore Pak" },
        { mode: "way", text: "Cab · World of Mysore Pak → St. Philomena’s" },
        { mode: "way", text: "Cab · St. Philomena’s → Maya Bazaar" },
        { mode: "way", text: "Walk · Maya Bazaar → Mysore Junction" },
        { mode: "train", text: "16022 · sleeper · ₹331" },
      ],
      note: "The two cabs and the walk draw as plain sequence lines. Maya Bazaar is pinned only as a short walk from the station — no published door matched the name.",
      story:
        "Out of Bangalore on 12614, the Wodeyar SF Express, Second Sitting coach D3, fare ₹230. Chamundi Hills was a public bus up, and the bus back down to the World of Mysore Pak experience centre on Chamundi Hills Road. A cab from there to St. Philomena’s Cathedral, another cab to Maya Bazaar, and a walk to Mysore Junction for 16022, the Kaveri Express, sleeper, fare ₹331. The PNRs and the clock times were not kept.",
    },
  ],
  regions: [{ name: "MYSORE", lat: 12.31, lon: 76.66 }],
  places: [
    { id: "blr", name: "Bengaluru", lat: 12.972, lon: 77.595, day: 1, ldx: 0, ldy: -18 },
    { id: "mys", name: "Mysore Junction", lat: 12.316, lon: 76.648, day: 1, ldx: -36, ldy: 22 },
    { id: "chamundi", name: "Chamundi Hills", lat: 12.273, lon: 76.671, day: 1, ldx: 18, ldy: -16 },
    { id: "pak", name: "World of Mysore Pak", lat: 12.296, lon: 76.666, day: 1, ldx: -20, ldy: 22 },
    { id: "cathedral", name: "St. Philomena’s", lat: 12.321, lon: 76.658, day: 1, ldx: 16, ldy: -18 },
    { id: "maya", name: "Maya Bazaar", lat: 12.312, lon: 76.654, day: 1, ldx: 22, ldy: 20 },
  ],
  route: [
    ["blr", "mys", "train"],
    ["mys", "chamundi", "bus"],
    ["chamundi", "pak", "bus"],
    ["pak", "cathedral", "way"],
    ["cathedral", "maya", "way"],
    ["maya", "mys", "way"],
    ["mys", "blr", "train"],
  ],
};
