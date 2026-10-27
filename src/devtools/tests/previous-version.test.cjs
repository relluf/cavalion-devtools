const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const repo = path.resolve(__dirname, "../../..");
const source = fs.readFileSync(path.join(repo, "src/devtools/PreviousVersion.js"), "utf8");
let PreviousVersion;
vm.runInNewContext(source, {
	Date,
	define(factory) { PreviousVersion = factory(() => {}); }
});

const values = {};
const tab = {
	vars(name, value) {
		name = Array.isArray(name) ? name[0] : name;
		if(arguments.length === 2) values[name] = value;
		return values[name];
	},
	removeVar(name) { delete values[name]; }
};

assert.equal(PreviousVersion.has(tab), false, "the menu stays hidden before a confirmed reload");
const first = PreviousVersion.capture("old text", "revision:1", "2026-10-19T10:00:00.000Z", "revision:2");
PreviousVersion.remember(tab, first);
assert.equal(PreviousVersion.has(tab), true, "a committed snapshot makes the menu available");

let view = PreviousVersion.view(tab, "new text", "revision:2");
assert.equal(view.previous.text, "old text", "the left side is the previous editor content");
assert.equal(view.previous.revision, "revision:1");
assert.equal(view.current.text, "new text", "the right side is the current editor content");
assert.equal(view.current.revision, "revision:2");

const second = PreviousVersion.capture("new text", "revision:2", "2026-10-19T10:05:00.000Z", "revision:3");
PreviousVersion.remember(tab, second);
view = PreviousVersion.view(tab, "newest text", "revision:3");
assert.equal(view.previous.text, "new text", "a later confirmed reload replaces the one in-memory snapshot");
assert.equal(view.current.text, "newest text");

PreviousVersion.clear(tab);
assert.equal(PreviousVersion.has(tab), false, "destroy cleanup removes the snapshot");
assert.equal(PreviousVersion.view(tab, "ignored", "revision:4"), undefined);

const block = fs.readFileSync(path.join(repo, "src/cavalion-blocks/PreviousVersionDiff.js"), "utf8");
const editor = fs.readFileSync(path.join(repo, "src/vcl-comps/Editor.js"), "utf8");
assert.ok(block.indexOf('"previous-ace"') < block.indexOf('"current-ace"'), "the Hover renders previous on the left and current on the right");
assert.match(block, /setReadOnly\(true\)/, "both comparison editors are read-only");
assert.match(block, /changeScrollTop/, "the side-by-side editors synchronize scrolling");
assert.match(editor, /previousVersionDiff\.setVisible\(hasPreviousVersion\)/, "the chevron menu item follows snapshot availability");
assert.match(editor, /PreviousVersion\.clear\(tab\)/, "editor destruction clears its in-memory snapshot");

console.log("previous version snapshot and Hover diff tests passed");
