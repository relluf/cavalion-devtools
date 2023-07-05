"vcl/ui/Ace, js/Method, vcl/Factory, vcl/ui/FormContainer, blocks/Blocks";

/*- 2021-08-21 Instantiating via cavalion-blocks */

var Ace = require("vcl/ui/Ace");
var Method = require("js/Method");
var Factory = require("vcl/Factory");
var FormContainer = require("vcl/ui/FormContainer");
var Panel = require("vcl/ui/Panel");
var Blocks = require("blocks/Blocks");

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

[["App"], { 
	title: "Code", 
	icon: "images/favicon.ico", 
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
	onLoad() {
		this.inherited(arguments);
		this.setTimeout(() => { this.print(this._uri, this); }, 250);
	},
}, [
	["vcl/Action", {
		hotkey: "MetaCtrl+F1",
		on() {
			var ws = this.vars("ws");
			if(!ws) {
				ws = this.vars("ws", app.qs("devtools/Workspace<>:root:selected"));
			} else {
				this.vars("ws", null);
			}
			ws.up("vcl/ui/Tab").toggle("selected");
		}
	}],
	
	
	["#client", { formUri: "devtools/Main<>" }]
]];