const fs = require("fs"), vm = require("vm"), assert = require("node:assert/strict");
const path = require("path");
const repo = path.resolve(__dirname, "../../..");
const loadAmd = file => {
	let result;
	vm.runInNewContext(fs.readFileSync(path.resolve(repo, file), "utf8"), {
		define: factory => result = factory()
	});
	return result;
};

const links = loadAmd("src/devtools/MarkdownLinkLocation.js");
const positions = loadAmd("src/devtools/EditorPosition.js");
const plain = value => JSON.parse(JSON.stringify(value));
const substitute = (href, description) => {
	if(href.startsWith(":") && !href.startsWith("://")) return description + href.substring(1);
	return href.replace(/:([^:]*)$/, description + "$1");
};

assert.deepEqual(plain(links.parse("src/:")), { href: "src/:" });
assert.deepEqual(plain(links.parse("src/:.js")), { href: "src/:.js" });
assert.deepEqual(plain(links.parse("issues/:/123")), { href: "issues/:/123" });
assert.deepEqual(plain(links.parse("src/foo.js:123")), {
	href: "src/foo.js", position: { line: 123 }
});
assert.deepEqual(plain(links.parse("src/foo.js:123:9")), {
	href: "src/foo.js", position: { line: 123, column: 9 }
});
assert.deepEqual(plain(links.parse("src/::123")), {
	href: "src/:", position: { line: 123 }
});
assert.equal(substitute(links.parse("src/::123").href, "foo.js"), "src/foo.js");
assert.equal(substitute(links.parse(":.js").href, "foo"), "foo.js");
assert.deepEqual(plain(links.parse("./src/vcl-comps/:.js:123")), {
	href: "./src/vcl-comps/:.js", position: { line: 123 }
});
assert.deepEqual(plain(links.parse(":123")), { href: "", position: { line: 123 } });
assert.deepEqual(plain(links.parse("src/foo.js:0")), { href: "src/foo.js:0" });
assert.deepEqual(plain(links.parse("src/foo.js:-1")), { href: "src/foo.js:-1" });
assert.deepEqual(plain(links.parse("#heading:123")), { href: "#heading:123" });
assert.deepEqual(plain(links.parse("https://example.test/file.js:123")), {
	href: "https://example.test/file.js:123"
});

const escaped_default = links.decodeHref("snapshots/snapshot%253A123", unescape);
const escaped_marked = links.decodeHref("snapshots/snapshot%3A123", unescape);
assert.deepEqual(plain(links.parse(escaped_default)), { href: escaped_default });
assert.deepEqual(plain(links.parse(escaped_marked)), { href: escaped_marked });
assert.equal(links.restoreLiteralColons(escaped_default), "snapshots/snapshot:123");
assert.equal(links.restoreLiteralColons(escaped_marked), "snapshots/snapshot:123");

function setup(loaded) {
	const calls = [], pending = {}, timers = [];
	const editor = {
		session: {
			getLength: () => 3,
			getLine: row => ["zero", "one", "xyz"][row]
		},
		gotoLine: (...args) => calls.push(["gotoLine"].concat(args)),
		clearSelection: () => calls.push(["clearSelection"]),
		centerSelection: () => calls.push(["centerSelection"])
	};
	const ace = {
		getEditor: () => editor,
		setFocus: () => calls.push(["focus"])
	};
	const tab = {
		qs: selector => selector === "#ace" ? ace : null,
		vars(name, value) {
			name = Array.isArray(name) ? name[0] : name;
			if(arguments.length === 2) pending[name] = value;
			return name === positions.READY_VAR ? loaded : pending[name];
		},
		removeVar: name => {
			const value = pending[name];
			delete pending[name];
			return value;
		},
		setTimeout: (name, callback) => timers.push([name, callback])
	};
	return { calls, pending, tab, timers };
}

let fixture = setup(true);
positions.queue(fixture.tab, { line: 99, column: 9 });
assert.equal(fixture.timers.length, 1);
fixture.timers[0][1]();
assert.deepEqual(fixture.calls, [
	["gotoLine", 3, 3, true],
	["clearSelection"],
	["centerSelection"],
	["focus"]
]);

fixture = setup(false);
positions.queue(fixture.tab, { line: 2 });
assert.deepEqual(fixture.pending[positions.PENDING_VAR], { line: 2 });
assert.deepEqual(plain(positions.revealPending(fixture.tab)), { line: 2, column: 0 });
assert.deepEqual(fixture.calls[0], ["gotoLine", 2, 0, true]);
assert.equal(fixture.pending[positions.PENDING_VAR], undefined);

fixture = setup(true);
assert.equal(positions.reveal(fixture.tab, { line: 0 }), null);
assert.equal(positions.reveal(fixture.tab, { line: "invalid" }), null);
assert.equal(fixture.calls.length, 0);

const markdown_source = fs.readFileSync(path.resolve(repo, "src/devtools/cavalion-md.js"), "utf8");
const workspace_source = fs.readFileSync(path.resolve(repo, "src/vcl-comps/Workspace.js"), "utf8");
assert.match(markdown_source, /position: position/);
assert.match(workspace_source, /EditorPosition\.queue\(tab, evt\.position\)/);
console.log("PASS: Markdown numeric suffixes remain separate from resource URIs and reveal bounded positions in loading or existing Ace editors.");
