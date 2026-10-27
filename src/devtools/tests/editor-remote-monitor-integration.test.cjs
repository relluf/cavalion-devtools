const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const repo = path.resolve(__dirname, "../../..");
const editorSource = fs.readFileSync(path.join(repo, "src/vcl-comps/Editor.js"), "utf8");
const markdownSource = fs.readFileSync(path.join(repo, "src/vcl-comps/Editor$/md.js"), "utf8");
const nodeResourcesSource = fs.readFileSync(path.join(repo, "src/devtools/Resources-node.js"), "utf8");
const start = editorSource.indexOf("var installRemoteResourceMonitor = ");
const end = editorSource.indexOf("\nvar stateStorageResource", start);
assert.notEqual(start, -1, "monitor installer exists");
assert.notEqual(end, -1, "monitor installer has a stable boundary");

const calls = { starts: 0, stops: 0, destroys: 0, remembered: [] };
let lastOptions;
function RemoteResourceMonitor(options) {
	lastOptions = options;
	this.start = () => { ++calls.starts; };
	this.stop = () => { ++calls.stops; };
	this.destroy = () => { ++calls.destroys; };
	this.remember = revision => calls.remembered.push(revision);
	this.getRevision = () => "revision:1";
}
const PreviousVersion = {
	capture() { return {}; },
	remember() {},
	clear() { calls.cleared = true; }
};
const Resources = {
	getRevision() { return Promise.resolve("revision:1"); },
	revisionOf(resource) { return resource && resource.revision ? "revision:" + resource.revision : undefined; }
};
const EditorPosition = { READY_VAR: "editor-position-ready" };
const eventTarget = initial => {
	const listeners = {};
	return Object.assign(initial || {}, {
		addEventListener(name, listener) { (listeners[name] || (listeners[name] = [])).push(listener); },
		removeEventListener(name, listener) {
			listeners[name] = (listeners[name] || []).filter(item => item !== listener);
		},
		dispatch(name) { (listeners[name] || []).slice().forEach(listener => listener()); },
		listenerCount(name) { return (listeners[name] || []).length; }
	});
};
const browserWindow = eventTarget();
let browserFocused = true;
const browserDocument = eventTarget({
	visibilityState: "visible",
	hasFocus: () => browserFocused
});
const installSource = editorSource.slice(
	start + "var installRemoteResourceMonitor = ".length, end
).replace(/;\s*$/, "");
const install = vm.runInNewContext("(" + installSource + ")", {
	RemoteResourceMonitor,
	PreviousVersion,
	Resources,
	EditorPosition,
	Promise,
	Date,
	String: Object.assign(String, { format: value => value }),
	window: browserWindow,
	document: browserDocument,
	console
});

const root = new EventEmitter();
const tab = new EventEmitter();
const ace = new EventEmitter();
const vars = {};
const rootVars = {};
let showing = false, selected = false;
root.isShowing = () => showing;
root.vars = function(key, value) {
	if(arguments.length === 2) return rootVars[key] = value;
	if(Array.isArray(key)) return key[0].split(".").reduce((value, part) => value && value[part], rootVars);
	return rootVars[key];
};
root.removeVar = key => delete rootVars[key];
tab.isSelected = () => selected;
tab.getVar = () => false;
tab.vars = key => key[0] === EditorPosition.READY_VAR ? true : { uri: "fixture.txt" };
tab.app = () => ({ confirm() {} });
ace.vars = function(key, value) {
	return arguments.length === 2 ? (vars[key] = value) : vars[key];
};
ace.getValue = () => "fixture";
ace.scope = () => ({ refresh: { execute() {} } });

const monitor = install(root, ace, tab);
assert.ok(monitor, "the form installs a monitor without invoking Ace.onLoad");
assert.equal(calls.starts, 0, "loading an inactive editor does not start polling");
showing = selected = true;
root.vars(["remoteResourceMonitorLifecycle.activate"])();
assert.equal(calls.starts, 1, "a later form activation checks immediately");
tab.emit("resource-loaded", { revision: "2" });
assert.deepEqual(calls.remembered, ["revision:2"], "resource load establishes the baseline");
root.emit("hide");
assert.equal(calls.stops, 1, "hiding the editor stops polling");
root.emit("show");
assert.equal(calls.starts, 3, "showing checks immediately after the resource-loaded activation");
browserFocused = false;
browserWindow.dispatch("blur");
assert.equal(calls.stops, 2, "moving the browser window to the background pauses polling");
assert.equal(lastOptions.getRevision(), undefined,
	"a background timer cannot perform a revision request even if blur delivery is delayed");
browserFocused = true;
browserWindow.dispatch("focus");
browserDocument.dispatch("visibilitychange");
assert.equal(calls.starts, 4,
	"window focus checks immediately and the accompanying visibility event is coalesced");
ace.emit("destroy");
assert.equal(calls.destroys, 1, "destroy tears down the monitor");
assert.equal(calls.cleared, true, "destroy clears the previous-version snapshot");
assert.equal(browserWindow.listenerCount("focus"), 0, "destroy removes the window focus listener");
assert.equal(browserWindow.listenerCount("blur"), 0, "destroy removes the window blur listener");
assert.equal(browserDocument.listenerCount("visibilitychange"), 0,
	"destroy removes the document visibility listener");

const formLoad = editorSource.slice(
	editorSource.indexOf('[["ui/Form"], {'),
	editorSource.indexOf('/*- refactor this somehow', editorSource.indexOf('[["ui/Form"], {'))
);
assert.match(formLoad, /installRemoteResourceMonitor\(this, scope\.ace, tab\)/,
	"installation belongs to the editor form lifecycle");
assert.match(editorSource, /onActivate\(\)[\s\S]*?remoteResourceMonitorLifecycle\.activate/,
	"form activation starts the installed monitor");
assert.match(editorSource, /onDeactivate\(\)[\s\S]*?remoteResourceMonitorLifecycle\.deactivate/,
	"form deactivation stops the installed monitor");
assert.match(markdownSource, /\["#ace",\s*\{[\s\S]*?onLoad\(\)\s*\{/,
	"the regression covers a specializer that overrides Ace.onLoad");
assert.match(nodeResourcesSource, /this\.list\([^\n]+\{ cache: "no-store" \}\)/,
	"filesystem revision polling bypasses the HTTP cache");

assert.equal(typeof lastOptions.getRevision, "function");
console.log("editor remote-monitor integration tests passed");
