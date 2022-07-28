"use on, markdown, blocks/Factory, util/HtmlElement";

/*-

### 2022/07/26

* Documenting backticks behaviour, for images and for links
* Enhancing backticks behaviour for links so that "stuff and printed in console"

### 2022/04/24

* Linking vcl-comps: [](())
* Linking cavalion-blocks: []([])
* Running cavalion-blocks: []([!]{vars})
* Use backticks for context-sensitivity: []([])

### 2022/02/28

* Finetuning "restore-scroll"-feature

### 2021/01/06

* Adding support for opening Tools (Library/cavalion-blocks/tools/...)
	* [devtools/Alphaview](tools://)
	* [devtools/Alphaview](://)
	* [devtools/Alphaview](:)
	* [devtools/Alphaview](:./:)

### 2021/01/04

* Updating syntax
* Adding support for clicking anchors (`#CVLN-20210102-2`)
*/

const on = require("on");
const markdown = require("markdown");
const Component = require("vcl/Component");
const HE = require("util/HtmlElement");
const resolveUri_comps = require("vcl/Factory").resolveUri;
const resolveUri_blocks = require("blocks/Factory").resolveUri;

function render() {
	var value = this.getValue();
	
// #CVLN-20200906-3
	var impl;
	if((impl = this.vars(["onGetRenderValue"]))) {
		value = impl(value, this);
	}
	if((impl = this.vars(["onRender"]))) {
		return impl(value, this);
	}
	
	var root = markdown.toHTMLTree(value);
	var resource = this.vars(["resource"]);
	this.up().vars("root", markdown.toHTMLTree(value));//[].concat(root));
    this.up().qsa("#output").forEach(_ => {
    	_.setContent(markdown.renderJsonML(root));
    	_.update(function() {
    		var node = this.nodeNeeded(), me = this;
    		
    		node.qsa("a").forEach(a => {
    			if(a.title && a.title.startsWith("`") && a.title.endsWith("`")) {
					var params = [
						this.app(), 
						this.up("devtools/Workspace<>:root"), 
						this.up("devtools/Editor<>:root"),
						(a, b, c, d) => this.vars.apply(this, [a, b, c, d].filter(a => a)),
						window.locale,
						(a, b, c, d) => this.print.apply(this, [a, b, c, d].filter(a => a))];

    				a.title = e_v_a_l(
    					a.title.substring(1, a.title.length - 1))
    						.f.apply(this, params);
    			}
    		});
    		
		    node.qsa("img").forEach(img => {
		    	var src = js.get("attributes.src.value", img) || "";
		    	if(src.indexOf(":") === -1) { // relative image src
		    		img.src = "/home/" + js.up(resource.uri) + "/" + src;
		    	}
		    });

		    on(node.qsa("img"), "load", function(img, r) {
		    	img = this; r = window.devicePixelRatio || 1;
	    		if(img.style.maxWidth === "") {
	    			r = img['@?x'] || r;
    				img.style.maxWidth = js.sf("%dpx", (img.naturalWidth / r));
	    		}
		    });
		    
		    node.qsa("img").forEach(function(img) {
		    	var r = window.devicePixelRatio > 1 ? 2 : 2, title, imgs;
		    	if(img.naturalWidth && img.src.indexOf("?2x") !== -1) {
		    		img.style.widthWhenHovered = img.naturalWidth / r + "px";
		    	}
		    	if(img.title.match(/^@([0-9]*[.])?[0-9]+/)) {
		    		imgs = img.title.split(' ');
		    		img['@?x'] = parseFloat(imgs.shift().substring(1))
		    		
		    		while(imgs.length && !imgs[0].startsWith('`')) {
		    			HE.addClass(img, imgs.shift());
		    		}
		    		
		    		img.title = imgs.join(' ');
		    	}
		    	
		    	if(img.title.startsWith('`') && img.title.endsWith('`')) {
					var backtick_params = [
						img,
						me.app(), 
						me.up("devtools/Workspace<>:root"), 
						me.up("devtools/Editor<>:root"),
						(i, a, b, c, d) => me.vars.apply(me, [i, a, b, c, d].filter(a => a)),
						window.locale,
						(i, a, b, c, d) => me.print.apply(me, [i, a, b, c, d].filter(a => a))];

		    		imgs = img.title.split('`');
		    		img.title = imgs.pop();
		    		imgs = e_v_a_l(imgs[1]).i.apply(me, backtick_params).split(";");
		    		
		    		if(imgs.length === 1) { // only classes
		    			HE.addClasses(imgs.pop());
		    		}

		    		if(imgs.length) { // mixin on img.style
    					js.mixIn(img.style, js.str2obj(imgs.join(";")));
		    		}
		    	}
		    });
		    
			var insertA = (H) => {
				var a = document.createElement("A");
				a.id = H.textContent.toLowerCase().split(" ").join("-");
				a.href = "#" + H.textContent.toLowerCase().split(" ").join("-");
				H.appendChild(a);
				return a.href;
			};
			
			"h1,h2,h3,h4,h5".split(",").forEach(H => node.qsa(H).map(insertA));
		    
    	}.bind(_));
    });
}
document.addEventListener("click", (evt) => {
// #CVLN-20210102-2
	var anchor = evt.target.up("A", true);
	if(anchor) {

		var control = require("vcl/Control").findByNode(anchor);
		if(!control || !(control.up("devtools/Editor<md>") || control._owner)) {
			return;
		}

		var href = js.get("attributes.href.value", anchor) || "";
        var blocks, blocks_vars, comps, comps_vars;
        var backticks = false;

        if(href.startsWith("javascript:")) {
        	return;
        }
        
        if(href.startsWith("`") && href.endsWith("`")) {
        	backticks = true;
        	href = href.substring(1, href.length - 1);
        }
        
		var print_console = href === ("${p(:)}");
        if(href === "[]") {
        	href = "[:]";
        }
        
        if(href === "[.]") {
        	href = "blocks:./:";
        } else if(href === "[!]") {
        	href = "blocks:!:";
        } else if(href.startsWith("[") && href.endsWith("]")) {
        	href = "blocks:" + href.substring(1, href.length - 1);
        } else if((blocks = href.match(/(\[[^\]]*\])({.*})/))) {
        	href = "blocks:" + blocks[1].substring(1).split("]")[0];
        	blocks_vars = blocks[2];
        }

        if(href === "()") {
        	href = "(:)";
        }
        
        if(href === "(.)") {
        	href = "comps:./:";
        } else if(href === "(!)") {
        	href = "comps:!:";
        } else if(href.startsWith("(") && href.endsWith(")")) {
        	href = "comps:" + href.substring(1, href.length - 1);
        } else if((comps = href.match(/(\([^\)]*\))({.*})/))) {
        	href = "comps:" + comps[1].substring(1).split(")")[0];
        	comps_vars = comps[2];
        }

        if(href.startsWith(":") && !href.startsWith("://")) {
        	href = anchor.textContent + href.substring(1);
        } else if(href.startsWith("blocks:")) {
			href = href.substring("blocks:".length);
			blocks = true;
        } else if(href.startsWith("comps:")) {
			href = href.substring("comps:".length);
			comps = true;
		}
		

		var startsWithProtocol = href.match("^[/]*[^:]*://");
		if(!startsWithProtocol || href.split(":").length > 2) {
			if(href.charAt(0) === "#") {
				if(!href.endsWith(":")) {
					return;
				}
			} else {
				// replace last : occurence with anchor.textContent
				href = href.replace(/:([^:]*)$/, anchor.textContent + "$1");
			}
		}
			
		evt.preventDefault();
		
		if(href === "") {
			href = anchor.textContent;
		} else if(href === ":") {
			// alert("HUU?")
			blocks = true;
			href = anchor.textContent;
		}

		if(href.startsWith("://")) {
			href = js.sf("pouchdb://%s/%s", Component.storageDB.name, href.substring(3) || anchor.textContent);
		}
		
		var backtick_params = [
			control.app(), 
			control.up("devtools/Workspace<>:root"), 
			control.up("devtools/Editor<>:root"),
			(a, b, c, d) => control.vars.apply(control, [a, b, c, d].filter(a => a)),
			window.locale,
			(a, b, c, d) => control.print.apply(control, [a, b, c, d].filter(a => a))];

		if(backticks) {
			href = e_v_a_l(href).f.apply(control, backtick_params);
			blocks_vars = e_v_a_l(blocks_vars).f.apply(control, backtick_params);
			comps_vars = e_v_a_l(comps_vars).f.apply(control, backtick_params);
		}

		if(print_console) {
			if(!evt.metaKey) {
				control	.up("devtools/Workspace<>:root")
						.qs("#left-sidebar-tabs > vcl/ui/Tab[control=console]")
						.selectVisible();
			}
			return; // bail-out (#CVLN-20210102-2)
		}

		// so the rules apply these anchors as well
		if(href.startsWith("https://") || 
			href.startsWith("http://") || 
			href.startsWith("file://") ||
			href.startsWith("ftp://")
		) {
			return window.open(href, "_blank");
		}
		
		// links are relative to the resource
		var base = control.vars(["resource.uri"]);
		var tab, uri;

        if(href.endsWith("::")) {
        	// TODO allow pre/suffix?
        	var hs = href.split(":"), action = control.udr(hs[0]);
        	if(action instanceof require("vcl/Action")) {
        		return action.execute(js.normalize(base, hs[1] || anchor.textContent), evt);
        	}
        	alert(js.sf("%s not found", href.split(":")[0]));
        	throw new Error(js.sf("%s not found", href.split(":")[0]));
        }

		var run, title = anchor.title;
		if(title.startsWith('`') && title.endsWith('`')) {
			title = title.substring(1, title.length - 1);
			title = e_v_a_l(title).f.apply(control, backtick_params);
		}
		
		if(blocks) {
			run = href.charAt(0) === "!";
			if(run) href = href.substring(1);
			if(href.startsWith("./")) {
				uri = js.normalize(base, href);
			} else if(href.startsWith("/")) {
				uri = href.substring(1);
			} else {
				uri = "Library/cavalion-blocks/" + href;
			}
			
			tab = editorNeeded(control, evt).execute({
				formUri: "devtools/Editor<blocks>",
				formParams: { run: run },
				formVars: blocks_vars,
				resource: { uri: resolveUri_blocks(uri).substring("cavalion-blocks/".length) + ".js" },
				selected: true
			});
		} else if(comps) {
			run = href.charAt(0) === "!";
			if(run) href = href.substring(1);
			if(href.startsWith("./")) {
				uri = js.normalize(base, href);
			} else if(href.startsWith("/")) {
				uri = href.substring(1);
			} else {
				uri = "Library/vcl-comps/" + href;
			}
			
			tab = editorNeeded(control, evt).execute({
				formUri: "devtools/Editor<blocks>",
				formParams: { run: run },
				formVars: blocks_vars,
				resource: { 
					uri: resolveUri_comps(uri).substring("vcl-comps/".length) + ".js",
					title: title === "" ? "" : title || anchor.textContent//href.substring(href.charAt(0) === "/" ? 1 : 0)
				},
				selected: true
			});
		} else {
			startsWithProtocol = href.match("^[/]*[^:]*://");
			if(!startsWithProtocol) {
				uri = js.normalize(base, href.charAt(0) === "/" ? href.substring(1) : ("./" + href));
			} else {
				uri = href;
			}
			tab = editorNeeded(control, evt).execute({
				resource:{ 
					uri: uri.endsWith("/") ? uri.substring(0, uri.length - 1) : uri,
					type: uri.endsWith("/") ? "Folder" : "File",
					title: title === "" ? "" : title || anchor.textContent//href.substring(href.charAt(0) === "/" ? 1 : 0)
				},
				bringToFront: evt.shiftKey === true,
				selected: true
			});
		}

	}
});

const editorNeeded = (control, evt) => {
	if(evt.metaKey === true) {
		return control.up("devtools/Workspace<>:root").down("#editor-needed");
	}
	return control.udr("#editor-needed");
}
const update_shrink = (me, value) => me.ud("#output").syncClass("shrink", value);
const isUpperCase = (s) => s.toUpperCase() === s;
const e_v_a_l = (s) => {
	var E;
	return window[(E = "e") + 'val'](js.sf("({" + 
		"f:function (app, ws, ed, v, l, p) { return `%s`; }, " + 
		"i:function (img, app, ws, ed, v, l, p) { return `%s`; } " + 
	"})", s, s));
};

var Handlers = {
    onResize() {
    	var cs = this.getComputedStyle();
		this.ud("#output").syncClass("shrink", parseInt(cs.width, 10) < 900);
    },
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
    	align: "left", width: 600, action: "toggle-source",
    	executesAction: "none",
        onChange() { 
        	if(!this._vars) {
        		render.apply(this, []);
        		this.vars();
        	} else {
        		this.setTimeout("render", render.bind(this), 750);
        	}
        }
    }],
    
    ["vcl/Action", ("toggle-source"), {
        hotkey: "Shift+MetaCtrl+S",
        selected: "state", visible: "state", 
        state: true,
        onLoad() {
        	var resource = this.vars(["resource"]);
        	if(!resource.name) resource.name = resource.uri.split("/").pop();
    		this.up().readStorage("source-visible", (visible) => {
    			if(typeof visible === "boolean") {
    				this.setState(visible);
    				update_shrink(this, visible);
    				// this.ud("#output").syncClass("shrink", visible);
    			} else if(visible === undefined && (
    					resource.uri.split("/").pop() === ".md" ||
    					isUpperCase(resource.name.split(".md")[0])
    				)
    			) {
    				this.setState(false);
    				update_shrink(this, false);
    				// this.ud("#output").syncClass("shrink", false);
    			}
    		});
        },
        onExecute() {
        	var state = !this.getState();
        	this.setState(state);
        	if(state === true) {
        		var ace = this.ud("#ace");
        		ace.setFocus();
        		// this.nextTick(() => ace.focus());
        		// this.ud("#output").toggleClass("shrink");
        	}
			update_shrink(this, state);
        	this.up().writeStorage("source-visible", this.getState());
        	
        }
    }],
    ["vcl/ui/Panel", ("output"), { 
    	align: "client", 
    	css: {
/*- TODO should be centralized */
			"": "margin-left:auto;margin-right:auto;",
			':not(.shrink)': "width:900px;",
		    "background-color": "rgba(240,240,240,1)", 
		    "border-left": "1px solid silver",
		    "border-right": "1px solid silver",
		    "font-family": "times,-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif,'Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol'", 
		    "font-size": "12pt",
		    'img': {
		    	'': "width:75%; transition: width 1s ease 0s, box-shadow 1s ease 0s;",
		    	':not(.inline)': "display:block;margin:auto;",
		    	'&:hover': "width: 100%; box-shadow: rgb(0 0 0 / 40%) 0px 1px 2px 0px;",// max-height: 600px;",
		    },
		    padding: "10px",
		    "a": "text-decoration:underline;color:blue;",
		    // "img:hover": "width:100%;max-width:600px;",
		    "code": "border-radius:3px;font-size: 10pt;background-color:white;padding:2px;line-height:12pt;",
	    },
	    classes: "shrink",
	    
	    onMouseMove(evt) {
	    	
	    	if(evt.shiftKey === false) return;
	    	
	    	var current = evt.target;
	    	if(current.nodeName !== "IMG") {
	    		current = undefined;
	    	}
	    	
	    	var last = this.vars("last");
    		if(last !== current) {
    			if(last) {
    				last.style.width = "";
    			}
    			last = current;
    			if(last) {
    				last.style.width = last.style.widthWhenHovered;
    			}
    		}
    		
    		last && this.vars("last", last);
	    },
	    onMouseLeave(evt) {
	    	var last = this.removeVar("last");
			if(last) {
				last.style.width = "";
			}
	    }
    }]
]];