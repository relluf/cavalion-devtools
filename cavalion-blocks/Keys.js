"use util/HotkeyManager";

var HKM = require("util/HotkeyManager");
var Event_ = require("util/Event");

["Container", {
	
	onLoad() {
		var app = this.app();
		this.vars("li", HKM.register({
			keyCode: "*", 
			callback: function(e) { 
				if(e.keyModifiers.length === 0) return; 
				app.toast({content: String.format("%s+%s", Event_.getKeyModifiers(e, false).join("+"), e.keyCode)});
				if(e.keyCode === 186) {
					e.preventDefault();
				}
			}
		}));
	},
	
	onDestroy() {
		var li = this.vars("li");
		HKM.unregister(li);
	}
	
}];