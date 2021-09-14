var Action = require("vcl/Action");

if(!Action.prototype.toast) {
	Action.prototype.toast = function(evt) {
		this.app().toast({
			content: evt.name,
			classes: "fade glassy big"
		});
	};
	js.override(Action.prototype, "execute", function() {
		this.toast.apply(this, arguments);
		return this.inherited(arguments);	
	});
} else {

	Action.prototype.toast = function(evt) {
		this.app().toast({
			content: this._name || js.sf("%n", this),
			classes: "fade glassy"
		});
	};
	
}

["Container", {}];