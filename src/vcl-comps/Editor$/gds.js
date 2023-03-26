"use papaparse/papaparse, amcharts, amcharts.serial, amcharts.xy";

var Parser = require("papaparse/papaparse");

var css = {
	"#bar": "text-align: center;",
	"#bar > *": "margin-right:5px;",
	"#bar input": "font-size:12pt;width:300px;max-width:50%; border-radius: 5px; border-width: 1px; padding: 2px 4px; border-color: #f0f0f0;",
	"#bar #left": "float:left;", "#bar #right": "float:right;"
};

function guess(lines) {
	
	lines = lines.filter(_ => _.length);
	
	if(lines.length < 2) return null;
	
	var headers = lines.filter(_ => _.split("\"").length < 15);
	var measurements = lines.filter(_ => _.split("\"").length > 15);

	if(headers.length >= 22 && headers.length <= 23) {
		return "settlement";
	}
	
	return "triaxial";
}

["", { css: css }, [
    [("#ace"), { 
    	align: "left", width: 475, action: "toggle-source",
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
        			
        			B.i([js.sf("vcl-comps:devtools/Renderer<gds.%s>", type)])
        				.then(r => {
        					renderer = r;
        					r.setParent(this.getOwner());
        					r.setOwner(this.getOwner());
        					
        					// r.udr("#container-graphs")
        					
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
	[["devtools/Renderer<gds.settlement>"], ("renderer"), { }]
]];