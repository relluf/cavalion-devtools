"use on, markdown, blocks/Factory, util/HtmlElement";

/*-

### 2023/09/16

- Introduced an evaluation mechanism with a return value.

### 2023/09/13

- Added the ability to instantiate block components using Markdown anchors, allowing for specific property value transfers.
- Implemented support for embedding block components within a Hover<> instance.
- Enhanced interaction with .md and .smdl files and folders, introducing an Alt+Tap toggle behavior.

### 2023/09/12

- Expanded the features of cavalion-blocks, enabling the instantiation of Hover<> with specific block components using the <<[:]>> syntax.

### 2023/09/11

- Resolved the silent tap issue.
- Introduced a local save feature for the resource currently being edited, specifically for #ace.getValue().

### 2023/09/09

- Prioritized using component names over class names.
- Enabled the use of :: in Markdown-action links.
- Refactored the hotkey functionality for resource-focus within the navigator.
- Updated the primary workspace to display its tab in a unique manner.

### 2023/09/07

- Introduced a silent option for linking evaluable links in Markdown.
- Allowed the use of :: (replacing :) in #action::-links, which will be replaced with anchor content.
- Optimized the default workspaces for BXV.
- Automated the title generation in devtools/Main based on vcl/Application#0.title.
- Refactored title-related classes.

### 2023/09/06

- Modified blocks and cavalion-blocks workspaces to support an alternative workspace UI.
- Fixed a bug preventing certain characters from being filtered.
- Introduced a setting to keep Markdown sources hidden by default.
- Added the devtools/cavalion-devtools.js file.
- Committed the initial version of Main<bxv>.

### 2023/06/07

- No significant changes, only file attributes were modified.

### 2023/03/26

- Resolved issues with linking to ://.
- Fixed the startsWithProtocol function.
- Enhanced the UI with additional padding.

### 2023/01/16

- Updated the width settings for the non-shrink mode in devtools/Editor<md>.

### 2023/11/15

- Fixed a bug causing null, 0, and false to be treated as undefined.

### 2023/10/30

- Improved the detection mechanism for automatically displaying the workspace console.
  
### 2023/10/30

- Reference: #CVLN-20210102-2.

### 2023/09/23

- Added a shortcut, Ctrl+S, for #editor-switch-favorite.

### 2023/07/29

- Updated the CSS styling for inline images.

### 2023/07/28

- Enhanced image styling and classifications within Markdown code.
- Introduced `${p(:)}`, expanding the possibilities with links and backticks in Markdown.
- Made variables constant for better code stability.

### 2023/06/24

- Removed unnecessary log and debug prints.


### 2022/10/29

* Improves console.print-click, while Cmd no console.show
* Betters exception handling
* Adds a shortcut for ${p(:)} ${p(:)} ${p(:)}
	=> [expression](`$!`)

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

const resolveUri_blocks = require("blocks/Factory").resolveUri;
const on = require("on");
const markdown = require("markdown");
const Component = require("vcl/Component");
const HE = require("util/HtmlElement");
const resolveUri_comps = require("vcl/Factory").resolveUri;

// CVLN-20221106-1, CVLN-20220418-1
js.dt = (a) => a === undefined ? new Date() : new Date(a);

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
	
	var root = markdown.toHTMLTree(value, 
			this.vars(["markdown.dialect"]), 
			this.vars(["markdown.options"]));

	var resource = this.vars(["resource"]);

	this.up().vars("root", root);
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
						(a, b, c, d) => this.vars.apply(this, [a, b, c, d].filter(a => a !== undefined)),
						window.locale,
						(a, b, c, d) => this.print.apply(this, [a, b, c, d].filter(a => a !== undefined))];

    				a.title = e_v_a_l1( // probably doesn't work as expected anymore
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
		    		img['@?x'] = parseFloat(imgs.shift().substring(1));
		    		
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
						(i, a, b, c, d) => me.vars.apply(me, [i, a, b, c, d].filter(a => a !== undefined)),
						window.locale,
						(i, a, b, c, d) => me.print.apply(me, [i, a, b, c, d].filter(a => a !== undefined))];

		    		imgs = img.title.split('`');
		    		img.title = imgs.pop();
		    		imgs = e_v_a_l1(imgs[1]).i.apply(me, backtick_params).split(";");
		    		
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
	        // #VA-20221029-1
	        if(href === "!") {
	        	href = "${p(:)}";
	        }
        }

		var show_console = href.match(/\$\{p\(.*\)\}$/);
		var silent = href.match(/!!\$\{/);
		if(silent) { // adds option to evaluate href-expression silently (ie. not open resource, nor the console) - href must begin with !!${
			href = href.substring(2);
		}
        if(href === "[]") {
        	href = "[:]";
        }
        
        if(href === "[.]") {
        	href = "blocks:./:";
        } else if(href === "[!]") {
        	href = "blocks:!:";
        } else if(href.startsWith("[") && href.endsWith("]")) {
        	href = "blocks:" + href.substring(1, href.length - 1);
        } else if(href.startsWith("<<[") && href.endsWith("]>>")) {
        	href = "blocks:*" + href.substring(3, href.length - 3);
        } else if(href.startsWith("<[") && href.endsWith("]>")) {
        	href = "blocks:*" + href.substring(2, href.length - 2);
        } else if(href.startsWith("<[") && href.endsWith("]>>")) { // crazy rendering bugs)
        	href = "blocks:*" + href.substring(2, href.length - 3);
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
        
        if(href === "{}") href = "{:}"
        
        if(href.startsWith(":") && !href.startsWith("://")) {
        	href = anchor.textContent + href.substring(1);
        } else if(href.startsWith("blocks:")) {
			href = href.substring("blocks:".length);
			blocks = true;
        } else if(href.startsWith("comps:")) {
			href = href.substring("comps:".length);
			comps = true;
		}
		
		var swp = startsWithProtocol(href);//.match("^[/]*[^:]*://");
		if(!swp || href.split(":").length > 2) {
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
		
		if(href === "" || href === "*") { // <<[]>> becomes *
			href = href + anchor.textContent;
		}

		/*- 20241025 obsolete - implemented by Resource.resolve(uri)
			if(href.startsWith("://")) { // TODO anticipate ! and *
				var pre = blocks ? "/cavalion-blocks" : comps ? "/vcl-comps" : "";
				href = js.sf("pouchdb://%s%s/%s", getDB_name(control), pre, href.substring(3) || anchor.textContent);
			} 
		*/
		
		var backtick_params = [
			control.app(), 
			control.up("devtools/Workspace<>:root"), 
			control.up("devtools/Editor<>:root"),
			(a, b, c, d) => control.vars.apply(control, [a, b, c, d].filter(a => a !== undefined)),
			window.locale,
			(a, b, c, d) => control.print.apply(control, [a, b, c, d].filter(a => a !== undefined))];

		if(backticks) {
			href = e_v_a_l1(href).f.apply(control, backtick_params);
			blocks_vars = e_v_a_l1(blocks_vars).f.apply(control, backtick_params);
			comps_vars = e_v_a_l1(comps_vars).f.apply(control, backtick_params);
		}
		
		if(silent) {
			return;
		}

		if(show_console) {
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
        	// TODO allow pre/suffix? maybe checking for "if(href.startWith("#"))" is better and then just substitute the last :, the first being a seperator
        	var hs = href.split(":"), action = control.udr(hs[0]);
        	hs.pop(); hs.pop(); hs.shift();
        	if(action instanceof require("vcl/Action")) {
        		return action.execute(js.normalize(base, hs.join(":").replace(/::/g, anchor.textContent) || anchor.textContent), evt);
        	}
        	alert(js.sf("%s not found", href.split(":")[0]));
        	throw new Error(js.sf("%s not found", href.split(":")[0]));
        }

		var run, ins, title = anchor.title.trim(), sourceUri, props;
		if(title.startsWith('${') && title.endsWith('}')) {
			// title = title.substring(2, title.length - 1);
			props = e_v_a_l(title).f.apply(control, backtick_params);
		}
		
		if(blocks) {
			if(ins = href.charAt(0) === "*") href = href.substring(1);
			if(run = href.charAt(0) === "!") href = href.substring(1);
			
			if(href.startsWith("./")) {
				uri = js.normalize(base, href);
			} else if(href.startsWith("/")) {
				uri = href.substring(1);
			} else if(!swp) { // does not start with protocol
				uri = "Library/cavalion-blocks/" + href;
			} else {
				uri = href;
			}
				
			sourceUri = resolveUri_blocks(uri).substring("cavalion-blocks/".length) + ".js";
			
			if(ins && evt.altKey === false) {
				if(!run) {
					props = props || {};
					props.vars = js.mi({ 'storage-uri': uri }, props.vars || {});
					control.print(B.i(["Hover<>:root", uri, props, [["$HOME/" + uri]]], { 
						owner: control
					}));
				} else {
					control.print(B.i(["$HOME/" + uri, props]));
				}
			} else {
				tab = editorNeeded(control, evt).execute({
					formUri: "devtools/Editor<blocks>",
					formParams: { run: run },
					formVars: blocks_vars,
					resource: { uri: sourceUri },
					selected: true
				});
			}
			
		} else if(comps) {
			run = href.charAt(0) === "!";
			if(run) href = href.substring(1);
			if(href.startsWith("./")) {
				uri = js.normalize(base, href);
			} else if(href.startsWith("/")) {
				uri = href.substring(1);
			} else if(!swp) { // does not start with protocol
				uri = "Library/vcl-comps/" + href;
			} else {
				uri = href;
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
			swp = startsWithProtocol(href);//.match("^[/]*[^:]*://");
			
			if(!swp) {
				var _ = window.require.s.contexts._;
		        if(href.startsWith("{") && href.endsWith("}")) {
		        	uri = _.nameToUrl(href.substring(1, href.length - 1));
		        	uri = uri.replace(/^\.\/lib/, "/Library/");
		        } else {
					uri = js.normalize(base, href.charAt(0) === "/" ? href.substring(1) : ("./" + href));
		        }
			} else {
				uri = href;
			}
			
			if(evt.altKey === true) {
				if(uri.endsWith("/")) {
					uri += ".md";
				} else if(uri.endsWith("/.md")) {
					// uri already ends in ".md", cut it off
					uri = uri.replace(/\.md$/, "");
				} else if(!uri.endsWith(".smdl")) {
					uri += ".smdl"
				} else {
					// uri ends in ".smdl", cut it off
					uri = uri.replace(/\.smdl$/, "");
				}
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
	// #VA-20221029-1 TODO EXPLAIN this one
	var E, s = js.sf("try { return `${r = %s`, r; } catch(e) { alert(e.message); throw p(e); } ", s.substring(2));
	return window[(E = "e") + 'val'](js.sf("({" + 
		"f: (app, ws, ed, v, l, p, r) => { %s }, " + 
		"i: (img, app, ws, ed, v, l, p, r) => { %s } " + 
	"})", s, s));
};
const e_v_a_l1 = (s, E) => {
	// #VA-20221029-1 TODO EXPLAIN this one
	s = js.sf("try { return `%s`; } catch(e) { alert(e.message); throw p(e); } ", s);
	return window[(E = "e") + 'val'](js.sf("({" + 
		"f: (app, ws, ed, v, l, p, r) => { %s }, " + 
		"i: (img, app, ws, ed, v, l, p, r) => { %s } " + 
	"})", s, s));
};
const startsWithProtocol = (url) => url.match(/^[^\s]*:\/\//) !== null;
const getDB_name = (control) => {
	var ws = control.up("devtools/Workspace<>:root");
	if(ws) {
		var CS = ws.qs("#Component_storage");
		if(CS) {
			var uri = CS.vars("resource.uri");
			if(uri.startsWith("pouchdb://")) {
				return uri.split("/")[2];
			}
		}
	}
	
	return Component.storageDB.name;
}

const Handlers = {
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
const Css = {
	'a > img': "border: 2px solid rgb(56, 121, 217);"
};

["", { css: Css, handlers: Handlers }, [
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
        	var md_sourceInitiallyHidden = this.vars(["markdown-source-intially-hidden"]) === true;
        	if(!resource.name) resource.name = resource.uri.split("/").pop();
    		this.up().readStorage("source-visible", (visible) => {
    			if(typeof visible === "boolean") {
    				this.setState(visible);
    				update_shrink(this, visible);
    				// this.ud("#output").syncClass("shrink", visible);
    			} else if(visible === undefined && (md_sourceInitiallyHidden || (
    					resource.uri.split("/").pop() === ".md" ||
    					isUpperCase(resource.name.split(".md")[0])
    				))
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
			':not(.shrink)': "width:795px;",
		    "background-color": "rgba(240,240,240,1)", 
		    "border-left": "1px solid silver",
		    "border-right": "1px solid silver",
		    "font-family": "times,-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif,'Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol'", 
		    "font-size": "12pt",
		    'img': {
		    	'': "width:75%; transition: width 1s ease 0s, box-shadow 1s ease 0s;",
		    	':not(.inline)': "display:block; margin:auto;",
		    	'&:hover': "width: 100%; box-shadow: rgb(0 0 0 / 40%) 0px 1px 2px 0px;",// max-height: 600px;",
		    },
		    padding: "10px 50px",
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