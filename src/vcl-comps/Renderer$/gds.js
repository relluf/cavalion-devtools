"use js, vcl/ui/Button, vcl/ui/Tab, papaparse/papaparse, amcharts, amcharts.serial, amcharts.xy, lib/node_modules/regression/dist/regression";
"use strict";

/*------- #VA-20201218-3 ---------

### 2021/06/14 
- stage.update() situation needs some attention 
- koppejan should be made lazy / on-demand for better UX
*/
	
function bjerrum_e_variables(vars) {
	var onder = js.get("overrides.bjerrum_e.label-onder", vars) || "1-2";
	var boven = js.get("overrides.bjerrum_e.label-boven", vars) || "3-4";
	
	var o = js.get("overrides.bjerrum_e.onder", vars) || "nog te bepalen";
	var b = js.get("overrides.bjerrum_e.boven", vars) || "nog te bepalen";

	return [
		{ name: js.sf("Trap %s", onder), unit: "", symbol: js.sf("Cc(%s)", onder), value: o },
		{ name: js.sf("Trap %s", boven), unit: "", symbol: js.sf("Cr(%s)", boven), value: o },
	];
	
}
function bjerrum_r_variables(vars) {
	var onder = js.get("overrides.bjerrum_r.label-onder", vars) || "1-2";
	var boven = js.get("overrides.bjerrum_r.label-boven", vars) || "3-4";
	
	var o = js.get("overrides.bjerrum_r.onder", vars) || "nog te bepalen";
	var b = js.get("overrides.bjerrum_r.boven", vars) || "nog te bepalen";

	return [
		{ name: js.sf("Trap %s", onder), unit: "", symbol: js.sf("CR(%s)", onder), value: o },
		{ name: js.sf("Trap %s", boven), unit: "", symbol: js.sf("RR(%s)", boven), value: o },
	];
	
}
function isotachen_variables(vars) {
	var onder = js.get("overrides.isotachen.label-onder", vars) || "1-2";
	var boven = js.get("overrides.isotachen.label-boven", vars) || "3-4";
	
	var o = js.get("overrides.isotachen.onder", vars) || "nog te bepalen";
	var b = js.get("overrides.isotachen.boven", vars) || "nog te bepalen";

	return [
		{ name: "a onder pg", unit: "", symbol: js.sf("a(%s)", onder), value: o },
		{ name: "b boven pg", unit: "", symbol: js.sf("b(%s)", boven), value: o }
	];
}
function koppejan_variables(vars) {
	var onder = js.get("overrides.koppejan.label-onder", vars) || "1-2";
	var boven = js.get("overrides.koppejan.label-boven", vars) || "3-4";
	
	var o = js.get("overrides.koppejan.onder", vars) || "nog te bepalen";
	var b = js.get("overrides.koppejan.boven", vars) || "nog te bepalen";

	return [
		{ name: js.sf("C Trap %s", onder), unit: "", symbol: onder, value: o.C },
		{ name: js.sf("C10 Trap %s", onder), unit: "", symbol: onder, value: o.C10 },
		{ name: js.sf("Cp Trap %s", onder), unit: "", symbol: onder, value: o.Cp },
		{ name: js.sf("Cs Trap %s", onder), unit: "", symbol: onder, value: o.Cs },
		{ name: js.sf("C' Trap %s", boven), unit: "", symbol: boven, value: o.C },
		{ name: js.sf("C10' Trap %s", boven), unit: "", symbol: boven, value: o.C10 },
		{ name: js.sf("Cp' Trap %s", boven), unit: "", symbol: boven, value: o.Cp },
		{ name: js.sf("Cs' Trap %s", boven), unit: "", symbol: boven, value: o.Cs }
	];
}

var regression = require("lib/node_modules/regression/dist/regression");
var js = require("js");
var Button = require("vcl/ui/Button");
var Tab = require("vcl/ui/Tab");
var Control = require("vcl/Control");

var key_s = "Stage Number";
var key_t = "Time since start of stage (s)";
var key_T = "Time since start of test (s)";
var key_d = "Axial Displacement (mm)";
var key_as = "Axial Stress (kPa)";
var key_st = "Stress Target (kPa)";
var treatZeroAs = 0.0001;

/* Some styles and class */
var css = {
		"": "background-color:white;",
		"a": "visibility:hidden;",
		".multiple > div": "width:48%;height:48%;display:inline-block;" + 
			"border: 1px dashed black;" +
			"margin-left:1%;margin-right:1%;margin-top:5px;margin-bottom:5px;" + 
			"min-width:300px;min-height:300px;",
		// "> :not(.multiple)": "margin:5px;",
		"&.pdf > :not(.multiple)": "margin:5px;width: 850px; height: 470px; background-color: rgba(56, 121, 217, 0.075); border: 3px dashed rgb(56, 121, 217);",
		"&.pdf .multiple > div.selected": "background-color: rgba(56, 121, 217, 0.075); border: 3px dashed rgb(56, 121, 217);",
		"div.editing": "background-color: #f0f0f0; border: 3px dashed orange;top:0;left:0;right:0;bottom:0;z-index:1;position:absolute;width:auto;height:auto;margin:5px;",
		"&.pdf.generate .multiple > div": "height: 470px; width:850px; position:absolute;top:0;left:0;",
		// ".amcharts-main-div": "border: 3px solid transparent;"
	};
var logger; 

function makeChart(c, opts) {
	
	function render(options) {
		var node = options.node || this.getNode();
	
		this.print(this.vars("am"));
		
		var defaults = {
		    mouseWheelZoomEnabled: true, zoomOutText: " ", 
		    mouseWheelScrollEnabled: false,
		    // chartScrollbar: {
		    //     oppositeAxis: true,
		    //     offset: 30,
		    //     scrollbarHeight: 20,
		    //     backgroundAlpha: 0,
		    //     selectedBackgroundAlpha: 0.1,
		    //     selectedBackgroundColor: "#888888",
		    //     graphFillAlpha: 0,
		    //     graphLineAlpha: 0.5,
		    //     selectedGraphFillAlpha: 0,
		    //     selectedGraphLineAlpha: 1,
		    //     autoGridCount: true,
		    //     color: "#AAAAAA"
		    // },
		    chartCursor: {
		        // pan: true,
		        valueLineEnabled: true,
		        valueLineBalloonEnabled: true,
		    	categoryBalloonDateFormat: "D MMM HH:NN",
		    	color:"black",
		        cursorAlpha:0.5,
		        cursorColor:"#e0e0e0",
		        valueLineAlpha:0.2,
		        valueZoomable:true
		    },
		    
		    // processCount: 1000,
		    // processTimeout: 450,
			// autoMarginOffset: 10,
			// autoMargins: false,
			// marginLeft: 60,
			// marginBottom: 30,
			// marginTop: 30,
			// marginRight: 30,
		
			numberFormatter: { decimalSeparator: ",", thousandsSeparator: "" },
			
		    type: "xy",  
		    colors: ["rgb(56, 121, 217)", "black"],
		    // legend: { useGraphSettings: true },
			dataProvider: this.vars("am.data"),
			// minValue: 1, maxValue: 0,
		    valueAxes: [{
		        id: "y1", position: "left",
		        reversed: true
			}, {
				position: "bottom", 
				logarithmic: options.xAxisLogarithmic,
				title: options.xAxisTitle
			}]
		};
		options = js.mixIn(defaults, options);
		options.graphs = options.graphs || this.vars("am.series").map(serie => {
			return js.mixIn({
	        	type: "line", lineThickness: 2,
		        connect: serie.connect || false,
			    xField: serie.categoryField || "x", yField: serie.valueField || "y",
			    yAxis: serie.yAxis || "y1"
		    }, serie);
		});
		
		// var serializing = this.vars(["pdf"]);
		var serializing = this.ud("#graphs").hasClass("pdf");
		
		options.valueAxes.forEach(ax => {
			ax.includeGuidesInMinMax = true;
			if(serializing) {
				delete ax.title;
			} else {
				ax.zoomable = true;
			}
			// ax.ignoreAxisWidth = true;
			// ax.inside = true;
		});
		// options.valueAxes.forEach(ax => ax.precision = 4);
		var emit = (a, b) => {
			// this.print("emit: " + a, b);
			this.emit(a, b);
		};
		var chart = AmCharts.makeChart(node, options);

		this.vars("am.chart", chart);
		// this.print("rendering", options);

		chart.addListener("drawn", (e) => emit("rendered", [e, "drawn"]));
		chart.addListener("dataUpdated", (e) => emit("rendered", [e, "dataUpdated"]));
		chart.addListener("rendered", (e) => emit("rendered", [e]));
		chart.chartCursor.addListener("moved", (e) => emit("cursor-moved", [e]));
		// chart.addListener("init", (e) => emit("rendered", [e, "init"]));
		// chart.addListener("zoomed", (e) => emit("zoomed", [e]));
		// chart.addListener("changed", (e) => emit("changed", [e]));
	}
	
	opts.immediate ? render.apply(c, [opts || {}]) : c.nextTick(() => render.apply(c, [opts || {}]));
}

/* Handy Dandy */
var mixin = js.mixIn;
var cp = (obj) => {
	if(obj instanceof Array) {
		return obj.map(_ => cp(_));
	}
	if(obj !== null && typeof obj === "object") {
		var newObj = {};
		Object.keys(obj).forEach(key => newObj[key] = cp(obj[key]));
		obj = newObj;
	}
	return obj;
};
var match = (obj, q) => {
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
};
var parseValue = (value) => isNaN(value.replace(",", ".")) ? value : parseFloat(value.replace(",", "."));
var removeQuotes = (str) => str.replace(/"/g, "");
var removeTrailingColon = (s) => s.replace(/\:$/, "");
var sort_numeric = (i1, i2) => parseFloat(i1) < parseFloat(i2) ? -1 : 1;

/* Other */
function getSelectedGraph(cmp) {
	var graph;
	if(cmp instanceof Tab) {
		graph = cmp.getControl();
	} else {
		graph = cmp.ud("#tabs-graphs").getSelectedControl(1).getControl();
	}
	return {
		id: graph.getName().substring("graph".length + 1).toLowerCase(),
		multiple: graph.hasClass("multiple")
	};
}

/* Event Handlers */
var handlers = {
	/* Event Handlers */
	"loaded": function root_loaded() {
		var editor, me = this, root = this.up("devtools/Editor<vcl>");
		if(root) {
			/*- DEBUG: hook into the 1st Editor<gds> we can find (if any) in order to tweak/fiddle code */
			if((editor = root.app().down("devtools/Editor<gds>:root"))) {
				var previous_owner = me._owner;
				me.setOwner(editor);
				me.on("destroy", () => me.setOwner(previous_owner));
			}
	 	}
	 	
	 	logger = this;
	},
	"#tabs-sections onChange": function tabs_change(newTab, curTab) {
		this.ud("#bar").setVisible(newTab && (newTab.vars("bar-hidden") !== true));
	},
	"#tabs-graphs onChange": function graphs_change(newTab, curTab) {
		var teg = this.ud("#toggle-edit-graph"), egs = this.ud("#edit-graph-stage");
		var state = teg.getState();
	
		if(state === true) {
			// commit pending changes
			teg.execute();
		}
		
		var multiple = (newTab.vars("multiple") === true);
		teg.setVisible(!multiple);
		egs.setVisible(multiple);
		
		if(!multiple) {
			var vars = this.vars(["variables"]), sg = getSelectedGraph(newTab);
			this.ud("#label-boven").setValue(js.get(js.sf("overrides.%s.label-boven", sg.id), vars) || "3-4");
			this.ud("#label-onder").setValue(js.get(js.sf("overrides.%s.label-onder", sg.id), vars) || "1-2");
		}
		
		if(state === true) {
			this.setTimeout("foo", () => teg.execute(), 500);
			// this causes UI state to become unstable - really not happy with the way it's organized Action stuff
		}
	},
	
	"#panel-edit-graph > vcl/ui/Input onChange": function() {
		this.setTimeout("foo", () => {
			var sg = getSelectedGraph(this); 
			if(!sg.multiple) {
				var vars = this.vars(["variables"]), path = js.sf("overrides.%s.%s", sg.id, this._name);
				var current = js.get(path, vars), value = this.getValue();
				
				if(current !== value) {
					js.set(path, value, vars);
					if(current !== undefined) {
						this.ud("#modified").setState(true);
					}	
				} else {
					this.print("ignore onChange");
				}
			}
		}, 750);
	},

	"#graph_Casagrande cursor-moved": cursorMoved,
	"#graph_Taylor cursor-moved": cursorMoved,
	"#graph_Bjerrum_e cursor-moved": cursorMoved,
	"#graph_Bjerrum_r cursor-moved": cursorMoved,
	"#graph_Isotachen cursor-moved": cursorMoved,
	"#graph_Isotachen_c cursor-moved": cursorMoved,
	"#graph_Koppejan cursor-moved": cursorMoved,

	"#graph_Casagrande onRender"() {
		this.setTimeout("render", () => {
			var vars = this.vars(["variables"]) || { stages: [] };
			var selected = js.get("overrides.casagrande.stage", vars) || [3];

			/*- reset */
			var content = [], st;
			for(st = 0; st < vars.stages.length; ++st) {
				content.push(js.sf("<div>Stage %s</div>", st));
			}
			this._node.innerHTML = content.join("");
			this.vars("rendering", true);
			
			var render = () => {
				var stage = vars.stages[st];
				var series = [{
					title: js.sf("Zetting trap %s [µm]", st + 1),
					valueAxis: "y1", valueField: "y_casagrande", 
					categoryField: "minutes"
				}];
				this.vars("am", { series: series, stage: stage, data: stage.measurements.slice(1) });
				this.vars("am-" + st, this.vars("am"));
				makeChart(this, {
					immediate: true,
					node: this.getChildNode(st),
					trendLines: cp(stage.casagrande.trendLines || []),
				    valueAxes: [{
				        id: "y1", position: "left", reversed: true,
						guides: cp(stage.casagrande.guides.filter(guide => guide.position === "left" || guide.position === "right"))
					}, {
						id: "x1", position: "bottom",
						title: js.sf("Trap %s: zetting [µm] / tijd [minuten] → ", st + 1),
						guides: cp(stage.casagrande.guides.filter(guide => guide.position === "top" || guide.position === "bottom")),
						logarithmic: true
					}]
				});
					
				if(++st < vars.stages.length) {
					this.nextTick(render);
				} else {
					selected.forEach(selected => this.getChildNode(selected - 1).classList.add("selected"));
					this.vars("rendering", false);
				}
			};
	
			st = 0; vars.stages.length && render();
		}, 125);
	},
	"#graph_Taylor onRender"() {
		this.setTimeout("render", () => {
			var vars = this.vars(["variables"]) || { stages: [] };
			var selected = js.get("overrides.taylor.stage", vars) || [3];
	
			/*- reset */
			var content = [], st;
			for(st = 0; st < vars.stages.length; ++st) {
				content.push(js.sf("<div>Stage %s</div>", st));
			}
			this._node.innerHTML = content.join("");
			
			this.vars("rendering", true);
			var render = () => {
				var stage = vars.stages[st];
			    var series = [{
					title: js.sf("Zetting trap %s [µm]", st + 1),
					valueAxis: "y1", valueField: "y_taylor",
					categoryField: "minutes_sqrt"
				}];
		
				this.vars("am", { series: series, stage: stage, data: stage.measurements });
				this.vars("am-" + st, this.vars("am"));
				makeChart(this, {
					immediate: true,
					legend: false,
					node: this.getChildNode(st),
					trendLines: cp(stage.taylor.trendLines || []),
				    valueAxes: [{
				        id: "y1", position: "left", reversed: true,
						guides: cp(stage.taylor.guides || [])
					}, {
						title: js.sf("Trap %s: zetting [µm] / tijd [√ minuten] → ", st + 1),
						position: "bottom"
					}]
				});
		
				if(++st < vars.stages.length) { 
					this.nextTick(render); 
				} else {
					selected.forEach(selected => this.getChildNode(selected - 1).classList.add("selected"));
					this.vars("rendering", false);
				}
			};
	
			st = 0; vars.stages.length && render();
		}, 125);
	},
	"#graph_Isotachen_c onRender"() {
		this.setTimeout("render", () => {
			var vars = this.vars(["variables"]) || { stages: [] };
			var selected = js.get("overrides.isotachen_c.stage", vars) || [3];
	
			/*- reset */
			var content = [], st;
			for(st = 0; st < vars.stages.length; ++st) {
				content.push(js.sf("<div>Stage %s</div>", st));
			}
			this._node.innerHTML = content.join("");
			this.vars("rendering", true);
			
			var render = () => {
				var stage = vars.stages[st];
				var series = [{
					title: js.sf("Natuurlijke rek trap %s [-]", st + 1),
					valueAxis: "y1", valueField: "y_isotachen_c", 
					categoryField: "minutes"
				}];
				this.vars("am", { series: series, stage: stage, data: stage.measurements.slice(1) });
				this.vars("am-" + st, this.vars("am"));
				makeChart(this, {
					immediate: true,
					node: this.getChildNode(st),
					trendLines: cp(stage.isotachen.trendLines || []),
				    valueAxes: [{
				        id: "y1", position: "left", reversed: true,
						guides: cp(stage.isotachen.guides.filter(guide => guide.position === "left" || guide.position === "right"))
					}, {
						id: "x1", position: "bottom",
						title: js.sf("Trap %s: natuurlijke rek [-] / tijd [minuten] → ", st + 1),
						guides: cp(stage.isotachen.guides.filter(guide => guide.position === "top" || guide.position === "bottom")),
						logarithmic: true
					}]
				});
					
				if(++st < vars.stages.length) {
					this.nextTick(render);
				} else {
					selected.forEach(selected => this.getChildNode(selected - 1).classList.add("selected"));
					this.vars("rendering", false);
				}
			};
	
			st = 0; vars.stages.length && render();
		}, 125);
	},
	"#graph_Bjerrum_e onRender"() {
		this.setTimeout("render", () => {
			var vars = this.vars(["variables"]) || { stages: [] };
			var series = [{ title: "Poriëngetal (e) [-]" }];
			
			var data = vars.bjerrum.data_e;
			var points = vars.bjerrum.points_e;
			var LLi_e = vars.bjerrum.LLi_e;
			var trendLines = [{
				initialXValue: LLi_e.sN1N2.x, initialValue: LLi_e.sN1N2.y,
				finalXValue: LLi_e.sN1N2.x, finalValue: 100,
				lineColor: "red", lineAlpha: 0.25,
				dashLength: 2
			}, {
				initialXValue: LLi_e.sN1N2.x, initialValue: LLi_e.sN1N2.y,
				finalXValue: 0.1, finalValue: LLi_e.sN1N2.y,
				lineColor: "red", lineAlpha: 0.25,
				dashLength: 2
			}];
			
			if(points) {
				trendLines.push({
					initialXValue: points[0].x, initialValue: points[0].y,
					finalXValue: points[1].x, finalValue: points[1].y,
					lineColor: "red", editable: true
				}, {
					initialXValue: points[2].x, initialValue: points[2].y,
					finalXValue: points[3].x, finalValue: points[3].y,
					lineColor: "red", editable: true
				});
			} else {
				trendLines.push({
					initialXValue: data[1].x, initialValue: data[1].y,
					finalXValue: LLi_e.b1 * Math.pow(LLi_e.g1, data[2].y),
					finalValue: data[2].y,
					lineColor: "red", editable: true
				}, {
					finalXValue: data[2].x, finalValue: data[2].y,
					initialXValue: LLi_e.b2 * Math.pow(LLi_e.g2, data[0].y),
					initialValue: data[0].y,
					lineColor: "red", editable: true
				});
			}
	
			this.vars("am", { series: series, data: data });
			
			makeChart(this, { 
				type: "xy",
				trendLines: trendLines,
			    valueAxes: [{
			        id: "y1", position: "left", 
			        guides: [{
						value: LLi_e.sN1N2.y, inside: true, lineAlpha: 0, 
						label: js.sf("e0: %.3f", LLi_e.sN1N2.y)
					}]
			    }, {
					position: "bottom", title: "Belasting [kPa] → ",
					logarithmic: true, minimum: 5,
					guides: [{
						position: "top",
						value: LLi_e.sN1N2.x, inside: true, lineAlpha: 0,
						label: js.sf("Pg: %.3f kPa", LLi_e.sN1N2.x)
					}]
				}]
			});
		}, 125);
	},
	"#graph_Bjerrum_r onRender"() {
		this.setTimeout("render", () => {
			var vars = this.vars(["variables"]) || { stages: [] };
			var series = [{ title: "Verticale rek [∆H / Ho]", yAxis: "y2" }];
			var data = vars.bjerrum.data_rek;
			var points = vars.bjerrum.points_rek;
			var LLi_rek = vars.bjerrum.LLi_rek;
			var trendLines = [{
				initialXValue: LLi_rek.sN1N2.x, initialValue: LLi_rek.sN1N2.y,
				finalXValue: LLi_rek.sN1N2.x, finalValue: 0,
				lineColor: "red", lineAlpha: 0.25,
				dashLength: 2
			}, {
				initialXValue: LLi_rek.sN1N2.x, initialValue: LLi_rek.sN1N2.y,
				finalXValue: 0.1, finalValue: LLi_rek.sN1N2.y,
				lineColor: "red", lineAlpha: 0.25,
				dashLength: 2
			}];

			if(points) {
				trendLines.push({
					initialXValue: points[0].x, initialValue: points[0].y,
					finalXValue: points[1].x, finalValue: points[1].y,
					lineColor: "red", editable: true
				}, {
					initialXValue: points[2].x, initialValue: points[2].y,
					finalXValue: points[3].x, finalValue: points[3].y,
					lineColor: "red", editable: true
				});
			} else {
				trendLines.push({
					initialXValue: data[1].x, initialValue: data[1].y,
					finalXValue: LLi_rek.b1 * Math.pow(LLi_rek.g1, data[2].y),
					finalValue: data[2].y,
					lineColor: "red", editable: true
				}, {
					finalXValue: data[2].x, finalValue: data[2].y,
					initialXValue: LLi_rek.b2 * Math.pow(LLi_rek.g2, data[0].y),
					initialValue: data[0].y,
					lineColor: "red", editable: true
				});
			}

			this.vars("am", { series: series, meta: { LLi_rek: LLi_rek }, data: data });
					
			makeChart(this, {  
				type: "xy",
				trendLines: trendLines,
			    valueAxes: [{
			    	id: "y2", position: "left", reversed: true,
			        guides: [{
						value: LLi_rek.sN1N2.y, inside: true, lineAlpha: 0, 
						label: js.sf("Rek: %.3f %%", LLi_rek.sN1N2.y * 100)
					}]
			    }, {
					position: "bottom", title: "Belasting [kPa] → ",
					logarithmic: true, minimum: 5,
					guides: [{
						position: "top",
						value: LLi_rek.sN1N2.x, inside: true, lineAlpha: 0,
						label: js.sf("Pg: %.3f kPa", LLi_rek.sN1N2.x)
					}]
				}]
			});
		}, 125);
	},
	"#graph_Isotachen onRender"() {
		this.setTimeout("render", () => {
			var vars = this.vars(["variables"]) || { stages: [] };
			var series = [{
				title: "Natuurlijke verticale (Hencky) rek (-ln(1 - (∆H / Ho)) [%]",
				valueField: "y"
			}];
			var data = vars.isotachen.data_e;
			var points = vars.isotachen.points_e;
			var LLi_e = vars.isotachen.LLi_e;
			
			var trendLines = [{
					initialXValue: LLi_e.sN1N2.x, initialValue: 0,
					finalXValue: LLi_e.sN1N2.x, finalValue: LLi_e.sN1N2.y,
					lineColor: "red", lineAlpha: 0.25, dashLength: 2
				}, {
					initialXValue: 0.1, initialValue: LLi_e.sN1N2.y,
					finalXValue: LLi_e.sN1N2.x,  finalValue: LLi_e.sN1N2.y,
					lineColor: "red", lineAlpha: 0.25, dashLength: 2
				}];
				
			if(points) {
				trendLines.push({
						initialXValue: points[0].x, initialValue: points[0].y,
						finalXValue: points[1].x, finalValue: points[1].y,
						lineColor: "red", editable: true
					}, {
						initialXValue: points[2].x, initialValue: points[2].y,
						finalXValue: points[3].x, finalValue: points[3].y,
						lineColor: "red", editable: true
					});
			} else {
				trendLines.push({
						initialXValue: data[1].x, initialValue: data[1].y,
						finalXValue: LLi_e.b1 * Math.pow(LLi_e.g1, data[2].y), finalValue: data[2].y,
						lineColor: "red", editable: true
					}, {
						finalXValue: data[2].x, finalValue: data[2].y,
						initialXValue: LLi_e.b2 * Math.pow(LLi_e.g2, data[0].y),
						initialValue: data[0].y,
						lineColor: "red", editable: true
					});
			}

			this.vars("am", { series: series, data: data });
			makeChart(this, { 
				type: "xy",
				trendLines: trendLines,
				valueAxes: [{
			        id: "y1", position: "left", reversed: true,
					guides: [{
						value: LLi_e.sN1N2.y, inside: true, lineAlpha: 0,
						label: js.sf("Rek: %.3f %%", LLi_e.sN1N2.y * 100)
					}]
				}, {
					position: "bottom", title: "Belasting [kPa] → ",
					minimum: data[0].x * 0.75,
					logarithmic: true,
					guides: [{
						value: LLi_e.sN1N2.x, inside: true, lineAlpha: 0, position: "top",
						label: js.sf("Pg: %.3f kPa", LLi_e.sN1N2.x, LLi_e.sN1N2.y * 100)
					}]
				}]
			});
		}, 125);
	},
	"#graph_Koppejan onRender"() {
		this.setTimeout("render", () => {
			
			var vars = this.vars(["variables"]);
			var series = [{ 
				title: "Zetting [mm]", xAxis: "x1", yAxis: "y1",
				xField: "daysT", yField: "y_koppejan"
			}, {
				title: "Zetting 1dags [mm]", xAxis: "x2", yAxis: "y1",
				xField: "x2", yField: "ez1"
			}, {
				title: "Zetting 10-daags [mm]", xAxis: "x2", yAxis: "y1",
				xField: "x2", yField: "ez10",
				lineColor: "blue", dashLength: 3, lineThickness: 1
			}]
			.concat([1,2,3,4,5,6].map(_ => ({
				title: js.sf("Verschoven zetting vz%d [mm]", _ + 1), 
				xAxis: "x1", yAxis: "y2",
				xField: "x" + (_ + 2), yField: "vz0",
				lineColor: _ >= 4 ? "purple" : "red", lineThickness: 1
			})));
		
			var serie2 = vars.koppejan.serie2;
			var trendLines = cp(vars.koppejan.trendLines);
			var LLi_1 = vars.koppejan.LLi_1;
			
			this.vars("am", { series: series, data: vars.measurements.slice(1) });
			
			makeChart(this, { 
				type: "xy",
				colors: ["black", "rgb(56, 121, 217)"],
			    valueAxes: [{
			        id: "y1", reversed: true, minimum: 0,
				}, {
			        id: "y2", position: "right", reversed: true, minimum: 0,
			        synchronizeWith: "y1", synchronizationMultiplier: 1,
					guides: [{
						value: LLi_1.sN1N2.y, inside: true, lineAlpha: 0,
						label: js.sf("%.3f %%", LLi_1.sN1N2.y / vars.Hi * 100),
					}],
				}, {
					id: "x1", title: "Duur [dagen] → ", position: "bottom", 
					logarithmic: true, minimum: 0.01, maximum: 1000
				}, {
					id: "x2", _title: "Belasting [kPa] → ", position: "top",
					synchronizeWith: "x1", synchronizationMultiplier: 1,
					logarithmic: true, minimum: 0.01,
					guides: [{
						value: LLi_1.sN1N2.x, inside: true, lineAlpha: 0,
						label: js.sf("%.3f kPa", LLi_1.sN1N2.x)
					}]
				}],
				trendLines: trendLines
			});
			
		}, 125);
	}
};

/* Math-like */
function line_intersect(x1, y1, x2, y2, x3, y3, x4, y4) {
    var ua, ub, denom = (y4 - y3)*(x2 - x1) - (x4 - x3)*(y2 - y1);
    if (denom === 0) {
        return null;
    }
    ua = ((x4 - x3)*(y1 - y3) - (y4 - y3)*(x1 - x3))/denom;
    ub = ((x2 - x1)*(y1 - y3) - (y2 - y1)*(x1 - x3))/denom;
    return {
        x: x1 + ua * (x2 - x1),
        y: y1 + ub * (y2 - y1),
        seg1: ua >= 0 && ua <= 1,
        seg2: ub >= 0 && ub <= 1
    };
}
function log_line_intersect(x1, y1, x2, y2, x3, y3, x4, y4) {
/*- find intersection in logarithimic-plane, straight line on log-scale? 
	>> N = b * g ^ t; (https://www.youtube.com/watch?v=i3jbTrJMnKs) */

/*- (t1,N1), (t2,N2) => g1, b1 */
	var t1 = y1, N1 = x1;
	var t2 = y2, N2 = x2;
	var dt1 = t2 - t1;
	var g1 = Math.pow(N2 / N1, 1 / dt1);
	var b1 = N1 / Math.pow(g1, t1);

/*- (t3,N3), (t4,N4) => g2, b2 */
	var t3 = y3, N3 = x3;
	var t4 = y4, N4 = x4;
	var dt2 = t4 - t3;
	var g2 = Math.pow(N4 / N3, 1 / dt2);
	var b2 = N3 / Math.pow(g2, t3);

/*- TODO find where (b1 * g1 ^ t) === (b2 * g2 ^ t) - for now cheating? */
	var ts = [], delta;
	if(t1 > t4) {
		t1 = [t4, t1];
		t4 = t1.pop();
		t1 = t1.pop();
	}

	// >>  b1/b2 * g1 ^ t1 = g2 ^ t2 => WHERE t1 = t2 //=> a * b^x = c^x
	
	/*- TODO cheating part -> refactor to some sort of bubble sort mechanism? */
	for(var t = t1; t < t4; t += (t4 - t1) / 5000) {
		var obj = { t: t, N1: b1 * Math.pow(g1, t),  N2: b2 * Math.pow(g2, t) };
		if((obj.delta = Math.abs(obj.N2 - obj.N1)) < delta || delta === undefined) {
			delta = obj.delta;
			ts.unshift(obj);
		}
	}
	if(ts.length === 0) ts = [{}];

	return {
		sN1N2: {x: ts[0].N1, y: ts[0].t}, ts: ts,
		t1: t1, t2: t2, N1: N1, N2: N2, dt1: dt1, g1: g1, b1: b1,
		t3: t3, t4: t4, N3: N3, N4: N4, dt2: dt2, g2: g2, b2: b2
	};
}
function log_line_calc(N1, N2, t1, t2) {
	/*- straight line on log-scale? >> N = b * g ^ t; (https://www.youtube.com/watch?v=i3jbTrJMnKs) 
		(t1,N1), (t2,N2) => g1, b1  >>> t = Math.log(N / b) / Math.log(g); */
	var dt = t2 - t1;
	var g = Math.pow(N2 / N1, 1 / dt);
	var b = N1 / Math.pow(g, t1);
	
	return {b: b, g: g, N1: N1, N2: N2, t1: t1, t2: t2, dt: dt, dt_1: 1/dt };
} 
function calc_derivatives(measurements, y, x) {
	/*- assumes x and y attributes and a logarithmic scale along the X-axis */
	y = y || "y";
	x = x || "x";
	
	var prev1, next1, next2, prev2, dt;
	measurements.forEach((current, idx, arr) => {
		next1 = arr[idx + 1];
		next2 = arr[idx + 2];
		if(prev1 && next1) {
			
			dt = Math.log10(next1[x] / current[x]);
			// dt = Math.log(next1[x] / current[x]);

			current[y + "'"] = (next1[y] - prev1[y]) / (2*dt);
			current[y + "''"] = (next1[y] - (2 * current[y]) + prev1[y]) / (dt*dt);
			current[y + "'''"] = (next2 && prev2) && (next2[y] - 2*next1[y] + 2*prev1[y] - prev2[y]) / 2*(dt*dt*dt);

			current["d" + y] = current[y] - prev1[y];
			current["d" + y + "'"] = current[y + "'"] - prev1[y + "'"];
			current["d" + y + "''"] = current[y + "''"] - prev1[y + "''"];
			current["d" + y + "'''"] = current[y + "'''"] - prev1[y + "'''"];
		}
		prev2 = prev1;
		prev1 = current;
	});
}
function calc_dH(vars, stage) {
	var ms = (stage !== undefined ? vars.stages[stage] : vars).measurements;
	var min = ms[0].z;
	var max = ms.length ? ms[ms.length - 1].z : undefined;

	return max === undefined ? 0 : max - min;
}
function calc_T(d50, dA, dB, tA, tB) {
	return Math.pow(10, ((d50 - dA) / (dB - dA)) * Math.log10(tB / tA) + Math.log10(tA));
}

/* Setup (must be called in same order) */
function setup_measurements_1(vars, measurements) {
	vars.measurements = measurements.filter(_ => _.length).map(values => {
		var obj = {};
		vars.columns.forEach((key, index) => obj[key] = parseValue(values[index]));
		
		obj.stage = Math.round(10 * (obj[key_s] - 1));
		obj.seconds = obj[key_t];
		obj.minutes = obj.seconds / 60;
		obj.hours = obj.seconds / (60 * 60);
		obj.days = obj.seconds / (24 * 60 * 60);
		obj.secondsT = obj[key_T];
		obj.daysT = obj.secondsT / (24 * 60 * 60);
		obj.z = obj[key_d];
		
		obj.minutes_sqrt = Math.sqrt(obj.minutes);
		obj.minutes_log10 = Math.log10(obj.minutes || treatZeroAs);
		obj.days_log10 = Math.log10(obj.days || treatZeroAs);

		return obj;
	});

}
function setup_variables_1(vars, headerValue) {
	vars.G = 9.81 * 1000;
	vars.pw = 1.00; //(assumed value; note that water density may vary due to temperature)
/*- read variables from header information */
	vars.ps = headerValue("Specific Gravity (kN");
	vars.H = headerValue("Initial Height (mm)");
	vars.D = headerValue("Initial Diameter (mm)");
	vars.m = headerValue("Initial mass (g)");
	vars.md = headerValue("Initial dry mass (g)");
	vars.mf = headerValue("Final Mass");
	vars.mdf = headerValue("Final Dry Mass");
	vars.temperature = headerValue("Temperatuur") || 10;
/*- initialize and calculate some more variables (see documentation `#VA-20201218-3`) */
	vars.V = Math.PI * (vars.D/2) * (vars.D/2) * vars.H;
	vars.y = vars.m / (Math.PI / 4 * vars.D * vars.D * vars.H) * vars.G;
	vars.yd = vars.md / (Math.PI / 4 * vars.D * vars.D * vars.H) * vars.G;
	vars.w0 = (vars.m - vars.md) / vars.md * 100;
	vars.pd = vars.yd / (vars.G/1000);
	vars.e0 = (vars.ps / vars.pd) - 1;
	vars.Sr = (vars.w0 * vars.ps) / (vars.e0 * vars.pw);
	vars.dH = calc_dH(vars);
/*- initial vars */
	vars.Hi = vars.H;
	vars.Vi = vars.V;
	vars.yi = vars.y;
	vars.ydi = vars.yd;
	vars.pdi = vars.pd;
	vars.ei = vars.e0;
	vars.Sri = vars.Sr;
/*- final vars */
	vars.Hf = vars.H - vars.dH;
	vars.Vf = Math.PI * (vars.D/2) * (vars.D/2) * vars.Hf;
	vars.yf = vars.mf / (Math.PI / 4 * vars.D * vars.D * vars.Hf) * vars.G;
	vars.ydf = vars.mdf / (Math.PI / 4 * vars.D * vars.D * vars.Hf) * vars.G;
	vars.pdf = vars.ydf / (vars.G/1000);
	vars.ef = (vars.ps / vars.pdf) - 1;
	vars.wf = (vars.mf - vars.mdf) / vars.mdf * 100;
	vars.Srf = (vars.wf * vars.ps) / (vars.ef * vars.pw);
}
function setup_measurements_2(vars) {

/*- lineaire en natuurlijke rek */
	var H0 = vars.measurements[0].z; // always 0?
	vars.measurements.forEach(obj => {
		obj.EvC = (obj.z - H0) / vars.H;
		obj.EvH = -Math.log(1 - obj.EvC);
	});
	
	
	// 
}
function setup_stages_1(vars) {
	var measurements = vars.measurements;
	var length = measurements.length;
	var n_stages = Math.floor((measurements[length - 1][key_s] - 1) * 10);

	function e_(stage) {
		/*-
			Hs = H0/(1 + e0)
			ef = (Hf - Hs ) / Hs"	
			e0 = ρs/ρd - 1
			
			-e0: initial void ratio (-)
			-ef: void ratio at the end of each load stage (-)
			-H0: initial height of specimen (mm)
			-Hs: height of solids (mm)
			-ρs: particle density (density of solid particles) (Mg/m3)
			-ρd: dry particle density (Mg/m3)"
			
				H0= 20.20 mm		ρs=  2.65 Mg/m3
				γd = 10.21 kN/m3 (calculated previously)
				ρd=  γd/9.81

				ρd=  10.21 / 9.81 = 1.04 Mg/m3
				e0= 2.65/1.04 - 1 = 1.5481
				
				Hs= 20.20 / (1 + 1.5481) = 7.9275 mm
				
				Bij eind Trap 3:  Gecorrigeerd totaal vervorming: 0.8082 mm
				Hf= 20.20 - 0.8082 = 19.3918 mm 	ef= (19.3918 - 7.9275) / 13.42 = 0.8543
		*/
		var H = stage.Hf;
		var yd = vars.md / (Math.PI / 4 * vars.D * vars.D * H) * vars.G;
		var pd = yd / (vars.G / 1000);
		return vars.ps / pd - 1;
	}
	function mv_(stage) {
		/*- 
			mv = ((Hi - Hf) / Hi) * (1000 / (σ'v2 - σ'v1))	
			
			"-mv: coefficient of volume compressibility (Mpa-1)
			-Hi: height of specimen at start of load stage
			-Hf: height of specimen at end of load stage
			-σ'v2: vertical effective stress after load increment (kPa)
			-σ'v1: vertical effective stress before load increment (kPa)"			
		*/
		
		var index = vars.stages.indexOf(stage);
		if(index === vars.stages.length - 1) return NaN;
		
		var Hi = stage.Hf, Hf = vars.stages[index + 1].Hf;
		var ov1 = stage.effective, ov2 = vars.stages[index + 1].effective;
		
		return ((Hi - Hf) / Hi) * (1000 / (ov2 - ov1));
	}

	vars.stages = [];
	for(var st = 1; st <= n_stages; ++st) {
		var ms = measurements.filter(_ => _.stage === st), _;
		vars.stages.push({
			measurements: ms, 
			Hi: vars.H - ms[0][key_d],
			Hf: vars.H - ms[ms.length - 1][key_d],
			target: ms[ms.length - 1][key_st],
			effective: ms[ms.length - 1][key_as]
		});
	}
	
	vars.stages.forEach((stage, i) => {
		stage.i = i;
		stage.e0 = e_(stage);
		stage.mv = mv_(stage);
		stage.EvC = stage.measurements[stage.measurements.length - 1].EvC;
		stage.EvH = stage.measurements[stage.measurements.length - 1].EvH;
	});
}
function setup_casagrande(vars) {
	var x = "minutes", y = "y_casagrande";
/*- setup for minutes and recalculate derivatives */
	vars.measurements.forEach(m => { 
		m.x = m.minutes_log10; 
		m.y = (m.y_casagrande = m.z * 1000);
	});
	calc_derivatives(vars.measurements);

	vars.stages.forEach((stage, index) => {

	/*- determine AB & DEF */

		var measurements = stage.measurements.slice(1);
		var M = measurements;

		var last = measurements[measurements.length - 1];
		var y0 = measurements[0][y];
		var yZ = last[y];

		var idx = 0, vpnn = [], vnnp = [];
		while(measurements[idx].minutes < 150) { /*- TODO why 150 minutes?! */
			if(idx && (measurements[idx - 1]["dy'"] < 0) && (measurements[idx]["dy'"] > 0)) {
				// vpnn.push(measurements[idx]);
				vpnn.push(idx);
			}
			idx++;
		}
		while(idx < measurements.length) {
			if(idx && (measurements[idx - 1]["dy'"] > 0) && (measurements[idx]["dy'"] < 0)) {
				// vpnn.push(measurements[idx]);
				vnnp.push(idx);
			}
			idx++;
		}
		
		var calc_CG = (stage) => {
			var guides = [], trendLines = [];
			
			var X = {//js.get("casagrande.AB_DEF_X", stage) || {
				ab1: vpnn[1], ab2: vpnn[3], 
				def1: vnnp[0], def2: measurements.length - 1
			};
			
			var ab =  [M[X.ab1], M[X.ab2]];
			var def = [M[X.def1], M[X.def2]];

			var overrides = js.get("overrides.casagrande.stage" + index + ".lines", vars);
			if(overrides) {
				if(overrides.AB) {
					ab = [
						{minutes: overrides.AB.initialXValue, y_casagrande: overrides.AB.initialValue},
						{minutes: overrides.AB.finalXValue, y_casagrande: overrides.AB.finalValue},
					];
				}
				if(overrides.DEF) {
					def = [
						{minutes: overrides.DEF.initialXValue, y_casagrande: overrides.DEF.initialValue},
						{minutes: overrides.DEF.finalXValue, y_casagrande: overrides.DEF.finalValue},
					];
				}
			}

			var AB = log_line_calc( ab[0][x], ab[1][x],  ab[0][y], ab[1][y] );
			var DEF = log_line_calc( def[0][x], def[1][x],  def[0][y], def[1][y] );
	
		/*- determine d100 */
	
			var AB_DEF = log_line_intersect( 
				ab[0][x], ab[0][y],  ab[1][x], ab[1][y],
				def[0][x], def[0][y],  def[1][x], def[1][y] );
				
			var d100 = AB_DEF.sN1N2.y;
	
			/*- Bepaal vervolgens de samendrukking van het proefstuk die overeenkomt met 0 % consolidatie door twee tijden in het begin-gedeelte van de kromme te seleceteren die een verhouding van 1 op 4 bezitten (t, en t4; bijvoorbeeld 0,25 en 1 min).
			De grootste waarde van de samendrukking bij deze twee tijden moet groter zijn dan een
			kwart maar minder dan de helft van de totale samendrukking voor de desbetreffende
			belasting. De samendrukking van de 0 % consolidatie (d) is gelijk aan de samendrukking
			(a) die optreedt bij de kleinst gekozen tijd, verminderd met het verschil (b - a) in samendrukking van de twee gekozen tijdstippen. Met andere "woorden": d = a - (b -a).*/
	
			/*- determine 25-50% samendrukking => boundaries Y (min-max) */
			var min, max, delta;	
			measurements.forEach(m => {
				if(min === undefined || min > m[y]) min = m[y];
				if(max === undefined || max < m[y]) max = m[y];
			});
			delta = max - min;
				
			/*- 25-50% boundaries */
			var b25 = y0 + 0.25 * delta;
			var b50 = y0 + 0.5 * delta;
			
			/*- find two measurements */
			var t4 = measurements.find(value => value[y] > b25);
			var t1 = measurements.find(value => t4 && value.minutes >= t4.minutes / 4);
			
			var d0 = t4 && t1 ? (t1[y] - (t4[y] - t1[y])) : NaN;
			var d50 = (d0 + d100) / 2; 
	
			guides.push({
				label: "0%", position: "right",
				value: d0, dashLength: 1,
				lineAlpha: 0.75, inside: true
			}, {
				label: "50%", position: "right",
				value: d50, dashLength: 1,
				lineAlpha: 0.75, inside: true
			}, {
				label: "100%", position: "right",
				value: d100, dashLength: 1,
				lineAlpha: 0.75, inside: true
			}, {
				label: "25-50%", position: "left", 
				value: b25, dashLength_: 2, lineColor: "green",
				toValue: b50, fillColor: "green", fillAlpha: 0.05,
				lineAlpha: 0, inside: true
			});
			
			t1 && guides.push({
				label: "t1", position: "bottom",
				value: t1[x], dashLength: 2, lineColor: "orange",
				lineAlpha: 0.35, inside: true
			});
			t4 && guides.push({
				label: "4t1", position: "bottom",
				value: t4[x], dashLength: 2, lineColor: "orange",
				lineAlpha: 0.35, inside: true
			});
	
			// Y = Math.log(1 / AB.b) / Math.log(AB.g);
			trendLines.push({
				// initialXValue: AB.b * Math.pow(AB.g, ix), initialValue: ix,
				initialXValue: 1, initialValue: Math.log(1 / AB.b) / Math.log(AB.g),
				finalXValue: AB.b * Math.pow(AB.g, yZ), finalValue: yZ,
				lineColor: "red", lineThickness: 1, editable: true
			}, {
				// initialXValue: DEF.b * Math.pow(DEF.g, 0), initialValue: 0,
				initialXValue: 1, initialValue: Math.log(1 / DEF.b) / Math.log(DEF.g),
				finalXValue: DEF.b * Math.pow(DEF.g, yZ), finalValue: yZ,
				lineColor: "green", lineThickness: 1, editable: true
			});
		
			var dt1 = def[0][x], dt2 = def[1][x];
			var d1 = def[0][y] / 1000, d2 = def[1][y] / 1000;
			var Calpha = ((d2 - d1) / vars.Hi) / Math.log10(dt2 / dt1);
		
			var t50, i50 = measurements.findIndex(m => m[y] >= d50);
			var t100, i100 = measurements.findIndex(m => m[y] >= d100);
	
			if(i50 > 0) t50 = calc_T(d50, measurements[i50 - 1][y], measurements[i50][y], measurements[i50 - 1][x], measurements[i50][x]);
			if(i100 > 0) t100 = calc_T(d50, measurements[i100 - 1][y], measurements[i100][y], measurements[i100 - 1][x], measurements[i100][x]);
	
			stage.casagrande = {
				d0: d0,
				d50: d50,
				d100: d100,
				
				min: min,
				max: max,
				delta: delta,
				
				AB: AB,
				DEF: DEF,
				AB_DEF: AB_DEF,
				// AB_DEF_X: X,
	
				guides: guides, trendLines: trendLines,
				update() { calc_CG(stage); },
				
				vpnn: vpnn,
				vnnp: vnnp,
				
				Calpha: Calpha,
				t50: t50 ? [t50 * 60, t50, d50] : [],
				t100: t100 ? [t100 * 60, t100, d100] : [],
	
				t1: t1, '4t1': t4,
				dt1: dt1, dt2: dt2, 
				mt1: def[0], mt2: def[1],
				
				d1: d1, d2: d2
			};
		};
		
		calc_CG(stage);
	});
}
function setup_taylor(vars) {
	
	/*- setup for Taylor-minutes */
	vars.measurements.forEach(m => { 
		m.x = m.minutes_sqrt;
		m.y = (m.y_taylor = m.z * 1000); 
	});

	vars.stages.forEach(stage => {
		var measurements = stage.measurements.slice(0);
		var last = measurements[measurements.length - 1];
		var yZ = last.y;
		
		var min, max, delta;
		/* determine boundaries Y (min-max) */
		measurements.forEach(obj => {
			if(min === undefined || min > obj.y) min = obj.y;
			if(max === undefined || max < obj.y) max = obj.y;
		});
		delta = max - min;

		/* 10-40% boundaries */
		var h10 = min + 0.1 * delta;
		var h40 = min + 0.4 * delta;

		function calc_Taylor(stage) {

			vars.measurements.forEach(m => { 
				m.x = m.minutes_sqrt;
				m.y = (m.y_taylor = m.z * 1000); 
			});

			var guides = [], trendLines = [];
			var measurements10_40, line;
			if((line = js.get(js.sf("overrides.taylor.stage%d.lines.Qq", stage.i), vars))) {
				/* adjust based on overrides */
				measurements10_40 = [{
					x: line.initialXValue,
					y: line.initialValue
				}, {
					x: line.finalXValue,
					y: line.finalValue
				}];
		 	} else {
				/*- filter measurements within 10-40% boundary */
		 		measurements10_40 = measurements.filter(obj => obj.y > h10 && obj.y < h40);
		 	}
	
			/*- is it possible? */
			if(measurements10_40.length < 2) {
				/*- fallback to the first two measurements */
				measurements10_40 = measurements.slice(0, 2);
			}
	
			if(measurements10_40.length >= 2) {
				/*- YES: determine slope of 10-40% boundary */
				var dx, dy;
	
				dx = measurements10_40[measurements10_40.length - 1].x - measurements10_40[0].x;
				dy = measurements10_40[measurements10_40.length - 1].y - measurements10_40[0].y;
				
				var slope = dy / dx;
	
				/*- find intersection with Y-axis (Q) - make up a line with (delta1_25_x) */
				var y0 = measurements10_40[0].y - measurements10_40[0].x * slope;
				var delta1_25_x = (1.25 * delta) / slope;
				/* just in case */			
				stage.taylor = {
					t50: [],
					t90: [],
					update() { calc_Taylor(stage); }
				};

// logger.print(js.sf("Stage %d: delta1_25_x = %s", stage.i, delta1_25_x), { y0: y0, measurements10_40: measurements10_40, slope: slope, trendLines: trendLines});

				trendLines.push({
						/*- Q -> a */
						initialXValue: 0, initialValue: y0,
						finalXValue: delta1_25_x, finalValue: y0 + delta * 1.25,
						lineColor: "red	", lineThickness: 1
					}, {
						/*- measurement used for slope */
						initialXValue: measurements10_40[0].x, initialValue: measurements10_40[0].y,
						finalXValue: measurements10_40[measurements10_40.length - 1].x, finalValue: measurements10_40[measurements10_40.length - 1].y,
						lineColor: "red", lineThickness: 3, editable: true
					}, {
						/* 1.15 line */
						initialXValue: 0, initialValue: y0,
						finalXValue: delta1_25_x * 1.15, finalValue: y0 + delta * 1.25,
						lineColor: "red", lineThickness: 1, dashLength: 3
					});
				guides.push({
					label: "0%", position: "right",
					value: y0, dashLength: 1,
					lineAlpha: 0.75, inside: true
				});
				
		/* find intersection with curve (B) @ 90% consolidation */
	
			/*- start with point on 1.15 line where Y=top of 10-40% boundary */
				var sy1 = measurements10_40[1].y;
				var sx1 = (sy1 - y0) / slope * 1.15;
			/*- find position in curve (all) */
				var minutes = sx1 * sx1;
				var position;// = Math.floor(minutes * 2); // TODO this assumes a 30 second interval
				for(position = 0; position < measurements.length && measurements[position].minutes < minutes; ++position) ;

			/*- bail out when needed... */				
				if(position >= measurements.length) {
					return undefined;
				}
	
			/*- find end point on 1.15 line */
				var sy2 = measurements[position].y;
				var sx2 = (sy2 - y0) / slope * 1.15;
			/*- ...where line crosses (ie. dsx2 > 0)*/	
				var dsx = sx2 - (measurements[position].x);
				var passed = [[dsx, measurements[position], {x: sx2, y: sy2}]];
				while(dsx > 0 && position < measurements.length - 1) {
					position++;
					
					sy2 = measurements[position].y;
					sx2 = (sy2 - y0) / slope * 1.15;					
					
					dsx = sx2 - (measurements[position].x);
					passed.unshift([dsx, measurements[position], {x: sx2, y: sy2}]);
				}
					
				if(passed.length == 1) {
					passed.push(passed[0]);
				}
	
							
			/*- get intersection (B) page 24 */
				var B = line_intersect(
						passed[0][2].x, passed[0][2].y, passed[1][2].x, passed[1][2].y,
						passed[0][1].x, passed[0][1].y, passed[1][1].x, passed[1][1].y
					) || passed[0][1];
					
				if(B) {
					trendLines.push({
						initialXValue: B.x, initialValue: 0,
						finalXValue: B.x, finalValue: B.y,
						lineColor: "red"
					});
					guides.push({
						label: "50%", position: "right",
						value: y0 + ((B.y - y0) / 90) * 50, 
						dashLength: 1, lineAlpha: 0.75, inside: true
					}, {
						label: "90%", position: "right",
						value: B.y, dashLength: 1,
						lineAlpha: 0.75, inside: true
					}, {
						label: "100%", position: "right",
						value: y0 + ((B.y - y0) / 90) * 100, 
						dashLength: 1, lineAlpha: 0.75, inside: true
					}, {
						label: "10-40%", position: "left",
						value: h10, toValue: h40,
						fillColor: "green", fillAlpha: 0.05,
						lineAlpha: 0, inside: true
					});
				}
					
				/*- debug/helpers, showing which lines determine intersection */
				trendLines.push({
					initialXValue: sx1, initialValue: sy1,
					finalXValue: sx2, finalValue: sy2,
					lineColor: "blue", lineThickness: 1, dashLength: 1
				// }, {
				// 	initialXValue: passed[0][1].x, initialValue: 0,
				// 	finalXValue: passed[0][1].x, finalValue: passed[0][1].y,
				// 	lineColor: "green", _dashLength: 2, lineThickness: 2
				// }, {
				// 	initialXValue: passed[0][2].x, initialValue: 0,
				// 	finalXValue: passed[0][2].x, finalValue: passed[0][2].y,
				// 	lineColor: "orange", _dashLength: 2
				// }, {
				// 	initialXValue: passed[1][1].x, initialValue: 0,
				// 	finalXValue: passed[1][1].x, finalValue: passed[1][1].y,
				// 	lineColor: "green", _dashLength: 2, lineThickness: 2
				// }, {
				// 	initialXValue: passed[1][2].x, initialValue: 0,
				// 	finalXValue: passed[1][2].x, finalValue: passed[1][2].y,
				// 	lineColor: "orange", _dashLength: 2
				});
						
			/* find intersection with curve @ 50% consolidation */
				var xy50, y50 = y0 + ((B.y - y0) / 90) * 50;
			/*- find position in curve (measurements) */
				position = 0;
				while(measurements[position].y < y50 && position < measurements.length - 1) {
					position++;
				}
				if(position > 0 && position < measurements.length - 2) {
					dx = measurements[position].x - measurements[position - 1].x;
					dy = measurements[position].y - measurements[position - 1].y;
					xy50 = {
						x: measurements[position].x - (measurements[position].y - y50) * (dx / dy), 
						y: y50
					};
				}
				stage.taylor = {
					trendLines: trendLines, guides: guides,
					
					min: min, max: max, delta: delta,
					h10: h10, h40: h40,
					
					B: B,
					measurements10_40: measurements10_40,
	
					t50: [xy50 ? 60 * (xy50.x * xy50.x) : undefined, xy50 && xy50.x, y50],
					t90: [60 * (B.x * B.x), B.x, B.y],
					
					update() { calc_Taylor(stage); }
					
				};
			}
		}
		
		calc_Taylor(stage);
	});
}
function setup_bjerrum(vars) {
	// everything is already setup except for poriengetal (e)

	var points_e, points_rek, LLi_e, LLi_rek;
	var data_e = vars.stages.map(stage => ({ x: stage.target, y: stage.e0 }));
	var data_rek = vars.stages.map(stage => ({ x: stage.target, y: stage.EvC }));
	
	if((points_e = js.get("overrides.bjerrum_e.points_pg", vars))) {
		LLi_e = log_line_intersect(
			points_e[0].x, points_e[0].y, points_e[1].x, points_e[1].y, 
			points_e[2].x, points_e[2].y, points_e[3].x, points_e[3].y);
	} else {
		LLi_e = log_line_intersect(
			data_e[0].x, data_e[0].y, data_e[1].x, data_e[1].y, 
			data_e[2].x, data_e[2].y, data_e[3].x, data_e[3].y);
	}
	
	if((points_rek = js.get("overrides.bjerrum_r.points_pg", vars))) {
		LLi_rek = log_line_intersect(
			points_rek[0].x, points_rek[0].y, points_rek[1].x, points_rek[1].y, 
			points_rek[2].x, points_rek[2].y, points_rek[3].x, points_rek[3].y);
	} else {
		LLi_rek = log_line_intersect(
			data_rek[0].x, data_rek[0].y, data_rek[1].x, data_rek[1].y, 
			data_rek[2].x, data_rek[2].y, data_rek[3].x, data_rek[3].y);
	}

	vars.bjerrum = {
		data_e: data_e, 
		points_e: points_e,
		LLi_e: LLi_e, 
		data_rek: data_rek, 
		points_rek: points_rek,
		LLi_rek: LLi_rek
	};
}
function setup_isotachen(vars) {
	var LLi_e, points;
	var data = vars.stages.map(stage => ({ x: stage.target, y: stage.EvH }));
	
	if((points = js.get("overrides.isotachen.points_pg", vars))) {
		LLi_e = log_line_intersect(
			points[0].x, points[0].y, points[1].x, points[1].y, 
			points[2].x, points[2].y, points[3].x, points[3].y);
	} else {
		LLi_e = log_line_intersect(
			data[0].x, data[0].y, data[1].x, data[1].y, 
			data[2].x, data[2].y, data[3].x, data[3].y);
	}
	
	/* for the values of the c-parameter, the curve (EvH log t) should be considered */
	var x = "minutes", y = "y_isotachen_c";

	/*- for each stage determine the slope for c */
	vars.stages.forEach((stage, index) => {
		function calc() {

			/*- setup for minutes and recalculate derivatives */
			vars.measurements.forEach(m => { 
				m.x = m.minutes_log10; 
				m.y = (m[y] = m.EvH * 100);
			});
			calc_derivatives(vars.measurements, "y_isotachen_c");

			var measurements = stage.measurements.slice(1);
			var last = measurements[measurements.length - 1];
			var y0 = measurements[0][y];
			var yZ = last[y];

		/*- determine DEF */
			var idx = 0, vpnn = [], vnnp = [];
			while(measurements[idx].minutes < 150) { /*- TODO why 150 minutes?! */
				if(idx && (measurements[idx - 1]["dy_isotachen_c'"] < 0) && (measurements[idx]["dy_isotachen_c'"] > 0)) {
					vpnn.push(measurements[idx]);
				}
				idx++;
			}
			while(idx < measurements.length) {
				if(idx && (measurements[idx - 1]["dy_isotachen_c'"] > 0) && (measurements[idx]["dy_isotachen_c'"] < 0)) {
					vnnp.push(measurements[idx]);
				}
				idx++;
			}

			var guides = [], trendLines = [], def;
			var overrides = js.get("overrides.isotachen.stage" + index + ".lines", vars);
			if(overrides) {
				if(overrides.DEF) {
					def = [{
						minutes: overrides.DEF.initialXValue, 
						y_isotachen_c: overrides.DEF.initialValue,
					}, {
						minutes: overrides.DEF.finalXValue,
						y_isotachen_c: overrides.DEF.finalValue
					}];
				}
			} else {
				def = [vnnp[0], last];
			}

			var DEF = log_line_calc( def[0][x], def[1][x], def[0][y], def[1][y] );
			trendLines.push({
				initialXValue: 1, initialValue: Math.log(1 / DEF.b) / Math.log(DEF.g),
				// finalXValue: 1400, finalValue: Math.log(1400 / DEF.b) / Math.log(DEF.g),
				// initialXValue: DEF.b * Math.pow(DEF.g, 0), initialValue: 0,
				finalXValue: DEF.b * Math.pow(DEF.g, yZ), finalValue: yZ,
				lineColor: "red", lineThickness: 1, editable: true
			});

			var dt1 = vnnp[0][x], dt2 = last[x];
			var d1 = vnnp[0][y], d2 = last[y];
	
			var c = (d2 - d1) / Math.log10(dt2 / dt1);

			stage.isotachen = {
				DEF: DEF,
				guides: guides, 
				trendLines: trendLines,
				
				// c: c,

				d1: d1, d2: d2,
				dt1: dt1, dt2: dt2, 
				mt1: vnnp[0], mt2: last,

				update: function() { calc(); }
			};
		}
		calc();
	});

	vars.isotachen = { data_e: data,  LLi_e: LLi_e, points_e: points };
}
function setup_koppejan(vars) { 
	/*- initialize y attribute */
	vars.measurements.forEach(m => {
		m.x2 = m[key_as];
		m.y = (m.y_koppejan = m[key_d]); // reset because of Taylor/CG
		m.trap = "Trap-" + m.stage;
	});
	
	/*- ignore the 1st ... */
	var measurements = vars.measurements.slice(1);

	var serie2, slopes = [], x = key_t, y = key_d;
	var slope_variant = 2;
	var rlines = [];

	// serie2 references only the (7) points where y2 are set, and will it's z10, z100, z1000, z10000 values will be calculated later on (refrerences the last measurements of each stage)
	serie2 = vars.stages.map(stage => stage.measurements[stage.measurements.length - 1]);
	serie2.forEach(m => m.y2 = m[key_as]); // koppejan

	/*- determine for each stage its slope-info (rc, np) - based on measurements 
		(which are "verschoven" already based upon previous rc/np/stage) */
	vars.stages.forEach((stage, s) => {
		/* select all measurements for the current stage s+1 (NOTE: s starts at 0) */
		var z1 = measurements.filter(_ => _.stage === (s + 1));
		
		/* register the slope */
		var slope = {
			stage: s + 1,
			measurements: z1,
			last: z1[z1.length - 1],
			/* do a linear regression for log10(t - t1) and the "verschoven zetting" (if available otherwise use [y]) */
			regression_linear: regression.linear(z1.slice(15).map(m => [
				Math.log10(m.days), m.vz0 || m[y]
			]), { precision: 9 } )
		};

		/* copy lr info to slope */
		var rl = slope.regression_linear;
		slope.rc = rl.equation[0];
		slope.np = rl.equation[1];
		slopes.push(slope);

		/* extrapolate next stage */
		if(s < vars.stages.length - 1) {
			/* select all measurements for the next stage s+2 (NOTE: s starts at 0) */
			var z2 = measurements.filter(_ => _.stage === (s + 2));
			var t1 = (s + 1); // end of current stage / begin next stage in days

			/* for each measurement of the next stage... */
			z2.forEach((obj, i) => {
				if(!i) return; // skip the first (t - t1 === 0)
				
				var t = obj.daysT; // time in days since begin of Test (> t1)
				// record stage_time in attribute x[stage_number] so that it can be used to plot the extrapolated stages 
				obj['x' + (s + 3)] = (t - t1) || treatZeroAs;
				
				// superpositiebeginsel: vz2(ta-t1) = z1(ta-t1) + z2(ta-t1).
				obj.z1 = slope.np + slope.rc * Math.log10(t); // previous stages extrapolated
				obj.z2 = obj[y] - obj.z1; // (actual measurement) - z1 => z2

				// calculate "verschoven zetting" 
				obj.vz0 = obj[y];
				slopes.slice(0, s + 1).forEach((slope, i) => {
					/* 2021/04/27 s.paznoriega@gmail.com
						- vz4(t-3) 
							= z(t)	+ rc1 log((t-1) / (t-0))
									+ rc2 log((t-2) / (t-1)) 
									+ rc3 log((t-3) / (t-2))
						- vz3(t-2) 
							= z(t)	+ rc1 log((t-1) / (t-0))
									+ rc2 log((t-2) / (t-1)) 
						- vz2(t-1) 
							= z(t)	+ rc1 log((t-1) / (t-0))

					 * CUR pagina 41
						= z(t)  + rc1 (log(t-t1) - log(t)) 
        						+ rc2 (log(t-t2) - log(t-t1)) 
        						+ rc3 (log(t-t3) - log(t-t2)) 	
        						
						= z(t)	+ rc1·[log (t-t1) - log(t)] 
								+ rc2·[log (t-t2) - log(t-t1)] 
								+ rc3·[log (t-t3) - log(t-t2)] 
								+ .. 
								+ rc(n-2)·[log(t-t(n-2)) - log(t-tn-3)]
								+ rc(n-1)·[log(t-t(n-1)) - rc(n-1)·log(t-t(n-2))] <<< ????
					*/
					obj.vz0 += (obj['vz0_'+(i+1)] = slope.rc * (Math.log10( (t-(i+1)) / (t-i))));
					// obj.vz0 += (obj['vz0_'+(i+1)] = slope.rc * (Math.log10( (t-i) / (t-(i+1)))));
				});
			});
		}
	});

	// calculate "geëxtrapoleerde zetting"

	function calc_KJ() {
		var LLi_1, points;	
		var trendLines = slopes.map((S, i, slopes) => {
	
			function extrp(n, days) {
				/* 2021/04/27 SPN:
				    - extrp4(t-3) 
					    = np4	+ rc1 log((t-0) / (t-1)) 
					    		+ rc2 log((t-1) / (t-2)) 
					    		+ rc3 log((t-2) / (t-3)) 
					    		+ rc4 log((t-3))
					- extrp3(t-2) 
						= np3	+ rc1 log((t-0) / (t-1)) 
								+ rc2 log((t-1) / (t-2))
								+ rc3 log((t-2))
					- extrp2(t-1)
						= np2	+ rc1 log((t-0) / (t-1)) 
								+ rc2 log((t-1))
					- extrp1(t-0)
						= np1	+ rc1 log((t-0))
				 * CUR pagina 41 
					= npn	+ rc1 * [log (t) - log (t-t1)]
							+ rc2 * [log (t-t1) - log (t-t2)]
							+ .... 
							+ rc(n-1) * [log (t-t(n-2)) - log (t-t(n-1))]
							+ rc(n) *    log (t-t(n-1))
				*/
				var ez = S.np; // S is the current slope
				if(n >= 1) {
					if(n) days += (n - 1); // TODO avoids dividing by 0
					slopes.slice(0, n - 1).forEach((slope, i) =>  // loops through previous slopes/stages
						ez += slope.rc * (Math.log10( ((days - i) / (days - (i + 1)) )))
					);
				}
				return (ez += S.rc * Math.log10(days));
			}
	
			serie2[i].ez1 = extrp(i, 1);
			serie2[i].ez10 = extrp(i, 10);
			serie2[i].ez100 = extrp(i, 100);
			serie2[i].ez1000 = extrp(i, 1000);
			serie2[i].ez10000 = extrp(i, 10000);
			
			// serie2[i].vz1 = S.np + S.rc * Math.log10(1);
			// serie2[i].vz10 = S.np + S.rc * Math.log10(10);
			// serie2[i].vz100 = S.np + S.rc * Math.log10(100);
			// serie2[i].vz1000 = S.np + S.rc * Math.log10(1000);
			// serie2[i].vz10000 = S.np + S.rc * Math.log10(10000);
			
			return [{
				initialXValue: 1, initialValue: S.np,
				finalXValue: 20, finalValue: S.np + S.rc * Math.log10(20),
				lineAlpha: 1, lineColor: "black", dashLength: 3
			}];
		});
		if((points = js.get("overrides.koppejan.points_pg", vars))) {
			points.forEach(m => { m.y_koppejan = m.y; });
			LLi_1 = log_line_intersect(
					points[0].x, points[0].y_koppejan, points[1].x, points[1].y_koppejan, 
					points[2].x, points[2].y_koppejan, points[3].x, points[3].y_koppejan);
		} else {
			serie2.forEach(m => m.y = (m.y_koppejan = m[key_d])); // reset
			LLi_1 = log_line_intersect(
					serie2[0].x2, serie2[0].y_koppejan, serie2[1].x2, serie2[1].y_koppejan, 
					serie2[2].x2, serie2[2].y_koppejan, serie2[3].x2, serie2[3].y_koppejan);
		}
		
		if(points) {
			trendLines.push({
				initialXValue: points[0].x, initialValue: points[0].y,
				finalXValue: points[1].x, finalValue: points[1].y,
				lineColor: "red", editable: true
			}, {
				initialXValue: points[2].x, initialValue: points[2].y,
				finalXValue: points[3].x, finalValue: points[3].y,
				lineColor: "red", editable: true
			});
		} else {
			trendLines.push({
				initialXValue: serie2[1].x2,  initialValue: serie2[1].y,
				finalXValue: LLi_1.b1 * Math.pow(LLi_1.g1, serie2[2].y),
				finalValue: serie2[2].y,
				lineColor: "red", editable: true
			}, {
				initialXValue: LLi_1.b2 * Math.pow(LLi_1.g2, serie2[0].y),
				initialValue: serie2[0].y,	
				finalXValue: serie2[2].x2, finalValue: serie2[2].y,
				lineColor: "red", editable: true
			});
		}
	
		trendLines.push({
			initialXValue: LLi_1.sN1N2.x, initialValue: LLi_1.sN1N2.y,
			finalXValue: LLi_1.sN1N2.x, finalValue: 0,
			lineColor: "red", lineAlpha: 0.25,
			dashLength: 2
		}, {
			initialXValue: LLi_1.sN1N2.x, initialValue: LLi_1.sN1N2.y,
			finalXValue: 1000, finalValue: LLi_1.sN1N2.y,
			lineColor: "red", lineAlpha: 0.25,
			dashLength: 2
		});
	
		vars.koppejan = {
			serie2: serie2,
			slopes: slopes,
			LLi_1: LLi_1,
			trendLines: trendLines.flat(),
			point_pg: points,
			regression: regression,
			update() { calc_KJ(); }
		};
		
		/*- calculate Cp, Cs, C, C10, ...  */
	
		var cp, Pg = LLi_1.sN1N2.x, sig = key_as;
		vars.stages.forEach((stage, st) => {
			/* 1. 1/Cp = d Ev / ln( ov + dov / ov )	*/
			stage.koppejan = slopes[st];
	
			if(st === vars.stages.length - 1) return;
			
			var d = Math.log(serie2[st + 1][sig] / serie2[st + 0][sig]);
			var d10 = Math.log10(serie2[st + 1][sig] / serie2[st + 0][sig]);
			var H = vars.Hi;
	
			var Cp = 1 / (((serie2[st + 1].ez1 - serie2[st + 0].ez1) / H) / d);
			var Cs = 1 / (((serie2[st + 1].ez10 - serie2[st + 0].ez10) / H) / d - (1 / Cp));
			var C = (1 / ((serie2[st + 1].y - serie2[st + 0].y) / H)) * d;
			var C10 = (1 / ((serie2[st + 1].y - serie2[st + 0].y) / H)) * d10;
	
			slopes[st].Cp = Cp;
			slopes[st].Cs = Cs;
			slopes[st].C = C;
			slopes[st].C10 = C10;
		});
	}
	
	calc_KJ();
}
function setup_stages_2(vars, only_this_stage) {

	function CvT_(stage, wantsTaylor) {
		/*- 	
			TAYLOR
		
				-L: length of drainage path = 0.5*H (half of the specimen height of drainage from both ends) (m)
				-t90: time to 90% primary consolidation (s)
				-fT: temperature correction factor.
				
				GEGEVENS (VAN TRAP 3)
				H0= 20.20 mm
				Gecorrigeerd totaal vervorming voor begin Trap 3: 0.4998 mm
				Proeftemperatuur= 10 oC
				Temperatuurcorrectie fT voor referentietemperatuur van 20 oC (zie figuur B.5 NEN-EN-ISO 17892-5) = 1.3
				√t90 (Geschat)= 40 s
				
				Hi = 20.20 - 0.4998 = 19.7002 mm
				L = 0.50 * 19.7002 = 9.8501 mm = 9.8501 x 10-3 m )
				t90 = 402 = 1600 s2
				
				cv;20 =0.848 * 0.00985012 * 1.3 / 1600 = 6.68 x 10-8 m2/s"					
		
			CASAGRANDE
		
				"-L: length of drainage path = 0.5*H (half of the specimen height of drainage from both ends) (m)
				-t50: time to 50% primary consolidation (s)
				-fT: temperature correction factor."	
				
				"GEGEVENS (VAN TRAP 3)
				H0= 20.20 mm
				Gecorrigeerd totaal vervorming voor begin Trap 3: 0.4998 mm
				Proeftemperatuur= 10 oC
				Temperatuurcorrectie fT voor referentietemperatuur van 20 oC (zie figuur B.5 NEN-EN-ISO 17892-5) = 1.3
				log t50 (Geschat)= 2 (zie Opmerkingen)

				cv;20 = 0.197 * L2 * fT / t50			
				
				Hi = 20.20 - 0.4998 = 19.7002 mm
				L = 0.50 * 19.7002 = 9.8501 mm = 9.8501 x 10-3 m
				t50 = 10logt50 = 102 = 100 s
				
				cv;20 =0.197 * 0.00985012 * 1.3 / 100 =2.48 x 10-7 m2/s"					
		*/
		var L = 0.5 * stage.Hi; 
		var fT = 1, cf = wantsTaylor ? 0.848 : 0.197;
		var t = wantsTaylor ? stage.taylor.t90[0] : stage.casagrande.t50[0];
		return t !== undefined ? cf * (L*L / (1000*1000)) * fT / t : t;
	}
	function kT_(stage, wantsTaylor) {
		var r = CvT_(stage, wantsTaylor) * stage.mv * vars.pw * vars.G;
		return isNaN(r) ? undefined : r;
	}
	
	function Cc_(stage) {
		/*-
			Cc (primaire) = -Δe / log ((σ'v + Δσ'v)/σ'v)
			
			- Δe= e2 - e1: change in void ratio 
			- σ'v: vertical effective stress before load increment (kPa)
			- σ'v + Δσ'v: vertical effective stress after load increment Δσ'v (kPa)"

			GEGEVENS (Data from steepest e-log p segment) 
			- e1= 1.4461 === segment with smallest slope_e before decompression stage
			- e2= 1.3144 === next segment
			- σ'v1= 50 kPa
			- σ'v2= 125 kPa
		
			Cc= - (1.3144 - 1.4461) / log (125/50)
			Cc= 0.3310
		*/
		
		var index = vars.stages.indexOf(stage);
		var points = js.get("overrides.bjerrum_e.points_pg", vars);
		
		if(index === -1) {//typeof stage === "string") {
			if(points) {
				if(stage === "onder") {
					return -(points[1].y - points[0].y) / Math.log10(points[1].x / points[0].x);
				} else if(stage === "boven") {
					return -(points[3].y - points[2].y) / Math.log10(points[3].x / points[2].x);
				}	
			} else if(stage === "onder") { 
				stage = vars.stages[0]; 
			} else if(stage === "boven") {
				stage = vars.stages[2];
			}
		}

		if(index === vars.stages.length - 1) return NaN;

		var e1 = stage.e0, e2 = vars.stages[index + 1].e0;
		var sv1 = stage.effective, sv2 = vars.stages[index + 1].effective;

		return -(e2 - e1) / Math.log10(sv2 / sv1);
	}
	function Cr_(stage) {
		/*- 
			Cr (primaire herbelasting): Cr = -Δe / log ((σ'v + Δσ'v)/σ'v)
			- Δe= e2 - e1: change in void ratio 
			- σ'v: vertical effective stress before load increment (kPa)
			- σ'v + Δσ'v: vertical effective stress after load increment Δσ'v (kPa)"
			
			GEGEVENS (Data from reload e-log p segment)
			- e1= 1.3241
			- e2= 1.304
			- σ'v1= 50 kPa
			- σ'v2= 125 kPa
			
			Cr= - (1.304 - 1.3241) / log (125/50)
			Cr= 0.0505
			Waarden van poriëngetal berekend op basis van proefdata in de GDS-bestand.			
		*/
		return Cc_(stage); // is gewoon hetzelfde
	}
	function Csw_(stage) {
		return Cc_(stage);
	}

	function CR_(stage) {
		/*-
			CR = ΔεVC/ log ((σ'v + Δσ'v)/σ'v)
			- ΔεVC= εVC2 - εVC1: change in vertical linear (Cauchy) strain
			- σ'v: vertical effective stress before load increment (kPa)
			- σ'v + Δσ'v: vertical effective stress after load increment Δσ'v (kPa)"
		
			GEGEVENS (Data from steepest εvC-log p segment)
			- εvC1= 4.00%
			- εvC2= 9.17 %
			- σ'v1= 50 kPa
			- σ'v2= 125 kPa
			
			CR= (9.17 - 4.00)/100 / log (125/50)
			CR= 0.1299
		*/

		var index = vars.stages.indexOf(stage);
		var points = js.get("overrides.bjerrum_r.points_pg", vars);
		
		if(index === -1) {//typeof stage === "string") {
			if(points) {
				if(stage === "onder") {
					return -(points[1].y - points[0].y) / Math.log10(points[1].x / points[0].x);
				} else if(stage === "boven") {
					return -(points[3].y - points[2].y) / Math.log10(points[3].x / points[2].x);
				}	
			} else if(stage === "onder") { 
				stage = vars.stages[0]; 
			} else if(stage === "boven") {
				stage = vars.stages[2];
			}
		}

		if(index === vars.stages.length - 1) return NaN;
		
		var Hi = stage.Hi, Hf = stage.Hf;
		var Evc1 = stage.EvC, Evc2 = vars.stages[index + 1].EvC;
		var sv1 = stage.effective, sv2 = vars.stages[index + 1].effective;

		return (Evc2 - Evc1) / Math.log10(sv2 / sv1);
	}
	function RR_(stage) {
		return CR_(stage); // is gewoon hetzelfde
	}

	function iso_a_(stage) {
		/*- 
	
			a (voor Pg) a = ΔεVH/ Δlnσ'v
			- a: parameter ""a"" determined from 2 or more measurements (load stages) at the beginning of the test. 
			- εvH= -ln (1 - εvC) : Natural (Hencky) strain measure -σ'v: vertical effective stress 
			
			GEGEVENS (Data from first two load stages in εvH-log p segment) 
			- εvH1= 1.745 % (berekend van lineaire rek Trap 1) 
			- εvH2= 2.501 % (berekend van lineaire rek Trap 2)
			- σ'v1= 13 kPa σ'v2= 25 kPa
	
			a (voor Pg) = (2.501 - 1.745)/ 100 / ln (25/13) a (voor Pg)= 0.01156
			- Determined by the first load stages of the test. 
	
		*/

		var index = vars.stages.indexOf(stage);
		var points = js.get("overrides.isotachen.points_pg", vars);
		
		if(index === -1) {//typeof stage === "string") {
			if(points) {
				if(stage === "onder") {
					return -(points[1].y - points[0].y) / Math.log10(points[1].x / points[0].x);
				} else if(stage === "boven") {
					return -(points[3].y - points[2].y) / Math.log10(points[3].x / points[2].x);
				}	
			} else if(stage === "onder") { 
				stage = vars.stages[0]; 
			} else if(stage === "boven") {
				stage = vars.stages[2];
			}
		}

		if(index === vars.stages.length - 1) return NaN;

		var EvH1 = stage.EvH * 100;
		var EvH2 = vars.stages[index + 1].EvH * 100;
		var pv1 = stage.effective;
		var pv2 = vars.stages[index + 1].effective;
		
		return (EvH2 - EvH1) / 100 / Math.log(pv2 / pv1);
	}
	function iso_b_(stage) {
		/*-
			asw = ΔεVH/ Δlnσ'v
			- asw: parameter ""a"" determined from 2 or more measurements (load stages) during unloading.
			- εvH= -ln (1 - εvC) : Natural (Hencky) strain measure
			- σ'v: vertical effective stress "
			
			GEGEVENS (Data from unloading segment in εvH-log p plot)
			- εvH1= 9.618 % (berekend van lineaire rek Trap 4)
			- εvH2= 9.201 % (berekend van lineaire rek Trap 5)
			- σ'v1= 125 kPa
			- σ'v2= 50 kPa

			asw = (9.201 - 9.618)/ 100 / ln (50/125)
			asw= 0.00455
		*/
		return iso_a_(stage);
	}
	function iso_c_(stage) {
		/*-
			c = ΔεVH/ Δln ((t - t1)/t0)
			
			-c: creep parameter ""c""  determined from a log t - εvH plot.
			-εvH= -ln (1 - εvC) : Natural (Hencky) strain measure
			-t: time
			-t1: start time of the load step where c is being calculated
			-t0: reference time of 1 day.
			
			GEGEVENS
			(Data from Trap 7 in εvH-log t plot)
			εvH1= 14.896415 % (berekend van lineaire rek)
			εvH2= 15.466748 % (berekend van lineaire rek)
			t1= 24360 s
			t2= 86070 s
			
			c = (15.466748 - 14.896415)/ 100 / (ln 86070 - ln 24360)
			c= 0.004518
		*/

		var EvH1 = (stage.isotachen.mt1.EvH) * 100;
		var EvH2 = (stage.isotachen.mt2.EvH) * 100;

		var t1 = stage.isotachen.dt1;
		var t2 = stage.isotachen.dt2;
		
		return (EvH2 - EvH1) / 100 / (Math.log(t2 / t1));
	}
	
	function koppejan(stage) {

		var points = js.get("overrides.koppejan.points_pg", vars);
		if(!points) return NaN;
		
		var serie2 = js.get("koppejan.serie2", vars);
		if(!serie2) return NaN;

		var onder = (js.get("overrides.koppejan.label-onder", vars) || "1-2").split("-").map(_ => parseInt(_, 10) - 1);
		var boven = (js.get("overrides.koppejan.label-boven", vars) || "3-4").split("-").map(_ => parseInt(_, 10) - 1);
		
		var st = stage === "onder" ? onder : boven;
		var ob = stage === "onder" ? [0, 1] : [2, 3];

		var d = Math.log(points[ob[1]].x / points[ob[0]].x);
		var d10 = Math.log10(points[ob[1]].x / points[ob[0]].x);
		var H = vars.Hi;
		
		var Cp = 1 / (((serie2[st[1]].ez1 - serie2[st[0]].ez1) / H) / d);
		var Cs = 1 / (((serie2[st[1]].ez10 - serie2[st[0]].ez10) / H) / d - (1 / Cp));
		var C = (1 / ((points[ob[1]].y - points[ob[0]].y) / H)) * d;
		var C10 = (1 / ((points[ob[1]].y - points[ob[0]].y) / H)) * d10;

		return {	
			Cp: Cp,
			Cs: Cs,
			C: C,
			C10: C10
		};
		
	}
	
	var Cc_name = "Cc", CR_name = "CR";
	vars.stages.forEach((stage, i) => {
		if(only_this_stage !== undefined && i !== only_this_stage) return;
		
		if(i < vars.stages.length - 1) {
			if(Cc_name === "Csw") {
				Cc_name = "Cr"; CR_name = "RR";
			} else if(Cc_name === "Cr") {
				Cc_name = "Cc"; CR_name = "CR";
			} else if(stage.target > vars.stages[i + 1].target) {
				Cc_name = "Csw"; CR_name = "SR";
			}
		}
		
		stage.casagrande.cv = CvT_(stage);
		stage.casagrande.k = kT_(stage);
		stage.taylor.cv = CvT_(stage, true);
		stage.taylor.k = kT_(stage, true);
		stage.Cc_ = Cc_name;
		stage.Cc = Cc_(stage);
		stage.CR_ = CR_name;
		stage.CR = CR_(stage);
		stage.isotachen.a = iso_a_(stage);
		stage.isotachen.b = iso_b_(stage);
		stage.isotachen.c = iso_c_(stage);
		
		stage.update = (method) => {
			if(method === "all") {
				stage.casagrande.update();
				stage.taylor.update();
				stage.isotachen.update();
			}
			
			if(method === "all" || method === "bjerrum_e" || method === "bjerrum_r") {
				setup_bjerrum(vars);
				stage.Cc_ = Cc_name;
				stage.Cc = Cc_(stage);
				stage.CR_ = CR_name;
				stage.CR = CR_(stage);
			}
			
			if(method === "all" || method === "isotachen") {
				setup_isotachen(vars);
				stage.isotachen.a = iso_a_(stage);
				stage.isotachen.b = iso_b_(stage);
				stage.isotachen.c = iso_c_(stage);
			}
		};
	});
	
	vars.overrides = vars.overrides || {};
	["bjerrum_e", "bjerrum_r", "isotachen", "koppejan"].forEach(k => vars.overrides[k] = vars.overrides[k] || {});
	
	mixin(vars.overrides.bjerrum_e, {
		onder: Cc_("onder"),
		boven: Cc_("boven")
	});
	mixin(vars.overrides.bjerrum_r, {
		onder: CR_("onder"),
		boven: CR_("boven")
	});
	mixin(vars.overrides.isotachen, {
		onder: iso_a_("onder"),
		boven: iso_b_("boven")
	});
	mixin(vars.overrides.koppejan, {
		onder: koppejan("onder"),
		boven: koppejan("boven")
	});
}
function setup_variables_2(vars, headerValue) {
	vars.categories = [{
		name: "Project",
		items: [
			{ name: "Projectnummer", value: headerValue("Job reference", false) },
			{ name: "Locatie", value: headerValue("Job Location", false)  },
			{ name: "Aantal trappen", value: vars.stages.length },
			{ name: "Proef periode", value: js.sf("%s - %s", headerValue("Date Test Started", false), headerValue("Date Test Finished", false)) },
			{ name: "Beproevingstemperatuur", value: headerValue("Sample Date") || ""},
			{ name: "Opmerking van de proef", value: "" },
			// { name: "Opdrachtgever", value: "" },
			// { name: "Opdrachtnemer", value: "" },
			// { name: "Coördinaten", value: "" }
		]
	}, {
		name: "Monster",
		items: [
			{ name: "Boring", value: headerValue("Borehole", false) },
			{ name: "Monster", value: headerValue("Sample Name", false) },
			{ name: "Monstertype", value: headerValue("Specimen Type", false) },
			{ name: "Grondsoort", value: headerValue("Description of Sample", false) },
			{ name: "Diepte", unit: "m-NAP", value: headerValue("Depth", false) },

			// { name: "Opstelling nr", value: "" },
			// { name: "Laborant", value: "" },
			// { name: "Uitwerking", value: "" },
			// { name: "Proefmethode", value: "" },
			// { name: "Proefomstandigheden", value: "" },
			// { name: "Monsterpreparatie", value: "" },
			// { name: "Opmerking monster", value: "" }
		]
	}, {
		name: "Initiële waarden",
		items: [
			{ symbol: "Hi", name: "Hoogte", unit: "mm", value: vars.Hi },
			{ symbol: "D", name: "Diameter", unit: "mm", value: vars.D },
			{ symbol: "ρs", name: "Dichtheid vaste delen", unit: "Mg/m3", value: vars.ps },
			{				name: "Bepaling dichtheid", value: headerValue("Specific Gravity (ass", false).replace("Ingeschaat", "Ingeschat") },
			{ symbol: "Vi", name: "Volume", unit: "mm3", value: vars.Vi },
			{ symbol: "Sri", name: "Verzadigingsgraad", unit: "%", value: vars.Sri },
			{ symbol: "w0", name: "Watergehalte", unit: "%", value: vars.w0 },
			{ symbol: "yi", name: "Volumegewicht nat", unit: "kN/m3", value: vars.yi },
			{ symbol: "ydi", name: "Volumegewicht droog", unit: "kN/m3", value: vars.ydi },
			{ symbol: "ei", name: "Poriëngetal", unit: "-", value: vars.ei }
		]
	}, {
		name: "Uiteindelijke waarden",
		items: [
			{ symbol: "Hf", name: "Hoogte", unit: "mm", value: vars.Hf },
			{ symbol: "Vf", name: "Volume", unit: "mm3", value: vars.Vf },
			{ symbol: "Srf", name: "Verzadigingsgraad", unit: "%", value: vars.Srf },
			{ symbol: "wf", name: "Watergehalte", unit: "%", value: vars.wf },
			{ symbol: "yf", name: "Volumegewicht nat", unit: "kN/m3", value: vars.yf },
			{ symbol: "ydf", name: "Volumegewicht droog", unit: "kN/m3", value: vars.ydf },
			{ symbol: "ef", name: "Poriëngetal", unit: "-", value: vars.ef }
		]
	}, {
		name: "Belastingschema",
		items: vars.stages.map((stage, i) => ({ name: js.sf("Trap %d", i + 1), symbol: "σ'v", unit: "kPa", value: stage.target })),
	}, {
		name: "Belastingschema (effectief)",
		items: vars.stages.map((stage, i) => ({ name: js.sf("Trap %d", i + 1), symbol: "σ'v", unit: "kPa", value: stage.effective })),
	}, {
		name: "Grensspanning",
		items: [
			{ name: "Bjerrum/NEN", unit: "kPa", symbol: "σ'p", value: js.get("bjerrum.LLi_rek.sN1N2.x", vars) },
			{ name: "Isotachen", unit: "kPa", symbol: "σ'p", value: js.get("isotachen.LLi_e.sN1N2.x", vars) },
			{ name: "Koppejan", unit: "kPa", symbol: "σ'p", value: js.get("koppejan.LLi_1.sN1N2.x", vars) + 0},
			{ name: "Rek bij Bjerrum/NEN", symbol: "εCv", unit: "%", value: js.get("bjerrum.LLi_rek.sN1N2.y", vars) * 100 },
			{ name: "Rek bij Isotachen", symbol: "εHv", unit: "%", value: js.get("isotachen.LLi_e.sN1N2.y", vars) * 100 },
			{ name: "Rek bij Koppejan", symbol: "εCv", unit: "%", value: js.get("koppejan.LLi_1.sN1N2.y", vars) / vars.Hi * 100 },
		]
	}, {
		name: "Poriëngetal",
		items: vars.stages.map((stage, i) => ({ name: js.sf("Trap %d", i + 1), symbol: "e(" + (i+1) + ")", value: stage.e0 })),
	}, {
		name: "Lineaire rek",
		items: vars.stages.map((stage, i) => ({ name: js.sf("Trap %d", i + 1), symbol: "EvC(" + (i+1) + ")", value: stage.EvC })),
	}, {
		name: "Natuurlijke rek",
		items: vars.stages.map((stage, i) => ({ name: js.sf("Trap %d", i + 1), symbol: "EvH(" + (i+1) + ")", value: stage.EvH })),
	}, {
		name: "Volumesamendrukkingscoëfficiënt",
		items: vars.stages.map((stage, i) => ({ name: js.sf("Trap %d-%d", i + 1, i + 2), unit: "1/Mpa", symbol: js.sf("mv%s(%s)", vars.temperature, i), value: stage.mv })).filter(_ => !isNaN(_.value))
	}, {
		name: "Casagrande - Consolidatie 50%",
		items: vars.stages.map((stage, i) => ({ name: js.sf("Trap %d", i + 1), unit: "s", symbol: "t50(" + (i+1) +")", value: stage.casagrande.t50[0] })),
	}, {
		name: "Casagrande - Consolidatie 100%",
		items: vars.stages.map((stage, i) => ({ name: js.sf("Trap %d", i + 1), unit: "s", symbol: "t100(" + (i+1) +")", value: stage.casagrande.t100[0] })),
	}, {
		name: "Casagrande - Consolidatiecoëfficiënt",
		items: vars.stages.map((stage, i) => ({ name: js.sf("Trap %d", i + 1), unit: "m2/s", symbol: js.sf("Cv%s(%s)", vars.temperature, (i + 1)), value: stage.casagrande.cv }))
	}, {
		name: "Casagrande - Waterdoorlatendheid",
		items: vars.stages.map((stage, i) => ({ 
				name: js.sf("Trap %d-%d", i + 1, i + 2), 
				unit: "m/s", symbol: js.sf("k%s(%s)", vars.temperature, i + 1), 
				value: stage.casagrande.k
			})).filter((o, i, a) => i < a.length - 1)
	}, {
		name: "Casagrande - Secundaire consolidatie (Calpha)",
		items: vars.stages.map((stage, i) => ({ name: js.sf("Trap %d", i + 1), symbol: "Cα(" + (i+1) + ")", unit: "-", value: stage.casagrande.Calpha }))
	}, {
		name: "Taylor - Consolidatie 50%",
		items: vars.stages.map((stage, i) => ({ name: js.sf("Trap %d", i + 1), unit: "s", symbol: "t50(" + (i+1) +")", value: stage.taylor.t50[0] })),
	}, {
		name: "Taylor - Consolidatie 90%",
		items: vars.stages.map((stage, i) => ({ name: js.sf("Trap %d", i + 1), unit: "s", symbol: "t90(" + (i+1) +")", value: stage.taylor.t90[0] })),
	}, {
		name: "Taylor - Consolidatiecoëfficiënt",
		items: vars.stages.map((stage, i) => ({ name: js.sf("Trap %d", i + 1), unit: "m2/s", symbol: js.sf("Cv%s(%s)", vars.temperature, i + 1), value: stage.taylor.cv }))
	}, {
		name: "Taylor - Waterdoorlatendheid",
		items: vars.stages.map((stage, i) => ({ 
			name: js.sf("Trap %d-%d", i + 1, i + 2), 
			unit: "m/s", symbol: js.sf("k%s(%s)", vars.temperature, i + 1), 
			value: stage.taylor.k
		})).filter((o, i, a) => i < a.length - 1)
	}, {
		name: "NEN/Bjerrum - Samendrukkingsindices",
		items: vars.stages.map((stage, i) => ({ 
			name: js.sf("Trap %d-%d", i + 1, i + 2), 
			symbol: js.sf("%s(%d-%d)", stage.Cc_, i + 1, i + 2), 
			value: stage.Cc })).filter((o, i, a) => i < a.length - 1).concat(bjerrum_e_variables(vars))
	}, {
		name: "NEN/Bjerrum - Samendrukkingsgetallen",
		items: vars.stages.map((stage, i) => ({ 
			name: js.sf("Trap %d-%d", i + 1, i + 2), 
			symbol: js.sf("%s(%d-%d)",  stage.CR_, i + 1, i + 2), 
			// symbol: js.sf("CR(%s)",  i), 
			value: stage.CR })).filter((o, i, a) => i < a.length - 1).concat(bjerrum_r_variables(vars))
	}, {
		name: "Isotachen - Samendrukkingscoëfficiënten",
		items: (() => {
			var Pg = vars.isotachen.LLi_e.sN1N2.x;
			var name, value;
			return vars.stages.slice(0, vars.stages.length - 1).map((stage, i) => {
				if(name === undefined) {
					name = "a";
				} else if(name === "a" && stage.effective > Pg) {
					name = "b";
				} else if(name === "b" && stage.target > vars.stages[i + 1].target) {
					name = "asw";
				} else if(name === "asw") {
					name = "ar";
				} else if(name === "ar") {
					name = "b";
				}

				value = stage.isotachen[name.charAt(0)];

				return {
					name: js.sf("%s-waarde %s Pg", name, (stage.target > Pg ? "boven" : "onder"), i + 1, i + 2),
					symbol: js.sf("%s(%d-%d)", name, i + 1, i + 2),
					value: value
				};
			}).concat(isotachen_variables(vars));
		})()
	}, {
		name: "Isotachen - c-waarde",
		items: vars.stages.slice(0, vars.stages.length - 1).map((stage, i) => ({
				name: js.sf("c-waarde Trap %d", i + 1),
				symbol: js.sf("c(%d)", i + 1),
				value: stage.isotachen.c
			}))
	}, {
		name: "Koppejan - Zetting (geëxtrapoleerde)",
		items: [
			{ name: "1 dag", unit: "mm", symbol: "ez1", value: vars.koppejan.serie2.map(o => o.ez1).join(" ") },
			{ name: "10 dagen", unit: "mm", symbol: "ez10", value: vars.koppejan.serie2.map(o => o.ez10).join(" ") },
			{ name: "100 dagen", unit: "mm", symbol: "ez100", value: vars.koppejan.serie2.map(o => o.ez100).join(" ") },
			{ name: "1000 dagen", unit: "mm", symbol: "ez1000", value: vars.koppejan.serie2.map(o => o.ez1000).join(" ") },
			{ name: "10000 dagen", unit: "mm", symbol: "ez10000", value: vars.koppejan.serie2.map(o => o.ez10000).join(" ") },
		]
	}, {
		name: "Koppejan - Parameters",
		items: (() => { 
			var Pg = vars.koppejan.LLi_1.sN1N2.x;
			var slopes = vars.koppejan.slopes;
			var serie2 = vars.koppejan.serie2;
			var sig = key_st;

			var unload = 0, pre, post, reload = 0;
			return slopes.map((o, index) => { 
				if(index === slopes.length - 1) return [];
				if(index && !unload) {
					// if((unload = serie2[index - 1][sig] > serie2[index][sig] ? 1 : 0)) {
					if((unload = serie2[index][sig] > serie2[index + 1][sig] ? 1 : 0)) {
						pre = "A";
					} else {
						pre = "C";
					}
				} else {
					if(unload) {
						reload++;
					}
					pre = "C";
				}

				post = serie2[index][sig] < Pg ? "" : "'";
				post += (reload === 1 ? "(r)" : "");

				return [
					{ name: js.sf("%s%s Trap %d-%d", pre, post, index + 1, index + 2), unit: "", symbol: js.sf("%s%s", pre, post), value: o.C },
					{ name: js.sf("%s10%s Trap %d-%d", pre, post, index + 1, index + 2), unit: "", symbol: js.sf("%s10%s", pre, post), value: o.C10 },
					{ name: js.sf("%sp%s Trap %d-%d", pre, post, index + 1, index + 2), unit: "", symbol: js.sf("%sp%s", pre, post), value: o.Cp },
					{ name: js.sf("%ss%s Trap %d-%d", pre, post, index + 1, index + 2), unit: "", symbol: js.sf("%ss%s", pre, post), value: o.Cs }
				];
			}).flat().concat(koppejan_variables(vars));
		})()
	}, {
		name: "Koppejan - Regressielijnen",
		items: vars.stages.map((stage, i) => {
			return { 
				name: js.sf("Richtingscoëfficiënt regressielijn %d", i + 1), 
				symbol: "rc" + (i + 1), 
				value: stage.koppejan.rc 
			};
		}).concat(
			vars.stages.map((stage, i) => ({ 
				name: js.sf("Nulpunt regressielijn %d", i + 1), 
				symbol: "np" + (i+1), 
				value: stage.koppejan.np 
			}))),
	}, {
		name: "Overig",
		items: [
			{ symbol: "m", name: "Initial Mass", unit: "-", value: vars.m },
			{ symbol: "md", name: "Initial Dry Mass", unit: "-", value: vars.md },
			{ symbol: "mf", name: "Final Mass", unit: "-", value: vars.mf },
			{ symbol: "mdf", name: "Final Dry Mass", unit: "-", value: vars.mdf },
		]
	}];
	vars.parameters = vars.categories.map(_ => (_.items||[]).map(kvp => mixin({ category: _ }, kvp))).flat();
/*-
	Effectieve belasting - σ'
	Belastingschema - σ'
	Poriëngetal - e
	Compression Index - Cc
	Compression Ratio - CR
	
	(Bjerrum/NEN)
		- Lineaire rek - εCv
	Coefficient of Consolidation 
		- Volumesamendrukkingscoëfficiënt - mv
		(Casagrande Method)
			- Tijd bij 50% consolidatie - t50
			- Consolidatiecoëfficient - cv
			- Waterdoorlatendheid - k
		(Taylor Method)
			- Tijd bij 90% consolidatie - t90
			- Consolidatiecoëfficient - cv
			- Waterdoorlatendheid - k
	(a,b,c-Isotachen)
		- Natuurlijke rek - εHv 
		- Natuurlijke Rek bij grenspanning NEN
		- Grenspanning bij NEN
		- a-waarden
		- b-waarden
		- c-waarden
	(Secundaire Consolidatieparameter Cα)
		- Secundaire Consolidatie Trap [...] - Calpha - Cα
	(Koppejan)
		- rc
		- np
		- z, z1, z10, z100, ...
		- Samendrukkingsparameters
			- Samendrukkingsconstant C > σ’p tussen Trap 5 en 6
*/
}

/* Trendline Editing */
var TrendLine_Mouse_Handlers = {
	mousemove(graph, trendLine, evt) {
		var moved = graph.vars("last-cursor-moved");
		if(!moved) return;
		
		var previous = graph.vars("previous-cursor-moved");
		graph.vars("previous-cursor-moved", moved);
		if(!previous) return;
		
		var first = graph.vars("first-cursor-moved");
		if(!first) {
			graph.vars("first-cursor-moved", (first = previous));
			graph.vars("first-position", [
				trendLine.initialXValue, trendLine.initialValue,
				trendLine.finalXValue, trendLine.finalValue
			]);
		}
		
		var pos1 = [
			trendLine.chart.xAxes[0].coordinateToValue(moved.x),
			trendLine.chart.yAxes[0].coordinateToValue(moved.y)
		];
		var pos2 = [
			trendLine.chart.xAxes[0].coordinateToValue(previous.x),
			trendLine.chart.yAxes[0].coordinateToValue(previous.y)
		];
		var pos3 = [
			trendLine.chart.xAxes[0].coordinateToValue(first.x),
			trendLine.chart.yAxes[0].coordinateToValue(first.y)
		];
		var fp = graph.vars("first-position");
		
		var dx = Math.log10(pos3[0] / pos1[0]);
		var dy = pos3[1] - pos1[1];

		if(evt.shiftKey === true) {
			trendLine.modified = true;
			if(evt.altKey) {
				trendLine.initialXValue = fp[0] - dx;
				trendLine.initialValue = fp[1] - dy;
			} else {
				trendLine.initialXValue = pos1[0];
				trendLine.initialValue = pos1[1];
			}
			trendLine.draw();
		} else if(evt.ctrlKey === true) {
			trendLine.modified = true;
			if(evt.altKey) {
				trendLine.finalXValue = fp[2] - dx;
				trendLine.finalValue = fp[3] - dy;
			} else {
				trendLine.finalXValue = pos1[0];
				trendLine.finalValue = pos1[1];
			}
			trendLine.draw();
		} else {
			graph.vars("last-cursor-moved", null);
			graph.vars("previous-cursor-moved", null);
			graph.vars("first-cursor-moved", null);
		}
		
		if(trendLine.modified) {
			graph.ud("#modified").setState(true);
		}
	},
	mousedown(graph, trendLine, evt) {
		
	},
	mouseup(graph, trendLine, evt) {
		
	}
};
var TrendLine_KeyUp_Handlers = {
	Space(graph, trendLine, evt) {
		var vars = graph.vars(["variables"]);
		if(!vars.editor || !vars.editor.chart) return;
		
		var trendLines = vars.editor.chart.trendLines;
		var selected = trendLines.selected;
		var index = trendLines.indexOf(selected);
		
		if(index !== -1 && trendLines.length > 1) {
			do {
				if(evt.shiftKey) index--; else index++;
				if(index < 0) index = trendLines.length - 1;
				if(index > trendLines.length - 1) index = 0;
			} while(!isEditableTrendLine(trendLines[index]));
			trendLine = trendLines[index];
		} else {
			trendLine = trendLines.find(tl => isEditableTrendLine(tl) ? tl : null);
		}

		if(trendLines.selected !== trendLine) {
			if(trendLines.selected) {
				trendLines.selected.lineThickness = 1;
				trendLines.selected.draw();
			}
			if((trendLines.selected = trendLine)) {
				trendLines.selected.lineThickness = 3;
				trendLines.selected.draw();
			}
		}
	},
	// Escape(graph, trendLine, evt) {
	// 	var vars = graph.vars(["variables"]);
	// 	if(!vars.editor || !vars.editor.chart) return;

	// 	if(trendLine) {
	// 		// ???
	// 		var stage = vars.editor.stage, a;
	// 		var original = stage.casagrande.trendLines[vars.editor.chart.trendLines.indexOf(trendLine)];
	// 		js.mixIn(trendLine, original);
	// 		trendLine.draw();
	// 	} else {
	// 		graph.ud("#cancel-changes").execute(evt);
	// 	}
	// },
	// Enter(graph, trendLine, evt) {
	// 	var vars = graph.vars(["variables"]);
	// 	// if(vars.editor) {
	// 	// 	vars.editor.stop(true);
	// 	// 	delete vars.editor;
	// 	// }
	// 	graph.ud("#toggle-edit-graph").execute(evt);
	// }
};

function TrendLineEditor(vars, stage, chart, owner) {

	function click(evt) {
		if(chart.trendLines.selected !== evt.trendLine) {
			if(chart.trendLines.selected) {
				chart.trendLines.selected.lineThickness = 1;
				chart.trendLines.selected.draw();
			}

			chart.trendLines.selected = evt.trendLine;
			
			evt.trendLine.lineThickness = 3;
			evt.trendLine.draw();
		}
	}

	var originals = chart.trendLines.map(tl => ({
		initialXValue: tl.initialXValue,
		initialValue: tl.initialValue,
		finalXValue: tl.finalXValue,
		finalValue: tl.finalValue,
		tl: tl
	}));
	var selected = chart.trendLines.selected;
	var node = chart.node || owner.getNode().qs(".amcharts-main-div");

	this.chart = chart;
	this.stage = stage;
	this.owner = owner;
	this.stop = function(persist) {
		var modified = false, points = [];
		if(persist) {
			if(owner._name === "graph_Isotachen_c") {
				chart.trendLines.forEach((tl, index) => {
					var type = "DEF";
					if(tl && tl.modified) {
						modified = true;
						tl.lineThickness = 1;
						tl.draw();
			
						var line = {
							initialXValue: tl.initialXValue,
							initialValue: tl.initialValue,
							finalXValue: tl.finalXValue,
							finalValue: tl.finalValue
						};
				
						js.set(js.sf("overrides.isotachen.stage%d.lines.%s", stage.i, type), line, vars);
					}
				});
				if(modified) {
					stage.isotachen.update();
				}
			} else if(owner._name === "graph_Casagrande") {
				chart.trendLines.forEach((tl, index) => {
					var type = index === 0 ? "AB" : "DEF";
					if(tl && tl.modified) {
						modified = true;
						tl.lineThickness = 1;
						tl.draw();
			
						var line = {
							initialXValue: tl.initialXValue,
							initialValue: tl.initialValue,
							finalXValue: tl.finalXValue,
							finalValue: tl.finalValue
						};
				
						js.set(js.sf("overrides.casagrande.stage%d.lines.%s", stage.i, type), line, vars);
					}
				});
				if(modified) {
					stage.casagrande.update();
				}
			} else if(owner._name === "graph_Taylor") {
				chart.trendLines.forEach((tl, index) => {
					var type = "Qq"; // lineaire fit
					if(tl && tl.modified) {
						modified = true;
						tl.lineThickness = 1;
						tl.draw();
			
						var line = {
							initialXValue: tl.initialXValue,
							initialValue: tl.initialValue,
							finalXValue: tl.finalXValue,
							finalValue: tl.finalValue 
						};
				
						js.set(js.sf("overrides.taylor.stage%d.lines.%s", stage.i, type), line, vars);
					}
				});
				if(modified) {
					stage.taylor.update();
				}
			} else if(owner._name === "graph_Koppejan") {
				chart.trendLines.filter(tl => tl.editable).forEach((tl, index) => {
					if(tl) {
						modified = true;
						tl.lineThickness = 1;
						tl.draw();
						points.push(
							{ x: tl.initialXValue, y: tl.initialValue },
							{ x: tl.finalXValue, y: tl.finalValue });
					}
				});
				js.set("overrides.koppejan.points_pg", points, vars);
				vars.koppejan.update();
			} else {
				var name = owner._name.substring("graph_".length).toLowerCase();
				if(["bjerrum_e", "bjerrum_r", "isotachen"].indexOf(name) !== -1) {
					chart.trendLines.filter(tl => tl.editable).forEach((tl, index) => {
						if(tl) {
							modified = true;
							tl.lineThickness = 1;
							tl.draw();
							points.push(
								{ x: tl.initialXValue, y: tl.initialValue },
								{ x: tl.finalXValue, y: tl.finalValue });
						}
					});
					js.set(js.sf("overrides.%s.points_pg", name), points, vars);
					if(modified) {
						stage.update(name); // FIXME stage(0).updates
					}
				}
			}
			if(modified) {
				vars.parameters.update();
				owner.setState("invalidated", true);
			}
		} else {
			originals.forEach(original => {
				js.mixIn(original.tl, original);
				delete original.tl.tl;
				original.tl.draw();
			});
		}

		delete chart.trendLines.selected;
		node.classList.remove("editing");
		
		// owner.ud("#editing").setState(false);
		owner.print("stop - TrendLineEditor", modified ? vars : "no changes");
	};
	this.handle = function(evt) {
		var vars = owner.getParent().vars(), h, r;
		var trendLine = chart.trendLines.selected;
		
		if(!trendLine) {
			if(evt.type === "keyup") {
				h = TrendLine_KeyUp_Handlers[evt.code];
			}
		} else if(evt.type === "click") {
			if(chart.trendLines.selected) {
				chart.trendLines.selected.lineThickness = 1;
				chart.trendLines.selected.draw();
				delete chart.trendLines.selected;
			}
		} else if(evt.type === "keyup") {
			h = TrendLine_KeyUp_Handlers[evt.code];
		} else if(evt.type.startsWith("mouse")) {
			h = TrendLine_Mouse_Handlers[evt.type];
			// graph.print(evt.type, {trendLine: trendLine, evt: evt, chart: trendLine.chart}); 
		}
		
		if(h) {
			r = h(owner, trendLine, evt);
			if(trendLine && r !== false) trendLine.draw();
		}
	
		return r;
	};

	chart.trendLines.filter(tl => isEditableTrendLine(tl)).forEach(tl => {
		if(!tl.hooked) {
			tl.hooked = true;
			tl.addListener("click", click);
		}
		tl.lineThickness = 1;
		tl.draw();
		delete tl.modified; 
	});
	node.classList.add("editing");
	vars.editing = node;
	
	owner.print("start - TrendLineEditor");
}
function handleTrendLineEvent(graph, trendLine, evt) {
	var vars = graph._parent.vars(), h, r;
	
	if(!trendLine) {
		if(evt.type === "keyup") {
			h = TrendLine_KeyUp_Handlers[evt.code];
		}
	} else if(evt.type === "keyup") {
		h = TrendLine_KeyUp_Handlers[evt.code];
	} else if(evt.type.startsWith("mouse")) {
		h = TrendLine_Mouse_Handlers[evt.type];
	}
	
	if(h) {
		r = h(graph, trendLine, evt);
		if(trendLine && r !== false) trendLine.draw();
	}

	return r;
}
// function cursorMoved(evt) { Control.findByNode(evt.chart.node).vars("last-cursor-moved", evt); }
function cursorMoved(evt) { this.vars("last-cursor-moved", evt); }
function isEditableTrendLine(tl) {
	return tl.editable;
	// return tl.dashLength === 0 && (tl.lineColor == "red" || tl.lineColor === "green");
}

["", { handlers: handlers, css: "background-color:white;" }, [

	["vcl/data/Array", ("array-measurements"), {
		onGetAttributeValue: function(name, index, value) { 
			return (this._arr[index] || {})[name]; 
		},
		onFilterObject(obj) {
			var q = this.vars("q");
			if(!q) return false;
			return q.split(/\s/).filter(q => q.length > 0).some(q => !match(obj, q));
		},
		onUpdate() {
			// this.ud("#list-status").render();
		},
	}],
	["vcl/data/Array", ("array-variables"), {
		onFilterObject(obj) {
			var q = this.vars("q");
			if(!q) return false;
			return q.split(/\s/).filter(q => q.length > 0).some(q => !match(obj, q));
		}
	}],
	
    ["vcl/Action", ("toggle-edit-graph"), {
    	selected: "state",
    	state: false, 
    	visible: false,
    	on(evt) {
			var vars = this.vars(["variables"]), am, node, chart;
    		var graph = this.ud("#graphs > :visible"), state;
    		var stage = evt && evt.component.vars("stage");

    		am = (evt && evt.am) || graph.getNode().down(".amcharts-main-div");
			if(stage === undefined) {
				stage = Array.from(am.parentNode.parentNode.childNodes).indexOf(am.parentNode);
			}
			
			/* get the stage being clicked */
			chart = (graph.vars("am-" + stage) || graph.vars("am")).chart;

			if(!(state = this.toggleState())) {
				vars.editor && vars.editor.stop(true);
				delete vars.editor;
				this.ud("#popup-edit-graph-stage")._controls.forEach(c => c.setSelected("never"));
				// stage = undefined;
			} else {
				vars.editor = new TrendLineEditor(vars, vars.stages[stage], chart, graph);
				node = graph.getNode();
				node.previous_scrollTop = node.scrollTop;
				node.scrollTop = 0;
				graph._parent.focus();
	
				// if(evt && !evt.am && stage !== undefined) {
					// evt.component.print("nevering", evt);
					// evt.component._parent._controls.forEach(c => c.setSelected(c === evt.component ? true : "never"));
				// }
				
				if(stage !== undefined) {
					this.ud("#popup-edit-graph-stage").getControls().forEach((c, i) => c.setSelected(i === stage ? true : "never"));
				}
			}
			
			var multiple = getSelectedGraph(this).multiple;
			this.ud("#panel-edit-graph").setVisible(this.getState() && !multiple);
    	}
    }],
    ["vcl/Action", ("edit-graph-stage"), {
    	selected: "parent",
    	state: "parent",
    	parent: "toggle-edit-graph",
    	// parentExecute: true,
    	on(evt) {
    		// if(this.isSelected()) {
    		// 	this._parent.execute();
    		// }
    		if(evt.component.hasVar("stage")) {
    			// if it is a button inside the popup
    			if(this.isSelected() && !evt.component.isSelected()) {
    				this._parent.execute(); // deselect first
    			}
    			this._parent.execute(evt);
    		}
    	}
    }],
    
    ["vcl/Action", ("modified"), {
    	state: false,
    	visible: "state"
    }],
    ["vcl/Action", ("editing"), {
    	state: false,
    	selected: "state"
    }],

    ["vcl/Action", ("refresh"), {
		on: function() {
			var Parser = require("papaparse/papaparse");
			var options = this.vars(["options"]) || {
				// delimiter: "",	// auto-detect
				// newline: "",	// auto-detect
				// quoteChar: '"',
				// escapeChar: '"',
				// header: false,
				// dynamicTyping: false,
				// preview: 0,
				// encoding: "",
				// worker: false,
				// comments: false,
				// step: undefined,
				// complete: undefined,
				// error: undefined,
				// download: false,
				// skipEmptyLines: false,
				// chunk: undefined,
				// fastMode: undefined,
				// beforeFirstChunk: undefined,
				// withCredentials: undefined
			};
			var vars = this.up().vars("variables", {});
			var headerValue = (key, parse/*default true*/) => {
				key = key.toLowerCase();
				key = (vars.headers.filter(_ => _.name.toLowerCase().startsWith(key))[0] || {});
				return parse === false ? key.raw : key.value;
			};
		
		/*- parse lines => headers, columns and measurements */		
			var ace = this.udr("#ace");
			var lines = ace.getLines().filter(_ => _.length); if(lines.length < 2) return; //can't be good
			var headers = lines.filter(_ => _.split("\"").length < 15);
			var measurements = lines.filter(_ => _.split("\"").length > 15);
	
		/*- parse columns */
			vars.columns = measurements.shift().split(",").map(removeQuotes);
		
		/*- parse headers */	
			vars.headers = headers.map(_ => _.split("\",\"")).filter(_ => _.length === 2)
				.map(_ => [removeTrailingColon(_[0].substring(1)), _[1].substring(0, _[1].length - 2)])
				.map(_ => ({category: "Header", name: _[0], value: parseValue(_[1]), raw: _[1]}));
			
		/*- use overrides immediately (if any) */	
			vars.overrides = this.vars(["overrides"]);
			
		/*- setup dataset and variables */
			setup_measurements_1(vars, Parser.parse(measurements.join("\n"), options).data);
			setup_variables_1(vars, headerValue);
			setup_measurements_2(vars);
			setup_stages_1(vars);
			setup_casagrande(vars);
			setup_taylor(vars);
			setup_bjerrum(vars);
			setup_isotachen(vars);
			setup_koppejan(vars);
			setup_stages_2(vars);
			setup_variables_2(vars, headerValue);
	
			this.ud("#array-measurements").setArray(vars.measurements);
			this.ud("#array-variables").setArray(vars.headers.concat(vars.parameters));
			
			var me = this;
			vars.parameters.update = function update_parameters() {
				setup_stages_2(vars);
				setup_variables_2(vars, headerValue);
				me.ud("#array-variables").setArray(vars.headers.concat(vars.parameters));
				vars.parameters.update = update_parameters;
			};
			
			var edit = this.ud("#edit-graph-stage"), popup = this.ud("#popup-edit-graph-stage");
			popup.destroyControls();
			vars.stages.forEach((stage, index) => {
				new Button({
					action: edit, parent: popup,
					content: js.sf("Trap %d", index + 1), 
					selected: "never", vars: { stage: index }
				});
			});
			
			this.ud("#graphs").getControls().forEach(c => c.setState("invalidated", true));
			
			this.print("parsed", { stages: vars.stages, variables: vars });
		}
    }],
    ["vcl/Action", ("persist-changes"), {
    	parent: "modified",
    	visible: "parent",
    	on() {
    		/* overridden in eg. Tabs<Document> */
    		alert("LET OP: Niet geimplementeerd!");
    	}
    }],
    ["vcl/Action", ("cancel-changes"), {
    	parent: "modified",
    	visible: "parent",
    	on() {
			if(confirm("LET OP: Alle wijzigingen zullen verloren gaan.\n\nWeet u zeker dat u wilt annuleren?")) {
				// this.ud("#editing").setState(false);
				this.ud("#toggle-edit-graph").execute();
				this.ud("#modified").setState(false);
				this.ud("#refresh").execute();
			}
    	}
    }],
    ["vcl/Action", ("reflect-overrides"), {
    	on(evt) {
    		var vars = this.vars(["variables"]);
    		if(evt.overrides) {
    			vars.overrides = evt.overrides;
    		} else {
    			if(!vars.overrides) return;
    			delete vars.overrides;
    		}
			vars.stages.forEach(stage => stage.update("all"));
			vars.koppejan.update();
			vars.parameters.update();
			this.ud("#graphs").getControls().map(c => c.render());
    	}
    }],

    ["vcl/ui/Popup", ("popup-edit-graph-stage"), { 
    	autoPosition: false,
		origin: "bottom-right",
		classes: "mw",
		css: {
			".{Button}": "white-space: nowrap;",
			"&.mw.mw.mw": "right:0;max-width:200px;",
			"span": "font-size:smaller;"
		}
    }],

	["vcl/ui/Tabs", ("tabs-sections"), { classes: "bottom", align: "bottom" }, [
		["vcl/ui/Bar", ("menubar"), {
			align: "right", 
			autoSize: "both",
			classes: "nested-in-tabs",
			css: "text-align:right;"
		}, [
			["vcl/ui/Button", ("button-persist-changes"), { 
				action: "persist-changes", classes: "submit",
				content: "Opslaan"
			}],
			["vcl/ui/Button", ("button-persist-changes"), { 
				action: "cancel-changes", classes: "cancel",
				content: "Annuleren"//, visible: false
			}]
		]],
		["vcl/ui/Tab", { text: "Variabelen", control: "variables", selected: !true }],
		["vcl/ui/Tab", { text: "Metingen", control: "measurements" }],
		["vcl/ui/Tab", { text: "Grafieken", control: "container-graphs", selected: true, vars: { 'bar-hidden': true }} ],
	]],
	["vcl/ui/Bar", ("bar"), { visible: false }, [
		["vcl/ui/Input", ("q"), { 
			placeholder: "Filter", 
			onChange() { 
				this.setTimeout("updateFilter", () => {
					var a1 = this.udr("#array-variables");
					var a2 = this.ud("#array-measurements");
					a1.vars("q", this.getValue());
					a1.updateFilter();

					a2.vars("q", this.getValue());
				}, 250); 
			} 
		}],
	]],
	["vcl/ui/List", ("variables"), { 
		align: "client", autoColumns: true, visible: false, 
		source: "array-variables",
		onDblClick: function() {
			this.print(this.getSelection(true));	
		}
	}],
	["vcl/ui/List", ("measurements"), { 
		align: "client", autoColumns: true, visible: false, 
		source: "array-measurements",
		onDblClick: function() {
			this.print(this.getSelection(true));	
		}
	}],
	["vcl/ui/Panel", ("container-graphs"), { align: "client", visible: false }, [
		["vcl/ui/Tabs", ("tabs-graphs"), {}, [
			["vcl/ui/Tab", { text: "Casagrande", control: "graph_Casagrande", selected: true, vars: { multiple: true } }],
			["vcl/ui/Tab", { text: "Taylor", control: "graph_Taylor", selected: !true, vars: { multiple: true } }],
			["vcl/ui/Tab", { text: "Isotachen (c)", control: "graph_Isotachen_c", selected: !true, vars: { multiple: true } }],
			["vcl/ui/Tab", { text: "Bjerrum (poriëngetal)", control: "graph_Bjerrum_e", selected: !true }],
			["vcl/ui/Tab", { text: "Bjerrum (rek)", control: "graph_Bjerrum_r", selected: !true }],
			["vcl/ui/Tab", { text: "Isotachen", control: "graph_Isotachen", selected: !true }],
			["vcl/ui/Tab", { text: "Koppejan", control: "graph_Koppejan", selected: !true }],
			["vcl/ui/Bar", ("menubar"), {
				align: "right", autoSize: "both", classes: "nested-in-tabs"
			}, [
				["vcl/ui/Button", ("button-edit-graph"), { 
					action: "toggle-edit-graph",
					classes: "_right", content: "Lijnen muteren"
				}],
				["vcl/ui/PopupButton", ("button-edit-graph-stage"), { 
					action: "edit-graph-stage", classes: "_right", origin: "bottom-right",
					content: "Lijnen muteren <i class='fa fa-chevron-down'></i>",
					popup: "popup-edit-graph-stage"
				}]	
			]]
		]],
		["vcl/ui/Panel", ("graphs"), { 
			align: "client", css: css, tabIndex: 1,
			
			onDispatchChildEvent(child, name, evt, f, args) {
				var mouse = name.startsWith("mouse");
				var click = !mouse && name.endsWith("click");
				var vars = this.vars(["variables"]), am, stage, control, method, chart;

				if(click || mouse) {
					am = evt.target.up(".amcharts-main-div", true);
					if(!am) return;

					control = evt.component || require("vcl/Control").findByNode(am);
					if(!control || control.vars("rendering") === true) return;
					
					var stages = vars.stages;
					if(vars.editing) {
						if(!vars.editing.parentNode) {
							delete vars.editing;
						} else {
							stage = Array.from(vars.editing.parentNode.childNodes).indexOf(vars.editing);
						}
					}
					if(name === "click") {
						/* focus, clear overrides */
						if(stage !== undefined) {
							chart = (control.vars("am-" + stage) || control.vars("am")).chart;
							var trendLines = chart.trendLines;
							if(trendLines.selected) {
								trendLines.selected.lineThickness = 1;
								trendLines.selected.draw();
								delete trendLines.selected;
							}
						}
						this.focus();
						
						if(vars.editor) {
							vars.editor.handle(evt);
						}
							
					} else if(name === "dblclick") {
						evt.am = am;
						this.ud("#toggle-edit-graph").execute(evt);
					} else if(vars.editor) {
						vars.editor.handle(evt);
					} else if(mouse && vars.editing) {
						var trendLine = vars.etl && vars.etl.chart.trendLines.selected;
						if(trendLine) {
							handleTrendLineEvent(evt.component, trendLine, evt);
						}
					}
				}
			},
			onKeyDown(evt) { 
				var control = evt.component || require("vcl/Control").findByNode(evt.target);
				if(!control || control.vars("rendering") === true) return;

				var trendLine = this.vars(["variables.etl.chart.trendLines.selected"]);
				handleTrendLineEvent(control, trendLine, evt);
			},
			onKeyUp(evt) { 
				var control = evt.component || require("vcl/Control").findByNode(evt.target);
				if(!control || control.vars("rendering") === true) return;
				
				var trendLine = this.vars(["variables.etl.chart.trendLines.selected"]);
				handleTrendLineEvent(control, trendLine, evt);
			}

		}, [
			["vcl/ui/Panel", ("graph_Casagrande"), {
				align: "client", visible: false, classes: "multiple"
			}],
			["vcl/ui/Panel", ("graph_Taylor"), {
				align: "client", visible: false, classes: "multiple"
			}],
			["vcl/ui/Panel", ("graph_Bjerrum_e"), {
				align: "client", visible: false
			}],
			["vcl/ui/Panel", ("graph_Bjerrum_r"), {
				align: "client", visible: false
			}],
			["vcl/ui/Panel", ("graph_Isotachen"), {
				align: "client", visible: false
			}],
			["vcl/ui/Panel", ("graph_Koppejan"), {
				align: "client", visible: false
			}],
			["vcl/ui/Panel", ("graph_Isotachen_c"), {
				align: "client", visible: false, classes: "multiple"
			}],
			
			["vcl/ui/Panel", ("panel-edit-graph"), {
				align: "top", autoSize: "height",
				// action: "toggle-edit-graph", executeAction: "on",
				css: {
					"": "padding:8px;text-align:center;",
					">*": "margin-right: 4px;" ,
					"input": "text-align:center;width:40px;border-radius: 5px; border-width: 1px; border-color: rgb(240, 240, 240); padding: 2px 4px;"
			    },
				visible: false
			}, [
				["vcl/ui/Element", { element: "span", content: "onder Pg:"}],
				["vcl/ui/Input", "label-onder", { placeholder: "#-#"}],
				["vcl/ui/Element", { element: "span", content: "boven Pg:"}],
				["vcl/ui/Input", "label-boven", { placeholder: "#-#"}],
			]]
		]]
	]]
]];