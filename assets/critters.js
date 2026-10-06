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
      jar.inside.replaceChildren();
      jar.btn.classList.remove("is-open");
      busy = false;
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

        /* Neither cast lets you catch it by hand — only the jar can. */
        el.addEventListener("pointerenter", (e) => {
          const critter = flock.find((c) => c.el === el);
          if (critter && !critter.caught) flee(critter, { x: e.clientX, y: e.clientY });
        });

        const at = place();
        el.style.transform = `translate(${at.x}px, ${at.y}px)`;
        layer.appendChild(el);

        const critter = { el, kind, at, tilt: 0, flight: null, rest: null, caught: false, mini: null };
        flock.push(critter);
        if (caught) {
          critter.caught = true;
          el.style.visibility = "hidden";
          addToJar(critter);
        } else {
          critter.rest = window.setTimeout(() => launch(critter), rand(0, 2200));
        }
      }
      refreshJar();
    }

    /* ── The jar ────────────────────────────────────────────────────── */
    /* Whatever is flying gets swept into the jar, and comes back out on
       the next click. Switching theme while they're caught swaps the
       cast inside the jar too. */
    const jar = buildJar();
    let caught = false;
    let busy = false;

    function buildJar() {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "jar";
      btn.setAttribute("aria-pressed", "false");
      btn.innerHTML = `<span class="jar-vessel" aria-hidden="true">
        <svg class="jar-glass" viewBox="0 0 46 58">
          <path class="jar-body" d="M12 13h22v3c5 1.6 8 5.6 8 11.5V49a7 7 0 0 1-7 7H11a7 7 0 0 1-7-7V27.5C4 21.6 7 17.6 12 16z" />
        </svg>
        <span class="jar-inside"></span>
        <svg class="jar-shine" viewBox="0 0 46 58"><path d="M9.5 27v15" /><path d="M9.5 46.5v2" /></svg>
        <span class="jar-lid"></span>
      </span>
      <span class="jar-text"><b></b><small></small></span>`;
      document.body.appendChild(btn);
      return {
        btn,
        vessel: btn.querySelector(".jar-vessel"),
        inside: btn.querySelector(".jar-inside"),
        title: btn.querySelector(".jar-text b"),
        sub: btn.querySelector(".jar-text small"),
      };
    }

    const COPY = {
      butterfly: { catch: "Catch the butterflies", out: "out on the page", in: "in the jar" },
      firefly: { catch: "Catch the fireflies", out: "lighting the page", in: "lit in the jar" },
    };

    function refreshJar() {
      const words = COPY[cast] || COPY.butterfly;
      const title = caught ? "Set them free" : words.catch;
      const sub = `${flock.length} ${caught ? words.in : words.out}`;
      jar.title.textContent = title;
      jar.sub.textContent = sub;
      jar.btn.setAttribute("aria-pressed", String(caught));
      jar.btn.setAttribute("aria-label", `${title} — ${sub}`);
      jar.btn.classList.toggle("is-full", caught);
      jar.btn.classList.toggle("is-glowing", caught && cast === "firefly");
    }

    /* Just inside the neck of the jar, in the layer's coordinates. */
    function mouth(el) {
      const box = jar.vessel.getBoundingClientRect();
      return {
        x: box.left + box.width / 2 - el.offsetWidth / 2,
        y: box.top + 12 - el.offsetHeight / 2,
      };
    }

    const restingOpacity = (kind) => (kind === "butterfly" ? 0.8 : 1);

    function addToJar(critter) {
      const mini = document.createElement("span");
      if (critter.kind === "butterfly") {
        mini.className = "jar-bug";
        mini.innerHTML = BUTTERFLY;
        mini.style.setProperty("--bf-a", critter.el.style.getPropertyValue("--bf-a"));
        mini.style.setProperty("--bf-b", critter.el.style.getPropertyValue("--bf-b"));
        const beat = rand(0.3, 0.55);
        $$(".bf-wing", mini).forEach((wing, index) => {
          wing.style.animationDuration = `${beat}s`;
          wing.style.animationDelay = `${index ? -beat / 2 : 0}s`;
        });
      } else {
        mini.className = "jar-spark";
        mini.innerHTML = "<span></span>";
        mini.firstElementChild.style.animationDuration = `${rand(1.6, 3.4)}s`;
        mini.firstElementChild.style.animationDelay = `${rand(-3, 0)}s`;
      }
      mini.style.left = `${rand(6, 64)}%`;
      mini.style.top = `${rand(8, 64)}%`;
      mini.style.setProperty("--flit", `${rand(2.2, 4.4)}s`);
      mini.style.setProperty("--flit-delay", `${rand(-4, 0)}s`);
      jar.inside.appendChild(mini);
      critter.mini = mini;
    }

    function wobble() {
      jar.vessel.animate(
        [
          { transform: "rotate(0deg)" },
          { transform: "rotate(-7deg)" },
          { transform: "rotate(5deg)" },
          { transform: "rotate(0deg)" },
        ],
        { duration: 380, easing: "ease-out" }
      );
    }

    function settle(after) {
      window.setTimeout(() => {
        jar.btn.classList.remove("is-open");
        busy = false;
      }, after);
    }

    /* Each one is swept up in an arc over the page and dropped through
       the neck, shrinking as it goes, one after another. */
    function catchAll() {
      busy = true;
      jar.btn.classList.add("is-open");
      let pending = flock.length;
      const landed = () => {
        pending -= 1;
        if (pending > 0) return;
        caught = true;
        refreshJar();
        settle(260);
      };
      if (!pending) return landed();

      flock.forEach((critter, i) => {
        const start = whereIs(critter.el);
        halt(critter, start);
        critter.caught = true;
        const end = mouth(critter.el);
        const midX = start.x + (end.x - start.x) * 0.6 + rand(-70, 70);
        const midY = Math.min(start.y, end.y) - rand(60, 150);
        const swing = critter.kind === "butterfly" ? rand(-30, 30) : 0;
        const fade = restingOpacity(critter.kind);
        if (critter.kind === "butterfly") critter.el.classList.add("is-startled");
        critter.flight = critter.el.animate(
          [
            { transform: `translate(${start.x}px, ${start.y}px) rotate(${critter.tilt}deg) scale(1)`, opacity: fade },
            { transform: `translate(${midX}px, ${midY}px) rotate(${swing}deg) scale(0.85)`, opacity: fade, offset: 0.55 },
            { transform: `translate(${end.x}px, ${end.y}px) rotate(0deg) scale(0.3)`, opacity: 0 },
          ],
          {
            duration: rand(1100, 1600),
            delay: 180 + i * 140,
            easing: "cubic-bezier(0.45, 0, 0.25, 1)",
            fill: "forwards",
          }
        );
        critter.flight.onfinish = () => {
          critter.el.classList.remove("is-startled");
          critter.el.style.visibility = "hidden";
          addToJar(critter);
          wobble();
          landed();
        };
      });
    }

    /* The lid pops, and they spill out of the neck and scatter back
       across the page before going back to wandering. */
    function releaseAll() {
      busy = true;
      jar.btn.classList.add("is-open");
      jar.btn.classList.remove("is-glowing");
      let pending = flock.length;
      const flown = () => {
        pending -= 1;
        if (pending > 0) return;
        caught = false;
        refreshJar();
        settle(320);
      };
      if (!pending) return flown();

      flock.forEach((critter, i) => {
        const delay = 160 + i * 110;
        const start = mouth(critter.el);
        const to = place();
        const midX = start.x + rand(-60, 90);
        const midY = start.y - rand(90, 170);
        const tilt =
          critter.kind === "butterfly" ? Math.max(-22, Math.min(22, (to.x - start.x) * 0.1)) : 0;
        const glow = restingOpacity(critter.kind);
        critter.el.getAnimations().forEach((anim) => anim.cancel());
        critter.el.style.visibility = "";
        if (critter.kind === "butterfly") critter.el.classList.add("is-startled");
        window.setTimeout(() => {
          if (critter.mini) critter.mini.remove();
          critter.mini = null;
        }, delay);
        critter.flight = critter.el.animate(
          [
            { transform: `translate(${start.x}px, ${start.y}px) rotate(0deg) scale(0.3)`, opacity: 0 },
            { transform: `translate(${midX}px, ${midY}px) rotate(${tilt * 1.4}deg) scale(0.85)`, opacity: glow, offset: 0.4 },
            { transform: `translate(${to.x}px, ${to.y}px) rotate(${tilt}deg) scale(1)`, opacity: glow },
          ],
          {
            duration: rand(1300, 1900),
            delay,
            easing: "cubic-bezier(0.2, 0.7, 0.3, 1)",
            fill: "both",
          }
        );
        critter.flight.onfinish = () => {
          critter.el.classList.remove("is-startled");
          critter.caught = false;
          critter.tilt = tilt;
          critter.at = to;
          halt(critter, to);
          critter.rest = window.setTimeout(() => launch(critter), rand(200, 900));
          flown();
        };
      });
    }

    jar.btn.addEventListener("click", () => {
      if (busy) return;
      if (caught) releaseAll();
      else catchAll();
    });

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
