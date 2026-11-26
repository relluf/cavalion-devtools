"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(path.resolve(__dirname, "../../cavalion-blocks/Alphaview.js"), "utf8");
const start = source.indexOf("const installCompactHoverCursor = function(");
const end = source.indexOf("\n};", start);
assert(start !== -1 && end > start);
const install = new Function(source.slice(start, end + 4) + "\nreturn installCompactHoverCursor;")();
assert.match(source, /initializeFilterBar\(this\);\s*installCompactHoverCursor\(this\);/);

function fixture({ compact = true, barVisible = false, hosted = true } = {}) {
	const state = {};
	const rule = { style: { cursor: "" } };
	const hover = {
		_node: { style: { cursor: "" } },
		_cssRules: { _rules: { ".override-cursor *": rule } },
		vars(key) { return state[key]; },
		override(methods) { this.methods = methods; }
	};
	const root = {
		up(selector) { assert.equal(selector, "Hover<>:root"); return hosted ? hover : null; },
		vars(key) { assert.deepEqual(key, ["presentation.compact"]); return compact; },
		ud(selector) { assert.equal(selector, "#bar"); return { isVisible: () => barVisible }; }
	};
	install(root);
	const cursor = value => {
		hover._node.style.cursor = rule.style.cursor = value;
	};
	const run = (method, inherited) => {
		let calls = 0;
		const event = Object.freeze({ target: "tab" });
		hover.inherited = args => {
			calls++;
			assert.equal(args[0], event, "the tab event is forwarded unchanged");
			inherited();
			return "forwarded";
		};
		assert.equal(hover.methods[method].call(hover, event), "forwarded");
		assert.equal(calls, 1, "each existing handler runs once");
	};
	const expectCursor = value => {
		assert.equal(hover._node.style.cursor, value);
		assert.equal(rule.style.cursor, value, "descendants use the same cursor policy");
	};
	return { hover, state, cursor, run, expectCursor };
}

for(const direction of ["n-resize", "nw-resize", "ne-resize"]) {
	const f = fixture();
	f.run("onmousemove", () => f.cursor(direction));
	f.expectCursor("");
	f.run("onmousedown", () => {
		f.state["mousedown-cursor"] = direction;
		f.cursor(direction);
	});
	f.expectCursor("");
	assert.equal(f.state["mousedown-cursor"], direction, "the original top hit area stays armed");
	f.run("ondragstart", () => {
		f.expectCursor(direction);
		f.state["active-dragstart"] = true;
	});
	f.expectCursor(direction);
	f.run("onmousemove", () => f.cursor(direction));
	f.expectCursor(direction);
	f.run("ondragend", () => {
		f.expectCursor(direction, "drop/end still sees the resize direction");
		delete f.state["active-dragstart"];
		delete f.state["mousedown-cursor"];
	});
	f.expectCursor("");
	f.run("onmousemove", () => f.cursor(direction));
	f.expectCursor("");
	// Escape uses the same dragend lifecycle, even without a following mousemove.
	f.state["mousedown-cursor"] = direction;
	f.run("ondragstart", () => { f.state["active-dragstart"] = true; });
	f.run("ondragend", () => { delete f.state["active-dragstart"]; });
	f.expectCursor("");
}

const keyboard = fixture();
keyboard.cursor("ne-resize");
keyboard.run("ondragstart", () => { keyboard.state["active-dragstart"] = true; });
keyboard.expectCursor("ne-resize");
keyboard.run("ondragend", () => { delete keyboard.state["active-dragstart"]; });
keyboard.expectCursor("");
assert.equal(keyboard.hover.methods.onclick, undefined, "tab clicks keep their existing handler");
assert.equal(keyboard.hover.methods.onmouseup, undefined, "mouseup must not clear the direction before drop");

for(const options of [{ compact: false }, { barVisible: true }]) {
	const f = fixture(options);
	f.run("onmousemove", () => f.cursor("n-resize"));
	f.expectCursor("n-resize");
}
for(const direction of ["w-resize", "e-resize", "s-resize", "sw-resize", "se-resize", "move", ""]) {
	const f = fixture();
	f.run("onmousemove", () => f.cursor(direction));
	f.expectCursor(direction);
}
assert.equal(fixture({ hosted: false }).hover.methods, undefined, "embedded Alphaviews install no overrides");
console.log("PASS: compact Alphaview preserves top hit directions and tab events, shows the cursor during resize, and restores it on end/cancel.");
