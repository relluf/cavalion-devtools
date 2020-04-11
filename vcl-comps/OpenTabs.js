"vcl/ui/ListHeader";

$("vcl/ui/Form", {
	activeControl: "search-input",
    onDispatchChildEvent: function (component, name, evt, f, args) {
        if (name.indexOf("key") === 0) {
            var scope = this.scope();
            if (component === scope['search-input']) {
                if ([13, 27, 33, 34, 38, 40, 116].indexOf(evt.keyCode) !== -1) {
                    var list = scope.list;
                    if(evt.keyCode === 116) {
                    	this._onActivate.apply(this, [this._parent]);
                    } else if(evt.keyCode === 13 && list.getSelection().length === 0 && list.getCount()) {
                        list.setSelection([0]);
                    } else if(evt.keyCode === 27) {
		                scope['search-input'].setValue("");
		                scope['search-input'].fire("onChange", [true]); // FIXME
                    } else if (list.isVisible()) {
                        list.dispatch(name, evt);
                    }
                    evt.preventDefault();
                }
            }
        }
        return this.inherited(arguments);
    },
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
    $("vcl/data/Array", "editors-array", {
    	onFilterObject: function(obj) {
    		var filter = this.getVar("filter");
    		return filter ? obj.uri.indexOf(filter) === -1 : false;
    	}
    }),
    
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
    $("vcl/ui/Bar#search-bar", { classes: "no-border" }, [
        $("vcl/ui/Input#search-input", {
            placeholder: "Filter (⌥+F)",
            onDblClick: function() {
                this.setInputValue("");
            },
            onFocus: function () {
                this.fire("onChange", [!this.getInputValue()]);
            },
            onBlur: function () {
                this.fire("onChange", [false]);
            },
            onChange: function (evt) {
                var array = this.scope()['editors-array'];
                array.setVar("filter", this.getInputValue());
                array.updateFilter();
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