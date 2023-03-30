"use papaparse/papaparse, amcharts, amcharts.serial, amcharts.xy";

const Parser = require("papaparse/papaparse");

const guess = (lines) => {
	
	lines = lines.filter(_ => _.length);
	
	if(lines.length < 2) return null;
	
	var headers = lines.filter(_ => _.split("\"").length < 15);
	var measurements = lines.filter(_ => _.split("\"").length > 15);

	if(headers.length >= 22 && headers.length <= 23) {
		return "settlement";
	}
	
	return "triaxial";
};
const css = {
	"#bar": "text-align: center;",
	"#bar > *": "margin-right:5px;",
	"#bar input": "font-size:12pt;width:300px;max-width:50%; border-radius: 5px; border-width: 1px; padding: 2px 4px; border-color: #f0f0f0;",
	"#bar #left": "float:left;", "#bar #right": "float:right;"
};
const handlers = {
	"#tabs-sections onChange": function tabs_change(newTab, curTab) {
		this.ud("#bar").setVisible(newTab && (newTab.vars("bar-hidden") !== true));
	}
};

["", { css: css, handlers: handlers }, [
    [("#ace"), { 
    	align: "left", width: 475, 
    	action: "toggle-source",
    	executesAction: "none",
        onChange() {
        	
        	this.setTimeout("render", () => {

        		const refresh = () => {
	        		if(this.getLines().length) {
	        			renderer.qs("#refresh").execute();
						this.up("vcl/ui/Tab").emit("resource-rendered", [{sender: this, }]);
						// TODO emiting that event from here is just weird
	        		}
        		};
        		
        		var lines = this.getLines();
        		var renderer = this.ud("#renderer");
        		
        		if(renderer === null) { // dynamically determine actual Renderer<>
        			var type = guess(lines);
        			if(type === null) {
        				throw new Error("Unknown GDS type");
        			}
        			
        			B.i([js.sf("vcl-comps:devtools/Renderer<gds.%s>", type), "renderer"])
        				.then(r => {
        					renderer = r;
        					
        					r.setName(type);
        					r.setParent(this.ud("#container-renderer"));
        					r.setOwner(this.getOwner());
        					r.qs("#panel-edit-graph").bringToFront();

							this.print("renderer instantiated", r);
        					
        					refresh();
        				});
        		} else {
        			refresh();
        		}
        		
        	}, 750);
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

	["vcl/ui/Tabs", ("tabs-sections"), { classes: "bottom", align: "bottom" }, [
		["vcl/ui/Tab", { text: "Variabelen", control: "variables", selected: !true }],
		["vcl/ui/Tab", { text: "Metingen", control: "measurements" }],
		["vcl/ui/Tab", { text: "Grafieken", control: "container-renderer", selected: true, vars: { 'bar-hidden': true }} ],
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
	["vcl/ui/Panel", ("container-renderer"), { align: "client", visible: false } ]
]];