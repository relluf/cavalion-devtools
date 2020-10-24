"use fast-xml-parser, xml-funcs";

var Parser = require("fast-xml-parser");
var Xml = require("xml-funcs");

var styles = {
	"#output": "background-color: #f0f0f0; border-right: 1px solid silver;"
};

[[], { 
	css: styles,
	onLoad() {
        var render = (evt) => this.qsa("#render").execute(evt);
        
        this.up("vcl/ui/Tab").on({
        	"resource-loaded": render, 
        	"resource-saved": render 
        });
        
        return this.inherited(arguments);
	}
}, [
    ["vcl/Action", ("toggle-source"), {
        hotkey: "Shift+MetaCtrl+S",
        selected: "state", visible: "state",
        state: true,
        
        onExecute: function() {
        	this.setState(!this.getState());
        	// this.scope().ace.setVisible(this.getState());
        }
    }],
    ["vcl/Action", ("toggle-output"), {
        hotkey: "Shift+MetaCtrl+O",
        selected: "state",
        visible: "state",
        state: true,
        
        onExecute: function() {
        	var output = this.scope().output;
        	output.setVisible(!output.isVisible());
        }
    }],
    ["vcl/Action", ("render"), {
    	onExecute: function() {
    		var scope = this.scope();
		 	var console = scope.console;
			var root = Parser.parse(scope.ace.getValue(), {ignoreAttributes : false});
			this._owner.setVar("root", root);
			console.print("root", root);
    	}
    }],
    ["vcl/Action", ("detailview-available"), {
    	on(evt) {
	    	var Tab = require("vcl/ui/Tab");
	    	
	    	var scope = this.scope();
    		var tab = new Tab({ owner: this._owner, text: evt.name,
    			parent: scope['details-tabs'], control: evt.view,
    			selected: evt.selected || false
    		});
    		
    		evt.view.setParent(scope.output);

    		return tab;
    	}	
    }],
    
    ["vcl/ui/Panel", ("output"), { align: "client" }, [
	    $("vcl/ui/Tabs", ("details-tabs"), { align: "bottom", classes: "bottom" }, [
	    	$("vcl/ui/Tab", { text: locale("Console"), control: "console", selected: true })
	    ]),
	    $("vcl/ui/Console", ("console"), { 
	    	align: "client", 
	    	onEvaluate: function(expr) {
	    		var root = this._owner.getVar("root"), scope = this.scope();
    			return eval(expr);
	    	}
	    })
    ]],
    
    [("#ace"), { 
    	align: "left", width: 600, 
    	action: "toggle-source",
    	executesAction: "none"
    }],
    [("#evaluate"), {
    	onLoad() {
    		this.vars("eval", () => this.vars(["root"]));
    		return this.inherited(arguments);
    	}
    }]
]];