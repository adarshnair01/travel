// Rehype plugin: closes "Getting there", "Where to stay", "Top things to do" and "Good to know"
// with a small booking box built from the post's `book:` front matter (see src/affiliates.mjs).
// Runs after rehype-slug so the section ids exist. Static HTML, no client JavaScript.
import { bookBoxes } from "../affiliates.mjs";

const ICONS = {
  ticket: ["M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z", "M13 5v2", "M13 17v2", "M13 11v2"],
  bed: ["M2 4v16", "M2 8h18a2 2 0 0 1 2 2v10", "M2 17h20", "M6 8v9"],
  compass: ["M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20Z", "m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"],
  pack: ["M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z", "M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2", "M8 11h8", "M8 15h8"],
};

const el = (tagName, properties = {}, children = []) => ({ type: "element", tagName, properties, children });
const text = (value) => ({ type: "text", value });

const icon = (name) =>
  el(
    "svg",
    { className: ["book-icon"], viewBox: "0 0 24 24", width: "18", height: "18", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", ariaHidden: "true" },
    (ICONS[name] ?? []).map((d) => el("path", { d })),
  );

const link = (l, section, item) =>
  el(
    "a",
    {
      href: l.href,
      target: "_blank",
      rel: l.paid ? ["sponsored", "noopener"] : ["nofollow", "noopener"],
      className: ["book-link"],
      dataAff: `${l.key}:${item}`.slice(0, 100),
      dataAffPlacement: section,
      dataAffPaid: String(l.paid),
    },
    [text(l.name), el("span", { className: ["book-arrow"], ariaHidden: "true" }, [text("↗")])],
  );

function box(id, b) {
  const head = el("div", { className: ["book-head"] }, [
    icon(b.icon),
    el("p", { className: ["book-title"] }, [text(b.title)]),
    ...(b.paid ? [el("span", { className: ["book-tag"] }, [text("Affiliate links")])] : []),
  ]);
  const rows = (b.rows ?? []).map((r) =>
    el("li", { className: ["book-row"] }, [
      el("div", { className: ["book-what"] }, [
        el("span", { className: ["book-label"] }, [text(r.label)]),
        ...(r.note ? [el("span", { className: ["book-note"] }, [text(r.note)])] : []),
      ]),
      el("div", { className: ["book-links"] }, r.links.map((l) => link(l, id, r.label))),
    ]),
  );
  const chips = b.chips
    ? [
        el("div", { className: ["book-chips"] }, [
          el("span", { className: ["book-note"] }, [text(b.chips.label)]),
          el("div", { className: ["book-links"] }, b.chips.links.map((l) => link(l, id, l.name))),
        ]),
      ]
    : [];
  return el("aside", { className: ["book"], ariaLabel: b.title, dataPagefindIgnore: "" }, [
    head,
    ...chips,
    ...(rows.length ? [el("ul", { className: ["book-rows"] }, rows)] : []),
  ]);
}

export default function rehypeBook() {
  return (tree, file) => {
    const fm = file.data?.astro?.frontmatter ?? {};
    const boxes = bookBoxes(fm.book);
    if (!Object.keys(boxes).length) return;
    const isH2 = (n) => n.type === "element" && n.tagName === "h2";
    // Walk sections from the end so earlier insert positions stay valid.
    const h2s = tree.children.map((n, i) => (isH2(n) ? i : -1)).filter((i) => i >= 0);
    for (let k = h2s.length - 1; k >= 0; k--) {
      const id = tree.children[h2s[k]].properties?.id;
      if (!boxes[id]) continue;
      const end = k + 1 < h2s.length ? h2s[k + 1] : tree.children.length;
      tree.children.splice(end, 0, box(id, boxes[id]), text("\n"));
    }
  };
}
