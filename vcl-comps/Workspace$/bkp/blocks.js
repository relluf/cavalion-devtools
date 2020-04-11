"use vcl/ui/Node, dropbox";

var DBX_XS_TOKEN = "4OZtEz8LDp4AAAAAAABDHXHMmiCnPt51rdSbcyzWv9VkGCwLXHWK5B7e6S1D_Grb";

var Node_ = require("vcl/ui/Node");
var Dropbox = require("dropbox").Dropbox;

$(["devtools/Workspace"], {
	vars: {
		dbx: new Dropbox({accessToken:DBX_XS_TOKEN}),
		"#navigator favorites": [
			"Workspaces/cavalion.org/cavalion-blocks/src/;src",
			"Workspaces/cavalion.org/cavalion-blocks/src/prototypes",
			"Workspaces/cavalion.org/cavalion-devtools/src/cavalion-blocks/devtools",
			"Workspaces/cavalion.org/cavalion-ide/src/cavalion-blocks/ide"
		]
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
			})
		
		])	
	])
]);