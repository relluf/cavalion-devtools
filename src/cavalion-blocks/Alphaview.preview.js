["", {

	onDispatchChildEvent(component, name, evt, f, args) {
		if(name === "keydown" && evt.keyCode === 27) {
			this.down("#preview-overlay").hide();
		}
		return this.inherited(arguments);
	},
	
	handlers: {	
		loaded() { 
			var overlay = this.qs("#preview-overlay");
			var list = this.qs("#list");
			this.override("visibleChanged", function() {
				overlay.setVisible(list.getSelection().length && this.isVisible());
				return this.inherited(arguments);	
			});
		}
	}
	
}, [
	
	[("#list"), {
		onSelectionChange() {
			var selection = this.getSelection(true);
			this.ud("#preview").setContent(
				selection.map(obj => 
					Object.entries(obj)
						.filter(entry => entry[1] !== " ").filter(entry => entry[1] !== null)
						.filter(entry => entry[1] !== undefined)
						.map(entry => js.sf("<li>%H: %n</li>", entry[0], entry[1]))
				.join(""))
			);
			
			this.ud("#preview-overlay").setVisible(selection.length > 0);

			return this.inherited(arguments);
		}
	}],
	
	[("Container"), "preview-overlay", { 
		classes: "glassy-overlay",
		css: "z-index: 9999;", // << ugly z-index
		tabIndex: 1,
		onKeyDown(evt) { 
			if(evt.keyCode === 27) {
				this.ud("#preview-overlay").hide();
			}
			return this.inherited(arguments);
		},
		onLoad() { 
			this.setParent(this.app().qs("#window")); // this suggests some defined environment
		}
	}, [
		[("Container"), "preview", {
			align: "left", width: 300,
			classes: "glassy no-margin with-shadow",
			css: "padding: 32px;"
		}, [
			[("Sizer"), "preview-sizer", { 
				classes: "horizontal right", 
				vars: { control: "preview" } 
			}]
		]]
	]]
	
]];