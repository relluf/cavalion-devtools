"use js, vcl/Component, vcl/Control, vcl/ui/FormContainer";

var Component = require("vcl/Component");
var Control = require("vcl/Control");
var FormContainer = require("vcl/ui/FormContainer");

["vcl-ui:Sizer", {
	onLoad: function() {
        var app = this.app(), down;
        var console = this.scope().console;
        var sizer = this, me = console, changedAt;

        sizer.on("setControl", function (value) {
            var content = [];
            if (value !== null) {
                if (value.getUri()) {
                    content.push(value.getUri());
                }
                content.push(String.format("%n", value));
                if(sizer.getVar("meta") !== true) {
                	console.getNode("input").value = String.format("#%d // %s ", value.hashCode(), content.join(": "));
                } else {
					console.getNode("input").value = String.format("#%d", value.hashCode());
				}
                if (value._owner) {
                    content.push(String.format("%n", value._owner));
                }
            }
            // scope.sizer_selection.setContent(String.format("%H", content.join(" - ")));
        }, true);

        app._dispatcher.override({
        	// FIXME overriding dispatcher, Application.prototype.dispatchEvent(...)
            dispatch: function (component, name, evt) {
				// if(name.indexOf("key") === 0) {
				// 	console.log(evt.keyCode, name, {ctrl: evt.ctrlKey, alt: evt.altKey, shift: evt.shiftKey, meta: evt.metaKey});
				// }
                if (evt.keyCode === 27) {
                	if (sizer._control !== null) {
                        if (name === "keydown") {
                            down = Date.now();
                            sizer.setControl(sizer._control._parent);
                        }
                        if (name === "keyup") {
                            // if(down + 750 < Date.now()) {
                            //     sizer.setControl(null);
                            // }
                            return false;
                        }
                    }
                } else if (name === "dblclick" && evt.altKey === true) {
                } else if (name === "click" && evt.altKey === true) {

                	sizer.setVar("meta", evt.metaKey === true);

					if (evt.shiftKey === false) {
                        if (component instanceof Control) {
                            if (sizer._control === component) {
                                component = null;
                            	//me.getScope().console.setFocus();
                            }
                            sizer.setControl(component);
                            return false;
                        }
                    } else {
                        var fc = component;
                        while (fc instanceof Control) {
                            if (fc instanceof FormContainer) {
                                if(evt.metactrlKey === true) {
                                    var keys = Component.getKeysByUri(fc._formUri);

                                    if (confirm(String.format("Rescaffold %s?", fc.getForm().getUri())) === true) {
                                        fc.reloadForm();
                                        return false;
                                    }
                                } else {
                                    if (confirm(String.format("Reload %s?", fc.getForm().getUri())) === true) {
                                        fc.reloadForm();
                                        return false;
                                    }
                                }
                            }
                            fc = fc._parent;
                        }
                    }
                } else if(name ==="touchstart" || name === "touchmove") {
                	if(evt.touches.length > 3) {
                		app.getScope().toggle_console.execute(evt);
                	}
                }

                return this.inherited(arguments);
            }
        });
        
	}
}];