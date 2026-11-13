"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(
	path.resolve(__dirname, "../../cavalion-blocks/Alphaview.js"),
	"utf8"
);
const document = {
	createElement(tagName) {
		return {
			tagName,
			attributes: {},
			listeners: {},
			setAttribute(name, value) { this.attributes[name] = value; },
			addEventListener(name, handler) { this.listeners[name] = handler; }
		};
	}
};
const localeStart = source.indexOf('var locale = require("locale").prefixed(');
const localeEnd = source.indexOf('\n});', localeStart);
assert(localeStart !== -1 && localeEnd !== -1, "Alphaview must register its locale texts");
let activeLocale = "en";
let translations;
const locale = new Function("require", source.slice(localeStart, localeEnd + 4) + "\nreturn locale;")(
	() => ({ prefixed(prefix, defaults) {
		assert.equal(prefix, "Alphaview");
		translations = defaults;
		return key => defaults[activeLocale][key];
	} })
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
const syncTabsNavigationButtons = new Function(
	"document", "locale",
	extractHelper("syncTabsNavigationButtons") + "\nreturn syncTabsNavigationButtons;"
)(document, locale);
const setFilterBarVisible = new Function(
	"renderAlphaviewStatus", "setTotalTabVisible", "syncTabsNavigationButtons",
	extractHelper("setFilterBarVisible") + "\nreturn setFilterBarVisible;"
)(renderAlphaviewStatus, setTotalTabVisible, syncTabsNavigationButtons);
const toggleFilterBar = new Function(
	"getActiveList", "setFilterBarVisible",
	extractHelper("toggleFilterBar") + "\nreturn toggleFilterBar;"
)(root => root.list, setFilterBarVisible);
const initializeFilterBar = new Function(
	"setFilterBarVisible",
	extractHelper("initializeFilterBar") + "\nreturn initializeFilterBar;"
)(setFilterBarVisible);
const statusHtml = new Function(
	"getActiveList", "getListColumns", "js", "locale",
	extractHelper("statusHtml") + "\nreturn statusHtml;"
)(root => root.list, list => list.columns, {
	sf(format, ...values) {
		let index = 0;
		return format.replace(/%[sd]/g, () => String(values[index++])).replace(/%%/g, "%");
	}
}, locale);

assert.deepEqual(Object.keys(translations.en).sort(), Object.keys(translations.nl).sort(),
	"every visible English label must have a Dutch translation");
const usedLocaleKeys = [...source.matchAll(/\blocale\("(\.[^"]+)"\)/g)].map(match => match[1]);
usedLocaleKeys.forEach(key => assert.equal(typeof translations.en[key], "string", key + " must be translated"));
[
	".status.column", ".status.columns", ".status.total", ".status.items"
].forEach(key => assert.equal(typeof translations.nl[key], "string", key + " must have a Dutch translation"));
const uniqueSelectionKeys = new Function("js", "locale",
	source.slice(source.indexOf("function uniqueSelectionKeys("), source.indexOf("\nvar css =")) +
	"\nreturn uniqueSelectionKeys;"
)({ sf(format, ...values) {
	let index = 0;
	return format.replace(/%[sd]/g, () => String(values[index++]));
} }, locale);
activeLocale = "nl";
assert.deepEqual(uniqueSelectionKeys(["", "gegeven naam", "", "dubbel", "dubbel"]),
	["selectie 1", "gegeven naam", "selectie 3", "dubbel [1/2]", "dubbel [2/2]"],
	"unnamed selections receive Dutch fallbacks while duplicate supplied names retain their suffixes");
assert.deepEqual(uniqueSelectionKeys(["", "selectie 1"]),
	["selectie 1 [1/2]", "selectie 1 [2/2]"],
	"generated selection names remain unique when they match a supplied name");
activeLocale = "en";

assert.match(source, /activeControl: "list"/,
	"the visible Alphaview list must retain initial keyboard focus while the bar is hidden");
assert.match(source, /\["Bar", \("bar"\) , \{\s*visible: false,/,
	"the Alphaview filter and navigation bar must start hidden");
assert.match(source, /#compact-status.*position:absolute;right:8px;bottom:8px;.*border-radius:9px/,
	"the compact status must be a subtle bottom-right overlay");
assert.match(source, /#tabs > \.alphaview-tabs-navigation:disabled.*color:silver/,
	"the disabled tab-row back button keeps its silver appearance");
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
assert.match(source, /setTotalTabVisible\(root, root\.ud\("#bar"\)\.isVisible\(\)\);\s*syncTabsNavigationButtons\(root\);\s*tabs\.show\(\);/,
	"newly created or reused aggregate tabs must adopt the current bar state");
assert.match(source, /\["Executable", \("focus-q"\), \{\s*hotkey: "MetaCtrl\+191",\s*on\(\) \{ toggleFilterBar\(this\._owner\); \}/,
	"the existing Command-/ action must always toggle its owning Alphaview root");
assert.doesNotMatch(source, /toggleFilterBar\(this\.up\("Hover<>:root"\)/,
	"a Hover host must remain context only and never become the filter-bar mutation target");
assert.match(source, /installListColumnVisibilitySync\(this, list\);\s*moveNavigationBar\(this, list\);\s*initializeFilterBar\(this\);/,
	"Alphaview must anchor compact status and choose filter-bar state during its load phase");
assert.doesNotMatch(source, /tabs\.show\(\);\s*root\.qs\("#bar"\)\.show\(\);/,
	"ordinary grouped data must not reveal the filter bar after initialization");
const revealNavigation = new Function(
	"syncTabsNavigationButtons",
	extractHelper("revealNavigation") + "\nreturn revealNavigation;"
)(syncTabsNavigationButtons);
const tabNode = {
	children: [],
	get firstChild() { return this.children[0] || null; },
	querySelector(selector) { return this.children.find(child => child.className.split(" ").includes(selector.slice(1))) || null; },
	insertBefore(child, before) {
		this.children = this.children.filter(item => item !== child);
		const index = before ? this.children.indexOf(before) : this.children.length;
		this.children.splice(index, 0, child);
		this.children.forEach((item, i) => { item.nextSibling = this.children[i + 1] || null; });
		child.parentNode = this;
	}
};
let navigationEnabled = false;
let navigationCalls = 0;
let refreshEnabled = true;
let refreshVisible = true;
let refreshCalls = 0;
let navigationBarVisible = false;
const navigationBack = {
	isEnabled() { return navigationEnabled; },
	setEnabled(value) { navigationEnabled = value; },
	go() { navigationCalls++; }
};
const navigationRefresh = {
	isEnabled() { return refreshEnabled; },
	go() { refreshCalls++; }
};
const navigationRoot = {
	qs(name) {
		if(name === "#tabs") return { nodeNeeded() { return tabNode; } };
		if(name === "#back") return navigationBack;
		if(name === "#refresh") return navigationRefresh;
		if(name === "#button-refresh") return { getVisible() { return refreshVisible; } };
	},
	ud() { return { isVisible() { return navigationBarVisible; } }; }
};
syncTabsNavigationButtons(navigationRoot);
assert.equal(tabNode.children.length, 2, "back and refresh are placed before the first data tab by default");
assert.equal(tabNode.firstChild.hidden, false, "back keeps its place without navigation history");
assert.equal(tabNode.firstChild.disabled, true, "back starts disabled without navigation history");
assert.match(tabNode.firstChild.innerHTML, /fa fa-chevron-left/, "the tab-row button uses the map's back icon");
assert.equal(tabNode.firstChild.attributes["aria-label"], "Back", "the button has a localized accessible name");
assert.match(tabNode.children[1].innerHTML, /fa fa-refresh/, "refresh uses the existing icon");
assert.equal(tabNode.children[1].attributes["aria-label"], "Refresh", "refresh has a localized accessible name");
assert.equal(tabNode.children[1].hidden, false, "refresh is visible when its bar counterpart is available");
tabNode.children[1].listeners.click();
assert.equal(refreshCalls, 1, "the tab-row refresh uses the existing refresh action");
revealNavigation(navigationRoot);
assert.equal(navigationBarVisible, false, "drilling into any Alphaview keeps the bar hidden");
assert.equal(tabNode.firstChild.hidden, false, "drilling into an Alphaview shows the tab-row button");
assert.equal(tabNode.firstChild.disabled, false, "drilling into an object enables the tab-row button");
tabNode.firstChild.listeners.click();
assert.equal(navigationCalls, 1, "the tab-row button uses Alphaview's existing back action");
navigationBack.setEnabled(false);
syncTabsNavigationButtons(navigationRoot);
assert.equal(tabNode.firstChild.hidden, false, "the button stays in place when back history is exhausted");
assert.equal(tabNode.firstChild.disabled, true, "the button becomes disabled when history is exhausted");
refreshEnabled = false;
syncTabsNavigationButtons(navigationRoot);
assert.equal(tabNode.children[1].disabled, true, "refresh mirrors its action's enabled state");
refreshEnabled = true;
refreshVisible = false;
syncTabsNavigationButtons(navigationRoot);
assert.equal(tabNode.children[1].hidden, true, "refresh mirrors its bar counterpart's visibility");
refreshVisible = true;
navigationBarVisible = true;
navigationBack.setEnabled(true);
syncTabsNavigationButtons(navigationRoot);
assert.equal(tabNode.firstChild.hidden, true, "the tab-row button does not duplicate the visible bar button");
assert.equal(tabNode.children[1].hidden, true, "refresh does not duplicate the visible bar button");
navigationBarVisible = false;
tabNode.children = [];
syncTabsNavigationButtons(navigationRoot);
assert.equal(tabNode.children.length, 2, "both buttons return after data tabs are rebuilt");
assert.equal(tabNode.firstChild.disabled, false, "the rebuilt button follows the existing back action state");
assert.match(source, /revealNavigation\(list\._owner\)/,
	"cell drilldown must use the shared navigation reveal policy");
assert.equal((source.match(/revealNavigation\(this\._owner\)/g) || []).length, 2,
	"selection and column drilldowns must use the same policy");

const disposed = [];
const makeNavigationList = name => {
	const data = { destroy() { disposed.push(name + " source"); } };
	return {
		name,
		visible: name === "current",
		getIndex() { return 3; },
		setIndex(index) { this.index = index; },
		setName(value) { this.name = value; },
		setVisible(value) { this.visible = value; },
		setEnabled(value) { this.enabled = value; },
		getSource() { return data; },
		nodeNeeded() { return { scrollLeft: 0, scrollTop: 0 }; },
		clearTimeout(name) { this.clearedTimeout = name; },
		destroy() { disposed.push(name + " list"); }
	};
};
const originalList = makeNavigationList("original");
const middleList = makeNavigationList("middle");
const currentList = makeNavigationList("current");
const drillHistory = [{ list: originalList }, { list: middleList }];
const displayed = { rows: [], setArray(rows) { this.rows = rows; }, getSize() { return this.rows.length; } };
let movedBarTo;
let filterClears = 0;
let canGoBack = true;
const tabNavigationRoot = {
	active: currentList,
	vars(name, value) {
		if(Array.isArray(name)) return name[0] === "history" ? drillHistory : "table";
		if(name === "navigation.activeList") {
			if(arguments.length > 1) this.active = value;
			return this.active;
		}
		if(name === "navigation.nextListId") return 2;
	},
	ud(name) { return name === "#array" ? displayed : this.active; }
};
const resetNavigationForTabChange = new Function(
	"js", "getActiveList", "moveNavigationBar", "clearFilter", "syncNavigationButtons",
	extractHelper("resetNavigationForTabChange") + "\nreturn resetNavigationForTabChange;"
)(
	{ sf: (format, value) => format.replace("%d", value) },
	root => root.active,
	(root, list) => { movedBarTo = list; },
	() => { filterClears++; },
	(root, enabled) => { canGoBack = enabled; }
);
const tabsStart = source.lastIndexOf('["Tabs", ("tabs"), {');
const tabsEnd = source.lastIndexOf("\n]];");
assert(tabsStart !== -1 && tabsEnd > tabsStart, "the data tabs handler must be available");
const tabHandler = new Function(
	"resetNavigationForTabChange", "getActiveList", "updateList", "renderAlphaviewStatus", "LOGGING",
	"return " + source.slice(tabsStart, tabsEnd) + ";"
)(resetNavigationForTabChange, root => root.active, () => {}, () => {}, false)[2].onChange;
const tabsControl = {
	_owner: tabNavigationRoot,
	scope() { return { list: tabNavigationRoot.active }; },
	ud(name) { return tabNavigationRoot.ud(name); },
	vars() { return "table"; },
	setTimeout(name, callback) { callback(); }
};
const oldTab = { vars(name, value) { if(name === "scrollInfo") this.scrollInfo = value; } };
const nextRows = [{ id: 1 }, { id: 2 }];
const nextTab = { vars(name) { return name === "array" ? nextRows : "next"; } };
tabHandler.call(tabsControl, nextTab, null, { updateList: false });
assert.equal(tabNavigationRoot.active, currentList,
	"refreshing the selected tab does not discard an active drilldown");
assert.equal(drillHistory.length, 2, "tab reflection retains navigation history");
tabHandler.call(tabsControl, nextTab, oldTab);
assert.equal(currentList.clearedTimeout, "alt-cell-click", "switching tabs cancels a pending Alt-click");
assert.equal(tabNavigationRoot.active, originalList, "tab switching restores the original list");
assert.deepEqual(drillHistory, [], "tab switching discards the previous drill history");
assert.deepEqual(displayed.rows, nextRows, "the selected tab loads its own top-level rows");
assert.equal(originalList.name, "list", "the restored list regains the active lookup name");
assert.equal(originalList.visible, true, "the restored list is shown");
assert.equal(movedBarTo, originalList, "the navigation bar follows the restored list");
assert.equal(filterClears, 1, "the drill filter is cleared before loading the next tab");
assert.equal(canGoBack, false, "the back action is disabled after switching tabs");
assert.deepEqual(disposed, ["middle list", "middle source", "current list", "current source"],
	"temporary drill lists and their data sources are released");
const finalRows = [{ id: 3 }];
tabHandler.call(tabsControl, { vars: () => finalRows }, nextTab);
assert.deepEqual(displayed.rows, finalRows, "another tab switch loads the next top-level object");
assert.equal(filterClears, 1, "switching without drill history does not reset navigation again");

const createView = (hover, workspace) => {
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
	const tabsNode = {
		children: [],
		get firstChild() { return this.children[0] || null; },
		querySelector(selector) {
			return this.children.find(child => child.className.split(" ").includes(selector.slice(1))) || null;
		},
		insertBefore(child, before) {
			this.children = this.children.filter(item => item !== child);
			this.children.splice(before ? this.children.indexOf(before) : this.children.length, 0, child);
			this.children.forEach((item, index) => { item.nextSibling = this.children[index + 1] || null; });
			child.parentNode = this;
		}
	};
	const tabs = { _controls: [totalTab], nodeNeeded() { return tabsNode; } };
	const back = { isEnabled() { return false; } };
	const refresh = { isEnabled() { return true; } };
	const refreshButton = { getVisible() { return true; } };
	const controls = {
		"#bar": bar,
		"#compact-status": compact,
		"#q": q,
		"#list": list,
		"#status": status
	};
	const root = {
		list,
		vars() { return false; },
		up(selector) {
			if(selector === "Hover<>:root") return hover ? {} : null;
			if(selector === "devtools/Workspace<>:root") return workspace ? {} : null;
			return null;
		},
		qs(selector) {
			return { "#tabs": tabs, "#back": back, "#refresh": refresh,
				"#button-refresh": refreshButton }[selector] || controls[selector];
		},
		ud(selector) { return controls[selector]; }
	};

	return { root, state, tabsNode };
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
assert.equal(hover.tabsNode.children.length, 2,
	"the Hover Alphaview has both navigation buttons without an opt-in");
assert.equal(hover.tabsNode.children[0].hidden, false,
	"the Hover's back button appears when the bar is hidden");
assert.equal(hover.tabsNode.children[1].hidden, false,
	"the Hover's refresh button appears when the bar is hidden");

const workspace = createView(false, true);
initializeFilterBar(workspace.root);
assert.equal(workspace.state.barVisible, true,
	"an Alphaview nested in a devtools Workspace starts with the full bar visible");
assert.equal(workspace.state.compactVisible, false,
	"a Workspace-hosted Alphaview starts with compact status hidden");
assert.equal(workspace.state.totalTabVisible, true,
	"a Workspace-hosted Alphaview starts with its aggregate total tab visible");
assert.equal(workspace.state.filterFocused, true,
	"a Workspace-hosted Alphaview starts with its filter focused");
toggleFilterBar(workspace.root);
assert.equal(workspace.state.barVisible, false,
	"Command-/ toggles the owning Alphaview even when a Workspace hosts it");

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

activeLocale = "nl";
assert.equal(statusHtml(createView(false).root), "4 items",
	"Dutch status also reports the unfiltered row count");
assert.match(statusHtml(statusView.root), /1 \(20%\) geselecteerd \/ 2 \(40%\) gefilterd \/ .*1 kolom verborgen.* \/ 5 in totaal$/,
	"selection, filter, hidden-column and total counts use Dutch text");
statusView.state.columnVisibility[0] = false;
assert.match(statusHtml(statusView.root), /2 kolommen verborgen/,
	"Dutch status uses the plural column label");

console.log("PASS: Alphaview uses focus-aware Command-/ behavior and localized status and selection labels.");
