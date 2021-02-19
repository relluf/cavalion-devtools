// "use strict";

var js = window.js, mixin = js.mixIn;
var AmCharts = window.AmCharts;
var sort_numeric = (i1, i2) => parseFloat(i1) < parseFloat(i2) ? -1 : 1;
var removeTrailingColon = (s) => s.replace(/\:$/, "");

function makeChart(c, opts) {
	
	function render(options) {
		var node = this.getNode();
	
		this.print("rendering", this.vars("am"));
		
		var defaults = {
		    mouseWheelZoomEnabled: true, zoomOutText: "", 
		    // chartScrollbar: {
		    //     oppositeAxis: false,
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
		        pan: true,
		        valueLineEnabled: true,
		        valueLineBalloonEnabled: true,
		    	categoryBalloonDateFormat: "D MMM HH:NN",
		    	color:"black",
		        cursorAlpha:0.5,
		        cursorColor:"#e0e0e0",
		        valueLineAlpha:0.2,
		        valueZoomable:true
		    },
		    
		    type: "xy",  
		    colors: ["rgb(56, 121, 217)", "maroon"],
		    legend: { useGraphSettings: true },
			dataProvider: this.vars("am.data"),
			minValue: 1, maxValue: 0,
		    valueAxes: [{
		        id: "v1", position: "left",
		        reversed: true
			}, {
				position: "bottom", 
				logarithmic: options.xAxisLogarithmic,
				title: options.xAxisTitle
			}],
		    // categoryAxis: {
		    // 	// maximum: 10,
		    //     // dashLength: 1,
		    //     // minorGridEnabled: true,
		    //     // labelFunction: function(value, valueText, valueAxis) {
		    //     // 	return js.sf("%.2f", Math.pow(10, value));
		    //     // },
		    //     // labelFunction: function(valueText, serialDataItem, categoryAxis) {
		    //     // 	return "X";
		    //     // }
		    // },
		    categoryField: "x"
		};
		options = js.mixIn(defaults, options);
		options.graphs = options.graphs || this.vars("am.series").map(serie => {
			return js.mixIn({
	        	type: "line", lineThickness: 2,
		        connect: serie.connect || false,
			    xField: "x", yField: serie.valueField || "y",
			    yAxis: serie.yAxis || "v1"
		    }, serie);
		});
		
		var chart = AmCharts.makeChart(node, options);
		this.vars("am.chart", chart);
		
		chart.addListener("drawn", (e) => this.setTimeout("rendered", () => 
			this.emit("rendered", [e]), 
			// this.print("rendered", this.emit("rendered", [e])), 
			100));
	
		chart.addListener("zoomed", (e) => this.setTimeout("zoomed", () => 
			this.emit("zoomed", [e]),
			// this.print("zoomed", this.emit("zoomed", [e])), 
			100));
	
		// chart.addListener("changed", (e) => {
		// 	this.setTimeout("changed", () => 
		// 		// this.emit("changed", [e]),
		// 		this.print("changed", this.emit("changed", [e])), 
		// 		100);
		// });
	}
	
	c.nextTick(() => render.apply(c, [opts || {}]));
}
function contextNeeded(c) {
	return {
		array: c.ud("devtools/Editor<>", "#array"),
		stage: c.ud("#stage").getValue().split(" ").pop(),
    	categoryField: c.ud("#categoryField").getValue(),
    	valueField: c.ud("#valueField").getValue(),
    	valueField_kPa: c.ud("#valueField_kPa").getValue(),
	};
}

// function snijpunt(x1, y1, x2, y2, x3, y3, x4, y4) {
// 	var slope1 = (y1 - y2) / (x1 - x2);
//     var slope2 = (y3 - y4) / (x3 - x4);

//     if(slope1 !== slope2){
//         var b1 = getB(slope1,x1,y1);
//         var b2 = getB(slope2,x3,y3);

//         if(slope2 >= 0){
//             u = slope1 - slope2;
//         }else{
//             u = slope1 + slope2;
//         }

//         if(b1 >= 0){
//             z = b2 - b1;
//         }else{
//             z = b2 + b1;
//         }

//         pointX = z / u;

//         pointY = (slope1*pointX)+b1;

//         pointYOther = (slope2*pointX)+b2;
// }

// }
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

var handlers = {
	"loaded": function() {
		/*- DEBUG: hook into the 1st Editor<gds> we can find (if any) in order to tweak/fiddle code */
		var editor;
		if(this.up("devtools/Editor<vcl>")) {
			if((editor = this.app().down("devtools/Editor<gds>:root"))) {
	
				var previous_owner = this._owner;
				this.setOwner(editor);
				this.on("destroy", () => this.setOwner(previous_owner));
		
				["valueField", "valueField_kPa", "categoryField"].forEach(name => {
					var source = this.ud("devtools/Editor<>", "#" + name);
					var dest = this.scope()[name];
					dest.setOptions(source._options);
					dest.setValue(source.getValue());
				});
			}
		}
		
function parseValue(value) {
	var r = parseFloat(value.replace(/,/, "."));
	return isNaN(r) ? value : r;
}
function headerValue(key) {
	return parseValue((headers.filter(_ => _.key.startsWith(key))[0] || {}).value);
}
function nofStages() {
	return 7;
}
function load_kPa(stage) {
	// context.array.print(context.array.getObjects());
	var first = context.array.getObjects().filter(_ => _['Stage Number'] == ("1." + stage))[0];
	return first ? first['Stress Target (kPa)'] : "-";
}
function e_(vars, stage) {

/*-
	H0= 20.20 mm		ρs=  2.65 Mg/m3
	γd = 10.21 kN/m3 (calculated previously)
	ρd=  γd/9.81
	
Hs = H0/(1 + e0)
ef = (Hf - Hs ) / Hs"	
e0 = ρs/ρd - 1

	ρd=  10.21 / 9.81 = 1.04 Mg/m3
	e0= 2.65/1.04 - 1 = 1.5481
	
	Hs= 20.20 / (1 + 1.5481) = 7.9275 mm
	
	Bij eind Trap 3:  Gecorrigeerd totaal vervorming: 0.8082 mm
	Hf= 20.20 - 0.8082 = 19.3918 mm 	ef= (19.3918 - 7.9275) / 13.42 = 0.8543
*/
	var pd = vars.yd / (vars.G / 1000);
	var e0 = vars.ps / pd - 1;
	return e0;
}

		if((editor = this.up("devtools/Editor<gds>:root"))) {

this.on("resource-rendered", () => alert(1));

		var context = contextNeeded(this);
		if(!context.array.isActive()) return;

/*- Poriengetal:

	e0 = ρs / ρd - 1
	
	Hs = H0/(1 + e0)
	ef = (Hf - Hs ) / Hs
	
	-e0: initial void ratio (-)
	-ef: void ratio at the end of each load stage (-)
	-H0: initial height of specimen (mm)
	-Hs: height of solids (mm)
	-ρs: particle density (density of solid particles) (Mg/m3)
	-ρd: dry particle density (Mg/m3)
	
*/
			var lines = editor.qs("#ace").getLines();
			var headers = lines.filter(_ => _.split(",").length < 5)
				.map(_ => _.split("\",\""))
				.filter(_ => _.length === 2)
				.map(_ => [removeTrailingColon(_[0].substring(1)), 
					_[1].substring(0, _[1].length - 2)])
				.map(_ => ({category: "Header", key: _[0], value: _[1]}));

var vars = this.vars("variables", {});

vars.G = 9.81 * 1000;
vars.pw = 1.00; //(assumed value; note that water density may vary due to temperature)

vars.ps = headerValue("Specific Gravity");
vars.H = headerValue("Initial Height (mm)");
vars.D = headerValue("Initial Diameter (mm)");
vars.m = headerValue("Initial mass (g)");
vars.md = headerValue("Initial dry mass (g)");

vars.V = Math.PI * (vars.D/2) * (vars.D/2) * vars.H;
vars.y = vars.m / (Math.PI / 4 * vars.D * vars.D * vars.H) * vars.G;
vars.yd = vars.md / (Math.PI / 4 * vars.D * vars.D * vars.H) * vars.G;
vars.w0 = (vars.m - vars.md) / vars.md * 100;
vars.pd = vars.yd / (vars.G/1000);
vars.e0 = (vars.ps / vars.pd) - 1;
vars.Sr = (vars.w0 * vars.ps) / (vars.e0 * vars.pw);

			var values = [{
				name: "Algemeen",
				items: [
					{ key: "Projectnummer", value: "" },
					{ key: "Omschrijving", value: "" },
					{ key: "Locatie", value: "" },
					{ key: "Opdrachtgever", value: "" },
					{ key: "Opdrachtnemer", value: "" },
					{ key: "Boring", value: "" },
					{ key: "Monster", value: "" },
					{ key: "Coördinaten", value: "" }
				]
			}, {
				name: "Proefgegevens",
				items: [
					{ key: "Aantal trappen", value: nofStages() },
					{ key: "Proef periode", value: "" },
					{ key: "Opstelling nr", value: "" },
					{ key: "Laborant", value: "" },
					{ key: "Uitwerking", value: "" },
					{ key: "Proefmethode", value: "" },
					{ key: "Beproevingstemperatuur", value: "" },
					{ key: "Proefomstandigheden", value: "" },
					{ key: "Opmerking proef", value: "" }
				]
			}, {
				name: "Monstergegevens",
				items: [
					{ key: "Diepte (m-NAP)", value: "" },
					{ key: "Grondsoort (NEN-5104)", value: "" },
					{ key: "Monstertype", value: "" },
					{ key: "Monsterpreparatie", value: "" },
					{ key: "Opmerking monster", value: "" }
				]
			}, {
				name: "Initiële waarden",
				items: [
					{ key: "Hoogte", value: vars.H },
					{ key: "Diameter", value: vars.D },
					{ key: "Volume", value: vars.V },
					{ key: "Volumegewicht nat", symbol: "γ", value: vars.y },
					{ key: "Volumegewicht droog", symbol: "γd", value: vars.yd },
					{ key: "Vochtgehalte droog", unit: "%", symbol: "w", value: vars.w0 },
					{ key: "Verzadigingsgraad", unit: "%", symbol: "Sr", value: vars.Sr },
					{ key: "Volumegewicht vaste delen", value: vars.ps },
					{ key: "Poriengetal", value: vars.e0 }
				]
			}, {
				name: "Belastingschema",
				items: [
					{ key: "Trap 1", value: load_kPa(1) },
					{ key: "Trap 2", value: load_kPa(2) },
					{ key: "Trap 3", value: load_kPa(3) },
					{ key: "Trap 4", value: load_kPa(4) },
					{ key: "Trap 5", value: load_kPa(5) },
					{ key: "Trap 6", value: load_kPa(6) },
					{ key: "Trap 7", value: load_kPa(7) }
				]
			}, {
				name: "Poriëngetal",
				items: [
					{ key: "Trap 1", value: e_(vars, 1) },
					{ key: "Trap 2", value: e_(vars, 2) },
					{ key: "Trap 3", value: e_(vars, 3) },
					{ key: "Trap 4", value: e_(vars, 4) },
					{ key: "Trap 5", value: e_(vars, 5) },
					{ key: "Trap 6", value: e_(vars, 6) },
					{ key: "Trap 7", value: e_(vars, 7) }
				]
			}, {
				name: "Grensspanningen",
				items: [
					{ key: "Grensspanning NEN", value: "" },
					{ key: "Grensspanning Isotachen", value: "" },
					{ key: "Grensspanning Koppejan", value: "" },
					{ key: "Rek bij grensspanning NEN", value: "" },
					{ key: "Rek bij grensspanning Isotachen", value: "" },
					{ key: "Rek bij grensspanning Koppejan", value: "" },
				]
			}];
			values = values.map(_ => _.items.map(kvp => mixin({ category: _ }, kvp))).flat();

			this.scope("array-info").setArray(headers.concat(values));
		}			

	},
	"vcl/ui/Select onChange": function() {
		this._owner.setTimeout("render", () => {
			["Bjerrum", "Casagrande", "Taylor"].forEach(name => {
				var graph = this.ud("#graph_" + name);
				graph.setState("invalidated", true);//graph.isVisible());
			});
		}, 450);
	}
};

["", {  handlers: handlers }, [
	
	["vcl/data/Array", "array-info", {
		// array: [{
		// 	key: "Key",
		// 	value: "Value"
		// }]
	}],
	
	["vcl/ui/Bar", ("bar"), {}, [
		["vcl/ui/Select", ("stage"), { 
			options: ["Stage 1", "Stage 2", "Stage 3", "Stage 4", "Stage 5", "Stage 6", "Stage 7"],
			value: "Stage 2"
		}],
		["vcl/ui/Select", ("categoryField")],
		["vcl/ui/Select", ("valueField")],
		["vcl/ui/Select", ("valueField_kPa")],
	]],
	["vcl/ui/Tabs", ("tabs"), { align: "bottom", classes: "bottom" }, [
		["vcl/ui/Tab", { text: "Info", control: "info" }],
		["vcl/ui/Tab", { text: "Casagrande", control: "graph_Casagrande" }],
		["vcl/ui/Tab", { text: "Taylor", control: "graph_Taylor" }],
		["vcl/ui/Tab", { text: "Bjerrum", control: "graph_Bjerrum"  }],
		// ["vcl/ui/Tab", { text: "Bjerrum Sec", control: "graph_Bjerrum_sec"  }],
		// ["vcl/ui/Tab", { text: "Bjerrum Tot", control: "graph_Bjerrum_tot"  }],
		["vcl/ui/Tab", { text: "Isotachen", control: "graph_Isotachen", selected: true }],
		["vcl/ui/Tab", { text: "Kruip", control: "graph_Kruip"  }],
		["vcl/ui/Tab", { text: "Koppejan", control: "graph_Koppejan"  }],
	]],
	["vcl/ui/Panel", ("graphs"), {
		align: "client",
		css: {
			"": "background-color:white;",
			"a": "visibility:hidden;",
		}
	}, [
		["vcl/ui/List", ("info"), { 
			autoColumns: true,
			source: "array-info",
			visible: false
		}],
		["vcl/ui/Panel", ("graph_Casagrande"), {
			align: "client", visible: false,
			onRender() {
				var context = contextNeeded(this);
				context.categoryField = "Time since start of stage (s)";

			    var meta = {}, index = {}, values = [], previous;
				var series = [{
					title: "Zetting (um)",
					valueAxis: "v1", valueField: "y" // zetting (mm)
				}];

				context.array.getObjects()
					.filter(obj => ("" + obj['Stage Number']).split(".").pop() === context.stage)
					.forEach(obj => {
						/*- translates context.array logarithmically 
							and pushes into values */

						var sec = obj[context.categoryField], x;
						if(!sec) x = 0.001; else {
							// x = Math.log(sec / 60) / Math.log(10);
							// x = x.toFixed(5);
							x = sec / 60;
						}
	
						index[x] = js.mixIn(index[x] || {});
						index[x]['Stage Number'] = obj['Stage Number'];
						index[x][context.valueField] = obj[context.valueField];
						index[x].x = parseFloat(x);
						index[x].y = obj[context.valueField] * 1000;
						index[x].sec = obj[context.categoryField];
						index[x].hours = index[x].sec / 3600;
						index[x].mins = index[x].sec / 60;
					});
				Object.keys(index).sort(sort_numeric).forEach(key => {
					var entry = index[key];
					if(previous) {
						entry.delta = entry[context.valueField] - previous[context.valueField];
					}
					previous = entry;
					values.push(entry);
				});
				
				this.vars("am", { series: series, meta: meta, data: values });

				makeChart(this, {
					xAxisTitle: "Tijd in minuten, logaritmisch",
					xAxisLogarithmic: true
				});
			}
		}],
		["vcl/ui/Panel", ("graph_Taylor"), {
			align: "client", visible: false,
			onRender() {
				var context = contextNeeded(this);
				context.categoryField = "Time since start of stage (s)";

			    var meta = {}, index = {}, values = [], previous;
				var series = [{
					title: "Zetting (um)",
					valueAxis: "v1", valueField: "y"
				}];
				
				context.array.getObjects()
					.filter(obj => ("" + obj['Stage Number']).split(".").pop() === context.stage)
					.forEach(obj => {
						var sec = obj[context.categoryField], x;
						// if(!sec) return;
	
						x = Math.sqrt(sec / 60);
						// x = x.toFixed(5);
	
						index[x] = js.mixIn(index[x]);
						index[x]['Stage Number'] = obj['Stage Number'];
						index[x][context.categoryField] = sec;
						index[x].x = parseFloat(x);
						index[x].y = obj[context.valueField] * 1000;
					});

				Object.keys(index).sort(sort_numeric).forEach(key => {
					var entry = index[key];
					if(previous) { }
					previous = entry;
					values.push(entry);
				});
				
				this.vars("am", { series: series, meta: meta, data: values });
				
				makeChart(this);
			}
		}],
		["vcl/ui/Panel", ("graph_Bjerrum"), {
			align: "client", visible: false,
			onRender() {
				var context = contextNeeded(this);
				context.categoryField = "Time since start of test (s)";

			    var meta = {}, index = {}, values = [], previous;
				var series = [{
					title: "Verticale rek (∆H / Ho)",
					yAxis: "v1", valueAxis: "v1", valueField: "y",
				}, {
					title: "(Isotachen) Natuurlijke rek (-ln(1 - (∆H / Ho))",
					yAxis: "v1", valueAxis: "v1", valueField: "y3",
				}, {
					title: "Belasting (kPa)",
					yAxis: "v2", valueAxis: "v2", valueField: "y2",
			        bullet: "round", bulletSize: 5
				}];
				
				context.array.getObjects().forEach(obj => {
					/*- translates context.array logarithmically and pushes into values */
					var sec = obj[context.categoryField];
					
					/*- ignore the 1st hour */
					if(sec < 3600) return;
					
					/*- calculate x := log10(sec) - fix to 5 decimals */
					// var x = Math.log(sec / 3600) / Math.log(10);
					// x = x.toFixed(5);
					var x = sec / 3600;
					
					index[x] = js.mixIn(index[x] || {});
					index[x]['Stage Number'] = obj['Stage Number'];
					index[x][context.valueField] = obj[context.valueField];
					index[x][context.valueField_kPa] = obj[context.valueField_kPa];
					
					index[x].x = parseFloat(x);
					var Ev = (index[x].y = obj[context.valueField] * 0.14333168316831685);
					index[x].y2 = obj[context.valueField_kPa];
					index[x].y3 = -Math.log(1 - Ev);
					index[x].hours = sec / 3600;
					index[x].minutes = sec / 60;
					index[x].seconds = sec;
				});
				Object.keys(index).sort(sort_numeric).forEach(key => {
					var entry = index[key];
					if(previous) {
						if(previous['Stage Number'] === entry['Stage Number']) {
							delete previous.y2;
						}
					}
					previous = entry;
					values.push(entry);
				});
				this.vars("am", { series: series, meta: meta, data: values, context: context });

				makeChart(this, { 
					type: "xy",
				    valueAxes: [{
				        id: "v1", position: "left", reversed: true
					}, {
						id: "v2", position: "right", reversed: true, oposite: true,
						// synchronizationMultiplier: 1/0.01158383353,
						// synchronizeWith: "v1"
					}, {
						position: "bottom",
						title: "Tijd in uren, logaritmisch",
						logarithmic: true
					}],
					// guides: [0, 1, 2, 3, 4, 5].map(_ => ({
					// 	// category: _, toCategory: _,
					// 	// value: _, toValue: _,
					// 	xValue: _, toXValue: _,
					// 	// x: _, toX: _,
					// 	// expand: true,
					// 	label: js.sf("%d", Math.pow(10, _)),
					// 	fillAlpha: 1,
					// 	lineAlpha: 1,
					// 	lineColor: "red",
					// 	lineThickness: 2,
					// 	// position: "top",
					// 	// valueAxis: "x"
					// })),
				});
			},
		}],
		["vcl/ui/Panel", ("graph_Isotachen"), {
			align: "client", visible: false,
			onRender() {
				var context = contextNeeded(this);
				context.categoryField = "Time since start of test (s)";

			    var meta = {}, index = {}, values = [], previous;
				var series = [{
					title: "Natuurlijke verticale (Hencky) rek (-ln(1 - (∆H / Ho))",
					yAxis: "v1", valueAxis: "v1", valueField: "y"
				}];

				var kPa = [], push_kPa = (obj) => kPa.push({
					// x: Math.log(obj[context.valueField_kPa]) / Math.log(10),
					x: obj[context.valueField_kPa],
					y: (obj.y2 = obj.y)
				});
				
				context.array.getObjects().forEach(obj => {
					/*- translates context.array logarithmically and pushes into values */
					var sec = obj[context.categoryField];
					
					/*- ignore the 1st hour */
					if(sec < 3600) return;
					
					/*- calculate x := log10(sec) - fix to 5 decimals */
					var x = Math.log(sec / 3600) / Math.log(10);
					x = x.toFixed(5);
					
					index[x] = js.mixIn(index[x] || {});
					index[x]['Stage Number'] = obj['Stage Number'];
					index[x][context.valueField] = obj[context.valueField];
					index[x][context.valueField_kPa] = obj[context.valueField_kPa];
					
					index[x].x = parseFloat(x);
					var Ev = (obj[context.valueField] * 0.14333168316831685);
					index[x].y = -Math.log(1 - Ev);
					index[x].hours = sec / 3600;
					index[x].minutes = sec / 60;
					index[x].seconds = sec;
				});
				Object.keys(index).sort(sort_numeric).forEach(key => {
					var entry = index[key];
					if(previous) {
						if(previous['Stage Number'] !== entry['Stage Number']) {
							push_kPa(previous);
						}
					}
					previous = entry;
					values.push(entry);
				});
				push_kPa(previous);
				this.vars("am", { series: series, meta: meta, data: kPa, context: context });

var log = (x) => Math.log(x) / Math.log(10);
var inv_log = (x) => Math.log(10) * Math.pow(Math.E, x);
var s1 = line_intersect(
	kPa[0].x, kPa[0].y, kPa[1].x, kPa[1].y,	
	kPa[2].x, kPa[2].y, kPa[3].x, kPa[3].y
);

// N = b * g ^ t; (https://www.youtube.com/watch?v=i3jbTrJMnKs)
var t1 = kPa[0].y, N1 = kPa[0].x;
var t2 = kPa[1].y, N2 = kPa[1].x;
var dt1 = t2 - t1;
var g1 = Math.pow(N2 / N1, 1 / dt1);
var b1 = N1 / Math.pow(g1, t1);

var t3 = kPa[2].y, N3 = kPa[2].x;
var t4 = kPa[3].y, N4 = kPa[3].x;
var dt2 = t4 - t3;
var g2 = Math.pow(N4 / N3, 1 / dt2);
var b2 = N3 / Math.pow(g2, t3);

var ts = [], delta;
for(var t = t2; t < t3; t += (t3 - t2) / 10000) {
	var obj = { 
		t: t,
		N1: b1 * Math.pow(g1, t), 
		N2: b2 * Math.pow(g2, t)
	};
	if((obj.delta = Math.abs(obj.N2 - obj.N1)) < delta || delta === undefined) {
		delta = obj.delta;
		ts.unshift(obj);
	}
}
 
this.print("N=b*g^t", {
	ts: ts,
	t1: t1, t2: t2, N1: N1, N2: N2, dt1: dt1, g1: g1, b1: b1,
	t3: t3, t4: t4, N3: N3, N4: N4, dt2: dt2, g2: g2, b2: b2
});


this.print("ts", ts)

var s2 = {x: 42.5, y: 0.09}, s3 = {x: ts[0].N1, y: ts[0].t};
this.print("s1 (calc'd)", js.mixIn(s1));
this.print("s2 (estm'd)", js.mixIn(s2));

				makeChart(this, { 
					type: "xy",
					trendLines: [{
							initialXValue: kPa[0].x,
							initialValue: kPa[0].y,
							finalXValue: s3.x,
							finalValue: s3.y,
							lineColor: "purple", lineThickness: 3
						}, {
							initialXValue: kPa[3].x,
							initialValue: kPa[3].y,
							finalXValue: s3.x,
							finalValue: s3.y,
							lineColor: "purple", lineThickness: 3
						}, {
							initialXValue: kPa[0].x,
							initialValue: kPa[0].y,
							finalXValue: s2.x,
							finalValue: s2.y
						}, {
							initialXValue: kPa[3].x,
							initialValue: kPa[3].y,
							finalXValue: s2.x,
							finalValue: s2.y
						}, {
							initialXValue: kPa[1].x,
							initialValue: kPa[1].y,
							finalXValue: s1.x,
							finalValue: s1.y,
							lineColor: "red"
						}, {
							initialXValue: kPa[2].x,
							initialValue: kPa[2].y,
							finalXValue: s1.x,
							finalValue: s1.y,
							lineColor: "red"
							
						}],
					valueAxes: [{
				        id: "v1", position: "left", reversed: true,
						title: series[0].title
					}, {
						position: "bottom", title: "Belasting (kPa), log",
						minimum: kPa[0].x * 0.75,
						logarithmic: true,
					}]
				});
			},
		}],
	]]
	
]];