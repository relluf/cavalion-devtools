"use devtools/Resources";

var Resources = require("devtools/Resources");

["vcl/ui/Form", (""), { activeControl: "console" }, [
	["vcl/ui/Console", ("console"), { 
		classes: "no-time",
        onEvaluate(expr) {
            var scope = this.scope();
            var app = this.app(), me = this;
            var ws = this.up(":root");
            var ed = ws ? ws.qsa("devtools/Editor<>:root:visible").pop() : null;
            var ace = ws && ws.qsa("devtools/Editor<>:root:visible").map(_ => _.down("#ace")).pop();
            
            // var ace = ws && ws.down("devtools/Editor<>:root < vcl/ui/Ace:visible");
            // var paths = window.require.s.contexts._.config.paths;
            
            var pr = this.print.bind(this);
            // var open = (uri, opts) => me.bubble("openform", js.mixIn(js.mixIn(opts || {}), {uri: uri}));
            // var ls = (path) => Resources.list(path || "/");
            
            var ctx = this.vars(["eval-context", 0, this.vars("eval-context", Object.create(null, {
            	root: { get() { 
		            // var ace = ws.qsa("devtools/Editor<>:root:visible").map(_ => _.down("#ace")).pop();
            		// var host = ace.ud("#host") || ace.getOwner();
		            var ed = ws ? ws.qsa("devtools/Editor<>:root:visible").pop() : null;
            		return ed && ed.vars("root"); 
            	}  },
            	open: { get() { return (uri, opts) => this.bubble("openform", js.mixIn(js.mixIn(opts || {}), {uri: uri})); } },
            	ls: { get() { return (path) => Resources.list(path || "/"); } }
            }))]);

            with(ctx) { return eval(expr); }
        }
	
	}]
]];