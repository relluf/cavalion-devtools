"js-yaml";

var yaml = require("js-yaml");

$([], {
    // onLoad: function() {
    //     var tab = this.up("vcl/ui/Tab");
    //     var scope = this.scope();

    //     function f() { scope.render.execute({}); }
    //     tab.on({"resource-loaded": f, "resource-saved": f});

    //     return this.inherited(arguments);
    // }
}, [
    $i("ace", { 
    	align: "left", width: 475, action: "toggle-source",
    	executesAction: "none",
        onChange: function() {
        	var scope = this.scope();
			function render() {
				var root = yaml.load(scope.ace.getValue());
				scope.out.setContent(String.format("<pre><code>%H</code></pre>", js.b(JSON.stringify(root))));
				this._owner.setVar("root", root);
            }        	
        	
            this.setTimeout("render", render.bind(this), 500);
        }
    }),
    $("vcl/Action#toggle-source", {
        hotkey: "Shift+MetaCtrl+S",
        selected: "state", visible: "state",
        state: true,
        
        onExecute: function() {
        	this.setState(!this.getState());
        	// this.scope().ace.setVisible(this.getState());
        }
    }),
    $("vcl/ui/Panel", "out", { align: "client", css: {
	    "background-color": "#f0f0f0", 
	    "border-left": "1px solid silver",
	    "border-right": "1px solid silver",
	    // "font-family": "times,-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif,'Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol'", 
	    "font-size": "12pt",
	    padding: "10px",
    } }),
    $("vcl/ui/Console", "console", { align: "bottom", height: 200,
    	css: "background-color: #f0f0f0; border-left: 1px solid silver; border-right: 1px solid silver;",
    	onEvaluate: function(expr) {
    		var root = this._owner.getVar("root"), scope = this.scope();
    		return eval(expr);
    	}
    })
]);