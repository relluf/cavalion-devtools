["Container", {
	
	css: "background-color:white;",
	
	onLoad() {
		var data = this.vars(["data"]);
	    if (data === undefined) {
			var cons = this.up("devtools/Workspace<>:root").down("#left-sidebar < #console #console");
			data = cons.sel[cons.sel.length - 1] || [];
	    }
	    
	    var meta = {}, r = [];
	    var filters = [], series = [];
		
		data.sort((i1,i2) => i1.tijdstip < i2.tijdstip ? -1 : 1).map(obj => {
			var tuple = r[obj.tijdstip] || (r[obj.tijdstip] = {});
			var filter = obj.meetpuntFilter.id;
			tuple['filter' + filter] = obj.waterstand;
			if(meta.min === undefined || meta.min > obj.waterstand) {
				meta.min = obj.waterstand;
			}
			if(meta.max === undefined || meta.max < obj.waterstand) {
				meta.max = obj.waterstand;
			}
			
			if(filters[filter] === undefined) {
				filters[filter] = 1;
				series.push({
			        "id": "g" + filter,
			        "title": filter,
			        "valueField": "filter" + filter
			    });
			}
			
			tuple.date = new Date(obj.tijdstip);
			r.push(tuple);
		});

		// this.vars("data", data);
		this.vars("am", {
			series: series,
			filters: filters,
			meta: meta,
			data: r
		});
		this.print(this._vars);
	},
	onNodeCreated() {
		this.nextTick(() => {
			var graphs = this.vars("am.series").map(serie => {
				return {
			        "id": serie.id,
			        "balloon":{
			          "drop":true,
			          "adjustBorderColor":false,
			          "color":"#ffffff"
			        },
			        "bullet": "round",
			        "bulletBorderAlpha": 1,
			        "bulletColor": "#FFFFFF",
			        "bulletSize": 5,
			        "hideBulletsCount": 50,
			        "lineThickness": 2,
			        // "title": serie.title,
		        	"type": "smoothedLine",
			        "useLineColorForBulletBorder": true,
			        "valueField": serie.valueField,
			        "balloonText": "<span style='font-size:18px;'>[[value]]</span>"
			    };
			});
			var chart = AmCharts.makeChart(this.getNode(), {
			    "type": "serial",
			    "theme": "light",
			    // "marginRight": 40,
			    // "marginLeft": 40,
			    // "autoMarginOffset": 20,
			    "mouseWheelZoomEnabled":true,
			    // "dataDateFormat": "YYYY-MM-DD HH:MM:SS",
			    "valueAxes": [{
			        // "id": "v1",
			        "axisAlpha": 0,
			        "position": "left",
			        "ignoreAxisWidth":true,
					// includeAllValues: true
				}],
			    "balloon": {
			        "borderThickness": 1,
			        "shadowAlpha": 0
			    },
			    "graphs": graphs,
			    "chartScrollbar": {
			        "graph": "g1",
			        "oppositeAxis":false,
			        "offset":30,
			        "scrollbarHeight": 80,
			        "backgroundAlpha": 0,
			        "selectedBackgroundAlpha": 0.1,
			        "selectedBackgroundColor": "#888888",
			        "graphFillAlpha": 0,
			        "graphLineAlpha": 0.5,
			        "selectedGraphFillAlpha": 0,
			        "selectedGraphLineAlpha": 1,
			        "autoGridCount":true,
			        "color":"#AAAAAA"
			    },
			    "chartCursor": {
			        "pan": true,
			        "valueLineEnabled": true,
			        "valueLineBalloonEnabled": true,
			        "cursorAlpha":1,
			        "cursorColor":"#258cbb",
			        "limitToGraph":"g1",
			        "valueLineAlpha":0.2,
			        "valueZoomable":true
			    },
			    "valueScrollbar":{
			      "oppositeAxis":false,
			      "offset":50,
			      "scrollbarHeight":10
			    },
			    "categoryField": "date",
			    "categoryAxis": {
			        "parseDates": true,
			        "dashLength": 1,
			        "minorGridEnabled": true,
			        "type": "date",
			        minPeriod: "hh",
			        equalSpacing: true
			    },
			    "export": {
			        // "enabled": true
			    },
			    "legend": {
			    	"useGraphSettings": true
			    },
			    // "titles": [{"text": "title", size: 15}],
			    "dataProvider": this.vars("am.data")
			});
			chart.addListener("rendered", zoomChart);
			zoomChart();
			function zoomChart() {
			    // chart.zoomToIndexes(chart.dataProvider.length - 40, chart.dataProvider.length - 1);
			}
		});
	}	

}];