"vcl/ui/FormContainer, vcl/ui/Tab";

var Tab = require("vcl/ui/Tab");
var FormContainer = require("vcl/ui/FormContainer");


function Tab_oncloseclick() {
	// this._control._form ? 
	// 	this._control._form.close() : 
	// 	this.destroy();
	this._control._form && this._control._form.destroy();
	this.destroy();
}

function FormContainer_dispatchChildEvent(component, name, evt, f, args) {
	if(name.indexOf("form") === 0&& name === "formclose") {
		component._owner.destroy();
	}
	return this.inherited(arguments);
}

$("vcl/Action", {
    vars: {
		closeable: "default for Tab.closeable if not specified in params",
		parents: {
			container: "reference to parent of to be created FormContainers",
			tab: ""
		}
    },
	onExecute: function(evt) {
		var scope = this.scope();
		var parents = js.mixIn(evt.parents || this.getVar("parents"));
		var closeable = evt.closeable || this.getVar("closeable");
		var formUri = evt.formUri || this.getVar("formUri");
		
		for(var k in parents) {
			if(typeof parents[k] === "string") {
				parents[k] = scope[parents[k]];
			}
		}
		
		var tab = new Tab(evt.owner || scope['@owner']);
		var fc = new FormContainer(tab);
		tab.setCloseable(closeable);
		tab.setControl(fc);
		tab.setParent(parents.tab);
		tab.setOnCloseClick(Tab_oncloseclick);
		
		fc._onDispatchChildEvent = FormContainer_dispatchChildEvent;
		fc.setVisible(false);
		fc.setParent(parents.container);
		fc.setFormUri(formUri);
		
		evt.formParams && fc.setFormParams(evt.formParams);
		evt.selected && tab.setSelected(evt.selected);

		return tab;
	}
});