$([], { 
	vars: {
		"#navigator favorites": [
			"Workspaces/veldapps.com/Veldoffice/Veldoffice-glassfish/veldoffice2-front-end",
			"Workspaces/veldapps.com/Veldoffice/veldoffice-gebruik-vcl",
			"Workspaces/veldapps.com/Veldoffice/veldoffice-geografie-vcl",
			// "Workspaces/veldapps.com/Veldoffice/veldoffice-lib-vcl-comps",
			"Workspaces/veldapps.com/Veldoffice/veldoffice-rapportage-vcl",
			"Workspaces/veldapps.com/Veldoffice/veldoffice-rapportage-scripts",
			"Workspaces/veldapps.com/Veldoffice/veldoffice-js",
			"Library/cavalion-blocks/veldapps;veldapps-blocks"
		]
	},
	handlers: {
		loaded: function() {
			var Blocks = require("blocks/Blocks");
			Blocks.DEFAULT_NAMESPACES['vcl-veldoffice'] = "vcl-veldoffice";
			Blocks.DEFAULT_NAMESPACES.veldoffice = "vcl-veldoffice";
			
			var keys = require("vcl/Component").getKeysByUri;
			if(keys(this._uri).specializer_classes.length > 0) {
				return;
			}
			
			
	/*- TODO this should flow back to devtools/Workspace - double click the corresponding tab to expand/collapse sub tabs. The idea is that the hotkeys activate a workspace (Cmd+1..9 remain fixed to address/focus an area (code/vcl/blocks/veldapps) and then another key could be pressed (ie. rapidly) to select a sub-tab (eg. Cmd+1, 3)*/

			var this_index = this.up("vcl/ui/Tab").getIndex(), tab;
			this.udown("#workspace-needed").execute({workspace:{name: "Veldoffice/rapportage", selected: false}}).setIndex(this_index + 1);
			this.udown("#workspace-needed").execute({workspace:{name: "Veldoffice/geografie", selected: false}}).setIndex(this_index + 2);
			this.udown("#workspace-needed").execute({workspace:{name: "Veldoffice/gebruik", selected: false}}).setIndex(this_index + 2);
			this.udown("#workspace-needed").execute({workspace:{name: "Veldoffice/beheer", selected: false}}).setIndex(this_index + 2);
		}
	}
}, []);