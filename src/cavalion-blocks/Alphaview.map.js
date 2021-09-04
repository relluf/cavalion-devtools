["", {}, [
	
	["Executable", ("map"), {
		hotkey: "Alt+MetaCtrl+Enter",
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
				resource: { uri: "Resource-" + Date.now() + ".geojson" },
				selected: true
			});
			
			tab.once("resource-loaded", function() {
				tab.down("#ace").setValue(js.b(js.sj(gj)))
			});
		} 
	}],
	["Executable", ("map-xy"), {
		// vars: {
		// 	x: ["x", "X"], y: []
		// },
		on(evt) {
			var selection = this.ud("#list").getSelection(true);
			var filtered = this.ud("#q").getValue().length > 0;
			if(selection.length === 0) {
				selection = this.ud("#array")[filtered ? '_arr' : '_array'];
			}
			
			var getFloat = (obj, keys) => {
				return parseFloat(obj[keys.filter(key => 
					obj.hasOwnProperty(key)).pop()]);
			}

			var gj = {
				type: "FeatureCollection", 
				features: selection.map(_ => {
					return {
						type: "Feature",
						geometry: {
							type: "Point",
							coordinates: [
								getFloat(_, ["x", "X", "xcoord", "rd_x"]), 
								getFloat(_, ["y", "Y", "ycoord", "rd_y"])
							]
						},
						properties: _
					};
				})
			};
			
			if(evt.shiftKey !== true) {
				var ws = this.up("devtools/Workspace<>:root");
				var tab = ws.qs("#editor-needed").execute({
					resource: { uri: "Resource-" + Date.now() + ".geojson" },
					selected: true
				});

				tab.once("editor-available", function() {
					tab.down("#ace").getEditor().setValue(js.b(js.sj(gj)));
					// TODO set dirty, selectall
				});
			} else {
				this.print("GeoJSON", gj);
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