"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(
	path.resolve(__dirname, "../../cavalion-blocks/Alphaview.js"),
	"utf8"
);
const extractHelper = name => {
	const start = source.indexOf("const " + name + " = function(");
	const end = source.indexOf("\n};", start);
	assert(start !== -1, "Alphaview must define " + name);
	return source.slice(start, end + "\n};".length);
};
const renderAlphaviewStatus = new Function(
	extractHelper("renderAlphaviewStatus") + "\nreturn renderAlphaviewStatus;"
)();
const setTotalTabVisible = new Function(
	extractHelper("setTotalTabVisible") + "\nreturn setTotalTabVisible;"
)();
const setFilterBarVisible = new Function(
	"renderAlphaviewStatus", "setTotalTabVisible",
	extractHelper("setFilterBarVisible") + "\nreturn setFilterBarVisible;"
)(renderAlphaviewStatus, setTotalTabVisible);
const toggleFilterBar = new Function(
	"getActiveList", "setFilterBarVisible",
	extractHelper("toggleFilterBar") + "\nreturn toggleFilterBar;"
)(root => root.list, setFilterBarVisible);
const initializeFilterBar = new Function(
	"setFilterBarVisible",
	extractHelper("initializeFilterBar") + "\nreturn initializeFilterBar;"
)(setFilterBarVisible);
const statusHtml = new Function(
	"getActiveList", "getListColumns", "js",
	extractHelper("statusHtml") + "\nreturn statusHtml;"
)(root => root.list, list => list.columns, {
	sf(format, ...values) {
		let index = 0;
		return format.replace(/%[sd]/g, () => String(values[index++])).replace(/%%/g, "%");
	}
});

assert.match(source, /activeControl: "list"/,
	"the visible Alphaview list must retain initial keyboard focus while the bar is hidden");
assert.match(source, /\["Bar", \("bar"\) , \{\s*visible: false,/,
	"the Alphaview filter and navigation bar must start hidden");
assert.match(source, /#compact-status.*position:absolute;right:8px;bottom:8px;.*border-radius:9px/,
	"the compact status must be a subtle bottom-right overlay");
assert.doesNotMatch(source, /"": "position:relative;"/,
	"the overlay must not replace the VCL root Form's absolute positioning context");
assert.match(source, /\["Element", \("compact-status"\), \{[\s\S]*?onRender\(\) \{ renderStatusContent\(this\); \}/,
	"the compact overlay must reuse the shared status renderer");
assert.match(source, /const moveNavigationBar = function\(root, list\)[\s\S]*?compactStatus\.setParent\(list\);/,
	"the compact overlay must be parented to the active List container");
assert.match(source, /\["Element", \("compact-status"\), \{\s*align: "none",/,
	"the compact overlay must stay outside VCL's client alignment calculation");
assert.doesNotMatch(extractHelper("setFilterBarVisible"), /#list|ListBody|setVisible/,
	"filter-bar visibility changes must not target the List or its body");
assert.match(extractHelper("setFilterBarVisible"), /setTotalTabVisible\(root, visible\);/,
	"the aggregate total tab must follow the filter bar's visibility state");
assert.match(source, /text: js\.sf\("<small>\(%d\)<\/small>", values\.flat\(\)\.length\),\s*vars: \{ array: values\.flat\(\), key: "", totalTab: true \}/,
	"the aggregate total tab keeps its existing count typography and has a stable marker");
assert.match(source, /setTotalTabVisible\(root, root\.ud\("#bar"\)\.isVisible\(\)\);\s*tabs\.show\(\);/,
	"newly created or reused aggregate tabs must adopt the current bar state");
assert.match(source, /\["Executable", \("focus-q"\), \{\s*hotkey: "MetaCtrl\+191",\s*on\(\) \{ toggleFilterBar\(this\.up\("Hover<>:root"\) \|\| this\.up\(\)\); \}/,
	"the existing Command-/ action must resolve the focused Hover or embedded Alphaview root");
assert.match(source, /installListColumnVisibilitySync\(this, list\);\s*moveNavigationBar\(this, list\);\s*initializeFilterBar\(this\);/,
	"Alphaview must anchor compact status and choose filter-bar state during its load phase");
assert.doesNotMatch(source, /tabs\.show\(\);\s*root\.qs\("#bar"\)\.show\(\);/,
	"ordinary grouped data must not reveal the filter bar after initialization");

const createView = hover => {
	const state = {
		barVisible: false,
		compactVisible: true,
		filterFocused: false,
		filterFocusCount: 0,
		listFocusCount: 0,
		barStatusRenders: 0,
		compactStatusRenders: 0,
		totalTabVisible: true,
		listVisible: true,
		listBodyVisible: true,
		q: "",
		array: [{}, {}, {}, {}],
		filtered: [{}, {}],
		selection: [],
		columnVisibility: [true, true],
		showingAll: false
	};
	const bar = {
		isVisible() { return state.barVisible; },
		show() { state.barVisible = true; },
		hide() { state.barVisible = false; }
	};
	const compact = {
		show() { state.compactVisible = true; },
		hide() { state.compactVisible = false; },
		render() { state.compactStatusRenders++; }
	};
	const q = {
		getValue() { return state.q; },
		isFocused() { return state.filterFocused; },
		setFocus() {
			state.filterFocused = true;
			state.filterFocusCount++;
		}
	};
	const list = {
		columns: state.columnVisibility.map((value, index) => ({
			isVisible() { return state.columnVisibility[index]; }
		})),
		getSource() { return { _array: state.array, _arr: state.filtered }; },
		getSelection() { return state.selection; },
		setFocus() {
			state.filterFocused = false;
			state.listFocusCount++;
		},
		vars(name) { return name === "autoColumns.showingAll" && state.showingAll; }
	};
	const status = {
		render() { state.barStatusRenders++; }
	};
	const totalTab = {
		vars(name) { return name === "totalTab"; },
		setVisible(visible) { state.totalTabVisible = visible; }
	};
	const tabs = { _controls: [totalTab] };
	const controls = {
		"#bar": bar,
		"#compact-status": compact,
		"#q": q,
		"#list": list,
		"#status": status
	};
	const root = {
		list,
		up(selector) { return selector === "Hover<>:root" && hover ? {} : null; },
		qs(selector) { return selector === "#tabs" ? tabs : controls[selector]; },
		ud(selector) { return controls[selector]; }
	};

	return { root, state };
};

const embedded = createView(false);
initializeFilterBar(embedded.root);
assert.equal(embedded.root.up("Hover<>:root"), null,
	"the GT Lab-style embedded Alphaview resolves no Hover root");
assert.equal(embedded.state.barVisible, false,
	"an embedded user-facing Alphaview starts with the full bar hidden");
assert.equal(embedded.state.compactVisible, true,
	"an embedded user-facing Alphaview starts with compact status visible");
assert.equal(embedded.state.totalTabVisible, false,
	"an embedded user-facing Alphaview starts with its aggregate total tab hidden");

toggleFilterBar(embedded.root);
assert.equal(embedded.state.barVisible, true, "Command-/ shows a hidden filter bar");
assert.equal(embedded.state.compactVisible, false, "showing the full bar hides compact status");
assert.equal(embedded.state.totalTabVisible, true, "showing the full bar restores the aggregate total tab");
assert.equal(embedded.state.filterFocused, true, "showing the filter bar focuses its input");
assert.equal(embedded.state.listVisible, true, "showing the bar leaves the List visible");
assert.equal(embedded.state.listBodyVisible, true, "showing the bar leaves the ListBody visible");

toggleFilterBar(embedded.root);
assert.equal(embedded.state.barVisible, false,
	"Command-/ hides the visible bar when the filter already has focus");
assert.equal(embedded.state.compactVisible, true, "hiding the full bar restores compact status");
assert.equal(embedded.state.totalTabVisible, false, "hiding the full bar also hides the aggregate total tab");
assert.equal(embedded.state.listFocusCount, 1, "hiding the filter bar restores list focus");
assert.equal(embedded.state.listVisible, true, "hiding the bar leaves the List visible");
assert.equal(embedded.state.listBodyVisible, true, "hiding the bar leaves the ListBody visible");

toggleFilterBar(embedded.root);
assert.equal(embedded.state.barVisible, true, "Command-/ shows the hidden bar again");
assert.equal(embedded.state.filterFocused, true, "showing it again restores filter focus");

const visibleWithoutFilterFocus = createView(false);
initializeFilterBar(visibleWithoutFilterFocus.root);
setFilterBarVisible(visibleWithoutFilterFocus.root, true);
visibleWithoutFilterFocus.state.filterFocused = false;
toggleFilterBar(visibleWithoutFilterFocus.root);
assert.equal(visibleWithoutFilterFocus.state.barVisible, true,
	"Command-/ keeps a visible bar open when its filter lacks focus");
assert.equal(visibleWithoutFilterFocus.state.filterFocused, true,
	"Command-/ focuses a visible but unfocused filter before it may hide the bar");
toggleFilterBar(visibleWithoutFilterFocus.root);
assert.equal(visibleWithoutFilterFocus.state.barVisible, false,
	"a following Command-/ hides the now-focused filter bar");

const hover = createView(true);
initializeFilterBar(hover.root);
assert.equal(hover.state.barVisible, true,
	"a developer Hover Alphaview starts with the full bar visible");
assert.equal(hover.state.compactVisible, false,
	"a developer Hover Alphaview starts with compact status hidden");
assert.equal(hover.state.totalTabVisible, true,
	"a developer Hover Alphaview starts with its aggregate total tab visible");
assert.equal(hover.state.filterFocused, true,
	"a developer Hover Alphaview starts with its filter focused");
toggleFilterBar(hover.root);
assert.equal(hover.state.barVisible, false,
	"Command-/ hides an initially visible Hover bar when its filter is focused");

const statusView = createView(false);
initializeFilterBar(statusView.root);
assert.equal(statusHtml(statusView.root), "4 items", "compact status reports the current record count");
statusView.state.selection = [0];
statusView.state.q = "filtered";
statusView.state.columnVisibility[1] = false;
assert.match(statusHtml(statusView.root), /1 \(25%\) selected \/ 2 \(50%\) filtered \/ .*1 column hidden.* \/ 4 total/,
	"selection, filtering and column status share the existing status calculation");
statusView.state.array.push({});
assert.match(statusHtml(statusView.root), /5 total$/,
	"status content reflects later data updates");

console.log("PASS: Alphaview uses focus-aware Command-/ behavior and shared compact status content.");
