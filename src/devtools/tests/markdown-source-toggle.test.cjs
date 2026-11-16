const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const repo = path.resolve(__dirname, "../../..");
const editorSource = fs.readFileSync(path.join(repo, "src/vcl-comps/Editor.js"), "utf8");
const navigationSource = editorSource.slice(
	editorSource.indexOf("var TopLevelNavigation = (() => {"),
	editorSource.indexOf("\nvar bindTopLevelNavigationResize", editorSource.indexOf("var TopLevelNavigation = (() => {"))
);
const navigation = vm.runInNewContext(navigationSource + "\nTopLevelNavigation", {
	window: { innerHeight: 900, innerWidth: 1400 },
	js: { sf: (_, value) => value + "px" }
});
const rail = { style: {} };
const tick = { _topLevelNavKeys: ["one"], _topLevelNavVisual: { style: {} } };
const menu = { style: {} };
const nav = {
	style: {},
	_topLevelNavOptions: { side: "right", railClassName: "rail" },
	_topLevelNav: { elements: [tick], menu },
	querySelector: () => rail
};
const root = {
	getVar: () => ({ side: "left" }),
	vars: () => ({}),
	nodeNeeded: () => ({ getBoundingClientRect: () => ({ top: 100, left: 50, right: 900, width: 850, height: 600 }) })
};

navigation.setSide(root, nav, null, undefined);
assert.equal(nav.style.left, "64px");
assert.equal(nav.style.right, "");
assert.equal(rail.style.alignItems, "flex-start");
assert.equal(tick._topLevelNavVisual.style.left, "0");
navigation.setSide(root, nav, null, "right");
assert.equal(nav.style.left, "");
assert.equal(nav.style.right, "514px");
assert.equal(rail.style.alignItems, "flex-end");
assert.equal(tick._topLevelNavVisual.style.right, "0");
assert.strictEqual(nav._topLevelNav.elements[0], tick, "visibility only repositions existing ticks");

const calls = [];
const markdown = {
	schedulePreviewSync: () => calls.push("sync"),
	update_shrink: () => calls.push("shrink"),
	updateTopLevelNavigationVisibility: () => calls.push("position"),
	updateTopLevelNavigationPosition: () => { throw new Error("toggle rebuilt navigation"); },
	render: () => { throw new Error("toggle rendered Markdown"); }
};
const component = vm.runInNewContext(fs.readFileSync(path.join(repo, "src/vcl-comps/Editor$/md.js"), "utf8"), {
	require: () => markdown
});
const toggle = component[2].find(item => item[1] === "toggle-source")[2];
let visible = true;
const ace = { getEditor: () => ({ getCursorPosition: () => ({ row: 20 }) }), setFocus: () => calls.push("focus") };
const action = {
	getState: () => visible,
	up: () => ({ vars: (_, state) => { visible = state; calls.push("vars"); }, writeStorage: () => calls.push("storage") }),
	setState: () => calls.push("state"),
	ud: () => ace,
	setTimeout: (_, callback) => callback()
};

toggle.onExecute.call(action);
assert.deepEqual(calls, ["vars", "state", "sync", "shrink", "position", "storage"]);
assert.equal(visible, false);

console.log("PASS: source visibility repositions the existing navigation without rebuilding it.");
