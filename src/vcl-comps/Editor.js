"devtools/Resources, util/Xml, vcl/ui/Tab, util/Event, ace/ext-modelist, vcl/ui/Popup, vcl/ui/Element, vcl/Component";

/*- 
	#evaluate.vars
		.label
		.eval(expr)
*/
var ExtensionToMode = {
		"f7": "html",
        "html": "html",
        "css": "css",
        "scss": "scss",
        "json": "json",
        "geojson": "json",
        "js": "javascript",
        "jso": "javascript",
        "blocks": "javascript",
        "vcl": "javascript",
        "ts": "typescript",
        "md": "markdown",
        "markdown": "markdown",
        "sh": "sh",
        "java": "java",
        "jsx": "jsx",
        "rdf": "xml",
        "wsdl": "xml",
        "xsd": "xml",
        "ti": "xml",
        "qgs": "xml",
        "qmd": "xml",
        "xml": "xml",
        "kml": "xml",
        "xsl": "xml",
        "jsp": "jsp",
        "yml": "yaml",
        "openapi": "yaml"
    };

var Event_ = require("util/Event");
var Resources = require("devtools/Resources");
var Component = require("vcl/Component");
var nameOf = (uri) => (uri||"").split("/").pop().replace(/\//g, ".");
var componentMenuRoot = (uri) => {
	var parts = String(uri || "").replace(/\.js$/, "").split("/");
	var index = parts.indexOf("vcl-comps");
	var kind = "vcl-comps";
	if(index === -1) {
		index = parts.indexOf("cavalion-blocks");
		kind = "cavalion-blocks";
	}
	if(index === -1) return null;
	var prefix = parts.slice(0, index);
	parts = parts.slice(index + 1);
	if(!parts.length) return null;
	return { kind: kind, prefix: prefix, parts: parts };
};
var componentResourceUri = (info, classCount) => {
	var path = info.template.split("/");
	var classes = info.classes.slice(0, classCount);
	var name;
	if(info.specializer) {
		path[path.length - 1] += info.specializerStyle === "<>" ? "<>" : "$";
		name = info.specializer + (classes.length ? "." + classes.join(".") : "");
		path.push(name + ".js");
	} else {
		name = path.pop() + (classes.length ? "." + classes.join(".") : "");
		path.push(name + ".js");
	}
	return info.prefix.concat(info.kind, path).join("/");
};
var componentResourceUriFromClassUri = (info, classUri) => {
	var path, template, name, rest;
	if(classUri.indexOf("<") !== -1) {
		template = classUri.split("<");
		path = template.shift().split("/");
		rest = template.join("<").split(">");
		name = rest.shift();
		rest = rest.join(">");
		if(rest) name += rest;
		path[path.length - 1] += info.specializerStyle === "<>" ? "<>" : "$";
		path.push(name + ".js");
	} else {
		path = classUri.split("/");
		path[path.length - 1] += ".js";
	}
	return info.prefix.concat(info.kind, path).join("/");
};
var componentClassInfo = (uri) => {
	var root = componentMenuRoot(uri);
	var parts = root && root.parts;
	var last = parts && parts[parts.length - 1];
	var templateParts, template, specializer, specializerStyle, classes;
	if(!parts || !/\.js$/.test(String(uri || ""))) return null;

	templateParts = parts.slice(0, -1);
	if(templateParts.length && templateParts[templateParts.length - 1].endsWith("$")) {
		templateParts[templateParts.length - 1] = templateParts[templateParts.length - 1].slice(0, -1);
		template = templateParts.join("/");
		specializer = last;
		specializerStyle = "$";
	} else if(templateParts.length && templateParts[templateParts.length - 1].endsWith("<>")) {
		templateParts[templateParts.length - 1] = templateParts[templateParts.length - 1].slice(0, -2);
		template = templateParts.join("/");
		specializer = last;
		specializerStyle = "<>";
	} else {
		template = parts.join("/");
	}
	classes = (specializer || template).split(".");
	if(specializer) {
		specializer = classes.shift();
	} else {
		template = classes.shift();
	}
	return {
		kind: root.kind,
		prefix: root.prefix,
		uri: uri,
		template: template,
		specializer: specializer || "",
		specializerStyle: specializerStyle || "$",
		classes: classes || [],
		key: [root.kind, template, specializer || ""].join(":")
	};
};
var componentClassLabel = (info, classCount) => {
	var classes = info.classes.slice(0, classCount);
	var name = info.specializer;
	if(name) {
		name += classes.length ? "." + classes.join(".") : "";
		return js.sf("%s<%s>", info.template, name);
	}
	name = info.template + (classes.length ? "." + classes.join(".") : "");
	return name;
};
var componentMenuItemCount = 64;
var addComponentMenuEntry = (menu, label, resourceUri, separator) => {
	if(!menu._seen) menu._seen = {};
	if(!separator && menu._seen[label]) return;
	!separator && (menu._seen[label] = true);
	menu.entries.push({ label: label, resourceUri: resourceUri, separator: separator === true });
};
var componentSiblingsUri = (info) => {
	var path = info.template.split("/");
	if(info.specializer) {
		path[path.length - 1] += info.specializerStyle === "<>" ? "<>" : "$";
	} else {
		path.pop();
	}
	return info.prefix.concat(info.kind, path).join("/");
};
var isComponentMenuSibling = (info, other) => {
	if(!other || other.uri === info.uri || other.kind !== info.kind ||
			other.template !== info.template ||
			other.specializerStyle !== info.specializerStyle) {
		return false;
	}

	if(info.specializer && info.classes.length === 0) {
		return other.specializer !== "";
	}

	return other.key === info.key;
};
var loadComponentMenuSiblings = (menu) => {
	if(!menu || menu.siblingsLoaded) return Promise.resolve(menu);
	if(menu.siblingsPromise) return menu.siblingsPromise;

	menu.siblingsPromise = Resources.list(componentSiblingsUri(menu.info))
		.then(resources => {
			var siblings = resources
				.filter(resource => resource && resource.type !== "Folder")
				.filter(resource => !String(resource.name || resource.uri || "").endsWith("-"))
				.map(resource => componentClassInfo(resource.uri))
				.filter(other => isComponentMenuSibling(menu.info, other))
				.map(other => ({
					label: componentClassLabel(other, other.classes.length),
					resourceUri: other.uri || componentResourceUri(other, other.classes.length)
				}))
				.filter(entry => entry.label !== menu.label && !menu._seen[entry.label])
				.sort((a, b) => a.label < b.label ? -1 : a.label > b.label ? 1 : 0);

			if(siblings.length) {
				addComponentMenuEntry(menu, "-", null, true);
				siblings.forEach(entry => addComponentMenuEntry(menu, entry.label, entry.resourceUri));
			}
			menu.siblingsLoaded = true;
			return menu;
		})
		.catch(res => {
			menu.siblingsError = res;
			menu.siblingsLoaded = true;
			return menu;
		});
	return menu.siblingsPromise;
};
var renderComponentMenuItems = (scope, entries) => {
	for(var i = 0; i < componentMenuItemCount; ++i) {
		var item = scope["component-menu-item-" + i];
		var entry = entries && entries[i];
		if(item) {
			item.setVisible(!!entry);
			item.setContent(entry && !entry.separator ? js.sf("%H", entry.label) : "");
			item.vars("componentMenuEntry", entry && !entry.separator ? entry : null);
			item[entry && entry.separator ? "addClass" : "removeClass"]("separator");
		}
	}
};
var componentMenuEntries = (root, uri) => {
	var info = componentClassInfo(uri);
	var menu;
	if(!info) return null;

	var classUri = componentClassLabel(info, info.classes.length);
	menu = { info: info, label: classUri, entries: [], _seen: {} };
	menu.entries.push({ label: "Console...", action: "console" });
	addComponentMenuEntry(menu, "-", null, true);
	[].concat(
		Component.getImplicitBasesByUri(classUri),
		Component.getImplicitBaseByUri(classUri, true).slice(1)
	).filter(uri => uri !== classUri)
		.forEach(uri => addComponentMenuEntry(menu, uri, componentResourceUriFromClassUri(info, uri)));
	if(info.specializer) {
		addComponentMenuEntry(menu, js.sf("%s<>", info.template), componentResourceUri({
			kind: info.kind,
			prefix: info.prefix,
			template: info.template,
			specializer: "",
			specializerStyle: info.specializerStyle,
			classes: []
		}, 0));
	}

	return menu;
};
var editorRootFor = (control) =>
	control && control.up && (
		control.up("devtools/Editor<>:root") ||
		control.up("devtools/Editor<>")
	) || control;
var stateStorageResource = (control) => {
	var root = editorRootFor(control);
	var dbName = js.get("storageDB.name", Component);
	var key;
	if(!(root && dbName)) return null;

	key = root.getStorageKey instanceof Function ? root.getStorageKey("cavalion-vcl:state") : null;
	if(!key) return null;
	key = String(key).split("$").shift();
	return {
		uri: js.sf("pouchdb://%s/%s", dbName, key),
		type: "File",
		title: "(State) " + (root.vars(["resource.uri"]) || key).split("/").pop(),
		name: key.split("/").pop()
	};
};
var stateMenuEntries = (root) => {
	if(!(root && root.vars && root.vars(["stateOverlay.enabled"]) === true)) return null;
	if(!stateStorageResource(root)) return null;
	return {
		label: root.vars(["stateOverlay.label"]) || "(State) Revisions",
		entries: [
			{ label: "Clear Current State", action: "state-clear" },
			{ separator: true },
			{ label: "Open Revisions", action: "state-revisions-open" }
		]
	};
};
var renderStateMenuItems = (scope, entries) => {
	for(var i = 0; i < 8; ++i) {
		var item = scope["state-menu-item-" + i];
		var entry = entries && entries[i];
		if(item) {
			item.setVisible(!!entry);
			item.setContent(entry && !entry.separator ? js.sf("%H", entry.label) : "");
			item.vars("stateMenuEntry", entry && !entry.separator ? entry : null);
			item[entry && entry.separator ? "addClass" : "removeClass"]("separator");
		}
	}
};
var dialectMenuEntries = (root) => {
	if(!(root && root.vars && root.vars(["dialectMenu.enabled"]) === true)) return null;
	var dialect = root.vars(["dialect"]) || "markdown";
	return {
		label: root.vars(["dialectMenu.label"]) || "Dialect",
		entries: [
			{ label: "Default", action: "markdown-dialect-default", selected: dialect !== "marked" },
			{ label: "Marked", action: "markdown-dialect-marked", selected: dialect === "marked" }
		]
	};
};
var renderDialectMenuItems = (scope, entries) => {
	for(var i = 0; i < 2; ++i) {
		var item = scope["dialect-menu-item-" + i];
		var entry = entries && entries[i];
		if(item) {
			item.setVisible(!!entry);
			item.setContent(entry ? js.sf("%H", entry.label) : "");
			item.vars("dialectMenuEntry", entry || null);
			item[entry && entry.selected ? "addClass" : "removeClass"]("selected");
		}
	}
};
var getKey = (tab) => {
	var parents = [];
	while(tab !== null && tab.vars("resource")) {
		parents.unshift(tab);
		tab = tab.up("vcl/ui/Tab");
	}
	parents = parents.map(_ => nameOf(_.vars("resource.uri")));
	return parents.join("/");
};
var TopLevelNavigation = (() => {
	var NAV_VERTICAL_PADDING = 32;
	var RAIL_PADDING = 12;
	var TICK_GAP = 5;
	var NAV_HORIZONTAL_MARGIN = 14;
	var TICK_HOVER_OPEN_DELAY = 210;
	var TICK_HOVER_GROWTH = [16, 10, 6, 3];
	var CARET_COLOR = "rgb(207,226,245)";
	var clamp = (value, min, max) => Math.max(min, Math.min(max, value));
	var getSettings = (root, options = {}) => {
		var defaults = {
			depth: options.defaultDepth || 1,
			links: options.defaultLinks === true,
			position: options.defaultPosition || "dynamic"
		};
		var settings = root && root.vars && root.vars(["topLevelNavigation.settings"]) || {};
		var merged = Object.assign({}, defaults, settings);

		merged.depth = clamp(parseInt(merged.depth, 10) || defaults.depth, 1, 3);
		merged.links = merged.links === true;
		merged.position = ["left", "right", "dynamic"].indexOf(merged.position) !== -1 ?
			merged.position : defaults.position;
		return merged;
	};
	var setSettings = (root, partial) => {
		var navigation = root && root.vars && root.vars(["topLevelNavigation"]) || {};
		var settings = Object.assign({}, navigation.settings || {}, partial || {});
		var ace = root && root.udown && root.udown("#ace");
		var write = ace && ace.vars && ace.vars(["writeAceStorage"]);

		settings.depth = clamp(parseInt(settings.depth, 10) || 1, 1, 3);
		settings.links = settings.links === true;
		settings.position = ["left", "right", "dynamic"].indexOf(settings.position) !== -1 ?
			settings.position : "dynamic";
		navigation.settings = settings;
		root && root.vars && root.vars("topLevelNavigation", navigation);
		if(write instanceof Function) {
			write();
		}
		return settings;
	};
	var isUsableRect = (rect) => rect && rect.width > 120 && rect.height > 160;
	var getNodeRect = (node) => node && node.getBoundingClientRect ? node.getBoundingClientRect() : null;
	var getHostRect = (root, fallback) => {
		var host = root && root.nodeNeeded ? root.nodeNeeded() : null;
		var rect = getNodeRect(host);

		if(isUsableRect(rect)) {
			return rect;
		}
		rect = getNodeRect(fallback);
		if(isUsableRect(rect)) {
			return rect;
		}
		return rect || getNodeRect(host);
	};
	var getSide = (root, options = {}) => {
		var navigation = root && root.getVar ? root.getVar("topLevelNavigation", false) :
			root && root.vars && root.vars(["topLevelNavigation"]);
		var settings = getSettings(root, options);
		var side = options.side || navigation && navigation.side || "right";
		if(settings.position === "left" || settings.position === "right") {
			return settings.position;
		}
		return side === "left" ? "left" : "right";
	};
	var getHeight = (root, fallback, options = {}) => {
		var rect = getHostRect(root, fallback);
		var max = Math.max(80, window.innerHeight - 32);
		var vertical_padding = Math.max(NAV_VERTICAL_PADDING, options.verticalPadding || NAV_VERTICAL_PADDING);
		return clamp(Math.round((rect ? rect.height : window.innerHeight) - (vertical_padding * 2)),
			options.minHeight || 80, Math.min(options.maxHeight || max, max));
	};
	var clusterItems = (items, height, options = {}) => {
		var max_tick_height = options.tickMaxHeight || 5;
		var slot_height = options.tickSlotHeight || (max_tick_height + TICK_GAP);
		var max_ticks = options.maxTicks || Math.max(1,
			Math.floor((height - RAIL_PADDING + TICK_GAP) / slot_height));
		var clusters = [];

		if(items.length <= max_ticks) {
			return items.map((item, index) => ({
				items: [item],
				indexes: [index]
			}));
		}

		for(var i = 0; i < max_ticks; ++i) {
			var start = Math.floor(i * items.length / max_ticks);
			var end = Math.floor((i + 1) * items.length / max_ticks);
			if(end > start) {
				clusters.push({
					items: items.slice(start, end),
					indexes: items.slice(start, end).map((_, offset) => start + offset)
				});
			}
		}

		return clusters;
	};
	var position = (root, nav, fallback) => {
		var rect = getHostRect(root, fallback);
		var usable = isUsableRect(rect);
		var side = getSide(root, nav && nav._topLevelNavOptions);
		var top = usable ? rect.top + (rect.height / 2) : window.innerHeight / 2;
		var right = usable ? Math.max(12, window.innerWidth - rect.right + NAV_HORIZONTAL_MARGIN) : 22;
		var left = usable ? Math.max(0, rect.left + NAV_HORIZONTAL_MARGIN) : NAV_HORIZONTAL_MARGIN;
		var menu = nav && nav._topLevelNav && nav._topLevelNav.menu ||
			nav && nav.querySelector && nav.querySelector(".md-toplevel-nav-menu,.js-toplevel-nav-menu");

		nav.style.top = js.sf("%dpx", Math.round(top));
		nav.style.left = side === "left" ? js.sf("%dpx", Math.round(left)) : "";
		nav.style.right = side === "right" ? js.sf("%dpx", Math.round(right)) : "";
		if(menu) {
			menu.style.left = side === "left" ? "calc(100% + 8px)" : "";
			menu.style.right = side === "right" ? "calc(100% + 8px)" : "";
			menu.style.transform = "translateY(-50%)";
		}
	};
	var open = (root, nav, fallback) => {
		var state = nav && nav._topLevelNav;
		var menu = state && state.menu;
		var input = state && state.linksView && state.linksView.input;

		if(!nav || !menu) {
			return false;
		}

		menu._topLevelNavKeepOpen = true;
		menu.style.display = "block";
		position(root, nav, fallback);
		if(input && input.setFocus) {
			input.setFocus();
		}
		setTimeout(() => {
			var node = input && input.nodeNeeded && input.nodeNeeded();
			if(node && node.focus) {
				node.focus();
				node.select && node.select();
			}
		}, 0);
		return true;
	};
	var close = (nav) => {
		var state = nav && nav._topLevelNav;
		var menu = state && state.menu;

		if(!menu) {
			return false;
		}
		menu._topLevelNavKeepOpen = false;
		menu.style.display = "none";
		return true;
	};
	var toggle = (root, nav, fallback, onClose) => {
		var menu = nav && nav._topLevelNav && nav._topLevelNav.menu;
		if(menu && menu.style.display !== "none" && menu._topLevelNavKeepOpen) {
			var closed = close(nav);
			closed && onClose && onClose();
			return closed;
		}
		return open(root, nav, fallback);
	};
	var styleTick = (tick, cluster, side) => {
		var count = cluster.items.length;
		var height = count > 1 ? Math.min(4, 2 + Math.ceil(Math.log(count + 1) / Math.log(2))) : 2;
		var width = count > 1 ? Math.min(15, 12 + Math.ceil(Math.log(count + 1) / Math.log(2))) : 12;
		var visual = tick._topLevelNavVisual || document.createElement("SPAN");

		if(!tick._topLevelNavVisual) {
			tick._topLevelNavVisual = visual;
			tick.appendChild(visual);
		}

		tick.style.cssText = [
			"appearance:none",
			"-webkit-appearance:none",
			"border:0",
			"background:transparent",
			js.sf("width:%dpx", width),
			js.sf("height:%dpx", height + TICK_GAP),
			"padding:0",
			"margin:0",
			"cursor:pointer",
			"display:block",
			"position:relative",
			"transition:width 150ms ease",
		].join(";");
		visual.style.cssText = [
			"position:absolute",
			side === "right" ? "right:0" : "left:0",
			"top:50%",
			"transform:translateY(-50%)",
			"width:100%",
			js.sf("height:%dpx", height),
			"border:1px solid rgba(110,110,110,.78)",
			"border-radius:999px",
			"background:rgba(246,246,246,.88)",
			"box-sizing:border-box",
			"opacity:.96",
			"box-shadow:0 0 0 1px rgba(255,255,255,.62),0 1px 3px rgba(0,0,0,.18) inset",
			"pointer-events:none"
		].join(";");
		tick._topLevelNavBaseStyle = {
			width: width,
			height: height
		};
	};
	var styleItem = (item, depth, has_children, is_link) => {
		var highlight = () => {
			item.style.background = "rgba(82,82,82,.86)";
			item.style.color = item.classList.contains("caret-active") ? CARET_COLOR : "white";
		};
		var unhighlight = () => {
			if(item.classList.contains("active") === false) {
				item.style.background = "transparent";
				item.style.color = item.classList.contains("caret-active") ? CARET_COLOR : "white";
			}
		};

		item.style.cssText = [
			"appearance:none",
			"-webkit-appearance:none",
			"display:block",
			"width:100%",
			"border:0",
			"border-radius:8px",
			"background:transparent",
			"color:white",
			"text-align:left",
			"font-size:11pt",
			"line-height:1.28",
			js.sf("padding:8px 10px 8px %dpx", 10 + ((depth || 0) * 16)),
			"margin:0",
			"cursor:pointer",
			"white-space:nowrap",
			"overflow:hidden",
			"text-overflow:ellipsis",
			is_link ? "text-decoration:underline" : "text-decoration:none",
			has_children ? "font-weight:600" : "font-weight:400"
		].join(";");
		item.addEventListener("mouseenter", highlight);
		item.addEventListener("mouseleave", unhighlight);
		item.addEventListener("focus", highlight);
		item.addEventListener("blur", unhighlight);
	};
	var titleText = (item) => String(item.navMenuLabel || item.navLabel || item.label || item.text || item.name || "")
		.replace(/\s+/g, " ")
		.trim();
	var setEventHandler = (control, name, value) => {
		var setter = "set" + name.charAt(0).toUpperCase() + name.substring(1);
		if(typeof control[setter] === "function") {
			control[setter](value);
		} else {
			control["_" + name] = value;
		}
	};
	var createLinksView = (root, menu, options, keyAttr, navigateKey) => {
		var Group = require("vcl/ui/Group");
		var Input = require("vcl/ui/Input");
		var view = new Group(root || null);
		var input = new Input(root || null);
		var links = new Group(root || null);
		var selected_index = -1;
		var settings = getSettings(root, options);
		var options_button;
		var options_menu;
		var getButtons;
		var setSelected;
		var applySettings = (partial) => {
			var reopen = partial && partial.position;
			settings = setSettings(root, partial);
			if(options.onSettingsChanged) {
				options.onSettingsChanged(settings);
			}
			if(reopen) {
				setTimeout(() => {
					var owner = options.ownerNode || root && root.nodeNeeded && root.nodeNeeded();
					var nav = owner && owner.querySelector && owner.querySelector("." + options.className);
					if(nav) {
						open(root, nav, options.fallback || owner);
					}
				}, 0);
			}
		};
		var styleOption = (button, active) => {
			button.style.cssText = [
				"appearance:none",
				"-webkit-appearance:none",
				"display:block",
				"width:100%",
				"border:0",
				"background:" + (active ? "rgba(82,82,82,.86)" : "transparent"),
				"color:white",
				"text-align:left",
				"font-size:10pt",
				"line-height:1.25",
				"padding:7px 10px",
				"margin:0",
				"border-radius:7px",
				"cursor:pointer",
				"white-space:nowrap"
			].join(";");
		};
		var rebuildOptionsMenu = () => {
			var addOption = (label, active, onClick) => {
				var button = document.createElement("BUTTON");
				button.type = "button";
				button.textContent = label;
				styleOption(button, active);
				button.addEventListener("mouseenter", () => styleOption(button, true));
				button.addEventListener("mouseleave", () => styleOption(button, active));
				button.addEventListener("click", evt => {
					evt.preventDefault();
					evt.stopPropagation();
					onClick();
					options_menu.style.display = "none";
				});
				options_menu.appendChild(button);
			};
			var addSeparator = () => {
				var separator = document.createElement("DIV");
				separator.style.cssText = "height:1px;margin:5px 2px;background:rgba(255,255,255,.14)";
				options_menu.appendChild(separator);
			};
			var addPositionOptions = () => {
				var wrapper = document.createElement("DIV");
				var button = document.createElement("BUTTON");
				var submenu = document.createElement("DIV");
				var hide_timer;
				var place = () => {
					var rect = wrapper.getBoundingClientRect();
					var width = submenu.offsetWidth || 132;
					var right_space = window.innerWidth - rect.right;
					if(right_space >= width + 8) {
						submenu.style.left = "calc(100% + 6px)";
						submenu.style.right = "auto";
					} else {
						submenu.style.left = "auto";
						submenu.style.right = "calc(100% + 6px)";
					}
				};
				var show = () => {
					clearTimeout(hide_timer);
					submenu.style.display = "block";
					place();
				};
				var hide = () => {
					clearTimeout(hide_timer);
					hide_timer = setTimeout(() => submenu.style.display = "none", 320);
				};
				var addPosition = (label, position) => {
					var option = document.createElement("BUTTON");
					var active = settings.position === position;
					option.type = "button";
					option.textContent = label;
					styleOption(option, active);
					option.addEventListener("mouseenter", () => styleOption(option, true));
					option.addEventListener("mouseleave", () => styleOption(option, active));
					option.addEventListener("click", evt => {
						evt.preventDefault();
						evt.stopPropagation();
						applySettings({ position: position });
						options_menu.style.display = "none";
					});
					submenu.appendChild(option);
				};

				wrapper.style.cssText = "position:relative";
				button.type = "button";
				button.innerHTML = "Positie <i class='fa fa-caret-right' style='float:right;margin-left:18px;line-height:inherit'></i>";
				styleOption(button, settings.position !== "dynamic");
				button.addEventListener("mouseenter", () => {
					styleOption(button, true);
					show();
				});
				button.addEventListener("mouseleave", () => styleOption(button, settings.position !== "dynamic"));
				button.addEventListener("click", evt => {
					evt.preventDefault();
					evt.stopPropagation();
					if(submenu.style.display === "none") {
						show();
					} else {
						submenu.style.display = "none";
					}
				});
				submenu.addEventListener("mouseenter", show);
				submenu.addEventListener("mouseleave", hide);
				submenu.style.cssText = [
					"position:absolute",
					"top:0",
					"left:calc(100% + 6px)",
					"min-width:132px",
					"padding:6px",
					"border-radius:9px",
					"background:rgba(28,28,28,.98)",
					"box-shadow:0 10px 28px rgba(0,0,0,.34)",
					"display:none",
					"z-index:5"
				].join(";");
				addPosition("Links", "left");
				addPosition("Rechts", "right");
				addPosition("Dynamisch", "dynamic");
				wrapper.addEventListener("mouseenter", show);
				wrapper.addEventListener("mouseleave", hide);
				wrapper.appendChild(button);
				wrapper.appendChild(submenu);
				options_menu.appendChild(wrapper);
			};

			settings = getSettings(root, options);
			options_menu.innerHTML = "";
			[1, 2, 3].forEach(depth =>
				addOption("Niveau " + depth, settings.depth === depth, () => applySettings({ depth: depth })));
			if(options.supportsLinks) {
				addSeparator();
				addOption("Links", settings.links === true, () => applySettings({ links: settings.links !== true }));
			}
			addSeparator();
			addPositionOptions();
		};

		view.setName("links-view");
		input.setName("links-filter");
		links.setName("links-container");
		view.setParentNode(menu);
		input.setParent(view);
		links.setParent(view);
		view.setCss({
			"input": {
				"appearance": "none",
				"-webkit-appearance": "none",
				"display": "block",
				"width": "100%",
				"box-sizing": "border-box",
				"border": "0",
				"border-radius": "8px",
				"background": "rgba(30,30,30,.72)",
				"color": "white",
				"font-size": "11pt",
				"line-height": "1.25",
				"padding": "8px 38px 8px 10px",
				"margin": "0 0 6px 0",
				"outline": "0"
			},
			"#links-container": {
				"max-height": "calc(60vh - 50px)",
				"overflow": "auto"
			}
		});
		if(typeof input.setType === "function") {
			input.setType("search");
		}
		if(typeof input.setPlaceholder === "function") {
			input.setPlaceholder("Filter");
		}

		view.nodeNeeded();
		input.nodeNeeded();
		links.nodeNeeded();
		view.nodeNeeded().style.position = "relative";
		options_button = document.createElement("BUTTON");
		options_button.type = "button";
		options_button.innerHTML = "<i class='fa fa-caret-down'></i>";
		options_button.title = "Navigatie-opties";
		options_button.style.cssText = [
			"position:absolute",
			"top:4px",
			"right:4px",
			"width:28px",
			"height:28px",
			"border:0",
			"border-radius:7px",
			"background:rgba(20,20,20,.62)",
			"color:rgba(255,255,255,.78)",
			"cursor:pointer",
			"padding:0",
			"line-height:28px",
			"text-align:center"
		].join(";");
		options_menu = document.createElement("DIV");
		options_menu.style.cssText = [
			"position:absolute",
			"top:38px",
			"right:0",
			"min-width:128px",
			"padding:6px",
			"border-radius:9px",
			"background:rgba(28,28,28,.98)",
			"box-shadow:0 10px 28px rgba(0,0,0,.34)",
			"display:none",
			"z-index:4"
		].join(";");
		options_button.addEventListener("click", evt => {
			evt.preventDefault();
			evt.stopPropagation();
			rebuildOptionsMenu();
			options_menu.style.display = options_menu.style.display === "none" ? "block" : "none";
		});
		options_menu.addEventListener("pointerdown", evt => evt.stopPropagation());
		view.nodeNeeded().appendChild(options_button);
		view.nodeNeeded().appendChild(options_menu);
		getButtons = () => Array.from(links.nodeNeeded().querySelectorAll("button[" + keyAttr + "]"))
			.filter(button => button.style.display !== "none");
		setSelected = (index) => {
			var buttons = getButtons();
			if(buttons.length === 0) {
				selected_index = -1;
				return;
			}
			selected_index = (index + buttons.length) % buttons.length;
			buttons.forEach((button, button_index) => {
				var selected = button_index === selected_index;
				button.classList[selected ? "add" : "remove"]("selected");
				if(selected) {
					button.style.background = "rgba(92,92,92,.9)";
					button.scrollIntoView({ block: "nearest" });
				} else if(!button.classList.contains("active") && !button.matches(":hover,:focus")) {
					button.style.background = "transparent";
				}
			});
		};
		setEventHandler(input, "onChange", function() {
			var query = input.getInputValue().toLowerCase().trim();
			if(query !== "") {
				menu.style.display = "block";
			}
			Array.from(links.nodeNeeded().querySelectorAll("button")).forEach(button => {
				var haystack = (button.textContent + " " + (button.title || "")).toLowerCase();
				var visible = query === "" || haystack.indexOf(query) !== -1;
				button.style.display = visible ? "block" : "none";
				button.classList.remove("selected");
			});
			setSelected(0);
		});
		setEventHandler(input, "onKeyDown", function(evt) {
			var buttons = getButtons();
			if(evt.keyCode === 38 || evt.keyCode === 40) {
				evt.preventDefault();
				evt.stopPropagation();
				setSelected(selected_index + (evt.keyCode === 40 ? 1 : -1));
			} else if(evt.keyCode === 13) {
				evt.preventDefault();
				evt.stopPropagation();
				if(buttons[selected_index]) {
					navigateKey(buttons[selected_index].getAttribute(keyAttr), evt);
				}
			} else if(evt.keyCode === 27) {
				evt.preventDefault();
				evt.stopPropagation();
				menu._topLevelNavKeepOpen = false;
				menu.style.display = "none";
			}
		});

		return {
			view: view,
			input: input,
			links: links,
			linksNode: links.nodeNeeded(),
			setSelected: setSelected
		};
	};
	var render = (options) => {
		var root = options.root;
		var fallback = options.fallback || options.ownerNode;
		var owner = options.ownerNode || (root && root.nodeNeeded && root.nodeNeeded());
		var selector = "." + options.className;
		var previous = owner && owner.querySelector && owner.querySelector(selector);
		var keyAttr = options.keyAttribute || "data-nav-key";
		var settings = getSettings(root, options);
		var items = (options.items || []).map((item, index) => {
			item.navLabel = options.getLabel ? options.getLabel(item, index) : (item.label || item.text || item.name || "Item");
			item.navKey = options.getKey ? options.getKey(item, index) : (item.key || String(index));
			return item;
		});
		var prepareMenuItems = (nodes, depth) => (nodes || []).map((item, index) => {
			var prepared = Object.assign({}, item);
			depth = depth || 1;
			prepared.navMenuLabel = options.getMenuLabel ?
				options.getMenuLabel(prepared, index) :
				(prepared.menuLabel || prepared.navLabel || prepared.label || prepared.text || prepared.name || "Item");
			prepared.navKey = prepared.navKey || (options.getKey ? options.getKey(prepared, index) : (prepared.key || String(index)));
			if(prepared.children && prepared.children.length) {
				prepared.children = prepareMenuItems(prepared.children, depth + 1)
					.filter(child => child.isLink === true || depth < settings.depth);
			} else {
				prepared.children = [];
			}
			return prepared;
		});
		var menu_items = prepareMenuItems(options.menuItems || items, 1);
		var nav, rail, menu, links_view, links_node, height, side, clusters, elements = [];

		if(previous) {
			previous._topLevelNav && previous._topLevelNav.linksView &&
				previous._topLevelNav.linksView.view.destroy();
			previous.parentNode.removeChild(previous);
		}
		if(!owner || items.length === 0) {
			return null;
		}

		height = getHeight(root, fallback, options);
		side = getSide(root, options);
		clusters = clusterItems(items, height, options);
		nav = document.createElement("DIV");
		rail = document.createElement("DIV");
		menu = document.createElement("DIV");
		nav._topLevelNavOptions = options;
		nav.className = options.className;
		nav.setAttribute("role", "navigation");
		nav.setAttribute("aria-label", options.ariaLabel || "Sections");
		rail.className = options.railClassName;
		menu.className = options.menuClassName;
		nav.style.cssText = [
			"position:fixed",
			"transform:translateY(-50%)",
			"width:34px",
			"height:auto",
			"z-index:2147483000",
			"overflow:visible",
			"font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif"
		].join(";");
		rail.style.cssText = [
			"display:flex",
			"flex-direction:column",
			side === "right" ? "align-items:flex-end" : "align-items:flex-start",
			"justify-content:center",
			"gap:0",
			"width:34px",
			js.sf("height:%dpx", height),
			"box-sizing:border-box",
			"overflow:hidden",
			js.sf("padding:%dpx 0", RAIL_PADDING / 2),
			"position:relative",
			"cursor:pointer",
			"z-index:2"
		].join(";");
		menu.style.cssText = [
			"position:absolute",
			side === "left" ? "left:calc(100% + 8px)" : "right:calc(100% + 8px)",
			"top:50%",
			"transform:translateY(-50%)",
			"min-width:220px",
			"max-width:360px",
			"max-height:60vh",
			"overflow:visible",
			"padding:8px",
			"border-radius:12px",
			"background:rgba(52,52,52,.96)",
			"box-shadow:0 12px 34px rgba(0,0,0,.26)",
			"display:none",
			"z-index:3"
		].join(";");
		position(root, nav, fallback);
		var navigateKey = (key, evt) => {
			if(key && options.onNavigate) {
				menu._topLevelNavKeepOpen = true;
				menu.style.display = "block";
				options.onNavigate(key, evt);
			}
		};
		links_view = createLinksView(root, menu, options, keyAttr, navigateKey);
		links_node = links_view.linksNode;
		var hover_open_timer;
		var setHoveredTick = (index, pointer_y) => {
			var hovered_tick;
			var hovered_keys;
			var hovered_links;
			nav._topLevelNav.hoveredTickIndex = index;
			nav._topLevelNav.hoveredTickPointerY = index === -1 ? null : pointer_y;
			hovered_tick = elements.find(item => item._topLevelNavTickIndex === index);
			hovered_keys = hovered_tick && hovered_tick._topLevelNavKeys || [];
			elements.filter(item => item._topLevelNavKeys).forEach(item => {
				var base = item._topLevelNavBaseStyle || { width: 12 };
				var is_active = item.classList.contains("active");
				var is_caret = item.classList.contains("caret-active");
				var distance = index === -1 ? -1 : Math.abs(item._topLevelNavTickIndex - index);
				var growth = TICK_HOVER_GROWTH[distance] || 0;
				var width = is_caret ? Math.max(base.width + 5, 18) :
					is_active ? Math.max(base.width + 3, 16) : base.width;
				item.style.width = js.sf("%dpx", width + growth);
			});
			elements.filter(item => item._topLevelNavKeys === undefined)
				.forEach(item => item.style.color = "");
			if(menu.style.display !== "none") {
				syncActive(nav, nav._topLevelNav.activeKeys || [], nav._topLevelNav.caretKeys || []);
			}
			if(menu.style.display === "none" || hovered_keys.length === 0) return;
			hovered_links = elements.filter(item => item._topLevelNavKeys === undefined)
				.filter(item => hovered_keys.indexOf(item.getAttribute(keyAttr)) !== -1)
				.filter(item => item.style.display !== "none");
			hovered_links.forEach(item => {
				item.style.color = "rgb(255,216,0)";
			});
			if(hovered_links.length) {
				var target = hovered_links[0];
				var top = target.offsetTop - links_node.offsetTop;
				var bottom = top + target.offsetHeight;
				var links_rect = links_node.getBoundingClientRect();
				var pointer_offset = nav._topLevelNav.hoveredTickPointerY - links_rect.top;
				if(isFinite(pointer_offset)) {
					pointer_offset = clamp(pointer_offset, target.offsetHeight / 2,
						links_node.clientHeight - (target.offsetHeight / 2));
					links_node.scrollTop = clamp(top + (target.offsetHeight / 2) - pointer_offset,
						0, Math.max(0, links_node.scrollHeight - links_node.clientHeight));
				} else if(top < links_node.scrollTop + 10) {
					links_node.scrollTop = Math.max(0, top - 10);
				} else if(bottom > links_node.scrollTop + links_node.clientHeight - 10) {
					links_node.scrollTop = bottom - links_node.clientHeight + 10;
				}
			}
		};
		var showMenu = () => {
			menu.style.display = "block";
			position(root, nav, fallback);
		};
		var cancelTickHoverOpen = () => {
			if(hover_open_timer) {
				clearTimeout(hover_open_timer);
				hover_open_timer = null;
			}
		};
		var scheduleTickHoverOpen = (tick) => {
			cancelTickHoverOpen();
			hover_open_timer = setTimeout(() => {
				hover_open_timer = null;
				if(rail.matches(":hover") && nav._topLevelNav.hoveredTickIndex === tick._topLevelNavTickIndex) {
					showMenu();
					setHoveredTick(tick._topLevelNavTickIndex, nav._topLevelNav.hoveredTickPointerY);
				}
			}, TICK_HOVER_OPEN_DELAY);
		};
		var hideMenuWhenIdle = () => setTimeout(() => {
			var input_value = links_view.input.getInputValue();
			var has_filter = input_value && input_value.trim() !== "";
			var hovering = nav.matches(":hover") || menu.matches(":hover");
			var focused = nav.matches(":focus-within") || menu.matches(":focus-within");

			if(!menu._topLevelNavKeepOpen && !has_filter && !hovering && !focused) {
				menu.style.display = "none";
			}
		}, 80);

		nav.addEventListener("mouseleave", () => {
			cancelTickHoverOpen();
			hideMenuWhenIdle();
		});
		menu.addEventListener("mouseleave", hideMenuWhenIdle);
		nav.addEventListener("focusin", showMenu);
		nav.addEventListener("focusout", hideMenuWhenIdle);
		var navigateFromEvent = (evt) => {
			var target = evt.target.closest && evt.target.closest("[" + keyAttr + "],[data-nav-cluster]");
			var key;
			var cluster;

			if(!target || target._topLevelNavPointerHandled && evt.type === "click") {
				if(target) {
					target._topLevelNavPointerHandled = false;
				}
				return;
			}

			cancelTickHoverOpen();
			evt.preventDefault();
			evt.stopPropagation();
			if(evt.type === "pointerdown") {
				target._topLevelNavPointerHandled = true;
			}
			key = target.getAttribute(keyAttr);
			if(!key && target.hasAttribute("data-nav-cluster")) {
				cluster = clusters[parseInt(target.getAttribute("data-nav-cluster"), 10)];
				key = cluster && cluster.items[0] && cluster.items[0].navKey;
			}
			navigateKey(key, evt);
		};
		nav.addEventListener("pointerdown", navigateFromEvent);
		nav.addEventListener("click", navigateFromEvent);

		var appendTicks = () => clusters.forEach((cluster, index) => {
			var tick = document.createElement("BUTTON");
			var title = cluster.items.map(titleText).filter(Boolean).join("\n");

			tick.type = "button";
			tick.className = options.tickClassName;
			tick.title = title;
			tick.setAttribute("aria-label", cluster.items.length === 1 ? title : js.sf("%d items", cluster.items.length));
			tick.setAttribute("data-nav-cluster", index);
			tick._topLevelNavKeys = cluster.items.map(item => item.navKey);
			styleTick(tick, cluster, side);
			tick._topLevelNavTickIndex = index;
			rail.appendChild(tick);
			elements.push(tick);
		});
		appendTicks();
		var hoverRailTick = (evt) => {
			var tick = elements.filter(item => item._topLevelNavKeys).reduce((nearest, item) => {
				var distance = Math.abs(item.getBoundingClientRect().top + (item.offsetHeight / 2) - evt.clientY);
				return !nearest || distance < nearest.distance ? { item: item, distance: distance } : nearest;
			}, null);
			if(tick) {
				setHoveredTick(tick.item._topLevelNavTickIndex, evt.clientY);
				scheduleTickHoverOpen(tick.item);
			}
		};
		rail.addEventListener("mouseenter", hoverRailTick);
		rail.addEventListener("mousemove", hoverRailTick);
		rail.addEventListener("mouseleave", () => {
			setHoveredTick(-1);
			cancelTickHoverOpen();
		});
		var appendMenuItems = (nodes, depth) => nodes.forEach((item, index) => {
			var button = document.createElement("BUTTON");
			var has_children = item.children && item.children.length;

			button.type = "button";
			button.className = options.itemClassName;
			button.textContent = item.navMenuLabel;
			button.title = item.navTitle || item.title || item.navLabel || item.navMenuLabel;
			if(item.navKey) {
				button.setAttribute(keyAttr, item.navKey);
			}
			if(item.isLink) {
				button.classList.add("nav-link");
				button.setAttribute("data-nav-link", "true");
			}
			button.setAttribute("data-nav-index", index);
			button.setAttribute("data-nav-depth", depth || 0);
			styleItem(button, depth || 0, has_children, item.isLink === true);
			links_node.appendChild(button);
			elements.push(button);
			if(has_children) {
				appendMenuItems(item.children, (depth || 0) + 1);
			}
		});
		appendMenuItems(menu_items, 0);

		nav.appendChild(rail);
		nav.appendChild(menu);
		owner.insertBefore(nav, owner.firstChild);
		nav._topLevelNav = {
			root: root,
			items: items,
			menuItems: menu_items,
			clusters: clusters,
			elements: elements,
			menu: menu,
			linksView: links_view,
			keyAttribute: keyAttr,
			resize() {
				var next_height = getHeight(root, fallback, options);
				if(next_height !== height) {
					height = next_height;
					rail.style.height = height + "px";
					var next_clusters = clusterItems(items, height, options);
					// Only the rail depends on available height; keep the menu alive.
					if(next_clusters.length !== clusters.length) {
						clusters = next_clusters;
						rail.textContent = "";
						elements = elements.filter(element => !element._topLevelNavKeys);
						appendTicks();
						nav._topLevelNav.clusters = clusters;
						nav._topLevelNav.elements = elements;
					}
				}
				position(root, nav, fallback);
			}
		};
		[0, 50, 180, 500].forEach(delay => setTimeout(() => {
			if(nav.parentNode) {
				position(root, nav, fallback);
			}
		}, delay));
		return nav;
	};
	var syncActive = (nav, activeKeys, caretKeys) => {
		var active = Object.create(null);
		var caret = Object.create(null);
		var states = [];
		var scrollActiveLinkIntoView = () => {
			var links = nav._topLevelNav.linksView && nav._topLevelNav.linksView.linksNode;
			var menu = nav._topLevelNav.menu;
			var target_state;
			var target;
			var top;
			var bottom;
			var padding = 10;

			if(!links || !menu || menu.style.display === "none") {
				return;
			}
			target_state = states
				.filter(state => !state.tick && state.item.style.display !== "none")
				.find(state => state.caret) ||
				states
					.filter(state => !state.tick && state.item.style.display !== "none")
					.find(state => state.active);
			target = target_state && target_state.item;
			if(!target) {
				return;
			}
			top = target.offsetTop - links.offsetTop;
			bottom = top + target.offsetHeight;
			if(top < links.scrollTop + padding) {
				links.scrollTop = Math.max(0, top - padding);
			} else if(bottom > links.scrollTop + links.clientHeight - padding) {
				links.scrollTop = bottom - links.clientHeight + padding;
			}
		};
		if(!nav || !nav._topLevelNav) return;

		nav._topLevelNav.activeKeys = activeKeys || [];
		nav._topLevelNav.caretKeys = caretKeys || [];
		(activeKeys || []).forEach(key => active[key] = true);
		(caretKeys || []).forEach(key => caret[key] = true);
		nav._topLevelNav.elements.forEach(item => {
			var keys = item._topLevelNavKeys || [item.getAttribute(nav._topLevelNav.keyAttribute)];
			var is_active = keys.some(key => active[key] === true);
			var is_caret = keys.some(key => caret[key] === true);
			states.push({
				item: item,
				active: is_active,
				caret: is_caret,
				tick: !!item._topLevelNavKeys
			});

			item.classList[is_active ? "add" : "remove"]("active");
			item.classList[is_caret ? "add" : "remove"]("caret-active");
			if(item._topLevelNavKeys) {
				var base = item._topLevelNavBaseStyle || { width: 12, height: 2 };
				var visual = item._topLevelNavVisual || item;
				var width = is_caret ? Math.max(base.width + 5, 18) :
					is_active ? Math.max(base.width + 3, 16) : base.width;
				var hovered_index = nav._topLevelNav.hoveredTickIndex;
				var distance = hovered_index === undefined || hovered_index === -1 ? -1 :
					Math.abs(item._topLevelNavTickIndex - hovered_index);
				item.style.width = js.sf("%dpx", width + (TICK_HOVER_GROWTH[distance] || 0));
				visual.style.height = is_caret ?
					js.sf("%dpx", Math.max(base.height + 2, 5)) :
					is_active ? js.sf("%dpx", Math.max(base.height + 1, 4)) : js.sf("%dpx", base.height);
				visual.style.background = is_caret ? "rgba(207,226,245,.96)" :
					is_active ? "rgba(35,35,35,.95)" : "rgba(246,246,246,.88)";
				visual.style.border = is_caret ? "1px solid rgba(91,151,213,.82)" :
					is_active ? "1px solid rgba(255,255,255,.95)" : "1px solid rgba(110,110,110,.78)";
				visual.style.boxShadow = is_caret ?
					"0 0 0 2px rgba(207,226,245,.72),0 1px 5px rgba(72,117,170,.28)" :
					is_active ?
						"0 0 0 2px rgba(255,255,255,.68),0 1px 5px rgba(0,0,0,.34)" :
						"0 0 0 1px rgba(255,255,255,.62),0 1px 3px rgba(0,0,0,.18) inset";
				visual.style.opacity = is_active || is_caret ? "1" : ".96";
			}
		});
		states.filter(state => !state.tick).forEach((state, index, menu_states) => {
			var item = state.item;
			var previous = menu_states[index - 1];
			var next = menu_states[index + 1];
			var joins_previous = state.active && previous && previous.active;
			var joins_next = state.active && next && next.active;

			if(state.active) {
				item.style.background = "rgba(72,72,72,.72)";
				item.style.color = state.caret ? CARET_COLOR : "white";
				item.style.borderRadius = joins_previous ?
					(joins_next ? "0" : "0 0 8px 8px") :
					(joins_next ? "8px 8px 0 0" : "8px");
			} else if(!item.matches(":hover,:focus")) {
				item.style.background = "transparent";
				item.style.color = state.caret ? CARET_COLOR : "white";
				item.style.borderRadius = "8px";
			}
		});
		scrollActiveLinkIntoView();
	};

	return {
		render: render,
		resize: nav => nav && nav._topLevelNav && nav._topLevelNav.resize(),
		syncActive: syncActive,
		position: position,
		open: open,
		toggle: toggle,
		layout: clusterItems
	};
})();
var bindTopLevelNavigationResize = (root, key, callback, delay) => {
	if(!root || !root.vars || root.vars([key])) {
		return;
	}

	var handler = () => root.setTimeout(key + "-timeout", callback, delay || 120);
	root.vars(key, handler);
	window.addEventListener("resize", handler);
	root.once("destroy", () => window.removeEventListener("resize", handler));
};
var runTopLevelNavigationThrottled = (root, key, callback, interval) => {
	var now = Date.now();
	var last_key = key + "-last";
	var timer_key = key + "-timer";
	var last = root && root.vars ? root.vars([last_key]) || 0 : 0;
	var timer = root && root.vars ? root.vars([timer_key]) : null;
	var delay = Math.max(0, (interval || 50) - (now - last));
	var run = () => {
		root.vars(last_key, Date.now());
		root.vars(timer_key, null);
		callback();
	};

	if(!root || !root.vars) {
		callback();
		return;
	}
	if(delay === 0) {
		if(timer) {
			root.clearTimeout(timer_key);
			root.vars(timer_key, null);
		}
		run();
		return;
	}
	if(!timer) {
		root.vars(timer_key, root.setTimeout(timer_key, run, delay));
	}
};

// function state_invalidated(root, source) {
// 	// root.vars("stateChanged").apply(this, [root, source]);
// }
// function state_write(root) {
// 	var tab = root.soup("vcl/ui/Tab");
// 	var getState = root.vars("getState");
	
// 	if(root._vars._loading) return;

// console.log(">>> write editor state " + root.vars(["resource.uri"]));

// 	return root.writeStorage(getKey(tab), getState(root));
// }
// function state_read(root) {
// 	var tab = root.soup("vcl/ui/Tab");
// 	var reflectState = root.vars("reflectState");

// console.log("read editor state " + root.vars(["resource.uri"]));
	
// 	root._vars._loading = true;
// 	root.readStorage(getKey(tab), function(state) {
// 		reflectState(root, state);
// 		delete root._vars._loading;
// 	});
	
// 	if(!root.vars("invalidated")) {
// 		var ace = root.down("#ace");
// 		var ed = ace.getEditor();
		
// 		// var invalidated = root.vars("invalidated", () => state_invalidated(root));
		
// 		var invalidated = () => {};
		
//         ed.selection.on("changeCursor", invalidated);
//         ed.session.on("changeFold", invalidated);
//         ed.session.on("changeSelection", invalidated);
// 	}
// }

[["ui/Form"], {
    activeControl: "ace",
    onActivate() {
    	this.scope().loading.update();
    	this.scope().ace.setFocus();
    	return this.inherited(arguments);	
    },
    onLoad() {
        var tab = this.up("vcl/ui/Tab");
        var scope = this.getScope();
        
/*- refactor this somehow into the specific Editors */

        var ed = scope.ace.getEditor();
        ed.setTheme("ace/theme/eclipse");
        ed.renderer.setHScrollBarAlwaysVisible(false);
        ed.setScrollSpeed(2);

        var resource = this.vars(["resource"]);
        var name = resource.name || (resource.uri || "").split("/").pop();
        var type = (resource.contentType || "").split("/").pop();
        var ext = name.split(".").pop();
        var session = ed.getSession();

		var ace_mode = require("ace" + "/ext/modelist").getModeForPath(resource.uri);
// this.print("ace/ext/modelist", req("ace/ext/modelist"))
// this.print("ace_mode", ace_mode)
		var ext_mode = resource.mode || ExtensionToMode[type || ext || this.getSpecializer()];
        var mode = "ace/mode/" + (ext_mode ? ext_mode : ace_mode ? ace_mode.name : (type || ext || this.getSpecializer() || ""));
        var guessMode = (mode === "" || mode === "ace/mode/text");
        
        if(guessMode) {
        	mode = "js";
        }
        
        // require([mode], 
        // 	function() { session.setMode(mode); }, 
        // 	function() { console.log("Unknown mode " + mode); });
        
        session.setMode(mode);
        
        session.setUseWrapMode(false);
        session.setWrapLimitRange(null, null);

        var onSessionChange = function (e) {
            scope.ace.setTimeout("update", function () {
            	if(guessMode === true) {
            		guessMode = false;
            		if(scope.ace.getValue().startsWith("#!/")) {
            			session.setMode("sh");
            		}
            	}
            	
                var modified = tab.getVar("modified");
                if (modified === "resetundo,gototop") {
                    session.getUndoManager().reset();
                    tab.removeVar("modified");
                    tab.setState("invalidated", true);
                } else {
                    if (session.getUndoManager().hasUndo()) {
                        if (!modified) {
                            tab.setVar("modified", true);
                            tab.setState("invalidated", true);
                        }
                    } else {
                        if (tab.getVar("modified") !== undefined) {
                            tab.removeVar("modified");
                            tab.setState("invalidated", true);
                        }
                    }
                }
            }, 100);
        };
        session.on("change", onSessionChange);
        scope.ace.once("destroy", () => session.off("change", onSessionChange));

        scope.refresh.execute();
        
        return this.inherited(arguments);
    },
    vars: {
  //  	stateChanged(root,source) {
  //  		root.setTimeout("state-invalidated", () => state_write(root), 250);	
  //  	},
  //  	getState(root) {
		// 	var ace = root.down("#ace");
		// 	var ed = ace.getEditor();
		// 	return {
		// 		// font-size, mode
		//         //mode: ed.session.getMode().$id,
		//         position: ed.selection.getCursor(),
		//         selection: ed.selection.toJSON(),
		//         options: ed.session.getOptions(),
		//         folds: ed.session.getAllFolds().map(function(fold) {
		//             return {
		//                 start: fold.start,
		//                 end: fold.end,
		//                 placeholder: fold.placeholder
		//             };
		//         }),
		//         scrollTop: ed.session.getScrollTop(),
		//         scrollLeft: ed.session.getScrollLeft()
		//     };
  //  	},
    	reflectState(root, state) {
		    /*- FIXME setTimeout seems necessary because the row is not yet scrolled into view :-s */               
		    if(state === null) return;
			
			var ace = root.down("#ace");
		    var session = ace.getEditor().session;    
			
			if(state.position) {
		        ace.getEditor().gotoLine(state.position.row + 1,state.position.column);
			}
			
		    state.selection && session.selection.fromJSON(state.selection);
		    state.options && session.setOptions(state.options);
		    state.mode && session.setMode(state.mode);
			state.folds && state.folds.forEach(function(fold){
		    		try {
		    			var Range = require("ace/range").Range;
		            	session.addFold(fold.placeholder, Range.fromPoints(fold.start, fold.end));
				    } catch(e) {
		    		    console.error(e);
		    		}
		    	});
		    session.setScrollTop(state.scrollTop);
		    session.setScrollLeft(state.scrollLeft);
			},
			topLevelNavigation: TopLevelNavigation,
			bindTopLevelNavigationResize: bindTopLevelNavigationResize,
			runTopLevelNavigationThrottled: runTopLevelNavigationThrottled
    }
}, [
    ["vcl/Action", ("menu-open"), {
        hotkey: "Shift+F10",
        on(evt) {
			var scope = this.scope();
			var popup = scope["menu-popup"] || this.udown("#menu-popup");
			if(!popup) return;
			scope["component-menu-popup"] && scope["component-menu-popup"].close();
			scope["state-menu-popup"] && scope["state-menu-popup"].close();
			scope["dialect-menu-popup"] && scope["dialect-menu-popup"].close();
			var tab = this.up("vcl/ui/Tab");
			var modified = !!(tab && tab.getVar("modified"));
			var save = scope["menu-save"] || popup.qs("#menu-save");
			var componentMenu = componentMenuEntries(this, tab && tab.vars("resource.uri"));
			var componentItem = scope["menu-component-class"];
			var componentSeparator = scope["menu-component-separator"];
			var stateMenu = stateMenuEntries(editorRootFor(this));
			var stateItem = scope["menu-state-overlay"];
			var stateSeparator = scope["menu-state-separator"];
			var dialectMenu = dialectMenuEntries(editorRootFor(this));
			var dialectItem = scope["menu-dialect"];
			var anchor = tab && tab.nodeNeeded ? tab.nodeNeeded() : tab || this.up();

			if(componentItem && componentSeparator) {
				componentItem.setVisible(componentMenu !== null);
				componentSeparator.setVisible(componentMenu !== null);
				popup.vars("componentMenu", componentMenu);
				if(componentMenu) {
					componentItem.setContent(js.sf("%H <span class='menu-caret'>›</span>",
						componentMenu.label));
				}
			}
			if(stateItem && stateSeparator) {
				stateItem.setVisible(stateMenu !== null);
				stateSeparator.setVisible(stateMenu !== null);
				popup.vars("stateMenu", stateMenu);
				if(stateMenu) {
					stateItem.setContent(js.sf("%H <span class='menu-caret'>›</span>",
					stateMenu.label));
				}
			}
			if(dialectItem) {
				dialectItem.setVisible(dialectMenu !== null);
				popup.vars("dialectMenu", dialectMenu);
				if(dialectMenu) {
					dialectItem.setContent(js.sf("%H <span class='menu-shortcut'>Shift+Cmd+D</span> <span class='menu-caret'>›</span>",
						dialectMenu.label));
				}
			}
			if(save) {
				save.setEnabled(modified);
				save.render();
			}
			popup.popup({ origin: "bottom-left", dx: 0, dy: 4 }, anchor, function() {});
			evt && evt.preventDefault && evt.preventDefault();
			evt && evt.stopPropagation && evt.stopPropagation();
        }
    }],
    ["vcl/Action", ("ace-settings"), {
        on(evt) {
	// TODO: evt.args?
	this.udown("#ace").getEditor().execCommand("showSettingsMenu", evt && evt.args || []);
        }
    }],
    ["vcl/Action", ("links-open"), {
        on(evt) {
            var scope = this.getScope && this.getScope();
            var ace = scope && scope.ace || (this.udown && this.udown("#ace"));
            var root = ace && ace.up && (
                ace.up("devtools/Editor<>:root") ||
                ace.up("devtools/Editor<js>") ||
                ace.up("devtools/Editor<md>") ||
                ace.up("devtools/Editor<>")
            ) || this.up("devtools/Editor<>:root") || this.up("devtools/Editor<>") || this.up();
            var host = root && root.nodeNeeded && root.nodeNeeded();
            var editor = ace && ace.getEditor && ace.getEditor();
            var mode = editor && editor.session && editor.session.$modeId || "";
            var selector = mode.indexOf("javascript") !== -1 ?
                ".js-toplevel-nav,.md-toplevel-nav" : ".md-toplevel-nav,.js-toplevel-nav";
            var nav = host && host.querySelector && host.querySelector(selector);
            var helper = root && root.vars && root.vars(["topLevelNavigation"]) ||
                (this.vars && this.vars(["topLevelNavigation"]));

            if(!nav) {
                nav = Array.from(document.querySelectorAll(selector))
                    .filter(node => node.offsetParent !== null || node.getClientRects().length > 0)[0];
            }
            if(nav && nav._topLevelNav && nav._topLevelNav.root) {
                root = nav._topLevelNav.root;
                host = root && root.nodeNeeded && root.nodeNeeded();
                helper = root && root.vars && root.vars(["topLevelNavigation"]) || helper;
                ace = root && root.udown && root.udown("#ace") || ace;
            }
            if(evt && evt.preventDefault) {
                evt.preventDefault();
            }
            if(evt && evt.stopPropagation) {
                evt.stopPropagation();
            }
            if(helper && helper.toggle && nav) {
                helper.toggle(root, nav, host, () => ace && ace.setFocus && ace.setFocus());
            }
        }
    }],
	["vcl/Action", ("state-clear"), {
		on() {
			var root = editorRootFor(this);
			var clear = root && root.vars && root.vars(["stateOverlay.clear"]);
			if(clear instanceof Function) {
				return clear.call(root, root);
			}
			alert("No state overlay clear action is available for this editor.");
		}
	}],
	["vcl/Action", ("state-revisions-open"), {
		on() {
			var resource = stateStorageResource(this);
			if(resource) {
				return H("devtools/Revisions", { resource: resource });
			}
			alert("No state overlay resource is available for this editor.");
		}
	}],
    ["vcl/Action", ("refresh"), {
        hotkey: "MetaCtrl+R",
        on(evt) {
            var scope = this.getScope();
            var tab = this.up("vcl/ui/Tab");
            var resource = this.vars(["resource"]);//tab.getVar("resource");
            var editor = scope.ace.getEditor();
            if (resource) {
                scope.loading.show();
                editor.setReadOnly(true);
                editor.blur();
                Resources.get(resource.uri).
                    then(function (res) {
                        if(res.text !== undefined && res.text !== editor.session.getValue()) {
                            tab.setVar("modified", "resetundo,gototop");
                            editor.session.setValue(res.text);
                        } else {
                            tab.removeVar("modified");
                        }
                        tab.setVar("resource.revision", res.revision);
                        editor.setReadOnly(false);
                        editor.focus();
                        scope.loading.hide();
                        tab.emit("resource-loaded");
// STATE READ
// state_read(scope.ace.up());
						// tab.setState("invalidated", true);
                    }).
                    catch(function(res) {
                        editor.setReadOnly(false);
                        editor.focus();

	                        tab.emit("resource-needed");

	                        if(evt && res.status === 404) {
	                            tab.app().confirm(String.format("404 - %s\n\nThis resource does not exist. Would you like to create it?", resource.uri), function(res) {
	                                if(res === true) {
	                                    Resources.create(resource.uri, resource)
	                                        .then(_ => editor.print(_))
	                                        .catch(_ => editor.print(_));
	                                }
	                            });
	                        }

                        scope.loading.hide();
                        tab.emit("resource-loaded");
// STATE READ
// state_read(scope.ace.up());
                    });
            }
        }
	    }],
    ["vcl/Action", ("save-local"), {
        hotkey: "Shift+MetaCtrl+Alt+S",
        on() {
            const resource = this.vars(["resource"]);
            const text = this.ud("#ace").getValue();
            const blob = new Blob([text], { type: "text/plain" });

            if(!resource.name) { // TODO Resources.extrapolate(resource);
                resource.path = resource.uri.split("/");
                resource.name = resource.path.pop();
                resource.path = resource.path.join("/");
                resource.ext = resource.name.split(".").pop();
            }

            const link = document.createElement("a");
            link.setAttribute("href", URL.createObjectURL(blob));
            link.setAttribute("download", resource.name);

            document.body.appendChild(link);
            this.nextTick(() => {
                link.click();
                document.body.removeChild(link);
            });
        }
    }],
    ["vcl/Action", ("save-resource"), {
        on() {
            var scope = this.getScope();
            var resource = this.getVar("resource", true);
            var text = scope.ace.getValue();
            var editor = scope.ace.getEditor();

            // vcl/ui/Tab[uri=devtools/Workspace]:owner-of(.)
            /*- Since it has to be the first owner 'up-wise', expressions become MUCH simpler by using ::up(). Hear, hear, Ext.. */
            var tab = this.up("vcl/ui/Tab");

            if(!resource.uri || !tab.getVar("modified")) {
                return;
            }

            scope.loading.show();
            editor.setReadOnly(true);
            editor.blur();

            resource.text = editor.getValue();
            Resources.update(resource.uri, resource).
                then(function(res) {
                    editor.setReadOnly(false);
                    editor.focus();
                    scope.loading.hide();
                    return res;
                }).
                then(function(res) {
	                    tab.removeVar("modified");
	                    tab.setState("invalidated", true);
	                    if(res.hasOwnProperty("revision")) {
	                        resource.revision = res.revision;
	                    }
	                    tab.emit("resource-saved");
	                }).
	                catch(function(res) {
	                    var msg;
	                    if(res.status === 404) {
		                    // msg = "**WARNING*** - Changes have NOT been saved because the resource is non-existent. Would you like to try to create the resource?";

	                        tab.app().confirm(String.format("404 - %s\n\nThis resource does not exist. Would you like to create it?", resource.uri), function(res) {
	                            if(res === true) {
	                                Resources.create(resource.uri, resource)
	                                    .then(_ => tab.print(_))
	                                    .catch(_ => tab.print(_));
	                            }
	                        });

	                    } else if(res.status === 409) {
		                    msg = "**WARNING*** - The resource has not been saved because it has been changed since loading it. Copy the contents of the resource (to the clipboard eg.) before reloading it.";
	                    } else {
	                        console.error(res);
	                        msg = res.message;
	                    }
	                    msg && alert(String.format("%s\n\n%s - %s", msg, res.status, res.statusText));
	                    scope.loading.hide();
	                });
        }
    }],
    ["vcl/Action", ("save"), {
        hotkey: "MetaCtrl+S",
        parent: "save-resource",
        parentExecute: true
    }],
    ["vcl/Action", ("format"), {
        hotkey: "MetaCtrl+Shift+F",
        on() {
            var Xml = require("util/Xml");
            var scope = this.getScope();
            var editor = scope.ace.getEditor();
            var mode = editor.session.$modeId || "";
            switch (mode.split("/").pop()) {
	            case "javascript":
	            case "json":
	                editor.setValue(js.b(editor.getValue()));
	                break;

	            case "xml":
	            case "svg":
	            case "html":
	            case "xsd":
	                editor.setValue(Xml.beautify(editor.getValue()));
	                break;

	            default:
	                alert("Don't know how to format this (yet)");

            }
        }
    }],
    ["vcl/Action", ("toggle-wrap"), {
        hotkey: "MetaCtrl+Shift+W|MetaCtrl+Shift+50",
        on(evt) {
            var editor = this.scope().ace.getEditor();
            editor.getSession().setUseWrapMode(!editor.getSession().getUseWrapMode());
            evt.preventDefault();
        }
	    }],
    ["vcl/Action", ("evaluate"), {
        parent: "print",
        on() {
            console.warn("Should 'evaluate' whether is component is really needed - " +
                "because it has been deprecated in favor of 'print'");
            this._parent.execute.apply(this._parent, arguments);
        }
    }],
    ["vcl/Action", ("print"), {
        hotkey: "MetaCtrl+Enter|Alt+MetaCtrl+Enter|Shift+MetaCtrl+Enter",
        onExecute: function(evt) {
            var all = require("js/JsObject").all;
            var Deferred = require("js/Deferred");

/* TODO cleanup - @seealso blocks/Factory.prototype.constructor */

				var parentRequire = require;
				var uri = "$HOME/" + this.vars(["resource.uri"]);

				function normalize(uri, module) {
					if(module.includes("!")) {
						module = module.split("!");
						module[1] = js.normalize(uri, module[1]);
						module = module.join("!");
					} else {
						module = js.normalize(uri, module);
					}
					return module;
				}
				function thisRequire(modules, success, error) {
					if(modules instanceof Array) {
						modules = modules.map(module => normalize(uri, module));
					} else {
						modules = normalize(uri, modules);
					}
					return parentRequire(modules, success, error);
				}

				for(var k in parentRequire) {
					thisRequire[k] = parentRequire[k];
				}


            function defer(requirements, callback) {
                var deferred = new Deferred();
                require(requirements, function() {
                    var args = [deferred].concat(js.copy_args(arguments));
                    return callback.apply(this, args);
                });
                return deferred;
            }

			var app = this.app(), ws = this.up("devtools/Workspace<>:root");
            var name = this.vars("label") || this.vars(["resource.uri"]).split("/").pop();
            var scope = this.scope();
            var text = scope.ace.getEditor().getSession().getValue();
            var printer = ws || this;

            name += ("-" + this.hashCode());

            if(text.charAt(0) === "{") {
                text = "(" + text + ")";
            }

            try {
	(function(require) {
		// (this.vars("eval") || window.eval).apply(this, [text]);
		var eval_ = this.vars("eval"), value;
		if(Event_.modifiersMatch(evt, ["metactrl", "alt"])) {
			var hash = req("util/Hash").md5(scope.ace.getValue())
			value = {
				me: this,
				// root: (() => { try { return eval_ ? eval_(text) : eval(text); } catch(e) { return e; } })(),
				text: text,
				text_len: text.length,
				text_hash: hash,
				text_lines: scope.ace.getValue().split("\n"),
				editor: this.up(),
				scope: this.scope(),
				resource: this.vars(["resource"]),
			};

			var root = value.scope['@owner'];
			var map = (value.factories = {});
			(value.components = root._components).map(component => {
					var uri = component._uri, pre = "vcl/Factory!"
        // 					if(component['@factory'] instanceof require("blocks/Factory")) {
								// pre = "blocks/Factory!";
        // 					} else {
        // 					}
						if(uri.indexOf("$HOME/") === 0) uri = uri.substring("$HOME/".length);
					map[uri] = map[uri] || {instances: [], factory: component['@factory']};//require(pre + uri)};
					map[uri].instances.push(component);
				});

				value.controls = root._controls;
				value = Object.create(value, { name: { value: hash } });
		} else {
		value = eval_ ? eval_(text, this) : this.vars(["root"]) || eval(text);
		}
		if(value !== undefined) printer.print(name, value);

		if(Event_.modifiersMatch(evt, ["metactrl", "shift"])) {
			H("devtools/Alphaview<csv>", { sel: [value] });
		}

	}.apply(this, [thisRequire]));
            } catch(e) {
	printer.print(name, e);
            }
        }
    }],
    ["vcl/Action", ("focus-in-navigator"), { // TODO move this to devtools/Main or Workspace
	hotkey: "MetaCtrl+121",
        onExecute: function(evt) {
            var app = this.getApp();
            var resource = this.getVar("resource", true);

            this.ud("devtools/Workspace<>:root", "vcl/ui/Tab[control=navigator]").selectVisible();

            // app.udr("devtools/Workspace<>:owner-of(.) #navigator").selectVisible()
            app.qsa("devtools/Workspace<>:owner-of(.) #navigator #resource-focus", this)
	.execute({resource: resource}, this);
        }
    }],
    ["vcl/ui/Ace", ("ace"), {
	onLoad() {
		var ace = this;
		var root = ace.up();
		var tab = ace.up("vcl/ui/Tab"), loadedListener;
		var disposed = false, dirty = false;
		var bindings = [];
		var flush = () => { if(dirty) writeStorage(); };
		var schedule = () => {
			if(disposed) return;
			dirty = true;
			ace.setTimeout("write-ace-state", flush, 300);
		};
		var bind = (target, event) => {
			target.on(event, schedule);
			bindings.push([target, event]);
		};
		root.on("hide", flush);
		ace.once("destroy", () => {
			flush();
			disposed = true;
			if(loadedListener) tab.off(loadedListener);
			root.off("hide", flush);
			bindings.forEach(([target, event]) => target.off(event, schedule));
			bindings = [];
		});
		var writeStorage = () => {
				if(disposed || !ace._editor) return;
				ace.clearTimeout("write-ace-state");
				dirty = false;
				var ed = ace._editor;
				root.writeStorage("ace", {
					// font-size, mode
			        // mode: ed.session.getMode().$id,
			        position: ed.selection.getCursor(),
			        selection: ed.selection.toJSON(),
			        options: ed.session.getOptions(),
			        folds: ed.session.getAllFolds().map(function(fold) {
			            return {
			                start: fold.start,
			                end: fold.end,
			                placeholder: fold.placeholder
			            };
			        }),
			        scrollTop: ed.session.getScrollTop(),
			        scrollLeft: ed.session.getScrollLeft(),
			        fontSize: ed.getFontSize(),
			        topLevelNavigation: root && root.vars && root.vars(["topLevelNavigation.settings"]) || undefined
				});
		};
		ace.vars("writeAceStorage", writeStorage);

		loadedListener = tab.once("resource-loaded", function() {
			loadedListener = null;
			if(disposed) return;
			root && root.readStorage("ace", function(state) {
				if(disposed) return;
				var ed = ace.getEditor();
				if(state) {
					if(state.topLevelNavigation && root.vars) {
						var navigation = root.vars(["topLevelNavigation"]) || {};
						navigation.settings = state.topLevelNavigation;
						root.vars("topLevelNavigation", navigation);
					}
					state.position && ed.gotoLine(state.position.row + 1,state.position.column);
					    state.selection && ed.session.selection.fromJSON(state.selection);
					    state.options && ed.session.setOptions(state.options);
					    state.mode && ed.session.setMode(state.mode);
						state.folds && state.folds.forEach(function(fold){
							try {
								var Range = require("ace/range").Range;
						ed.session.addFold(fold.placeholder, Range.fromPoints(fold.start, fold.end));
							    } catch(e) {
							    console.error(e);
							}
						});

					    ed.session.setScrollTop(state.scrollTop);
					    ed.session.setScrollLeft(state.scrollLeft);
						ed.setFontSize(state.fontSize || "12px");
				}
			        bind(ed.selection, "changeCursor");
			        bind(ed.selection, "changeSelection");
			        bind(ed.session, "changeFold");
			        bind(ed.session, "changeScrollTop");
			        bind(ed.session, "changeScrollLeft");
			});
		});
	},
	overrides: {
		shown() {
			this.setTimeout("autofocus", () => {
				if(this.isShowing()) this.setFocus();
			}, 250);
			return this.inherited(arguments);
		}
	}
    }],
    ["vcl/ui/Popup", ("menu-popup"), {
		align: "none",
		autoSize: "both",
		autoClose: false,
		hookKeyboard: true,
		visible: false,
		css: {
			"background-color": "white",
			"border": "1px solid #9a9a9a",
			"box-shadow": "0 3px 8px rgba(0,0,0,0.18)",
			"padding": "3px 0",
			"min-width": "150px",
			"z-index": 10001,
			".{Element}": {
				"padding": "4px 24px 4px 12px",
				"position": "relative",
				"white-space": "nowrap",
				"cursor": "default"
			},
			".{Element} .menu-caret": {
				"position": "absolute",
				"right": "12px",
				"top": "50%",
				"transform": "translateY(-50%)"
			},
			".{Element} .menu-shortcut": {
				"float": "right",
				"margin-left": "32px",
				"color": "#777"
			},
			".{Element}:hover": {
				"background-color": "#e9eef8"
			},
			".{Element}.disabled": {
				"color": "#999"
			},
			".{Element}.disabled:hover": {
				"background-color": "transparent"
			},
			".{Element}.separator": {
				"height": "1px",
				"margin": "3px 0",
				"padding": 0,
				"background-color": "#ddd"
			},
			".{Element}.separator:hover": {
				"background-color": "#ddd"
			}
		},
		onClose() {
			this.scope()["component-menu-popup"] && this.scope()["component-menu-popup"].close();
			this.scope()["state-menu-popup"] && this.scope()["state-menu-popup"].close();
			this.scope()["dialect-menu-popup"] && this.scope()["dialect-menu-popup"].close();
		},
		onDispatchChildEvent(component, name, evt) {
			var action = component.vars && component.vars(["action"]);
			if(name === "mouseover" && action !== "component-menu-open") {
				this.scope()["component-menu-popup"] && this.scope()["component-menu-popup"].close();
			}
			if(name === "mouseover" && action !== "state-menu-open") {
				this.scope()["state-menu-popup"] && this.scope()["state-menu-popup"].close();
			}
			if(name === "mouseover" && action !== "dialect-menu-open") {
				this.scope()["dialect-menu-popup"] && this.scope()["dialect-menu-popup"].close();
			}
			if((name === "click" || name === "mouseover") && action && component.isEnabled()) {
				if(action === "component-menu-open") {
					var scope = this.scope();
					var popup = scope["component-menu-popup"];
					var menu = this.vars("componentMenu");
					var node = component.nodeNeeded();
					var rect = node.getBoundingClientRect();
	
					renderComponentMenuItems(scope, menu && menu.entries);
					popup && popup.popup({
						origin: "bottom-left",
						dx: rect.width - 1,
						dy: -rect.height
					}, node, function() {});
					loadComponentMenuSiblings(menu).then(menu => {
						if(menu && popup && popup.isVisible()) {
							renderComponentMenuItems(scope, menu.entries);
						}
					});
				} else if(action === "state-menu-open") {
					var scope = this.scope();
					var popup = scope["state-menu-popup"];
					var menu = this.vars("stateMenu");
					var node = component.nodeNeeded();
					var rect = node.getBoundingClientRect();
	
					renderStateMenuItems(scope, menu && menu.entries);
					popup && popup.popup({
						origin: "bottom-left",
						dx: rect.width - 1,
						dy: -rect.height
					}, node, function() {});
				} else if(action === "dialect-menu-open") {
					var scope = this.scope();
					var popup = scope["dialect-menu-popup"];
					var menu = dialectMenuEntries(editorRootFor(this));
					var node = component.nodeNeeded();
					var rect = node.getBoundingClientRect();
	
					this.vars("dialectMenu", menu);
					renderDialectMenuItems(scope, menu && menu.entries);
					popup && popup.popup({
						origin: "bottom-left",
						dx: rect.width - 1,
						dy: -rect.height
					}, node, function() {});
				} else if(name === "click" && action === "editor-close") {
					this.scope()["component-menu-popup"] && this.scope()["component-menu-popup"].close();
					this.scope()["state-menu-popup"] && this.scope()["state-menu-popup"].close();
					this.scope()["dialect-menu-popup"] && this.scope()["dialect-menu-popup"].close();
					this.close();
					var tab = this.up("vcl/ui/Tab");
					if(tab && tab._control && tab._control._form) {
						tab._control._form.close();
					}
				} else if(name === "click") {
					this.scope()["component-menu-popup"] && this.scope()["component-menu-popup"].close();
					this.scope()["state-menu-popup"] && this.scope()["state-menu-popup"].close();
					this.scope()["dialect-menu-popup"] && this.scope()["dialect-menu-popup"].close();
					this.close();
					(this.scope()[action] || this.udown("#" + action)).execute(evt);
				}
				evt && evt.preventDefault && evt.preventDefault();
			}
			return this.inherited(arguments);
		}
    }, [
		["vcl/ui/Element", ("menu-component-class"), {
			content: "",
			visible: false,
			vars: { action: "component-menu-open" }
		}],
		["vcl/ui/Element", ("menu-component-separator"), {
			classes: "separator",
			visible: false
		}],
		["vcl/ui/Element", ("menu-state-overlay"), {
			content: "",
			visible: false,
			vars: { action: "state-menu-open" }
		}],
		["vcl/ui/Element", ("menu-state-separator"), {
			classes: "separator",
			visible: false
		}],
		["vcl/ui/Element", ("menu-save"), {
			content: "Save",
			vars: { action: "save" }
		}],
		["vcl/ui/Element", {
			content: "Save Locally",
			vars: { action: "save-local" }
		}],
		["vcl/ui/Element", {
			content: "Format <span class='menu-shortcut'>Shift+Cmd+F</span>",
			vars: { action: "format" }
		}],
		["vcl/ui/Element", {
			content: "Toggle Word Wrap <span class='menu-shortcut'>Shift+Cmd+W</span>",
			vars: { action: "toggle-wrap" }
		}],
		["vcl/ui/Element", {
			classes: "separator"
		}],
		["vcl/ui/Element", {
			content: "Editor Settings... <span class='menu-shortcut'>Cmd+,</span>",
			vars: { action: "ace-settings" }
		}],
		["vcl/ui/Element", ("menu-dialect"), {
			content: "",
			visible: false,
			vars: { action: "dialect-menu-open" }
		}],
		["vcl/ui/Element", {
			classes: "separator"
		}],
		["vcl/ui/Element", {
			content: "Close",
			vars: { action: "editor-close" }
		}]
    ]],
    ["vcl/ui/Popup", ("state-menu-popup"), {
		align: "none",
		autoSize: "both",
		autoClose: false,
		hookKeyboard: true,
		visible: false,
		css: {
			"background-color": "white",
			"border": "1px solid #9a9a9a",
			"box-shadow": "0 3px 8px rgba(0,0,0,0.18)",
			"padding": "3px 0",
			"min-width": "180px",
			"z-index": 10002,
			".{Element}": {
				"padding": "4px 24px 4px 12px",
				"white-space": "nowrap",
				"cursor": "default"
			},
			".{Element}:hover": {
				"background-color": "#e9eef8"
			},
			".{Element}.separator": {
				"height": "1px",
				"margin": "3px 0",
				"padding": 0,
				"background-color": "#ddd"
			},
			".{Element}.separator:hover": {
				"background-color": "#ddd"
			}
		},
		onDispatchChildEvent(component, name, evt) {
			var entry = component.vars && component.vars("stateMenuEntry");
			if((name === "mousedown" || name === "click" || name === "tap") && entry && component.isEnabled()) {
				var main = this.scope()["menu-popup"];
				var action = entry.action && (this.scope()[entry.action] || this.udown("#" + entry.action));
				this.close();
				main && main.close();
				action && action.execute(evt);
				evt && evt.preventDefault && evt.preventDefault();
				evt && evt.stopPropagation && evt.stopPropagation();
				return false;
			}
			return this.inherited(arguments);
		}
	}, [
		["vcl/ui/Element", ("state-menu-item-0"), { visible: false }],
		["vcl/ui/Element", ("state-menu-item-1"), { visible: false }],
		["vcl/ui/Element", ("state-menu-item-2"), { visible: false }],
		["vcl/ui/Element", ("state-menu-item-3"), { visible: false }],
		["vcl/ui/Element", ("state-menu-item-4"), { visible: false }],
		["vcl/ui/Element", ("state-menu-item-5"), { visible: false }],
		["vcl/ui/Element", ("state-menu-item-6"), { visible: false }],
		["vcl/ui/Element", ("state-menu-item-7"), { visible: false }]
    ]],
    ["vcl/ui/Popup", ("dialect-menu-popup"), {
		align: "none",
		autoSize: "both",
		autoClose: false,
		hookKeyboard: true,
		visible: false,
		css: {
			"background-color": "white",
			"border": "1px solid #9a9a9a",
			"box-shadow": "0 3px 8px rgba(0,0,0,0.18)",
			"padding": "3px 0",
			"min-width": "140px",
			"z-index": 10002,
			".{Element}": {
				"padding": "4px 24px 4px 12px",
				"white-space": "nowrap",
				"cursor": "default"
			},
			".{Element}:hover": {
				"background-color": "#e9eef8"
			},
			".{Element}.selected": {
				"font-weight": "600"
			}
		},
		onDispatchChildEvent(component, name, evt) {
			var entry = component.vars && component.vars("dialectMenuEntry");
			if((name === "mousedown" || name === "click" || name === "tap") && entry && component.isEnabled()) {
				var main = this.scope()["menu-popup"];
				var action = entry.action && (this.scope()[entry.action] || this.udown("#" + entry.action));
				this.close();
				main && main.close();
				action && action.execute(evt);
				evt && evt.preventDefault && evt.preventDefault();
				evt && evt.stopPropagation && evt.stopPropagation();
				return false;
			}
			return this.inherited(arguments);
		}
	}, [
		["vcl/ui/Element", ("dialect-menu-item-0"), { visible: false }],
		["vcl/ui/Element", ("dialect-menu-item-1"), { visible: false }]
    ]],
    ["vcl/ui/Popup", ("component-menu-popup"), {
		align: "none",
		autoSize: "both",
		autoClose: false,
		hookKeyboard: true,
		visible: false,
		css: {
			"background-color": "white",
			"border": "1px solid #9a9a9a",
			"box-shadow": "0 3px 8px rgba(0,0,0,0.18)",
			"padding": "3px 0",
			"min-width": "180px",
			"z-index": 10002,
			".{Element}": {
				"padding": "4px 24px 4px 12px",
				"white-space": "nowrap",
				"cursor": "default"
			},
			".{Element}:hover": {
				"background-color": "#e9eef8"
			},
			".{Element}.separator": {
				"height": "1px",
				"margin": "3px 0",
				"padding": 0,
				"background-color": "#ddd"
			},
				".{Element}.separator:hover": {
					"background-color": "#ddd"
				}
			},
		onDispatchChildEvent(component, name, evt) {
			var entry = component.vars && component.vars("componentMenuEntry");
			if((name === "mousedown" || name === "click" || name === "tap") && entry && component.isEnabled()) {
				var scope = this.scope();
				var owner = scope["@owner"];
				var ws = owner && owner.up && owner.up("devtools/Workspace<>:root");
				var editorNeeded = component.udr && component.udr("#editor-needed") ||
					this.udr && this.udr("#editor-needed") ||
					owner && owner.udr && owner.udr("#editor-needed") ||
					ws && ws.down("#editor-needed") ||
					this.app().down("devtools/Workspace<>:root:selected #editor-needed");
				var main = this.scope()["menu-popup"];
				var menu = main && main.vars("componentMenu");
				var tab;
				this.close();
				main && main.close();
				if(entry.action === "console") {
					(ws || this.app()).print("component-menu", menu);
				} else if(entry.resourceUri) {
					tab = editorNeeded && editorNeeded.execute({
						selected: true,
						resource: {
							uri: entry.resourceUri
						}
					});
					tab && tab.setSelected && tab.setSelected(true);
				}
				evt && evt.preventDefault && evt.preventDefault();
				evt && evt.stopPropagation && evt.stopPropagation();
				return false;
			}
			return this.inherited(arguments);
		}
    }, [
		["vcl/ui/Element", ("component-menu-item-0"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-1"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-2"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-3"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-4"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-5"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-6"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-7"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-8"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-9"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-10"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-11"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-12"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-13"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-14"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-15"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-16"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-17"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-18"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-19"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-20"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-21"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-22"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-23"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-24"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-25"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-26"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-27"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-28"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-29"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-30"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-31"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-32"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-33"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-34"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-35"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-36"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-37"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-38"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-39"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-40"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-41"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-42"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-43"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-44"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-45"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-46"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-47"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-48"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-49"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-50"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-51"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-52"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-53"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-54"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-55"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-56"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-57"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-58"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-59"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-60"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-61"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-62"), { visible: false }],
		["vcl/ui/Element", ("component-menu-item-63"), { visible: false }]
    ]],
    ["vcl/ui/Panel", ("loading"), {
        align: "none",
        autoSize: "both",
        css: {
            opacity: "0.75",
            background: "white url(/shared/vcl/images/loading.gif) no-repeat center center",
            "z-index": "10000",
            left: 0, top: 0, bottom: 0, right: 0
        },
        visible: false,
        
        /* TODO fade out */
        onLoad() {
            var canHide = Date.now();
            this.override({
                showNode: function() {
                    this.clearTimeout("hideNode");
                    canHide = Date.now() + 250;
                    return this.inherited(arguments);
                },
                hideNode: function() {
                    var me = this, args = js.copy_args(arguments);
                    args.callee = arguments.callee;
                    this.setTimeout(function() {
                        me.inherited(args);
                    }, canHide - Date.now());
                }
            });
        }
    }],
]];
