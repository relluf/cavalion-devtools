const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.resolve(__dirname, "../cavalion-md.js"), "utf8");
const start = source.indexOf("\tfunction isEscapedAt(");
const end = source.indexOf("\tconst getEditorRoot", start);
assert.ok(start >= 0 && end > start);
const escapeMarkdownLinkDescriptions = vm.runInNewContext(
	source.slice(start, end) + "\nescapeMarkdownLinkDescriptions"
);

const document = [
	"# `2026/11/24` Recente entry",
	"",
	"<details>",
	"<summary>1 prompt</summary>",
	"",
	"> [clear throat een onafgesloten haakje in een prompt",
	"",
	"</details>",
	"",
	"# `2026/10/27` Oudere entry",
	"",
	"[bestand_met_<label>](bestand.md)",
	"![afbeelding_met_<label>](beeld.png)"
].join("\n");
const result = escapeMarkdownLinkDescriptions(document);

assert.ok(result.includes("</details>\n\n# `2026/10/27`"),
	"the closing details tag and following heading stay outside the link description");
assert.ok(result.includes("[bestand\\_met\\_\\<label>](bestand.md)"),
	"underscores and angle brackets in actual link descriptions remain escaped");
assert.ok(result.includes("![afbeelding_met_<label>](beeld.png)"),
	"image descriptions remain unchanged");
assert.equal((result.match(/^<details>$/gm) || []).length, 1);
assert.equal((result.match(/^<\/details>$/gm) || []).length, 1);

console.log("PASS: stray brackets do not consume later details blocks or headings.");
