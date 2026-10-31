"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const source = fs.readFileSync(path.resolve(__dirname, "../../cavalion-blocks/Alphaview.js"), "utf8");
const start = source.indexOf("onDispatchChildEvent: function (component, name, evt, f, args)");
const end = source.indexOf("\n    },\n\tonLoad()", start);
const property = source.slice(start, end + "\n    }".length);
const handler = new Function("Event", "getActiveList", "return ({" + property + "}).onDispatchChildEvent;")(
	{ eventModifiersMatch() { return true; } },
	root => root.list
);

let value = "filter";
let changes = 0;
let destroys = 0;
const q = {
	getValue() { return value; },
	setValue(next) { value = next; },
	fire(name) { if(name === "onChange") changes++; }
};
const list = {
	getSelection() { return []; },
	getCount() { return 0; },
	isVisible() { return false; }
};
const root = {
	list,
	scope() { return { q }; },
	qs() { return { go() {} }; },
	inherited() { return "inherited"; },
	setTimeout(name) { if(name === "destroy") destroys++; },
	destroy() { destroys++; }
};
const escape = { keyCode: 27, code: "Escape", altKey: false, preventDefault() {} };

assert.equal(handler.call(root, q, "keydown", escape), "inherited");
assert.equal(handler.call(root, q, "keyup", escape), "inherited");
assert.equal(value, "", "Escape should still clear the active Alphaview filter");
assert.equal(changes, 1, "one physical Escape press should refresh the filter only on keydown");
assert.equal(destroys, 0,
	"one Escape key cycle must never schedule destruction of an embedded Alphaview");
assert.doesNotMatch(property, /last_27|setTimeout\("destroy"|\.destroy\(/,
	"Alphaview keyboard handling must not contain a hidden double-Escape destroy path");

console.log("Alphaview Escape lifecycle test passed");
