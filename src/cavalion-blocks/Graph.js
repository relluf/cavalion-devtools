"use dygraphs/Dygraph";

var Dygraph = require("dygraphs/Dygraph");

// function draw(data, options) {
// /* TODO describe usage:
// 	-vars: { graph, data, options }
// */
//     var graph = this.vars("graph");
//     if (graph !== undefined) {
//     	try {
//         	graph.destroy();
//     	} catch(e) {
//     		console.error(e);
//     	}
//     }

// this.print("draw");

//     this.clearTimeout("update-history");

//     if (options === undefined) {
//         options = this.vars("options");
//     } else {
//         this.vars("options", options);
//     }

//     var node = this.scope().host.getNode(), me = this;
//     try {
//         this.vars("graph", new Dygraph(node, data, js.mixIn({
//             rollPeriod: 1,
//             showRoller: true,
//             // customBars: true,
            
// 	        highlightCircleSize: 2,
// 	        strokeWidth: 1,
// 	        // strokeBorderWidth: isStacked ? null : 1,
// 	        // labelsDivWidth: 0, ??
	        
// 			highlightSeriesOpts: {
// 				strokeWidth: 3,
// 				strokeBorderWidth: 1,
// 				highlightCircleSize: 5
// 			},
			
// 			drawCallback: function(g, is_initial) {
// 				var history = me.vars("history"), scope = me.scope(), b;
// 				if(history.block) {
// 					if(--history.block === 0) {
// 						delete history.block;
// 					}
// 					scope.back.update();
// 					scope.forward.update();
// 				} else {
// 					me.setTimeout("update-history", function() {
// 						var item = {x: g.xAxisRange(), y: g.yAxisRange()};
// 						var current = history[history.index];
// 						if(item.x[0] === 0) return;
// 						if(!current || (current.x[0] !== item.x[0] || current.x[1] !== item.x[1] || current.y[0] !== item.y[0] || current.y[1] !== item.y[1])
// 						) {
// 							history.splice(history.index + 1);
// 							history.index = history.push(item) - 1;
// 							scope.back.update();
// 							scope.forward.update();
// 						}
// 					}, 450);
// 				}
// 			},

//             // legend: "always",
//             axisLabelFontSize: 10,
//             // showRangeSelector: true
//         }, options || {})));
//     } catch(e) {
//     	console.error(e);
//     	/*- TODO prevent construction */
//     	this.removeVar("graph");
//     }
// }

["vcl-comps:ui/dygraphs/Timeline", {
	// css: "background-color:white;",
	align: "client",
	// vars: { draw: draw },
	onShow() {
		var data = this.vars(["Graph-data"]);
	    if (data === undefined) {
			var cons = this.up("devtools/Workspace<>:root").down("#left-sidebar < #console #console");
			data = cons.sel[cons.sel.length - 1] || [];
	    }
// TODO save/restore period
		// this.print("onShow => TO - draw");
		var draw = this.vars("draw");
		this.setTimeout("draw", () => draw.apply(this, [data, {
			legend: "always",
			title: "Grondwaterstand",
			showRoller: true,
			rollPeriod: 240,
			// errorBars: true,
			// customBars: true,
			ylabel: "Waterstand cm-NAP",
			showRangeSelector: true,
		    interactionModel: Dygraph.defaultInteractionModel
			// rangeSelectorPlotFillColor: 'MediumSlateBlue',
			// rangeSelectorPlotFillGradientColor: 'rgba(123, 104, 238, 0)',
			// colorValue: 0.9,
			// fillAlpha: 0.4				
		}]));
	}
}, [
	["Executable", ("reflect"), {
		// hotkey: "Cmd+R"
	}],
	["Bar", ("menubar"), [
		["Button", { action: "history_back", content: "back" }],
		["Button", { action: "history_forward", content: "forward" }]
	]]
]];