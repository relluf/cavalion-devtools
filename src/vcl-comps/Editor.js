"devtools/Resources, util/Xml, vcl/ui/Tab, util/Event, ace/ext-modelist";

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
var nameOf = (uri) => (uri||"").split("/").pop().replace(/\//g, ".");
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
	var clamp = (value, min, max) => Math.max(min, Math.min(max, value));
	var getHostRect = (root, fallback) => {
		var host = root && root.nodeNeeded ? root.nodeNeeded() : fallback;
		return host && host.getBoundingClientRect ? host.getBoundingClientRect() : null;
	};
	var getSide = (root, options = {}) => {
		var navigation = root && root.getVar ? root.getVar("topLevelNavigation", false) :
			root && root.vars && root.vars(["topLevelNavigation"]);
		var side = options.side || navigation && navigation.side || "right";
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
		var side = getSide(root, nav && nav._topLevelNavOptions);
		var top = rect ? rect.top + (rect.height / 2) : window.innerHeight / 2;
		var right = rect ? Math.max(12, window.innerWidth - rect.right + NAV_HORIZONTAL_MARGIN) : 22;
		var left = rect ? Math.max(0, rect.left + NAV_HORIZONTAL_MARGIN) : NAV_HORIZONTAL_MARGIN;
		var menu = nav && nav._topLevelNav && nav._topLevelNav.menu ||
			nav && nav.querySelector && nav.querySelector(".md-toplevel-nav-menu,.js-toplevel-nav-menu");

		nav.style.top = js.sf("%dpx", Math.round(top));
		nav.style.left = side === "left" ? js.sf("%dpx", Math.round(left)) : "";
		nav.style.right = side === "right" ? js.sf("%dpx", Math.round(right)) : "";
		if(menu) {
			menu.style.left = side === "left" ? "0" : "";
			menu.style.right = side === "right" ? "0" : "";
		}
	};
	var open = (root, nav, fallback) => {
		var state = nav && nav._topLevelNav;
		var menu = state && state.menu;
		var input = state && state.linksView && state.linksView.input;

		if(!nav || !menu) {
			return false;
		}

		position(root, nav, fallback);
		menu._topLevelNavKeepOpen = true;
		menu.style.display = "block";
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
	var styleTick = (tick, cluster) => {
		var count = cluster.items.length;
		var height = count > 1 ? Math.min(4, 2 + Math.ceil(Math.log(count + 1) / Math.log(2))) : 2;
		var width = count > 1 ? Math.min(15, 12 + Math.ceil(Math.log(count + 1) / Math.log(2))) : 12;

		tick.style.cssText = [
			"appearance:none",
			"-webkit-appearance:none",
			"border:1px solid rgba(110,110,110,.78)",
			"border-radius:999px",
			"background:rgba(246,246,246,.88)",
			js.sf("width:%dpx", width),
			js.sf("height:%dpx", height),
			"padding:0",
			"margin:0",
			"cursor:pointer",
			"display:block",
			"opacity:.96",
			"box-shadow:0 0 0 1px rgba(255,255,255,.62),0 1px 3px rgba(0,0,0,.18) inset"
		].join(";");
		tick._topLevelNavBaseStyle = {
			width: width,
			height: height
		};
	};
	var styleItem = (item, depth, has_children) => {
		var highlight = () => {
			item.style.background = "rgba(82,82,82,.86)";
			item.style.color = "white";
		};
		var unhighlight = () => {
			if(item.classList.contains("active") === false) {
				item.style.background = "transparent";
				item.style.color = "white";
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
		var getButtons;
		var setSelected;

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
				"padding": "8px 10px",
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
					navigateKey(buttons[selected_index].getAttribute(keyAttr));
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
		var items = (options.items || []).map((item, index) => {
			item.navLabel = options.getLabel ? options.getLabel(item, index) : (item.label || item.text || item.name || "Item");
			item.navKey = options.getKey ? options.getKey(item, index) : (item.key || String(index));
			return item;
		});
		var prepareMenuItems = (nodes) => (nodes || []).map((item, index) => {
			item.navMenuLabel = options.getMenuLabel ?
				options.getMenuLabel(item, index) : (item.menuLabel || item.navLabel || item.label || item.text || item.name || "Item");
			item.navKey = item.navKey || (options.getKey ? options.getKey(item, index) : (item.key || String(index)));
			if(item.children && item.children.length) {
				item.children = prepareMenuItems(item.children);
			}
			return item;
		});
		var menu_items = prepareMenuItems(options.menuItems || items);
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
			side === "left" ? "align-items:flex-start" : "align-items:flex-end",
			"justify-content:center",
			js.sf("gap:%dpx", TICK_GAP),
			"width:34px",
			js.sf("height:%dpx", height),
			"box-sizing:border-box",
			"overflow:hidden",
			js.sf("padding:%dpx 0", RAIL_PADDING / 2),
			"position:relative",
			"z-index:2"
		].join(";");
		menu.style.cssText = [
			"position:absolute",
			side === "left" ? "left:0" : "right:0",
			"top:50%",
			"transform:translateY(-50%)",
			"min-width:220px",
			"max-width:360px",
			"max-height:60vh",
			"overflow:auto",
			"padding:8px",
			"border-radius:12px",
			"background:rgba(52,52,52,.96)",
			"box-shadow:0 12px 34px rgba(0,0,0,.26)",
			"display:none",
			"z-index:3"
		].join(";");
		position(root, nav, fallback);
		var navigateKey = (key) => {
			if(key && options.onNavigate) {
				menu._topLevelNavKeepOpen = true;
				menu.style.display = "block";
				options.onNavigate(key);
			}
		};
		links_view = createLinksView(root, menu, options, keyAttr, navigateKey);
		links_node = links_view.linksNode;
		var showMenu = () => {
			position(root, nav, fallback);
			menu.style.display = "block";
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

		nav.addEventListener("mouseenter", () => {
			showMenu();
			links_view.input.setFocus && links_view.input.setFocus();
		});
		nav.addEventListener("mouseleave", hideMenuWhenIdle);
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
			navigateKey(key);
		};
		nav.addEventListener("pointerdown", navigateFromEvent);
		nav.addEventListener("click", navigateFromEvent);

		clusters.forEach((cluster, index) => {
			var tick = document.createElement("BUTTON");
			var title = cluster.items.map(titleText).filter(Boolean).join("\n");

			tick.type = "button";
			tick.className = options.tickClassName;
			tick.title = title;
			tick.setAttribute("aria-label", cluster.items.length === 1 ? title : js.sf("%d items", cluster.items.length));
			tick.setAttribute("data-nav-cluster", index);
			tick._topLevelNavKeys = cluster.items.map(item => item.navKey);
			styleTick(tick, cluster);
			rail.appendChild(tick);
			elements.push(tick);
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
			button.setAttribute("data-nav-index", index);
			button.setAttribute("data-nav-depth", depth || 0);
			styleItem(button, depth || 0, has_children);
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
			items: items,
			menuItems: menu_items,
			clusters: clusters,
			elements: elements,
			menu: menu,
			linksView: links_view,
			keyAttribute: keyAttr
		};
		return nav;
	};
	var syncActive = (nav, activeKeys, caretKeys) => {
		var active = Object.create(null);
		var caret = Object.create(null);
		var states = [];
		if(!nav || !nav._topLevelNav) return;

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
				item.style.width = is_caret ?
					js.sf("%dpx", Math.max(base.width + 5, 18)) :
					is_active ? js.sf("%dpx", Math.max(base.width + 3, 16)) : js.sf("%dpx", base.width);
				item.style.height = is_caret ?
					js.sf("%dpx", Math.max(base.height + 2, 5)) :
					is_active ? js.sf("%dpx", Math.max(base.height + 1, 4)) : js.sf("%dpx", base.height);
				item.style.background = is_caret ? "rgba(207,226,245,.96)" :
					is_active ? "rgba(35,35,35,.95)" : "rgba(246,246,246,.88)";
				item.style.border = is_caret ? "1px solid rgba(91,151,213,.82)" :
					is_active ? "1px solid rgba(255,255,255,.95)" : "1px solid rgba(110,110,110,.78)";
				item.style.boxShadow = is_caret ?
					"0 0 0 2px rgba(207,226,245,.72),0 1px 5px rgba(72,117,170,.28)" :
					is_active ?
						"0 0 0 2px rgba(255,255,255,.68),0 1px 5px rgba(0,0,0,.34)" :
						"0 0 0 1px rgba(255,255,255,.62),0 1px 3px rgba(0,0,0,.18) inset";
				item.style.opacity = is_active || is_caret ? "1" : ".96";
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
				item.style.color = "white";
				item.style.borderRadius = joins_previous ?
					(joins_next ? "0" : "0 0 8px 8px") :
					(joins_next ? "8px 8px 0 0" : "8px");
			} else if(!item.matches(":hover,:focus")) {
				item.style.background = "transparent";
				item.style.color = "white";
				item.style.borderRadius = "8px";
			}
		});
	};

	return {
		render: render,
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
			clearTimeout(timer);
			root.vars(timer_key, null);
		}
		run();
		return;
	}
	if(!timer) {
		root.vars(timer_key, setTimeout(run, delay));
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

        session.on("change", function (e) {
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
        });

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
        	// TODO: evt.args?
        	this.udown("#ace").getEditor().execCommand("showSettingsMenu",  evt.args || []);
        }
    }],
    ["vcl/Action", ("links-open"), {
        hotkey: "Cmd+E",
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
    		var writeStorage = () => {
				var ed = ace.getEditor();
				ace.up().writeStorage("ace", {
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
			        fontSize: ed.getFontSize()
				});
    		};

    		this.up("vcl/ui/Tab").once("resource-loaded", function() {
    			var root = ace.up();
    			root && root.readStorage("ace", function(state) {
					var ed = ace.getEditor();
	    			if(state) {
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
			        ed.selection.on("changeCursor", writeStorage);
			        ed.session.on("changeFold", writeStorage);
			        ed.session.on("changeSelection", writeStorage);
	    		});
    		});
    	},
    	overrides: {
    		shown() {
    			this.setTimeout("autofocus", () => this.setFocus(), 250);
    		}
    	}
    }],
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
