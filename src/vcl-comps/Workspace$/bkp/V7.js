$([], { 
	vars: {
		"#navigator favorites": [
			"Workspaces/veldapps.com/V7/CHANGELOG.md;;File",
			"Workspaces/veldapps.com/V7/src",
			"Workspaces/veldapps.com/V7/src/va/veldoffice"
		],
		"additional-workspaces": ["build", "va", "va/veldoffice"]
	},
	handlers: {
		loaded: function() {
			var app = this.app();
			require(["v7/objects"], function(OM) {
				app.print("window.OM = require('v7/objects')", window.OM = OM);
			});

			var keys = require("vcl/Component").getKeysByUri;
			if((keys = keys(this._uri)).specializer_classes.length > 0) {
				return;
			}
			
	/*- TODO this should flow back to devtools/Workspace - double click the corresponding tab to expand/collapse sub tabs. The idea is that the hotkeys activate a workspace (Cmd+1..9 remain fixed to address/focus an area (code/vcl/blocks/veldapps) and then another key could be pressed (ie. rapidly) to select a sub-tab (eg. Cmd+1, 3)*/
			var ws_needed = this.udown("#workspace-needed");
			var ws_index = this.up("vcl/ui/Tab").getIndex();
		
			this.vars("additional-workspaces", false, []).map(function(ws, index) {
				var tab = ws_needed.execute({
					workspace:{
						name: keys.specializer + "/" + ws, 
						selected: false
					}
				});
				tab.setIndex(ws_index + index + 1);
				return tab;
			});
		}
	}
});