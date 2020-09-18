[[], {
	// onLoad() { return this.inherited(arguments); }
}, [

	["#workspaces-tabs", { //align: "top", index: 0, classes: "", _zoom: 0,
		css: "background-color:white;",
		zoom: 0,
		onNodeCreated() { 
			this.setTimeout("zoom", () => this.setZoom(1), 750); 
		}
	}]
	
]];