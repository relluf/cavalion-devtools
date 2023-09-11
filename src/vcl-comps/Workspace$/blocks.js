"use devtools/Resources-dropbox";

["", {
	onLoad() {
		const host = this.qs("#host");
		let uri = host.vars("uri");
		if(!uri) {
			const spec = this.getSpecializer().split(":");
			
			if(spec.length > 1) {
				uri = spec.pop();
				if(uri.endsWith("/")) {
					uri += ".blocks";
				} else {
					uri += ".js";
				}

				if(uri.startsWith("/")) {
					uri = "$HOME" + uri;
					this.setTimeout(".md", () => this.open(js.up(uri.substring(6)) + "/.md"), 500);
				} else if(uri.startsWith("./")) {
					console.warn("TODO");
				}
				host.vars("uri", uri);
			} else {
				this.qs("#editors-visible").toggle();
				this.qs("#viewer-visible").toggle();
				host.hide();
			}
		}

		uri && app.toast({ content: uri, classes: "glassy fade centered"});

		return this.inherited(arguments);
	},
}, [
	["vcl/Action", ("editors-visible"), {
		state: false,
		visible: "state",
		on() { this.toggle(); },
		hotkey: "Alt+Cmd+F1"
	}],
	
	["vcl/Action", ("viewer-visible"), { 
		parent: "editors-visible", 
		state: "parent", 
		visible: "notState"
	}],

	["#editors", { action: "editors-visible", executesAction: false }],
	["#left-sidebar", { action: "editors-visible", executesAction: false }],
	
	[["cavalion-blocks"], ("host"), {
		action: "viewer-visible", 
		executesAction: false
	}]

]];
// "#navigator favorites_": [
		// 	// "Workspaces/cavalion.org/cavalion-blocks/src/prototypes;blocks/prototypes",
		// 	"Workspaces/cavalion.org/cavalion-blocks/src/;blocks/src",
		// 	"Workspaces/cavalion.org/cavalion-blocks/.md;.md;File",
		// 	// "Workspaces/cavalion.org/cavalion-code/src/cavalion-blocks/console",
		// 	// "Workspaces/cavalion.org/cavalion-devtools/src/cavalion-blocks/devtools",
		// 	// "Workspaces/cavalion.org/cavalion-ide/src/cavalion-blocks/ide",
		// 	// "Workspaces/veldapps.com/veldapps-vo/src/cavalion-blocks;veldapps",
		// 	// "Library/cavalion-blocks/console;;Folder",
		// 	"Library/cavalion-blocks/devtools;;Folder",
		// 	"Library/cavalion-blocks/docs;;Folder",
		// 	"Library/cavalion-blocks/ide;;Folder",
		// 	// "Library/cavalion-blocks/index;;Folder",
		// 	// "Library/cavalion-blocks/lost+found;;Folder",
		// 	"Library/cavalion-blocks/prototypes;;Folder",
		// 	// "Library/cavalion-blocks/tools;;Folder",
		// 	"Library/cavalion-blocks/veldapps;;Folder"
		// ],
// 	onLoad_: function() {
// /*- Let's obtain the correct constructor and 'clone' a Node ;-) */
// 		var fs = this.down("#tree < #fs");
// 		// new (fs.constructor)({
// 		// 	vars: { 
// 		// 		resource: { 
// 		// 			uri: "dropbox://dropbox1",
// 		// 			name: "dropbox-1", 
// 		// 			type: "Folder"
// 		// 		}
// 		// 	},
// 		// 	classes: "seperator bottom",
// 		// 	// index: 0,
// 		// 	owner: this,
// 		// 	parent: fs,//this.down("#tree"),
// 		// 	expandable: true,
// 		// 	onNodesNeeded: function() {
// 		// 		// TODO set this method 'statically'?
// 		// 		var fs = this.up("devtools/Workspace<>").down("#navigator #fs");
// 		// 		return fs._onChildNodesNeeded.apply(fs, arguments);
// 		// 	}
// 		// });
// 		// new (fs.constructor)({
// 		// 	vars: { 
// 		// 		resource: { 
// 		// 			uri: "dropbox://dropbox2",
// 		// 			name: "dropbox-2", 
// 		// 			type: "Folder"
// 		// 		}
// 		// 	},
// 		// 	classes: "seperator bottom",
// 		// 	// index: 0,
// 		// 	owner: this,
// 		// 	parent: fs,//this.down("#tree"),
// 		// 	expandable: true,
// 		// 	onNodesNeeded: function() {
// 		// 		// TODO set this method 'statically'?
// 		// 		var fs = this.up("devtools/Workspace<>").down("#navigator #fs");
// 		// 		return fs._onChildNodesNeeded.apply(fs, arguments);
// 		// 	}
// 		// });

// /*- TODO (not sure what this is for) must have a Resources implementation, take it from fs */
// 		this.setVar("Resources", fs.getVar("Resources"));

// /*- TODO (additional wks - donotremoveyet) this should flow back to devtools/Workspace 
// 	- double click the corresponding tab to expand/collapse sub tabs. 
// 	The idea is that the hotkeys activate a workspace 
// 	(Cmd+1..9 remain fixed to address/focus an area (code/vcl/blocks/veldapps) and then 
// 	another key could be pressed (ie. rapidly) to select a sub-tab (eg. Cmd+1, 3)*/
// 		var keys = require("vcl/Component").getKeysByUri;
// 		if((keys = keys(this._uri)).specializer_classes.length > 0) {
// 			return;
// 		}

// 		var ws_needed = this.udr("#workspace-needed");
// 		var ws_index = this.up("vcl/ui/Tab").getIndex();
	
// 		this.vars("additional-workspaces", false, []).map(function(ws, index) {
// 			var tab = ws_needed.execute({
// 				workspace:{
// 					name: keys.specializer + "/" + ws, 
// 					selected: false
// 				}
// 			});
// 			if(ws === "build") {
// 				tab.setIndex(ws_index + index);
// 			} else {
// 				tab.setIndex(ws_index + index + 1);
// 			}
// 			return tab;
// 		});

// 		return this.inherited(arguments);
// 	}