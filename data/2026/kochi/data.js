/* Kochi, 10–11 April 2026.
   Known: morning train from Kannur, Kochi arrival around 09:30, work at
   IBM Kochi, Water Metro from High Court to Fort Kochi, Kimchi Culture,
   then the night train reaching Kannur around 01:20. Train numbers, PNRs,
   companions, dishes and the event venue were not provided.

   Geographic assumptions (not logged positions):
   - IBM Kochi is pinned at 9.931, 76.267, the representative Kochi
     coordinate already used in this journal. A single office door is
     not used: published IBM premises include Tower B, World Trade
     Centre, Infopark, Kakkanad, and a later centre at Lulu Cyber
     Tower 2, so the building is not uniquely identifiable.
   - Kochi Water Metro High Court terminal is pinned at 9.9839, 76.2728.
   - Fort Kochi Water Metro terminal is pinned at 9.9672, 76.2427.
   - Kimchi Culture has no coordinate and is not a map pin. */

const TRIP = {
  id: "kochi-2026",
  countdownLabel: "until 10 April",
  emptyBookings: true,
  title: "Kochi",
  kicker: "Trip recap",
  tagline: "A work day — the IBM office, the Water Metro, Kimchi Culture",
  startDate: "2026-04-10",
  endDate: "2026-04-11",
  intro:
    "A work day in Kochi on 10 April 2026, beginning with a morning train from Kannur and an arrival around 9:30. After working from the IBM Kochi office, the day moved onto the water: Kochi Water Metro from High Court to Fort Kochi. Kimchi Culture — the first Pan-Asian food cultural festival in Kerala — closed the Kochi part of the day, followed by the night train home and an arrival in Kannur around 1:20 the next morning.",
  countries: [{ code: "KL", name: "Kerala", flag: "🌴" }],
  glance: [
    { icon: "clock", value: "1", label: "Day" },
    { icon: "pin", value: "5", label: "Stops" },
    { icon: "globe", value: "1", label: "City" },
    { icon: "town", value: "1", label: "State" },
  ],
  highlights: [
    {
      icon: "town",
      title: "IBM Kochi",
      text: "Worked from the IBM Kochi office. The pin is a representative point for Kochi, not a street address.",
    },
    {
      icon: "boat",
      title: "High Court to Fort Kochi",
      text: "The Kochi Water Metro experience had a real route: boarding at High Court and crossing to Fort Kochi.",
    },
    {
      icon: "sparkle",
      title: "Kimchi Culture",
      text: "Attended Kimchi Culture, described as the first Pan-Asian food cultural festival in Kerala. The venue was not recorded, so it is not on the map.",
    },
  ],
  tips: [
    "The IBM Kochi pin is the representative Kochi coordinate already used in this journal (9.931, 76.267). Published IBM premises in the city include more than one Infopark building, so no street address is shown.",
    "The Water Metro leg was High Court to Fort Kochi; both terminals are shown on the route map.",
    "Kimchi Culture is the same day and is not pinned. The venue was not recorded.",
    "The morning train reached Kochi around 9:30. The return train reached Kannur around 1:20 the next morning. Train numbers and PNRs were not recorded.",
  ],
  stays: [
    { place: "Night train to Kannur", detail: "10–11 April 2026 · reached Kannur around 01:20" },
  ],
  bookings: [],
  packing: [
    "No packing list was kept for this trip",
  ],
  days: [
    {
      n: 1,
      date: "2026-04-10",
      city: "Kannur → Kochi → Fort Kochi",
      country: "KL",
      subtitle: "Work, Water Metro and Kerala’s first Pan-Asian food festival",
      theme: "city",
      badge: "10 April",
      schedule: [
        { time: "Morning", text: "Train from Kannur to Kochi" },
        { time: "~09:30", text: "Reached Kochi" },
        { time: "Day", text: "Worked from the IBM Kochi office" },
        { time: "Later", text: "Kochi Water Metro from High Court to Fort Kochi" },
        { time: "Evening", text: "Kimchi Culture — the first Pan-Asian food cultural festival in Kerala" },
        { time: "Night", text: "Return train towards Kannur" },
        { time: "~01:20", text: "Reached Kannur the next morning" },
      ],
      stay: "Night train home",
      legs: [
        { mode: "train", text: "Kannur → Kochi" },
        { mode: "ferry", text: "High Court → Fort Kochi" },
        { mode: "train", text: "Kochi → Kannur" },
      ],
      note: "Kimchi Culture was the same evening. Its venue was not recorded, so it is part of the story but not a separate map pin.",
      story:
        "The morning train from Kannur put us in Kochi around 9:30, in time for a work day at the IBM office. After work came the part that made this more than an office visit: boarding the Kochi Water Metro at High Court and riding across to Fort Kochi. Kimchi Culture, Kerala’s first Pan-Asian food cultural festival, rounded out the evening. Then it was back onto the train, reaching Kannur at about 1:20 the next morning.",
    },
  ],
  regions: [{ name: "KOCHI", lat: 9.957, lon: 76.27 }],
  places: [
    { id: "kannur", name: "Kannur", lat: 11.874, lon: 75.37, day: 1, ldx: 0, ldy: -20 },
    { id: "ibm", name: "IBM Kochi", lat: 9.931, lon: 76.267, day: 1, ldx: 0, ldy: 28 },
    { id: "high-court", name: "High Court Water Metro", lat: 9.9839, lon: 76.2728, day: 1, ldx: 0, ldy: -22 },
    { id: "fort-kochi", name: "Fort Kochi", lat: 9.9672, lon: 76.2427, day: 1, ldx: -36, ldy: 24 },
  ],
  route: [
    ["kannur", "ibm", "train"],
    ["ibm", "high-court", "way"],
    ["high-court", "fort-kochi", "ferry"],
    ["fort-kochi", "kannur", "train"],
  ],
};
