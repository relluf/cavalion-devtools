// "use strict"; var locale = window.locale, $ = window.$, $i = window.$i, js = window.js;

var XSD_NS = "http://www.w3.org/2001/XMLSchema";
var XS_NAMESPACE_PREFIXES = ['', 'xs:', 'xsd:'];
var at__ = "@__";
var sf = String.format;

	function asArray(arr) {
		if(arr === null || arr === undefined) return [];
		if(!(arr instanceof Array)) return [arr];
		return arr;
	}
	function xsArray(path, obj) {
		var r = [];
		path = path.split(".");
		XS_NAMESPACE_PREFIXES.forEach(function(ns) {
			var namePath = sf("%s%s", ns, path.join("." + ns));
			r = r.concat(asArray(js.get(namePath, obj)));
		});
		return r;
	}
	
	function js_getXs(path, elem) {
	    var r;
	    XS_NAMESPACE_PREFIXES.some(function(prefix) {
	        var namePath = path.split(".").map(part => 
	                js.sf(part, prefix)).join(".");
	
	        r = r || js.get(namePath, elem);
	    });
	    return r;
	}
	
	function onDblClick() { 
		// var console = this.scope().console; 
		var console = this.up("devtools/Workspace<>").down("vcl/ui/Console#console");
		this.getSelection(true).map(_ => console.print(_.__name || _['@_name'] || _.name, _));
		// this.scope().tabs.getControl(0).setSelected(true);
		
	}
	function resolveUri(uri, me) {
		var url_map = me.vars(["devtools/Editor<xsd>/url_map"]) || {};
		var v = url_map[uri];
		if(v) { return v; }
		
		
		if(uri.indexOf("https://schema.broservices.nl/") === 0) {
			uri = "Library/schema.broservices.nl/" + uri.substring("https://schema.broservices.nl/".length);
		} else if(uri.indexOf("http://schemas.opengis.net/") === 0) {
			uri = "Library/opengis.net/" + uri.substring("http://schemas.opengis.net/".length);
		} else if(uri.indexOf("http://www.w3.org/1999/") === 0 || uri.indexOf("http://www.w3.org/2001/") === 0) {
			uri = "Library/opengis.net/" + uri.substring("http://www.w3.org/1999/".length);
		} else if(uri.indexOf("/") === -1) {
			uri = js.up(me.vars(["resource.uri", true])) + "/" + uri;
		}
		return uri;
	}
	function parserNeeded(workspace, uri, callback, once) {
		var tab = workspace.qs("#editor-needed").execute({
			dontBringToFront: true,
			resource: { uri: uri }});
		var parser = tab.qs(":root");
		if(parser && (parser = parser.vars("parser"))) {
			callback(parser);
		} else {
			// callback everytime or just once (which is default)
			tab[!once ? "on" : "once"]("resource-rendered", function() {
				parserNeeded(workspace, uri, callback, once);
			});
		}
	}
	
var xsTypes = {};
["ID","anyType","anyURI","boolean","complexContent/extension","date","dateTime",
"decimal","double","duration","integer","nonNegativeInteger","positiveInteger",
"string","time","xs:anyURI","xs:boolean","xs:dateTime","xs:decimal","xs:double",
"xs:duration","xs:integer","xs:string"].map(_ => (xsTypes[_] = {xstype: _}));

$(["devtools/Editor<xml>"], { 
	handlers: {
		"loaded": function() {
	        var tab = this.up("vcl/ui/Tab"), scope = this.scope();
			tab.on("resource-loaded", function() {
				scope.render.setTimeout("execute", 500);
			});
		},
		"#elements onDblClick": onDblClick,
		"#complexTypes onDblClick": onDblClick,
		"#simpleTypes onDblClick": onDblClick,
		"#attributes onDblClick": onDblClick,
		"#imports onDblClick": function(evt) {
			var action = this.up("devtools/Workspace<>").down("#editor-needed");
			var me = this; evt = evt || {};
			this.getSelection(true).forEach(function(imp) {
				var uri = resolveUri(imp['@_schemaLocation'], me);
				var tab = action.execute({
					dontBringToFront: evt.altKey !== false,
					selected: evt.altKey === true,
					resource: { uri: uri }
				});
				var root = tab._control.down(":root");
				if(!root) {
					// tab.setIndex(0);
					// tab.setSelected(true);
					me.up("devtools/Workspace<>").down("devtools/OpenTabs<>").dispatch("activate", {});
				}
				// console.log({ tab: tab, root: root });
			});
		},
		"#search-input onChange": function() { 
			var me = this, scope = me.scope();
			
			function filter(object) {
				var values = me.getInputValue().toLowerCase().trim().split(" ");
				var or = values.some(function(value) {
					return Object.keys(object).some(function(key) {
						return (""+object[key]).toLowerCase().indexOf(value) !== -1;
					});
				});
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
				scope.stars.setOnFilterObject(!value.length ? null : filter);
			}, 200);
		} 
	}
}, [

	$i(("render"), {
		onExecute: function() {

	// Setup vars
			var r = this.inherited(arguments);
			var app = this.app(), scope = this.scope(), me = this;
			var resource = this.vars(["resource", true]);
			var workspace = this.up("devtools/Workspace<>:root");
			var schema_id = resource.uri.split("/").splice(2).join("/");

	// Determine xs:schema node and ns_prefix (ie. none, xs: or xsd:)
			var root = this.vars(["root"]), schema, ns_prefix;
			XS_NAMESPACE_PREFIXES.some(function(prefix) {
				ns_prefix = prefix;
				schema = root[ns_prefix + "schema"];
				return root.hasOwnProperty(prefix + "schema");
			});

	// Parse namespaces and determine default namespace (ie. xmlns[''])
			var xmlns = {};
			schema && Object.keys(schema).forEach(function(key) { 
				if(key.indexOf('@_xmlns:') === 0) {
					xmlns[key.split(":").pop()] = schema[key];
					if(schema['@_targetNamespace'] === schema[key]) {
						xmlns[''] = key.split(":").pop();
					}
				}
			});
			
	 // Gather parser context, types and definitions			
			var parser = {
				root: root, xmlns: xmlns, schema: schema_id, ns_prefix: ns_prefix,
				
				included_stypes: {}, included_ctypes: {}, included_elems: {},
				included_groups: {}, included_imps: {}, included_attrs: {},
				included_agroups: {},
				
				stamp: function(xsel) {
					if(!js.get(at__ + ".parser", xsel)) {
						js.set(at__ + ".parser", this, xsel);
					}
					if(!js.get(at__ + ".schema", xsel)) {
						js.set(at__ + ".schema", schema_id, xsel);
					}
					if(!js.get(at__ + ".xmlns", xsel)) {
						js.set(at__ + ".xmlns", xmlns[''], xsel);
					}
				},
				
				imps: xsArray("import", schema).concat(
					xsArray("schema.include", root)
						.map(function(include) {
							include['@_namespace'] = schema['@_targetNamespace'];
							js.set(at__ + ".include", true, include);
							return include;
						})
				),
				stars: [],
				attrs: xsArray("attribute", schema),
				elems: xsArray("element", schema),
				ctypes: xsArray("complexType", schema),
				stypes: xsArray("simpleType", schema),
				groups: xsArray("group", schema),
				agroups: xsArray("attributeGroup", schema),

				// imps_map: workspace.vars(["devtools/Editor<xsd>/imps_map", false, {}]),
				elems_map: workspace.vars("devtools/Editor<xsd>/elems_map", false, {}),
				attrs_map: workspace.vars("devtools/Editor<xsd>/attrs_map", false, {}),
				ctypes_map: workspace.vars("devtools/Editor<xsd>/ctypes_map", false, {}),
				stypes_map: workspace.vars("devtools/Editor<xsd>/stypes_map", false, {}),
				groups_map: workspace.vars("devtools/Editor<xsd>/groups_map", false, {}),
				agroups_map: workspace.vars("devtools/Editor<xsd>/agroups_map", false, {}),

				log: function(elem, msg) {
					if(msg instanceof Array) {
						scope.console.print(msg[0], msg.splice(1));
					} else {
						scope.console.print(msg, elem);
					}
					(elem[at__].messages 
							= elem[at__].messages || []).push(msg);
				},
				parse: function() {
// workspace.print(schema_id, this);
					this.stypes.forEach(this.parseSimpleType, this);
					this.ctypes.forEach(this.parseComplexType, this);
					this.agroups.forEach(this.parseAttributeGroup, this);
					this.groups.forEach(this.parseGroup, this);
					this.imps.forEach(this.parseImport, this);
					
					this.attrs.forEach(this.parseAttribute, this);
					this.elems.forEach(this.parseElement, this);
					
					this.elems.forEach(function(elem) {
						var at = elem[at__];
						for(var k in at.features) {
							var attribute = at.features[k];
							this.stars.push({
								xmlns: at.xmlns,
								namespace: attribute.namespace,
								namespace_type: attribute.namespace_type,
								name: k,
								element: elem['@_name'],
								kind: attribute.kind,
								type: attribute.type,
								schema: at.schema,
								attribute: attribute
							});
						}
					}, this);
					this.ctypes.forEach(function(ctype) {
						var at = ctype[at__];
						for(var k in at.features) {
							var attribute = at.features[k];
							this.stars.push({
								xmlns: at.xmlns,
								namespace: attribute.namespace,
								namespace_type: attribute.namespace_type,
								name: k,
								complexType: ctype['@_name'],
								kind: attribute.kind,
								type: attribute.type,
								schema: at.schema,
								attribute: attribute
							});
						}
					}, this);
				},
				
				findType: function(name) {
					return this.ctypes_map[name] || this.stypes_map[name] || xsTypes[name];
				},
				findGroup: function(name) {
					return this.groups_map[name];
				},
				findAttributeGroup: function(name) {
					return this.agroups_map[name];
				},
				findElement: function(name) {
					// console.log("findElement", name, this.elems_map[name]);
					return this.elems_map[name];
				},

				parseImport: function(xselem) {
					this.stamp(xselem);
					
					var uri = resolveUri(xselem['@_schemaLocation'], me);
					xselem[at__].uri = uri;
					this.inheritImport(xselem, uri, parser);
				},
				parseSimpleType: function(xselem, i) {
					this.stypes_map[xmlns[''] + ":" + xselem['@_name']] = xselem;
					this.stamp(xselem);
					// js.set(at__ + ".source", "simpleType", xselem);
				},
				parseAttributeGroup: function(xselem, i) {
					this.agroups_map[xmlns[''] + ":" + xselem['@_name']] = xselem;
					// if(xselem[at__] === undefined) {
						this.stamp(xselem);
						// js.set(at__ + ".source", "attributeGroup", xselem);
						this.inheritAttributeGroup(xselem, xselem, xselem['@_name']);
					// }
					this.stamp(xselem);
					this.inheritAttributeGroup(xselem, xselem, "root");
				},
				parseGroup: function(xselem, i) {
					this.groups_map[xmlns[''] + ":" + xselem['@_name']] = xselem;
					// if(xselem[at__] === undefined) {
						this.stamp(xselem);
						// js.set(at__ + ".source", "group", xselem);
						this.inheritGroup(xselem, xselem, xselem['@_name']);
					// }
					this.stamp(xselem);
					// js.set(at__ + ".source", "attribute", xselem);
					this.inheritGroup(xselem, xselem, "root");
				},
				parseComplexType: function(xselem, i) {
					this.ctypes_map[xmlns[''] + ":" + xselem['@_name']] = xselem;
					// js.set(at__ + ".source", "complexType", xselem);
					// if(xselem[at__] === undefined) {
						this.stamp(xselem);
						this.inheritType(xselem, xselem, xselem['@_name']);
					// }
				},
				parseElement: function(xselem, i) {
					this.elems_map[xmlns[''] + ":" + xselem['@_name']] = xselem;
					// if(xselem[at__] === undefined) {
						this.stamp(xselem);
						// js.set(at__ + ".source", "element", xselem);
						
						var base, type, ref;
						
						// this.inheritElement for symmetry?
						// this.inheritElement(xselem, xselem, xselem['@_name'])
						if(xselem['@_base']) {
me.print("parseElement.@_base", xselem);
							throw new Error("Unexpected");
						} else if(xselem['@_type']) {
							if((type = this.findType(xselem['@_type']))) {
								js.set(at__ + ".type-resolved", type, xselem);
								this.inheritType(xselem, type, xselem['@_type']);
							} else {
								this.log(xselem, sf("@_type %s not found (291)", xselem['@_type']));
							}
						} else if(xselem[sf("%scomplexType", ns_prefix)]) {
							this.inheritType(xselem, xselem.complexType, "inline?");	
						} else {
me.print("parseElement.notHandled", xselem);
						}
					// }
				},
				parseAttribute: function(xselem, i) {
					this.attrs_map[xmlns[''] + ":" + xselem['@_name']] = xselem;
					this.stamp(xselem);
					// js.set(at__ + ".source", "attribute", xselem);
					this.inheritAttribute(xselem, xselem, "root");
				},

				inheritImport: function(xselem, uri, parser) {
					if(js.get(at__ + ".include", xselem) === true) {
						// not used
						["stypes", "ctypes", "groups", "elems", "attrs"].map(function(key) {
							this["included_" + key][uri] = [].concat(parser[key]);
						}, this);
						
						// Really necessary?
						me.up().setTimeout("refresh", function() {
							this.reflect();
						}.bind(this), 200);
					}
				},			
				inheritType: function(xselem, xstype, xstype_name, as_base) {
					var base;
					if(xstype['@_base']) {
						if((base = this.findType(xstype['@_base']))) {
							js.set(at__ + ".base-resolved", base, xstype);
							this.inheritType(xselem, base, xstype_name);//xstype['@_base']);
						} else {
							this.log(xselem, sf("@_base %s not found", xstype['@_base']));
						}
					}
					if(xstype['@_ref']) {
						console.log("inheritType.@_ref", xselem, xstype);
					}
					if(xstype['@_substitutionGroup']) {
						console.log("inheritType.@_substitutionGroup", xselem, xstype);
					}
					xsArray("simpleContent.extension", xstype).map(function(xsext, i) {
						this.stamp(xsext);
						this.inheritType(xselem, xsext, "simpleContent/extension");
					}, this);
					xsArray("complexContent.extension", xstype).map(function(xsext, i) {
						this.stamp(xsext);
						this.inheritType(xselem, xsext, "complexContent/extension");
					}, this);
					xsArray("attribute", xstype).map(function(xsattr, i) {
						this.stamp(xsattr);
						this.inheritAttribute(xselem, xsattr, xstype_name);
					}, this);
					xsArray("attributeGroup", xstype).map(function(xsattributegroup, i) {
						this.stamp(xsattributegroup);
						this.inheritAttributeGroup(xselem, xsattributegroup, xstype_name);
					}, this);
					xsArray("sequence.group", xstype).map(function(xsgroup, i) {
						this.stamp(xsgroup);
						this.inheritGroup(xselem, xsgroup, xstype_name);
					}, this);
					xsArray("sequence.attributeGroup", xstype).map(function(xsattributegroup, i) {
						this.stamp(xsattributegroup);
						this.inheritAttributeGroup(xselem, xsattributegroup, xstype_name);
					}, this);
					xsArray("sequence.element", xstype).map(function(xsel, i) {
						this.stamp(xsel);
						this.inheritElement(xselem, xsel, xsel['@_type']);
					}, this);
					xsArray("choice.element", xstype).map(function(xsel, i) {
						this.stamp(xsel);
						this.inheritElement(xselem, xsel, xsel['@_type']);
					}, this);
					xsArray("sequence.sequence.element", xstype).map(function(xsel, i) {
						this.stamp(xsel);
						this.inheritElement(xselem, xsel, xstype_name);
					}, this);
				},
				inheritAttribute: function(xselem, xsattribute, xsattribute_name) {
					var ref = xsattribute['@_ref'], type;
					var name = xsattribute['@_name'] || ref;
					
					if(ref) {
						if(!(type = this.attrs_map[ref])) {
							this.log(xselem, sf("@_ref %s not found", ref));
						}
					} else if(xsattribute.xs) {
						this.log(xselem, ">>> xsattribute.xs")
						if((type = js_getXs("%scomplexType.%ssimpleContent.%srestriction.@_base", xsattribute))) {
							// %scomplexType.%ssimpleContent.%srestriction.@_base
						}
						this.log(xselem, ["not understood", xsattribute, xsattribute_name]);
					} else {
						// this.log(xselem, "!!! xsattribute.xs")
						if(!(type = this.findType(xsattribute['@_type'] || xsattribute_name))) {
							
							this.log(xselem, sf("@_type .%s. not found (380)", xsattribute['@_type'] || xsattribute_name));
						}
					}

					var info, x;
					js.set(at__ + ".features." + name, (info = {
						namespace: xsattribute[at__].xmlns,
						reference: !!ref,
						kind: "attribute", 
						type: ref || xsattribute['@_type'] || xsattribute_name,
						'type-resolved': type,
						cardinality: [
							typeof (x=xsattribute['@_minOccurs']) === "number" ? x : x || 1, 
							typeof (x=xsattribute['@_maxOccurs']) === "number" ? x : x || 1
						].join("-"),
						xs: xsattribute
					}), xselem);
					
					if(info['type-resolved']) {
						/*- TODO not foolproof yet */
						info.namespace_type = js.get(sf("type-resolved.%s.xmlns", at__), info);
					}
					
				},
				inheritElement: function(xselem, xsel, xsel_name) {
					var ref = xsel['@_ref'], name = xsel['@_name'] || ref;
					var info = {
						namespace: xsel[at__].xmlns,
						kind: "element", 
						type: xsel_name,
						cardinality: [
							typeof (x=xsel['@_minOccurs']) === "number" ? x : x || 1, 
							typeof (x=xsel['@_maxOccurs']) === "number" ? x : x || 1
						].join("-"),
						xs: xsel
					};

					if(ref) {
						info.type = ref;
						info.reference = true;
						if(!(info['type-resolved'] = this.elems_map[ref])) {
							this.log(xselem, sf("@_ref %s not found", ref));
						}
					} else if((type = js_getXs("%scomplexType", xsel))) {
						// %scomplexType.%ssimpleContent.%srestriction.@_base
						
							// this.log(xselem, "LOOKIE-LOOKIE-1");
							// this.log(xselem, ["not understood-1", xsel, xsel_name]);
							// this.log(xselem, info['type-resolved'] = this.parseComplexType(type, -1));
							
					} else if(!(info['type-resolved'] = this.findType(info.type))) {
						this.log(xselem, sf("type %s not found (415)", info.type || name));
					}
					
					if(info['type-resolved']) {
						/*- TODO not foolproof yet */
						info.namespace_type = js.get(sf("type-resolved.%s.xmlns", at__), info);
					}
					
					js.set(at__ + ".features." + name, info, xselem);
				},
				inheritGroup: function(xselem, xsgroup, xsgroup_name) {
					var ref;
					if(xsgroup['@_ref']) {
						if((ref = this.findGroup(xsgroup['@_ref']))) {
							js.set(at__ + ".ref-resolved", ref, xsgroup);
							this.inheritType(xselem, ref, xsgroup['@_ref']);
						} else {
							this.log(xselem, sf("@_ref %s not found", xsgroup['@_ref']));
						}
					}
				},
				inheritAttributeGroup: function(xselem, xsattributegroup, xsattributegroup_name) {
					var ref;
					if((ref = xsattributegroup['@_ref'])) {
						if((ref = this.findAttributeGroup(ref))) {
							js.set(at__ + ".ref-resolved", ref, xsattributegroup);
							this.inheritAttributeGroup(xselem, ref, xsattributegroup['@_ref']);
						} else {
							this.log(xselem, sf("@_ref %s not found", xsattributegroup['@_ref']));
						}
					}
					
					xsArray("attributeGroup", xsattributegroup).map(function(xsattrgroup, i) {
						this.stamp(xsattrgroup);
						this.inheritAttributeGroup(xselem, xsattrgroup, xsattrgroup['@ref']);
					}, this);

					["", "xs:", "xsd:"].map(function(ns_prefix) {
						xsArray("attribute", xsattributegroup).map(function(xsattr, i) {
							this.stamp(xsattr);
							this.inheritAttribute(xselem, xsattr, xsattr['@_name']);
						}, this);
					}, this);

				},
				
				reflect: function() { 
					var me = this; // Reflect UI (fill grids)
					
					function sort_name(i1, i2) {
						return i1['@_name'] < i2['@_name'] ? -1 : 1;
					}
					
					["stypes", "ctypes", "groups", "agroups", "elems", "attrs", "stars"].map(function(key) {
						var included = [];
						for(var k in me["included_" + key]) {
							included = included.concat(me["included_" + key][k]);
						}
						scope[key].setArray(me[key].concat(included).sort(sort_name));
					});

					scope.imps.setArray(this.imps);
				}
			};
			
			parser.parse();
			parser.reflect();

	// Sort columns			
			var sorted = [].concat(scope.elements._columns).sort(function(c1, c2) {
				return c1._attribute < c2._attribute ? -1 : 1;
			});
			scope.elements._columns.forEach(function(col) {
				col.setIndex(sorted.indexOf(col));
			});
			
	// Report and emit
			scope.console.print("parser", parser);

			this.up(":root").vars("parser", parser);
			this.up("vcl/ui/Tab").emit("resource-rendered", [this]);
			
	// generateCode(parser);

			return r;
		}
	}),
	
	$(("vcl/data/Array"), "imps"),
	$(("vcl/data/Array"), "stars"),
	$(("vcl/data/Array"), "attrs"),
	$(("vcl/data/Array"), "groups"),
	$(("vcl/data/Array"), "agroups"),
	$(("vcl/data/Array"), "elems"),
	$(("vcl/data/Array"), "ctypes"),
	$(("vcl/data/Array"), "stypes"),
   
    $i(("output"), [
    	$(("vcl/ui/Bar"), [
    		$("vcl/ui/Input", "search-input", { classes: "search-top" }),
    	]),
	    $i(("tabs"), [
	    	$("vcl/ui/Tab", { text: locale("-/Import.plural"), control: "imports"  }),
	    	$("vcl/ui/Tab", { text: "*" || locale("-/Star.symbol"), control: "allstars"}),
	    	$("vcl/ui/Tab", { text: locale("-/Attribute.plural"), control: "attributes"}),
	    	$("vcl/ui/Tab", { text: locale("-/Element.plural"), control: "elements" }),
	    	$("vcl/ui/Tab", { text: locale("-/ComplexType.plural"), control: "complexTypes" }),
	    	$("vcl/ui/Tab", { text: locale("-/Group.plural"), control: "groupsl" }),
	    	$("vcl/ui/Tab", { text: locale("-/SimpleType.plural"), control: "simpleTypes" }),
	    	$("vcl/ui/Tab", { text: locale("-/AttributeGroup.plural"), control: "attributeGroups" })
	    ]),
	    $i(("console"), { visible: false }),
	    $("vcl/ui/List", "imports", { autoColumns: true, source: "imps", visible: false, onDblClick: onDblClick }),
	    $("vcl/ui/List", "allstars", { autoColumns: true, source: "stars", visible: false, onDblClick: onDblClick }),
	    $("vcl/ui/List", "attributes", { autoColumns: true, source: "attrs", visible: false, onDblClick: onDblClick }),
	    $("vcl/ui/List", "elements", { autoColumns: true, source: "elems", visible: false, onDblClick: onDblClick }),
	    $("vcl/ui/List", "complexTypes", { autoColumns: true, source: "ctypes", visible: false, onDblClick: onDblClick }),
	    $("vcl/ui/List", "groupsl", { autoColumns: true, source: "groups", visible: false, onDblClick: onDblClick }),
	    $("vcl/ui/List", "attributeGroups", { autoColumns: true, source: "agroups", visible: false, onDblClick: onDblClick }),
	    $("vcl/ui/List", "simpleTypes", { autoColumns: true, source: "stypes", visible: false, onDblClick: onDblClick })
    ])

]);