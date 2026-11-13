"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const JSZip = require("../../../../../veldoffice.nl/veldoffice-vcl-comps/lib/node_modules/jszip");

const source = fs.readFileSync(path.join(__dirname, "../Resources-ddh.js"), "utf8");
const file = (name, content) => ({ name, content: Buffer.from(content), size: content.length, lastModified: 1,
    arrayBuffer() { return Promise.resolve(this.content.buffer.slice(this.content.byteOffset, this.content.byteOffset + this.content.byteLength)); }
});
class FileReader {
    readAsArrayBuffer(input) {
        this.result = input.content.buffer.slice(input.content.byteOffset, input.content.byteOffset + input.content.byteLength);
        if(this.onload) this.onload({ target: this });
    }
}
function loadResources() {
    let resources;
    const parser = { open(shp, dbf) {
        assert.deepEqual(Array.from(shp), [1, 2, 3], "the SHP bytes reach the parser");
        assert.deepEqual(dbf && Array.from(dbf), [4, 5, 6], "raw DBF bytes reach the parser");
        let read = false;
        return Promise.resolve({ bbox: [155000, 463000, 156000, 464000], read() {
            if(read) return Promise.resolve({ done: true });
            read = true;
            return Promise.resolve({ done: false, value: { type: "Feature", geometry: {
                type: "Point", coordinates: [155000, 463000]
            }, properties: { NAME: "TEST" } } });
        } });
    } };
    const requireAMD = (ids, loaded) => loaded(ids[0] === "jszip" ? JSZip : parser);
    vm.runInNewContext(source, { Blob, Buffer, Date, FileReader, Promise, TextDecoder, TextEncoder,
        Uint8Array, console, define(factory) { resources = factory(requireAMD); } });
    return resources;
}

async function run() {
    const resources = loadResources();
    await resources.handle_input_change({ target: { files: [
        file("contour.SHP", [1, 2, 3]), file("CONTOUR.DBF", [4, 5, 6]),
        file("CONTOUR.PRJ", Buffer.from('PROJCS["Amersfoort / RD New",AUTHORITY["EPSG","28992"]]'))
    ] } });
    const top = await resources.list("");
    assert.equal(top.find(item => item.name === "CONTOUR.DBF").type, "File", "DBF is not treated as SQLite");
    const entries = await resources.list("contour.SHP");
    assert.equal(entries.length, 1);
    assert.equal(entries[0].name, "features.geojson");
    assert.equal(entries[0].type, "File");
    const content = await resources.get("contour.SHP/features.geojson", { arrayBuffer: true });
    const collection = JSON.parse(new TextDecoder().decode(content));
    assert.equal(collection.type, "FeatureCollection");
    assert.equal(collection.features[0].properties.NAME, "TEST");
    assert.equal(collection.crs.properties.name, "EPSG:28992");
    assert.deepEqual(Array.from(collection.bbox), [155000, 463000, 156000, 464000]);
    const zip = new JSZip();
    zip.file("folder/contour.SHP", Buffer.from([1, 2, 3]));
    zip.file("folder/CONTOUR.DBF", Buffer.from([4, 5, 6]));
    zip.file("folder/CONTOUR.PRJ", 'PROJCS["Amersfoort / RD New",AUTHORITY["EPSG","28992"]]');
    const zipped = loadResources();
    await zipped.handle_input_change({ target: { files: [
        file("contour.ZIP", await zip.generateAsync({ type: "nodebuffer" }))
    ] } });
    const zipEntries = await zipped.list("contour.ZIP");
    const shape = zipEntries.find(item => /\.shp$/i.test(item.name));
    const shapeEntries = await zipped.list(shape.uri);
    assert.equal(shapeEntries.length, 1);
    const zipContent = await zipped.get(shape.uri + "/features.geojson", { arrayBuffer: true });
    const zipCollection = JSON.parse(new TextDecoder().decode(zipContent));
    assert.equal(zipCollection.features[0].properties.NAME, "TEST");
    assert.equal(zipCollection.crs.properties.name, "EPSG:28992");
    console.log("Dropped SHP/DBF/PRJ and zipped variants produce valid GeoJSON with attributes");
}
run().catch(error => { console.error(error); process.exitCode = 1; });
