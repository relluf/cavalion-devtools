"use blocks/Blocks";

var B = require("blocks/Blocks");

$([], {
	handlers: {
		loaded() {
			this.down("#session-bar").setIndex(0);
			this.down("#session-bar").show();
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
	$(["veldoffice/Session"], "session-bar", { visible: false }, [
	
		$i("title", { 
			content: "Veldoffice<span style='font-weight:normal;'> - code</span>" 
		})
		
	]),
	$i("workspaces-tabs", { //align: "top", index: 1, classes: "", _zoom: 1.5,
		onNodeCreated() { 
			// this.setTimeout("zoom", () => this.setZoom(1.45), 750); 
		}
	})	
]);