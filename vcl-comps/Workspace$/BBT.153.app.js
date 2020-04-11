"home/Workspaces/eae.com/BBT-1.5.3/WebContent/app/src/scaffold, js/Scaffold";

var defaults = require("home/Workspaces/eae.com/BBT-1.5.3/WebContent/app/src/scaffold");
var Scaffold = require("js/Scaffold");

$([], {
	onLoad: function() {
		if(Scaffold.defaults !== defaults) {
			this.vars("scaffold", Scaffold.defaults = defaults);
			this.app().qs("vcl/ui/Console#console").print("loaded-BBT-153/app js/Scaffold.defaults", defaults);
		}
		return this.inherited(arguments);
	}
}, []);