"use on, markdown, blocks/Factory";

/*-

### 2021/01/04, 05

* Updating syntax
* Adds anchor click-handling (`#CVLN-20210102-2`)
*/

var on = require("on");
var markdown = require("markdown");
var resolveUri = require("blocks/Factory").resolveUri;

function editorNeeded(control, evt) {
	if(evt.metaKey === true) {
		return control.up("devtools/Workspace<>:root").down("#editor-needed");
	}
	return control.udr("#editor-needed");
}
document.addEventListener("click", (evt) => {
	var anchor = evt.target.up("A", true);
	if(anchor) {
		evt.preventDefault();

		var control = require("vcl/Control").findByNode(anchor);
		if(!control) {
			return;
		}

		var href = js.get("attributes.href.value", anchor) || "";
		var fslash = href.indexOf("/"), tools;

		if(href === "") {
			href = anchor.textContent;
		} else if(href === ":") {
			href = "tools://" + anchor.textContent;
		}
		
		if(href.startsWith("https://") || 
			href.startsWith("http://") || 
			href.startsWith("file://") ||
			href.startsWith("ftp://")
		) {
			return window.open(href, "_blank");
		}
		
		if(href.startsWith("tools:")) {
			tools = true;
			href = href.substring("tools:".length);
		} else if(href.indexOf(":") > fslash && fslash > -1) {
			href = href.replace(":", anchor.textContent);
		}
		
		// links are relative to the resource
		var base = control.vars(["resource.uri"]);
		var tab, uri;
		
		if(tools) {
			uri = js.normalize(base, href.charAt(0) === "/" ? href : ("./" + href));
			tab = editorNeeded(control, evt).execute({
				resource: { uri: "Library/cavalion-blocks/tools/" + 
						resolveUri(uri).substring("cavalion-blocks".length) + ".js"},
				selected: true
			});
		} else {
			uri = js.normalize(base, href.charAt(0) === "/" ? href : ("./" + href));
			tab = editorNeeded(control, evt).execute({
				resource:{ 
					uri: uri, 
					type: uri.endsWith("/") ? "Folder" : "File",
					title: href
				},
				selected: true
			});
		}
	}
});

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