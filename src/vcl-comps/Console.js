"use devtools/Resources";

var Resources = require("devtools/Resources");

let cc = function() { // HM-20241010-1-method-auto-require-in-first-call
	// const args = js.copy_args(arguments);
	return Promise.resolve(req("clipboard-copy")).then(cc_ => {
		cc = cc_;
		
		return cc.apply(window, arguments);
	});
};

["vcl/ui/Form", (""), { activeControl: "console" }, [
	["vcl/ui/Console", ("console"), { 
		classes: "no-time",
        onEvaluate(expr) {
            var scope = this.scope();
            var app = this.app(), me = this;
            var ws = this.up(":root");
            var ed = ws ? ws.qsa("devtools/Editor<>:root:visible").pop() : null;
            var ace = ws && ws.qsa("devtools/Editor<>:root:visible").map(_ => _.down("#ace")).pop();
            
            var pr = this.print.bind(this);

            var ctx = this.vars(["eval-context", 0, this.vars("eval-context", Object.create(null, {
            	root: { 
            		get() {
			            var ed = ws ? ws.qsa("devtools/Editor<>:root:visible").pop() : null;
	            		return ed && ed.vars("root"); 
	            	}  
            	},
            	ls: { 
            		get() {
            			return (path) => Resources.list(js.normalize((ace.vars(["resource.uri"])), path || ".")); 
            		} 
            	}
            }))]);

            with(ctx) { return eval(expr); }
        }
	}]
]];