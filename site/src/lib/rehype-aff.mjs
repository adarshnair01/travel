// Rehype plugin: turns `aff:partner/path` Markdown links into real partner links (see
// src/affiliates.mjs). Earning links get rel="sponsored"; untagged ones are "nofollow". Every link
// carries data-aff attributes for the GA4 `affiliate_click` event, with the section it sits in.
import { resolveAff } from "../affiliates.mjs";

const textOf = (n) => (n.type === "text" ? n.value : (n.children ?? []).map(textOf).join(""));

export default function rehypeAff() {
  return (tree) => {
    let section = "intro";
    const walk = (node) => {
      if (node.type === "element" && node.tagName === "h2" && node.properties?.id) section = String(node.properties.id);
      if (node.type === "element" && node.tagName === "a") {
        const r = resolveAff(node.properties?.href);
        if (r) {
          const cls = [].concat(node.properties.className ?? []);
          node.properties = {
            ...node.properties,
            href: r.href,
            target: "_blank",
            rel: r.paid ? ["sponsored", "noopener"] : ["nofollow", "noopener"],
            className: [...cls, "aff"],
            dataAff: `${r.key}:${textOf(node).trim()}`.slice(0, 100),
            dataAffPlacement: section,
            dataAffPaid: String(r.paid),
          };
        }
      }
      for (const c of node.children ?? []) walk(c);
    };
    walk(tree);
  };
}
