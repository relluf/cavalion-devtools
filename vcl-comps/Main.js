"js/Method, vcl/ui/Ace, vcl/ui/Tab, vcl/ui/Panel, vcl/ui/Bar, vcl/ui/FormContainer, util/HotkeyManager, util/net/Url, jquery";

var Ace = require("vcl/ui/Ace");
var Tab = require("vcl/ui/Tab");
var Control = require("vcl/Control");
var Method = require("js/Method");
var HotkeyManager = require("util/HotkeyManager");
var Url = require("util/net/Url");
var jQuery = require("jquery");
var FormContainer = require("vcl/ui/FormContainer");

// FIXME move to a better place
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
	if(tab && tab._control) {
		var input = tab._control.qs("< vcl/ui/Input");
		if(input) {
    		if(!input.isFocused()) {
    			// console.log("focus sidebar");
    			input.setFocus();
    		} else {
    			console.log("focus editor");
    			ws.down('*:selected #editor-setfocus').execute({}, ws);
    		}
		}
	}
}
(function (styles) {
	/* make sure styles.less overrides libs */
	var node = styles[0];
	var parent = node.parentNode;
	parent.removeChild(node);
	parent.appendChild(node);
}(jQuery("style")));

$(["ui/Form"], { 
	css: {
	    ".{./Panel}#editors": {
	        "background-color": "silver"
	    },
	    "#workspaces-tabs": "background-color:white;",
	    "#editors-tabs:focus": {
	    	"": "transition: background-color ease-in 0.2s; background-color: rgba(244, 253, 255, 0.94);",
	    	".selected": "border:1px solid rgb(57,121,204); background-color: rgb(57,121,204); color: white;",
	    	".menu": "color: white;"
	    }
	},
	vars: {
		"default-workspaces": [{
		    name: "⌘1",
		    selected: true
		}, { 
			name: "⌘2"
		}, { 
			name: "⌘3"
		}, { 
			name: "⌘4"
		}]
	},
	
    onLoad() {
        var scope = this.scope();
        var me = this;
        
        // document.body.qsa("img").map(_ => (_ && _.style.display = "none"));

        function createWorkspaces(workspaces) {
            workspaces.forEach(function (workspace) {
                scope["workspace-needed"].execute({
                        sender: me,
    	                workspace: workspace,
    	                selected: workspace.selected
                    });
            });
        }
        
        var url = app.vars("url");
        var workspaces = url.getParamValue("workspaces");
        var title = url.getParamValue("title");
        if(title) {
        	this.app()['@properties'].title = title;
        	this.app().setTitle(title);
        }
        
        /*- nested devtools/Main<> will initialize at their default worksapces*/
        if(this.up("devtools/Main<>") === null && workspaces) {
        	createWorkspaces(workspaces.split(",").map(_ => ({name: _})));
        } else {
            createWorkspaces(this.vars("default-workspaces"));
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

        var console_scope = this.app().scope().console.scope();
        console_scope.toolbar && console_scope.toolbar.setVisible(false);
        console_scope.size_handle && console_scope.size_handle.setParent(scope['workspaces-tabs']);
        
        var version = document.qs("html head script").text.split("\n")[1].split("\"")[3] || "from source";
        this.app().print("running " + version, this);

        return this.inherited(arguments);
    },
    onActivate() {
		var shortcuts = {
			"Ctrl+Alt+F1": "editor-move-to-front",
			"Ctrl+N": "editor-new", 
			"Alt+Ctrl+N": "editor-new",
			
			"Shift+Ctrl+40": "editors-next",
			"Shift+Ctrl+38": "editors-previous",
			"Shift+Ctrl+39": "editor-next", 
			"Shift+Ctrl+37": "editor-previous", 
			
			"Shift+Ctrl+186": "editors-next",
			"Shift+Ctrl+189": "editors-previous",
			// "Shift+Ctrl+222": "editors-next",
			"Shift+Ctrl+221": "editor-next", 
			"Shift+Ctrl+219": "editor-previous", 
			
			"Ctrl+Tab": "editor-next", 
			"Shift+Ctrl+Tab": "editor-previous", 
			
			"Shift+Ctrl+Meta+219": "editor-move-left",
			"Shift+Ctrl+Meta+221": "editor-move-right",

			"Ctrl+W": "editor-close",
			"Shift+Ctrl+W": "editors-close-all", //less-one ;-)
			
			// "MetaCtrl+48": "editor-focus-in-navigator",
			"Escape": "editor-setfocus"
		};
		
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
					var tab = tabs._controls.filter(_ => _ instanceof Control)[index];
					tab.setSelected(true);
					tab.update(function() {
						focusSidebar(ws, sidebar);	
					});
				});		
			};
		}
		function create_callback_activateWS(hotkey, index) {
			return function(evt, type) {
				evt.preventDefault();
				var tab = me.scope()['workspaces-tabs'].qsa("< vcl/ui/Tab")[index];
				tab.setSelected(true);
                try {
                	if((tab = tab._control.qs("#left-sidebar-tabs < vcl/ui/Tab:selected"))) {
                		var input = tab._control.qs("vcl/ui/Input");
                		if(!input.isFocused()) {
                			// console.log("focus sidebar");
                			input.setFocus();
                		} else {
                			console.log("focus editor");
                			me.down('*:selected #editor-setfocus').execute(evt, me);
                		}
                	}
                	
                } catch(e) {
					console.warn(e.message);
				}
			};
		}
		
		// general shortcuts, see def above
		for(var k in shortcuts) {
			HotkeyManager.register(k, {
				type: "keydown",
				callback: create_callback(k, shortcuts[k])
			});
		}
		
		function toggleSidebar(evt) {
			var ws = me.qs("devtools/Workspace<>:root:selected");
			var sidebar = ws.qs("#left-sidebar");
debugger
			if(sidebar.isVisible()) {
				sidebar.hide();
			} else {
				sidebar.show();
				sidebar.update(function() {
					focusSidebar(ws, sidebar);
				});
			}
		}
		
		/*- Sidebar Shift+Cmd+E */
		HotkeyManager.register("Shift+Meta+48", { type: "keydown",  callback: toggleSidebar });
		HotkeyManager.register("Shift+Meta+E", { type: "keydown",  callback: toggleSidebar });
		HotkeyManager.register("Shift+Ctrl+Z", { type: "keydown",  callback: function() {
			me.updateChildren(true, true);
		} });
		
		/* Workspaces and Sidebar */
		for(var i = 1, hotkey; i <= 9; ++i) {
			hotkey = String.format("Meta+%d", i + 48);
			HotkeyManager.register(hotkey, {
				type: "keydown",
				callback: create_callback_activateWS(hotkey, i - 1)
			});
			hotkey = String.format("Ctrl+Alt+%d", i + 48);
			HotkeyManager.register(hotkey, {
				type: "keydown",
				callback: create_callback_activateWS(hotkey, i - 1)
			});
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
		}());
    },
    onDeactivate() {
    	// FIXME deactivate hotkeys
    }
    
}, [
    $(["devtools/DragDropHandler<dropbox>"]),
    $(["devtools/CtrlCtrl<>"], "ctrlctrl", { visible: false}),
    $(["devtools/TabFactory"], "workspaces-new", {
        vars: {
            parents: {
            tab: "workspaces-tabs",
                container: "@owner",
                owner: "@owner"
            }
        },
        onExecute: function(evt) {
            if(!evt.hasOwnProperty("formUri")) {
                evt.formUri = evt.workspace.formUri ||
                    String.format("devtools/Workspace<%s>",
	                	replaceChars(evt.workspace.name || ""));
            }
            evt.params = evt.workspace;

            var tab = this.inherited(arguments);
            tab.setVar("workspace", evt.workspace);
            tab.setText(evt.workspace.name);
            
            return tab;
        }
    }),
    
    $(("vcl/Action"), "toggle-workspace-tabs", {
    	hotkey: "Ctrl+F12", // euh ,responds to F11 instead?
    	onExecute: function() {
    		var visible = this._tag;

    		// var tabs = this.app().down("devtools/Main<> #workspaces-tabs");
    		if(visible === true) {//!tabs.getVisible()) {
    		// TODO make up one liner
	    		this.app().qsa("devtools/Workspace<>:root vcl/ui/Tabs#editors-tabs").show();
	    		this.app().qsa("devtools/Workspace<>:root vcl/ui/Tabs#bottom-tabs").show();
	    		this.app().qsa("devtools/Workspace<>:root vcl/ui/Tabs#left-sidebar-tabs").show();
    		} else {
    			this.app().qsa("devtools/Workspace<>:root vcl/ui/Tabs#editors-tabs").hide();
	    		this.app().qsa("devtools/Workspace<>:root vcl/ui/Tabs#bottom-tabs").hide();
	    		this.app().qsa("devtools/Workspace<>:root vcl/ui/Tabs#left-sidebar-tabs").hide();
    		}
    		// tabs.setVisible(!tabs.getVisible());
    		this._tag = !this._tag;
    	}	
    }),
    $(("vcl/Action"), "toggle-workspaces-tabs", {
    	hotkey: "Ctrl+Alt+F12", // euh ,responds to F11 instead?
    	onExecute: function() {
    		var tabs = this.app().down("devtools/Main<> #workspaces-tabs");
    		tabs.setVisible(!tabs.getVisible());
    	}	
    }),
    
    $(("vcl/Action"), "workspace-issues-new", {
    	hotkey: "Shift+Ctrl+73", // Shift+Ctrl+I
    	onExecute() {
    		// Open a Github "issues/new"-page based upon workspace meta data
    		
    		var ws = app.down("devtools/Workspace<>:root:selected");
			var repo = ws.vars(["workspace.github-repo"]) || 
				js.sf("relluf/cavalion-%s", ws.vars(["workspace.name"]));
    		
    		window.open(js.sf("https://github.com/%s/issues/new", repo), "","menubar=no");
    	}
    }),

    $(("vcl/Action"), "workspace-prompt-new", {
    	hotkey: "Shift+122",
    	onExecute: function(evt) {
        	var n = this.udown("#workspaces-tabs")._controls.length, me = this;
        	this.app().prompt("#workspace-needed execute", "ws" + n, function(res) {
        		if(res) {
        			me.up().qs("#workspace-needed").execute(res).setSelected(true);
        		}
        	})
    	}
    }),
    $(("vcl/Action"), "workspace-prompt-new-resource", {
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
    }),
    $(("vcl/Action"), "workspace-find", {
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
    }),
    $(("vcl/Action"), "workspace-needed", {
        onExecute: function(evt) {
        	if(evt instanceof Array) {
        		var me = this;
        		return evt.forEach(function(ws) {
        			me.execute(ws);
        		});
        	}
        	
        	if(typeof evt === "string") {
        		evt = { workspace: {name: evt} };
        	}
        	
            var scope = this.getScope();
    		var tabs = scope['workspaces-tabs'].getControls();
    		var tab = tabs.find(function(tab) {
    			return tab.getVar("workspace.name") === evt.workspace.name;
    		});
    		if(!tab) {
	            tab = scope['workspaces-new'].execute(evt);
    		} else {
        		tab.setSelected(true);
    		}
    		
    		return tab;
        }
    }),
    $(("vcl/Action"), "workspace-activate", {
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
    }),
    
    $(("vcl/Action"), "workspace-left-sidebar-tabs::next-previous", {
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
    }),
    $(("vcl/Action"), "workspace-move-left", {
		hotkey: "Ctrl+Alt+Meta+219",
    	onExecute: function() {
    		var tab = this._owner.qs("vcl/ui/Tab:selected:childOf(workspaces-tabs)");
    		var index = tab.getIndex();
    		if(index > 0) {
    			tab.setIndex(index - 1);
    		}
    	}
    }),
    $(("vcl/Action"), "workspace-move-right", {
		hotkey: "Ctrl+Alt+Meta+221",
    	onExecute: function() {
    		var tab = this._owner.qs("vcl/ui/Tab:selected:childOf(workspaces-tabs)");
    		var index = tab.getIndex();
    		tab.setIndex(index + 1);
    	}
    }),

    $(("vcl/Action"), "workspaces-tabs::next-previous", {
    	hotkey: "Ctrl+Alt+219|Ctrl+Alt+221|Shift+Meta+219|Shift+Meta+221",
    	onExecute: function(evt) {
    		var method = evt.keyCode === 219 ? "Previous" : "Next";
    		this.scope("workspaces-tabs")["select" + method]();
    		evt.preventDefault();
    	}
    }),
    $(("vcl/Action"), "workspaces-tabs-dblclick", {
		hotkey: "Ctrl+Alt+187",
		onExecute: function() { this.scope("workspaces-tabs").ondblclick({}); }
    }),

    $(("vcl/Action"), "open_form", {
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
    }),
    $(("vcl/Action"), "F5-blocker", {
        hotkey: "F5|MetaCtrl+R",
        onExecute: function(evt) {
            evt.preventDefault();
        }
    }),
    
    $(("vcl/ui/Tabs"), "workspaces-tabs", {
        align: "bottom",
        classes: "bottom",
        onDblClick: function(evt) { 
        	this.udown("#workspace-prompt-new").execute(evt);
        },
        onChange: function() {
    		this._owner.emit("state-dirty");
        }
    })
]);