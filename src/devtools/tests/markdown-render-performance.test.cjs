const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const repo = path.resolve(__dirname, "../../..");
const loadAmd = file => {
	let result;
	vm.runInNewContext(fs.readFileSync(path.join(repo, file), "utf8"), {
		define: factory => result = factory()
	});
	return result;
};
const plain = value => JSON.parse(JSON.stringify(value));
const Scheduler = loadAmd("src/devtools/MarkdownRenderScheduler.js");
const Sections = loadAmd("src/devtools/MarkdownRenderSections.js");

const clock = () => {
	let now = 0, id = 0;
	const timers = new Map();
	return {
		now: () => now,
		setTimeout(callback, delay) {
			const key = ++id;
			timers.set(key, { at: now + delay, callback });
			return key;
		},
		clearTimeout(key) { timers.delete(key); },
		advance(ms) {
			now += ms;
			let ready;
			do {
				ready = [...timers.entries()].filter(([, timer]) => timer.at <= now)
					.sort((a, b) => a[1].at - b[1].at)[0];
				if(ready) {
					timers.delete(ready[0]);
					ready[1].callback();
				}
			} while(ready);
		},
		timers
	};
};

let time = clock(), renders = [];
let scheduler = new Scheduler({
	quietPeriod: 750,
	maxDelay: 2500,
	now: time.now,
	setTimeout: time.setTimeout,
	clearTimeout: time.clearTimeout,
	render: (payload, reason) => renders.push({ at: time.now(), payload, reason })
});
scheduler.dirty("a");
time.advance(500);
scheduler.activity();
time.advance(749);
assert.equal(renders.length, 0, "cursor activity extends the quiet period");
time.advance(1);
assert.deepEqual(renders, [{ at: 1250, payload: "a", reason: "quiet" }]);

time = clock(); renders = [];
scheduler = new Scheduler({
	quietPeriod: 750,
	maxDelay: 2500,
	now: time.now,
	setTimeout: time.setTimeout,
	clearTimeout: time.clearTimeout,
	render: (payload, reason) => renders.push({ at: time.now(), payload, reason })
});
scheduler.dirty("first");
for(let elapsed = 250; elapsed < 2500; elapsed += 250) {
	time.advance(250);
	scheduler.activity();
}
time.advance(250);
assert.deepEqual(renders, [{ at: 2500, payload: "first", reason: "max-delay" }],
	"continuous navigation cannot make the preview indefinitely stale");
scheduler.activity();
assert.equal(renders.length, 1, "activity without dirty content does not schedule a render");

time = clock(); renders = [];
scheduler = new Scheduler({
	quietPeriod: 750,
	maxDelay: 2500,
	now: time.now,
	setTimeout: time.setTimeout,
	clearTimeout: time.clearTimeout,
	render: (payload, reason) => renders.push({ at: time.now(), payload, reason })
});
scheduler.dirty("blurred");
time.advance(100);
assert.equal(scheduler.flush("blur"), true);
assert.deepEqual(renders, [{ at: 100, payload: "blurred", reason: "blur" }],
	"leaving the editor flushes dirty preview content immediately");

const before = "# One\n\nalpha\n\n# Two\n\nbravo\n";
const after = "# One\n\nalpha edited\n\n# Two\n\nbravo\n";
const headings = [
	{ row: 0, level: 1, text: "One", key: "/1:One#1" },
	{ row: 4, level: 1, text: "Two", key: "/1:Two#1" }
];
assert.deepEqual(plain(Sections.plan(before, after, headings, headings)), {
	mode: "section",
	reason: "local-section",
	key: "/1:One#1",
	range: { start: 2, oldEnd: 2, newEnd: 2 }
});
assert.equal(Sections.plan(before, before.replace("# Two", "## Two"), headings, [
	{ row: 0, level: 1, text: "One", key: "/1:One#1" },
	{ row: 4, level: 2, text: "Two", key: "/1:One#1/2:Two#1" }
]).mode, "full", "heading changes force a full render");
assert.equal(Sections.plan(before, before.replace("alpha", "```\nalpha\n```"), headings, headings).mode,
	"full", "fence changes force a full render");
assert.equal(Sections.plan(before + "\n[ref]: one", after + "\n[ref]: one", headings, headings).mode,
	"full", "global reference definitions force a full render");
assert.equal(Sections.plan(before, before.replace("# Two", "prefix\n# Two"), headings, [
	{ row: 0, level: 1, text: "One", key: "/1:One#1" },
	{ row: 5, level: 1, text: "Two", key: "/1:Two#1" }
]).mode, "full", "edits crossing a top-level boundary force a full render");

const sections = 500;
const largeBefore = Array.from({ length: sections }, (_, index) =>
	`# Section ${index}\n\n${"paragraph ".repeat(20)}${index}\n`).join("\n");
const largeAfter = largeBefore.replace("paragraph paragraph paragraph 250", "edited paragraph paragraph 250");
const started = process.hrtime.bigint();
for(let i = 0; i < 250; ++i) Sections.changedRange(largeBefore, largeAfter);
const elapsed = Number(process.hrtime.bigint() - started) / 1e6;
assert.ok(elapsed < 1000, `section invalidation stays lightweight on a representative document (${elapsed.toFixed(1)} ms)`);

const editorSource = fs.readFileSync(path.join(repo, "src/vcl-comps/Editor$/md.js"), "utf8");
const markdownSource = fs.readFileSync(path.join(repo, "src/devtools/cavalion-md.js"), "utf8");
assert.match(editorSource, /Md\.scheduleMarkdownRender\(this, change\)/,
	"content changes enter the interaction-aware scheduler");
assert.match(markdownSource, /selection\.on\("changeCursor", sync_cursor\)/);
assert.match(markdownSource, /selection\.on\("changeSelection", sync_selection\)/);
assert.match(markdownSource, /addEventListener\("compositionupdate", note_interaction\)/);
assert.match(markdownSource, /editor\.on\("blur", flush_on_blur\)/);

console.log(`PASS: interaction-aware scheduling, safe section invalidation and large-document planning (${elapsed.toFixed(1)} ms/250 plans).`);
