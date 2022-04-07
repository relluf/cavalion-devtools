"use data/Source, amcharts, amcharts.serial, locale";

var thisYear = (new Date()).getFullYear();
var by = (prop) => (i1, i2) => {
	return i1 < i2 ? -1 : i1 > i2 ? 1 : 0;
};

// #CVLN-20220403-2 base must be specific in order function in code/supermdl
[("devtools/Alphaview.csv"), {
	vars: {
		graphs: [305,306,307,308,309,310,311,312,313,314,315,316].map(n => ({
        	type: "smoothedLine", lineThickness: 1,
	        useLineColorForBulletBorder: true,
			title: js.sf("PB %d", n), 
			valueField: js.sf("PB %d", n),
	        bullet: "round", bulletBorderAlpha: 1,
	        bulletColor: "#FFFFFF", bulletSize: 5,
	        hideBulletsCount: 50, connect: true
		}))
	}
}, [
	
	[("#list"), { autoColumns: false, align: "right", width: 275 }],

	[("Container"), "graph", {
		css: {
			"": "background-color: white;",
			"a": "visibility:hidden;"
		},
		onRender() { this.nextTick(() => {

			var range_tl = null;//this.ud("#set_range_tl").vars("range");
			var includeGuides = true;//this.ud("#set_range_total").isSelected();
			var node = this.getNode();
			var TITLE_LEFT_AXIS = "values left", TITLE_RIGHT_AXIS = "values right";

			var range = [
				range_tl ? range_tl.begin : new Date(js.sf("%d/01/01", thisYear)), 
				range_tl ? range_tl.end : new Date(js.sf("%d/01/01", thisYear + 1))
			].map(_ => ({ 
				serie: "extremes", timestamp: _, 
				value: 100 }));
					
	/* require data */

			var data = []
				.concat(this.ud("#list").getSource().getArray())
				.sort(by("timestamp"));
			
			var graphs = this.vars(["graphs"]);
			var chart = AmCharts.makeChart(node, (this.vars("am.ctorO", {
			    categoryField: "timestamp",
			    categoryAxis: {
			        parseDates: true,
			        dateFormats: [{"period":"fff","format":"JJ:NN:SS"},{"period":"ss","format":"JJ:NN:SS"},{"period":"mm","format":"JJ:NN"},{"period":"hh","format":"JJ:NN"},{"period":"DD","format":"DD MMM"},{"period":"WW","format":"MMM DD"},{"period":"MM","format":"MMM"},{"period":"YYYY","format":"YYYY"}],
			        dashLength: 1,
			        minorGridEnabled: true,
			        type: "date",
			        minPeriod: "15mm",
			        equalSpacing: false,//true,
			        // guides: []
			    },
			    chartScrollbar: { /*- the bottom scrollbar */
			        oppositeAxis:false,
			        offset:30,
			        scrollbarHeight: 20,
			        backgroundAlpha: 0,
			        selectedBackgroundAlpha: 0.1,
			        selectedBackgroundColor: "#888888",
			        graphFillAlpha: 0,
			        graphLineAlpha: 0.5,
			        selectedGraphFillAlpha: 0,
			        selectedGraphLineAlpha: 1,
			        autoGridCount:true,
			        color:"gray"
			    },
			    chartCursor: {
			        // pan: true,
			        // bulletsEnabled: true,
			        // balloonPointerOrientation: "vertical",
			    	categoryBalloonDateFormat: "D MMM HH:NN",
			    	color: "black",
			        cursorAlpha: 0.5,
			        cursorColor: "#e0e0e0",
			        valueLineEnabled: true,
			        valueLineBalloonEnabled: false,
			        valueLineAlpha: 0.2,
			        valueZoomable: true
			    },
			    colors: ["rgb(56, 121, 217)", "navy", "orange", "blue"],
			    dataProvider: data,
			    graphs: graphs,
			    // guides: [],
			    legend: { 
			    	useGraphSettings: true,
			    	listeners: [{
			    		event: "showItem",
			    		method: (evt) => {
			    			var name = evt.dataItem.valueField;
			    			this.print("showItem", evt);
			    		}
			    	}, {
			    		event: "hideItem",
			    		method: (evt) => {
			    			var name = evt.dataItem.valueField;
			    			this.print("hideItem", evt);
			    		}
			    	}]
			    },
			    mouseWheelZoomEnabled: true,
			    mouseWheelScrollEnabled: false,
			    // theme: "light",
			    type: "serial",
			    valueAxes: [{
			        id: "left",
			        // axisAlpha: 0,
			        position: "left",
			        // ignoreAxisWidth:true,
			        // precision: 2,
			        title: TITLE_LEFT_AXIS,
			        includeGuidesInMinMax: includeGuides
				}, {
			        id: "right",
			        // axisAlpha: 0,
			        synchronizeWith: "left", //synchronizationMultiplier: 1,
			        position: "right",
			        // ignoreAxisWidth:true,
			        // precision: 2,
			        maximum: 60,
			        title: TITLE_RIGHT_AXIS,
			        // includeGuidesInMinMax: includeGuides
				}],
			    // valueScrollbar:{ /*- TODO Bereik: Aanpassen */
				   //   oppositeAxis: true,
				   //   offset: 50,
				   //   scrollbarHeight: 10
			    // },
			    zoomOutText: "",
		        dataDateFormat: "YYYY-MM-DD",// HH:NN:SS",
		        
				listeners: [{
					event: "changed",
					method: (evt) => {
						// this.print("changed", js.copy_args(arguments));
					}
				}, {
				    event: "rendered", method: () => this._node.qsa("image").map(i => i.style.opacity = "0.55")
				}, {
					event: "drawn",
					method: (evt) => {}
				}, {
					event: "zoomed",
					method: (e) => {
						this.vars("am.chart.zoom", e);
						this.emit("zoomed", [e]);
					}
				}]
			})));
				
		});}
	}]

]];