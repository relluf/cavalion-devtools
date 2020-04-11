"use on, markdown";

var on = require("on");
var markdown = require("markdown");

function render() {
	var root = markdown.toHTMLTree(this.getValue());
	this.up().vars("root", markdown.toHTMLTree(this.getValue()));//[].concat(root));
    this.up().qsa("#output").forEach(_ => {
    	_.setContent(markdown.renderJsonML(root));
    	_.update(function() {
		    on(this.nodeNeeded().qsa("img"), "load", function(img, r) {
		    	img = this; r = window.devicePixelRatio || 1;
		    	if(img.src.indexOf("?2x") !== -1) {
	    			img.style.width = img.naturalWidth / r + "px";
		    	}
		    });
		    this._node.qsa("img").forEach(function(img) {
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

$([], { handlers: Handlers }, [
    $i("ace", { 
    	align: "left", width: 475, action: "toggle-source",
    	executesAction: "none",
        onChange: function() { 
        	this.setTimeout("render", render.bind(this), 750);
        }
    }),
    $("vcl/Action#toggle-source", {
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
    }),
    $("vcl/ui/Panel", "output", { align: "client", css: {
	    "background-color": "#f0f0f0", 
	    "border-left": "1px solid silver",
	    "border-right": "1px solid silver",
	    "font-family": "times,-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif,'Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol'", 
	    "font-size": "12pt",
	    padding: "10px",
	    "img:not(:hover)": "max-width: 75%;",// max-height: 600px;",
	    // "img:hover": "width:100%;max-width:600px;",
	    "code": "border-radius:3px;font-size: 10pt;background-color:white;padding:2px;line-height:12pt;",
    } })
]);