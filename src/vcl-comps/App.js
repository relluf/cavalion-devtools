"vcl/ui/Ace, js/Method, vcl/Factory, vcl/ui/FormContainer";

var Ace = require("vcl/ui/Ace");
var Method = require("js/Method");
var Factory = require("vcl/Factory");
var FormContainer = require("vcl/ui/FormContainer");
var Panel = require("vcl/ui/Panel");

var handlers = {
	onGetStorageKey(forKey) {
		if(forKey.length === 2) {
			var comp = forKey[0];
			var resource = comp.vars(["resource"]);
			if(resource) {
				var ws = comp.up("devtools/Workspace<>");
				return js.sf("%s %s %s", ws.getUri(), comp.getUri(), resource.uri);
			}
		}
	},
	loaded() {
		var scope = this.scope(), me = this;
		this.open = function(uri, opts) {
			if(typeof uri === "string") {
				opts = opts || {};
				opts.uri = uri;
			} else {
				opts = uri;
				uri = opts.uri;
			}
			return new Promise(function(resolve, reject) {
				if(opts.modal === true) {
					alert("don't know about modal");
					resolve(scope.openform_modal.execute(opts));
				} else {
					// this.down("devtools/Main<>:root #open_form").execute(opts.uri, opts);
					if(!opts.workspace) {
						opts.workspace = {name: opts.name || uri};
						opts.selected = true;
					}
					var tab = me.down("devtools/Main<>:root #workspace-needed").execute(opts);
					var ws = tab._control && tab._control._form;
					if(ws) {
						resolve(ws);
					} else {
						tab._control.once("formloaded", function() {
							ws = tab._control && tab._control._form;
							resolve(ws);
						});
					}
				}
			});
		};

		var blurred = new Panel();
		blurred.hide();
		// blurred.setCss({
		// 	"": "z-index:999999;font-size:55pt;text-align:center;padding-top:30%;font-family:Lucida Grande, Arial, sans-serif; font-weight:bold;pointer-events:none;opacity:0.35;",
		// 	".name": "padding:30px 40px; border-radius:160px;border:15px solid maroon; padding-top: 10px; padding-bottom: 40px;",
		// 	".host": "color:white;font-size:18pt;",
		// 	// "background-color":"rgba(255,255,255,0.5)",
		// 	"&.maroon": {
		// 		"color":"maroon",
  //   				".name": {
		// 			"background-color":"rgba(255,69,0,0.75)"
		// 		}
		// 	},
		// 	"&.navy": {
		// 		"color":"navy",
		// 		// "background-color":"rgba(0, 123, 255, 0.25)",
		// 		".name": {
		// 			"border-color":"navy",
		// 			"background-color":"rgba(0, 123, 255, 0.5)"
		// 		}
		// 	},
			
		// });
		blurred.setOwner(this);
		blurred.setName("blurry");
		// blurred.setAlignNode(document.body);
		// blurred.setAlign("client");
		// blurred.setClasses(Math.random() < 0.95 ? "navy" : "maroon");
		// blurred.setParentNode(document.body);
		// blurred._onClick = function() { this.hide(); };

		var timeout;
		function update(hidden) {
			var tab = me.qs("devtools/Workspace<>:root:selected devtools/Editor<>:root");
			var s = js.sf("%H", document.title.split("[").pop().split("]").shift());
			tab = tab || { _name: "unknown" };
			blurred.setContent("<span class='name'>" + s + "</span><div class='host'>" + js.sf("%H @ %H", tab._name.split("/").pop(), location.host) + "</div>");
			
			if(timeout) clearTimeout(timeout);
			if(hidden) {
				timeout = setTimeout(function() { 
					blurred.show(); }, 500);
			} else {
				blurred.hide();
			}
		}

		// TODO detect keyup Cmd		
		"alert,confirm,prompt".split(",").map(function(method) {
			var impl = window[method];
			window[method] = function() {
				blurred.vars("dialog-activated", true);
				try {
					return impl.apply(this, arguments);
				} finally {
					// VA.util.nextTick(function() {
					// 	me.print("finally, nextTick, timeout set to hide");
					// 	update(false);
					// 	me.print("modal gone");
					// 	update(false);
					// }, 0);
				}
			};
		});

		var mousemoved = 0;
		window.addEventListener("focus", function(e) { 
			if(blurred.vars("dialog-activated") === true) {
				update(false);
			}
		}, false);
		window.addEventListener("blur", function(e) { 
			if(!blurred._visible) {
				update(true);
				mousemoved = 0;
			}
		}, false);
		window.addEventListener("keyup", function(e) { 
			if(blurred._visible) {
				update(false); 
			}
		}, false);
		window.addEventListener("mouseup", function(e) { 
			if(blurred._visible) {
				update(false); 
			}
		}, false);
		window.addEventListener("mousemove", function(e) { 
			if(mousemoved++ > 2) {
				// it seems Chrome receives 1 mousemove every time the mouse enter a non-focused browser window.
				if(blurred._visible && !document.hidden) {
					update(false); 
				}
			}
		}, false);
		// window.addEventListener("visibilitychange", function(e) {
		// 	// console.log(e.type, e);
		// 	// update(document.hidden);
		// }, false);
		
		update(document.hidden);
	}
};

(function OverridesAndOtherHacks() {
	
	/*- disable Ctrl+Shift+D */
	Method.override(Ace.prototype, "onnodecreated", function() {
	    var r = this.inherited(arguments);
	    this._editor.commands.removeCommand("duplicateSelection");
	    return r;
	});
	/*- $HOME - thingy */
	Method.override(Factory, {
		resolveUri: function(uri) {
			var r = js.inherited(this, arguments);
			var i = uri.indexOf("/vcl-comps/"), l = "/vcl-comps/".length;
				
			if(uri.indexOf("vcl/prototypes/$HOME/") === 0 && i !== -1) { // #
				r = String.format("vcl/prototypes/%s", uri.substring(i + l));
				// console.log("resolveUri", uri, "->", r);
			} else {
				// console.log("!resolveUri", uri, "->", r);
			}
			return r;
		}	
	});
	/*- ws/ - thingy */
	Method.override(FormContainer.prototype, {
		getBaseUri: function() {
			var r = this.inherited(arguments);
			if(r.indexOf("ws/") === 0) {
				r = r.split("/");
				r.shift(); r.shift();
				r.unshift("home");
				r = r.join("/");
			}
			return r;
		}
	});
} ());

$(["App.v1.console"], { 
	title: "Code", 
	icon: "images/favicon.ico", 
	handlers: handlers
}, [
	$i("client", { formUri: "./Main<>" })
]);