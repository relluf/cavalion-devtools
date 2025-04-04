"vcl/ui/Node, vcl/ui/ListHeader, devtools/NavigatorNode, devtools/Resources, js/Method";

var Method = require("js/Method");
var Resources = require("devtools/Resources");
var NavigatorNode = require("devtools/NavigatorNode");
var Component = require("vcl/Component");

var Storage_uri = Component.storageDB ? 
	(uri) => js.sf("pouchdb://%s/%s", Component.storageDB.name, uri) 
	:
	(uri) => uri;

var needsParent = ["src", "build", "vcl-comps", "css", "images", "img", "lib", "pages", "cavalion-blocks"];
function getNodeText(uri, usedNames) {
	var r = []; usedNames = usedNames || [];
	r.push((uri = uri.split("/")).pop());
	
	while(uri.length > 0 && (needsParent.indexOf(r[0]) !== -1 || usedNames.indexOf(r.join("/")) !== -1)) {
		r.unshift(uri.pop());
	}
	
	return r.join("/");
}
function onNodesNeeded(parent) {
    var owner = this._owner;
    var root = parent === this;

    var uri = parent.vars("resource.uri") || "";
    var control = parent.vars("control");
    var uris = this._owner.vars("uris");
    
	if(parent._name === "fs" && uris) {
		if(!uris.hasOwnProperty("splice")) {
			/* OMG, ugly hack, what was wrong with me?! */
		    Method.override(uris, {
		        splice: function(index, count) {
		        	for(var i = 0; i < count; ++i) {
		        		var node = uriNodes[this[index + i]];
		        		node && node.destroy();
		        	}
		        	return Method.callInherited(this, arguments);
		        },
		        push: function() {
		        	for(var i= 0; i < arguments.length; ++i) {
		        		createUriNode(arguments[i]).setIndex(0);
		        	}
		        	return Method.callInherited(this, arguments);
		        }
		    });
		}
    
        var favorites = this.vars(["#navigator favorites", true]) || [];
        favorites.forEach(function(uri) {
        	if(uris.indexOf(uri) === -1) {
        		Array.prototype.push.apply(uris, [uri]);
        	}
        });
        
        uris = uris.sort(function(i1, i2) {
        	var e1 = i1.endsWith(";File"), e2 = i2.endsWith(";File");
        	return e1 === e2 ? i1 < i2 ? -1 : 1 : e1 ? 1 : -1;
        });
        
        if(root) {
            var uriNodes = {};
			function createUriNode(uri, index) {
                var node = new NavigatorNode(owner);
                var favorite = favorites.indexOf(uri) !== -1;
                
                uri = uri.split(";");
                
                var item = {
                	uri:	uri[0], 
                	name:	uri[1] || getNodeText(uri[0]),
                	type:	uri[2] || "Folder"
                };

                root && node.addClass("root");
                favorite && node.addClass("favorite");
                favorite && (index === 0) && node.addClass("seperator top");
                node.setVar("resource", item);
                
                node.setChecked(true);
            	node.setExpandable(item.expandable || item.type !== "File");
                // node.setExpandable(item.type === "Folder");//true);
                node.setParent(parent);
                return (uriNodes[uri[1]] = node);
            }            
            
            uris.forEach(createUriNode);
        }
    	// console.log("timeout set to refresh index based on uris")
    	// owner.setTimeout("refresh-index", function() {
			this.apply("Resources.index");
    	// }, 250);
	}
	
	var list = this.vars(["Resources.list"]);
    
    return list.apply(this, [uri]).then(res => {
    	
    	if(res.length > 250) {
    		// alert("A lot of nodes...");
    	}
    	
    	res.sort(function(i1, i2) {
    		if(i1.type === i2.type) {
    			return i1.name < i2.name ? -1 : 1;
    		}
    		return i1.type !== "Folder" ? 1 : -1;
    	});
    	parent.beginLoading();
        res.forEach(function (item, index) {
            var node = new NavigatorNode(owner);
            item.uri = item.uri || (uri !== "" ? (uri + "/" + item.name) : item.name);

            node.setVar("resource", item);
            root && node.addClass("root");
            
            root === true 
            	&& index === 0 
            	&& parent._name === "fs" 
            	&& node.addClass("seperator top");

            var checked = false;
            if(uris) {
                for(var i = 0; i < uris.length && !checked; ++i) {
                	checked = uris[i].indexOf(item.uri) === 0;
                }

                if(checked && uris.indexOf(item.uri) === -1) {
                	node.addClass("opaque-50");
                }
            }
            
            node.setChecked(checked);
            if (control) {
                node.setVar("control", control);
            }
            node.setExpandable(item.expandable || item.type !== "File");
            node.setParent(parent);
        });
    	parent.endLoading();
        return res;
    });
}

[("vcl/ui/Form"), {
	activeControl: "search-input",
    onDispatchChildEvent: function (component, name, evt, f, args) {
        if (name.indexOf("key") === 0) {
            var scope = this.scope();
            // this.app().qs("vcl/ui/Console#console").print(name, {f: arguments.callee, args: arguments});
            if(component !== scope.tree && !scope.tree.isParentOf(component) && name === "keyup" && evt.keyCode === evt.KEY_F5) {
            	scope.tree.refresh();
            } else if (component === scope['search-input']) {
                if ([13, 27, 38, 40].indexOf(evt.keyCode) !== -1) {
                    var list = scope['search-list'];
                    if(evt.keyCode === 13 && list.getSelection().length === 0 && list.getCount()) {
                        list.setSelection([0]);
                    } else if(evt.keyCode === 27) {
		                scope['search-input'].setValue("");
		                scope['search-input'].fire("onChange", [true]); // FIXME
                    }

                    if (list.isVisible()) {
                        list.dispatch(name, evt);
                    } else {
                    	scope.tree.dispatch(name, evt);
                    }
                    evt.preventDefault();
                }
            }
        }
        return this.inherited(arguments);
    },
    onDestroy: function() {
    	var ddh = this.app().qsa("devtools/DragDropHandler<>:root");
    	(this.vars("listeners") || []).forEach(listeners => ddh.un(listeners));
    	return this.inherited(arguments);
    },
    onLoad: function () {
        var scope = this.scope();
        var me = this;
        var ws = this.up("devtools/Workspace<>:root");
        
        var indexing = 0;
        var lists = {};
        var index = {};
        var uris = [];
        
        me.setVar("uris", uris);
        me.setVar("index", index);
        me.setVar("Resources", {
            index: function () {
            	if(!uris.length) return;
            	
                var run = ++indexing;
                scope['search-input'].addClass("searching");
                return Resources.index(uris).
                    then(function (res) {
                        if (run === indexing) {
                            for (var k in lists) {
                                if (lists[k] instanceof Array) {
                                    index[k] = lists[k];
                                }
                            }
                            js.mixIn(index, res);
                            scope.search.execute();
                        }
                        scope['search-input'].removeClass("searching");
                        return res;
                    }).
                    catch(function(res) {
                        scope['search-input'].removeClass("searching");
                        return res;
                    });
            },
            list: function (uri) {
                lists[uri] = Resources.list(uri);
                return lists[uri].
                    then(function (res) {
                    	lists[uri] = res;
                        return (index[uri] = res);
                    });
            },
            refresh: function (uri) {
                delete lists[uri];
            }
        });

        scope.tree.override({
        	refresh: function() {
        		var cascade = (arr) => arr.forEach(function(node) {
        			if(node.hasClass("cascade-refresh")) {
        				cascade(node._controls || []);
        			} else {
        				node.reloadChildNodes();
        			}
        		});
        		cascade(this._selection.length ? this._selection : this._controls || []);
        	}
        });

		this.vars("listeners", this.app().qsa("devtools/DragDropHandler<>:root")
			.on("dropped", (dataTransfer, dropped) => {
				this.qsa("#DragDropHandler_files").map(node => {
					node.show();
					node.reloadChildNodes();
					node.setExpanded(true);
				});
				// if(ws.isSelected()) {
				// 	const foi = (o) => (o.files || o.items);
				// 	const n = dropped.reduce((t, o) => 
				// 		(t += foi(o).length), 0) - 
				// 		foi(dropped[dropped.length - 1]).length;
				// 	foi(dataTransfer).forEach((f, i) => 
				// 		ws.open(js.sf("dropped://%d/%s", i + n, f.name)));
				// }
			})
		);

        return this.inherited(arguments);
    }
}, [
    [("vcl/data/Array"), "search-results", {}],
    // TODO search-open-pdokviewer-metadata (per resource group/package)
    // TODO pdok/viewer/Layer
    // TODO search-open-devtools/Resource
    [("vcl/Action"), "search-open", {
        onExecute: function (evt) {
            var list = this.scope('search-list'), me = this;
            var ws = this.up("devtools/Workspace<>:root");
            var a = ws.down("#editor-needed");
            list.getSelection(true).forEach(function (resource) {
            	// removed v7/dependencies 2024/12/11
            	a.execute({resource: resource, selected: true});
            }, this);
        }
    }],
    [("vcl/Action"), "search", {
        onExecute: function () {
            var scope = this.getScope();
            var text = scope['search-input'].getInputValue();
            var lower = text.toLowerCase();
            var index = this._owner.getVar("index");
            var exacts = [],
            lowers = [],
            names = [],
            uris = [];

            function sort(i1, i2) {
                return i1.name < i2.name ? -1 : 1;
            }

            for (var k in index) {
                index[k].forEach(function (item) {
                	// if(!item.uri) { // TODO get rid of this
                	// 	item.uri = k ? (k + "/" + item.name) : item.name;
                	// }
                	
                    if (item.name === text) {
                        exacts.push(item);
                    } else if (item.name.toLowerCase() === lower) {
                        lowers.push(item);
                    } else if (item.name.toLowerCase().indexOf(lower) !== -1) {
                        names.push(item);
                    } else if (item.uri.toLowerCase().indexOf(lower) !== -1) {
                        uris.push(item);
                    }
                	
                });
            }

            scope['search-results'].setArray(
                [exacts.sort(sort), lowers, names, uris].
                    reduce(function (prev, curr) {
                        return prev.concat(curr.sort(sort));
                    }));
        }
    }],
    [("vcl/Action"), "resource-focus", {
        onExecute: function(evt) {
            var scope = this.getScope();
            var names = evt.resource.uri.split("/");
            var path = [];
            
            var sidebar = this.up("devtools/Workspace<>:root").down("#left-sidebar");
            sidebar.show();
            sidebar.update(function() {
	            var node = scope.tree.getSelection()[0] || null;
	            if(node !== null && evt.resource.uri === node.getVar("resource.uri")) {
	            	scope.tree.makeVisible(node);
	            	return;
	            }
	            scope['search-list'].hide();
	            function walk(parent) {
	                path.push(names.shift());
	
	                node = parent.getControls().find(function(node) {
	                    return node.getVar("resource.uri") === path.join("/");
	                });
	
	                if(node) {
	                	scope.tree.setTimeout("makeVisible", function() {
	                        scope.tree.makeVisible(node);
	                	}, 20);
	                        
	                    if(names.length) {
	                        node.childNodesNeeded(function() {
	                            node.setExpanded(true);
	                            /*- TODO how to know when nodes are actually created? */
	                            node.setTimeout("walk", function() {
	                        		walk(node);
	                            }, 50);
	                        });
	                    } else {
	                        scope.tree.setSelection([node]);
	                    }
	                }
	            }
	            
	            walk(scope.fs);
            });
            
        }
    }],
    [("vcl/Action"), "resource-new", {}],
    [("vcl/Action"), "resource-delete", {}],
    [("vcl/ui/Bar"), "search-bar", { classes: "no-border" }, [
        ["vcl/ui/Input", "search-input", {
            placeholder: "Filter (⌥+F)",
            classes: "search-top",
            onDblClick() {
//                this.fire("onChange", [false]);
                var scope = this.getScope();
                scope['search-list'].hide();
                this.setValue("");
                this._nodes.input.value = "";
            },
            onFocus() {
                this.fire("onChange", [!this.getInputValue()]);
            },
            onBlur() {
                this.fire("onChange", [false]);
            },
            onChange(evt) {
                var scope = this.getScope();
                var value = this.getInputValue();
                var hasChecking = scope.tree.hasClass("checking");
                var hasValue = scope.tree.hasClass("value");
                var should = typeof evt === "boolean" ? evt : (this.isFocused());// && !value);

                scope['search-list'].setVisible( !! value);

                if (should && !hasChecking) {
                    scope.tree.addClass("checking");
                    scope.tree.setTimeout("removeClass", function () {
                        scope.tree.removeClass("checking");
                    }, 2000);
                } else if (!should && hasChecking) {
                    scope.tree.setTimeout("removeClass", function () {
                        scope.tree.removeClass("checking");
                    }, 100);
                }
                if (typeof evt !== "boolean") {
                    scope.search.execute(evt);
                }
            },
//             onKeyUp(evt) {
//             	if(evt.keyCode === 13) {
// this.print("keyUp13", evt);
// 					if(evt.metaKey === true && evt.shiftKey === true) {
//             			this.udown("fs").toggle("visible");
// 					}
//             	}
//             }
        }]
    ]],
    // [("vcl/ui/Bar"), "shortcut-bar", { content: "shortcuts go here" }],
    [("vcl/ui/Tree"), "tree", {
        css: {
        	// TODO move this to app scope
            "padding-left": undefined,
            "overflow-x": undefined,
            ".{./Node}": {
            	"&.seperator.bottom": {
            		"border-bottom": "1px solid rgba(240,240,240,0.5)", 
            		"margin-bottom":" 2px", 
            		"padding-bottom": "2px"
            	},
            	"&.seperator.top": {
            		"border-top": "1px solid rgba(240,240,240,0.5)", 
            		"margin-top":" 2px", 
            		"padding-top": "2px"
            	},
                ">.checkbox": {
                    position: "absolute",
                    right: "4px",
                    "z-index": "1",
                    display: "none"
                },
                "&.no-icon >.icon": "width:14px;",
                //
            	">.text": "padding-left:0;",
                ">.icon:not(.v-center)": {
                	'::before': "transform: translate(0, 1px);"
                },
                ">.icon": {
                    width: "32px",
                    "background-repeat": "no-repeat",
                    "background-position-x": "14px",
                    "background-position-y": "0px",
					"background-size": "16px 16px"
                },
                "&.package >.icon": {
                    // "background-image": "url(https://www.svgrepo.com/show/122150/package.svg)",
                    // "background-image": "url(https://image.flaticon.com/icons/svg/148/148953.svg)"
                    "background-image": `url(${NavigatorNode.icons.package})`
                },
                "&.folder >.icon": {
                    // "background-image": "url(https://www.svgrepo.com/show/122150/folder.svg)",
                    // "background-image": "url(https://image.flaticon.com/icons/svg/148/148953.svg)"
                    "background-image": `url(${NavigatorNode.icons.folder})`
                },
                "&.file >.icon": {
                	// "background-image": "url(https://image.flaticon.com/icons/svg/148/148964.svg)",
                    // "background-image": "url(https://image.flaticon.com/icons/svg/660/660720.svg)",
                    "background-image": `url(${NavigatorNode.icons.file})`
                },
                // ">.icon": {
                //     width: "30px",
                //     "background-repeat": "no-repeat",
                //     "background-position-x": "right",
                //     "background-position-y": "2px",
                // },
                // "&.folder >.icon": {
                //     "background-image": "url(/shared/vcl/images/folder16.png)",
                // },
                // "&.file >.icon": {
                //     "background-image": "url(/shared/vcl/images/file16.png)",
                // },
                ">.text>.desc": {
                    "font-size": "7.5pt",
                    color: "silver",
                    "pointer-events": "none"
                },
	            "&.opaque-50": {
	            	">.checkbox":{
	            		opacity: "0.5"
	            	}
	            }
            },
            "&.checking .{./Node}.folder:not(.favorite):not(.root-invisible) >.checkbox": {
                display: "block"
            },
            "&.busy": {
                background: "url(/shared/vcl/images/loading.gif) no-repeat 50%,50%",
                ".{./Node}": {
                    opacity: "0.5"
                }
            }
        },
        onDispatchChildEvent: function (component, name, evt, f, args) {
            var resource, owner = this._owner;
            var app = this.app();
            
            var selection = this.getSelection();
            
            /* TODO Hotkeys should be moved to devtools/Main<> and dispatched to selected workspace */

			/*- Add/Remove Resource - Use Insert/Delete (or F8/F9) */
            if(selection.length && name === "keydown") {
            	// console.log(evt.keyCode);
                if (evt.keyCode === evt.KEY_DELETE || evt.keyCode === evt.KEY_F8) {
                	evt.preventDefault();
                    app.confirm(String.format("You are about to delete the " + 
                    "following resource%s:\n- %s\n\nAre you sure to continue?",
                        selection.length > 1 ? "s" : "",
                        selection.map(function(node) {
                            return node.getVar("resource.uri");
                        }).join("\n- ")), function(res) {
                            if(res === true) {
                                selection.forEach(function(node) {
                                    node.setEnabled(false);
                                    node.setExpanded(false);
                                    node.getNode().style.opacity = "0.5";
                                    Resources['delete'](node.getVar("resource.uri"))
                                        .then(function() {
                                            node.destroy();
                                        })
                                        .catch(function(err) {
                                            node.setEnabled(true);
                                            node.getNode().style.opacity = ""; // FIXME use a class!
                                        });
                                })
                            }
                        });
                }
                if (evt.keyCode === evt.KEY_INSERT || evt.keyCode === evt.KEY_F9) {
                    if(selection[0].getVar("resource.type") === "Folder") {
                        app.prompt("Enter uri for new resource:",
                            selection[0].getVar("resource.uri") + "/",
                            function(uri) {
                                if(uri !== null) {
                                    Resources.create(uri, {text:""})
                                        .then(function(res) {
                                            selection[0].reloadChildNodes();
                                            app.qsa("devtools/Workspace<>:owner-of(.) #editor-needed", owner)
                                            	.execute({
	                                                resource: {uri: uri},
	                                                selected: true
	                                            });
                                        })
                                        .catch(function(res) {
                                            alert(res);
                                        });
                                }
                        });
                    }
                }
            }

			/*- Open Resource - Use Shift to open folders */
            if (name === "dblclick" && (component.hasClass("file") || 
                evt.shiftKey === true)
            ) {
            	if((resource = component.getVar("resource"))) {
	            	this.up("devtools/Workspace<>:root")
	            		.down("#editor-needed")
	            		.execute({resource: resource, selected: true});
	            	evt.preventDefault();
	            	return false;
            	}
            }

			/*- Index Folder Resource */
            if (name === "click" && evt.target.nodeName === "INPUT") {
                var uris = this._owner.getVar("uris");
                var uri = component.getVar("resource.uri");
                var checked = component.getChecked();
                var index = uris.indexOf(uri);
                if (index !== -1 && !checked) {
                    uris.splice(index, 1);
                } else {
                    uris.push(uri);
                }

                this._owner.writeStorage("uris", JSON.stringify(uris));

                var me = this;
                this.setTimeout("refresh-index", function () {
                    me.apply("Resources.index");
                }, 750);
            }

            /*- Cancel the timeout (whatever event) */
            if (this.hasClass("checking")) {
                var me = this;
                this.setTimeout("removeClass", function () {
                    me.removeClass("checking");
                }, 2000);
            }
        },
		onNodesNeeded: function(parent) { 
			var node = parent, pname = "_onChildNodesNeeded";
			while(node && !node.hasOwnProperty(pname)) {
				node = node._parent;
			}
			
			if(node === parent) return;
			
			if(node && node.hasOwnProperty(pname)) {
				return node.fire(pname.substring(1), [parent]);
			}
		},
		onNodeRender(evt) {
			var v;
			if((v = evt.target.vars("resource.uri"))) {
				this.print("rendering resource", v)
			}
		},
        _onNodesNeeded: function (parent) {
            var owner = this._owner;
            var root = parent === null;

            parent = parent || this;

            var uri = parent.getVar("resource.uri") || "";
            var control = parent.getVar("control");
            var uris = this._owner.getVar("uris").sort(function(i1, i2) {
            	return i1 < i2 ? -1 : 1;
            });
            
            if(root) {
	            var uriNodes = {};
				function createUriNode(uri) {
	                var node = new NavigatorNode(owner);
	                
	                uri = uri.split(";");
	                
	                var item = {
	                	uri:	uri[0], 
	                	name:	uri[1] || getNodeText(uri[0]),
	                	type:	uri[2] || "Folder"
	                };
	
	                root && node.addClass("root");
	                node.setVar("resource", item);
	                
	                node.setChecked(true);
	                node.setExpandable(true);
	                node.setParent(parent);
	                return (uriNodes[uri[1]] = node);
	            }            
	            
	            uris.forEach(createUriNode);
	            
	            Method.override(uris, {
		            splice: function(index, count) {
		            	for(var i = 0; i < count; ++i) {
		            		var node = uriNodes[this[index + i]];
		            		node && node.destroy();
		            	}
		            	return Method.callInherited(this, arguments);
		            },
		            push: function() {
		            	for(var i= 0; i < arguments.length; ++i) {
		            		createUriNode(arguments[i]).setIndex(0);
		            	}
		            	return Method.callInherited(this, arguments);
		            }
	            });
            }
            
            var r = this._owner.apply("Resources.list", [uri]).
	            then(function (res) {
	            	res.sort(function(i1, i2) {
	            		if(i1.type === i2.type) {
	            			return i1.name < i2.name ? -1 : 1;
	            		}
	            		return i1.type !== "Folder" ? 1 : -1;
	            	});
	            	parent.beginLoading();
	                res.forEach(function (item, index) {
	                    var node = new NavigatorNode(owner);
	                    item.uri = uri !== "" ? (uri + "/" + item.name) : item.name;

	                    node.setVar("resource", item);
	                    root && node.addClass("root");
	                    
	                    root === true && index === 0 && node.addClass("seperator top");

	                    var checked = false;
	                    for(var i = 0; i < uris.length && !checked; ++i) {
	                    	checked = uris[i].indexOf(item.uri) === 0;
	                    }

	                    if(checked && uris.indexOf(item.uri) === -1) {
	                    	node.addClass("opaque-50");
	                    }
	                    node.setChecked(checked);
	                    if (control) {
	                        node.setVar("control", control);
	                    }
	                    
console.log(node, js.sf("expandable: %s", item.expandable));
	                    node.setExpandable(item.expandable || item.type.indexOf("Folder") !== -1);
	                    node.setParent(parent);
	                });
	            	parent.endLoading();
	                return res;
	            });
            return r;
        }
    }, [
    	// $(("devtools/NavigatorNode"), "fs", {
	   	// 	vars: { resource: { type: "Folder", uri: "", name: js.sf("%s/fs", window.location.host) } },
    	// },
    	// [("devtools/NavigatorNode"), "Tools", {
	   	// 	vars: { 
	   	// 		resource: { 
	   	// 			type: "Folder", 
	   	// 			uri: "Library/cavalion-blocks/tools", 
	   	// 			name: "Tools"
	   	// 		}
	   	// 	},
	    //     onNodesNeeded: onNodesNeeded
    	// }],
    	[("devtools/NavigatorNode"), "Tools_devtools", {
	        onNodesNeeded: onNodesNeeded,
    		// classes: "seperator top",
	   		vars: { 
	   			resource: { 
	   				name: "Tools", type: "Folder", 
	   				uri: "Library/cavalion-blocks/tools/devtools", 
	   			}
	   		},
    	}],
    	[("vcl/ui/Node"), "Overrides", { 
    		classes: "seperator top cascade-refresh",
    		text: "Local Overrides",
    		// visible: false,
    		icon: NavigatorNode.icons.folder
    	}, [
	    	[("devtools/NavigatorNode"), "devtools_Workspaces", {
	    		expandable: true,
		   		vars: { 
		   			resource: { 
		   				type: "Folder", expandable: true,
		   				uri: Storage_uri("vcl-comps/devtools/Workspace$"),
		   				name: "Workspaces"
		   			}
		   		},
		        onNodesNeeded: onNodesNeeded
	    	}],
	    	[("devtools/NavigatorNode"), "devtools_Editors", {
	    		expandable: true,
		   		vars: { 
		   			resource: { 
		   				type: "Folder", expandable: true,
		   				uri: Storage_uri("vcl-comps/devtools/Editor$"),
		   				name: "Editors"
		   			}
		   		},
		        onNodesNeeded: onNodesNeeded
	    	}],
	    	[("devtools/NavigatorNode"), "devtools_Main", {
	    		// expandable: true,
		   		vars: { 
		   			resource: { 
		   				// type: "Folder", expandable: true,
		   				uri: Storage_uri(js.sf("vcl-comps/devtools/Main$/%s.js", app.getSpecializer())),
		   				name: js.sf("Main<%s>", app.getSpecializer())
		   			}
		   		},
		        onNodesNeeded: onNodesNeeded
	    	}],
	    	[("devtools/NavigatorNode"), "cavalion-blocks", {
	    		classes: "seperator top",
		   		vars: { 
		   			resource: { 
		   				type: "Folder", expandable: true,
		   				uri: Storage_uri("cavalion-blocks"),
		   				name: "cavalion-blocks"
		   			}
		   		},
		        onNodesNeeded: onNodesNeeded
	    	}],
	    	[("devtools/NavigatorNode"), "vcl-comps", {
		   		vars: { 
		   			resource: { 
		   				type: "Folder", expandable: true,
		   				uri: Storage_uri("vcl-comps"),
		   				name: "vcl-comps"
		   			}
		   		},
		        onNodesNeeded: onNodesNeeded
	    	}],
    	]],
    	[("devtools/NavigatorNode"), "Component_storage", {
    		classes: "seperator top",
	        onNodesNeeded: onNodesNeeded,
	   		vars: { 
	   			resource: { 
	   				name: "Local Storage",
	   				uri: Storage_uri(""), 
	   				type: "Folder"
	   			}
	   		},
	   		// classes: "root-invisible seperator top",
    		// expanded: true,
	        // onNodeCreated() {
	        // 	// var fs = this.ud("#fs"), rname = this.vars("resource.name");
	        // 	// this.setParent(fs);
	        // 	// this.setIndex(this.ud("#fs").);
	        // 	// this.setTimeout("foo", () => {
		       // // 	this.setIndex(fs._controls.filter(c => c.vars("resource.type") === "Folder")
		       // // 		.map(c => c.vars("resource.name"))
		       // // 		.reduce((a, n, i) => { return n < rname ? i : a }, 0)
		       // // 	);
	        // 	// 	// this.setExpanded(false);
	        // 	// 	this.removeClass("root-invisible");
	        // 	// }, 2000);
        	// 	this.removeClass("root-invisible");
	        // }
    	}], 
    	[("vcl/ui/Node"), "Prototypes", {
    		classes: "cascade-refresh",
    		text: "Prototypes",
    		icon: NavigatorNode.icons.folder,
    		onLoad() {
    			this.vars("static-nodes", [].concat(this._controls));
    		}
    	}, [
	    	[("devtools/NavigatorNode"), "cavalion-blocks", {
		   		vars: { 
		   			resource: { 
		   				type: "Folder", expandable: true,
		   				uri: "Library/cavalion-blocks/prototypes",
		   				name: "cavalion-blocks/prototypes"
		   			}
		   		},
		        onNodesNeeded: onNodesNeeded
	    	}],
	    	[("devtools/NavigatorNode"), "vcl-comps", {
		   		vars: { 
		   			resource: { 
		   				type: "Folder", expandable: true,
		   				uri: "Library/vcl-comps/prototypes",
		   				name: "vcl-comps/prototypes"
		   			}
		   		},
		        onNodesNeeded: onNodesNeeded
	    	}]
    	]],
    	[("devtools/NavigatorNode"), "Library", {
	   		vars: { 
	   			resource: { 
	   				type: "Folder", 
	   				uri: "Library", 
	   				name: "Library"
	   			}
	   		},
	        onNodesNeeded: onNodesNeeded
    	}],
    	[("devtools/NavigatorNode"), "fs", {
	        onNodesNeeded: onNodesNeeded,
	   		vars: { 
	   			resource: { 
	   				name: js.sf("Server Resources"),
	   				type: "Folder", uri: "/"
	   			}
	   		},
    		classes: "root-invisible", // classes: "root",
    		expanded: true,
    		onLoad: function() {
    			this.vars("static-nodes", [].concat(this._controls));
    		}
    	}],
    	[("devtools/NavigatorNode"), "DragDropHandler_files", {
	   		vars: { 
	   			resource: { 
	   				type: "Folder", 
	   				uri: "dropped://",
	   				name: "Dropped Resources"
	   			}
	   		},
	   		classes: "seperator top",
	   		expandable: true,
	   		visible: false,
	   		index: 1,
	        onNodesNeeded: onNodesNeeded
    	}],
    	// [("devtools/NavigatorNode"), ]
    ]],
    [("vcl/ui/List"), "search-list", { 
    	action: "search-open", 
    	source: "search-results", 
    	visible: false,
        css: {
            "background-color": "white",
            ".{./ListHeader}": {
                height: "0"
            },
            ".ListCell": {
            	"margin-top": "1px",
                "padding-top": "4px",
                "padding-left": "34px",
                "background-repeat": "no-repeat",
                "background-position-x": "14px",
                "background-position-y": "1px",
                "&.file": {
                    "background-image": "url(/shared/vcl/images/file16.png)",
                },
                "&.folder": {
                    "background-image": "url(/shared/vcl/images/folder16.png)",
                },
                "span": {
                    "font-size": "7.5pt",
                    color: "silver"
                }
            }
        }
    }, [
        [("vcl/ui/ListColumn"), {
            content: "#",
            rendering: "innerHTML",
            attribute: ".",
            onGetValue: function (value, row, source) {
                return [String.format("%H <span> - %H</span>", value.name, 
                	value.uri.replace(/^Workspaces\/[^\/]*\//, "../"))];
            },
            onRenderCell: function (cell, value, column, row, source, orgValue) {
                var classes = cell.className.split(" ");
                if (classes.length === 4) {
                    classes.pop();
                }
                classes.push(orgValue.type === "Folder" ? "folder" : "file");
                cell.className = classes.join(" ");
            }
        }]
    ]]
]];