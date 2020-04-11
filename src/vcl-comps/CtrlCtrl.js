$("vcl/ui/Form", {
	activeControl: "input",
	autoSize: "both",
	autoPosition: "top-left-bottom-right",
	css: {
		"position": "absolute",
		"background-color": "rgba(255, 255, 255, 0.85)",
		"top": "120px",
		"width": "50%",
		"height": "64px",
		"margin-left": "25%",
		"margin-right": "25%",
		"z-index": "99999",
		padding: "8px",
		"box-shadow": "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 3px 0 rgba(0, 0, 0, 0.19)",
		"input": {
			background: "transparent",
			border: "none", width: "100%", height: "50px",
			"font-size": "16pt", 
			padding: "3px 12px"
		}
	},
	
	onActivate: function() {
		this.setVar("focused", require("vcl/Control").focused);
		// return this.inherited(arguments);
	},
	
	onDeactivate: function() {
		var control = this.getVar("focused");
		control && control.setFocus();
		// return this.inherited(arguments);
	},
	
	onLoad: function() {
		this.setParentNode(document.body);
		// return this.inherited(arguments);
	}
	
}, [
	$("vcl/ui/Input", "input", {
		onKeyDown: function(evt) {
			if(evt.keyCode === 27) {
				this._owner.hide();
			}
		},
		onBlur: function() {
			var me = this;
			this.setTimeout(function() {
				me._owner.hide();
			}, 200);
		}
	})
]);