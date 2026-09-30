/* Butterflies by day, fireflies by night. Shared by the home page and every
   trip page. Looks for #critters and swaps the cast when data-theme changes. */
(() => {
  const byId = (id) => document.getElementById(id);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const rand = (min, max) => min + Math.random() * (max - min);
  const stillPage = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    typeof Element.prototype.animate !== "function";

  /* Butterflies by day, fireflies by night. Both wander the same way —
     drift to a nearby point, pause, drift on — but butterflies bob along
     the way and can be shooed, while fireflies just breathe. */
  function setupCritters() {
    const layer = byId("critters");
    if (!layer || stillPage()) return;

    const BUTTERFLY = `<svg viewBox="0 0 24 20">
      <path class="bf-wing" d="M11.4 10C9 3.4 5.2 1.6 2.6 3.2.4 4.6.6 9 3.4 12c2 2.2 5.4 3 8 2.4z" />
      <path class="bf-wing bf-wing-b" d="M12.6 10c2.4-6.6 6.2-8.4 8.8-6.8 2.2 1.4 2 5.8-.8 8.8-2 2.2-5.4 3-8 2.4z" />
      <path class="bf-body" d="M12 4.6c.7 0 1.1.6 1.1 1.4l-.5 9c0 .5-.3.8-.6.8s-.6-.3-.6-.8l-.5-9c0-.8.4-1.4 1.1-1.4z" />
    </svg>`;

    /* How far a critter strays from where it is now. */
    const ROAM = { butterfly: 240, firefly: 170 };
    const flock = [];
    let cast = null;

    function place() {
      return { x: rand(40, window.innerWidth - 40), y: rand(60, window.innerHeight - 60) };
    }

    /* Somewhere nearby, kept on screen — short hops read as wandering,
       where long hauls across the page would read as commuting. */
    function nearby(at, roam) {
      const angle = rand(0, Math.PI * 2);
      const reach = rand(roam * 0.35, roam);
      return {
        x: Math.min(Math.max(30, at.x + Math.cos(angle) * reach), window.innerWidth - 30),
        y: Math.min(Math.max(50, at.y + Math.sin(angle) * reach), window.innerHeight - 50),
      };
    }

    /* Where a critter actually is at this instant, mid-flight or not.
       Tilting grows the bounding box, so the top-left is measured back
       from the centre, which rotation leaves alone. */
    function whereIs(el) {
      const box = el.getBoundingClientRect();
      return {
        x: box.left + box.width / 2 - el.offsetWidth / 2,
        y: box.top + box.height / 2 - el.offsetHeight / 2,
      };
    }

    /* Park a critter exactly where it appears and drop everything that
       was moving it. Animations with fill:forwards stack up on the
       element, so cancelling only the newest lets an older one reassert
       its end position and snap the critter across the page — they all
       have to go, and the base transform has to be pinned to the spot
       they were cancelled at. Callers must read whereIs first: once
       these are cancelled the element is back at its base transform. */
    function halt(critter, at) {
      critter.el.getAnimations().forEach((anim) => anim.cancel());
      window.clearTimeout(critter.rest);
      critter.el.style.transform =
        `translate(${at.x}px, ${at.y}px) rotate(${critter.tilt}deg)`;
    }

    function launch(critter) {
      const at = whereIs(critter.el);
      halt(critter, at);
      const to = nearby(at, ROAM[critter.kind]);
      const dx = to.x - at.x;
      const dy = to.y - at.y;
      const span = Math.max(1, Math.hypot(dx, dy));
      /* Butterflies tip into the direction they're heading; fireflies
         have no front, so they stay upright. */
      const tilt = critter.kind === "butterfly" ? Math.max(-22, Math.min(22, dx * 0.1)) : 0;
      const lift = critter.kind === "butterfly" ? rand(-26, -8) : rand(-12, 12);

      const frames = [
        { transform: `translate(${at.x}px, ${at.y}px) rotate(${critter.tilt}deg)` },
        {
          transform:
            `translate(${at.x + dx * 0.5}px, ${at.y + dy * 0.5 + lift}px)` +
            ` rotate(${tilt}deg)`,
          offset: 0.5,
        },
        { transform: `translate(${to.x}px, ${to.y}px) rotate(${tilt}deg)` },
      ];

      critter.flight = critter.el.animate(frames, {
        duration: rand(2600, 5200) * (span / ROAM[critter.kind] + 0.5),
        easing: "cubic-bezier(0.37, 0, 0.63, 1)",
        fill: "forwards",
      });
      critter.at = to;
      critter.tilt = tilt;
      critter.flight.onfinish = () => {
        critter.rest = window.setTimeout(() => launch(critter), rand(400, 2600));
      };
    }

    /* Nothing gets to rest a cursor on a butterfly. The moment the pointer
       reaches one it breaks away from wherever the pointer is, fast
       enough that the hover never settles, then picks up wandering again.
       Direction is away from the cursor, but an escape that clamps
       against the edge of the screen can land right back under it — so a
       few angles are tried and the one that opens the most distance from
       the pointer wins. */
    function flee(critter, from) {
      /* Measured before anything is cancelled — reading it after would
         give the spot the last flight started from, and the escape would
         look like it jumped there first. */
      const now = whereIs(critter.el);
      halt(critter, now);

      const away = Math.atan2(now.y - from.y, now.x - from.x);
      const bolt = rand(200, 310);
      let to = null;
      let bestGap = -1;
      for (let i = 0; i < 6; i += 1) {
        const angle = away + Math.ceil(i / 2) * 1.05 * (i % 2 ? -1 : 1);
        const cand = {
          x: Math.min(Math.max(24, now.x + Math.cos(angle) * bolt), window.innerWidth - 24),
          y: Math.min(Math.max(44, now.y + Math.sin(angle) * bolt), window.innerHeight - 44),
        };
        const gap = Math.hypot(cand.x - from.x, cand.y - from.y);
        if (gap > bestGap) {
          bestGap = gap;
          to = cand;
        }
        if (gap > 150) break;
      }

      /* A firefly has no front, so it bolts without banking. */
      const tilt =
        critter.kind === "butterfly"
          ? Math.max(-34, Math.min(34, (to.x - now.x) * 0.16))
          : 0;
      /* Break upward into an arc rather than sliding along a straight
         line to the escape point. */
      const midX = now.x + (to.x - now.x) * 0.55;
      const midY = now.y + (to.y - now.y) * 0.55 - rand(14, 32);
      critter.el.classList.add("is-startled");
      critter.flight = critter.el.animate(
        [
          { transform: `translate(${now.x}px, ${now.y}px) rotate(${critter.tilt}deg)` },
          {
            transform: `translate(${midX}px, ${midY}px) rotate(${tilt * 1.2}deg)`,
            offset: 0.5,
          },
          { transform: `translate(${to.x}px, ${to.y}px) rotate(${tilt}deg)` },
        ],
        { duration: 540, easing: "cubic-bezier(0.17, 0.72, 0.28, 1)", fill: "forwards" }
      );
      critter.at = to;
      critter.tilt = tilt;
      critter.flight.onfinish = () => {
        critter.el.classList.remove("is-startled");
        critter.rest = window.setTimeout(() => launch(critter), rand(240, 700));
      };
    }

    function clear() {
      flock.forEach((critter) => {
        if (critter.flight) critter.flight.cancel();
        window.clearTimeout(critter.rest);
      });
      flock.length = 0;
      layer.innerHTML = "";
    }

    const WINGS = [
      ["#c9a227", "#7a5a1a"],
      ["#b42318", "#5c1a14"],
      ["#5f6b3a", "#3d4626"],
      ["#3d6ea8", "#1f3d66"],
      ["#b95f2f", "#6e3518"],
    ];

    function populate(kind) {
      clear();
      cast = kind;
      const count = kind === "butterfly" ? 5 : 9;
      for (let i = 0; i < count; i += 1) {
        const el = document.createElement("span");
        el.className = `critter ${kind}`;
        if (kind === "butterfly") {
          el.innerHTML = BUTTERFLY;
          const [a, b] = WINGS[i % WINGS.length];
          el.style.setProperty("--bf-a", a);
          el.style.setProperty("--bf-b", b);
          /* Each one beats at its own tempo, or they look like one animal. */
          const beat = rand(0.32, 0.52);
          $$(".bf-wing", el).forEach((wing, index) => {
            wing.style.animationDuration = `${beat}s`;
            wing.style.animationDelay = `${index ? -beat / 2 : 0}s`;
          });
        } else {
          el.innerHTML = "<span></span>";
          const pulse = el.firstElementChild;
          pulse.style.animationDuration = `${rand(2, 4.2)}s`;
          pulse.style.animationDelay = `${rand(-4, 0)}s`;
        }

        /* Neither cast lets you catch it. */
        el.addEventListener("pointerenter", (e) => {
          const critter = flock.find((c) => c.el === el);
          if (critter) flee(critter, { x: e.clientX, y: e.clientY });
        });

        const at = place();
        el.style.transform = `translate(${at.x}px, ${at.y}px)`;
        layer.appendChild(el);

        const critter = { el, kind, at, tilt: 0, flight: null, rest: null };
        flock.push(critter);
        critter.rest = window.setTimeout(() => launch(critter), rand(0, 2200));
      }
    }

    const castForTheme = () =>
      document.documentElement.dataset.theme === "dark" ? "firefly" : "butterfly";

    function sync() {
      const wanted = castForTheme();
      if (wanted !== cast) populate(wanted);
    }

    sync();
    /* The theme is set by swapping an attribute, so watch for that. */
    new MutationObserver(sync).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
  }

  setupCritters();
})();
