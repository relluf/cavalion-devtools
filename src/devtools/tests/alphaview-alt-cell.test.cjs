"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(path.resolve(__dirname, "../../cavalion-blocks/Alphaview.js"), "utf8");
const extractHelper = name => {
	const start = source.indexOf("const " + name + " = function(");
	const end = source.indexOf("\n};", start);
	assert(start !== -1 && end > start, "Alphaview must define " + name);
	return source.slice(start, end + 4);
};
const getAlphaviewCellValue = new Function(
	extractHelper("getAlphaviewCellValue") + "\nreturn getAlphaviewCellValue;"
)();

const dispatchStart = source.indexOf("onDispatchChildEvent(component, name, evt, f, ms) {");
const doubleClickStart = source.indexOf("\n\t\t\tonDblClick(evt)", dispatchStart);
const scrollStart = source.indexOf("\n\t\tonScroll()", doubleClickStart);
assert(dispatchStart !== -1 && doubleClickStart > dispatchStart && scrollStart > doubleClickStart,
	"Alphaview list click handlers must be available");
const listCellContext = (list, evt) => evt.target && evt.target.cell ? {
	column: { _attribute: "object" }, row: { _rowIndex: 4 }
} : null;
const navigation = [];
const inspected = [];
const context = {
	listCellContext,
	getActiveList: root => root.list,
	activateAlphaviewCell(list, evt, attributeOnly) { navigation.push({ list, evt, attributeOnly }); },
	getAlphaviewCellValue,
	updateAltCellHover() {},
	H: { i(value) { inspected.push(value); } },
	window: { getSelection() { return { removeAllRanges() {} }; } },
	ListColumn: class ListColumn {},
	LOGGING: false
};
const handler = property => new Function(
	...Object.keys(context),
	"return ({" + property.trim().replace(/,$/, "") + "});"
)(...Object.values(context));
const dispatch = handler(source.slice(dispatchStart, doubleClickStart)).onDispatchChildEvent;
const doubleClick = handler(source.slice(doubleClickStart, scrollStart)).onDblClick;
const timers = new Map();
const object = { id: 7 };
let cellValue = { key: "object", value: object };
let attribute;
const list = {
	_owner: null,
	_source: { getAttributeValue(name, row, raw) {
		attribute = { name, row, raw };
		return cellValue;
	} },
	clearTimeout(name) { timers.delete(name); },
	setTimeout(name, callback, delay) {
		assert.equal(delay, 750, "the single click waits for a possible double click");
		timers.set(name, callback);
	}
};
list._owner = { list };
const event = (detail, altKey = true) => ({
	detail, altKey, target: { cell: true },
	preventDefault() {}, stopPropagation() {}
});
const flushTimers = () => {
	const pending = [...timers.values()];
	timers.clear();
	pending.forEach(callback => callback());
};

dispatch.call(list, null, "click", event(1));
assert.equal(navigation.length, 0, "the first Alt-click must not navigate immediately");
assert.equal(timers.has("alt-cell-click"), true, "the first Alt-click is pending");
dispatch.call(list, null, "click", event(2));
assert.equal(timers.has("alt-cell-click"), false, "the second Alt-click cancels navigation");
doubleClick.call(list, event(2));
flushTimers();
assert.deepEqual(navigation, [], "Alt-double-click never drills into the object");
assert.deepEqual(inspected, [object], "Alt-double-click inspects the displayed object once");
assert.deepEqual(attribute, { name: "object", row: 4, raw: true },
	"inspection uses the same raw cell value as Alt-click navigation");

dispatch.call(list, null, "click", event(1));
flushTimers();
assert.equal(navigation.length, 1, "a lone Alt-click still navigates after the wait");
assert.equal(navigation[0].attributeOnly, true, "Alt-click keeps cell-specific navigation");

cellValue = 42;
doubleClick.call(list, event(2));
assert.deepEqual(inspected, [object], "Alt-double-click ignores scalar cells");
doubleClick.call(list, event(2, false));
assert.equal(navigation.length, 2, "ordinary double-click keeps its navigation behavior");
assert.equal(navigation[1].attributeOnly, false, "ordinary double-click opens the row object");

console.log("PASS: Alphaview distinguishes Alt-click navigation from Alt-double-click inspection.");
