"use blocks";
/*- ### 2020-10-29 Alphaview - Arcadis-demo inspired */
/*- ### 2020-10-02 Console hook - SIKB12 inspired */
var ListColumn = require("vcl/ui/ListColumn");

function match(obj, q) {
	q = q.toLowerCase();	
	if(typeof obj ==="string") {
		return obj.toLowerCase().includes(q);
	}
	for(var k in obj) {
		if(js.sf("%n", obj[k]).toLowerCase().includes(q)) {
			return true;
		}
	}
	return false;
}
function objectAsTabs() {
	
}

var css = {
	"#bar": "text-align: center;",
	"#bar > *": "margin-right:5px;",
	"#bar input": "font-size:12pt;width:300px;max-width:50%; border-radius: 5px; border-width: 1px; padding: 2px 4px; border-color: #f0f0f0;",
	"#bar #left": "float:left;", "#bar #right": "float:right;"
};

var Factories = {
	'Project': function(obj) {
		var boreholes = [], projects = [];
		return {
			boreholes: boreholes.filter(_ => _['immetingen:geometry']),
			projects: projects.filter(_ => _['imsikb0101:geometry'])
		};
	},
	'Borehole': function(borehole) {
		var boreholes = [], projects = [];
		if(!boreholes.includes(borehole)) {
			boreholes.push(borehole);
		}
		var project = js.get(["imsikb0101:usedInProject", 
			"@_xlink:href-resolved", "imsikb0101:Project"], borehole);
		if(project && !projects.includes(project)) {
			projects.push(project);
		}
		return {
			boreholes: boreholes.filter(_ => _['immetingen:geometry']),
			projects: projects.filter(_ => _['imsikb0101:geometry'])
		};
	},
	'Layer': function(layer) {
		var boreholes = [], projects = [];
		Array.as(layer['sam:relatedSamplingFeature'] || [])
			.filter(rsf => {
				var urn = js.get("sam:SamplingFeatureComplex.sam:role.@_xlink:href", rsf) || "";
				return urn.endsWith(":id:4");
			})
			.map(rsf => js.get(["sam:SamplingFeatureComplex", 
					"sam:relatedSamplingFeature", 
					"@_xlink:href-resolved", 
					"imsikb0101:Borehole"], rsf))
			.forEach(bh => {
				if(!boreholes.includes(bh)) {
					boreholes.push(bh);
				}
				var project = js.get(["imsikb0101:usedInProject", 
					"@_xlink:href-resolved", "imsikb0101:Project"], bh);
				if(project && !projects.includes(project)) {
					projects.push(project);
				}
			});

		return {
			boreholes: boreholes.filter(_ => _['immetingen:geometry']),
			projects: projects.filter(_ => _['imsikb0101:geometry'])
		};
	},
	'Sample': function(sample) {
		var boreholes = [], projects = [];
		Array.as(sample['sam:relatedSamplingFeature'] || [])
			.filter(rsf => {
				var urn = js.get("sam:SamplingFeatureComplex.sam:role.@_xlink:href", rsf) || "";
				return urn.endsWith(":id:6") || urn.endsWith(":id:10");
			})
			.map(rsf => js.get(["sam:SamplingFeatureComplex", 
					"sam:relatedSamplingFeature", 
					"@_xlink:href-resolved", 
					"imsikb0101:Borehole"], rsf))
			.forEach(bh => {
				if(!boreholes.includes(bh)) {
					boreholes.push(bh);
				}
				var project = js.get(["imsikb0101:usedInProject", 
					"@_xlink:href-resolved", "imsikb0101:Project"], bh);
				if(project && !projects.includes(project)) {
					projects.push(project);
				}
			});
			// .filter(rsf => {
			// 	var urn = js.get("sam:SamplingFeatureComplex.sam:role.@_xlink:href", rsf) || "";
			// 	return ["9", "10"].includes(urn.split(":").pop());
			// })
			// .map(rsf => Array
			// 	.as(js.get(["sam:SamplingFeatureComplex", "sam:relatedSamplingFeature", 
			// 		"@_xlink:href-resolved", "imsikb0101:Sample", 
			// 		"sam:relatedSamplingFeature"], rsf) || [])
			// 	.filter(rsf => {
			// 		var urn = js.get("sam:SamplingFeatureComplex.sam:role.@_xlink:href", rsf) || "";
			// 		return urn.endsWith(":id:6");
			// 	})
			// 	.map(rsf => js.get(["sam:SamplingFeatureComplex", 
			// 			"sam:relatedSamplingFeature", 
			// 			"@_xlink:href-resolved", 
			// 			"imsikb0101:Borehole"], rsf))
			// 	.forEach(bh => {
			// 		if(!boreholes.includes(bh)) {
			// 			boreholes.push(bh);
			// 		}
			// 		var project = js.get(["imsikb0101:usedInProject", 
			// 			"@_xlink:href-resolved", "imsikb0101:Project"], bh);
			// 		if(project && !projects.includes(project)) {
			// 			projects.push(project);
			// 		}
			// 	})
			// );

		return {
			boreholes: boreholes.filter(_ => _['immetingen:geometry']),
			projects: projects.filter(_ => _['imsikb0101:geometry'])
		};
			// Array.as(sample['sam:relatedSamplingFeature'] || [])
			// 	.filter(rsf => {
			// 		var urn = js.get("sam:SamplingFeatureComplex.sam:role.@_xlink:href", rsf) || "";
			// 		return ["9", "10"].includes(urn.split(":").pop());
			// 	})
			// 	.map(rsf => Array
			// 		.as(js.get(["sam:SamplingFeatureComplex", "sam:relatedSamplingFeature", 
			// 			"@_xlink:href-resolved", "imsikb0101:Sample", 
			// 			"sam:relatedSamplingFeature"], rsf) || [])
			// 		.filter(rsf => {
			// 			var urn = js.get("sam:SamplingFeatureComplex.sam:role.@_xlink:href", rsf) || "";
			// 			return urn.endsWith(":id:6");
			// 		})
			// 		.map(rsf => js.get(["sam:SamplingFeatureComplex", 
			// 				"sam:relatedSamplingFeature", 
			// 				"@_xlink:href-resolved", 
			// 				"imsikb0101:Borehole"], rsf))
			// 		.forEach(bh => {
			// 			if(!boreholes.includes(bh)) {
			// 				boreholes.push(bh);
			// 			}
			// 			var project = js.get(["imsikb0101:usedInProject", 
			// 				"@_xlink:href-resolved", "imsikb0101:Project"], bh);
			// 			if(project && !projects.includes(project)) {
			// 				projects.push(project);
			// 			}
			// 		})
			// 	);
		
	},
	// 'immetingen:Characteristic': function(obj) {
	// 	var sample = js.get("om:featureOfInterest.@_xlink:href-resolved.imsikb0101:Sample", obj);
	// 	if(sample) {
	// 		var boreholes = [], projects = [];
	// 		Array.as(sample['sam:relatedSamplingFeature'] || [])
	// 			.filter(rsf => {
	// 				var urn = js.get("sam:SamplingFeatureComplex.sam:role.@_xlink:href", rsf) || "";
	// 				return ["9", "10"].includes(urn.split(":").pop());
	// 			})
	// 			.map(rsf => Array
	// 				.as(js.get(["sam:SamplingFeatureComplex", "sam:relatedSamplingFeature", 
	// 					"@_xlink:href-resolved", "imsikb0101:Sample", 
	// 					"sam:relatedSamplingFeature"], rsf) || [])
	// 				.filter(rsf => {
	// 					var urn = js.get("sam:SamplingFeatureComplex.sam:role.@_xlink:href", rsf) || "";
	// 					return urn.endsWith(":id:6");
	// 				})
	// 				.map(rsf => js.get(["sam:SamplingFeatureComplex", 
	// 						"sam:relatedSamplingFeature", 
	// 						"@_xlink:href-resolved", 
	// 						"imsikb0101:Borehole"], rsf))
	// 				.forEach(bh => {
	// 					if(!boreholes.includes(bh)) {
	// 						boreholes.push(bh);
	// 					}
	// 					var project = js.get(["imsikb0101:usedInProject", 
	// 						"@_xlink:href-resolved", "imsikb0101:Project"], bh);
	// 					if(project && !projects.includes(project)) {
	// 						projects.push(project);
	// 					}
	// 				})
	// 			);

	// 		return {
	// 			boreholes: boreholes.filter(_ => _['immetingen:geometry']),
	// 			projects: projects.filter(_ => _['imsikb0101:geometry'])
	// 		};
	// 	}
		
	// },
	'immetingen:Analysis': function(obj) {
		var sample = js.get("om:featureOfInterest.@_xlink:href-resolved.imsikb0101:Sample", obj);
		if(sample) {
			var boreholes = [], projects = [];
			Array.as(sample['sam:relatedSamplingFeature'] || [])
				.filter(rsf => {
					var urn = js.get("sam:SamplingFeatureComplex.sam:role.@_xlink:href", rsf) || "";
					return ["9", "10"].includes(urn.split(":").pop());
				})
				.map(rsf => Array
					.as(js.get(["sam:SamplingFeatureComplex", "sam:relatedSamplingFeature", 
						"@_xlink:href-resolved", "imsikb0101:Sample", 
						"sam:relatedSamplingFeature"], rsf) || [])
					.filter(rsf => {
						var urn = js.get("sam:SamplingFeatureComplex.sam:role.@_xlink:href", rsf) || "";
						return urn.endsWith(":id:6") || urn.endsWith(":id:10") || urn.endsWith(":id:9");
					})
					.map(rsf => js.get(["sam:SamplingFeatureComplex", 
							"sam:relatedSamplingFeature", 
							"@_xlink:href-resolved", 
							"imsikb0101:Borehole"], rsf))
					.forEach(bh => {
						if(!boreholes.includes(bh)) {
							boreholes.push(bh);
						}
						var project = js.get(["imsikb0101:usedInProject", 
							"@_xlink:href-resolved", "imsikb0101:Project"], bh);
						if(project && !projects.includes(project)) {
							projects.push(project);
						}
					})
				);

			return {
				boreholes: boreholes.filter(_ => _ && _['immetingen:geometry']),
				projects: projects.filter(_ => _ && _['imsikb0101:geometry'])
			};
		}
	},
};

["Container", (""), { 
	css: css, 
	onLoad() { 
		this.qsa("#load").execute(); 
		this.vars("history", []);
	} 
}, [
	["Executable", ("load"), {
		on() {
			var sel, cons = this.vars(["console"]);
			
			if(!cons) {
				var ws = this.up("devtools/Workspace<>");
				cons = ws.down("#left-sidebar < #console #console");
				if(cons.isVisible()) {
					sel = cons.sel || [];
				} else {
					sel = app.down("#console #console").sel || [];
				}
			} else {
				sel = cons.sel || [];
			}
			
			this.ud("#reflect").execute(sel);
		}
	}],
	["Executable", ("reflect"), {
		on(sel) {
			var root = this._owner;
			var value = sel[sel.length - 1];
			
			Promise.resolve(value).then(value => {
				if(value instanceof Array) {
					root.down("#list").show();
					root.down("#array").setArray(value);
				} else if(value !== null) {
					if(typeof value === "object") {
						var tabs = [];
						if(Object.values(value).every(value => value instanceof Array)) {
							for(var ft in value) {
								tabs.push(["Tab", { 
									textReflects: "innerHTML",
									text: js.sf("%H <small>(%d)</small>", ft.split(":").pop(), value[ft].length), 
									vars: { array: value[ft], key: ft }
								}]);
							}
						}
						
						if(tabs.length) {						
							B.i(["Container", tabs]).then(c => {
								var tabs = root.down("#tabs");
								tabs.clearState("acceptChildNodes");
								[].concat(c._controls).forEach(tab => tab.setParent(tabs));
								tabs.setState("acceptChildNodes", true);
								tabs._controls[0].setSelected(true)
							});
						}
						
						root.down("#list").show();
						// root.down("#array").setArray(Object.values(value));
					} else if(typeof value === "function") {
						// root.down("#ace").show();
					}
				}
			});
		}
	}],
	["Executable", ("view-source"), {
		// content: locale(""), // TODO like $p introduce some locale feature, just like require is rewired all the time
		content: "View As... <i class='fa fa-caret-down'></i>", 
		on() {
			
		}
	}],
	
	["Array", ("array"), { 
		onFilterObject(obj) {
			var q = this.vars("q");
			if(!q) return false;
			return q.split(/\s/).filter(q => q.length > 0).some(q => !match(obj, q));
		},
		onUpdate() {
			this.ud("#list-status").render();
		}
	}],
	["Bar", ("bar") , [
		["Group", ("left"), [
			["Button", ("back"), { 
				content: "&lt;",
				visible: false,
				onClick() {
					var history = this.vars(["history"]);
					var value = history.pop();
					if(value) {
						this.ud("#array").setArray([]);
						this.nextTick(() => this.ud("#array").setArray(value));
					}
				}
			}],
			["Button", (""), { 
				content: "Map...", 
				onClick: function() {
					var selection = this.ud("#list").getSelection(true);
					var filtered = this.ud("#q").getValue().length > 0;
					if(selection.length === 0) {
						selection = this.ud("#array")[filtered ? '_arr' : '_array'];
					}
					
					var key = this.ud("#tabs").getSelectedControl(1).vars("key");
					var f = Factories[key];
					
					this.print("selection", selection.map(obj => js.mixIn({
						'@_va:geometry': f(obj)}, obj)));
						
					var gj = { type: "FeatureCollection", features: []};

					selection.map(obj => {
						var geoms = f(obj);
    					var proj = "EPSG:28992";
						var propPath = ["imsikb0101:geometry", "gml:Polygon", "gml:exterior", 
							"gml:LinearRing", "gml:posList"];
						(geoms.projects||[])
							.filter(project => js.get(propPath, project))
							.forEach(project => {
								var posList = js.get(propPath, project).split(" ").map(f => parseFloat(f));
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
			}]
		]],
		["Input", ("q"), { 
			placeholder: "Filter", 
			onChange() { 
				var array = this.ud("#array");
				this.setTimeout("updateFilter", () => {
					array.vars("q", this.getValue());
					array.updateFilter();
				}, 250); 
			} 
		}],
		["Group", ("right"), [
			// ["Button", { action: "view-source" }]
			["Element", ("list-status"), { 
				content: "-",
				onRender() {
					var status;
					this.setTimeout(() => {
						var arr = this.ud("#array");
						if(!arr._array) return;
						
						var total = arr._array.length;
						var filtered = this.ud("#q").getValue().length > 0 ? (arr._arr||[]).length : 0;
						var selected = this.ud("#list").getSelection().length;
						
						if(filtered === 0 && selected === 0) {
							status = js.sf("%d items", total);
						} else {
							status = js.sf("%d/%d", selected, filtered || total);
						}
						
						if(filtered) {
							status += js.sf(" (%d)", total);
						}
						
						this.setContent(status);
					}, 250);
				}
			}]
		]],
		
		["Radiobutton", ("opt-and"), {
			visible: false, // not=working=yet
			label: "AND", groupIndex: 1
		}],
		["Radiobutton", ("opt-or"), {
			visible: false, // not=working=yet
			checked: true, groupIndex: 1,
			label: "OR"
		}],
		["Checkbox", ("check-exact-case"), {
			visible: false, // not=working=yet
			label: "Exact case",
			checked: false
		}]
	]],
	["List", ("list"), { 
		css: "background-color:white;",
		autoColumns: true,
		source: "array", 
		visible: false, 
		onSelectionChange() {
			this.ud("#list-status").render();
		},
		onDispatchChildEvent(component, name, evt, f, ms) {
			if(name === "dblclick" && component instanceof ListColumn) {
				var arr = this._source._arr.map(_ => _[component._attribute]);
				var old = this._source._arr;
				var history = this.vars(["history"]);
				history.push(this._source._array);
				this.ud("#array").setArray(null);
				this.ud("#array").setArray(arr.filter(_ => _ !== undefined));
				this.ud("#back").show();
			}
		},
		onDblClick() { 
			var selection = this.getSelection(true);
			this.print(selection.length === 1 ? selection[0] : selection);
		}
	}],
	["Ace", ("ace"), { visible: false }],
	["Tabs", ("tabs"), {
		onChange(newTab, oldTab) {
			var list = this.scope().list;
			var n = list.nodeNeeded();
			
			if(oldTab !== null) {
				oldTab.vars("scrollInfo", [n.scrollLeft, n.scrollTop]);
				console.log("scrollInfo", oldTab.vars().scrollInfo);
			}
			this.ud("#array").setArray([]);
			this.setTimeout("change", () => {
				if(newTab !== null) {
					var n = this.ud("#list").nodeNeeded();
					this.ud("#array").setArray(newTab.vars("array"));
					this.setTimeout("change", () => {
						var si = newTab.vars("scrollInfo");
						si && (n.scrollLeft = si[0]);
						si && (n.scrollTop = si[1]);
					}, 200);
				}
			}, 50);
		}
	}]
]];