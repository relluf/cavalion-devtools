"use vcl/ui/Node, dropbox";

var DBX_XS_TOKEN = "4OZtEz8LDp4AAAAAAABLV81n84RSnHKyv9kCTgtYwfICAiQJ4RREDPS1MSNDEl1_";

var Node_ = require("vcl/ui/Node");
var Dropbox = require("dropbox").Dropbox;

$([], {
	vars: {
		dbx: new Dropbox({accessToken:DBX_XS_TOKEN}),
		"#navigator favorites": [
			// "Workspaces/cavalion.org/cavalion-blocks/src/prototypes;blocks/prototypes",
			// "Workspaces/cavalion.org/cavalion-blocks/src/;blocks/src",
			// "Workspaces/cavalion.org/cavalion-code/src/cavalion-blocks/console",
			// "Workspaces/cavalion.org/cavalion-devtools/src/cavalion-blocks/devtools",
			// "Workspaces/cavalion.org/cavalion-ide/src/cavalion-blocks/ide",
			// "Workspaces/veldapps.com/veldapps-vo/src/cavalion-blocks;veldapps",
			"Library/cavalion-blocks/console;;Folder",
			"Library/cavalion-blocks/devtools;;Folder",
			"Library/cavalion-blocks/docs;;Folder",
			"Library/cavalion-blocks/ide;;Folder",
			// "Library/cavalion-blocks/index;;Folder",
			// "Library/cavalion-blocks/lost+found;;Folder",
			"Library/cavalion-blocks/prototypes;;Folder",
			// "Library/cavalion-blocks/tools;;Folder",
			"Library/cavalion-blocks/veldapps;;Folder"
		],
		// "additional-workspaces": ["ide"]
	},
	onLoad: function() {
		// var ws = this.up("devtools/Workspace<>:root");
		var fs = this.down("#tree < #fs");
		var NavigatorNode = fs.constructor;

		var node = new NavigatorNode({
			vars: { 
				resource: { 
					uri: "pouchdb://va_objects",
					name: "va-objects", 
					type: "Folder"
				}
			},
			owner: this,
			parent: this.scope().databases,
			expandable: true,
			onNodesNeeded: function() {
				var fs = this.up("devtools/Workspace<>").down("#navigator #fs");
				return fs._onChildNodesNeeded.apply(fs, arguments);
			}
		});

		// must have a Resources implementation, take it from fs		
		this.setVar("Resources", fs.getVar("Resources"));
		
		
	/*- TODO this should flow back to devtools/Workspace - double click the corresponding tab to expand/collapse sub tabs. The idea is that the hotkeys activate a workspace (Cmd+1..9 remain fixed to address/focus an area (code/vcl/blocks/veldapps) and then another key could be pressed (ie. rapidly) to select a sub-tab (eg. Cmd+1, 3)*/

			var keys = require("vcl/Component").getKeysByUri;
			if((keys = keys(this._uri)).specializer_classes.length > 0) {
				return;
			}

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

		
		return this.inherited(arguments);
	}
},  [
	$i("navigator", [
		$i("tree", [
			$("vcl/ui/Node", {
				text: "DROPBOX",
				classes: "folder seperator",
				expandable: true,
				// index: 0,
				onNodesNeeded: function(parent) {
					parent = parent || this;
			
					var owner = this;
					var dbx = this.vars(["dbx", true]);
					return dbx.filesListFolder({path: parent.vars("path") || ""})
						.then(function(res) {
							res.entries.sort(function(i1, i2) {
								return i1.name < i2.name ? -1 : 1;
							}).forEach(function(entry) {
								var folder = entry['.tag'] === "folder";
								(new Node_(owner)).setProperties({
									parent: parent,
									expandable: folder,
									classes: folder ? "folder" : "file",
									text: entry.name || entry.path_display
								}).vars("path", entry.path_display);
							});
						});
				}
			}),
			$("vcl/ui/Node", "databases", {
				text: "Databases",
				// visible: false,
				classes: "_root-invisible folder seperator",
				expanded: true,
				// onLoad: function() {
				// 	var fs = this.up("devtools/Workspace<>").down("#navigator #fs");
				// 	this.setParent(fs);
				// 	this.show();
				// },
				onNodesNeeded: function() {}
			})
		])	
	])
]);


