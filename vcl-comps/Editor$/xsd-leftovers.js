
				findType: function(name) {
					var r = this.ctypes_map[name] || this.stypes_map[name];
					if(!r && typeof name === "string" && name.indexOf(":") === -1) {
						r = sf("%s:%s", xmlns[''], name);
						if((r = this.ctypes_map[r] || this.stypes_map[r])) {
							console.log("findType adjusted", name, r);
						}
					}
					return r || name;
				},

// Parser methods
	// function parseType(type, elem, prefix) {
	// 	var arr, name, ref, ext, base, path, subst;
	// 	var me = this;
		
	// 	// create debug info and optionally add attribute
	// 	function f(path, key, def, add_attr) {
	// 		var type;
	// 		function g(path, key, def) {
	// 			var obj = elem[at__][path] || (elem[at__][path] = {});
	// 			return (obj[key] = def);
	// 		}
			
	// 		g("attributes_qname", sf("%s/%s", prefix, def['@_name'] || key), def);

	// 		if(add_attr !== false) {
	// 			g("attributes", def['@_name'] || key, js.mixIn({ 
	// 				__path: path },def));
	// 			if((type = def['@_type'])) {
	// 				if((type = me.ctypes_map[type])) {
	// 					def['__type-resolved'] = type;
	// 				} else {
	// 					// me.log(elem, String.format("@_type %s not found", value['@_type']));
	// 				}
	// 			}
	// 		}
			
	// 		return g("__" + path, def['@_name'] || key, def);
	// 	}
		
	// 	function parseElement(el, i) {
	// 		var type, ref;
	// 		var name = el["@_name"];
	// 		var qname = sf("%s:%s", prefix, name);
			
	// 		if(el.complexType) {
	// 			f(path + "complexType", name, el);
	// 		} else if((ref = el["@_ref"])) {
	// 			if((ref = me.elems_map[ref])) {
	// 				el["__ref-resolved"] = ref;
	// 				// me.parseType(ref, elem, el['@_ref']);
	// 				f(path + "@_ref", String.format("%s", el['@_ref']), el);
	// 			} else {
	// 				me.log(elem, String.format("@_ref %s not found", el['@_ref']));
	// 			}
	// 		} else if((type = el["@_type"])) {
	// 			if((type = me.ctypes_map[type])) {
	// 				el["__type-resolved"] = type;
	// 				// me.parseType(type, elem, el['@_type']);
	// 				f(path + "@_type", name, type);
	// 			} else {
	// 				f(path + "@_type", el['@_type'], el);
	// 				// me.log(elem, String.format("@_type %s not found", el['@_type']));
	// 			}
	// 		}
	// 	}			

	// 	if((base = type['@_base'])) {
	// 		if((base = this.ctypes_map[base])) {
	// 			type["__base-resolved"] = base;
	// 			this.parseType(base, elem, type['@_base']);
	// 		} else {
	// 			this.log(elem, String.format("@_base %s not found", type['@_base']));
	// 		}
	// 	}
	// 	if((ref = type['@_ref'])) {
	// 		if((ref = this.elems_map[ref])) {
	// 			type["__ref-resolved"] = ref;
	// 			this.parseType(ref, elem, type['@_ref']);
	// 		} else {
	// 			this.log(elem, String.format("@_ref %s not found", type['@_ref']));
	// 		}
	// 	}
	// 	if((subst = type['@_substitutionGroup'])) {
	// 		if((subst = this.elems_map[subst])) {
	// 			type['@_substitutionGroup-resolved'] = subst;
	// 			// this.parseType(subst, elem, type['@_substitutionGroup']);
	// 		} else {
	// 			this.log(elem, String.format("@_substitutionGroup %s not found", type['@_substitutionGroup']));
	// 		}
	// 	}
	// 	if((ext = js.get("complexContent.extension", type))) {
	// 		this.parseType(ext, elem, prefix);
	// 	}
	// 	if((arr = asArray(js.get("attribute", type))).length) {
	// 		arr.forEach(function(attr, i) {
	// 			if((name = attr["@_name"])) {
	// 				f(sf("attribute/%d/@_name", i), String.format("%s/%s", (prefix||"?"), name), attr);
	// 			} else if((ref = attr["@_ref"]))	 {
	// 				// attr["__ref-resolved-a"] = ref;
	// 				f(sf("attribute/%d/@_ref", i), String.format("%s", ref), attr);
	// 			} else {
	// 				me.log(elem, "attribute?", el);
	// 			}
	// 		});
	// 	}
	// 	if((arr = asArray(js.get("sequence.element", type))).length) {
	// 		arr.forEach(function(obj, i) {
	// 			path = sf("sequence/element/%d/", i);
	// 			return parseElement.apply(this, arguments);
	// 		});
	// 	}
	// 	if((arr = asArray(js.get("sequence.sequence.element", type))).length) {
	// 		// path = "sequence.sequence.element/";
	// 		// arr.forEach(parseElement);
	// 		// arr.forEach(function(obj, i) {
	// 		// 	me.parseType(type, elem, prefix);
	// 		// });
	// 	}
	// 	if((arr = asArray(js.get("sequence.group", type))).length) {
	// 		arr.forEach(function(group, i) {
	// 			if((name = group["@_name"])) {
	// 				f(sf("sequence/group/%d/@_name", i), String.format("%s/%s", (prefix||"?"), name), group);
	// 				// this.log(elem, String.format(""))
	// 			} else if((ref = group['@_ref'])) {
	// 				f(sf("sequence/group/%d/@_ref", i), String.format("%s", ref), group, false);
	// 				if((ref = me.groups_map[ref])) {
	// 					group["__ref-resolved"] = ref;
	// 					me.parseType(ref, elem, group['@_ref']);
	// 				} else {
	// 					me.log(elem, [String.format("@_ref %s not found", group['@_ref']), group]);
	// 				}
	// 			}
				
	// 		});
	// 	}
	// }
	// function parseElement(elem) {
	// 	var parser = this, type;
	// 	if((type = elem['@_type'])) {
	// 		if((type = parser.ctypes_map[type])) {
	// 			// elem["__type-resolved"] = type;
	// 			elem[at__]['type-resolved'] = type;
	// 			parser.parseType(type, elem, elem['@_type']);
	// 		}
	// 	}
		
	// 	if((type = elem.complexType)) {
	// 		parser.parseType(type, elem, "complexType");
	// 	}
		
	// 	if((type = elem.simpleType)) {
	// 		parser.log(elem, "simpleType");
	// 	}
		
	// 	var __ = elem[at__];
	// 	if(__.attributes_qname) {
	// 		Object.keys(__.attributes_qname).forEach(function(key, i) {
	// 			var type = __.attributes_qname[key];
	// 			parser.attrs.push({ 
	// 				namespace: key.split(":")[0],
	// 				element: elem['@_name'],
	// 				name: key.split("/").pop(),
	// 				index: i,
	// 				type: key.split("/")[0].split(":").pop(),
	// 				xpath: (( __.attributes && __.attributes[key.split("/").pop()])||{}).__path,
	// 				documentation: js.get("annotation.documentation", type) || "",
	// 				'__elem': elem,
	// 				'__type': type,
	// 				'__name': key
	// 			});
	// 		});
	// 	}
	// }

// function parseElement(elem) {
// 		var parser = this, type;
// 		if((type = elem['@_type'])) {
// 			if((type = parser.ctypes_map[type])) {
// 				// elem["__type-resolved"] = type;
// 				elem[at__]['type-resolved'] = type;
// 				parser.parseType(type, elem, elem['@_type']);
// 			}
// 		}
		
// 		if((type = elem.complexType)) {
// 			parser.parseType(type, elem, "complexType");
// 		}
		
// 		if((type = elem.simpleType)) {
// 			parser.log(elem, "simpleType");
// 		}
		
// 		var __ = elem[at__];
// 		if(__.attributes_qname) {
// 			Object.keys(__.attributes_qname).forEach(function(key, i) {
// 				var type = __.attributes_qname[key];
// 				parser.attrs.push({ 
// 					namespace: key.split(":")[0],
// 					element: elem['@_name'],
// 					name: key.split("/").pop(),
// 					index: i,
// 					type: key.split("/")[0].split(":").pop(),
// 					xpath: (( __.attributes && __.attributes[key.split("/").pop()])||{}).__path,
// 					documentation: js.get("annotation.documentation", type) || "",
// 					'__elem': elem,
// 					'__type': type,
// 					'__name': key
// 				});
// 			});
// 		}
// 	}
// function parseType(type, elem, prefix) {
// 	var arr, name, ref, ext, base, path, subst;
// 	var me = this;
	
// 	// create debug info and optionally add attribute
// 	function f(path, key, def, add_attr) {
// 		var type;
// 		function g(path, key, def) {
// 			var obj = elem[at__][path] || (elem[at__][path] = {});
// 			return (obj[key] = def);
// 		}
		
// 		g("attributes_qname", sf("%s/%s", prefix, def['@_name'] || key), def);

// 		if(add_attr !== false) {
// 			g("attributes", def['@_name'] || key, js.mixIn({ 
// 				__path: path },def));
// 			if((type = def['@_type'])) {
// 				if((type = me.ctypes_map[type])) {
// 					def['__type-resolved'] = type;
// 				} else {
// 					// me.log(elem, String.format("@_type %s not found", value['@_type']));
// 				}
// 			}
// 		}
		
// 		return g("__" + path, def['@_name'] || key, def);
// 	}
	
// 	function parseElement(el, i) {
// 		var type, ref;
// 		var name = el["@_name"];
// 		var qname = sf("%s:%s", prefix, name);
		
// 		if(el.complexType) {
// 			f(path + "complexType", name, el);
// 		} else if((ref = el["@_ref"])) {
// 			if((ref = me.elems_map[ref])) {
// 				el["__ref-resolved"] = ref;
// 				// me.parseType(ref, elem, el['@_ref']);
// 				f(path + "@_ref", String.format("%s", el['@_ref']), el);
// 			} else {
// 				me.log(elem, String.format("@_ref %s not found", el['@_ref']));
// 			}
// 		} else if((type = el["@_type"])) {
// 			if((type = me.ctypes_map[type])) {
// 				el["__type-resolved"] = type;
// 				// me.parseType(type, elem, el['@_type']);
// 				f(path + "@_type", name, type);
// 			} else {
// 				f(path + "@_type", el['@_type'], el);
// 				// me.log(elem, String.format("@_type %s not found", el['@_type']));
// 			}
// 		}
// 	}			

// 	if((base = type['@_base'])) {
// 		if((base = this.ctypes_map[base])) {
// 			type["__base-resolved"] = base;
// 			this.parseType(base, elem, type['@_base']);
// 		} else {
// 			this.log(elem, String.format("@_base %s not found", type['@_base']));
// 		}
// 	}
// 	if((ref = type['@_ref'])) {
// 		if((ref = this.elems_map[ref])) {
// 			type["__ref-resolved"] = ref;
// 			this.parseType(ref, elem, type['@_ref']);
// 		} else {
// 			this.log(elem, String.format("@_ref %s not found", type['@_ref']));
// 		}
// 	}
// 	if((subst = type['@_substitutionGroup'])) {
// 		if((subst = this.elems_map[subst])) {
// 			type['@_substitutionGroup-resolved'] = subst;
// 			// this.parseType(subst, elem, type['@_substitutionGroup']);
// 		} else {
// 			this.log(elem, String.format("@_substitutionGroup %s not found", type['@_substitutionGroup']));
// 		}
// 	}
// 	if((ext = js.get("complexContent.extension", type))) {
// 		this.parseType(ext, elem, prefix);
// 	}
// 	if((arr = asArray(js.get("attribute", type))).length) {
// 		arr.forEach(function(attr, i) {
// 			if((name = attr["@_name"])) {
// 				f(sf("attribute/%d/@_name", i), String.format("%s/%s", (prefix||"?"), name), attr);
// 			} else if((ref = attr["@_ref"]))	 {
// 				// attr["__ref-resolved-a"] = ref;
// 				f(sf("attribute/%d/@_ref", i), String.format("%s", ref), attr);
// 			} else {
// 				me.log(elem, "attribute?", el);
// 			}
// 		});
// 	}
// 	if((arr = asArray(js.get("sequence.element", type))).length) {
// 		arr.forEach(function(obj, i) {
// 			path = sf("sequence/element/%d/", i);
// 			return parseElement.apply(this, arguments);
// 		});
// 	}
// 	if((arr = asArray(js.get("sequence.sequence.element", type))).length) {
// 		// path = "sequence.sequence.element/";
// 		// arr.forEach(parseElement);
// 		// arr.forEach(function(obj, i) {
// 		// 	me.parseType(type, elem, prefix);
// 		// });
// 	}
// 	if((arr = asArray(js.get("sequence.group", type))).length) {
// 		arr.forEach(function(group, i) {
// 			if((name = group["@_name"])) {
// 				f(sf("sequence/group/%d/@_name", i), String.format("%s/%s", (prefix||"?"), name), group);
// 				// this.log(elem, String.format(""))
// 			} else if((ref = group['@_ref'])) {
// 				f(sf("sequence/group/%d/@_ref", i), String.format("%s", ref), group, false);
// 				if((ref = me.groups_map[ref])) {
// 					group["__ref-resolved"] = ref;
// 					me.parseType(ref, elem, group['@_ref']);
// 				} else {
// 					me.log(elem, [String.format("@_ref %s not found", group['@_ref']), group]);
// 				}
// 			}
			
// 		});
// 	}
// }

		// if((base = type['@_base'])) {
		// 	if((base = this.ctypes_map[base])) {
		// 		type["__base-resolved"] = base;
		// 		this.parseType(base, elem, type['@_base']);
		// 	} else {
		// 		this.log(elem, String.format("@_base %s not found", type['@_base']));
		// 	}
		// }
		// if((ref = type['@_ref'])) {
		// 	if((ref = this.elems_map[ref])) {
		// 		type["__ref-resolved"] = ref;
		// 		this.parseType(ref, elem, type['@_ref']);
		// 	} else {
		// 		this.log(elem, String.format("@_ref %s not found", type['@_ref']));
		// 	}
		// }
		// if((subst = type['@_substitutionGroup'])) {
		// 	if((subst = this.elems_map[subst])) {
		// 		type['@_substitutionGroup-resolved'] = subst;
		// 		// this.parseType(subst, elem, type['@_substitutionGroup']);
		// 	} else {
		// 		this.log(elem, String.format("@_substitutionGroup %s not found", type['@_substitutionGroup']));
		// 	}
		// }
		// if((ext = js.get("complexContent.extension", type))) {
		// 	this.parseType(ext, elem, prefix);
		// }
		
