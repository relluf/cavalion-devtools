"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const baseSource = fs.readFileSync(path.resolve(__dirname, "../../cavalion-blocks/Alphaview.js"), "utf8");
const csvSource = fs.readFileSync(path.resolve(__dirname, "../../cavalion-blocks/Alphaview.csv.js"), "utf8");
const jsonSource = fs.readFileSync(path.resolve(__dirname, "../../cavalion-blocks/Alphaview.json.js"), "utf8");
const combinedSource = fs.readFileSync(path.resolve(__dirname, "../../cavalion-blocks/Alphaview.csv.json.js"), "utf8");
const baseStart = baseSource.indexOf('["Container", ("")');
const baseEnd = baseSource.lastIndexOf("\n]];");
assert(baseStart !== -1 && baseEnd > baseStart, "the shared Alphaview component must be available");

const locale = key => ({ ".exportAs": "Export as..." })[key] || key;
const base = new Function("css", "locale", "getActiveList",
	"return " + baseSource.slice(baseStart, baseEnd + 3) + ";")({}, locale, () => ({ name: "list" }));
let downloaded;
const csv = new Function("js", "window", "O", "return " + csvSource.trim().replace(/;$/, "") + ";")(
	{ nameOf: String, sf: (format, value) => format.replace("%s", value) },
	{ O() {} },
	(uri, payload) => { downloaded = { uri, payload }; }
);
let jsonDownloaded;
const json = new Function("js", "window", "return " + jsonSource.trim().replace(/;$/, "") + ";")(
	{ sf: (format, value) => format.replace("%s", value) },
	{ O(uri, payload) { jsonDownloaded = { uri, payload }; } }
);
const combined = new Function("return " + combinedSource.trim().replace(/;$/, "") + ";")();
const children = base[3];
const find = (items, name) => items.find(item => Array.isArray(item) && item[1] === name);
const exportAction = find(children, "export-as");
const exportPopup = find(children, "popup-export");
const bar = find(children, "bar");
const exportGroup = find(find(bar[3], "right")[2], "export");
const exportButton = find(exportGroup[2], "button-export");

assert.equal(exportAction[2].hotkey, "Shift+MetaCtrl+Alt+S",
	"Shift+Option+Cmd+S opens the shared export menu");
assert.equal(exportAction[2].enabled, false, "an unspecialized Alphaview cannot open an empty export menu");
assert.equal(exportButton[0], "vcl/ui/PopupButton", "the menu button uses the available VCL popup class");
assert.equal(exportButton[2].visible, false, "the menu button stays hidden without choices");
assert.equal(exportButton[2].popup, "popup-export", "the bar button uses the shared popup");
assert.equal(exportPopup[0], "vcl/ui/Popup", "the shared menu uses the available VCL popup class");
assert.equal(exportPopup[3].length, 1, "the shared popup initially contains only its heading");

const csvChildren = csv[2];
const jsonChildren = json[2];
const findPatch = (items, name) => items.find(item => item[0] === "#" + name);
assert.equal(findPatch(csvChildren, "export-as")[1].enabled, true,
	"the CSV specialization enables the shared shortcut");
assert.equal(findPatch(csvChildren, "button-export")[1].visible, true,
	"the CSV specialization reveals the populated menu");
const csvChoice = find(findPatch(csvChildren, "popup-export")[1], "button-csv");
assert.equal(csvChoice[2].action, "csv", "the popup's CSV choice uses the existing CSV action");
assert.equal(csvChildren.some(item => item[0] === "#export"), false,
	"the CSV specialization does not retain a second bar export path");
assert.equal(find(csvChildren, "json"), undefined, "the CSV module does not define JSON export");
assert.equal(find(findPatch(csvChildren, "popup-export")[1], "button-json"), undefined,
	"the CSV menu does not define a JSON choice");
assert.equal(find(jsonChildren, "csv"), undefined, "the JSON module does not define CSV export");
assert.equal(findPatch(jsonChildren, "export-as")[1].enabled, true,
	"the JSON specialization enables the shared shortcut on its own");
assert.equal(findPatch(jsonChildren, "button-export")[1].visible, true,
	"the JSON specialization reveals the populated menu on its own");
const jsonChoice = find(findPatch(jsonChildren, "popup-export")[1], "button-json");
assert.equal(jsonChoice[2].action, "json", "the JSON choice uses its own export action");
assert.deepEqual(combined[0], ["devtools/Alphaview.csv", "devtools/Alphaview.json"],
	"the combined Alphaview explicitly registers both independent specializations");
const specializations = {
	"devtools/Alphaview.csv": csvChildren,
	"devtools/Alphaview.json": jsonChildren
};
const composedMenu = exportPopup[3].concat(combined[0].flatMap(uri =>
	findPatch(specializations[uri], "popup-export")[1]));
assert.equal(composedMenu.filter(item => item[1] && item[1].classes === "header").length, 1,
	"the combined menu retains one shared heading");
assert.deepEqual(composedMenu.filter(item => item[2] && item[2].action).map(item => item[2].action),
	["csv", "json"], "the combined menu exposes one choice per format");

let popupCall;
let barVisible = false;
const popup = { popup(...args) { popupCall = args; } };
const root = {
	ud() { return { isVisible() { return barVisible; } }; },
	qs(name) {
		return {
			"#button-export": { name: "button" },
			"#tabs": { name: "tabs", isVisible() { return true; } },
			"#popup-export": popup
		}[name];
	}
};
const action = { _owner: root };
exportAction[2].on.call(action);
assert.equal(popupCall[1].name, "tabs", "the shortcut anchors to visible tabs when the bar is hidden");
barVisible = true;
exportAction[2].on.call(action);
assert.equal(popupCall[1].name, "button", "the shortcut anchors to the menu button when the bar is visible");

const list = {
	_columns: ["a", "b"].map((attribute, index) => ({ _attribute: attribute, getIndex() { return index; } })),
	getSelection() { return []; }
};
const q = { getValue() { return ""; }, getPlaceholder() { return "data"; } };
const tabs = { getSelectedControl() { return { vars() { return "data"; } }; } };
const csvAction = find(csvChildren, "csv")[2];
csvAction.on.call({
	vars() { return { sel: [{ a: "one", b: "two, three" }] }; },
	ud(name) { return { "#list": list, "#q": q, "#tabs": tabs }[name]; }
});
assert.equal(downloaded.uri, "/data.csv", "the CSV choice retains the existing filename behavior");
assert.equal(downloaded.payload.text, 'a,b\none,"two, three"',
	"the CSV choice retains CSV escaping and selected-row export");

const jsonRows = [{ a: "one", nested: { value: 2 } }];
const jsonAction = find(jsonChildren, "json")[2];
let editorRequest;
let loaded;
let editorContent;
const editorTab = {
	once(event, callback) {
		assert.equal(event, "resource-loaded");
		loaded = callback;
	},
	down(selector) {
		assert.equal(selector, "#ace");
		return { setValue(value) { editorContent = value; } };
	}
};
const workspace = {
	qs(selector) {
		assert.equal(selector, "#editor-needed");
		return {
			execute(request) {
				editorRequest = request;
				return editorTab;
			}
		};
	}
};
jsonAction.on.call({ vars() { return { sel: jsonRows, ws: workspace }; } });
assert.match(editorRequest.resource.uri, /^Resource-\d+\.json$/,
	"JSON export creates a JSON editor resource");
assert.equal(editorRequest.selected, true, "the editor resource is selected");
assert.equal(editorContent, undefined, "JSON waits until the editor resource is loaded");
loaded();
assert.equal(editorContent, JSON.stringify(jsonRows, null, 2),
	"JSON export writes the selected data to the editor");

jsonAction.on.call({
	vars() { return { sel: jsonRows }; },
	ud(name) {
		return {
			"#q": { getValue() { return ""; }, getPlaceholder() { return "fallback"; } },
			"#tabs": { getSelectedControl() { return { vars() { return "records"; } }; } }
		}[name];
	}
});
assert.equal(jsonDownloaded.uri, "/records.json", "JSON download retains the selected-tab filename");
assert.equal(jsonDownloaded.payload.text, JSON.stringify(jsonRows, null, 2),
	"JSON download contains pretty-printed selected data");

console.log("PASS: CSV and JSON specializations compose and export through editor and download paths.");
