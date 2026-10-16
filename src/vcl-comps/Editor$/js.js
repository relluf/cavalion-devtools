"acorn";

const NAV_ITEMS_VAR = "js-toplevel-nav-items";
const NAV_ELEMENTS_VAR = "js-toplevel-nav-elements";
const NAV_SOURCE_VAR = "js-toplevel-nav-source";
const NAV_SYMBOLS_VAR = "js-toplevel-nav-symbols";

const acorn = require("acorn");
const normalizeSymbolText = (text) => (text || "").replace(/\s+/g, " ").trim();
const lineOfIndex = (line_starts, index) => {
	var lo = 0, hi = line_starts.length - 1, mid;

	while(lo <= hi) {
		mid = (lo + hi) >> 1;
		if(line_starts[mid] <= index) {
			if(mid === line_starts.length - 1 || line_starts[mid + 1] > index) {
				return mid;
			}
			lo = mid + 1;
		} else {
			hi = mid - 1;
		}
	}

	return 0;
};
const maskJavaScript = (source) => {
	var out = source.split("");
	var line_starts = [0];
	var state = "";
	var quote = "";
	var template_depth = 0;

	for(var i = 0; i < source.length; ++i) {
		var ch = source.charAt(i);
		var next = source.charAt(i + 1);

		if(ch === "\n") {
			line_starts.push(i + 1);
			if(state === "line-comment") {
				state = "";
			}
			continue;
		}

		if(state === "line-comment") {
			out[i] = " ";
			continue;
		}
		if(state === "block-comment") {
			out[i] = " ";
			if(ch === "*" && next === "/") {
				out[++i] = " ";
				state = "";
			}
			continue;
		}
		if(state === "string") {
			out[i] = " ";
			if(ch === "\\") {
				out[++i] = source.charAt(i) === "\n" ? "\n" : " ";
			} else if(ch === quote) {
				state = "";
			}
			continue;
		}
		if(state === "template") {
			out[i] = " ";
			if(ch === "\\") {
				out[++i] = source.charAt(i) === "\n" ? "\n" : " ";
			} else if(ch === "`" && template_depth === 0) {
				state = "";
			} else if(ch === "$" && next === "{") {
				out[++i] = " ";
				++template_depth;
				state = "";
			}
			continue;
		}

		if(ch === "/" && next === "/") {
			out[i] = out[++i] = " ";
			state = "line-comment";
		} else if(ch === "/" && next === "*") {
			out[i] = out[++i] = " ";
			state = "block-comment";
		} else if(ch === "\"" || ch === "'") {
			out[i] = " ";
			quote = ch;
			state = "string";
		} else if(ch === "`") {
			out[i] = " ";
			template_depth = 0;
			state = "template";
		} else if(ch === "}" && template_depth > 0) {
			--template_depth;
			state = "template";
		}
	}

	return {
		text: out.join(""),
		lineStarts: line_starts
	};
};
const depthAtLines = (masked, line_count) => {
	var depths = new Array(line_count);
	var depth = 0;
	var line = 0;
	var line_depth_set = false;

	depths[0] = 0;
	for(var i = 0; i < masked.length; ++i) {
		var ch = masked.charAt(i);
		if(ch === "\n") {
			++line;
			depths[line] = depth;
			line_depth_set = false;
			continue;
		}
		if(!line_depth_set && !/\s/.test(ch)) {
			depths[line] = depth;
			line_depth_set = true;
		}
		if(ch === "{") {
			++depth;
		} else if(ch === "}") {
			depth = Math.max(0, depth - 1);
		}
	}

	return depths;
};
const findMatchingBrace = (masked, open_index) => {
	var depth = 0;

	for(var i = open_index; i < masked.length; ++i) {
		var ch = masked.charAt(i);
		if(ch === "{") {
			++depth;
		} else if(ch === "}") {
			--depth;
			if(depth === 0) {
				return i;
			}
		}
	}

	return -1;
};
const findDefineBody = (masked, line_starts) => {
	var match = /\bdefine\s*\([\s\S]*?\bfunction\b[^{]*\{/m.exec(masked);
	var open;
	var close;

	if(!match) {
		return null;
	}

	open = masked.indexOf("{", match.index);
	close = findMatchingBrace(masked, open);
	if(open === -1 || close === -1) {
		return null;
	}

	return {
		start: lineOfIndex(line_starts, open) + 1,
		end: lineOfIndex(line_starts, close) - 1,
		depth: (masked.substring(0, open + 1).match(/\{/g) || []).length -
			(masked.substring(0, open + 1).match(/\}/g) || []).length
	};
};
const symbolFromLine = (line) => {
	var text = line.replace(/^\s*(?:export\s+)?(?:default\s+)?/, "");
	var match;

	if((match = text.match(/^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\b/))) {
		return { name: match[1], type: "function" };
	}
	if((match = text.match(/^class\s+([A-Za-z_$][\w$]*)\b/))) {
		return { name: match[1], type: "class" };
	}
	if((match = text.match(/^(?:const|let|var)\s+([A-Za-z_$][\w$]*)\b/))) {
		return { name: match[1], type: "var" };
	}
	if((match = text.match(/^([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*=\s*(?:async\s+)?(?:function\b|\([^)]*\)\s*=>|[A-Za-z_$][\w$]*\s*=>)/))) {
		return { name: match[1], type: "assignment" };
	}
	if((match = text.match(/^(?:exports\.([A-Za-z_$][\w$]*)|module\.exports)\s*=/))) {
		return { name: match[1] || "module.exports", type: "export" };
	}

	return null;
};
const getAstName = (node, source) => {
	if(!node) return "";
	if(node.type === "Identifier" || node.type === "PrivateIdentifier") {
		return node.name || "";
	}
	if(node.type === "Literal") {
		return String(node.value);
	}
	if(node.type === "ThisExpression") {
		return "this";
	}
	if(node.type === "Super") {
		return "super";
	}
	if(node.type === "MemberExpression") {
		var object = getAstName(node.object, source);
		var property = getAstName(node.property, source);
		if(!object || !property) {
			return source.substring(node.start, node.end);
		}
		return node.computed ? js.sf("%s[%s]", object, property) : js.sf("%s.%s", object, property);
	}
	if(typeof node.start === "number" && typeof node.end === "number") {
		return source.substring(node.start, node.end);
	}
	return "";
};
const getFunctionParams = (node, source) => {
	if(!node || !node.params) return "";
	return node.params.map(param => normalizeSymbolText(source.substring(param.start, param.end))).join(", ");
};
const isFunctionNode = (node) => node && (
	node.type === "FunctionDeclaration" ||
	node.type === "FunctionExpression" ||
	node.type === "ArrowFunctionExpression");
const isRequireCall = (node) => node && node.type === "CallExpression" &&
	node.callee && node.callee.type === "Identifier" && node.callee.name === "require";
const symbolKind = {
	Module: "module",
	Namespace: "namespace",
	Class: "class",
	Method: "method",
	Property: "property",
	Function: "function",
	Variable: "variable",
	Constant: "constant"
};
const createDocumentSymbol = (name, kind, node, source, options = {}) => {
	var row = node && node.loc ? node.loc.start.line - 1 : 0;
	var endRow = node && node.loc ? node.loc.end.line - 1 : row;
	var detail = options.detail || "";
	var menuLabel = options.menuLabel || name;
	var label = options.label || (detail ? js.sf("%s(%s)", name, detail) : name);

	return {
		name: name,
		detail: detail,
		kind: kind,
		key: options.key || js.sf("js:%d:%s:%s", row, kind, name),
		label: label,
		menuLabel: menuLabel,
		title: options.title || normalizeSymbolText(source.substring(node.start, Math.min(node.end, node.start + 160))),
		row: row,
		endRow: endRow,
		range: node && node.range,
		selectionRange: node && node.range,
		group: options.group,
		depth: options.depth || 0,
		navigable: options.navigable !== false,
		children: options.children || []
	};
};
const collectObjectPropertySymbols = (object_node, source, prefix, depth, options = {}) => {
	var symbols = [];

	(object_node.properties || []).forEach(property => {
		var key_node = property.key || property.argument;
		var value = property.value;
		var key = getAstName(key_node, source);
		var full_name = prefix ? js.sf("%s.%s", prefix, key) : key;
		var function_node = property.kind === "get" || property.kind === "set" ? value : value;
		var children;
		var symbol;
		var detail;

		if(!key || property.type === "SpreadElement") {
			return;
		}

		if(isFunctionNode(function_node)) {
			detail = getFunctionParams(function_node, source);
			symbols.push(createDocumentSymbol(full_name, symbolKind.Method, property, source, {
				detail: detail,
				label: js.sf("%s(%s)", full_name, detail),
				menuLabel: js.sf("%s(%s)", key, detail),
				group: options.group,
				depth: depth
			}));
			return;
		}

		if(value && value.type === "ObjectExpression") {
			children = collectObjectPropertySymbols(value, source, full_name, depth + 1, {
				group: options.group || key
			});

			if(key === "prototype" || key === "statics" || children.length > 0) {
				symbol = createDocumentSymbol(full_name, symbolKind.Namespace, property, source, {
					label: full_name,
					menuLabel: key,
					group: key,
					depth: depth,
					navigable: false,
					children: children
				});
				symbols.push(symbol);
			} else {
				symbols.push(createDocumentSymbol(full_name, symbolKind.Property, property, source, {
					label: full_name,
					menuLabel: key,
					group: options.group,
					depth: depth
				}));
			}
			return;
		}

		if(value && value.type === "Identifier") {
			symbols.push(createDocumentSymbol(full_name, symbolKind.Property, property, source, {
				label: js.sf("%s: %s", full_name, value.name),
				menuLabel: js.sf("%s: %s", key, value.name),
				group: options.group,
				depth: depth
			}));
			return;
		}

		symbols.push(createDocumentSymbol(full_name, symbolKind.Property, property, source, {
			label: full_name,
			menuLabel: key,
			group: options.group,
			depth: depth
		}));
	});

	return symbols;
};
const unwrapExpression = (node) => {
	while(node && (node.type === "ParenthesizedExpression" || node.type === "ChainExpression")) {
		node = node.expression;
	}
	return node;
};
const literalText = (node) => {
	node = unwrapExpression(node);
	if(!node) return "";
	if(node.type === "Literal" && typeof node.value === "string") {
		return node.value;
	}
	if(node.type === "TemplateLiteral" && node.expressions.length === 0) {
		return node.quasis[0] && node.quasis[0].value.cooked || "";
	}
	return "";
};
const isStringLiteralNode = (node) => {
	node = unwrapExpression(node);
	return !!node && (
		node.type === "Literal" && typeof node.value === "string" ||
		node.type === "TemplateLiteral" && node.expressions.length === 0
	);
};
const isLiteralListArray = (node) => {
	node = unwrapExpression(node);
	return node && node.type === "ArrayExpression" && (node.elements || []).length > 0 &&
		(node.elements || []).every(isStringLiteralNode);
};
const isVclTypeElement = (node) => {
	node = unwrapExpression(node);
	if(isStringLiteralNode(node)) {
		return true;
	}
	return isLiteralListArray(node);
};
const getVclTypeText = (node) => {
	node = unwrapExpression(node);
	if(literalText(node)) {
		return literalText(node);
	}
	if(node && node.type === "ArrayExpression") {
		return (node.elements || []).map(literalText).filter(Boolean).join(" < ");
	}
	return "";
};
const isVclComponentArray = (node) => {
	node = unwrapExpression(node);
	return node && node.type === "ArrayExpression" && isVclTypeElement((node.elements || [])[0]);
};
const isMemberCall = (node, name) => {
	node = unwrapExpression(node);
	var property = node && node.callee && node.callee.type === "MemberExpression" ?
		node.callee.property : null;
	var property_name = property && (property.name || property.value);
	return node && node.type === "CallExpression" &&
		node.callee && node.callee.type === "MemberExpression" &&
		property_name === name;
};
const isStrongVclTypeText = (type) => {
	return type === "" || type.indexOf("/") !== -1 ||
		type.charAt(0) === "#" || /^[A-Z][\w$./<>-]*$/.test(type);
};
const isVclChildrenArray = (node) => {
	node = unwrapExpression(node);
	return node && node.type === "ArrayExpression" &&
		(node.elements || []).some(element => isVclComponentArray(element));
};
const isVclChildrenExpression = (node, source) => {
	node = unwrapExpression(node);
	if(!node) {
		return false;
	}
	if(node.type === "ArrayExpression") {
		return (node.elements || []).some(element =>
			isVclComponentArray(element) ||
			isVclChildrenExpression(element, source) ||
			hasVclComponentShape(element, source));
	}
	if(isMemberCall(node, "filter")) {
		return isVclChildrenExpression(node.callee.object, source);
	}
	if(isMemberCall(node, "concat")) {
		return isVclChildrenExpression(node.callee.object, source) ||
			(node.arguments || []).some(argument =>
				isVclChildrenExpression(argument, source) ||
				hasVclComponentShape(argument, source));
	}
	if(isMemberCall(node, "map")) {
		return hasVclComponentShape(mapCallbackBody(node), source);
	}
	return false;
};
const getVclNameText = (node) => {
	node = unwrapExpression(node);
	if(literalText(node)) {
		return literalText(node);
	}
	if(node && node.type === "Identifier") {
		return node.name;
	}
	return "";
};
const getObjectPropertyKey = (property, source) => {
	if(!property || property.type === "SpreadElement") return "";
	return getAstName(property.key || property.argument, source);
};
const objectPropertyValueText = (object_node, source, names) => {
	var properties = object_node && object_node.type === "ObjectExpression" ? object_node.properties || [] : [];
	var found = "";

	names.some(name => {
		return properties.some(property => {
			var key = getObjectPropertyKey(property, source);
			var value = property.value;
			if(key !== name || !value) {
				return false;
			}
			found = literalText(value) || (value.type === "Identifier" ? value.name : "");
			return !!found;
		});
	});
	return found;
};
const firstVclPropsObject = (elements, children_array) => {
	for(var i = 1; i < elements.length; ++i) {
		var element = unwrapExpression(elements[i]);
		if(element && element !== children_array && element.type === "ObjectExpression") {
			return element;
		}
	}
	return null;
};
const hasVclPropsObject = (node, source) => {
	var properties = node && node.type === "ObjectExpression" ? node.properties || [] : [];
	var keys = {
		action: true, align: true, classes: true, content: true, control: true,
		handlers: true, hotkey: true, on: true, onLoad: true, popup: true,
		vars: true, visible: true
	};

	return properties.some(property => keys[getObjectPropertyKey(property, source)] === true);
};
const findVclChildrenExpression = (elements, source) => {
	for(var i = 1; i < elements.length; ++i) {
		if(isVclChildrenExpression(elements[i], source)) {
			return unwrapExpression(elements[i]);
		}
	}
	return null;
};
const mapCallbackBody = (node) => {
	node = unwrapExpression(node);
	if(!isMemberCall(node, "map")) {
		return null;
	}

	var callback = unwrapExpression((node.arguments || [])[0]);
	if(!callback || !isFunctionNode(callback)) {
		return null;
	}
	if(callback.body && callback.body.type === "BlockStatement") {
		var statement = (callback.body.body || []).find(item => item.type === "ReturnStatement");
		return statement && unwrapExpression(statement.argument);
	}
	return unwrapExpression(callback.body);
};
const hasVclComponentShape = (node, source) => {
	var elements;
	var type;
	var children_expression;
	var props_object;

	node = unwrapExpression(node);
	if(isMemberCall(node, "filter")) {
		return hasVclComponentShape(node.callee.object, source) ||
			isVclChildrenExpression(node.callee.object, source);
	}
	if(isMemberCall(node, "concat")) {
		return hasVclComponentShape(node.callee.object, source) ||
			isVclChildrenExpression(node.callee.object, source);
	}
	if(isMemberCall(node, "map")) {
		return hasVclComponentShape(mapCallbackBody(node), source);
	}
	if(!isVclComponentArray(node)) {
		return false;
	}

	node = unwrapExpression(node);
	elements = node.elements || [];
	type = getVclTypeText(elements[0]);
	children_expression = findVclChildrenExpression(elements, source);
	props_object = firstVclPropsObject(elements, children_expression);
	return isStrongVclTypeText(type) || !!children_expression || hasVclPropsObject(props_object, source);
};
const buildVclDslChildrenFromExpression = (node, source, depth) => {
	node = unwrapExpression(node);
	if(!node) {
		return [];
	}
	if(isMemberCall(node, "filter")) {
		return buildVclDslChildrenFromExpression(node.callee.object, source, depth);
	}
	if(isMemberCall(node, "concat")) {
		var children = buildVclDslChildrenFromExpression(node.callee.object, source, depth);
		(node.arguments || []).forEach(argument => {
			children = children.concat(buildVclDslChildrenFromExpression(argument, source, depth));
		});
		return children;
	}
	if(isVclChildrenArray(node)) {
		return (node.elements || [])
			.map(child => buildVclDslSymbol(child, source, depth))
			.filter(Boolean);
	}
	if(isMemberCall(node, "map")) {
		var mapped = buildVclDslSymbol(mapCallbackBody(node), source, depth);
		if(mapped) {
			mapped.menuLabel = js.sf("%s...", mapped.menuLabel || mapped.label || mapped.name);
			mapped.label = js.sf("%s...", mapped.label || mapped.name);
			return [mapped];
		}
		return [];
	}
	if(hasVclComponentShape(node, source)) {
		var symbol = buildVclDslSymbol(node, source, depth);
		return symbol ? [symbol] : [];
	}
	return [];
};
const buildVclDslSymbol = (node, source, depth) => {
	node = unwrapExpression(node);
	if(isMemberCall(node, "filter")) {
		return buildVclDslSymbol(node.callee.object, source, depth);
	}
	if(isMemberCall(node, "concat")) {
		var base = buildVclDslSymbol(node.callee.object, source, depth);
		if(base) {
			(node.arguments || []).forEach(argument => {
				base.children = base.children.concat(
					buildVclDslChildrenFromExpression(argument, source, (depth || 0) + 1));
			});
		}
		return base;
	}
	if(!hasVclComponentShape(node, source)) {
		return null;
	}

	var elements = node.elements || [];
	var type = getVclTypeText(elements[0]) || "Component";
	var name = "";
	var children_expression = findVclChildrenExpression(elements, source);
	var props_object = firstVclPropsObject(elements, children_expression);
	var children = [];

	for(var i = 1; i < elements.length; ++i) {
		var element = unwrapExpression(elements[i]);
		if(!element || element === children_expression || element.type === "ObjectExpression") {
			continue;
		}
		name = getVclNameText(element);
		if(name) {
			break;
		}
	}
	if(!name && props_object) {
		name = objectPropertyValueText(props_object, source, [
			"name", "action", "popup", "control", "content", "text", "classes"
		]);
	}

	if(children_expression) {
		children = buildVclDslChildrenFromExpression(children_expression, source, (depth || 0) + 1);
	}

	return createDocumentSymbol(name ? js.sf("%s#%s", type, name) : type, symbolKind.Namespace, node, source, {
		key: js.sf("vcl:%d:%s:%s", node.loc.start.line - 1, type, name),
		label: name ? js.sf("%s %s", type, name) : type,
		menuLabel: name ? js.sf("%s (%s)", type, name) : type,
		title: name ? js.sf("%s %s", type, name) : type,
		group: "vcl",
		depth: depth || 0,
		children: children
	});
};
const collectVclDslSymbols = (ast, source) => {
	var symbols = [];
	var visit = (node, inside_vcl) => {
		var symbol;

		if(!node || typeof node.type !== "string") {
			return;
		}
		if(hasVclComponentShape(node, source)) {
			if(!inside_vcl) {
				symbol = buildVclDslSymbol(node, source, 0);
				symbol && symbols.push(symbol);
			}
			return;
		}

		Object.keys(node).forEach(key => {
			var value = node[key];
			if(key === "loc" || key === "range") return;
			if(Array.isArray(value)) {
				value.forEach(child => visit(child, inside_vcl));
			} else if(value && typeof value.type === "string") {
				visit(value, inside_vcl);
			}
		});
	};

	visit(ast, false);
	return symbols.sort((a, b) => a.row - b.row || a.name.localeCompare(b.name));
};
const hasVclDslShape = (ast, source) => {
	var found = false;
	var visit = (node) => {
		if(found || !node || typeof node.type !== "string") {
			return;
		}
		if(hasVclComponentShape(node, source)) {
			found = true;
			return;
		}

		Object.keys(node).forEach(key => {
			var value = node[key];
			if(found || key === "loc" || key === "range") return;
			if(Array.isArray(value)) {
				value.forEach(visit);
			} else if(value && typeof value.type === "string") {
				visit(value);
			}
		});
	};

	visit(ast);
	return found;
};
const hasVclDslTextHint = (source) =>
	/\bvcl\/Factory!|\b(?:Tabs|Editor|ListOf)<[^>\n]+>/.test(source || "");
const findFactoryConfigObject = (node) => {
	var found = null;
	var visit = (child) => {
		if(found || !child || typeof child.type !== "string") return;
		if(child.type === "ObjectExpression" && child.properties &&
				child.properties.some(property => {
					var key = property.key && (property.key.name || property.key.value);
					return key === "prototype" || key === "statics";
				})) {
			found = child;
			return;
		}

		Object.keys(child).forEach(key => {
			var value = child[key];
			if(found || key === "loc" || key === "range") return;
			if(Array.isArray(value)) {
				value.forEach(visit);
			} else if(value && typeof value.type === "string") {
				visit(value);
			}
		});
	};

	visit(node);
	return found;
};
const getDefineBodyStatements = (ast) => {
	var found = null;
	var visit = (node) => {
		if(found || !node || typeof node.type !== "string") return;
		if(node.type === "CallExpression" && node.callee &&
				node.callee.type === "Identifier" && node.callee.name === "define") {
			(node.arguments || []).some(arg => {
				if((arg.type === "FunctionExpression" || arg.type === "ArrowFunctionExpression") &&
						arg.body && arg.body.type === "BlockStatement") {
					found = {
						body: arg.body.body || [],
						startRow: arg.body.loc.start.line,
						endRow: arg.body.loc.end.line - 2
					};
					return true;
				}
				return false;
			});
			if(found) return;
		}

		Object.keys(node).forEach(key => {
			var value = node[key];
			if(found || key === "loc" || key === "range") return;
			if(Array.isArray(value)) {
				value.forEach(visit);
			} else if(value && typeof value.type === "string") {
				visit(value);
			}
		});
	};

	visit(ast);
	return found || {
		body: ast.body || [],
		startRow: 0,
		endRow: ast.loc ? ast.loc.end.line - 1 : 0
	};
};
const buildSymbolFromStatement = (statement, source) => {
	var symbols = [];
	var declaration;
	var symbol;
	var name;
	var detail;
	var config;

	if(statement.type === "FunctionDeclaration" && statement.id) {
		detail = getFunctionParams(statement, source);
		return [createDocumentSymbol(statement.id.name, symbolKind.Function, statement, source, {
			detail: detail,
			label: js.sf("%s(%s)", statement.id.name, detail),
			menuLabel: js.sf("%s(%s)", statement.id.name, detail)
		})];
	}
	if(statement.type === "ClassDeclaration" && statement.id) {
		symbol = createDocumentSymbol(statement.id.name, symbolKind.Class, statement, source);
		symbol.children = (statement.body.body || []).map(method => {
			var method_name = getAstName(method.key, source);
			var method_detail = getFunctionParams(method.value, source);
			var full = method.static ? js.sf("%s.%s", statement.id.name, method_name) :
				js.sf("%s#%s", statement.id.name, method_name);
			return createDocumentSymbol(full, symbolKind.Method, method, source, {
				detail: method_detail,
				label: js.sf("%s(%s)", full, method_detail),
				menuLabel: js.sf("%s%s(%s)", method.static ? "static " : "", method_name, method_detail),
				depth: 1
			});
		});
		return [symbol];
	}
	if(statement.type === "VariableDeclaration") {
		statement.declarations.forEach(decl => {
			if(!decl.id || decl.id.type !== "Identifier" || isRequireCall(decl.init)) {
				return;
			}

			name = decl.id.name;
			if(isFunctionNode(decl.init)) {
				detail = getFunctionParams(decl.init, source);
				symbols.push(createDocumentSymbol(name, symbolKind.Function, decl, source, {
					detail: detail,
					label: js.sf("%s(%s)", name, detail),
					menuLabel: js.sf("%s(%s)", name, detail)
				}));
			} else if(decl.init && decl.init.type === "ClassExpression") {
				symbols.push(createDocumentSymbol(name, symbolKind.Class, decl, source));
			} else if(decl.init && decl.init.type === "ObjectExpression") {
				symbol = createDocumentSymbol(name, symbolKind.Variable, decl, source, {
					children: collectObjectPropertySymbols(decl.init, source, name, 1)
				});
				symbols.push(symbol);
			} else {
				symbols.push(createDocumentSymbol(name,
					statement.kind === "const" ? symbolKind.Constant : symbolKind.Variable,
					decl, source));
			}
		});
		return symbols;
	}
	if(statement.type === "ExpressionStatement" && statement.expression &&
			statement.expression.type === "AssignmentExpression") {
		declaration = statement.expression;
		name = getAstName(declaration.left, source);
		if(isFunctionNode(declaration.right)) {
			detail = getFunctionParams(declaration.right, source);
			return [createDocumentSymbol(name, symbolKind.Function, statement, source, {
				detail: detail,
				label: js.sf("%s(%s)", name, detail),
				menuLabel: js.sf("%s(%s)", name, detail)
			})];
		}
		if(declaration.right && declaration.right.type === "ObjectExpression") {
			symbol = createDocumentSymbol(name, symbolKind.Namespace, statement, source, {
				children: collectObjectPropertySymbols(declaration.right, source, name, 1)
			});
			return [symbol];
		}
	}
	if(statement.type === "ReturnStatement") {
		config = findFactoryConfigObject(statement.argument);
		if(config) {
			return collectObjectPropertySymbols(config, source, "", 0);
		}
	}

	return [];
};
const flattenDocumentSymbols = (symbols) => {
	var flat = [];
	var visit = (symbol) => {
		if(symbol.navigable !== false) {
			flat.push(symbol);
		}
		(symbol.children || []).forEach(visit);
	};

	(symbols || []).forEach(visit);
	flat.sort((a, b) => a.row - b.row || a.endRow - b.endRow || a.name.localeCompare(b.name));
	return flat;
};
const parseJavaScriptSource = (source) => {
	var options = {
		ecmaVersion: "latest",
		sourceType: "script",
		allowHashBang: true,
		locations: true,
		ranges: true
	};

	try {
		return acorn.parse(source || "", options);
	} catch(e) {
		options.sourceType = "module";
		return acorn.parse(source || "", options);
	}
};
const buildJavaScriptDocumentSymbols = (source, outline_options = {}) => {
	var ast = parseJavaScriptSource(source);
	var scope = getDefineBodyStatements(ast);
	var tree = [];
	var include_vcl_dsl = outline_options.vclDsl === true ||
		(outline_options.vclDsl === "auto" &&
			(hasVclDslTextHint(source) || hasVclDslShape(ast, source)));

	scope.body.forEach(statement => {
		tree = tree.concat(buildSymbolFromStatement(statement, source));
	});
	if(include_vcl_dsl) {
		tree = tree.concat(collectVclDslSymbols(ast, source));
		tree.sort((a, b) => a.row - b.row || a.endRow - b.endRow || a.name.localeCompare(b.name));
	}

	return {
		tree: tree,
		flat: flattenDocumentSymbols(tree)
	};
};
const buildJavaScriptSymbols = (source, outline_options = {}) => {
	try {
		var outline = buildJavaScriptDocumentSymbols(source || "", outline_options);
		if(outline && outline.flat && outline.flat.length) {
			return outline;
		}
	} catch(e) {
		console.warn("Acorn JavaScript outline failed; falling back to line parser", e);
	}

	var masked_info = maskJavaScript(source || "");
	var masked = masked_info.text;
	var lines = (source || "").split("\n");
	var masked_lines = masked.split("\n");
	var depths = depthAtLines(masked, lines.length);
	var define_body = findDefineBody(masked, masked_info.lineStarts);
	var start = define_body ? define_body.start : 0;
	var end = define_body ? define_body.end : lines.length - 1;
	var top_depth = define_body ? define_body.depth : 0;
	var symbols = [];

	for(var row = start; row <= end; ++row) {
		var line = masked_lines[row] || "";
		var trimmed = line.trim();
		var symbol;

		if(trimmed === "" || depths[row] !== top_depth) {
			continue;
		}

		symbol = symbolFromLine(line);
		if(symbol) {
			symbol.row = row;
			symbol.text = normalizeSymbolText(lines[row]);
			symbol.key = js.sf("js:%d:%s", row, symbol.name);
			symbols.push(symbol);
		}
	}

	symbols.forEach((symbol, index) => {
		var next = symbols[index + 1];
		symbol.endRow = next ? Math.max(symbol.row, next.row - 1) : end;
		symbol.label = js.sf("%s %s", symbol.name, symbol.type === "var" ? "" : js.sf("(%s)", symbol.type)).trim();
		symbol.menuLabel = symbol.label;
	});

	return {
		tree: symbols,
		flat: symbols
	};
};
const getJavaScriptOutline = (root, ace) => {
	var source = ace.getValue();
	var cached_source = root.vars([NAV_SOURCE_VAR]);
	var outline_config = root.vars(["javascriptOutline"]) || {};
	var outline_options = {
		vclDsl: outline_config.vclDsl === true ? true :
			outline_config.vclDsl === false ? false : "auto"
	};
	var outline_options_key = JSON.stringify(outline_options);
	var cached_outline = root.vars([NAV_SYMBOLS_VAR]);

	if(cached_outline && cached_source === source &&
			root.vars(["js-toplevel-nav-options-source"]) === outline_options_key) {
		return cached_outline;
	}

	cached_outline = buildJavaScriptSymbols(source, outline_options);
	root.vars(NAV_SOURCE_VAR, source);
	root.vars("js-toplevel-nav-options-source", outline_options_key);
	root.vars(NAV_SYMBOLS_VAR, cached_outline);
	return cached_outline;
};
const getJavaScriptSymbols = (root, ace) => getJavaScriptOutline(root, ace).flat || [];
const getTopLevelNavigation = (root) => root && root.vars ? root.vars(["topLevelNavigation"]) : null;
const symbolForRow = (symbols, row) => {
	var containing = (symbols || []).filter(symbol => symbol.row <= row && symbol.endRow >= row);
	if(containing.length > 0) {
		containing.sort((a, b) =>
			(a.endRow - a.row) - (b.endRow - b.row) ||
			(b.depth || 0) - (a.depth || 0) ||
			b.row - a.row);
		return containing[0];
	}
	return (symbols || [])
		.filter(symbol => symbol.row <= row)
		.sort((a, b) => b.row - a.row || (b.depth || 0) - (a.depth || 0))[0] || null;
};
const syncJavaScriptNavActive = (root, active_symbols, caret_symbol) => {
	var helper = getTopLevelNavigation(root);
	var nav = root.nodeNeeded().querySelector(".js-toplevel-nav");

	if(helper && nav) {
		helper.syncActive(nav,
			(active_symbols || []).map(symbol => symbol.key),
			caret_symbol ? [caret_symbol.key] : []);
	}
};
const syncJavaScriptNavToVisibleRows = (root, ace) => {
	var editor = ace.getEditor();
	var symbols = root.vars([NAV_ITEMS_VAR]) || [];
	var first_row;
	var last_row;
	var active;
	var cursor_row;
	var caret_symbol;

	if(!editor || symbols.length === 0) {
		syncJavaScriptNavActive(root, [], null);
		return;
	}

	cursor_row = editor.getCursorPosition().row;

	if(editor.renderer && editor.renderer.getFirstVisibleRow) {
		first_row = editor.renderer.getFirstVisibleRow();
		last_row = editor.renderer.getLastVisibleRow ?
			editor.renderer.getLastVisibleRow() : first_row;
	} else {
		first_row = last_row = editor.getCursorPosition().row;
	}

	active = symbols.filter(symbol => symbol.row <= last_row && symbol.endRow >= first_row);
	if(active.length === 0) {
		active = symbols.filter(symbol => symbol.row <= cursor_row && symbol.endRow >= cursor_row);
	}
	caret_symbol = symbolForRow(symbols, cursor_row);

	syncJavaScriptNavActive(root, active, caret_symbol);
};
const findJavaScriptSymbolByKey = (symbols, key) => {
	var found = null;
	var visit = (symbol) => {
		if(found || !symbol) return;
		if(symbol.key === key) {
			found = symbol;
			return;
		}
		(symbol.children || []).forEach(visit);
	};

	(symbols || []).forEach(visit);
	return found;
};
const navigateJavaScriptSymbol = (root, ace, key) => {
	var editor = ace.getEditor();
	var symbols = root.vars([NAV_ITEMS_VAR]) || [];
	var outline = root.vars([NAV_SYMBOLS_VAR]);
	var symbol = symbols.find(item => item.key === key) ||
		findJavaScriptSymbolByKey(outline && outline.tree, key);

	if(!editor || !symbol) return;

	editor.gotoLine(symbol.row + 1, 0, true);
	ace.setFocus && ace.setFocus();
	syncJavaScriptNavActive(root, [symbol], symbol);
};
const decorateJavaScriptNavigation = (root, ace) => {
	var host = root.nodeNeeded();
	var outline = getJavaScriptOutline(root, ace);
	var symbols = outline.flat || [];
	var helper = getTopLevelNavigation(root);
	var total_row = Math.max(1, ace.getValue().split("\n").length - 1);
	var nav;

	root.vars(NAV_ITEMS_VAR, symbols);
	root.vars(NAV_ELEMENTS_VAR, []);
	if(!helper || symbols.length === 0) {
		var previous = host.querySelector(".js-toplevel-nav");
		previous && previous.parentNode.removeChild(previous);
		return;
	}

	symbols.forEach(symbol => {
		symbol.positionRatio = symbol.row / total_row;
	});
	nav = helper.render({
		root: root,
		ownerNode: host,
		fallback: host,
		className: "js-toplevel-nav",
		railClassName: "js-toplevel-nav-rail",
		menuClassName: "js-toplevel-nav-menu",
		tickClassName: "js-toplevel-nav-tick",
		itemClassName: "js-toplevel-nav-item",
		keyAttribute: "data-symbol-key",
		ariaLabel: "JavaScript symbols",
		items: symbols,
		menuItems: outline.tree || symbols,
		minGap: 6,
		getKey: symbol => symbol.key,
		getLabel: symbol => symbol.label || symbol.name,
		getMenuLabel: symbol => symbol.menuLabel || symbol.label || symbol.name,
		defaultDepth: 3,
		onSettingsChanged: () => updateJavaScriptNavigationPosition(root),
		onNavigate: key => navigateJavaScriptSymbol(root, ace, key)
	});
	root.vars(NAV_ELEMENTS_VAR, nav && nav._topLevelNav ? nav._topLevelNav.elements : []);
	syncJavaScriptNavToVisibleRows(root, ace);
};
const scheduleJavaScriptNavigationRefresh = (root, ace) => {
	root.setTimeout("js-toplevel-nav-refresh", () => decorateJavaScriptNavigation(root, ace), 180);
};
const scheduleJavaScriptNavigationSync = (root, ace) => {
	var throttle = root.vars(["runTopLevelNavigationThrottled"]);

	if(throttle) {
		throttle(root, "js-toplevel-nav-sync", () => syncJavaScriptNavToVisibleRows(root, ace), 50);
	} else {
		root.setTimeout("js-toplevel-nav-sync", () => syncJavaScriptNavToVisibleRows(root, ace), 40);
	}
};
const scheduleJavaScriptNavigationResize = (root) => {
	root.setTimeout("js-toplevel-nav-resize", () => {
		var helper = getTopLevelNavigation(root);
		var nav = root._node && root._node.querySelector(".js-toplevel-nav");
		var ace = root.down("#ace");
		if(!nav || !helper || !root.isVisible()) return;
		helper.resize(nav);
		root.vars(NAV_ELEMENTS_VAR, nav._topLevelNav.elements);
		ace && syncJavaScriptNavToVisibleRows(root, ace);
	}, 0);
};
const updateJavaScriptNavigationPosition = (root) => {
	var ace = root.down("#ace");
	ace && decorateJavaScriptNavigation(root, ace);
};

["", {
	
	onLoad() {
		var ace = this.down("#ace"), firstRun = false;
		var editor = ace.getEditor();
		var disposed = false;
		var tab = this.up("vcl/ui/Tab"), loadedListener;
		var selection = editor.selection, session = editor.session;
		ace.once("destroy", () => {
			disposed = true;
			if(loadedListener) tab.off(loadedListener);
			selection.off("changeCursor", sync_cursor);
			session.off("changeScrollTop", sync);
			session.off("change", refresh);
		});
		var sync = () => scheduleJavaScriptNavigationSync(this, ace);
		var sync_cursor = () => syncJavaScriptNavToVisibleRows(this, ace);
		var refresh = () => scheduleJavaScriptNavigationRefresh(this, ace);
		var bindResize = this.vars(["bindTopLevelNavigationResize"]);

		ace.up().readStorage("ace", function(state) {
			if(!disposed) firstRun = state === undefined;
		});
		bindResize && bindResize(this, "js-toplevel-nav-window-resize",
			() => scheduleJavaScriptNavigationResize(this), 120);
		editor.selection.on("changeCursor", sync_cursor);
		editor.session.on("changeScrollTop", sync);
		editor.session.on("change", refresh);
		loadedListener = tab.once("resource-loaded", () => {
			loadedListener = null;
			if(disposed) return;
			if(firstRun === true) {
				editor.execCommand("foldall");
			
				// TODO actually it should be the last visible fold (root fold?)
				var fold = editor.session.getAllFolds()[0];
				fold && editor.session.expandFold(fold);
			}
			refresh();
		});
		return this.inherited(arguments);
	},
	onResize() {
		scheduleJavaScriptNavigationResize(this);
	}
	
}];
