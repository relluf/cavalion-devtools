"use strict";

/*- VA-20201218-3 */

var js = window.js, mixin = js.mixIn;
var AmCharts = window.AmCharts;
var sort_numeric = (i1, i2) => parseFloat(i1) < parseFloat(i2) ? -1 : 1;
var removeTrailingColon = (s) => s.replace(/\:$/, "");

var Tabs = 
	["vcl/ui/Tabs", ("tabs-graphs"), {}, [
		["vcl/ui/Tab", { text: "Casagrande", control: "graph_Casagrande", selected: true }],
		["vcl/ui/Tab", { text: "Taylor", control: "graph_Taylor", selected: !true }],
		["vcl/ui/Tab", { text: "Bjerrum (poriëngetal)", control: "graph_Bjerrum_e", selected: !true }],
		["vcl/ui/Tab", { text: "Bjerrum (rek)", control: "graph_Bjerrum_r", selected: !true }],
		["vcl/ui/Tab", { text: "Isotachen", control: "graph_Isotachen", selected: !true }],
		["vcl/ui/Tab", { text: "Koppejan", control: "graph_Koppejan", selected: !true }],
	]];

function makeChart(c, opts) {
	
	function render(options) {
		var node = options.node || this.getNode();
	
		this.print("makeChart", this.vars("am"));
		
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
		    
		    type: "xy",  
		    colors: ["rgb(56, 121, 217)", "black"],
		    // legend: { useGraphSettings: true },
			dataProvider: this.vars("am.data"),
			minValue: 1, maxValue: 0,
		    valueAxes: [{
		        id: "y1", position: "left",
		        reversed: true
			}, {
				position: "bottom", 
				logarithmic: options.xAxisLogarithmic,
				title: options.xAxisTitle
			}],
		    categoryField: "x"
		};
		options = js.mixIn(defaults, options);
		options.graphs = options.graphs || this.vars("am.series").map(serie => {
			return js.mixIn({
	        	type: "line", lineThickness: 2,
		        connect: serie.connect || false,
			    xField: "x", yField: serie.valueField || "y",
			    yAxis: serie.yAxis || "y1"
		    }, serie);
		});
		
		options.valueAxes.forEach(ax => ax.zoomable = true);
		// options.valueAxes.forEach(ax => ax.precision = 4);
		var emit = (a, b) => {
			// this.print("emit: " + a, b);
			this.emit(a, b);
		};
		var chart = AmCharts.makeChart(node, options);

		this.vars("am.chart", chart);

		chart.addListener("drawn", (e) => emit("rendered", [e, "drawn"]));
		chart.addListener("dataUpdated", (e) => emit("rendered", [e, "dataUpdated"]));
		chart.addListener("rendered", (e) => emit("rendered", [e]));
		// chart.addListener("init", (e) => emit("rendered", [e, "init"]));
		// chart.addListener("zoomed", (e) => emit("zoomed", [e]));
		// chart.addListener("changed", (e) => emit("changed", [e]));
	}
	
	opts.immediate ? render.apply(c, [opts || {}]) : c.nextTick(() => render.apply(c, [opts || {}]));
}
function contextNeeded(c) {
	return {
		array: c.ud("devtools/Editor<>", "#array"),
		// stage: c.ud("#stage").getValue().split(" ").pop(),
    	categoryField: "Time since start of test (s)",
    	valueField: "Axial Displacement (mm)",
    	valueField_kPa: "Axial Stress (kPa)",
    	values_: c.vars(["values_"])
	};
}

function grenswaarden_Isotachen(context, vars) {
	var index = {};

	var arr = context.array.getObjects(), H0 = arr[0][context.valueField];
	context.array.getObjects().forEach(obj => {
		var sec = obj[context.categoryField];
		
		/*- calculate x := log10(sec) - fix to 5 decimals */
		var x = Math.log10((sec / 3600) || 0.00001);
		x = x.toFixed(10);
		
		index[x] = js.mixIn(index[x] || {});
		index[x]['Stage Number'] = obj['Stage Number'];
		index[x][context.valueField] = obj[context.valueField];
		index[x][context.valueField_kPa] = obj[context.valueField_kPa];
		
		var Ev = -(obj[context.valueField] - H0) / vars.H;
		index[x].x = parseFloat(x);
		index[x].y = -Math.log(1 - Ev);
		index[x].hours = sec / 3600;
		index[x].minutes = sec / 60;
		index[x].seconds = sec;
	});
	
	var kPa = [], previous, push = (o) => kPa.push({
		x: o[context.valueField_kPa],
		y: (o.y2 = o.y)
	});
	Object.keys(index).sort(sort_numeric).forEach(key => {
		var entry = index[key];
		if(previous && previous['Stage Number'] !== entry['Stage Number']) {
			push(previous);
		}
		previous = entry;
	});
	push(previous);

	var r = log_line_intersect(kPa[0].x, kPa[0].y, kPa[1].x, kPa[1].y, kPa[2].x, kPa[2].y, kPa[3].x, kPa[3].y);
	r.kPa_ = kPa;
	return r;
}
function grenswaarden_Koppejan(context, vars) {
	var graph = context.array.ud("#graph_Koppejan"), start;
	vars.slope_variant = 1;
	var variant1 = graph.get("onRender").apply(graph, [true]);
	delete vars.slope_variant;
	var variant2 = graph.get("onRender").apply(graph, [true]);
	
	return {variant1: variant1, variant2: variant2};
}

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
/*- find intersection in logarithimic-plane, straight line on log-scale? >> N = b * g ^ t; (https://www.youtube.com/watch?v=i3jbTrJMnKs) */

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
	if(t1 > t3) {
		t1 = [t3, t1];
		t3 = t1.pop();
		t1 = t1.pop();
	}
	
/*- TODO cheating part -> refactor to some sort of bubble sort mechanism? */
	for(var t = t1; t < t3; t += (t3 - t2) / 5000) {
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

var handlers = {
	"loaded": function() {
		var lines, headers, context, me = this, cache;
		var vars = this.vars("variables", {});
		var key_Y = "Axial Displacement (mm)";
		
		vars.G = 9.81 * 1000;
		vars.pw = 1.00; //(assumed value; note that water density may vary due to temperature)

		function parseValue(value) {
			var r = parseFloat(value.replace(/,/, "."));
			return isNaN(r) ? value : r;
		}
		function headerValue(key) {
			return parseValue((headers.filter(_ => _.name.startsWith(key))[0] || {}).value);
		}
		
		function nofStages() {
			var values = values_();
			return values.length ? parseInt((values_().pop()['Stage Number'] - 1) * 10, 10) : 0;
		}
		function values_(stage, arr) {
			arr = arr || context.array.getObjects();
			/*- this cache-thing exist because I am lazy and do not want refactor just yet */
			if(!arr && cache.values_.hasOwnProperty(stage)) return cache.values_[stage];
			
			if(stage === undefined) return [].concat(context.array.getObjects());
			
			return (cache.values_[stage] = arr.filter(_ => _['Stage Number'] == ("1." + stage)));
		}
		function valuesUntil_(stage) {
			/*- this cache-thing exist because I am lazy and do not want refactor just yet */
			if(cache.valuesUntil_.hasOwnProperty(stage)) return cache.valuesUntil_[stage];
			
			return (cache.valuesUntil_[stage] = context.array.getObjects()
					.filter(_ => _['Stage Number'] <= ("1." + stage)));
		}

		function load_(stage) {
			// context.array.print(context.array.getObjects());
			var first = values_(stage)[0];
			return first ? first['Stress Target (kPa)'] : "-";
		}
		function Hi_(stage) {
			/* initial height of stage */
			var min, max; 

			valuesUntil_(stage).forEach(obj => {
				if(min === undefined || min > obj[key_Y]) min = obj[key_Y];
				if(max === undefined || max < obj[key_Y]) max = obj[key_Y];
			});
		
			return vars.H - (max === undefined ? 0 : max - min);
		}
		function H50_(stage) {
			// TODO
			return (t___(stage) || {t50: {}}).t50[2];
		}
		function deltaH_(stage) {
			/* delta of stage */
			var min, max; 

			// values_(stage).forEach(obj => {
			// 	if(min === undefined || min > obj[key_Y]) min = obj[key_Y];
			// 	if(max === undefined || max < obj[key_Y]) max = obj[key_Y];
			// });
			
			var values = values_(stage);
			min = values[0][key_Y];
			max = values.length ? values[values.length - 1][key_Y] : undefined;
		
			return max === undefined ? 0 : max - min;
		}
		function z_(stage) {
			return values_(stage).pop()[key_Y];
		}
		
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
			var H = Hi_(stage);
			var dH = deltaH_(stage);
			var y = vars.m / (Math.PI / 4 * vars.D * vars.D * H) * vars.G;
			var yd = vars.md / (Math.PI / 4 * vars.D * vars.D * H) * vars.G;
			var pd = yd / (vars.G / 1000);

			return vars.ps / pd - 1;
		}
		function Sr_(stage) {
			
			var dH = deltaH_(stage);
			var H = vars.H - dH;

			var V = Math.PI * (vars.D/2) * (vars.D/2) * H;
			var y = vars.m / (Math.PI / 4 * vars.D * vars.D * H) * vars.G;
			var yd = vars.md / (Math.PI / 4 * vars.D * vars.D * H) * vars.G;
			var w0 = (vars.m - vars.md) / vars.md * 100;
			var pd = yd / (vars.G/1000);
			var e0 = (vars.ps / pd) - 1;
			var Sr = (w0 * vars.ps) / (e0 * vars.pw);
			
			return Sr;
		}
		function t___(stage, values, meta, guides, trendLines) {
			var index = {}, all = [], previous;
			var context = { categoryField: "Time since start of stage (s)", valueField: "Axial Displacement (mm)", stage: stage };
			values = values || [], meta = meta || {};
			
	/*- setup Taylor dataset for stage */
			values_(stage).forEach(obj => {
				var sec = obj[context.categoryField], x;

				x = Math.sqrt(sec / 60);
				index[x] = js.mixIn(index[x]);
				index[x]['Stage Number'] = obj['Stage Number'];
				index[x][context.categoryField] = sec;
				index[x].x = parseFloat(x);
				index[x].y = obj[context.valueField] * 1000;
				
				all.push(index[x]);
			});
				
			Object.keys(index).sort(sort_numeric).forEach(key => {
					var entry = index[key];
					if(previous) { 
						entry.delta = entry.y - previous.y;
					}
					previous = entry;
			 		values.push(entry);
				});
			
	/* determine boundaries Y (min-max) */
			values.forEach(obj => {
					if(meta.min === undefined || meta.min > obj.y) meta.min = obj.y;
					if(meta.max === undefined || meta.max < obj.y) meta.max = obj.y;
				});
				
	/* 10-40% boundaries */
			var delta = (meta.delta = meta.max - meta.min);
			var h10 = (meta.h10 = 0.1 * delta);
			var h40 = (meta.h40 = 0.4 * delta);
			
	/* translate Y values to 0 */
			values.forEach(_ => _.y -= meta.min);

	/*- filter values within 10-40% boundary */
			var values10_40 = (meta.values10_40 = all.filter(obj => obj.y > h10 && obj.y < h40)
				.sort((i1, i2) => i1.delta < i2.delta ? 1 : -1));

	/*- is it possible? */
			if(values10_40.length >= 2) {

		/*- YES: determine slope of 10-40% boundary */
				var dx = values10_40[values10_40.length - 1].x - values10_40[0].x;
				var dy = values10_40[values10_40.length - 1].y - values10_40[0].y;
				var slope = (meta.slope = dy / dx);
	
		/*- find intersection with Y-axis (Q) */
				var y0 = (meta.y0 = values10_40[0].y - values10_40[0].x * slope);
				var delta1_25_x = (delta * 1.25 - meta.y0) / slope;
				
			/*- add guide if applicable) */
				guides && guides.push({
					label: "0%", position: "right",
					value: y0, dashLength: 2,
					lineAlpha: 1, inside: true
				});
				
		/* find intersection with curve (B) @ 90% consolidation */
	
			/*- start with point on 1.15 line where Y=top of 10-40% boundary */
				var sy1 = values10_40[1].y;
				var sx1 = (sy1 - y0) / slope * 1.15;
			/*- find position in curve (all) */
				var minutes = sx1 * sx1;
				var position = Math.floor(minutes * 2); // TODO this assumes a 30 second interval
				for(position = 0; position < all.length && all[position].x < minutes; ++position) ;

			/*- bail out when needed... */				
				if(position >= all.length) return undefined;

			/*- find end point on 1.15 line */
				var sy2 = all[position].y;
				var sx2 = (sy2 - y0) / slope * 1.15;
			/*- ...where line crosses (ie. dsx2 > 0)*/	
				var dsx = sx2 - (all[position].x);
				var passed = [[dsx, all[position], {x: sx2, y: sy2}]];
				while(dsx > 0 && position < all.length) {
					position++;
					
					sy2 = all[position].y;
					sx2 = (sy2 - y0) / slope * 1.15;					
					
					dsx = sx2 - (all[position].x);
					passed.unshift([dsx, all[position], {x: sx2, y: sy2}]);
				}
					
			/*- the entry with the smallest delta sorts to front (index 0) */
				if(passed.length == 1) {
					passed.push(passed[0]);
				}

					trendLines && trendLines.push({
						/*- Q -> a */
						initialXValue: 0, initialValue: y0,
						finalXValue: delta1_25_x, finalValue: delta * 1.25,
						lineColor: "red	", lineThickness: 1
					}, {
						/*- measurement used for slope */
						initialXValue: values10_40[0].x, initialValue: values10_40[0].y,
						finalXValue: values10_40[values10_40.length - 1].x, finalValue: values10_40[values10_40.length - 1].y,
						lineColor: "red", lineThickness: 3
					}, {
						/* 1.15 line */
						initialXValue: 0, initialValue: y0,
						finalXValue: delta1_25_x * 1.15, finalValue: delta * 1.25,
						lineColor: "red", lineThickness: 1, dashLength: 3
					});
							
	// 		/*- get intersection (B) pag. 24 */
	// 				meta.B = line_intersect(
	// 						passed[0][2].x, passed[0][2].y, passed[1][2].x, passed[1][2].y,
	// 						passed[0][1].x, passed[0][1].y, passed[1][1].x, passed[1][1].y
	// 					) || passed[0][1];

					
			/*- get intersection (B) page 24 */
				meta.B = line_intersect(
						passed[0][2].x, passed[0][2].y, passed[1][2].x, passed[1][2].y,
						passed[0][1].x, passed[0][1].y, passed[1][1].x, passed[1][1].y
					) || passed[0][1];
					
				if(meta.B) {
					trendLines && trendLines.push({
						initialXValue: meta.B.x, initialValue: 0,
						finalXValue: meta.B.x, finalValue: meta.B.y,
						lineColor: "red"
					});
					guides && guides.push({
						label: "50%", position: "right",
						value: y0 + ((meta.B.y - y0) / 90) * 50, 
						dashLength: 2, lineAlpha: 1, inside: true
					}, {
						label: "90%", position: "right",
						value: meta.B.y, dashLength: 2,
						lineAlpha: 1, inside: true
					}, {
						label: "100%", position: "right",
						value: y0 + ((meta.B.y - y0) / 90) * 100, 
						dashLength: 2, lineAlpha: 1, inside: true
					});
				}
			
					
		// 		/*- debug/helpers, showing which lines determine intersection */
						trendLines && trendLines.push({
							initialXValue: sx1, initialValue: sy1,
							finalXValue: sx2, finalValue: sy2,
							lineColor: "blue", lineThickness: 1, dashLength: 1
						}, {
							initialXValue: passed[0][1].x, initialValue: 0,
							finalXValue: passed[0][1].x, finalValue: passed[0][1].y,
							lineColor: "green", _dashLength: 2, lineThickness: 2
						}, {
							initialXValue: passed[0][2].x, initialValue: 0,
							finalXValue: passed[0][2].x, finalValue: passed[0][2].y,
							lineColor: "orange", _dashLength: 2
						}, {
							initialXValue: passed[1][1].x, initialValue: 0,
							finalXValue: passed[1][1].x, finalValue: passed[1][1].y,
							lineColor: "green", _dashLength: 2, lineThickness: 2
						}, {
							initialXValue: passed[1][2].x, initialValue: 0,
							finalXValue: passed[1][2].x, finalValue: passed[1][2].y,
							lineColor: "orange", _dashLength: 2
						});
						
		/* find intersection with curve @ 50% consolidation */
				var xy50, y50 = y0 + ((meta.B.y - y0) / 90) * 50;
			/*- find position in curve (all) */
				position = 0;
				while(all[position].y < y50 && position < all.length) {
					position++;
				}
				if(position > 0 && position < all.length - 2) {

					dx = all[position].x - all[position - 1].x;
					dy = all[position].y - all[position - 1].y;

					xy50 = {
						x: all[position].x - (all[position].y - y50) * (dx / dy), 
						y: y50
					};
				}

				return {
					t50: [xy50 ? 60 * (xy50.x * xy50.x) : undefined, xy50 && xy50.x, y50],
					t90: [60 * (meta.B.x * meta.B.x), meta.B.x, meta.B.y]
				};
			}
		/*- NO */
			return undefined;
		}
		function t50_(stage) {
			return (t___(stage)||{t50:{}}).t50[0];
		}
		function t90_(stage) {
			return (t___(stage)||{t90:{}}).t90[0];
		}
		
		function Cv10_(stage, wantsTaylor) {
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
		
		
		Hi = 20.20 - 0.4998 = 19.7002 mm
		L = 0.50 * 19.7002 = 9.8501 mm = 9.8501 x 10-3 m
		t50 = 10logt50 = 102 = 100 s
		
		cv;20 =0.197 * 0.00985012 * 1.3 / 100 =2.48 x 10-7 m2/s"					
*/
			var L = 0.5 * H50_(stage); 
			var fT = 1, cf = wantsTaylor ? 0.848 : 0.197;
			var t = wantsTaylor ? t90_(stage) : t50_(stage);

			return t !== undefined ? cf * (L*L / 1000) * fT / t : t;
		}
		function Mv_(stage, wantsTaylor) {
			var Hi = Hi_(stage), Hf = Hi + deltaH_(stage);
			return ((Hi - Hf) / Hf) * (1000 / load_(stage) - load_(stage - 1));
		}
		function k10_(stage, wantsTaylor) {
			var r = Cv10_(stage, wantsTaylor) * Mv_(stage, wantsTaylor) * vars.pw * vars.G;
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
			
			stage--; //vars.kPa_ starts at 0
			
			var e1 = vars.kPa_[stage - 1].y_e, e2 = vars.kPa_[stage].y_e;
			var sv1 = vars.kPa_[stage - 1].x, sv2 = vars.kPa_[stage].x;

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

			stage--; //vars.kPa_ starts at 0
			
			var Hi = Hi_(stage), Hf = Hi + deltaH_(stage);
			var Evc1 = Hi / vars.H * 100;
			var Evc2 = Hf / vars.H * 100;
			var sv1 = vars.kPa_[stage - 1].x, sv2 = vars.kPa_[stage].x;

			return ((Evc2 - Evc1) / 100) / Math.log10(sv2 / sv1);
		}
		function RR_(stage) {
			return CR_(stage); // is gewoon hetzelfde
		}

		function Ca_(stage) {
			/*- NOT FININSHED
			
				Cα (secundaire): Cα = ΔH/Hi * 1 / Δlogt
				
				- Hi: height of specimen at start of load stage.
				- dH: change in specimen height along chosen linear section of the compression - time curve.
				- dlogt: change in logarithm of time along chosen linear section of the compression - time curve (semilog).
				
				GEGEVENS (Data from Trap 3 H-log t segment)
				- Hi (bij begin Trap 3) = 19.7002 mm
				- d1= 0.8051 mm
				- d2= 0.8082 mm
				- t1= 78150 s
				- t2= 86070 s
				
				Cα = (0.8082 - 0.8051)/19.7002 * 1/ (log 86070 - log 78150)
				Cα = 0.00375"				"
				
				LET OP!: Formula is the same with both CUR Aanb. 101 and ISO 17892-5. 
				Different from NEN 5118.
				
				Two points from tangent line at end of segment selected arbitrarily."
			*/

			/*- find segment with smallest slope */
			var swss = [].concat(vars.kPa_)
				.map((_, i) => js.mixIn({index: i}, _)) // remember index
				.sort((i1, i2) => i1.slope_e < i2.slope_e ? -1 : 1)[0].index;

			var Hi = Hi_(stage);
			var dH = deltaH_(stage);
			var dlogt = Math.log10(vars.kPa_[swss + 1].x) - Math.log10(vars.kPa_[swss].x);
			
			return (dH / Hi) / dlogt;

		}
		function Csw_(stage) {
			/*-
				Csw (zwelindex) - Csw = -Δe / log ((σ'v + Δσ'v)/σ'v)
				
				- Δe= e2 - e1: change in void ratio 
				- σ'v: vertical effective stress before load change (kPa)
				- σ'v + Δσ'v: vertical effective stress after load change Δσ'v (kPa)"				"GEGEVENS
				(Data from unloading e-log p segment)
				- e1= 1.3144
				- e2= 1.3241
				- σ'v1= 125 kPa
				- σ'v2= 50 kPa
				
				Csw= - (1.3241 - 1.3144) / log (50/125)
				Csw= 0.0244
				Waarden van poriëngetal berekend op basis van proefdata in de GDS-bestand.
			*/

			/*- find segment with smallest slope */
			var swss = [].concat(vars.kPa_)
				.map((_, i) => js.mixIn({index: i}, _)) // remember index
				.sort((i1, i2) => i1.slope_e < i2.slope_e ? -1 : 1)[0].index;
			
			var e1 = vars.kPa_[swss], e2 = vars.kPa_[swss + 1];
			var sv1 = vars.kPa_[swss].x + 1, sv2 = vars.kPa_[swss];
			
			return -(e2 - e1) / Math.log10(sv2 / sv1);
		}
		
		function iso_a_(stage, context, vars) {
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
			var EvH1 = vars.kPa_[stage].y_rek * 100;
			var EvH2 = vars.kPa_[stage + 1].y_rek * 100;
			var pv1 = vars.kPa_[stage].x;
			var pv2 = vars.kPa_[stage + 1].x;
			
			return (EvH2 - EvH1) / 100 / Math.log(pv2 / pv1);
		}
		function iso_asw_(stage, context, vars) {
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
			var EvH1 = vars.kPa_[stage].y_rek * 100;
			var EvH2 = vars.kPa_[stage + 1].y_rek * 100;
			var pv1 = vars.kPa_[stage].x;
			var pv2 = vars.kPa_[stage + 1].x;
			return (EvH2 - EvH1) / 100 / Math.log(pv2 / pv1);
		}

		var editor, initialize = (a) => {
			context = contextNeeded(this);
			if(!context.array || !context.array.isActive()) return;
			
			if(a===undefined) {
				try {
					initialize(null);
				} catch(e) {
					console.error(e);
					return alert(e.message);
				}
			}
			
	/*- reset cache */
			cache = { values_: {}, valuesUntil_: {} };
	/*- source document */
			lines = editor.qs("#ace").getLines();
			if(lines.length === 1) return; // can't be right
	/*- parse headers */	
			headers = lines.filter(_ => _.split(",").length < 5)
				.map(_ => _.split("\",\""))
				.filter(_ => _.length === 2)
				.map(_ => [removeTrailingColon(_[0].substring(1)), 
					_[1].substring(0, _[1].length - 2)])
				.map(_ => ({category: "Header", name: _[0], value: _[1]}));

	/*- read variables from header information */
			vars.ps = headerValue("Specific Gravity");
			vars.H = headerValue("Initial Height (mm)");
			vars.D = headerValue("Initial Diameter (mm)");
			vars.m = headerValue("Initial mass (g)");
			vars.md = headerValue("Initial dry mass (g)");
			vars.mf = headerValue("Final Mass");
			vars.mdf = headerValue("Final Dry Mass");
			vars.stages = nofStages();
			vars.t___ = t___;

	/*- initialize and calculate some more variables (see documentation `#VA-20201218-3`) */
			vars.V = Math.PI * (vars.D/2) * (vars.D/2) * vars.H;
			vars.y = vars.m / (Math.PI / 4 * vars.D * vars.D * vars.H) * vars.G;
			vars.yd = vars.md / (Math.PI / 4 * vars.D * vars.D * vars.H) * vars.G;
			vars.w0 = (vars.m - vars.md) / vars.md * 100;
			vars.pd = vars.yd / (vars.G/1000);
			vars.e0 = (vars.ps / vars.pd) - 1;
			vars.Sr = (vars.w0 * vars.ps) / (vars.e0 * vars.pw);
			vars.dH = deltaH_();

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

			var nofs = nofStages(), kPa_ = [];
			for(var stage = 1; stage <= nofs; ++stage)	{
				// this.vars(js.sf("variables.stages(%s)", stage), t___(stage));
				// this.vars(js.sf("variables.stages(%s).data", stage), values_(stage));
				kPa_.push(stage);
			}

			var dH = 0, prev; kPa_ = kPa_.map(stage => { 
				var current = {
					x: load_(stage),  // kPa
					y_rek: (dH += deltaH_(stage)) / Hi_(),
					y_e: e_(stage),
					y_z: z_(stage)
				};
				if(prev) {
					current.dx = current.x - prev.x;
					current.dy_rek = current.y_rek - prev.y_rek;
					current.dy_e = current.y_e - prev.y_e;
					current.dy_z = current.y_z - prev.y_z;
					current.slope_rek = current.dy_rek / current.dx;
					current.slope_e = current.dy_e / current.dx;
					current.slope_z = current.dy_z / current.dx;
				}
				
				return (prev = current);
			});

			vars.kPa_ = kPa_;
			this.vars("values_", values_);

		/*- Grenswaarden NEN (Bjerrum) */
			vars.grenswaarden = {
				nen: log_line_intersect(
						kPa_[0].x, kPa_[0].y_rek, kPa_[1].x, kPa_[1].y_rek, 
						kPa_[2].x, kPa_[2].y_rek, kPa_[3].x, kPa_[3].y_rek),
				iso: grenswaarden_Isotachen(context, vars),
				kop: grenswaarden_Koppejan(context, vars)
			};
			
			var stages = [];
			for(var i = 1; i <= vars.stages; ++i) {
				kPa_[i - 1].iso = vars.grenswaarden.iso.kPa_[i - 1];
				stages.push(i);
			}

	/*- Parameters */
			vars.categories = [{
				name: "Algemeen",
				items: [
					{ name: "Projectnummer", value: "" },
					{ name: "Omschrijving", value: "" },
					{ name: "Locatie", value: "" },
					{ name: "Opdrachtgever", value: "" },
					{ name: "Opdrachtnemer", value: "" },
					{ name: "Boring", value: "" },
					{ name: "Monster", value: "" },
					{ name: "Coördinaten", value: "" }
				]
			}, {
				name: "Proefgegevens",
				items: [
					{ name: "Aantal trappen", value: nofStages() },
					{ name: "Proef periode", value: "" },
					{ name: "Opstelling nr", value: "" },
					{ name: "Laborant", value: "" },
					{ name: "Uitwerking", value: "" },
					{ name: "Proefmethode", value: "" },
					{ name: "Beproevingstemperatuur", value: "" },
					{ name: "Proefomstandigheden", value: "" },
					{ name: "Opmerking proef", value: "" }
				]
			}, {
				name: "Monstergegevens",
				items: [
					{ name: "Diepte (m-NAP)", value: "" },
					{ name: "Grondsoort (NEN-5104)", value: "" },
					{ name: "Monstertype", value: "" },
					{ name: "Monsterpreparatie", value: "" },
					{ name: "Opmerking monster", value: "" }
				]
			}, {
				name: "Initiële waarden",
				items: [
					{ symbol: "D", name: "Diameter", unit: "mm", value: vars.D },
					{ symbol: "ps", name: "Volumegewicht vaste delen", unit: "Mg/m3", value: vars.ps },
					{ symbol: "Hi", name: "Hoogte (voor)", unit: "mm", value: vars.Hi },
					{ symbol: "Vi", name: "Volume (voor)", unit: "mm3", value: vars.Vi },
					{ symbol: "Sri", name: "Verzadigingsgraad (voor)", unit: "%", value: vars.Sri },
					{ symbol: "w0", name: "Watergehalte (voor)", unit: "%", value: vars.w0 },
					{ symbol: "yi", name: "Volumegewicht nat (voor)", unit: "kN/m3", value: vars.yi },
					{ symbol: "ydi", name: "Volumegewicht droog (voor)", unit: "kN/m3", value: vars.ydi },
					{ symbol: "ei", name: "Poriëngetal (voor)", unit: "-", value: vars.ei }
				]
			}, {
				name: "Uiteindelijke waarden",
				items: [
					{ symbol: "Hf", name: "Hoogte (na)", unit: "mm", value: vars.Hf },
					{ symbol: "Vf", name: "Volume (na)", unit: "mm3", value: vars.Vf },
					{ symbol: "Srf", name: "Verzadigingsgraad (na)", unit: "%", value: vars.Srf },
					{ symbol: "wf", name: "Watergehalte (na)", unit: "%", value: vars.wf },
					{ symbol: "yf", name: "Volumegewicht nat (na)", unit: "kN/m3", value: vars.yf },
					{ symbol: "ydf", name: "Volumegewicht droog (na)", unit: "kN/m3", value: vars.ydf },
					{ symbol: "ef", name: "Poriëngetal (na)", unit: "-", value: vars.ef }
				]
			}, {
				name: "Belastingschema",
				items: stages.map(stage => ({ name: js.sf("Trap [%d]", stage), symbol: "load(" + stage + ")", unit: "kPa", value: load_(stage) })),
			}, {
				name: "Poriëngetal",
				items: stages.map(stage => ({ name: js.sf("Trap [%d]", stage), symbol: "e(" + stage + ")", unit: "-", value: e_(stage) })),
			}, {
				name: "Lineaire rek",
				items: stages.map(stage => ({ name: js.sf("Trap [%d]", stage), symbol: "Ecv(" + stage + ")", unit: "%", value: kPa_[stage - 1].y_rek })),
			}, {
				name: "Natuurlijke rek",
				items: stages.map(stage => ({ name: js.sf("Trap [%d]", stage), symbol: "EvH(" + stage + ")", unit: "%", value: -kPa_[stage - 1].iso.y })),
			}, {
				name: "Grensspanning",
				items: [
					{ name: "Grensspanning NEN", unit: "kPa", symbol: "o'p", value: js.get("nen.sN1N2.x", vars.grenswaarden) },
					{ name: "Grensspanning Isotachen", unit: "kPa", value: js.get("iso.sN1N2.x", vars.grenswaarden) },
					{ name: "Grensspanning Koppejan", unit: "kPa", value: "?" || js.get("kop.variant1.LLi_1.sN1N2.x", vars.grenswaarden) + 0},
					{ name: "Rek bij grensspanning NEN", symbol: "ECv", unit: "%", value: js.get("nen.sN1N2.y", vars.grenswaarden) * 100 },
					{ name: "Rek bij grensspanning Isotachen", unit: "%", value: -js.get("iso.sN1N2.y", vars.grenswaarden) * 100},
					{ name: "Rek bij grensspanning Koppejan", unit: "%", value: "?" || js.get("kop.variant1.LLi_1.sN1N2.y", vars.grenswaarden) * 100 },
				]
			}, {
				name: "Consolidatie 50%",
				items: stages.map(stage => ({ name: js.sf("Trap [%d]", stage), symbol: "t50(" + stage +")", value: t50_(stage) })),
			}, {
				name: "Consolidatie 90%",
				items: stages.map(stage => ({ name: js.sf("Trap [%d]", stage), symbol: "t90(" + stage +")", value: t90_(stage) })),
			}, {
				name: "Consolidatiecoëfficiënt",
				items: stages.map(stage => 
					({ name: js.sf("Casagrande-Trap [%d]", stage), unit: "m2/s", symbol: "Cv10(" + stage +")", value: Cv10_(stage) })).concat(stages.map(stage =>
					({ name: js.sf("Taylor-Trap [%d]", stage), unit: "m2/s", symbol: "Cv10(" + stage + ", true)", value: Cv10_(stage, "Taylor") })
				))
			}, {
				name: "Volumesamendrukkingscoëfficiënt",
				items: stages.slice(1).map(stage => 
					({ name: js.sf("Casagrande-Trap [%d]", stage), unit: "1/Mpa", symbol: "Mv(" + stage +")", value: Mv_(stage) })).concat(stages.slice(1).map(stage =>
					({ name: js.sf("Taylor-Trap [%d]", stage), unit: "1/Mpa", symbol: "Mv(" + stage + ", true)", value: Mv_(stage, "Taylor") })
				))
			}, {
				name: "Waterdoorlatendheid",
				items: stages.slice(1).map(stage => 
					({ name: js.sf("Casagrande-Trap [%d]", stage), unit: "m/s", symbol: "k10(" + stage + ")", value: k10_(stage) })).concat(stages.slice(1).map(stage =>
					({ name: js.sf("Taylor-Trap [%d]", stage), unit: "m/s", symbol: "k10(" + stage + ", true)", value: k10_(stage, "Taylor") })
				))
			}, {
				name: "Samendrukkingsparameters - NEN/Bjerrum",
				items: stages.slice(1).map(stage => 
					({ name: js.sf("Trap [%d-%d]", stage - 1, stage, stage), symbol: js.sf("Cc(%d)", stage), value: Cc_(stage) })).concat(stages.slice(1).map(stage =>
					({ name: js.sf("Trap [%d-%d]", stage - 1, stage, stage), symbol: js.sf("CR(%d)", stage), value: CR_(stage) })
				))
			}, {
				name: "Samendrukkingsparameters - a,b,c-Isotachen",
				items: [
					{ name: "onder Pg", symbol: "a", value: iso_a_(0, context, vars) },
					{ name: "boven Pg", symbol: "b", value: iso_a_(1, context, vars) },
					// { name: "ontlasten", symbol: "as", value: [iso_a_(3,context,vars), iso_asw_(3, context, vars)] },
					// { name: "herlasten", symbol: "ar", value: iso_a_(stages.length, context, vars) }
				]
			}, {
				name: "Controle parameters - deltaH",
				items: stages.map(_ => ({ name: "Trap " + _, symbol: "dH" + _, unit: "mm", value: deltaH_(_) }))
			}, {
				name: "Controle parameters - Koppejan - variant 1",
				items:	stages.map(stage => ({ name: js.sf("Richtingscoëfficiënt regressielijn %d", stage), symbol: "rc" + stage, value: js.get("kop.variant1.slopes", vars.grenswaarden)[stage - 1].rc })).concat(
						stages.map(stage => ({ name: js.sf("Nulpunt regressielijn %d", stage), symbol: "np" + stage, value: js.get("kop.variant1.slopes", vars.grenswaarden)[stage - 1].np}))),
			}, {
				name: "Controle parameters - Koppejan - variant 2",
				items:	stages.map(stage => ({ name: js.sf("Richtingscoëfficiënt regressielijn %d", stage), symbol: "rc" + stage, value: js.get("kop.variant2.slopes", vars.grenswaarden)[stage - 1].rc })).concat(
						stages.map(stage => ({ name: js.sf("Nulpunt regressielijn %d", stage), symbol: "np" + stage, value: js.get("kop.variant2.slopes", vars.grenswaarden)[stage - 1].np}))),
			}];
			vars.parameters = vars.categories.map(_ => _.items.map(kvp => mixin({ category: _ }, kvp))).flat();
			
			this.scope("array-headers").setArray(headers.concat(vars.parameters));
		};
		
		if(this.up("devtools/Editor<vcl>")) {
			/*- DEBUG: hook into the 1st Editor<gds> we can find (if any) in order to tweak/fiddle code */
			if((editor = this.app().down("devtools/Editor<gds>:root"))) {
				var previous_owner = this._owner;
				this.setOwner(editor);
				this.on("destroy", () => this.setOwner(previous_owner));
		
				// ["valueField", "valueField_kPa", "categoryField"].forEach(name => {
				// 	var source = this.ud("devtools/Editor<>", "#" + name);
				// 	var dest = this.scope()[name];
				// 	dest.setOptions(source._options);
				// 	dest.setValue(source.getValue());
				// });
				
				initialize();
			}
	 	} else if((editor = this.up("devtools/Editor<gds>:root"))) {
			editor.up("vcl/ui/Tab").on("resource-rendered", () => { 
				initialize(); 
				var tab = this.down("#tabs-graphs").getSelectedControl(1);
				if(tab) {
					var control = tab.getControl();
					if(control) {
						control.setState("invalidated", true);
						// control.render();
					}
				}
				
			});
		}
	},
	// "#tabs-graphs onChange": function() {
	// 	// this.print("onChange", arguments);
	// }
};

["", {  handlers: handlers }, [
	
	["vcl/data/Array", ("array-headers"), {
		// array: [{
		// 	key: "Key",
		// 	value: "Value"
		// }]
	}],

	Tabs,

	["vcl/ui/Panel", ("graphs"), {
		align: "client",
		css: {
			"": "background-color:white;",
			"a": "visibility:hidden;",
			// "&:not(.pdf)": {
				".multiple > div": "width:48%;height:48%;display:inline-block;" + 
					"border: 1px dashed black;" +
					"margin-left:1%;margin-right:1%;margin-top:5px;margin-bottom:5px;" + 
					"min-width:300px;min-height:300px;",
			// }, // 190/210
			"&.pdf > :not(.multiple)": "width: 850px; height: 470px;background-color: rgba(56, 121, 217, 0.075); border: 3px dashed rgb(56, 121, 217);",
			// "&.pdf > div > .amcharts-main-div": "",
			"&.pdf .multiple > div.selected": "_width: 850px; _height: 470px;background-color: rgba(56, 121, 217, 0.075); border: 3px dashed rgb(56, 121, 217);",
			"&.pdf.generate .multiple > div": "height: 470px; width:850px; position:absolute;top:0;left:0;"
		}
	}, [
		["vcl/ui/Panel", ("graph_Casagrande"), {
			align: "client", visible: false, classes: "multiple",
			onRender() {
				var vars = this.vars(["variables"]);
				var context = contextNeeded(this);
				var content = [];

				context.categoryField = "Time since start of stage (s)";

			/*- reset */
				for(var stage = 0; stage < vars.stages; ++stage) {
					content.push(js.sf("<div>Stage %s</div>", stage));
				}
				this._node.innerHTML = content.join("");
				
			/*- render */ stage = 0;
				var render = () => {
				    var meta = {context: context}, index = {}, values = [], previous;
					var series = [{
						title: js.sf("Zetting trap %s [µm]", stage + 1),
						valueAxis: "y1", valueField: "y" // zetting (mm)
					}];

					context.values_(stage + 1)
						.forEach(obj => {
							/*- translates context.array to seconds */

							var sec = obj[context.categoryField], x;
							if(!sec) x = 0.001; else {
								// x = Math.log10(sec / 60);
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
						immediate: true,
						legend: false,
						node: this.getChildNode(stage),
						// xAxisTitle: "",
						xAxisTitle: js.sf("Trap %s: zetting [µm] / → [minuten]", stage + 1),
						xAxisLogarithmic: true
					});
						
					if(stage === 2) this.getChildNode(stage).className += " selected";

					if(++stage < vars.stages) {
						this.nextTick(render);
					}
				};
				vars.stages && render();
			}
		}],
		["vcl/ui/Panel", ("graph_Taylor"), {
			align: "client", visible: false, classes: "multiple",
			onRender() {
				var vars = this.vars(["variables"]);
				var context = contextNeeded(this);
				var content = [];

				context.categoryField = "Time since start of stage (s)";

		/*- reset */
				for(var stage = 0; stage < vars.stages; ++stage) {
					content.push(js.sf("<div>Stage %s</div>", stage));
				}
				this._node.innerHTML = content.join("");
				stage = 0;

		/*- render */ 
				var render = () => {
				    var meta = {context: context}, values = [], guides = [], trendLines = [];
				    var series = [{
						title: js.sf("Zetting trap %s [µm]", stage + 1),
						valueAxis: "y1", valueField: "y"
					}];

					vars.t___(stage + 1, values, meta, guides, trendLines);
					this.vars("am", { series: series, meta: meta, data: values });
					

					makeChart(this, {
						immediate: true,
						legend: false,
						node: this.getChildNode(stage),
						trendLines: trendLines,
					    valueAxes: [{
					        id: "y1", position: "left", reversed: true,
							guides: guides
						}, {
							title: js.sf("Trap %s: zetting [µm] / → [√ minuten]", stage + 1),
							position: "bottom", _title: "→ [√ minuten]"
						}]
					});

					if(stage === 2) this.getChildNode(stage).className += " selected";
					
					if(++stage < vars.stages) { this.nextTick(render); }
				};
				vars.stages && render();
			}
		}],
		["vcl/ui/Panel", ("graph_Bjerrum_e"), {
			align: "client", visible: false,
			onRender() {
				var context = contextNeeded(this);
				if(!context.array.isActive()) return;

				var series = [{
					title: "Poriëngetal (e) [-]",
					valueField: "y_e"
				}];

		/*- get dataset - prepared by handlers::loaded::initialize */
				var kPa_ = this.vars(["variables.kPa_"]);

				var trendLines = [];
				var LLi_e = log_line_intersect(
					kPa_[0].x, kPa_[0].y_e, kPa_[1].x, kPa_[1].y_e, 
					kPa_[2].x, kPa_[2].y_e, kPa_[3].x, kPa_[3].y_e);
					
				trendLines.push({
						initialXValue: kPa_[1].x, initialValue: kPa_[1].y_e,
						finalXValue: LLi_e.b1 * Math.pow(LLi_e.g1, kPa_[2].y_e),
						finalValue: kPa_[2].y_e,
						lineColor: "red"
					}, {
						initialXValue: kPa_[2].x, initialValue: kPa_[2].y_e,
						finalXValue: LLi_e.b2 * Math.pow(LLi_e.g2, kPa_[0].y_e),
						finalValue: kPa_[0].y_e,
						lineColor: "red"
					}, {
						initialXValue: LLi_e.sN1N2.x, initialValue: LLi_e.sN1N2.y,
						finalXValue: LLi_e.sN1N2.x, finalValue: 100,
						lineColor: "red", lineAlpha: 0.25,
						dashLength: 2
					}, {
						initialXValue: LLi_e.sN1N2.x, initialValue: LLi_e.sN1N2.y,
						finalXValue: 0.1, finalValue: LLi_e.sN1N2.y,
						lineColor: "red", lineAlpha: 0.25,
						dashLength: 2
					});

				this.vars("am", { series: series, meta: {LLi_e: LLi_e}, data: kPa_, context: context });
				makeChart(this, { 
					type: "xy",
					trendLines: trendLines,
				    valueAxes: [{
				        id: "y1", position: "left", 
				        guides: [{
							value: LLi_e.sN1N2.y, inside: true, lineAlpha: 0, 
							label: js.sf("e0=%.3f", LLi_e.sN1N2.y)
						}]
				    }, {
						position: "bottom", title: "Belasting → [kPa]",
						logarithmic: true, minimum: 5,
						guides: [{
							position: "top",
							value: LLi_e.sN1N2.x, inside: true, lineAlpha: 0,
							label: js.sf("%.3f kPa", LLi_e.sN1N2.x)
						}]
					}]
				});
			},
		}],
		["vcl/ui/Panel", ("graph_Bjerrum_r"), {
			align: "client", visible: false,
			onRender() {
				var context = contextNeeded(this);
				if(!context.array.isActive()) return;

				var series = [{
					title: "Verticale rek [∆H / Ho]",
					yAxis: "y2",
					valueField: "y_rek"
				}];
		/*- get dataset - prepared by handlers::loaded::initialize */
				var kPa_ = this.vars(["variables.kPa_"]);
				var LLi_rek = log_line_intersect(kPa_[0].x, kPa_[0].y_rek, kPa_[1].x, kPa_[1].y_rek, 
					kPa_[2].x, kPa_[2].y_rek, kPa_[3].x, kPa_[3].y_rek);

				this.vars("am", { series: series, meta: { LLi_rek: LLi_rek }, data: kPa_, context: context });
				
				makeChart(this, {  
					type: "xy",
					trendLines: [{
							initialXValue: kPa_[1].x, initialValue: kPa_[1].y_rek,
							finalXValue: LLi_rek.b1 * Math.pow(LLi_rek.g1, kPa_[2].y_rek),
							finalValue: kPa_[2].y_rek,
							lineColor: "red"
						}, {
							initialXValue: kPa_[2].x, initialValue: kPa_[2].y_rek,
							finalXValue: LLi_rek.b2 * Math.pow(LLi_rek.g2, kPa_[0].y_rek),
							finalValue: kPa_[0].y_rek,
							lineColor: "red"
						}, {
							initialXValue: LLi_rek.sN1N2.x, initialValue: LLi_rek.sN1N2.y,
							finalXValue: LLi_rek.sN1N2.x, finalValue: 0,
							lineColor: "red", lineAlpha: 0.25,
							dashLength: 2
						}, {
							initialXValue: LLi_rek.sN1N2.x, initialValue: LLi_rek.sN1N2.y,
							finalXValue: 0.1, finalValue: LLi_rek.sN1N2.y,
							lineColor: "red", lineAlpha: 0.25,
							dashLength: 2
						}],
				    valueAxes: [{
				    	id: "y2", position: "left", reversed: true,
				        guides: [{
							value: LLi_rek.sN1N2.y, inside: true, lineAlpha: 0, 
							label: js.sf("Rek: %.3f %%", LLi_rek.sN1N2.y * 100)
						}]
				    }, {
						position: "bottom", title: "Belasting → [kPa]",
						logarithmic: true, minimum: 5,
						guides: [{
							position: "top",
							value: LLi_rek.sN1N2.x, inside: true, lineAlpha: 0,
							label: js.sf("Pg: %.3f kPa", LLi_rek.sN1N2.x)
						}]
					}]
				});
			},
		}],
		["vcl/ui/Panel", ("graph_Isotachen"), {
			align: "client", visible: false,
			onRender() {
				var context = contextNeeded(this);
				if(!context.array.isActive()) return;

			    var meta = {context: context}, index = {}, values = [];
				var series = [{
					title: "Natuurlijke verticale (Hencky) rek (-ln(1 - (∆H / Ho)) [%]",
					valueField: "y"
				}];
				var vars = this.vars(["variables"]);

				/*- TODO optimize this -- translates context.array logarithmically to index */
				var arr = context.array.getObjects(), H0 = arr[0][context.valueField];
				arr.forEach(obj => {
					var sec = obj[context.categoryField];
					
					/*- calculate x := log10(sec) - fix to 5 decimals */
					var x = Math.log10((sec / 3600) || 0.00001);
					x = x.toFixed(5);
					
					index[x] = js.mixIn(index[x] || {});
					index[x]['Stage Number'] = obj['Stage Number'];
					index[x][context.valueField] = obj[context.valueField];
					index[x][context.valueField_kPa] = obj[context.valueField_kPa];
					
					var Ev = -(obj[context.valueField] - H0) / vars.H;
					index[x].x = parseFloat(x);
					index[x].y = Math.log(1 - Ev);
					index[x].hours = sec / 3600;
					index[x].minutes = sec / 60;
					index[x].seconds = sec;
				});
				
				var kPa = [], previous, push = (o) => kPa.push({
					x: o[context.valueField_kPa],
					y: (o.y2 = o.y)
				});
				Object.keys(index).sort(sort_numeric).forEach(key => {
					var entry = index[key];
					if(previous && previous['Stage Number'] !== entry['Stage Number']) {
						push(previous);
					}
					previous = entry;
					values.push(entry);
				});
				push(previous);

				var LLi_e = log_line_intersect(kPa[0].x, kPa[0].y, kPa[1].x, kPa[1].y, kPa[2].x, kPa[2].y, kPa[3].x, kPa[3].y);
				this.vars("am", { series: series, meta: {LLi_e: LLi_e}, data: kPa, context: context });
				makeChart(this, { 
					type: "xy",
					trendLines: [{
							// initialXValue: LLi_e.b1 * Math.pow(LLi_e.g1, kPa[0].y),// kPa[0].x, 
							// initialValue: kPa[0].y,
							initialXValue: kPa[1].x, initialValue: kPa[1].y,
							finalXValue: LLi_e.b1 * Math.pow(LLi_e.g1, kPa[2].y), finalValue: kPa[2].y,
							lineColor: "red"
						}, {
							initialXValue: kPa[2].x, initialValue: kPa[2].y,
							finalXValue: LLi_e.b2 * Math.pow(LLi_e.g2, kPa[0].y),
							finalValue: kPa[0].y,
							lineColor: "red"
						}, {
							initialXValue: LLi_e.sN1N2.x, initialValue: 0,
							finalXValue: LLi_e.sN1N2.x, finalValue: LLi_e.sN1N2.y,
							lineColor: "red", lineAlpha: 0.25, dashLength: 2,
						}, {
							initialXValue: 0.1, initialValue: LLi_e.sN1N2.y,
							finalXValue: LLi_e.sN1N2.x,  finalValue: LLi_e.sN1N2.y,
							lineColor: "red", lineAlpha: 0.25, dashLength: 2,
						}],
					valueAxes: [{
				        id: "y1", position: "left", reversed: true,
						guides: [{
							value: LLi_e.sN1N2.y, inside: true, lineAlpha: 0,
							label: js.sf("Rek: %.3f %%", LLi_e.sN1N2.y * 100)
						}]
					}, {
						position: "bottom", title: "Belasting → [kPa]",
						minimum: kPa[0].x * 0.75,
						logarithmic: true,
						guides: [{
							value: LLi_e.sN1N2.x, inside: true, lineAlpha: 0, position: "top",
							label: js.sf("Pg: %.3f kPa", LLi_e.sN1N2.x, LLi_e.sN1N2.y * 100)
						}]
					}]
				});
			}
		}],
		["vcl/ui/Panel", ("graph_Koppejan"), {
			align: "client", visible: false,
			onRender(returnMeta) {
				var context = contextNeeded(this);
				if(!context.array.isActive()) return;

				var series = [{ 
					title: "Belasting [kPa]", xAxis: "x2",
					xField: "x2", yField: "y2"
				}, {
					title: "Zetting [mm]", xAxis: "x1",
					xField: "x", yField: "y"
				}].concat([1,2,3,4,5,6].map(_ => ({
					title: js.sf("Verschoven zetting vz%d [mm]", _ + 1), xAxis: "x1",
					xField: "x" + (_ + 2), yField: "vz2",
					lineColor: _ >= 4 ? "purple" : "red", lineThickness: 1
				})));

			    var meta = {context: context}, index = {}, allValues = [], previous;
				var ignore = 30 / (24 * 3600) / 2;
				context.array.getObjects().forEach((obj, idx, arr) => {
					/*- translates context.array logarithmically and pushes into allValues */
					var sec = obj[context.categoryField];
					var x = sec / (24*3600);
					
					/*- ignore the 1st ... */
					if(x < ignore) return;

					index[x] = js.mixIn(index[x] || obj);
					index[x]['Stage Number'] = obj['Stage Number'];
					index[x][context.valueField] = obj[context.valueField];
					index[x][context.valueField_kPa] = obj[context.valueField_kPa];
					
					index[x].index = idx;
					index[x].x = parseFloat(x);
					index[x].x2 = obj['Axial Stress (kPa)'];
					index[x].y = index[x].y2 = obj[context.valueField];
					index[x].days = sec / (3600*24);
					index[x].hours = sec / 3600;
					index[x].minutes = sec / 60;
					index[x].seconds = sec;
					
					if(idx > 0) index[x].delta = (arr[idx -1][context.valueField] - obj[context.valueField]);
				});
				
				var serie2 = [];
				Object.keys(index).sort(sort_numeric).forEach(key => {
					var entry = index[key];
					if(previous) {
						if(previous['Stage Number'] === entry['Stage Number']) {
							delete previous.y2;
						} else {
							serie2.push(previous);
						}
					}
					previous = entry;
					allValues.push(entry);
				});
				serie2.push(previous);
				meta.serie2 = serie2;
				this.vars("am", { series: series, meta: meta, data: allValues, context: context });

		/*- determine slopes (rc) per stage - based on allValues (which might be extrapolated already based upon previous rc) */
				var slopes = [], y = "Axial Displacement (mm)", x = "Time since start of stage (s)";
				var vars = this.vars(["variables"]);
				var stages = vars.stages;
				var slope_variant = vars.slope_variant || 2;

				for(var s = 0; s < stages; ++s) {
					var z1 = context.values_(s + 1, allValues);
					z1.forEach((m,i,a) => i && (m.delta = m[y] - a[i-1][y]));
					var slope = {
						stage: s + 1,
						values: z1,
						// always get 0.1 (tried mean and smallest delta as well)
						measurement_1: z1[Math.round(0.1 * 3600 * 24 / 30)], 
						measurement_2: function() {
							var N = z1.length, ax = 0, ay = 0, sx = z1[0][x], sy = z1[0][y];
							z1.slice(z1.length - N).forEach(m => {
								ax += (m[x] - sx);
								ay += (m[y] - sy);
							});
							ax /= N;
							ay /= N;
							var m = {};
							m.x = m[x] = ax + sx;
							m.y = m[y] = ay + sy;
							m.vz2 = m.y;
							return m;
						}(),
						measurement_3: z1.filter(_ => _.delta != 0).sort((i1, i2) => Math.abs(i1.delta) < Math.abs(i2.delta) ? -1 : 1)[0],
						last: z1[z1.length - 1]
					};
					
					slope.measurement = slope['measurement_' + slope_variant];

					slope.rc = (slope.last.y - slope.measurement.y) / 
							Math.log10(Math.round(slope.last[x] / 3600 * 24) / 
								(slope.measurement[x] / 3600 * 24));

					/*- extrapolate next stage */
					if(s < stages - 1) {
						var z2 = context.values_(s + 2, allValues);
						var t1 = (s + 1);

						z2.forEach((obj, i) => {
							if(!i) return;
							
							var t = obj.days;
							
							// obj.x3 = (t - t1) || ignore;
							obj['x' + (s + 3)] = (t - t1) || ignore;
							
							obj.yy = obj[y];
							obj.z1 = z2[0][y] + slope.rc * Math.log10(t);
							obj.z2 = obj[y] - obj.z1;
							
							obj.t = t; obj.t1 = t1;

							// obj.vz2_d = slope.rc * (Math.log10((t - t1) || ignore) - Math.log10(t));
							obj.vz2 = obj[y] + slope.rc * (Math.log10((t - t1) || ignore) - Math.log10(t));
						});
						// this.print("z2", z2);
					}

					slopes.push(slope);

					var x_ = "x" + (s + 2);
					if(s && slope.measurement[x_]) {
						slope.rc_org = slope.rc;
						slope.rc = (slope.last.vz2 - slope.measurement.vz2) / 
								Math.log10(Math.round(slope.last[x_]) / 
									(slope.measurement[x_]));
					}

					slope.np = slope.last.vz2 || slope.last[y];
				}

		/*- straight line on log-scale? >> N = b * g ^ t; (https://www.youtube.com/watch?v=i3jbTrJMnKs) */
					// >>> t = Math.log(N / b) / Math.log(g);
				var trendLines = slopes.map((S, i, slopes) => {
				/*- (t1,N1), (t2,N2) => g1, b1 => TODO use log_line_intersect() */
					var sm = S.measurement;
					var t1 = sm[y], N1 = sm[x]  / (24*3600);
					var t2 = S.last[y], N2 = S.last[x]  / (24*3600);
					var dt1 = t2 - t1;
					var g1 = Math.pow(N2 / N1, 1 / dt1);
					var b1 = N1 / Math.pow(g1, t1);
					
					var y10 = Math.log(10 / b1) / Math.log(g1);
					var x10 = 10;
					var TLy = S.last.vz2 || S.last[y]; // vz2 is not set in stage 1 fallback to measuremnt
					
					return [{
						delta: y10 - TLy,//S.last[y],
						// initialXValue: i + 1, initialValue: S.last[y],
						initialXValue: 1, initialValue: TLy,
						finalXValue: 20, finalValue: TLy + S.rc * Math.log10(20),
						lineAlpha: 1, lineColor: "black", dashLength: 3
					// }, {
					// 	// '@': { g1: g1, b1: b1, t1: t1, t2: t2, dt1: dt1, S: S, N1: N1, N2: N2 },
					// 	// initialXValue: sm[x] / (24*3600), initialValue: sm[y],
					// 	initialXValue: 0.1, initialValue: Math.log(0.1 / b1) / Math.log(g1),
					// 	finalXValue: 20, finalValue: Math.log(20 / b1) / Math.log(g1),
					// 	lineAlpha: 0.15, lineColor: "purple"
					// }, {
					// 	// '@': { g1: g1, b1: b1, t1: t1, t2: t2, dt1: dt1, S: S, N1: N1, N2: N2 },
					// 	initialXValue: sm[x] / (24*3600), initialValue: sm[y],
					// 	// initialXValue: 0.001, initialValue: Math.log(0.001 / b1) / Math.log(g1),
					// 	finalXValue: 20, finalValue: Math.log(20 / b1) / Math.log(g1),
					// 	dashLength: 2, lineColor: "purple"
					// }, {
					// 	initialXValue: x10, initialValue: y10,
					// 	finalXValue: S.last[x] / (24 * 3600), finalValue: y10,
					// 	lineColor: "red", dashLength: 2
					// }, {
					// 	initialXValue: S.last[x] / (24 * 3600), initialValue: S.last[y],
					// 	finalXValue: S.last[x] / (24 * 3600), finalValue: y10,
					// 	lineColor: "red", dashLength: 2
					}];
				}).filter((_, i, a) => (_[0].delta > 0));
				var LLi_1 = log_line_intersect(serie2[0].x2, serie2[0].y, serie2[1].x2, serie2[1].y, 
						serie2[2].x2, serie2[2].y, serie2[3].x2, serie2[3].y);
						
				meta.slopes = slopes;
				meta.LLi_1 = LLi_1;
				meta.trendLines = trendLines;

				if(returnMeta === true) {
					this.print(">>> only return");
					return meta;
				}
				
				// this.getChildNode(0).className += " selected";
				
				makeChart(this, { 
					type: "xy",
					// node: this.getChildNode(0),
				    valueAxes: [{
				        id: "y1", reversed: true, minimum: 0,
						// guides: [{
						// 	value: LLi_1.sN1N2.y, inside: true, lineAlpha: 0,
						// 	label: js.sf("%.3f mm", LLi_1.sN1N2.y)
						// }]
					}, {
				        id: "y2", position: "right", reversed: true, minimum: 0,
				        synchronizeWith: "y1", synchronizationMultiplier: 1,
						guides: [{
							value: LLi_1.sN1N2.y, inside: true, lineAlpha: 0,
							label: js.sf("%.3f mm", LLi_1.sN1N2.y)
						}]
					}, {
						id: "x1", title: "→ [dagen]", position: "bottom", 
						logarithmic: true, minimum: 0.01, maximum: 1000
					}, {
						id: "x2", _title: "Belasting → [kPa]", position: "top",
						synchronizeWith: "x1", synchronizationMultiplier: 1,
						logarithmic: true, minimum: 0.01,
						guides: [{
							value: LLi_1.sN1N2.x, inside: true, lineAlpha: 0,
							label: js.sf("%.3f kPa", LLi_1.sN1N2.x)
						}]
					}],
					trendLines: [{
						valueAxisX: "x2",
						initialXValue: 10000, initialValue: LLi_1.sN1N2.y,
						finalXValue: LLi_1.sN1N2.x, finalValue: LLi_1.sN1N2.y,
						dashLength: 2, lineColor: "green", lineAlpha: 0.5
					}, {
						valueAxisX: "x2",
						initialXValue: LLi_1.sN1N2.x, initialValue: 0,
						finalXValue: LLi_1.sN1N2.x, finalValue: LLi_1.sN1N2.y,
						dashLength: 2, lineColor: "green", lineAlpha: 0.5
					}, {
						valueAxisX: "x2",
						initialXValue: serie2[1].x2, initialValue: serie2[1].y,
						finalXValue: LLi_1.b1 * Math.pow(LLi_1.g1, serie2[2].y), finalValue: serie2[2].y,
						lineColor: "green",
					}, {
						valueAxisX: "x2",
						initialXValue: serie2[2].x2, initialValue: serie2[2].y,
						finalXValue: LLi_1.b2 * Math.pow(LLi_1.g2, serie2[0].y), finalValue: serie2[0].y,
						lineColor: "green",
					}].concat(trendLines.flat().map(_ => { 
						return _;
					}))
				});
			}
		}]
	]]
]];