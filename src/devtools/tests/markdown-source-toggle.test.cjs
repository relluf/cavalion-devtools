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
const storage = [];
let availableWidth = 1400;
const markdown = {
	schedulePreviewSync: () => calls.push("sync"),
	update_shrink: () => calls.push("shrink"),
	updatePreviewWidth: () => calls.push("width"),
	previewWideAvailable: () => availableWidth >= 1160,
	updateTopLevelNavigationVisibility: () => calls.push("position"),
	updateTopLevelNavigationPosition: () => { throw new Error("toggle rebuilt navigation"); },
	render: () => { throw new Error("toggle rendered Markdown"); }
};
const component = vm.runInNewContext(fs.readFileSync(path.join(repo, "src/vcl-comps/Editor$/md.js"), "utf8"), {
	require: () => markdown
});
const toggle = component[2].find(item => item[1] === "toggle-source")[2];
let visible = true;
const vars = { "md-preview-width": "normal", "md-source-visible": true };
const ace = { getEditor: () => ({ getCursorPosition: () => ({ row: 20 }) }), setFocus: () => calls.push("focus") };
const markdownRoot = {
	vars(key, value) {
		if(Array.isArray(key)) return vars[key[0]];
		if(arguments.length > 1) vars[key] = value;
		calls.push(key);
		return vars[key];
	},
	writeStorage: (key, value) => storage.push([key, value])
};
const action = {
	getState: () => visible,
	up: () => markdownRoot,
	setState: state => { visible = state; calls.push("state"); },
	ud: () => ace,
	setTimeout: (_, callback) => callback()
};

toggle.onExecute.call(action);
assert.equal(visible, false);
assert.equal(vars["md-preview-width"], "normal");

toggle.onExecute.call(action);
assert.equal(visible, false);
assert.equal(vars["md-preview-width"], "wide");

toggle.onExecute.call(action);
assert.equal(visible, true);
assert.equal(vars["md-preview-width"], "normal");
assert.deepEqual(storage, [
	["source-visible", false], ["preview-width", "normal"],
	["source-visible", false], ["preview-width", "wide"],
	["source-visible", true], ["preview-width", "normal"]
]);
assert.equal(calls.filter(call => call === "sync").length, 3);
assert.equal(calls.filter(call => call === "shrink").length, 3);
assert.equal(calls.filter(call => call === "position").length, 3);
assert.equal(calls.filter(call => call === "focus").length, 1);

availableWidth = 900;
toggle.onExecute.call(action);
assert.equal(visible, false);
toggle.onExecute.call(action);
assert.equal(visible, true, "narrow editors skip the wide preview state");
assert.equal(vars["md-preview-width"], "normal");

console.log("PASS: source toggle cycles normal, wide and source views only when space permits.");
