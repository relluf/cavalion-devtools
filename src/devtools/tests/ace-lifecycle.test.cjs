const fs = require('fs'), vm = require('vm'), assert = require('node:assert/strict');
const {EventEmitter} = require('events');
const path = require('path');
const repo = path.resolve(__dirname, '../../..');
// Run against this checkout and its sibling cavalion-vcl dependency.
const read = file => fs.readFileSync(path.resolve(repo, file), 'utf8');
const editorSource = read('src/vcl-comps/Editor.js');
const start = editorSource.indexOf('    ["vcl/ui/Ace", ("ace"), {');
const load = editorSource.slice(editorSource.indexOf('onLoad() {', start), editorSource.indexOf('\n\toverrides:', start));
const onLoad = vm.runInNewContext('({' + load + '}).onLoad', {require});
function setup() {
 const root = new EventEmitter(), tab = new EventEmitter(), ace = new EventEmitter();
 const selection = new EventEmitter(), session = new EventEmitter();
 const eventOnce = tab.once.bind(tab), eventOff = tab.off.bind(tab);
 tab.once = (event, callback) => {eventOnce(event, callback); return {event, callback};};
 tab.off = handle => eventOff(handle.event, handle.callback);
 let reads = 0, writes = [], callback, destroyed = false;
 Object.assign(selection, {getCursor: () => ({row: 3, column: 2}), toJSON: () => ({})});
 Object.assign(session, {getOptions: () => ({}), getAllFolds: () => {++reads; return [];}, getScrollTop: () => 20, getScrollLeft: () => 0});
 const editor = {selection, session, getFontSize: () => '12px'};
 Object.assign(root, {vars: () => ({}), readStorage: (_, cb) => callback = cb, writeStorage: (_, value) => writes.push(value)});
 const timers = new Map();
 Object.assign(ace, {_editor: editor, up: selector => selector ? tab : root, vars: () => {}, getEditor: () => {assert.equal(destroyed, false); return editor;}, setTimeout: (key, cb) => timers.set(key, cb), clearTimeout: key => timers.delete(key)});
 onLoad.call(ace);
 return {root, tab, ace, selection, session, timers, callback: () => callback, ready: () => {tab.emit('resource-loaded');callback();}, reads: () => reads, writes, dispose: () => {ace.emit('destroy'); destroyed = true; ace._editor = null;}};
}
let s = setup(); s.ready();
for(let i = 0; i < 100; i++) {s.selection.emit('changeCursor');s.selection.emit('changeSelection');}
assert.equal(s.reads(), 0); assert.equal(s.timers.size, 1); assert.equal(s.writes.length, 0);
s.timers.get('write-ace-state')(); assert.equal(s.reads(), 1); assert.equal(s.writes.length, 1);
s.session.emit('changeScrollTop'); s.root.emit('hide'); assert.equal(s.writes.length, 2); assert.equal(s.timers.size, 0);
s.selection.emit('changeCursor'); s.dispose(); assert.equal(s.writes.length, 3);
assert.equal(s.selection.listenerCount('changeCursor'), 0); assert.equal(s.session.listenerCount('changeFold'), 0); assert.equal(s.root.listenerCount('hide'), 0);
s = setup(); s.tab.emit('resource-loaded'); s.dispose(); s.callback()(); assert.equal(s.selection.listenerCount('changeCursor'), 0);
s = setup(); s.dispose(); s.tab.emit('resource-loaded'); assert.equal(s.callback(), undefined);
let definition;
vm.runInNewContext(read('../cavalion-vcl/src/ui/Ace.js'), {
 define: (_, factory) => definition = factory(()=>{}, (_, definition) => definition, {config:{set(){}}}, {}, {}, {}, {}),
 window: {require:{toUrl: () => 'ace'}},
});
const proto = definition.prototype;
let order = [], control = {_editor:{destroy(){order.push('ace');}}, inherited(){order.push('vcl');}};
proto.destroy.call(control); assert.deepEqual(order, ['vcl','ace']); assert.equal(control._editor, null);
proto.destroy.call(control); assert.equal(order.length, 2);
control = {_editor:{destroy(){order.push('finally');}}, inherited(){throw Error('cleanup');}};
assert.throws(() => proto.destroy.call(control)); assert.equal(order.at(-1), 'finally');
const container = {}, placeholder = {}; let attached, resized;
control = {_editor:{container,resize(force){resized=force;}}, _node:{firstChild:placeholder, replaceChild(a,b){attached=[a,b];}}, inherited(){return 'ok';}};
assert.equal(proto.onnodecreated.call(control), 'ok'); assert.deepEqual(attached,[container,placeholder]);assert.equal(resized,true);
console.log('PASS: 200 cursor events coalesce; scroll/hide/close flush; listeners removed; late loads ignored; destruction is idempotent and runs on errors; node recreation retains editor.');
