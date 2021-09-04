["", {

	handlers: {	
		loaded() { 
			var overlay = this.qs("#preview-overlay");
			this.override("visibleChanged", function() {
				overlay.setVisible(this.isVisible());
				return this.inherited(arguments);	
			});
		}
	}
	
}, [
	
	[("#list"), {
		onSelectionChange() {
			this.ud("#preview").setContent(
				this.getSelection(true).map(obj => 
					Object.entries(obj)
						.filter(entry => entry[1] !== " ").filter(entry => entry[1] !== null)
						.filter(entry => entry[1] !== undefined)
						.map(entry => js.sf("<li>%H: %n</li>", entry[0], entry[1]))
				.join(""))
			);
						
			return this.inherited(arguments);
		}
	}],
	
	[("Container"), "preview-overlay", { 
		classes: "glassy-overlay",
		css: "padding:60px;z-index: 9999;", // << ugly
		onLoad() { 
			this.setParent(this.app().down("#window"));
		}
	}, [
		[("Container"), "preview", {
			align: "right", 
			// visible: false,a
			width: 300,
			classes: "glassy no-margin with-shadow",
			css: {
				"": "padding:32px;"
			}
		}]
	]]
	
]];	
	
	
