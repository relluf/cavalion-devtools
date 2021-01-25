"use devtools/Resources";

var Resources = require("devtools/Resources");

["vcl/ui/Form", (""), { activeControl: "console" }, [
	["vcl/ui/Console", ("console"), { 
		classes: "no-time",
        onEvaluate(expr) {
            var scope = this.scope();
            var app = this.app(), me = this;
            var ws = this.up(":root");
            var ace = ws && ws.qsa("devtools/Editor<>:root:visible").map(_ => _.down("#ace"));
            // var ace = ws && ws.down("devtools/Editor<>:root < vcl/ui/Ace:visible");
            var ed = ace ? ace.getEditor() : null;
            // var paths = window.require.s.contexts._.config.paths;
            
            var pr = this.print.bind(this);
            var open = (uri, opts) => me.bubble("openform", js.mixIn(js.mixIn(opts || {}), {uri: uri}));
            var ls = (path) => Resources.list(path || "/");

            // return window["ev"+(pr?"al":"")].apply(this, [expr]); // don't want no warnings (just calling eval)
            return eval(expr);
        }
	
	}]
]];