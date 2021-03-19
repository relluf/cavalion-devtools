"use papaparse/papaparse, amcharts, amcharts.serial, amcharts.xy";

var Parser = require("papaparse/papaparse");

["", {}, [
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
			var lines = ace.getLines().filter(_ => _.split(",").length > 5);
			
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
			var headers = arr.shift();
			var parseValue = (value) => isNaN(value.replace(",", ".")) ? value : parseFloat(value.replace(",", "."));
			
			arr = arr.map(values => {
				var obj = {};
				headers.forEach((key, index) => obj[key] = parseValue(values[index]));
				return obj;
			});
			
			this.ud("#array").setArray(arr);
			this.up("vcl/ui/Tab").emit("resource-rendered", [{sender: this, data: arr}]);
    	}
    }],
	
	["vcl/data/Array", ("array"), {
		onGetAttributeValue: function(name, index, value) { 
			return (this._arr[index] || {})[name]; 
		}
	}],

	["vcl/ui/Panel", ("client"), { align: "client" }, [
		["vcl/ui/Tabs", ("tabs-sections"), { classes: "bottom", align: "bottom" }, [
			["vcl/ui/Tab", { text: "Variabelen", control: "variables" }],
			["vcl/ui/Tab", { text: "Metingen", control: "measurements" }],
			["vcl/ui/Tab", { text: "Grafieken", control: "renderer", selected: true }]
		]],
		["vcl/ui/Panel", { align: "client", css: "background-color:white;" }, [
			["vcl/ui/List", ("variables"), { 
				autoColumns: true,
				onLoad() { 
					this.setSource(this.ud("#renderer #array-headers"));
				},
				visible: false
			}],
			["vcl/ui/List", ("measurements"), { 
				align: "client", autoColumns: true, visible: false, 
				css: "background-color: white; min-width:100%;", 
				source: "array",
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