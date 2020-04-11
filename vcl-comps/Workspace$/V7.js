var Component = require("vcl/Component");

$([], { 
	vars: {
		"#navigator favorites": [
			"Workspaces/veldapps.com/V7/ROADMAP.md;;File",
			"Workspaces/veldapps.com/V7/CHANGELOG.md;;File",
			// "Workspaces/veldapps.com/V7/docs;V7/docs",
			"Workspaces/veldapps.com/V7/build;build",
			"Workspaces/veldapps.com/V7/src;src",
			"Workspaces/veldapps.com/V7/src/va/veldoffice",
			"Workspaces/veldapps.com/V7/tools"
		],
		"additional-workspaces": ["build", "va", "va/veldoffice"],
		"workspace": {
			"github-repo": "relluf/v7-app"
		},
		
		"default-editors": [{
			"uri": ""
		}]
	},
	handlers: {
		loaded: function() {
			var app = this.app(), keys;

			js.mixIn(this.vars(["workspace"]), this.vars("workspace"));

			if( /* BLEH! no solution for multiple apps at all, favs eg. should differ as well*/
				Component.defaultDb.name.indexOf("code-") !== 0 || (keys = 
				Component.getKeysByUri(this._uri)).specializer_classes.length > 0
			) {
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
				if(ws === "build") {
					tab.setIndex(ws_index + index);
				} else {
					tab.setIndex(ws_index + index + 1);
				}
				return tab;
			});
		}
	}
});