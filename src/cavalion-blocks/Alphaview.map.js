
const detectXYKeys = (obj) => {
	const keys = Object.keys(obj);
	const lower = keys.map(k => k.toLowerCase());

	const candidates = [];
	lower.forEach((key, index) => {
		if (key.includes("x") || key.includes("lon") || key.includes("lng")) {
			candidates.push({ key: keys[index], type: "x" });
		}
		if (key.includes("y") || key.includes("lat")) {
			candidates.push({ key: keys[index], type: "y" });
		}
	});

	for (const x of candidates.filter(c => c.type === "x")) {
		for (const y of candidates.filter(c => c.type === "y")) {
			const prefix = commonStart(x.key, y.key);
			const suffix = commonEnd(x.key, y.key);
			if (prefix.length > 0 || suffix.length > 0) {
				return [x.key, y.key];
			}
		}
	}

	return null;
};
const commonStart = (a, b) => {
	let i = 0;
	while (i < a.length && i < b.length && a[i] === b[i]) i++;
	return a.slice(0, i);
};
const commonEnd = (a, b) => {
	let i = 0;
	while (
		i < a.length &&
		i < b.length &&
		a[a.length - 1 - i] === b[b.length - 1 - i]
	) i++;
	return a.slice(a.length - i);
};

["", {}, [

	["Executable", ("map"), {
		on() {
			var selection = this.ud("#list").getSelection(true);
			var filtered = this.ud("#q").getValue().length > 0;
			if(selection.length === 0) {
				selection = this.ud("#array")[filtered ? '_arr' : '_array'];
			}

			var key = this.ud("#tabs").getSelectedControl(1).vars("key");
			var f = Factories[key] || Factories[key.split(":").pop()];
			this.print("selection", selection.map(
				obj => js.mixIn({ '@_va:geometry': f(obj) }, obj)));
				
			var gj = { type: "FeatureCollection", features: []};

			selection.map(obj => {
				var geoms = f(obj) || {};
				var proj = "EPSG:28992";
				var propPath = ["imsikb0101:geometry", "gml:Polygon", "gml:exterior", 
					"gml:LinearRing", "gml:posList"];
				(geoms.projects||[])
					.filter(project => js.get(propPath, project))
					.forEach(project => {
						var posList = js.get(propPath, project);
						if(posList['#text']) posList = posList['#text'];
						
						posList = posList.split(" ").map(f => parseFloat(f));
						// 86882.7455 468217.1085 86894.871 468217.1085 86896.555 468203.299 86899.5865 468185.4475 86903.7235 468172.399 86914.7435 468157.828 86927.2055 468147.7235 86940.005 468141.9975 86931.2475 468114.715 86912.7225 468115.3885 86884.0925 468117.7465 86897.2285 468163.891 86884.4295 468195.552 86882.7455 468217.1085
						var coords = [];
						while(posList.length) {
							coords.push([posList.shift(), posList.shift()]);
						}
						
						gj.features.push({
							type: "Feature",
							geometry: {
								type: "Polygon",
								coordinates: [coords]
							},
							properties: {
								'imsikb0101:Project': js.nameOf(project)
							},
						});
					});
					
				propPath = ["immetingen:geometry", "gml:Point", "gml:pos", "#text"];
				(geoms.boreholes||[])
					.filter(borehole => js.get(propPath, borehole) || js.get(propPath.slice(0, 3), borehole))
					.forEach(borehole => {
						var srsName = js.get(["immetingen:geometry", "gml:Point", "@_srsName"], borehole) || "";
						var pt = (js.get(propPath, borehole) || js.get(propPath.slice(0, 3), borehole))
							.split(" ").map(_ => parseFloat(_));
						
						// var ft = new ol.Feature({ 
						// 	// measurementObject: borehole
						// 	// borehole: borehole,
						// 	'imsikb0101:Borehole': borehole,
						// 	geometry: new ol.geom.Point(
						// 			srsName.includes("28992") ? pt :
						// 				proj4("EPSG:4326", proj, pt))
						// });
						
						gj.features.push({
							type: "Feature",
							geometry: {
								type: "Point",
								coordinates: pt
							},
							properties: {
								'imsikb0101:Borehole': js.nameOf(borehole)
							},
						});
					});
				
			});

			
			var ws = this.up("devtools/Workspace<>");
			var tab = ws.down("#editor-needed").execute({
				resource: { uri: "Features-" + Date.now().toString(32) + ".geojson" },
				selected: true
			});
			
			tab.once("resource-loaded", function() {
				tab.down("#ace").setValue(js.b(js.sj(gj)));
			});
		} 
	}],
	["Executable", ("map-xy"), {
		on(evt) {
			const ctx = this.vars(["ctx"]);


			const xy = detectXYKeys(ctx.sel[0]);
			if (!xy) throw new Error("No XY data found");
	
			const [xKey, yKey] = xy;
	
			const gj = {
				type: "FeatureCollection",
				features: ctx.sel.map(obj => {
					const x = parseFloat(obj[xKey]);
					const y = parseFloat(obj[yKey]);
					if (!isNaN(x) && !isNaN(y)) {
						return {
							type: "Feature",
							geometry: { type: "Point", coordinates: [x, y] },
							properties: obj
						};
					}
					return null;
				}).filter(f => f !== null)
			};
	
			if (gj.features.length === 0) {
				throw new Error("No features found");
			}
	
			if (evt.altKey !== true) {
				const tab = ctx.ws.qs("#editor-needed").execute({
					resource: { uri: "Map-" + Date.now() + ".geojson" },
					selected: true
				});
	
				tab.once("editor-available", function() {
					tab.down("#ace").getEditor().setValue(js.b(js.sj(gj)));
				});
			} else {
				this.print("geojson", gj);
			}
		}
	}],
	
	[("#bar"), [
		[("#export"), [
			[("Button"), "button-map", { action: "map" }],
			[("Button"), "button-map-xy", { action: "map-xy" }]
		]]	
	]]
	
]];