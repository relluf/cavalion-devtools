"clipboard-copy, js/Method, vcl/ui/Ace, vcl/ui/Tab, vcl/ui/Panel, vcl/ui/Bar, vcl/ui/FormContainer, util/HotkeyManager, util/net/Url";

var hotkeys = {
	"Ctrl+Alt+F1": "editor-move-to-front",
	"Ctrl+N": "editor-new", 
	"Alt+Ctrl+N": "editor-new",
	
	"Shift+Ctrl+40": "editors-next",
	"Shift+Ctrl+38": "editors-previous",
	"Shift+Ctrl+39": "editor-next", 
	"Shift+Ctrl+37": "editor-previous", 
	"Shift+Alt+C": "editor-toggle-align",
	
	"Shift+Ctrl+186": "editors-next",
	"Shift+Ctrl+189": "editors-previous",
	"Shift+Ctrl+222": "editors-next",
	"Shift+Ctrl+221": "editor-next", 
	"Shift+Ctrl+219": "editor-previous", 
	
	"Ctrl+Tab": "editor-next", 
	"Shift+Ctrl+Tab": "editor-previous", 
	
	"Shift+Ctrl+Meta+219": "editor-move-left",
	"Shift+Ctrl+Meta+221": "editor-move-right",
	"Shift+Ctrl+Meta+P": "editor-move-all-left",
	"Shift+Ctrl+Meta+\\": "editor-move-all-right",

	"Shift+Ctrl+P": "editor-open-parent-md",
	"Shift+Ctrl+O": "editor-open-parent",

	"Shift+Ctrl+S": "editor-switch-favorite",
	"Ctrl+S": "editor-switch-favorite",
	"Alt+Shift+Ctrl+S": "editor-switch-favorite",

	"Ctrl+W": "editor-close",
	"Shift+Ctrl+W": "editors-close-all", //less-one ;-)
	"Alt+Shift+Ctrl+W": "editors-close-all", //less-one ;-)
	
	// "MetaCtrl+48": "editor-focus-in-navigator",
	"Escape": "editor-setfocus"
};

var Ace = require("vcl/ui/Ace");
var Tab = require("vcl/ui/Tab");
var Control = require("vcl/Control");
var Method = require("js/Method");
var HotkeyManager = require("util/HotkeyManager");
var Url = require("util/net/Url");
var FormContainer = require("vcl/ui/FormContainer");

/*-
	#workspace-needed
*/

const default_colors = ["rgb(56, 121, 217)", "white"];

// FIXME move to a better place
function title() {
	var url = app.vars("url");
	return js.sf("%s", url.getParamValue("title") || app.getTitle(), url.getParamValue("") || url.getPath().split("/")[0] || "cavalion-code");
}
function title_css() {
	var url = app.vars("url");
	var colors = url.getParamValue("colors") || url.getParamValue("title-colors") || url.getParamValue("title");

	if(colors && colors.includes("|")) {
		colors = (colors && colors.split("|")) || default_colors;
	} else {
		colors = default_colors;
	}

	return { 
		"": "text-align:center;float:right;min-width:200px;line-height:26px;", 
		"&:not(.custom-colors)": js.sf("background-color:%s;color:%s;", colors[0], colors[1]),
		"&.arcadis": "background-color:orange;color:black;",
		"&.kzmrqz": "background-color:gold;color:#996300;",
		"&.cavalion": "background-color:rgb(48,61,80);color:white;",
		"&.terrannia": "background-color:pink;color:purple;",
		"&.homemade": "background-color:purple;color:white;",
		"&.veldoffice": "background-color:limegreen;color:darkgreen;",
		"&.veldapps": "background-color:lightgreen;color:darkgreen;",
		"&.veldapps-alt": "background-color:limegreen;color:darkgreen;",
		"&.eae": "background-color:rgb(14,32,77);color:white;",
		"&.smdl": "background-color:gold;color:maroon;",
		"&.gx": "background-color:navy; color:white;",
		"&.pdc": "background-color:#261f10;color:white;",
		"&.ozn": "background-color:red;color:white;"
	};
}
function title_classes() {
	var url = app.vars("url");
	var colors = url.getParamValue("colors") || url.getParamValue("title-colors") || url.getParamValue("title") || url.getParamValue("");

	if(colors && !colors.includes("|")) return colors.toLowerCase();
}
function replaceChars(uri) {
	return uri.replace(/\//g, ".");
	// return uri.replace(/\-/g, ".").replace(/\//g, ".");
    // return uri.replace(/[ \\\/\<\>\$\#\@\!\%\^\&\*\(\)\-\=\+\{\}\[\]\:\"\'\;\,\.]/g, "_");
    // return uri.replace(/[ \\\/\<\>\$\#\@\!\%\^\&\*\(\)\-\=\+\{\}\[\]\:\"\'\;\,]/g, "_");
}
function forceUpdate(control) {
	/*- FIXME Find a better solution to force a Tab to update while invisible */
	var ControlUpdater = require("vcl/ControlUpdater");
	(function loop(c) {
		ControlUpdater.queue(c);
		c._controls && c._controls.forEach(loop);
	}(control));
}
function focusSidebar(ws, sidebar) {
	var tab = ws.qs("#left-sidebar < vcl/ui/Tab:selected");
	sidebar.vars("hadFocus", Control.focused);
	if(tab && tab._control) {
		var input = tab._control.qs("< vcl/ui/Input");
		if(input) {
    		if(!input.isFocused()) {
    			// console.log("focus sidebar");
    			input.setFocus();
    		} else {
    			// console.log("focus editor");
    			ws.down('*:selected #editor-setfocus').execute({}, ws);
    		}
		} else {
			var console = tab._control.qs("< vcl/ui/Console");
			if(console) console.setFocus();
		}
	}
}
 
const fixThemeColor = () => setTimeout(() => {
	// Create the meta element
	var meta = Array.from(top.document.querySelectorAll("meta"))
		.filter(meta => meta.name === "theme-color")[0];
		
	if(!meta) {
		meta = top.document.createElement("meta");		
	}
	
	// Set the attributes
	meta.setAttribute("name", "theme-color");
	meta.setAttribute("content", "#f0f0f0");
	
	if(!meta.parentElement) {
		// Append the meta element to the head
		top.document.head.appendChild(meta);
	}
	top.document.body.style.overflow = "hidden";
	window.document.body.focus();
	
	console.log("fixedThemeColor and such");
}, 0);

var tabs_hidden = "height:0;padding:0;border:0;opacity:0;";
var nameOf = (c) => c._name ? js.sf("#%d [%s]", c.hashCode(), c._name) : "#" + c.hashCode();

(function (styles) {
	/* make sure styles.less overrides libs */
	var node = styles[0];
	var parent = node.parentNode;
	parent.removeChild(node);
	parent.appendChild(node);
}(Array.from(document.querySelectorAll("style"))));

[["ui/Form"], { 
	css: {
	    ".tabs-hidden_": tabs_hidden,
	    
	    // "background-color": "rgba(255,255,255,0.975)",
	    
	    "&.workspace-tabs-hidden": {
	    	"#editors-tabs": tabs_hidden,
	    	"#bottom-tabs": tabs_hidden,
		    // "#left-sidebar-tabs": tabs_hidden
	    },
	    
	    "#left-sidebar-tabs": {
	    	// "": "background-color:white;",
	    	".{Tab}": "border-top-left-radius:5px; border-top-right-radius:5px;",
	    	".{Tab}.selected": "padding-left:8px;"
	    },
	    "#editors-tabs": {
	    	"": "padding-left:12px;",
	    	".{Tab}": "border-top-left-radius:5px; border-top-right-radius:5px;",
	    	".{Tab}.selected": "padding-left:8px;"
	    },
	    "#workspaces-tabs": {
	    	"": "background-color:#f0f0f0",//rgba(255,255,255,0.75);",
	    	".{Tab}.star": {
	    		// '': "padding-top: 4px;",
	    		".menu": "visibility:hidden;display:block;"
	    	},
	    	".{Tab}": "border-bottom-left-radius:5px; border-bottom-right-radius:5px;",
	    	".{Tab}.selected": "padding-left:8px;"
	    },
	    "#editors-tabs:focus": {
	    // ".{./Tabs}:focus": {
	    	"": "transition: background-color ease-in 0.2s; background-color: rgba(244, 253, 255, 0.94);",
	    	".selected": "border:1px solid rgb(57,121,204); background-color: rgb(57,121,204); color: white;",
	    	".menu": "color: white;"
	    }
	},
    onLoad() {
        var scope = this.scope();
        var me = this;

try { fixThemeColor(); } catch(e) { }

        // document.body.qsa("img").map(_ => (_ && _.style.display = "none"));
        const _md = js.sf("pouchdb://%s/.md", js.get("storageDB.name", req("vcl/Component")));

        function createWorkspaces(workspaces) {
        	const def = {
	        	name: "✪",
		    	vars: { "#navigator favorites": [ js.sf("%s;://.md;File", _md) ] },
	            state: {
		            "left-sidebar.visible": false,
		            "editors": [{
		                "selected": true,
		                "resource": {
		                    "uri": "://.md",
		                    "type": "File"
		                }
		            }]
	            },
	            onTabRender() {
	            	// Some sort of first load-mechanism...
	            	delete this._onRender;
	            	this.addClass("star");
	            	
	            	// this.set({
	            	// 	onRender() {
	            			
	            	// 	}
	            	// });
	            }
        	};
        	
        	if(!workspaces.find(ws => ws.name === def.name)) {
        		workspaces = [def].concat(workspaces);
        		// workspaces.push(def);//
        	}
        	
            workspaces.forEach(function (workspace) {
                scope["workspace-needed"].execute({
                        sender: me,
    	                workspace: workspace,
    	                selected: workspace.selected
                    });
            });
        }

this.app().vars("canunload", () => false);

        var url = app.vars("url");
        var workspaces = url.getParamValue("workspaces");
        var title = url.getParamValue("title");
        if(title) {
        	this.app()['@properties'].title = title;
        	this.app().setTitle(title);
        }
        
        /*- nested devtools/Main<> will initialize at their default worksapces*/
        if(this.up("devtools/Main<>") === null && workspaces) {
        	this.app().print("workspaces", workspaces);
        	createWorkspaces(workspaces.split(",").map(_ => ({name: _})));
        } else {
        	this.app().print("workspaces", this.vars(["default-workspaces"]));
            createWorkspaces(this.vars(["default-workspaces"]) || []);
        }
        this.readStorage("state", function(state) {
            if(state !== undefined) {
                var index = state.workspace;
                var tab = scope['workspaces-tabs'].getControl(index);
                tab && tab.setSelected(true);
            }
        });
        this.on("state-dirty", function() {
            me.setTimeout("saveState", function() {
                me.writeStorage("state", {
                    workspace: scope['workspaces-tabs'].getSelectedControl(1).
                        getIndex()});
            }, 200);
        });

		if(app.getUri().startsWith("App<code.")) {
	        var console_scope = this.app().scope().console.scope();
	        console_scope.toolbar && console_scope.toolbar.setVisible(false);
	        console_scope.size_handle && console_scope.size_handle.setParent(scope['workspaces-tabs']);
		}
        
        var version = (document.qs("html head script").text.split("\n")[1] || "").split("\"")[3] || "from source";
        this.app().print("running version", version);

        return this.inherited(arguments);
    },
    onActivate() {
		
		var me = this;
		function create_callback(hotkey, action) {
			return function(evt, type) {
				evt.preventDefault();
				me.qsa("devtools/Workspace<>:root:selected:visible #" + action)
					.execute(evt);
			};
		}
		function create_callback_sidebar(hotkey, index) {
			return function(evt, type) {
				evt.preventDefault();
				
				var ws = me.down("devtools/Workspace<>:root:selected");
				var sidebar = ws.down("#left-sidebar");
				if(!sidebar.isVisible()) {
					sidebar.show();
				}
				sidebar.update(function() {
					var tabs = me.down("devtools/Workspace<>:root:selected #left-sidebar-tabs");
					tabs._controls.forEach((tab, i) => tab.setSelected(i === index));
					tabs._controls[index].update(() => focusSidebar(ws, sidebar));
				});		
			};
		}
		function create_callback_activateWS(hotkey, index) {
			return function(evt, type) {
				evt.preventDefault();
				var tab = me.scope()['workspaces-tabs'].qsa("< vcl/ui/Tab")[index];
				// tab.setSelected(true);
				tab.toggle("selected");
                try {
                	if((tab = tab._control.qs("#left-sidebar-tabs < vcl/ui/Tab:selected"))) {
                		var input = tab._control.qs("vcl/ui/Input");
                		if(input && !input.isFocused()) {
                			// console.log("focus sidebar");
                			input.setFocus();
                		} else {
                			console.log("focus editor");
                			me.down("*:selected #editor-setfocus").execute(evt, me);
                		}
                	}
                	
                } catch(e) {
					console.warn(e.message);
				}
			};
		}
		function toggleSidebar(evt) {
			var ws = me.qs("devtools/Workspace<>:root:selected");
			var sidebar = ws.qs("#left-sidebar"), f;
			
			if(sidebar.isVisible()) {
				sidebar.hide();
				f = sidebar.removeVar("hadFocus");
				f && f.setFocus();
			} else {
				sidebar.show();
				sidebar.update(() => focusSidebar(ws, sidebar));
			}
		}
		
		// general hotkeys, see def above
		for(var k in hotkeys) {
console.log(hotkeys[k])
			HotkeyManager.register(k, {
				type: "keydown",
				callback: create_callback(k, hotkeys[k])
			});
		}
		
		// #TOFR-20210102-0
		me.vars("toggleSidebar", (evt) => toggleSidebar(evt));
		
		/*- Sidebar Shift+Cmd+E */
		HotkeyManager.register("Shift+Meta+48", { type: "keydown",  callback: toggleSidebar });
		HotkeyManager.register("Shift+Meta+E", { type: "keydown",  callback: toggleSidebar });
		// HotkeyManager.register("Shift+Ctrl+Z", { type: "keydown",  callback: function() {
		// 	me.updateChildren(true, true);
		// } });
		
		/* Workspaces and Sidebar */
		for(var i = 0, hotkey; i <= 9; ++i) {
			hotkey = String.format("Meta+%d", i + 48);
			HotkeyManager.register(hotkey, {
				type: "keydown",
				callback: create_callback_activateWS(hotkey, i)
			});
			hotkey = String.format("Ctrl+Alt+%d", i + 48);
			HotkeyManager.register(hotkey, {
				type: "keydown",
				callback: create_callback_activateWS(hotkey, i)
			});
			// hotkey = String.format("Shift+Ctrl+%d", i + 48);
			// HotkeyManager.register(hotkey, {
			// 	type: "keydown",
			// 	callback: create_callback_activateAce(hotkey, i)
			// });
			hotkey = String.format("Meta+Alt+%d", i + 48);
			HotkeyManager.register(hotkey, {
				type: "keydown",
				callback: create_callback_sidebar(hotkey, i - 1)
			});
		}

		var ctrlctrl = this.scope("ctrlctrl");
		
		// CtrlCtrl
		(function(focused) {
			HotkeyManager.register({
				keyCode: 17, type: "keyup",
				callback: function(evt) {
					if(focused) {
						if(ctrlctrl.getVisible()) ctrlctrl.hide(); 
						else ctrlctrl.show();
					} else {
						focused = require("vcl/Control").focused;
						me.setTimeout("ctrlctrl", function() { 
							focused = null;}, 250);
					}
				}
			});
			HotkeyManager.register({
				keyCode: 18, type: "keyup",
				callback: function(evt) {
					if(evt.code !== "AltRight") return;
					if(focused) {
						if(ctrlctrl.getVisible()) ctrlctrl.hide(); 
						else ctrlctrl.show();
					} else {
						focused = require("vcl/Control").focused || 1;
						me.setTimeout("ctrlctrl", () => focused = null, 250);
					}
				}
			});
			// HotkeyManager.register({
			// 	keyCode: 16, type: "keyup",
			// 	callback: function(evt) {
			// 		if(evt.code !== "ShiftRight") return;
			// 		if(focused) {
			// 			if(ctrlctrl.getVisible()) ctrlctrl.hide(); 
			// 			else ctrlctrl.show();
			// 		} else {
			// 			focused = require("vcl/Control").focused || 1;
			// 			me.setTimeout("ctrlctrl", () => focused = null, 250);
			// 		}
			// 	}
			// });
		}());
    },
    onDeactivate() {
    	// FIXME deactivate hotkeys
    }
}, [
    [["devtools/DragDropHandler<>"], ("ddh"), { isRoot: true }],
    [["devtools/CtrlCtrl<>"], "ctrlctrl", { visible: false}],
    
	[("vcl/Action"), "⌘.", {
		hotkey: "Meta+190|Alt+Meta+190",
		on_() {
			var editor, ws;
			if(Control.focused) {
				editor = Control.focused.up("devtools/Editor<>");
				ws = Control.focused.up("devtools/Workspace<>");
			}

			(ws || this.app()).print(nameOf(this), Control.focused);

			if(editor && ws) {
				ws.print(nameOf(this), editor.vars(["resource.uri"]));
			}
		},
		on(evt) {
			var editor = app.qsa("vcl/ui/Tab:visible:selected").filter(_ => _.vars("resource")).pop();
			if(editor) {
				var uri = editor.vars("resource.uri"); 
				if(evt.altKey) {
					app.print(uri, editor);
					cc(uri);
				} else {
					app.toast({classes: "glassy fade", content: uri})
				}
			}
		}
	}],
    [("vcl/Action"), "copy-handler", {
    	hotkey: "Cmd+C",
    	hotkeyPreventsDefault: false,
    	onExecute(evt) {
    		var copy = require("clipboard-copy");
    		
    		var focused = require("vcl/Control").focused;
    		if(focused instanceof require("vcl/ui/Tabs")) {
    			focused = focused.getSelectedControl(1);
    		} else if(focused instanceof require("vcl/ui/Node")) {
    		// 	focused = focused.getSelectedControl(1);
    		} else if(focused instanceof require("vcl/ui/List")) {
    			return copy(focused.getSelection(true).map(resource => resource.uri).join("\n"));	
    		} else {
    			focused = null;
    		}
    			
    		if(focused && (uri = focused.vars(["resource.uri"]))) {
    			// this.app().print("copy", uri);
    			copy(uri);
    		}
    	}
    }],
    [("vcl/Action"), "F5-blocker", {
        hotkey: "F5|MetaCtrl+R",
        onExecute: function(evt) {
            evt.preventDefault();
        }
    }],
    
    [("vcl/Action"), "hide-workspace-tabs", {
    	onExecute() { 
    		var twt = this.ud("#toggle-workspace-tabs"); 
    		twt._tag = !true; 
    		twt.execute(); 
    	}
    }],
    [("vcl/Action"), "show-workspace-tabs", {
    	onExecute() { 
    		var twt = this.ud("#toggle-workspace-tabs"); 
    		twt._tag = !false; 
    		twt.execute(); 
    	}
    }],
    [("vcl/Action"), "toggle-workspace-tabs", {
    	hotkey: "Ctrl+F12", // euh ,responds to F11 instead?
    	state: true,
    	on() {
    		var owner = this.getOwner();
    		var state = this.toggleState(), has = owner.hasClass("workspace-tabs-hidden");
    		if(state && has) {
    			owner.removeClass("workspace-tabs-hidden");
    			// this.app().print("removed")
    		} else if(!state && !has) {
    			owner.addClass("workspace-tabs-hidden");
    			// this.app().print("added")
    		}
    	},
    	onExecute_: function() {
    		var visible = this._tag;
			var focused = require("vcl/Control").focused;
    		var current = this.vars(["editors-tabs:focused"]);
    		var before = this.vars("before") || 0;
    		var now = Date.now();
    		
    		var tabs = {
    			editors: this.app().qsa("devtools/Workspace<>:root vcl/ui/Tabs#editors-tabs"),
    			bottom: this.app().qsa("devtools/Workspace<>:root vcl/ui/Tabs#bottom-tabs"),
    			left_sidebar: this.app().qsa("devtools/Workspace<>:root vcl/ui/Tabs#left-sidebar-tabs")
    		};
    		
    		if(now - before < 250) {
	    		current = focused && focused.udr("vcl/ui/Tabs#editors-tabs");
	    		if(!visible) {
    				tabs.editors = tabs.editors.filter(tabs => tabs !== current);
	    		} else {
    				tabs.editors = tabs.editors.filter(tabs => tabs === current);
	    		}
    		}

    		var hide = (tab) => !tab.hasClass("tabs-hidden") && tab.addClass("tabs-hidden");
    		var show = (tab) => tab.removeClass("tabs-hidden");

    		if(visible === true) {
	    		tabs.editors.map(show);
	    		tabs.bottom.map(show);
	    		tabs.left_sidebar.map(show);
    		} else {
	    		tabs.editors.map(hide);
	    		tabs.bottom.map(hide);
	    		tabs.left_sidebar.map(hide);
    		}
    		
    		this.vars("before", now);

    		this._tag = !this._tag;
    	}	
    }],
    [("vcl/Action"), "toggle-workspaces-tabs", {
    	hotkey: "Ctrl+Alt+F12|Alt+Cmd+F12", // euh ,responds to F11 instead?
    	onExecute: function() {
    		var tabs = this.app().down("devtools/Main<> #workspaces-tabs");
    		//tabs.setVisible(!tabs.getVisible());
    		tabs.toggleClass("hidden");
    	}	
    }],

    [["devtools/TabFactory"], "workspaces-new", {
        vars: {
			onTabRender() {
				this._nodes.text.textContent = this.vars(["workspace"]).name.split(".").pop();
			},
            parents: {
            	tab: "workspaces-tabs",
                container: "@owner",
                owner: "@owner"
            }
        },
        onExecute: function(evt) {
        	evt.workspace.specializer = evt.workspace.specializer || evt.workspace.name;
        	
            if(!evt.hasOwnProperty("formUri")) {
                evt.formUri = evt.workspace.formUri ||
                    String.format("devtools/Workspace<%s>",
	                	/*replaceChars*/(js.get("workspace.specializer", evt) || ""));
            }
            evt.params = evt.workspace;

            var tab = this.inherited(arguments);
            tab.setVar("workspace", evt.workspace);
            tab.setText(evt.workspace.name);
        	tab.set("onRender", evt.workspace.onTabRender || this.vars("onTabRender"));
        	
        	if(evt.workspace.name === "✪") {
        		tab.addClass("right");
        	}

            return tab;
        }
    }],
    
    [("vcl/Action"), "workspace-issues-new", {
    	// hotkey: "Shift+Ctrl+73", // Shift+Ctrl+I
    	onExecute() {
    		// Open a Github "issues/new"-page based upon workspace meta data
    		
    		var ws = app.down("devtools/Workspace<>:root:selected");
			var repo = ws.vars(["workspace.github-repo"]) || 
				js.sf("relluf/cavalion-%s", ws.vars(["workspace.name"]));
    		
    		window.open(js.sf("https://github.com/%s/issues/new", repo), "","menubar=no");
    	}
    }],
    [("vcl/Action"), "workspace-prompt-new", {
    	hotkey: "Shift+122|Shift+123",
    	onExecute: function(evt) {
        	var n = this.udown("#workspaces-tabs")._controls.length, me = this;
        	this.app().prompt("#workspace-needed execute", "ws" + n, function(res) {
        		if(res) {
        			me.up().qs("#workspace-needed").execute(res).setSelected(true);
        		}
        	})
    	}
    }],
    [("vcl/Action"), "workspace-prompt-new-resource", {
    	hotkey: "Shift+121",
    	onExecute: function(evt) {
        	var me = this, parent = this.up().qsa("devtools/Editor<>:root:visible").pop();
        	parent = parent ? js.up(parent.vars(["resource.uri"])) : "tmp";
        	var editorNeeded = this.app().down("devtools/Workspace<>:root:selected #editor-needed");
        	this.app().prompt("#editor-needed execute", parent + "/Resource-" + Math.random().toString(36).substring(2, 15), function(value) {
        			if(value !== null) {
        				editorNeeded.execute(value).setSelected(true);
        			}
        	});
    		
        	// this.app().prompt("#editor-needed execute", "Resource-" + Math.random().toString(36).substring(2, 15), function(res) {
        	// 	if(res) {
        	// 		editorNeeded.execute(res).setSelected(true);
        	// 	}
        	// })
    	}
    }],
    [("vcl/Action"), "workspace-find", {
    	hotkey: "Alt+F",
    	onExecute: function() {
    		var ws = this.up().down("devtools/Workspace<>:root:selected");
    		var sidebar = ws.down("#left-sidebar");
    		// if(!sidebar.isVisible()) {
    			sidebar.show();
				sidebar.update(function() {
					focusSidebar(ws, sidebar);
				});
    		// }
    	}
    }],
    [("vcl/Action"), "workspace-needed", {
        onExecute: function(evt) {
        	if(evt instanceof Array) {
        		var me = this;
        		return evt.forEach(function(ws) {
        			me.execute(ws);
        		});
        	}
        	
        	if(typeof evt === "string") {
        		evt = evt.split("|");
        		evt = { workspace: { name: evt[0], specializer: evt.pop() } };
        	}
        	
        	if(evt.workspace && !evt.workspace.specializer) {
        		evt.workspace.specializer = evt.workspace.name;
        	}
        	
            var scope = this.getScope();
    		var tabs = scope['workspaces-tabs'].getControls();
    		var tab = tabs.find(tab =>tab.vars("workspace.specializer") === evt.workspace.specializer) || tabs.find(tab =>tab.vars("workspace.name") === evt.workspace.name);
    		if(!tab) {
	            tab = scope['workspaces-new'].execute(evt);
    		} else {
        		tab.setSelected(true);
    		}
    		
    		return tab;
        }
    }],
    [("vcl/Action"), "workspace-open", {
        onExecute: function(evt) {
        	this.ud("#workspace-needed").execute(evt).setSelected(true);
        }
    }],
	[("vcl/Action"), "workspace-activate", {
    	// hotkey: [1, 2, 3, 4, 5, 6, 7, 8, 9].map(function(keyCode) { 
    	// 	return "Ctrl+" + (48 + keyCode); }).join("|"),
    	onExecute: function(evt) {
            var tab, tabs = this.getScope()['workspaces-tabs'];
            if((tab = tabs.getControl(evt.keyCode - 49)) !== null) {
                evt.preventDefault();
                tab.setSelected(true);
                tab.update(() => tab.scrollIntoView());
                try {
                	tab = tab._control.qs("#left-sidebar-tabs < vcl/ui/Tab:selected");
                	// console.log(tab, tab._control.qs("vcl/ui/Input"));
                	//.setFocus()
                } catch(e) {
					console.warn(e.message);
				}
            }
    	}
    }],
    [("vcl/Action"), "workspace-left-sidebar-tabs::next-previous", {
    	hotkey: "Ctrl+32|Ctrl+Shift+32",
    	onExecute: function(evt) {
			var ws = this.up().down("devtools/Workspace<>:root:selected");
			var tabs = ws.down("#left-sidebar-tabs");
			var sidebar = ws.down("#left-sidebar");
			
			if(!sidebar.isVisible()) {
				sidebar.show();
				sidebar.update(function() {
					focusSidebar(ws, sidebar);
				});
			} else {
	    		tabs["select" + (evt.shiftKey ? "Previous" : "Next")]();
			}

    		evt.preventDefault();
    	}
    }],
    [("vcl/Action"), "workspace-move-left", {
		hotkey: "Ctrl+Alt+Meta+219",
    	onExecute: function() {
    		var tab = this._owner.qs("vcl/ui/Tab:selected:childOf(workspaces-tabs)");
    		var index = tab.getIndex();
    		if(index > 0) {
    			tab.setIndex(index - 1);
    		}
    	}
    }],
    [("vcl/Action"), "workspace-move-right", {
		hotkey: "Ctrl+Alt+Meta+221",
    	onExecute: function() {
    		var tab = this._owner.qs("vcl/ui/Tab:selected:childOf(workspaces-tabs)");
    		var index = tab.getIndex();
    		tab.setIndex(index + 1);
    	}
    }],
    [("vcl/Action"), "workspace-destroy", {
    	hotkey: "MetaCtrl+115",
    	on() {
    		var tab = this._owner.qs("vcl/ui/Tab:selected:childOf(workspaces-tabs)");
    		if(confirm(js.sf("destroy %n?", tab.vars("workspace.name")))) {
    			tab.destroy();
    		}
    	}
    }],

    [("vcl/Action"), "workspaces-tabs::next-previous", {
    	hotkey: "Ctrl+Alt+219|Ctrl+Alt+221|Shift+Meta+219|Shift+Meta+221",
    	onExecute: function(evt) {
    		var method = evt.keyCode === 219 ? "Previous" : "Next";
    		this.scope("workspaces-tabs")["select" + method]();
    		evt.preventDefault();
    	}
    }],
    [("vcl/Action"), "workspaces-tabs-dblclick", {
		hotkey: "Ctrl+Alt+187",
		onExecute: function() { this.scope("workspaces-tabs").ondblclick({}); }
    }],

    [("vcl/Action"), "open_form", {
        left: 96,
        onExecute: function onExecute(uri, options) {
        	/** options: 
        	 *		- caption
        	 *		- text
        	 *		- selected
        	 *		- closeable/canClose,
        	 *		- onGetFormParams
        	 *		- params
        	 *		- forceLoad
        	 */
            var scope = this.scope();
            var owner = this._owner;
            var selectedTab = scope['workspaces-tabs'].getSelectedControl(1);
            var container = new FormContainer(owner);
            var tab = new Tab(owner);
            tab.setText(uri);

            if (options.closeable !== false) {
                tab.addClass("closeable");
            }

            // container.on("formload", function () {
            //     var form = this.getForm();
            //     if (options.updateCaption !== false) {
            //         form.on("captionchanged", function () {
            //             var caption = form.getCaption(true);
            //             if (caption instanceof Array) {
            //                 tab.setText(caption.join(""));
            //             } else {
            //                 tab.setText(String.format("%H", caption));
            //             }
            //         });
            //         var caption = form.getCaption();
            //         if (caption instanceof Array) {
            //             caption = caption.join("");
            //         } else {
            //             caption = String.format("%H", form.getCaption() || options.caption || form.getName() || form.getUri() || "New Tab");
            //         }
            //         tab.setText(caption);
            //     } else {
            //         tab.setText(options.caption || form.getCaption() || form.getName() || form.getUri() || "New Tab");
            //     }
            // });
            
            tab.setText("&nbsp;<img src='/shared/vcl/images/loading.gif' align='absmiddle'>" + (options.text || "&nbsp;"));
            container.on("formload", function() {
            	// this.app().log(this.getForm());
                tab.setText(uri);
            });
            
            tab.setControl(container);
            tab.setParent(scope['workspaces-tabs']);
            
            if (selectedTab !== null) {
                // tab.setIndex(selectedTab.getIndex() + 1);
            }

            tab.setSelected(options.selected !== false);
            tab.setOnCloseClick(function () { container.getForm().close(); });
            
            container.setVisible(false);
            container.setFormUri(uri);
            container.setAlign("client");
            container.setParent(scope['@owner']);
            container.setOnFormLoadError(function () {
                alert("Could not load form " + container.getFormUri());
                tab.destroy();
                container.destroy();
                form = null;
                tab = null;
                container = null;
                return false;
            });
            container.setOnFormClose(function () {
                this.getForm().destroy();
                this.destroy();
                tab.destroy();
                form = null;
                tab = null;
                container = null;
            });
            container.setOnGetFormParams(options.onGetFormParams || null);
            container.setFormParams(options.params || null);
            container.setVisible(options.selected !== false);
            
            if (options.forceLoad !== false) {
                container.forceLoad();
            }
            
            tab._update();
            return tab;
        },
        top: 232
    }],
    
    [("vcl/ui/Tabs"), "workspaces-tabs", {
        align: "bottom",
        classes: "bottom",
        css: { '&.hidden': "max-height:0;height:0;padding:0;", '.right': "float:right;" },
        // onDispatchChildEvent(component, name, evt) {
        // 	if(name === "dblclick" && component._parent === this && component._control) {
        // 		if(evt.altKey === true) {
        // 			component._control.destroy();
        // 			component.setSelected(false);
        // 			component.setVisible(false);
        // 			component.setTimeout("destroy", () => component.destroy(), 200);
        // 		}
        // 	}	
        // },
        onMouseDown(evt) {
        	this.vars("mousedown", Date.now());
        },
        onMouseUp(evt) {
        	const now = Date.now(); 
        	if(now - this.removeVar("mousedown") > 400) {
        		this.getSelectedControl(1).setSelected(false);
        	}
        },
        onDblClick: function(evt) { 
        	this.udown("#workspace-prompt-new").execute(evt);
        },
        onChange: function() {
    		this._owner.emit("state-dirty");
        }
    }, [
		[("vcl/ui/Element"), "title", { 
			index: 0, 
			element: "span", 
			css: title_css(),
			classes: title_classes(),
			onRender() {
				this.getNode().innerHTML = js.sf("&nbsp; <b>%s<b> <i class='fa fa-caret-down'></i>  &nbsp;", this.vars("title") || title());
			}
		}]
    ]]
]];