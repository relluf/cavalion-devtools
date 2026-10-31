const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = "![een](a.png)\n\n> ![twee][ref]\n\n```\n![geen](x)\n```\n\n<img src='b.png' alt='drie'>";
const tokens = [
	{ type: "paragraph", raw: "![een](a.png)", tokens: [{ type: "image", raw: "![een](a.png)", text: "een", href: "a.png" }] },
	{ type: "space", raw: "\n\n" },
	{ type: "blockquote", raw: "> ![twee][ref]\n", tokens: [{ type: "paragraph", raw: "![twee][ref]", tokens: [{ type: "image", raw: "![twee][ref]", text: "twee", href: "b.png" }] }] },
	{ type: "space", raw: "\n" },
	{ type: "code", raw: "```\n![geen](x)\n```" },
	{ type: "space", raw: "\n\n" },
	{ type: "html", raw: "<img src='b.png' alt='drie'>" }
];
let api;
vm.runInNewContext(fs.readFileSync("src/devtools/MarkdownImages.js", "utf8"), {
	define(factory) { api = factory(() => ({ marked: { lexer: () => tokens } })); }
});
const result = api.images(source);
assert.equal(result.length, 3);
assert.deepEqual(Array.from(result, item => [item.text, item.row, item.column]), [
	["een", 0, 0], ["twee", 2, 2], ["drie", 8, 0]
]);
assert.ok(result.every(item => source.slice(item.offset).startsWith(item.text === "drie" ? "<img" : "![")));
console.log("Markdown image source positions: OK");

let block;
const elements = [];
const createElement = tag => {
	const element = { tag, children: [], appendChild(child) { this.children.push(child); },
		addEventListener(name, listener) { this[name] = listener; } };
	elements.push(element);
	return element;
};
const componentSource = fs.readFileSync("src/cavalion-blocks/MarkdownImages.js", "utf8");
let visible = false;
const editor = { session: { on() {}, off() {} }, gotoLine(...args) { this.destination = args; } };
const sections = [];
const collapsed = { parentElement: null, classList: { contains: name => ["md-section", "collapsed"].includes(name) } };
const targets = [
	{ src: "/home/Docs/folder/a.png", parentElement: collapsed, getBoundingClientRect: () => ({ top: 500, height: 100 }) },
	{ src: "/home/Docs/folder/b.png", parentElement: null, getBoundingClientRect: () => ({ top: 700, height: 100 }) },
	{ src: "/home/Docs/folder/b.png", parentElement: null, getBoundingClientRect: () => ({ top: 900, height: 100 }) }
];
const preview = { scrollTop: 0, clientHeight: 400, querySelectorAll: () => targets,
	getBoundingClientRect: () => ({ top: 100 }) };
collapsed.parentElement = preview;
const root = { vars: () => visible, ud: selector => selector === "#output" ? { nodeNeeded: () => preview } : null };
const ace = { getEditor: () => editor, getValue: () => source, vars: () => ({ uri: "Docs/folder/file.md" }),
	up: () => root, setFocus() { this.focused = true; }, setTimeout(key, fn) { this.timer = key; fn(); } };
const node = { textContent: "", children: [], appendChild(child) { this.children.push(child); } };
const md = { flushMarkdownRender() { this.flushed = true; },
	setSectionCollapsed(control, section, state) { sections.push([section, state]); }, setFolderCollapsed() {} };
const context = {
	require: name => name === "devtools/cavalion-md" ? md : api,
	document: { createElement }, js: { up: uri => uri.slice(0, uri.lastIndexOf("/")) }
};
block = vm.runInNewContext(componentSource, context);
block[1].onLoad.call({ vars: () => ace, setTimeout: (key, callback) => callback(), nodeNeeded: () => node,
	once() {}, inherited() {} });
assert.equal(node.children.length, 3);
assert.equal(node.children[0].children[0].src, "/home/Docs/folder/a.png");
assert.equal(node.children[0].children[0].alt, "een");
node.children[0].click();
assert.deepEqual(editor.destination, [1, 0, true]);
assert.equal(ace.focused, undefined, "hidden source stays unfocused");
assert.equal(preview.scrollTop, 250, "preview reveals the selected image");
assert.equal(sections.length, 1, "collapsed section opens");
assert.equal(md.flushed, true, "pending preview render is flushed");
assert.equal(ace.timer, "sync-preview-to-editor", "preview sync cannot overwrite image navigation");
visible = true;
preview.scrollTop = 0;
node.children[2].click();
assert.deepEqual(editor.destination, [9, 0, true]);
assert.equal(ace.focused, true, "visible source is focused");
assert.equal(preview.scrollTop, 650, "duplicate images navigate to the matching occurrence");
console.log("Markdown image thumbnails, preview navigation and source visibility: OK");
