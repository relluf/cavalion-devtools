const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(
	path.resolve(__dirname, "../../cavalion-blocks/Alphaview.js"),
	"utf8"
);
const use = source.match(/^"use ([^"]+)";/);
const dependencies = use && use[1].split(",").map(value => value.trim());
const synchronousRequires = Array.from(source.matchAll(/require\("([^"]+)"\)/g), match => match[1]);

assert(use, "Alphaview must declare its preload dependencies");
synchronousRequires.forEach(module => assert(
	dependencies.includes(module),
	"synchronous require must be preloaded by the use declaration: " + module
));

console.log("PASS: Alphaview preloads every synchronously required module.");
