var sf = String.format;

// var XSD_NS = "http://www.w3.org/2001/XMLSchema";
var XS_NAMESPACE_PREFIXES = ['', 'xs:', 'xsd:'];

	function js_getXs(path, elem) {
	    var r;
	    XS_NAMESPACE_PREFIXES.some(function(prefix) {
	        var namePath = path.split(".").map(part => 
	                js.sf(part, prefix)).join(".");

	        r = r || js.get(namePath, elem);
	    });
	    return r;
	}

// #1247.setValue(JSON.stringify(this.sel[0], function(key, value) { return ["parser", "type-resolved"].includes(key) ? undefined : value; }.bind(this)))

["Container", { 
	css: {
		"": "background-color: white; border-right: 1px solid silver;",
		".autowidth": "max-width: 320px;", ".ListCell": "max-width: 332px;"
	},
	
   	onDispatchChildEvent: function (component, name, evt, f, args) {
        if (name.indexOf("key") === 0) {
            var scope = this.scope();
            if (component === scope['search-input']) {
                if ([13, 27, 33, 34, 38, 40].indexOf(evt.keyCode) !== -1) {
                    this.qsa("List<>").forEach(function(list) {
	                    if (list.isVisible()) {
		                    if(evt.keyCode === 13 && list.getSelection().length === 0 && list.getCount()) {
		                        list.setSelection([0]);
		                    } else if(evt.keyCode === 27) {
				                scope['search-input'].setValue("");
				                scope['search-input'].fire("onChange", [true]); // FIXME
		                    }
	                        list.dispatch(name, evt);
	                    }
                    });
                    evt.preventDefault();
                }
            }
        }
        return this.inherited(arguments);
    },
	handlers: {
		"loaded": function() {
			var scope = this.scope(),  me = this;
			var workspaces = this.app().qsa("devtools/Workspace<>:root");
			var xsds = this.app().qsa("devtools/Editor<xsd>:root");
			
			var schema2ns = {};
			xsds.map(_ => _.vars("parser")).forEach(function(parser) {
				schema2ns[parser.schema] = parser.xmlns[''];
			});
			
			["stypes", "ctypes", "groups", "agroups", "elems", "attrs", "stars"].map(function(key) {
				scope[key].setArray(workspaces.reduce(function(arr, workspace) {
					var res = workspace.qsa("devtools/Editor<xsd>:root #" + key);
					return (arr = arr.concat(res.reduce(function(items, array) {
							return (items = items.concat(array._array || []));
						}, [])
					));
				}, []));
			});
			
			scope.stars.getArray().forEach(function(value, index, arr) {
				if(value.attribute) {
					value.minOccurs = value.attribute.xs['@_minOccurs'] || 1;
					value.maxOccurs = value.attribute.xs['@_maxOccurs'] || 1;
					value.documentation = js_getXs("%sannotation.%sdocumentation", js.get("attribute.xs", value)) , js_getXs("%sannotation.%sdocumentation", js.get("attribute.type-resolved", value));
					
					if(value.documentation && value.documentation['#text']) {
						value.documentation = value.documentation["#text"];
					}
				}
			});
			scope.allstars.setSource(scope.stars);

			this.qsa("List<>").forEach(list => list.setOnColumnGetValue(function(column, value, rowIndex, source) {
				if(value && column._attribute === '@__') {
					var schema = value.schema.split("/");
					return schema2ns[value.schema] + ":" + schema.pop();
				}
				return value;
			}));

			this.qsa("List<>").on("dblclick", function() {
				var list = this;
				this.up("devtools/Workspace<>:root").qsa("vcl/ui/Console#console").forEach(function(console) {
						list.getSelection(true).forEach(function(xselem) {
							console.print(xselem['@_name'] || xselem.name || "?", xselem);
						});
					});
			});
			
			this.qsa("List<>").on("selectionchange", function() {
				var selection = this.getSelection(true), desc;
				if((desc = this.udown("#description")) !== null) {
					desc.setVisible(selection.length > 0);
					desc.setContent("<ul><li>" +
						selection.map(_ => _.documentation || "no-documentation-available").filter(_ => _ !== undefined).join("</li><li>") + "</li></ul>");
				}
			});
			
		},
    
		"#search-input onChange": function() { 
			var me = this, scope = me.scope();
			
			function filter(object) {
				var values = me.getInputValue().toLowerCase().trim().split(" ");
				// var or = values.some(function(value) {
				// 	return Object.keys(object).some(function(key) {
				// 		return (""+object[key]).toLowerCase().indexOf(value) !== -1;
				// 	});
				// });
				var and = values.every(function(value) {
					return Object.keys(object).some(function(key) {
						return (""+object[key]).toLowerCase().indexOf(value) !== -1;
					});
				});
				
				return !and;
			}
			
			this.setTimeout("change", function() {
				var value = me.getInputValue();
				scope.stypes.setOnFilterObject(!value.length ? null : filter);
				scope.ctypes.setOnFilterObject(!value.length ? null : filter);
				scope.elems.setOnFilterObject(!value.length ? null : filter);
				scope.attrs.setOnFilterObject(!value.length ? null : filter);
				scope.groups.setOnFilterObject(!value.length ? null : filter);
				scope.agroups.setOnFilterObject(!value.length ? null : filter);
				scope.stars.setOnFilterObject(!value.length ? null : filter);
			}, 200);
		},
		"#allstars loaded": function() {}
	}
}, [

	["Array", "ctypes" ],
	["Array", "stypes" ],
	["Array", "groups" ],
	["Array", "agroups" ],
	["Array", "elems" ],
	["Array", "attrs" ],
	["Array", "stars" ],
	
	["Bar", [
		["Input", "search-input", { classes: "search-top" }],
	]],
	
	["Tabs", "tabs", { align: "bottom", classes: "bottom" }, [
		["Tab", { control: "console", text: locale("Console") }],
		["Tab", { control: "allstars", text: "*" || locale("-/Star.symbol"), selected: true }],
		["Tab", { control: "elements", text: locale("-/Element.plural") }],
		["Tab", { control: "attributes", text: locale("-/Attribute.plural") }],
		["Tab", { control: "complexTypes", text: locale("-/ComplexType.plural") }],
		["Tab", { control: "simpleTypes", text: locale("-/SimpleType.plural") }],
		["Tab", { control: "attributeGroups", text: locale("-/AttributeGroup.plural") }],
		["Tab", { control: "groupsl", text: locale("-/Group.plural") }]
	]],
	
	["Container", "description", { 
		align: "right", content: "<i>Documentation</i>", width: 300,
		css: "white-space: normal; padding: 16px; color: black;",
		visible: false
	}],

	["List", "attributes", { autoColumns: true, visible: false, source: "attrs"} ],
	["List", "elements", { autoColumns: true, visible: false, source: "elems"} ],
	["List", "complexTypes", { autoColumns: true, visible: false, source: "ctypes"} ],
	["List", "allstars", { autoColumns: true, visible: true, /*source: "stars" in onLoad */} ],
	["List", "groupsl", { autoColumns: true, visible: false, source: "groups"} ],
	["List", "attributeGroups", { autoColumns: true, visible: false, source: "agroups"} ],
	["List", "simpleTypes", { autoColumns: true, visible: false, source: "stypes"} ],

	["Console", "console", { visible: false }]
]];