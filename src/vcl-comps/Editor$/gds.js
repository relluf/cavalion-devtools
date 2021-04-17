"use papaparse/papaparse, amcharts, amcharts.serial, amcharts.xy";

var Parser = require("papaparse/papaparse");

var css = {
	"#bar": "text-align: center;",
	"#bar > *": "margin-right:5px;",
	"#bar input": "font-size:12pt;width:300px;max-width:50%; border-radius: 5px; border-width: 1px; padding: 2px 4px; border-color: #f0f0f0;",
	"#bar #left": "float:left;", "#bar #right": "float:right;"
};

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


["", { css: css }, [
    [("#ace"), { 
    	align: "left", width: 475, action: "toggle-source",
    	executesAction: "none",
        onChange() {
        	this.setTimeout("render", () => this.ud("#render").execute(), 750);
        }
    }],

    ["vcl/Action", ("toggle-source"), {
        hotkey: "Shift+MetaCtrl+S",
        selected: "state", visible: "state", 
        state: true,
        onLoad() {
    		this.up().readStorage("source-visible", (visible) => {
    			if(typeof visible === "boolean") {
    				this.setState(visible);
    			} else if(visible === undefined && this.vars(["resource.uri"]).split("/").pop() === ".md") {
    				this.setState(false);
    			}
    		});
        },
        onExecute() {
        	var state = !this.getState();
        	this.setState(state);
        	this.up().writeStorage("source-visible", state);
        	if(!state) {
        		
        	}
        }
    }],
    ["vcl/Action", ("render"), {
    	on() {
    		var ace = this.ud("#ace");
			var lines = ace.getLines().filter(_ => _.split("\"").length > 15);
			
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
			var arr = Parser.parse(lines.join("\n"), options).data;
			arr = arr.filter(_ => _.length);
			var headers = arr.shift();
			var parseValue = (value) => isNaN(value.replace(",", ".")) ? value : parseFloat(value.replace(",", "."));
			
			arr = arr.map(values => {
				var obj = {};
				headers.forEach((key, index) => obj[key] = parseValue(values[index]));
				return obj;
			});
			
			this.ud("#array-measurements").setArray(arr);
			this.up("vcl/ui/Tab").emit("resource-rendered", [{sender: this, data: arr}]);
    	}
    }],
	
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

	["vcl/ui/Panel", ("client"), { align: "client" }, [
		["vcl/ui/Tabs", ("tabs-sections"), { classes: "bottom", align: "bottom" }, [
			["vcl/ui/Tab", { text: "Variabelen", control: "variables" }],
			["vcl/ui/Tab", { text: "Metingen", control: "measurements" }],
			["vcl/ui/Tab", { text: "Grafieken", control: "renderer", selected: true }]
		]],
		["vcl/ui/Panel", { align: "client", css: "background-color:white;" }, [
			["vcl/ui/Bar", ("#bar"), {}, [
				["vcl/ui/Input", ("q"), { 
					placeholder: "Filter", 
					onChange() { 
						this.setTimeout("updateFilter", () => {
							var a1 = this.udr("#array-variables");
							var a2 = this.ud("#array-measurements");
							a1.vars("q", this.getValue());
							a1.updateFilter();

							a2.vars("q", this.getValue());
							a2.updateFilter();

							// this.ud("#list-status").render();

						}, 250); 
					} 
				}],
			]],
			["vcl/ui/List", ("variables"), { 
				autoColumns: true,
				onLoad() { 
					this.setSource(this.ud("#renderer #array-variables"));
				},
				visible: false
			}],
			["vcl/ui/List", ("measurements"), { 
				align: "client", autoColumns: true, visible: false, 
				css: "background-color: white; min-width:100%;", 
				source: "array-measurements",
				onDblClick: function() {
					this.print(this.getSelection(true));	
				},
				// onColumnGetValue: function(column, value, row, source) {
				// 	value = this._source._arr[row][column._attribute];
				// 	if(column.getIndex() === 0) {
				// 		return row + " - " + value;
				// 	}
				// 	return value;
				// }
			}],
		]],
		[["devtools/Renderer<gds>"], ("renderer"), { visible: false }]
	]]
]];