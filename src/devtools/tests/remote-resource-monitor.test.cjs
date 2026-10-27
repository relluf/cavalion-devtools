const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const repo = path.resolve(__dirname, "../../..");
const source = fs.readFileSync(path.join(repo, "src/devtools/RemoteResourceMonitor.js"), "utf8");
let RemoteResourceMonitor;
vm.runInNewContext(source, {
	console,
	Promise,
	define(factory) { RemoteResourceMonitor = factory(() => {}); }
});

const tick = () => new Promise(resolve => setImmediate(resolve));
const setup = options => {
	let nextTimer = 1;
	const timers = new Map();
	const state = Object.assign({ revision: "revision:1", dirty: false }, options);
	const calls = { revisions: 0, confirms: [], reloads: [], errors: [] };
	const monitor = new RemoteResourceMonitor({
		interval: 5000,
		setTimeout(callback, ms) {
			const id = nextTimer++;
			timers.set(id, { callback, ms });
			return id;
		},
		clearTimeout(id) { timers.delete(id); },
		getRevision() {
			++calls.revisions;
			return state.request ? state.request() : state.revision;
		},
		isDirty: () => state.dirty,
		confirm(dirty, revision) {
			calls.confirms.push({ dirty, revision });
			return state.confirm !== false;
		},
		reload(revision) { calls.reloads.push(revision); },
		onError(error) { calls.errors.push(error); }
	});
	return {
		monitor,
		state,
		calls,
		timers,
		async fireTimer() {
			const entry = timers.entries().next().value;
			assert.ok(entry, "expected a scheduled poll");
			timers.delete(entry[0]);
			entry[1].callback();
			await tick();
		}
	};
};

(async () => {
	let s = setup();
	s.monitor.remember("revision:1");
	await s.monitor.start();
	assert.equal(s.calls.revisions, 1, "activation checks immediately");
	assert.equal(s.calls.confirms.length, 0, "an unchanged revision is silent");
	assert.equal([...s.timers.values()][0].ms, 5000, "active polling uses five seconds");

	s.state.revision = "revision:2";
	await s.fireTimer();
	assert.equal(s.calls.confirms.length, 1, "a changed revision asks once");
	assert.deepEqual(s.calls.reloads, ["revision:2"], "confirmation reloads the detected server revision");
	await s.fireTimer();
	assert.equal(s.calls.confirms.length, 1, "the reloaded revision is remembered");

	s = setup({ confirm: false });
	s.monitor.remember("revision:1");
	await s.monitor.start();
	s.state.revision = "revision:2";
	await s.fireTimer();
	await s.fireTimer();
	assert.equal(s.calls.confirms.length, 1, "a rejected revision is not shown repeatedly");
	s.state.revision = "revision:3";
	await s.fireTimer();
	assert.equal(s.calls.confirms.length, 2, "a newer server revision asks again");

	s = setup({ dirty: true });
	s.monitor.remember("revision:1");
	await s.monitor.start();
	s.state.revision = "revision:2";
	await s.fireTimer();
	assert.equal(s.calls.confirms[0].dirty, true, "the dialog receives local dirty state");

	s = setup();
	await s.monitor.start();
	assert.equal(s.timers.size, 1, "activation schedules polling");
	s.monitor.stop();
	assert.equal(s.timers.size, 0, "deactivation clears polling");
	s.monitor.destroy();
	await s.monitor.start();
	assert.equal(s.timers.size, 0, "destroyed monitors cannot restart");

	s = setup({ revision: "revision:2" });
	s.monitor.remember("revision:1");
	await s.monitor.refreshRevision();
	await s.monitor.start();
	assert.equal(s.calls.confirms.length, 0, "a successful save can refresh the baseline while inactive");

	let resolveRequest;
	s = setup({ request: () => new Promise(resolve => { resolveRequest = resolve; }) });
	const first = s.monitor.start();
	await tick();
	const second = s.monitor.check();
	assert.equal(s.calls.revisions, 1, "concurrent checks share one request");
	resolveRequest("revision:1");
	await Promise.all([first, second]);
	assert.equal(s.timers.size, 1, "deduplicated activation leaves one timer");

	const offline = new Error("offline");
	s = setup({ request: () => Promise.reject(offline) });
	await s.monitor.start();
	await s.fireTimer();
	await s.fireTimer();
	assert.equal(s.calls.errors.length, 1, "the same polling failure is logged only once");

	console.log("remote resource monitor tests passed");
})().catch(error => {
	console.error(error);
	process.exitCode = 1;
});
