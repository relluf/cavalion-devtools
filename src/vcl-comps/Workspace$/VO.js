"use blocks/Blocks";

var B = require("blocks/Blocks");

window.require.config({
	paths: {
		"VO": "/home/Workspaces/veldapps.com/Veldoffice/veldoffice-vcl-comps/src/cavalion-blocks/ListOf<>/VO",
		"sikb": "/home/Workspaces/veldapps.com/veldapps-imsikb/src"
	}
});

[[], {
	
	onLoad() {
		this.print("VO", req("VO").then(VO => (window.VO = VO)));
	}
	
}];


// [[], {
// 	handlers: {
// 		loaded() {
// 			var fs = this.down("#navigator #fs");
// 			// this.down("#navigator #fs").hide();
// 			// this.down("#left-sidebar-tabs").hide();
// 			// this.down("#editors-tabs").hide();
// 			// this.down("#session-bar").setParent(this.app().down("#window"));
// 			// this.down("#session-bar").setIndex(0);
// 			// this.down("#session-bar").show();
			
// 			fs.addClass("root");
// 			fs.removeClass("root-invisible");
// 			fs.setExpanded(false);
			
// 			// B.instantiate(
// 			// 	["Tab<veldapps/OpenLayers>", "Veldoffice", { 
// 			// 		owner: this, parent: this.down("#editors-tabs"),
// 			// 		text: "Map"
// 			// 	}], {}
// 			// ).then(function(tab) {
// 			// 	tab.setSelected(true);
// 			// 	fs.up().print(tab);
// 			// });
			
// 			// this.down("#session-bar").set({
// 			// 	parent: this.app().down("#window")
// 			// });
				
// 		},
// 		activate() {
// 			var ms = this.vars("ms") || 0;
// 			if(Date.now() - ms > 30000) {
// 				this.setTimeout("activate->refresh->every30s", 
// 					function() {
// 						this.down("#session-bar #refresh").execute();
// 						this.vars("ms", Date.now());
// 					}.bind(this), 200
// 				);
// 			}
// 			return this.inherited(arguments);
// 		}
// 	},
// 	css: {
// 		// ".{Bar}": {
// 		// 	"> *": "margin-right:4px;",
// 		// 	".{Group} > *": "margin-right:4px;",
// 		// 	"input": "padding:4px;border-radius:3px;border:1px solid silver;"
// 		// },
// 		"#session-bar": "background-color:#f0f0f0;",
// 		"#list": "background-color: white;",
// 		"button": "width: auto;"
// 	}
// }, [

// 	// $(["veldoffice/Session"], "session-bar", { visible: false })

// ]];