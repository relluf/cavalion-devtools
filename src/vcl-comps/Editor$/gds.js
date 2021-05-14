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
        	this.setTimeout("render", () => {
        		if(this.getLines().length) {
        			this.ud("#renderer").qs("#refresh").execute();
					this.up("vcl/ui/Tab").emit("resource-rendered", [{sender: this, }]);
					
					// TODO emiting that event from here is just weird
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
	[["devtools/Renderer<gds>"], ("renderer"), { }]
]];