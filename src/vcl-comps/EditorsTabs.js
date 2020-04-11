"vcl/ui/ListHeader";

$("vcl/ui/Form", {
	activeControl: "list",
    onActivate: function (parent) {
        this.scope("editors-array").setArray(
	    	this.up("devtools/Workspace<>:root").qsa("vcl/ui/Tab")
	        	.map(function(tab) {
	        		var resource = tab.getVar("resource");
	        		return !(resource && resource.uri) ? null : {
	        			name: resource.uri.split("/").pop(),
	        			uri: resource.uri
	        		};
		        })
	        	.filter(function(resource) { return resource; })
	        	.sort(function(res1, res2) {
	        		return res1.name < res2.name ? -1 : 1;
	        	}));
    	
		return this.inherited(arguments);
    }
}, [
    $("vcl/data/Array", "editors-array", {}),
    
    $("vcl/Action", "editor-open", {
        onExecute: function (evt) {
            var list = this.scope('list');
            var a = this.up("devtools/Workspace<>:root").down("#editor-needed");
            list.getSelection(true).forEach(function (resource) {
            	a.execute({resource: resource, selected: true});
            }, this);
        }
    }),
    $("vcl/Action", "search-focus", {
        hotkey: "MetaCtrl+191|Alt+F",
        onExecute: function () {
            var scope = this.getScope();
            var previous = this.getVar("previous");
            var now = Date.now();
            if(previous !== undefined && now - previous < 175) {
                scope['search-input'].setValue("");
                scope['search-input'].fire("onChange", [true]); // FIXME
            }
            scope['search-input'].setFocus(true);
            this.setVar("previous", now);
        }
    }),
    $("vcl/Action", "search", {
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
                	item.uri = k ? (k + "/" + item.name) : item.name;
                    if (item.name === text) {
                        exacts.push(item);
                    } else if (item.name.toLowerCase() === lower) {
                        lowers.push(item);
                    } else if (item.name.toLowerCase().indexOf(lower) !== -1) {
                        names.push(item);
                    } else if ((k + "/" + item.name).toLowerCase().indexOf(lower) !== -1) {
                        uris.push(item);
                    }
                });
            }

            scope['editors-array'].setArray(
                [exacts.sort(sort), lowers, names, uris].
                    reduce(function (prev, curr) {
                        return prev.concat(curr.sort(sort));
                    }));
        }
    }),
    $("vcl/ui/Panel", "search-panel", {
        align: "top",
        autoSize: "height",
        css: "padding: 4px 5px;", 
        visible: false
    }, [
        $("vcl/ui/Input", "search-input", {
            placeholder: "search",
            css: {
                width: "100%",
                border: "1px solid silver",
                padding: "2px",
                "&.searching": {
                    "background": "url(/shared/vcl/images/loading.gif) no-repeat 2px 2px",
                    "background-position": "right 4px top 5px"
                },
                "&.value": {
                    "background-color": "yellow"
                }
            },
            onDblClick: function() {
//                this.fire("onChange", [false]);
                var scope = this.getScope();
                scope['search-list'].hide();
                this.setValue("");
            },
            onFocus: function () {
                this.fire("onChange", [!this.getInputValue()]);
            },
            onBlur: function () {
                this.fire("onChange", [false]);
            },
            onChange: function (evt) {
                var scope = this.getScope();
                var value = this.getInputValue();
                var hasChecking = scope.tree.hasClass("checking");
                var hasValue = scope.tree.hasClass("value");
                var should = typeof evt === "boolean" ? evt : (this.isFocused() && !value);

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
            }
        })
    ]),
    $("vcl/ui/List", "list", {
        align: "client",
        action: "editor-open",
        source: "editors-array",
        css: {
            "background-color": "white",
            ".{./ListHeader}": {
                height: "0"
            },
            ".ListCell": {
            	"margin-top": "1px",
                "padding-top": "5px",
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
        },
        onLoad: function () {
            // FIXME
            this._rowHeight = 21;
        }
    }, [
        $("vcl/ui/ListColumn", {
            content: "#",
            attribute: ".",
            onGetValue: function (value, row, source) {
                return [String.format("%H <span> - %H</span>", value.name, value.uri)];
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