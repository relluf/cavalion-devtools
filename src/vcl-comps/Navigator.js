"vcl/ui/Node, vcl/ui/ListHeader, devtools/NavigatorNode, devtools/Resources, js/Method, v7/pdok/viewer-metadata, v7/pdok/themes";

var Method = require("js/Method");
var Resources = require("devtools/Resources");
var NavigatorNode = require("devtools/NavigatorNode");

var needsParent = ["src", "build", "vcl-comps", "css", "images", "img", "lib", "pages", "cavalion-blocks"];
function getNodeText(uri, usedNames) {
	var r = []; usedNames = usedNames || [];
	r.push((uri = uri.split("/")).pop());
	
	while(uri.length > 0 && (needsParent.indexOf(r[0]) !== -1 || usedNames.indexOf(r.join("/")) !== -1)) {
		r.unshift(uri.pop());
	}
	
	return r.join("/");
}

$("vcl/ui/Form", {
	activeControl: "search-input",
    onDispatchChildEvent: function (component, name, evt, f, args) {
        if (name.indexOf("key") === 0) {
            var scope = this.scope();
            // this.app().qs("vcl/ui/Console#console").print(name, {f: arguments.callee, args: arguments});
            if(component !== scope.tree && !scope.tree.isParentOf(component) && name === "keyup" && evt.keyCode === evt.KEY_F5) {
            	scope.tree.refresh();
            } else if (component === scope['search-input']) {
                if ([13, 27, 33, 34, 38, 40].indexOf(evt.keyCode) !== -1) {
                    var list = scope['search-list'];
                    if(evt.keyCode === 13 && list.getSelection().length === 0 && list.getCount()) {
                        list.setSelection([0]);
                    } else if(evt.keyCode === 27) {
		                scope['search-input'].setValue("");
		                scope['search-input'].fire("onChange", [true]); // FIXME
                    }

                    if (list.isVisible()) {
                        list.dispatch(name, evt);
                    }
                    evt.preventDefault();
                }
            }
        }
        return this.inherited(arguments);
    },
    onLoad: function () {
        var scope = this.scope();
        var me = this;
        
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
        		this._controls.forEach(function(node) {
        			node.reloadChildNodes();
        		});
        	}
        });
            
        return this.inherited(arguments);
    }

}, [
    $("vcl/data/Array", "search-results", {}),
    
    
    // TODO search-open-pdokviewer-metadata (per resource group/package)
    // TODO pdok/viewer/Layer
    // TODO search-open-devtools/Resource
    $(("vcl/Action"), "search-open", {
        onExecute: function (evt) {
            var list = this.scope('search-list'), me = this;
            var ws = this.up("devtools/Workspace<>:root");
            var a = ws.down("#editor-needed");
            
            list.getSelection(true).forEach(function (resource) {
            	var metadata = require("v7/pdok/viewer-metadata");
            	var themes = require("v7/pdok/themes");
            	
            	// TODO some sort of registration ROUTING(!!!) needed...
            	if(resource.uri.startsWith(metadata.uri)) {
            		ws.qsa("veldapps/OpenLayers<PDOK-v1> #layer-needed")
            			.execute({layer: resource});
            	} else if(resource.uri.startsWith(themes.uri)) {
            		ws.qsa("veldapps/OpenLayers<>:root #layer-needed")
            			.execute({layer: resource});
            	} else {
	            	a.execute({resource: resource, selected: true});
            	}
            }, this);
        }
    }),
    $(("vcl/Action"), "search", {
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
    }),
    $(("vcl/Action"), "resource-focus", {
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
    }),
    $(("vcl/Action"), "resource-new", {}),
    $(("vcl/Action"), "resource-delete", {}),
    $("vcl/ui/Bar", "search-bar", { classes: "no-border" }, [
        $("vcl/ui/Input", "search-input", {
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
            onKeyUp(evt) {
            	if(evt.keyCode === 13) {
this.print("keyUp13", evt);
					if(evt.metaKey === true && evt.shiftKey === true) {
            			this.udown("fs").toggle("visible");
					}
            	}
            }
        })
    ]),
    $(("vcl/ui/Tree"), "tree", {
        css: {
			".{Node}.root-invisible": {
				"> *:not(ol)": "display:none;",
				"> ol": "padding-left: 0;"
			},
            "padding-left": undefined,
            "overflow-x": undefined,
            ".{./Node}": {
            	"&.seperator": {
            		"border-top": "1px solid #f0f0f0", 
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
                ">.icon": {
                    width: "32px",
                    "background-repeat": "no-repeat",
                    "background-position-x": "14px",
                    "background-position-y": "2px",
					"background-size": "16px 16px"
                },
                "&.folder >.icon": {
                    // "background-image": "url(https://www.svgrepo.com/show/122150/folder.svg)",
                    "background-image": "url(https://image.flaticon.com/icons/svg/148/148953.svg)"
                },
                "&.file >.icon": {
                	// "background-image": "url(https://image.flaticon.com/icons/svg/148/148964.svg)",
                    "background-image": "url(https://image.flaticon.com/icons/svg/660/660720.svg)",
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
	            "&.opaque": {
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
	                    	node.addClass("opaque");
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
		}
    }, [
    	$(("devtools/NavigatorNode"), "fs", {
	   		vars: { resource: { type: "Folder", uri: "", name: "Resources" } },
    		classes: "root-invisible", // classes: "root",
    		expanded: true,
    		onLoad: function() {
    			this.vars("static-nodes", [].concat(this._controls));
    		},
	        onNodesNeeded: function (parent) {
	            var owner = this._owner;
	            var root = parent === this;
	
	            var uri = parent.vars("resource.uri") || "";
	            var control = parent.vars("control");
	            var uris = this._owner.vars("uris");
	            
				if(uris) {
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
						function createUriNode(uri) {
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
			                node.setVar("resource", item);
			                
			                node.setChecked(true);
	                    	node.setExpandable(item.expandable || item.type.indexOf("Folder") !== -1);
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
	            
	            var r = this.apply("Resources.list", [uri]).then(function (res) {
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
	                    
	                    root === true && index === 0 && node.addClass("seperator top");

	                    if(uris) {
		                    var checked = false;
		                    for(var i = 0; i < uris.length && !checked; ++i) {
		                    	checked = uris[i].indexOf(item.uri) === 0;
		                    }

		                    if(checked && uris.indexOf(item.uri) === -1) {
		                    	node.addClass("opaque");
		                    }
	                    }
	                    
	                    node.setChecked(checked);
	                    if (control) {
	                        node.setVar("control", control);
	                    }
	                    node.setExpandable(item.expandable || item.type.indexOf("Folder") !== -1);
	                    // node.setExpandable(item.type.indexOf("Folder") !== -1);
	                    node.setParent(parent);
	                });
	            	parent.endLoading();
	                return res;
	            });
	            return r;
	        }
    	})
    ]),
    $(("vcl/ui/List"), "search-list", { action: "search-open", source: "search-results", visible: false,
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
        $(("vcl/ui/ListColumn"), {
            content: "#",
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
        })
    ])
]);