"use on, markdown";

/*-

### 2021/01/04

* Updating syntax
* Adds anchor click-handling (`#CVLN-20210102-2`)
*/
// document.addEventListener("click", (evt) => {
// 	var anchor = evt.target.up("A", true);
// 	if(anchor) {
// 		var href = anchor.href || "";
// 		if(href.startsWith("code:")) {
// 			var control = require("vcl/Control").findByNode(anchor);
// 			var base = control.vars(["resource.uri"]);
// 			var uri = js.normalize(base, href.substring(href.indexOf("//") + 2));
// 			var tab = control.udr("#editor-needed").execute({
// 				resource:{ 
// 					uri: uri, 
// 					type: uri.endsWith("/") ? "Folder" : "File",
// 					title: href.substring(href.indexOf("//") + 2)
// 				},
// 				selected: true
// 			});
			
// 			// this.print("prevent click", {anchor: anchor, tab: tab});
// 			evt.preventDefault();
// 		}
// 	}
// });

var on = require("on");
var markdown = require("markdown");

function render() {
	var value = this.getValue();
	
// #CVLN-20200906-3
	var impl;
	if((impl = this.vars("onGetRenderValue"))) {
		value = impl(value);
	}
	if((impl = this.vars("onRender"))) {
		return impl(value);
	}
	
	var root = markdown.toHTMLTree(value);
	var resource = this.vars(["resource"]);
	this.up().vars("root", markdown.toHTMLTree(value));//[].concat(root));
    this.up().qsa("#output").forEach(_ => {
    	_.setContent(markdown.renderJsonML(root));
    	_.update(function() {
    		var node = this.nodeNeeded();
    		
		    node.qsa("img").forEach(img => {
		    	var src = js.get("attributes.src.value", img) || "";
		    	if(src.indexOf(":") === -1) {
		    		img.src = "/home/" + js.up(resource.uri) + "/" + src;
		    	}
		    });

		    on(node.qsa("img"), "load", function(img, r) {
		    	img = this; r = window.devicePixelRatio || 1;
		    	if(img.src.indexOf("?2x") !== -1) {
	    			img.style.width = img.naturalWidth / r + "px";
		    	}
		    });
		    
		    node.qsa("img").forEach(function(img) {
		    	var r = window.devicePixelRatio > 1 ? 2 : 2;
		    	if(img.naturalWidth && img.src.indexOf("?2x") !== -1) {
			    	// console.log(">>>", img.naturalWidth, img);
		    		img.style.width = img.naturalWidth / r + "px";
		    	}
		    });
    	}.bind(_));
    });
}        	

var Handlers = {
	"#output onDblClick": function(evt) {
    	if(evt.metaKey === true) {
		    this._node.qsa("img").forEach(function(img) {
		    	var r = window.devicePixelRatio > 1 ? 2 : 2;
		    	if(img.naturalWidth && img.src.indexOf("?2x") !== -1) {
		    		// console.log(">>>", img.naturalWidth, img);
		    		img.style.width = img.naturalWidth / r + "px";
		    	}
		    });
    	}
	}
};

["", { handlers: Handlers }, [
    [("#evaluate"), {
    	onLoad() {
    		this.vars("eval", () => this.vars(["root"]));
    		return this.inherited(arguments);
    	}
    }],
    [("#ace"), { 
    	align: "left", width: 475, action: "toggle-source",
    	executesAction: "none",
        onChange() { 
        	this.setTimeout("render", render.bind(this), 750);
        }
    }],
    
    ["vcl/Action", ("toggle-source"), {
        hotkey: "Shift+MetaCtrl+S",
        selected: "state", visible: "state", 
        state: true,
        onLoad() {
    		this.up().readStorage("source-visible", (visible) => {
    			if(typeof visible === "boolean") {
    				this.setState(visible);
    			} else if(visible === undefined && this.vars(["resource.uri"]).split("/").pop() === ".md") {
    				this.setState(false);
    			}
    		});
        },
        onExecute() {
        	this.setState(!this.getState());
        	this.up().writeStorage("source-visible", this.getState());
        }
    }],
    ["vcl/ui/Panel", ("output"), { 
    	align: "client", 
    	css: {
/*- TODO should be centralized */    		
		    "background-color": "#f0f0f0", 
		    "border-left": "1px solid silver",
		    "border-right": "1px solid silver",
		    "font-family": "times,-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif,'Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol'", 
		    "font-size": "12pt",
		    padding: "10px",
		    "img:not(:hover)": "max-width: 75%;",// max-height: 600px;",
		    "a": "text-decoration:underline;color:blue;",
		    // "img:hover": "width:100%;max-width:600px;",
		    "code": "border-radius:3px;font-size: 10pt;background-color:white;padding:2px;line-height:12pt;",
	    } 
    }]
]];