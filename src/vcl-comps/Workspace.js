"use vcl/ui/Ace, vcl/ui/FormContainer, vcl/ui/Tab, ace/range, locale";

var Tab = {
	_content:
		"<div class='text'></div><span class='hashcode'></span>" +
		"<i class='menu fa fa-caret-down'></i>" +
		"<a class='menu close'>×</a>",

	initializeNodes: function() {
		/** @overrides ../Control.prototype.initializeNodes */
        this.inherited(arguments);
		this._nodes.close = this._node.childNodes[3];
	},
    render: function () {
        var node = this.getNode();
        var uri = this.vars("resource.uri") || "New";
        var folder = this.vars("resource.type") === "Folder";
        var title = uri.split("/");
        
        if(uri.endsWith("/")) {
        	folder = true;
        	title.pop(); 
        }
    	title = this.vars("resource.title") || title.pop();

        node.title = uri;
        node.down(".text").textContent = this.vars("modified") ? "* " + title : title;
        
        var ace = this.qs("vcl/ui/Ace");
        if(!folder && ace /*&& ace.isVisible()*/) {
	        node.down(".hashcode").textContent = js.sf(" [%s]", ace.hashCode());
        }
    },
	show: (tab) => tab.removeClass("tabs-hidden"),
	hide: (tab) => !tab.hasClass("tabs-hidden") && tab.addClass("tabs-hidden"),
	isHidden: (tab) => tab.hasClass("tabs-hidden")
};
var Utils = {
    getState: function(scope) {
        var tabs = scope["editors-tabs"].getControls();
        return {
        	'left-sidebar.visible': scope['left-sidebar'].getVisible(),
            editors: tabs.filter(function(tab) {
                var ace = tab.qsa("devtools/Editor<> #ace")[0];
                var resource = tab.getVar("resource") || {}, r;
                return resource && resource.uri;
            }).map(function(tab) {
            	var resource = tab.vars("resource");
                return {
                	selected: tab.isSelected(),
                	resource: {
                		uri: resource.uri,
		                type: resource.type,
		                contentType: resource.contentType
                	}
                };
            })
        };
    },
    setState: function(state, scope) {
        var Range = require("ace/range").Range;
        
        var workspace = scope['@owner'];
        if(state) {
	        state.editors && state.editors.forEach(function(state) {
	            var _state = js.mixIn({}, state);
	            var tab = scope["editor-needed"].execute(js.mixIn(state, {
	            	dontBringToFront: true
	            }));
	            tab.setVar(".state", _state);
	     //       tab.once("resource-loaded", function() {
	     //           var ace = tab._control._form.getScope().ace;
	     //           setTimeout(function() {
	     //               /*- FIXME setTimeout seems necessary because the row is not yet scrolled into view :-s */               
	     //               var session = ace.getEditor().session;    
	     //               state.selection && session.selection.fromJSON(state.selection);
	     //               state.options && session.setOptions(state.options);
	     //               state.mode && session.setMode(state.mode);
	     //               try {
	     //                   state.folds.forEach(function(fold){
	     //                       session.addFold(fold.placeholder, 
	     //                           Range.fromPoints(fold.start, fold.end));
	     //                   });
	     //               } catch(e) {
	     //                   console.error(e);
	     //               }
	     //               session.setScrollTop(state.scrollTop);
	     //               session.setScrollLeft(state.scrollLeft);
	
						// if(state.position) {
		    //                 ace.getEditor().gotoLine(state.position.row + 1,state.position.column);
						// }
	     //           }, 0);
	     //       });
	        });
	        scope['left-sidebar'].setVisible(state['left-sidebar.visible'] !== false);
        }
    }
};

[["ui/Form"], {
    onLoad: function() {
        var scope = this.scope();
        var workspace = this.vars(["workspace"]);
        this.readStorage("state", function(value) {
        	value = value || {workspace:0};
            Utils.setState(js.mixIn(workspace.state||{}, value), scope);
        });

        this.on("state-dirty", function() {
            var workspace = scope['@owner'];
            workspace.setTimeout("saveState", function() {
                 workspace.writeStorage("state",Utils.getState(workspace.getScope()));
            }, 200);
        });
        
        scope['left-sidebar'].override("visibleChanged", function() {
            this._owner.emit("state-dirty");
        	return this.inherited(arguments);
        });
        
        this.open = function(evt) {
        	if(evt instanceof Array) {
        		evt = {
        			
        		}
        	}
        	
        	if(typeof evt === "string") {
        		evt = {resource:{uri: evt}, selected: true};
        	}
        	scope['editor-needed'].execute(evt);
        };
        
        return this.inherited(arguments);
    },
    onDispatchChildEvent: function(component, name, evt, f, args) {
    	var Tabs = require("vcl/ui/Tabs"), Tab = require("vcl/ui/Tab");
    	if(name === "click") {
    		if(component instanceof Tabs) {
    			// console.log("!!!", component);
    			this.vars("editors-tabs:focused", component);
    		} else if(component instanceof Tab) {
    			// console.log("!!!", component._parent);
    			this.vars("editors-tabs:focused", component._parent);
    		// } else {
    			// console.log("???", component);
    		}
    	}
    },
    onActivate: function() {
    	/*- TODO describe why a timeout is necessary */
        this.getApp().setTimeout({
            name: "devtools/Workspace<>.activate", 
            f: function(me) {
            	// debugger;
                me.qsa(["vcl/ui/Tab[uri=devtools/Workspace][selected=true]", 
                    "vcl/ui/Ace"].join(" ")).focus();
            }, 
            ms: 200, 
            args: [this]
        });
        this.setSelected(true);
    },
    onDeactivate: function() {
    	this.setSelected(false);
    }
}, [
    [["devtools/TabFactory"], ("editor-factory"), {
        vars: {
            closeable: true,
            formUri: "devtools/Editor<js>",
            parents: {
                container: "editors",
                tab: "editors-tabs"
            }
        },
        on(evt) {
            var tab = this.inherited(arguments);
            var owner = tab._owner;
            tab.initializeNodes = Tab.initializeNodes;
            tab.render = Tab.render;
            tab._content = Tab._content;
            tab._control.once("formloaded", function() {
            	// var ace = this._form.scope().ace;
             //   var ed = ace.getEditor();
                // ed.selection.on("changeCursor", function(e, thisObj) {
                //     // tab._owner.emit("state-dirty");
                //     // ace.p[er]
                // });
                // ed.session.on("changeFold", function() {
                //     // FIXME does not work
                //     // tab._owner.emit("state-dirty");
                // });
                tab.render();
				this._form.setName(tab.vars("resource.uri"));
            });
            
            tab.set({
            	onMenuClick: function(evt) { // querySelectorAll 
            		// var editor = this.qsa("#ace").each(function(ace) {
            		// 	ace.getEditor().execCommand("showSettingsMenu", []);
            		// });
            		return this.qsa("#menu-open").execute(evt);
            	}
            });
            return tab;
        }
    }],
    ["vcl/Action", ("editor-needed"), {
        on(evt) {
            var scope = this.scope(), tab;
            if(typeof evt === "string") {
            	evt = { 
            		selected: true,
            		resource: { 
            			uri: evt, 
            			type: evt.startsWith("folder:") ? "Folder" : "File" 
            		}
            	};
            }

            if(!evt.resource) { evt.resource = { uri: "" } }
            if(!evt.parents) {
	    		var tabs = scope['editors-tabs'].getControls();
	    		tab = tabs.find(function(tab) {
	    			return tab.getVar("resource.uri") === evt.resource.uri;
	    		});
            }
            
    		if(!tab) {
    		    if(!evt.formUri) { //?
    		    	this.vars("devtools/Editor");
    		    }
    		    if(evt.resource.contentType && evt.resource.type !== "Folder") {
    		    	// TODO use contentType to determine which editor should be
    		    	var type = evt.resource.contentType.split("/").pop();
    		    	evt.editorUri = js.sf("devtools/Editor<%s>", type);
    		    }
    		    if(evt.editorUri) {
    		    	// TODO form <---> editor
    		    	evt.formUri = evt.editorUri;
    		    }
    		    if(!evt.formUri) {
    		    	var uri = (evt.resource.uri || "");
    			    var path = uri ? uri.split("/") : [];
    			    var ext = path[path.length - 1] || "";
    			    ext = ext.indexOf(".") !== -1 ? ext.split(".").pop() : "";
    			    if(evt.resource.type === "Folder") {
    			    	evt.formUri = "devtools/Editor<folder>";
    			    } else if(path.indexOf("vcl-comps") !== -1 && ext === "js") {
                        evt.formUri = "devtools/Editor<vcl>";
    			    } else if(path.indexOf("cavalion-blocks") !== -1 && ext === "js") {
                        evt.formUri = "devtools/Editor<blocks>";
    			    } else if(path.length > 1 && uri.indexOf("/var/log/") !== -1) {
    			    	// TODO #CVLN-20200926-1 find some registration system for these Editor-descendants
    			    	evt.formUri = "devtools/Editor<var/log>";
    			    } else if(uri.indexOf("ElliTrack-") !== -1 && uri.endsWith(".txt")) {
    			    	evt.formUri = "devtools/Editor<tsv/ElliTrack>";
                    } else {
                    	if(ext) {
    			        	evt.formUri = String.format("devtools/Editor<%s>", ext);
                    	}
                    }
    			}
    		    
    			var on = this.vars("onGetEditorUri");
    			if(on) {
    				
    			}

	            tab = scope['editor-factory'].execute(evt, this);
	            tab.setVar("resource", evt.resource);
	            tab.nodeNeeded();
	
    		} else {
    		    if(evt.selected === true) {
    		        tab.setSelected(true);
    		    }
    		}
    		
    		// TODO oops what a weird name "dontBringToFront"
    		if(!evt.dontBringToFront && evt.bringToFront !== false) {
            	tab.setIndex(0);
    		}

			// if(evt.onAvailable || evt.onResourceLoaded || evt.onResourceSaved || evt.onResourceRendered) {
				var callback = (f, args) => {
					return f && f.apply(this, args);
				}, first = true;
	            tab.once("editor-available", (e) => { first = false; callback(evt.onAvailable, [e]); });
	            tab.on({
	            // 	"resource-rendered"(e) { callback(evt.onResourceRendered, [e]); },
	            	"resource-loaded"(e) { 
	            		if(first) { tab.emit("editor-available", [e]); }
	            		callback(evt.onResourceLoaded, [e]); 
	            	},
	            // 	"resource-saved"(e) { callback(evt.onResourceSaved, [e]); }
	            });
        	// }
        	
        	if(tab.down("#ace")) {
    			tab.setTimeout("available", () => tab.emit("editor-available", []), 0);
        	}
        	

    		return tab;
        }
    }],
    ["vcl/Action", ("editors-next"), {
    	onExecute: function() {
			var tabs = this.up().qsa("#editors-tabs:visible");
			var focused = this.up().vars("editors-tabs:focused");
			if(focused && !focused.isFocused()) {
				// show(focused);
				// focused.setFocus();
			} else if(tabs.length) {
				var index = tabs.indexOf(focused) + 1;
				if(index >= tabs.length) index = 0;
				focused = this.up().vars("editors-tabs:focused", tabs[index]);
				// if(Tab.isHidden(focused)) return;
				// show(focused);
				// focused.setFocus();
			}
			Tab.show(focused);
			focused.setFocus();
    	}
    }],
    ["vcl/Action", ("editors-previous"), {
    	onExecute: function() {
			var tabs = this.up().qsa("#editors-tabs:visible");
			var focused = this.up().vars("editors-tabs:focused");
			if(focused && !focused.isFocused()) {
				// show(focused);
				// focused.setFocus();
			} else if(tabs.length) {
				var index = tabs.indexOf(focused) - 1;
				if(index < 0) index = tabs.length - 1;
				focused = this.up().vars("editors-tabs:focused", tabs[index]);
				// show(focused);
				// focused.setFocus();
			}
			Tab.show(focused);
			focused.setFocus();
    	}
    }],
    ["vcl/Action", ("editors-close-all"), {
    	on(evt) {
			var tabs = this.vars(["editors-tabs:focused"]) || this.udown("#editors-tabs");
            var selected = tabs.getSelectedControl(1);

    		tabs._controls.filter(_ => _ !== selected)
    			.filter(_ => evt.altKey === true || _.vars(["resource.type"]) === "File")
    			.forEach(function(tab) {
					tabs.print("closing", tab);
	    			tab._control.destroy();	
	    			tab._control = null;
	    			tab.destroy();
	    			// tab.update(function() { tab.destroy(); });
	    		});
    	}
    }],
    ["vcl/Action", ("editor-new"), {
        on(evt) {
            this.scope("editor-factory")
            	.execute(evt)
            	.setSelected(true);
        }
    }],
    ["vcl/Action", ("editor-next"), {
        onExecute: function() {
        	var ws = this.up();
			var tabs = ws.vars("editors-tabs:focused") || ws.qs("#editors-tabs");

			if(!tabs.isVisible()) tabs = ws.qs("#editors-tabs");
			if(tabs && !tabs.isFocused()) tabs.setFocus();
			
			tabs.selectNext();
        }
    }],
    ["vcl/Action", ("editor-previous"), {
        onExecute: function() {
        	var ws = this.up();
			var tabs = ws.vars("editors-tabs:focused") || ws.qs("#editors-tabs");

			if(!tabs.isVisible()) tabs = ws.qs("#editors-tabs");
			if(tabs && !tabs.isFocused()) tabs.setFocus();

			tabs.selectPrevious();
        }
    }],
    ["vcl/Action", ("editor-close"), {
        on(evt) {
            var scope = this.getScope();
            var selected = scope['editors-tabs'].getSelectedControl(1);
            if(selected) {
                selected._control._form.close();
            }
            evt.preventDefault();
        }
    }],
    ["vcl/Action", ("editor-move-to-front"), {
    	onExecute: function() {
    		this._owner.qs("vcl/ui/Tab:selected:childOf(editors-tabs)").setIndex(0);
    	}
    }],
    ["vcl/Action", ("editor-move-left"), {
    	onExecute: function() {
    		var tab = this._owner.qs("vcl/ui/Tab:selected:childOf(editors-tabs)");
    		var index = tab.getIndex();
    		if(index > 0) {
    			tab.setIndex(index - 1);
    		}
    	}
    }],
    ["vcl/Action", ("editor-move-right"), {
    	onExecute: function() {
    		var tab = this._owner.qs("vcl/ui/Tab:selected:childOf(editors-tabs)");
    		var index = tab.getIndex();
    		tab.setIndex(index + 1);
    	}
    }],
    ["vcl/Action", ("editor-setfocus"), {
    	on(evt) {
			this._owner.qs("vcl/ui/Tab:selected:childOf(editors-tabs) #ace").setFocus();
    	}
    }],
    ["vcl/Action", ("editor-focus-in-navigator"), {
        on(evt) {
        	// TODO 
            // var app = this.getApp();
            // var resource = this.getVar("resource", true);
            // app.qsa("devtools/Workspace<>:owner-of(.) #navigator #resource-focus", this)
            // 	.execute({resource: resource}, this);
        }
    }],
    
    ["vcl/ui/Panel", ("left-sidebar"), { align: "left", css: "border-right: 1px solid gray;", width: 375 }, [
    	
        ["vcl/ui/Tabs", ("left-sidebar-tabs"), [
            ["vcl/ui/Tab", { text: locale("Navigator"), control: "navigator", selected: true }],
            ["vcl/ui/Tab", { text: locale("Open Tabs"), control: "openTabs" }],
            ["vcl/ui/Tab", { text: locale("Console"), control: "console" }],
            // ["vcl/ui/Tab", { text: locale("Scratch"), control: "scratch" }],
            ["vcl/ui/Tab", { text: locale("Outline"), control: "outline" }],
            ["vcl/ui/Tab", { text: locale("Bookmarks"), control: "bookmarks", visible: false }],
            ["vcl/ui/Tab", { text: locale("Search"), control: "search-panel", visible: false }],
           
        ]],

        [["./Navigator<>"], "navigator"],
        [["./Bookmarks"], "bookmarks", { align: "client", visible: false }],
        [["./Outline"], "outline", { _align: "client", visible: false }],
        [["./OpenTabs"], "openTabs", { visible: false }],
        [["./Console"], "console", { visible: false }],
        
        // $("vcl/ui/Ace", "scratch", { align: "client", visible: false }),

        ["vcl/ui/Panel", "search-panel", { align: "client", visible: false }],
        ["vcl/ui/Panel", "inspector-panel", { align: "client", visible: false }]
    ]],
    ["vcl/ui/Panel", ("editors"), { align: "client", css: "background-color: silver;" }, [
        ["vcl/ui/Tabs", ("editors-tabs"), {
            onChange: function(tab, previous) {
// TODO tell application to render it's title
                var title = this.app().getTitle(), me = this;
                this.setTimeout("foo", function() {
	                var ws = me.app().qs(":root:selected");
	                ws = ws !== null ? ws.getSpecializer() : "";
                    if(tab) {
                        document.title = String.format("%s - [%s > %s]", tab.getVar("resource.uri"), title, ws);
                    } else {
                        // document.title = title;
                    }
                }, 0);
                this._owner.emit("state-dirty");
            },
            onDblClick: function() {
            	var me = this, parent = this.up().qsa("devtools/Editor<>:root:visible").pop();
            	parent = parent ? js.up(parent.vars(["resource.uri"])) : "Projects/tmp";
            	this.app().prompt("#editor-needed execute", parent + "/Resource-" + Math.random().toString(36).substring(2, 15), function(value) {
            			if(value !== null) {
            				me.up().qs("#editor-needed").execute(value).setSelected(true);
            			}
            	});
            }
        }, [
            [["ui/controls/SizeHandle"], { 
            	classes: "horizontal left", 
            	vars: "control: left-sidebar;",
            	onDragStart(evt) { 
					// #TOFR-20210102-0 - tracks dragstart so that next onClick can be ignored (dragend doesn't get triggered)
            		this.vars("ignore-click", true); 
            	},
            	onClick(evt) { 
					// #TOFR-20210102-0
            		if(!this.vars("ignore-click")) this.vars(["toggleSidebar"])(evt);
            		this.vars("ignore-click", false);
            	}
            }]
        ]]
    ]] 
]];