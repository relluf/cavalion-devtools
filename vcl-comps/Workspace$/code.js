var db = require("vcl/Component").defaultDb.name;

$([], { 
	vars: {
		"#navigator favorites": [
			"Workspaces/cavalion.org/cavalion-ide/src/cavalion-blocks",
			"Workspaces/cavalion.org/cavalion-code/src",
			"Workspaces/cavalion.org/cavalion-code/src/vcl-comps",
			"Workspaces/cavalion.org/cavalion-code/CHANGELOG.md;CHANGELOG.md;File",
			"Workspaces/cavalion.org/cavalion-code/ROADMAP.md;ROADMAP.md;File",
			"Workspaces/cavalion.org/cavalion-code/src/cavalion-blocks/tools/devtools;_tools/devtools;Folder",
			js.sf("pouchdb://%s;%s/;Folder;seperator", db, db)
		],
		"additional-workspaces": ["build"/*, "devtools"*/]
	},
	handlers: {
		loaded: function() {
			var keys = require("vcl/Component").getKeysByUri;
			if(keys(this._uri).specializer_classes.length > 0) {
				return;
			}
			
	/*- TODO this should flow back to devtools/Workspace - double click the corresponding tab to expand/collapse sub tabs. The idea is that the hotkeys activate a workspace (Cmd+1..9 remain fixed to address/focus an area (code/vcl/blocks/veldapps) and then another key could be pressed (ie. rapidly) to select a sub-tab (eg. Cmd+1, 3)*/

{			
			var this_index = this.up("vcl/ui/Tab").getIndex(), tab;
			this.udown("#workspace-needed").execute({workspace:{name: "code/build", selected: false}}).setIndex(this_index);
			// this.udown("#workspace-needed").execute({workspace:{name: "code/apps", text: "apps", content: "_apps", selected: false}}).setIndex(this_index + 2);
			// this.udown("#workspace-needed").execute({workspace:{name: "code/devtools", text: "devtools", content: "_devtools", selected: false}}).setIndex(this_index + 2);
}			
			// this.vars("additional-workspaces", false, []).map(function(ws, index) {
			// 	var tab = ws_needed.execute({
			// 		workspace:{
			// 			name: keys.specializer + "/" + ws, 
			// 			selected: false
			// 		}
			// 	});
			// 	if(ws === "build") {
			// 		tab.setIndex(ws_index + index);
			// 	} else {
			// 		tab.setIndex(ws_index + index + 1);
			// 	}
			// 	return tab;
			// });
		}
	}
});