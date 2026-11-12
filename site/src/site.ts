export const SITE = {
  title: "Adarsh Nair",
  blogName: "Wander Notes",
  tagline: "Stories, routes and practical notes from the road",
  description:
    "Travel stories, itineraries and practical tips from the road by Adarsh Nair: where to go, how to get around and what it really costs.",
  author: "Adarsh Nair",
  homeBase: "Bengaluru, India",
  origin: "https://adarshnair.in",
  base: "", // served from the domain root; keep in sync with `base` in astro.config.mjs
  lang: "en",
  locale: "en_US",
  postsPerPage: 12,
  googleAnalytics: "G-HQ1CHRXL4D",
  googleSiteVerification: "",
  bingSiteVerification: "",

  // Travelpayouts Drive script (account 599055). Required by Travelpayouts; empty string removes it.
  travelpayoutsDrive: "https://emrldco.com/NTk5MDU1.js?t=599055",

  // Public like / love / share counts on stories, stored as anonymous counters at Abacus
  // (free, no account). Keys are "<year>-<slug>-like|love|share". Empty api hides the counts.
  reactions: { api: "https://abacus.jasoncameron.dev", namespace: "wandernotes" },

  // Google AdSense. With only `client` set, Auto ads decides placement.
  // Paste "Display" ad-unit slot IDs below to control placement instead.
  adsense: {
    client: "ca-pub-6421889451287368",
    slots: {
      inArticle: "",
      endOfPost: "",
    },
  },

  socials: {
    email: "adarshnair01@gmail.com",
    github: "https://github.com/adarshnair01",
    linkedin: "https://www.linkedin.com/in/adarshnair01/",
    blog: "https://adarshnair.online/blog/",
    website: "https://adarshnair.online",
  },
  // Story series. A story joins one with `series: <key>` in its front matter and is listed on the
  // series page as well as with all stories. Series stories are free-form (no fixed layout).
  series: {
    "incredible-india": {
      label: "Incredible India",
      path: "/incredible-india/",
      eyebrow: "Incredible India",
      heading: "Stories behind India's places",
      intro:
        "Forts with curses, temples built overnight, stepwells, lost cities and the legends that still hang over them. Short, true stories about places in India and the history most visitors never hear: one for each evening.",
    },
  },
  nav: [
    { href: "/", label: "Home" },
    { href: "/stories/", label: "Stories" },
    { href: "/incredible-india/", label: "Incredible India" },
    { href: "/places/", label: "Places" },
    { href: "/about/", label: "About" },
  ],
} as const;

/** Prefix an internal path with the base path. */
export function url(path = "/"): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE.base}${p}`.replace(/\/{2,}/g, "/");
}

/** Absolute URL (for canonical, OG, feeds, sitemap). */
export function absUrl(path = "/"): string {
  return new URL(url(path), SITE.origin).href;
}
