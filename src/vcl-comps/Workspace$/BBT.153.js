"entities/EM, blocks/Blocks";

var EM = require("entities/EM");
var prefix = "/bbt-1.5.3/";

$([], {
	vars: {
		// "#navigator favorites": [
		// 	"Workspaces/eae.com/BBT-1.5.3/WebContent/app/src",
		// 	"Workspaces/eae.com/BBT-1.5.3/WebContent/src/main",
		// 	"Workspaces/eae.com/BBT-1.5.3/WebContent/src/gdtis"
		// ]
	},
	
	onLoad: function() {
		if(EM.prefix !== prefix) {
			EM.prefix = prefix;
			this.app().qs("vcl/ui/Console#console").print("loaded-BBT-153 (entities/EM prefixed)", this);
		}
		return this.inherited(arguments);
	}
	
}, []);