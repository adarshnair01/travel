import yaml from "js-yaml";

const schema = yaml.JSON_SCHEMA;

export function dumpDocument(data, body) {
  const front = yaml.dump(data, {
    schema,
    lineWidth: 100,
    noRefs: true,
    quotingType: '"',
  });
  return `---\n${front}---\n${body || ""}\n`;
}

export function parseDocument(raw, file = "trip") {
  if (!raw.startsWith("---\n")) {
    throw new Error(`${file}: missing opening front matter`);
  }
  const end = raw.indexOf("\n---\n", 4);
  if (end < 0) throw new Error(`${file}: unterminated front matter`);
  const data = yaml.load(raw.slice(4, end), { schema });
  let body = raw.slice(end + 5);
  if (body.endsWith("\n")) body = body.slice(0, -1);
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(`${file}: front matter must be a mapping`);
  }
  return { data, body };
}
