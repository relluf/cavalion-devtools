$(["devtools/Workspace"], { 
	vars: {
		"#navigator favorites": [
			"Workspaces/cavalion.org/cavalion-ide/src/cavalion-blocks",
			"Workspaces/cavalion.org/cavalion-code/src",
			"Workspaces/cavalion.org/cavalion-code/src/vcl-comps",
			"Workspaces/cavalion.org/cavalion-code/CHANGELOG.md;CHANGELOG.md;File",
		]
	},
	handlers: {
		loaded: function() {
			var keys = require("vcl/Component").getKeysByUri;
			if(keys(this._uri).specializer_classes.length > 0) {
				return;
			}
			
	/*- TODO this should flow back to devtools/Workspace - double click the corresponding tab to expand/collapse sub tabs. The idea is that the hotkeys activate a workspace (Cmd+1..9 remain fixed to address/focus an area (code/vcl/blocks/veldapps) and then another key could be pressed (ie. rapidly) to select a sub-tab (eg. Cmd+1, 3)*/

			var this_index = this.up("vcl/ui/Tab").getIndex(), tab;
			this.udown("#workspace-needed").execute({workspace:{name: "code/build", selected: false}}).setIndex(this_index + 1);
			this.udown("#workspace-needed").execute({workspace:{name: "code/Apps", selected: false}}).setIndex(this_index + 2);
		}
	}
});