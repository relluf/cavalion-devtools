"use vcl/ui/ListColumn, util/Event";

/*- ### 2022/01/10 ... */
/*- ### 2021/09/18 Hooking devtools/Editor<xml>'s console */
/*- ### 2021/09/11 Whatvar? console or sel */
/*- ### 2021/01/09 Tired of not populating when console is invisible */
/*- ### 2020-10-29 Alphaview - Arcadis-demo inspired */
/*- ### 2020-10-02 Console hook - SIKB12 inspired */

var ListColumn = require("vcl/ui/ListColumn");
var Event = require("util/Event");

/*- Object.keys(VO.em.instances)
		.reduce((a, k) => { 
			a[k] = Object.keys(VO.em.instances[k]).map(_ => VO.em.instances[k][_]); 
			return a; 
		}, {})
*/

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
	"background": "#f0f0f0",
	"#bar": "text-align: center;",
	"#bar > *": "margin-right:5px;",
	"#bar input": "font-size:12pt;width:50%; border-radius: 5px; border-width: 1px; padding: 2px 4px; border-color: #f0f0f0;",
	"#bar #left": "float:left;", "#bar #right": "float:right;"
};

/*- TODO these Factories have to moved out-a-here (refactor to some SIKB-specific namespace!) */
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
			.filter(bh => bh) // filter undefineds
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
				return urn.endsWith(":id:4") || urn.endsWith(":id:6") || urn.endsWith(":id:10");
			})
			.map(rsf => js.get(["sam:SamplingFeatureComplex", 
					"sam:relatedSamplingFeature", 
					"@_xlink:href-resolved", 
					"imsikb0101:Borehole"], rsf))
			.filter(bh => bh) // filter undefineds
			.forEach(bh => {
				if(!boreholes.includes(bh)) {
					boreholes.push(bh);
				}
				// var project = js.get(["imsikb0101:usedInProject", 
				// 	"@_xlink:href-resolved", "imsikb0101:Project"], bh);
				// if(project && !projects.includes(project)) {
				// 	projects.push(project);
				// }
			});

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
						return urn.endsWith(":id:4") || urn.endsWith(":id:6") 
							|| urn.endsWith(":id:10") || urn.endsWith(":id:9"); //?
					})
					.map(rsf => js.get(["sam:SamplingFeatureComplex", 
							"sam:relatedSamplingFeature", 
							"@_xlink:href-resolved", 
							"imsikb0101:Borehole"], rsf))
					.filter(bh => bh) // filter undefineds
					.forEach(bh => {
						if(!boreholes.includes(bh)) {
							boreholes.push(bh);
						}
						// var project = js.get(["imsikb0101:usedInProject", 
						// 	"@_xlink:href-resolved", "imsikb0101:Project"], bh);
						// if(project && !projects.includes(project)) {
						// 	projects.push(project);
						// }
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
    onDispatchChildEvent: function (component, name, evt, f, args) {
        if (name.startsWith("key")) {
            var scope = this.scope();
            if (component === scope.q) {
                if ([13, 27, 33, 34, 38, 40].indexOf(evt.keyCode) !== -1) {
                    var list = scope.list;
                    if(evt.keyCode === 13 && list.getSelection().length === 0 && list.getCount()) {
                        list.setSelection([0]);
                    } else if(evt.keyCode === 27) {
		                scope.q.setValue("");
		                scope.q.fire("onChange", [true]); // FIXME
                    }

                    if (list.isVisible()) {
                        list.dispatch(name, evt);
                    }
                    evt.preventDefault();
                }
            }
        }
        return this.inherited(arguments);
    },
	onLoad() { 
		this.qsa("#load").execute(); 
		this.vars("history", []);
		
		this.qs("#list").override("notifyEvent", (event, data) => {
			// this.print("notifyEvent-" + event, data);
			if(event === "columnsChanged") {
				this.setTimeout("update", () => 
					this.qsa("vcl/ui/ListColumn")
						.filter(_ => _._attribute === "_")
						.map(_ => _.set("index", 0)), 200);
			}
		});
		
		return this.inherited(arguments);
	}
}, [
	["Executable", ("load"), {
		on() {
			var sel, cons = this.vars(["console"]);
			sel = this.vars(["sel"]);
			
			if(!cons && !sel) {
				var ws = this.up("devtools/Workspace<>");
				if(ws) {
					cons = ws.down("#left-sidebar < #console #console");
					sel = cons.sel || [];
				} else {
					// sel = [];
					sel = this.app().down("vcl/ui/Console#console").sel || [];
				}
			} else {
				sel = sel || cons.sel || [];
			}
			
			this.ud("#reflect").execute(sel);
		}
	}],
	["Executable", ("reflect"), {
		on(sel) {
			var root = this._owner;
			var value = sel[sel.length - 1];
			
			Promise.resolve(value).then(value => {
// console.log("#reflect value", value);
				this.vars("value", value);
				
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
								tabs._controls[0].setSelected(true);
							});
						} else {
							var arr = [];
							for(var k in value) arr.push({key:k, value:value[k]});
							root.down("#array").setArray(arr.sort((i1, i2) => i1.key < i2.key ? -1 : 1));
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
	
	["Executable", ("print"), {
		hotkey: "MetaCtrl+Enter",
		on() {
			var a = this.ud("#array");
			var q = this.ud("#q");
			var ws = this.up("devtools/Workspace<>");
			var objs = this.ud("#list").getSelection(true);
			var selected = this.ud("#tabs").getSelectedControl(1);
			selected = selected && selected.vars("key");
			
			if(objs.length === 0) {
				ws = null;
				objs = [].concat(a.getObjects());
			}
			
			(ws || q._owner).print(q.getValue() || selected || "*" , objs);
		}
	}],
	
	["Array", ("array"), { 
		// onFilterObject(obj) {
		// 	var q = this.vars("q");
		// 	if(!q) return false;
		// 	return q.split(/\s/).filter(q => q.length > 0).some(q => !match(obj, q));
		// },

		onFilterObject(obj, row, context) {
			var q = this.vars("q");
			
			if(!context.list) {
				context.list = this.ud("#list");
				context.columns = {};
				context.q = q ? q.split(" ") : [""];
			}
			
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
			function match_columns(obj, q) {
				var column, value;
				if(q.indexOf(":") === -1) {
					q = q.toLowerCase();
					for(var i = 0, n = context.list.getColumnCount(); i < n; ++i) {
						column = context.list.getColumn(i);
						value = context.list.valueByColumnAndRow(column, row);
						if(js.sf("%n", value).toLowerCase().includes(q)) {
							return true;
						}
					}
					return false;
				} else {
					q = q.split(":");
					column = context.columns[q[0]] || (context.columns[q] = context.list.getColumnByName(q[0]));
					if(column) {
						value = context.list.valueByColumnAndRow(column, row);
						if(js.sf("%n", value).toLowerCase().includes(q[1])) {
							return true;
						}
					}
					return false;
				}
			}
			
			return context.q.some(q => q ? !(match_columns(obj, q)) : false);// || match(obj, q)): false;
		},
		
		onUpdate() {
			this.ud("#list-status").render();
		},
		onGetAttributeValue(name, index, value) { 
			return (this._arr[index] || {})[name]; 
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
					// this.setVisible(history.length);
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
					this.ud("#list-status").render();
					
					// if(this.vars("enter-pressed")) {
					// }
					
				}, 250); 
				// this.removeVar("enter-pressed");
			} 
		}],
		["Group", ("right"), [
			// ["Button", { action: "view-source" }],
			["Group", ("export"), [
			]],
			["Element", ("list-status"), { 
				content: "-",
				onRender() {
					this.setTimeout(() => {
						var arr = this.ud("#array"), status = [];
						if(arr._array) {;
						
							var total = arr._array.length;
							var filtered = this.ud("#q").getValue().length > 0 ? (arr._arr||[]).length : 0;
							var selected = this.ud("#list").getSelection().length;
							
							selected && status.push(js.sf("%s (%d%%) selected", selected, selected/total*100));
							filtered && status.push(js.sf("%d (%d%%) filtered", filtered, filtered/total*100));
							status.push(js.sf("%d %s", total, status.length>1 ? "total" : "items"));
						}						
						this.setContent(status.join(" / "));
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
		css: { 
			'': "background-color:white;",
			'.{ListColumn}': { ':active': "font-weight:bold;" },
			'.{ListHeader}': { ':active': "background-color: gold;" }//rgb(56, 121, 217);" } 
		},
		autoColumns: true,
		source: "array", 
		visible: false, 
		onSelectionChange() {
			this.ud("#list-status").render();
		},
		onDispatchChildEvent(component, name, evt, f, ms) {
			if(name === "dblclick" && component instanceof ListColumn) {
				this.setTimeout("clicked", () => {
					var arr = this._source._arr.map(_ => js.mixIn({'_' : _}, _[component._attribute]));
					var old = this._source._arr;
					var history = this.vars(["history"]);
					history.push(this._source._array);
					this.ud("#array").setArray(null);
					this.ud("#array").setArray(arr.filter(_ => _ !== undefined));
					this.ud("#back").show();
				})
			} else if(name === "click") {
				this.setTimeout("clicked", () => {
					if(this._columns && this._columns.includes(component)) {
						if(this.vars("sorted-by") !== component) {
							this.vars("sorted-by", component);
							dir = this.vars("sorted-by-dir", "asc");
						} else {
							dir = this.vars("sorted-by-dir", this.vars("sorted-by-dir") === "asc" ? "desc" : "asc");
						}
						// Promise.resolve(this.ud("#query_load_all").execute())
							// .then(res => 
								this.sortBy(component, dir)
								// )
								;
					}
				}, 300);
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