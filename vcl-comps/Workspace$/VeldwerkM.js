$([], { 
	vars: {
		"#navigator root": "Workspaces/veldapps.com/VeldwerkM",
		"#navigator nodes": ["favorites", "cavalion-server-fs", "root", "pouchdbs", "any.."],
		"#nvaigator tabs editors": [],
		"#navigator favorites": [
			"Workspaces/veldapps.com/VeldwerkM/server2/cavalion-ROOT/trunk;cavalion-ROOT-web",
			"Workspaces/veldapps.com/VeldwerkM/veldapps-veldwerkm-web",
		],
		"workspace": {
			"github-repo": "relluf/veldapps-veldwerkm-web"
		}
	},
	onLoad() {
			// var Blocks = require("blocks/Blocks");
			// Blocks.DEFAULT_NAMESPACES['vcl-veldoffice'] = "vcl-veldoffice";
			// Blocks.DEFAULT_NAMESPACES.veldoffice = "vcl-veldoffice";

			js.mixIn(this.vars(["workspace"]), this.vars("workspace"));
			
			var keys = require("vcl/Component").getKeysByUri;
			if(keys(this._uri).specializer_classes.length > 0) {
				return;
			}
			
			
	/*- TODO this should flow back to devtools/Workspace - double click the corresponding tab to expand/collapse sub tabs. The idea is that the hotkeys activate a workspace (Cmd+1..9 remain fixed to address/focus an area (code/vcl/blocks/veldapps) and then another key could be pressed (ie. rapidly) to select a sub-tab (eg. Cmd+1, 3)*/

			// var this_index = this.up("vcl/ui/Tab").getIndex(), tab;
			// this.udown("#workspace-needed").execute({workspace:{name: "Veldoffice/rapportage", selected: false}}).setIndex(this_index + 1);
			// this.udown("#workspace-needed").execute({workspace:{name: "Veldoffice/geografie", selected: false}}).setIndex(this_index + 2);
			// this.udown("#workspace-needed").execute({workspace:{name: "Veldoffice/gebruik", selected: false}}).setIndex(this_index + 2);
			
		return this.inherited(arguments);
	}
}, []);