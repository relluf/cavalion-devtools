"use blocks/Blocks, veldoffice/VO";

window.VO = require("veldoffice/VO");
var B = require("blocks/Blocks");

["", {
	handlers: {
		loaded() {
			// this.qs("#session-bar").getNode().style.backgroundColor = "#f0f0f0";
			// this.qs("#session-bar").setIndex(0);
			// this.qs("#session-bar").show();
			
			this.app().print("VO", VO);
			this.app().print("VO.li()", VO.li());
		},
		activate() {
			var ms = this.vars("ms") || 0;
			if(Date.now() - ms > 30000) {
				this.setTimeout("activate->refresh->every30s", 
					function() {
						this.down("#session-bar #refresh").execute();
						this.vars("ms", Date.now());
					}.bind(this), 200
				);
			}
			return this.inherited(arguments);
		}
	}
}, [
	// [["veldoffice/Session"], "session-bar", {}, [
	
	// 	["#title", { 
	// 		content: "Veldoffice<span style='font-weight:normal;'> - code</span>" 
	// 	}]
		
	// ]],
	["#workspaces-tabs", { //align: "top", index: 1, classes: "", _zoom: 1.5,
		onNodeCreated() { 
			// this.setTimeout("zoom", () => this.setZoom(1.45), 750); 
		}
	}]	
]];