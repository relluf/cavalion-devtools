"use strict";
const assert = require("assert");
const fs = require("fs");
const vm = require("vm");
const path = require("path");
let provider;
const calls = [];
const name = "dir/rapport # & é.csv";
const id = "nl.veldoffice/Bedrijf/1/kwartaal ?#";
const blob = new Blob(["id,value\n1,2"], {type: "text/csv"});
class PouchDB {
	constructor(dbName) { this.name = dbName; }
	get(docId) { calls.push(["get", this.name, docId]); return Promise.resolve({_rev: "1-a", _attachments: {[name]: {content_type: "text/csv", length: blob.size}}}); }
	getAttachment(docId, attachment) { calls.push(["getAttachment", this.name, docId, attachment]); return Promise.resolve(blob); }
}
const source = fs.readFileSync(path.resolve(__dirname, "../Resources-pouchdb.js"), "utf8");
vm.runInNewContext(source, {define: factory => { provider = factory(id => id === "pouchdb" ? PouchDB : {}); }, Promise, encodeURIComponent, decodeURIComponent, Error});
async function main() {
	const uri = provider.attachmentUri("pouchdb://home-va_objects/" + id, name);
	const suburi = uri.slice("pouchdb-attachment://".length);
	const resource = await provider.getAttachment(suburi);
	assert.equal(resource.name, name); assert.equal(resource.contentType, "text/csv");
	assert.deepStrictEqual(calls[1], ["getAttachment", "home-va_objects", id, name]);
	assert.equal(new TextDecoder().decode(await resource.arrayBuffer()), "id,value\n1,2");
	assert.equal(new TextDecoder().decode(await provider.getAttachment(suburi, {arrayBuffer: true})), "id,value\n1,2");
	const missing = provider.attachmentUri("pouchdb://home-va_objects/" + id, "missing.csv").slice("pouchdb-attachment://".length);
	await assert.rejects(provider.getAttachment(missing), /not found/);
	await assert.rejects(provider.getAttachment("bad"), /Invalid/);
	assert.throws(() => provider.attachmentUri("https://example.test", name), /PouchDB/);
	console.log("PouchDB attachment URI, metadata, bytes and missing attachment passed");
}
main().catch(error => {console.error(error); process.exitCode = 1;});
