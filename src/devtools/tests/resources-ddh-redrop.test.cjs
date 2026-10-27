const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const repo = path.resolve(__dirname, "../../..");
const source = fs.readFileSync(path.join(repo, "src/devtools/Resources-ddh.js"), "utf8");

class FileReader {
	readAsArrayBuffer(file) {
		const bytes = new TextEncoder().encode(file.content);
		this.result = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
		if(this.onload) this.onload({ target: this });
	}
}

const loadResourcesDdh = () => {
	let ResourcesDdh;
	vm.runInNewContext(source, {
		Blob,
		Date,
		FileReader,
		Promise,
		TextDecoder,
		TextEncoder,
		console,
		define(factory) { ResourcesDdh = factory(() => {}); }
	});
	return ResourcesDdh;
};

const file = (name, content, relativePath) => ({
	name,
	content,
	size: content.length,
	lastModified: content === "v1" ? 1 : 2,
	webkitRelativePath: relativePath || ""
});
const fileEntry = value => ({
	name: value.name,
	isFile: true,
	file(resolve) { resolve(value); }
});
const directoryEntry = (name, entries) => ({
	name,
	isFile: false,
	createReader() {
		let read = false;
		return {
			readEntries(resolve) {
				const batch = read ? [] : entries;
				read = true;
				resolve(batch);
			}
		};
	}
});
const dropEvent = entries => ({
	preventDefault() {},
	dataTransfer: {
		items: entries.map(entry => ({ webkitGetAsEntry: () => entry }))
	}
});
const providerPath = resource => resource.uri.replace(/^dropped:\/\//, "");

async function testDirectoryRedrop() {
	const resources = loadResourcesDdh();
	const first = await resources.handle_document_drop(dropEvent([
		directoryEntry("scenario", [
			fileEntry(file("script.js", "v1")),
			fileEntry(file("removed.js", "old"))
		])
	]));
	const second = await resources.handle_document_drop(dropEvent([
		directoryEntry("scenario", [fileEntry(file("script.js", "v2"))])
	]));

	assert.equal(first[0].name, "scenario");
	assert.equal(second[0].name, "scenario (2)");
	assert.equal(first[0].sourceName, "scenario");
	assert.equal(second[0].sourceName, "scenario");
	assert.equal(first[0].dropVersion, 1);
	assert.equal(second[0].dropVersion, 2);
	assert.notEqual(first[0].dropId, second[0].dropId);
	assert.notEqual(first[0].revision, second[0].revision);
	assert.equal(first[0].uri, "dropped://scenario");
	assert.equal(second[0].uri, "dropped://scenario (2)");

	const firstFiles = await resources.list(providerPath(first[0]));
	const secondFiles = await resources.list(providerPath(second[0]));
	assert.deepEqual(Array.from(firstFiles, item => item.sourceName).sort(), ["removed.js", "script.js"]);
	assert.deepEqual(Array.from(secondFiles, item => item.sourceName), ["script.js"]);
	assert.equal(secondFiles[0].sourcePath, "scenario/script.js");
	assert.equal((await resources.get(providerPath(first[0]) + "/script.js")).text, "v1");
	assert.equal((await resources.get(providerPath(second[0]) + "/script.js")).text, "v2");

	const root = await resources.list("");
	assert.deepEqual(Array.from(root, item => item.name), ["scenario", "scenario (2)"]);

	const firstFile = await resources.handle_document_drop(dropEvent([fileEntry(file("test.js", "v1"))]));
	const secondFile = await resources.handle_document_drop(dropEvent([fileEntry(file("test.js", "v2"))]));
	assert.equal(firstFile[0].uri, "dropped://test.js");
	assert.equal(secondFile[0].name, "test (2).js");
	assert.equal(secondFile[0].uri, "dropped://test (2).js");
	assert.equal((await resources.get(providerPath(firstFile[0]))).text, "v1");
	assert.equal((await resources.get(providerPath(secondFile[0]))).text, "v2");
}

async function testFilePickerRedrop() {
	const resources = loadResourcesDdh();
	const first = await resources.handle_input_change({ target: { files: [
		file("script.js", "v1", "scenario/script.js"),
		file("removed.js", "old", "scenario/removed.js")
	] } });
	const second = await resources.handle_input_change({ target: { files: [
		file("script.js", "v2", "scenario/script.js")
	] } });

	assert.equal(first.length, 1, "a selected folder is exposed as one top-level resource");
	assert.equal(second[0].name, "scenario (2)");
	assert.equal(first[0].uri, "dropped://scenario");
	assert.equal(second[0].uri, "dropped://scenario (2)");
	assert.equal((await resources.get(providerPath(first[0]) + "/script.js")).text, "v1");
	assert.equal((await resources.get(providerPath(second[0]) + "/script.js")).text, "v2");
	assert.deepEqual(Array.from(await resources.list(providerPath(second[0])), item => item.sourceName), ["script.js"]);
}

Promise.resolve()
	.then(testDirectoryRedrop)
	.then(testFilePickerRedrop)
	.then(() => console.log("Resources-ddh isolated redrop tests passed"))
	.catch(error => {
		console.error(error);
		process.exitCode = 1;
	});
