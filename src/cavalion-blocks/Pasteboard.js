/*-

# Persistent paste history for images and resource groups

Press Alt+[Cmd+]V to show or hide the Pasteboard. Paste events themselves keep
using Cmd+V and are only intercepted when they contain resources below
/Users/ralph/fs or an image.

*/

function retrieveImageFromClipboardAsBase64(pasteEvent, callback, imageFormat) {
	if(!pasteEvent.clipboardData) {
		if(typeof callback === "function") callback(undefined);
		return;
	}

	const items = pasteEvent.clipboardData.items;
	if(!items) {
		if(typeof callback === "function") callback(undefined);
		return;
	}

	for(let i = 0; i < items.length; i++) {
		if(items[i].type.indexOf("image") === -1) continue;

		const blob = items[i].getAsFile();
		const canvas = document.createElement("canvas");
		const context = canvas.getContext("2d");
		const image = new Image();
		const objectUrl = (window.URL || window.webkitURL).createObjectURL(blob);

		image.onload = function() {
			canvas.width = this.width;
			canvas.height = this.height;
			context.drawImage(image, 0, 0);
			if(typeof callback === "function") {
				callback(canvas.toDataURL(imageFormat || "image/png"), image, canvas);
			}
			(window.URL || window.webkitURL).revokeObjectURL(objectUrl);
		};
		image.src = objectUrl;
	}
}

const RESOURCE_PREFIX = "/Users/ralph/fs";
const STORAGE_KEY = "history";
const STORAGE_DOCUMENT = "cavalion-code/Pasteboard";
const STORAGE_PROPERTY = "cavalion-vcl:state";

function uniqueId(prefix) {
	return js.sf("%s-%s-%s", prefix, Date.now().toString(36),
		Math.random().toString(36).substring(2, 10));
}
function generatedItemName(prefix, timestamp) {
	const date = new Date(timestamp);
	const pad = (value, length) => String(value).padStart(length, "0");
	return prefix + "-" + [
		pad(date.getFullYear(), 4),
		pad(date.getMonth() + 1, 2),
		pad(date.getDate(), 2)
	].join("") + "-" + [
		pad(date.getHours(), 2),
		pad(date.getMinutes(), 2),
		pad(date.getSeconds(), 2)
	].join("") + "." + pad(date.getMilliseconds(), 3);
}
function normalizeGeneratedItemName(item) {
	const match = String(item.name || "").match(/^(Pasteboard|Resources|Image)-(\d+)$/);
	if(!match) return item.name;
	if(item.kind === "resource-group" && match[1] !== "Image") {
		return generatedItemName("Resources", parseInt(match[2], 10));
	}
	if(item.kind === "image" && match[1] === "Image") {
		return generatedItemName("Image", parseInt(match[2], 10));
	}
	return item.name;
}
function clone(value) {
	return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}
function emptyHistory(origin) {
	return {
		version: 1,
		updatedAt: 0,
		origin: origin || "",
		tabs: [],
		items: []
	};
}
function entityVersion(entity) {
	return js.sf("%015d:%s", entity && (entity.updatedAt || entity.deletedAt || entity.created) || 0,
		entity && entity.origin || "");
}
function normalizeHistory(value, origin) {
	if(typeof value === "string") {
		try { value = JSON.parse(value); }
		catch(e) { value = null; }
	}
	if(value instanceof Array) value = {items: value};
	value = value && typeof value === "object" ? clone(value) : emptyHistory(origin);
	value.version = 1;
	value.updatedAt = value.updatedAt || 0;
	value.origin = value.origin || "";
	value.tabs = (value.tabs || []).map((tab, index) => {
		tab.id = tab.id || "legacy-tab-" + index;
		tab.name = tab.name || "Group " + (index + 1);
		tab.created = tab.created || value.updatedAt || 0;
		tab.updatedAt = tab.updatedAt || tab.created;
		tab.order = isFinite(tab.order) ? tab.order : index;
		return tab;
	});
	value.items = (value.items || []).map((item, index) => {
		item.kind = item.kind || (item.dataUrl ? "image" : "resource-group");
		item.name = normalizeGeneratedItemName(item);
		item.id = item.id || js.sf("legacy-%s-%s-%d", item.kind, item.created || 0, index);
		item.created = item.created || value.updatedAt || 0;
		item.updatedAt = item.updatedAt || item.created;
		item.order = isFinite(item.order) ? item.order : index;
		return item;
	});
	return value;
}
function mergeEntities(left, right) {
	const byId = {};
	left.concat(right).forEach(entity => {
		const current = byId[entity.id];
		if(!current || entityVersion(entity) > entityVersion(current)) {
			byId[entity.id] = clone(entity);
		}
	});
	return Object.keys(byId).map(id => byId[id]).sort((a, b) =>
		(a.order - b.order) || (a.created - b.created) || a.id.localeCompare(b.id));
}
function mergeHistory(left, right, origin) {
	left = normalizeHistory(left, origin);
	right = normalizeHistory(right, origin);
	const newer = js.sf("%015d:%s", left.updatedAt, left.origin) >=
		js.sf("%015d:%s", right.updatedAt, right.origin) ? left : right;
	return {
		version: 1,
		updatedAt: Math.max(left.updatedAt, right.updatedAt),
		origin: newer.origin,
		tabs: mergeEntities(left.tabs, right.tabs),
		items: mergeEntities(left.items, right.items)
	};
}
function historiesEqual(left, right, origin) {
	return JSON.stringify(normalizeHistory(left, origin)) ===
		JSON.stringify(normalizeHistory(right, origin));
}
function state(owner) {
	return owner.vars(["pasteboard"]);
}
function liveItems(history) {
	return history.items.filter(item => !item.deletedAt).sort((a, b) =>
		(a.order - b.order) || (a.created - b.created) || a.id.localeCompare(b.id));
}
function visibleItems(owner) {
	const pasteboard = state(owner);
	return liveItems(pasteboard.history).filter(item =>
		!pasteboard.activeTab || item.tabId === pasteboard.activeTab);
}
function activeResourceGroups(history) {
	return liveItems(history).filter(item => item.kind === "resource-group");
}
function touchHistory(owner, history) {
	const timestamp = Date.now();
	history.updatedAt = Math.max(timestamp, history.updatedAt + 1);
	history.origin = state(owner).instanceId;
	return history.updatedAt;
}
function touchEntity(owner, entity, timestamp) {
	entity.updatedAt = timestamp || touchHistory(owner, state(owner).history);
	entity.origin = state(owner).instanceId;
	return entity;
}
function resourceGroupRoot(group) {
	return "dropped://" + group.name;
}
function refreshDroppedNavigator(owner) {
	owner.app().qsa("#DragDropHandler_files").forEach(node => {
		node.show();
		node.reloadChildNodes();
	});
}
function synchronizeResourceGroups(owner) {
	req("devtools/Resources-ddh").setResourceGroups(activeResourceGroups(state(owner).history));
	refreshDroppedNavigator(owner);
}
function storageUri(owner) {
	const Component = req("vcl/Component");
	const database = owner.vars(["storage-db"]) || Component.storageDB;
	const storageKey = owner.getStorageKey();
	return database && database.name ?
		js.sf("pouchdb://%s/%s", database.name, storageKey) :
		"localStorage://" + storageKey;
}
function watchHistory(owner) {
	if(typeof owner.watchStorage === "function") {
		return owner.watchStorage(STORAGE_KEY,
			value => receiveHistory(owner, value),
			err => console.error("Pasteboard storage watch failed", err));
	}

	const Component = req("vcl/Component");
	const database = owner.vars(["storage-db"]) || Component.storageDB;
	const storageKey = owner.getStorageKey();
	if(database && typeof database.changes === "function") {
		return database.changes({
			since: "now",
			live: true,
			include_docs: true,
			doc_ids: [storageKey]
		}).on("change", change => {
			const doc = change && change.doc;
			if(doc && !change.deleted) {
				receiveHistory(owner, doc[STORAGE_PROPERTY] && js.get(STORAGE_KEY, doc[STORAGE_PROPERTY]));
			}
		}).on("error", err => console.error("Pasteboard PouchDB watch failed", err));
	}

	const listener = evt => {
		if(evt.key === owner.getStorageKey(STORAGE_KEY) && evt.newValue !== null) {
			receiveHistory(owner, evt.newValue);
		}
	};
	window.addEventListener("storage", listener);
	return {cancel: () => window.removeEventListener("storage", listener)};
}
function setHistory(owner, history) {
	const pasteboard = state(owner);
	pasteboard.history = normalizeHistory(history, pasteboard.instanceId);
	pasteboard.selected = pasteboard.selected.filter(id =>
		pasteboard.history.items.some(item => item.id === id && !item.deletedAt));
	if(pasteboard.activeTab && !pasteboard.history.tabs.some(tab =>
		tab.id === pasteboard.activeTab && !tab.deletedAt)) {
		pasteboard.activeTab = null;
	}
	synchronizeResourceGroups(owner);
	render(owner);
}
function saveHistory(owner) {
	owner.setTimeout("pasteboard-save-history", () => {
		const pasteboard = state(owner);
		const local = clone(pasteboard.history);
		owner.readStorage(STORAGE_KEY, remote => {
			const merged = mergeHistory(remote, local, pasteboard.instanceId);
			setHistory(owner, merged);
			owner.writeStorage(STORAGE_KEY, JSON.stringify(merged), null, err =>
				console.error("Could not save Pasteboard history", err));
		}, err => console.error("Could not merge Pasteboard history", err));
	}, 40);
}
function receiveHistory(owner, incoming) {
	const pasteboard = state(owner);
	const merged = mergeHistory(pasteboard.history, incoming, pasteboard.instanceId);
	const incomingWasComplete = historiesEqual(merged, incoming, pasteboard.instanceId);
	setHistory(owner, merged);
	if(!incomingWasComplete && (merged.items.length || merged.tabs.length)) saveHistory(owner);
}
function addItem(owner, item) {
	const pasteboard = state(owner);
	const items = liveItems(pasteboard.history);
	const timestamp = touchHistory(owner, pasteboard.history);
	item.id = item.id || uniqueId(item.kind || "item");
	item.created = item.created || timestamp;
	item.order = items.length ? items[0].order - 1 : 0;
	item.tabId = pasteboard.activeTab || item.tabId || null;
	touchEntity(owner, item, timestamp);
	pasteboard.history.items.push(item);
	setHistory(owner, pasteboard.history);
	pasteboard.selected = [item.id];
	pasteboard.anchor = item.id;
	render(owner);
	saveHistory(owner);
	return item;
}

function clipboardText(clipboardData) {
	return clipboardData && (
		clipboardData.getData("text/uri-list") ||
		clipboardData.getData("text/plain") ||
		clipboardData.getData("text")
	) || "";
}
function mappedResourceUris(text) {
	return String(text || "")
		.split(/\r?\n/)
		.map(line => line.trim())
		.filter(line => line && line.charAt(0) !== "#")
		.map(line => {
			if(line.charAt(0) === "\"" && line.charAt(line.length - 1) === "\"") {
				line = line.substring(1, line.length - 1);
			}
			if(/^file:\/\//.test(line)) {
				try { line = decodeURIComponent(new URL(line).pathname); }
				catch(e) { return null; }
			}
			if(line !== RESOURCE_PREFIX && !line.startsWith(RESOURCE_PREFIX + "/")) return null;
			return "/" + line.substring(RESOURCE_PREFIX.length).replace(/^\/+/, "");
		})
		.filter((uri, index, uris) => uri &&
			!uri.replace(/\/$/, "").endsWith("-") && uris.indexOf(uri) === index);
}
function resourceParent(uri) {
	const path = uri.replace(/\/$/, "").split("/");
	path.pop();
	return path.join("/") || "/";
}
function describeResources(uris) {
	const Resources = req("devtools/Resources");
	const parents = {};
	let resource;

	uris.forEach(uri => parents[resourceParent(uri)] = null);
	return Promise.all(Object.keys(parents).map(parent => Resources.list(parent)
		.catch(() => [])
		.then(resources => parents[parent] = resources)
	)).then(() => uris.map(uri => {
		const name = uri.replace(/\/$/, "").split("/").pop() || "/";
		resource = parents[resourceParent(uri)].find(candidate => candidate.name === name);
		return {
			name: name,
			targetUri: uri,
			type: resource && resource.type || (uri.endsWith("/") ? "Folder" : "File"),
			contentType: resource && resource.contentType
		};
	}));
}
function openResource(owner, resource) {
	const editorNeeded = owner.app().down("devtools/Workspace<>:root:selected #editor-needed");
	if(editorNeeded) return editorNeeded.execute({resource: resource, selected: true});
	if(typeof window.O === "function") {
		const uri = resource.type === "Folder" && !resource.uri.endsWith("/") ?
			resource.uri + "/" : resource.uri;
		return window.O(uri);
	}
}
function pasteResources(owner, uris) {
	return describeResources(uris).then(resources => {
		const timestamp = Date.now();
		const group = addItem(owner, {
			kind: "resource-group",
			name: generatedItemName("Resources", timestamp),
			resources: resources,
			type: "Folder"
		});
		openPasteboard(owner);
		app.toast({
			content: js.sf("%d resource%s pasted", resources.length, resources.length === 1 ? "" : "s"),
			classes: "glassy fade",
			timeout: 2500
		});
		return group;
	});
}
function handler(evt, owner) {
	const uris = mappedResourceUris(clipboardText(evt.clipboardData));
	if(uris.length) {
		evt.preventDefault();
		pasteResources(owner, uris);
		return;
	}

	retrieveImageFromClipboardAsBase64(evt, (imageDataBase64, image) => {
		if(!imageDataBase64) return;
		const timestamp = Date.now();
		addItem(owner, {
			kind: "image",
			name: generatedItemName("Image", timestamp),
			created: timestamp,
			dataUrl: imageDataBase64,
			width: image.width,
			height: image.height
		});
		openPasteboard(owner);
		app.toast({content: "Image pasted", classes: "glassy fade", timeout: 2500});
	});
}

function element(name, className, text) {
	const node = document.createElement(name);
	if(className) node.className = className;
	if(text !== undefined) node.textContent = text;
	return node;
}
function button(className, text, title, onclick) {
	const node = element("button", className, text);
	node.type = "button";
	node.title = title || "";
	node.addEventListener("click", onclick);
	return node;
}
function isSelected(owner, id) {
	return state(owner).selected.indexOf(id) !== -1;
}
function selectItem(owner, item, evt) {
	const pasteboard = state(owner);
	const items = visibleItems(owner);
	const ids = items.map(candidate => candidate.id);
	const toggle = evt && (evt.metaKey || evt.ctrlKey);

	if(evt && evt.shiftKey && pasteboard.anchor && ids.indexOf(pasteboard.anchor) !== -1) {
		const from = ids.indexOf(pasteboard.anchor);
		const to = ids.indexOf(item.id);
		const range = ids.slice(Math.min(from, to), Math.max(from, to) + 1);
		pasteboard.selected = toggle ? Array.from(new Set(pasteboard.selected.concat(range))) : range;
	} else if(toggle) {
		pasteboard.selected = isSelected(owner, item.id) ?
			pasteboard.selected.filter(id => id !== item.id) : pasteboard.selected.concat(item.id);
		pasteboard.anchor = item.id;
	} else {
		pasteboard.selected = [item.id];
		pasteboard.anchor = item.id;
	}
	render(owner);
}
function selectAll(owner) {
	const pasteboard = state(owner);
	pasteboard.selected = visibleItems(owner).map(item => item.id);
	pasteboard.anchor = pasteboard.selected[pasteboard.selected.length - 1] || null;
	render(owner);
}
function deleteSelected(owner) {
	const pasteboard = state(owner);
	if(!pasteboard.selected.length) return;
	const timestamp = touchHistory(owner, pasteboard.history);
	pasteboard.history.items.forEach(item => {
		if(pasteboard.selected.indexOf(item.id) !== -1 && !item.deletedAt) {
			item.deletedAt = timestamp;
			delete item.dataUrl;
			delete item.resources;
			delete item.width;
			delete item.height;
			touchEntity(owner, item, timestamp);
		}
	});
	pasteboard.selected = [];
	pasteboard.anchor = null;
	setHistory(owner, pasteboard.history);
	saveHistory(owner);
}
function reorder(owner, ordered) {
	const pasteboard = state(owner);
	const timestamp = touchHistory(owner, pasteboard.history);
	ordered.forEach((item, index) => {
		if(item.order !== index) {
			item.order = index;
			touchEntity(owner, item, timestamp);
		}
	});
	setHistory(owner, pasteboard.history);
	saveHistory(owner);
}
function reorderSelected(owner, direction) {
	const pasteboard = state(owner);
	const ordered = liveItems(pasteboard.history);
	if(direction < 0) {
		for(let index = 1; index < ordered.length; index++) {
			if(isSelected(owner, ordered[index].id) && !isSelected(owner, ordered[index - 1].id)) {
				ordered.splice(index - 1, 0, ordered.splice(index, 1)[0]);
			}
		}
	} else {
		for(let index = ordered.length - 2; index >= 0; index--) {
			if(isSelected(owner, ordered[index].id) && !isSelected(owner, ordered[index + 1].id)) {
				ordered.splice(index + 1, 0, ordered.splice(index, 1)[0]);
			}
		}
	}
	reorder(owner, ordered);
}
function dropSelection(owner, target, after) {
	const pasteboard = state(owner);
	const ordered = liveItems(pasteboard.history);
	const moving = ordered.filter(item => pasteboard.selected.indexOf(item.id) !== -1);
	if(!moving.length || moving.some(item => item.id === target.id)) return;
	const remainder = ordered.filter(item => pasteboard.selected.indexOf(item.id) === -1);
	let index = remainder.findIndex(item => item.id === target.id);
	if(index === -1) return;
	if(after) index++;
	remainder.splice(index, 0, ...moving);
	reorder(owner, remainder);
}
function groupSelected(owner) {
	const pasteboard = state(owner);
	const suggested = "Group " + (pasteboard.history.tabs.filter(tab => !tab.deletedAt).length + 1);
	const name = prompt("Name for Pasteboard group", suggested);
	if(!name || !name.trim()) return;
	const timestamp = touchHistory(owner, pasteboard.history);
	const tab = touchEntity(owner, {
		id: uniqueId("tab"),
		name: name.trim(),
		created: timestamp,
		order: pasteboard.history.tabs.length
	}, timestamp);
	pasteboard.history.tabs.push(tab);
	pasteboard.history.items.forEach(item => {
		if(pasteboard.selected.indexOf(item.id) !== -1 && !item.deletedAt) {
			item.tabId = tab.id;
			touchEntity(owner, item, timestamp);
		}
	});
	pasteboard.activeTab = tab.id;
	setHistory(owner, pasteboard.history);
	saveHistory(owner);
}
function moveSelectedToTab(owner, tabId) {
	const pasteboard = state(owner);
	if(!pasteboard.selected.length) return;
	const timestamp = touchHistory(owner, pasteboard.history);
	pasteboard.history.items.forEach(item => {
		if(pasteboard.selected.indexOf(item.id) !== -1 && !item.deletedAt) {
			item.tabId = tabId || null;
			touchEntity(owner, item, timestamp);
		}
	});
	pasteboard.activeTab = tabId || null;
	setHistory(owner, pasteboard.history);
	saveHistory(owner);
}
function focusItem(owner, direction, extend) {
	const pasteboard = state(owner);
	const items = visibleItems(owner);
	if(!items.length) return;
	let index = items.findIndex(item => item.id === pasteboard.anchor);
	if(index === -1) index = direction > 0 ? -1 : items.length;
	index = Math.max(0, Math.min(items.length - 1, index + direction));
	selectItem(owner, items[index], {shiftKey: extend});
	owner.setTimeout("pasteboard-focus-item", () => {
		const node = owner.scope().preview.getNode().querySelector('[data-item-id="' + items[index].id + '"]');
		if(node) node.focus();
	}, 0);
}
function openPasteboard(owner) {
	const action = owner.scope()["toggles-visible"];
	if(!action.getState()) action.setState(true);
	owner.setTimeout("pasteboard-focus", () => owner.scope().preview.getNode().focus(), 0);
}
const IMAGE_ZOOM_DURATION = 260;
function expandedImageRect(image) {
	const margin = 20;
	const naturalWidth = image.naturalWidth || image.getBoundingClientRect().width || 1;
	const naturalHeight = image.naturalHeight || image.getBoundingClientRect().height || 1;
	const scale = Math.min(
		(window.innerWidth - margin * 2) / naturalWidth,
		(window.innerHeight - margin * 2) / naturalHeight);
	const width = naturalWidth * scale;
	const height = naturalHeight * scale;
	return {
		left: (window.innerWidth - width) / 2,
		top: (window.innerHeight - height) / 2,
		width: width,
		height: height
	};
}
function positionExpandedImage(image, rect) {
	Object.assign(image.style, {
		left: rect.left + "px",
		top: rect.top + "px",
		width: rect.width + "px",
		height: rect.height + "px"
	});
}
function finishImageCollapse(owner, expanded) {
	const pasteboard = state(owner);
	if(pasteboard && pasteboard.expandedImage !== expanded) return;
	window.removeEventListener("resize", expanded.resize);
	expanded.backdrop.remove();
	if(expanded.placeholder.parentNode) {
		expanded.placeholder.parentNode.replaceChild(expanded.image, expanded.placeholder);
	} else if(expanded.parent && expanded.parent.isConnected) {
		expanded.parent.insertBefore(expanded.image, expanded.nextSibling);
	} else {
		expanded.image.remove();
	}
	expanded.image.style.cssText = expanded.style;
	expanded.title.setAttribute("aria-expanded", "false");
	if(pasteboard) pasteboard.expandedImage = null;
}
function collapseImage(owner, animate) {
	const pasteboard = state(owner);
	const expanded = pasteboard && pasteboard.expandedImage;
	if(!expanded) return false;
	if(expanded.collapsing) {
		if(animate === false) finishImageCollapse(owner, expanded);
		return true;
	}
	expanded.collapsing = true;
	window.removeEventListener("resize", expanded.resize);
	expanded.backdrop.style.opacity = "0";
	const target = expanded.placeholder.parentNode && expanded.placeholder.getBoundingClientRect();
	if(animate !== false && target && target.width && target.height) {
		positionExpandedImage(expanded.image, target);
		expanded.image.style.borderRadius = "4px";
		expanded.image.style.boxShadow = "none";
		window.setTimeout(() => finishImageCollapse(owner, expanded), IMAGE_ZOOM_DURATION + 30);
	} else {
		finishImageCollapse(owner, expanded);
	}
	return true;
}
function expandImage(owner, image, title) {
	if(state(owner).expandedImage) collapseImage(owner, false);
	const rect = image.getBoundingClientRect();
	if(!rect.width || !rect.height) return;
	const parent = image.parentNode;
	const nextSibling = image.nextSibling;
	const placeholder = document.createElement("div");
	Object.assign(placeholder.style, {
		display: "block",
		width: rect.width + "px",
		height: rect.height + "px",
		margin: "8px auto 0"
	});
	parent.insertBefore(placeholder, image);

	const backdrop = document.createElement("div");
	Object.assign(backdrop.style, {
		position: "fixed",
		left: "0",
		top: "0",
		right: "0",
		bottom: "0",
		zIndex: "10000",
		background: "rgba(0, 0, 0, .82)",
		opacity: "0",
		transition: "opacity " + IMAGE_ZOOM_DURATION + "ms ease",
		cursor: "zoom-out"
	});
	const expanded = {
		image: image,
		title: title,
		placeholder: placeholder,
		backdrop: backdrop,
		parent: parent,
		nextSibling: nextSibling,
		style: image.style.cssText,
		resize: () => positionExpandedImage(image, expandedImageRect(image))
	};
	state(owner).expandedImage = expanded;
	title.setAttribute("aria-expanded", "true");
	backdrop.addEventListener("click", evt => {
		evt.preventDefault();
		evt.stopPropagation();
		collapseImage(owner, true);
	});
	document.body.appendChild(backdrop);
	document.body.appendChild(image);
	Object.assign(image.style, {
		position: "fixed",
		left: rect.left + "px",
		top: rect.top + "px",
		width: rect.width + "px",
		height: rect.height + "px",
		maxWidth: "none",
		maxHeight: "none",
		margin: "0",
		objectFit: "contain",
		zIndex: "10001",
		cursor: "zoom-out",
		borderRadius: "4px",
		boxShadow: "none",
		transition: ["left", "top", "width", "height", "border-radius", "box-shadow"]
			.map(property => property + " " + IMAGE_ZOOM_DURATION + "ms ease").join(", ")
	});
	window.addEventListener("resize", expanded.resize);
	window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
		backdrop.style.opacity = "1";
		positionExpandedImage(image, expandedImageRect(image));
		image.style.borderRadius = "0";
		image.style.boxShadow = "0 16px 60px rgba(0, 0, 0, .5)";
	}));
}
function toggleImage(owner, image, title) {
	const expanded = state(owner).expandedImage;
	if(expanded && expanded.image === image) collapseImage(owner, true);
	else expandImage(owner, image, title);
}
function keydown(evt, owner) {
	const action = owner.scope()["toggles-visible"];
	if(evt.key === "Escape" && collapseImage(owner, true)) {
		evt.preventDefault();
		evt.stopPropagation();
		return;
	}
	if(evt.key === "Escape" && action.getState()) {
		action.setState(false);
		evt.preventDefault();
		evt.stopPropagation();
		return;
	}
	const preview = owner.scope().preview.getNode();
	if(!action.getState() || !(evt.target === preview || preview.contains(evt.target))) return;

	if((evt.metaKey || evt.ctrlKey) && evt.key.toLowerCase() === "a") {
		selectAll(owner);
	} else if((evt.metaKey || evt.ctrlKey) && evt.key.toLowerCase() === "g") {
		groupSelected(owner);
	} else if(evt.key === "Delete" || evt.key === "Backspace") {
		deleteSelected(owner);
	} else if(evt.key === "ArrowUp" || evt.key === "ArrowDown") {
		const direction = evt.key === "ArrowUp" ? -1 : 1;
		if(evt.altKey || evt.metaKey) reorderSelected(owner, direction);
		else focusItem(owner, direction, evt.shiftKey);
	} else if(evt.key === "Enter" && state(owner).anchor) {
		const item = visibleItems(owner).find(item => item.id === state(owner).anchor);
		if(item && item.kind === "resource-group") {
			openResource(owner, {uri: resourceGroupRoot(item), type: "Folder"});
		}
	} else {
		return;
	}
	evt.preventDefault();
	evt.stopPropagation();
}

function renderTabs(owner, parent) {
	const pasteboard = state(owner);
	const tabs = element("nav", "pasteboard-tabs");
	const entries = [{id: null, name: "All"}].concat(
		pasteboard.history.tabs.filter(tab => !tab.deletedAt));
	entries.forEach(tab => {
		const node = button("pasteboard-tab" + (pasteboard.activeTab === tab.id ? " selected" : ""),
			tab.name, "Show " + tab.name + "; drop selected items here", evt => {
				evt.stopPropagation();
				pasteboard.activeTab = tab.id;
				render(owner);
			});
		node.addEventListener("dragover", evt => {
			evt.preventDefault();
			evt.stopPropagation();
			evt.dataTransfer.dropEffect = "move";
		});
		node.addEventListener("drop", evt => {
			evt.preventDefault();
			evt.stopPropagation();
			moveSelectedToTab(owner, tab.id);
		});
		tabs.appendChild(node);
	});
	tabs.appendChild(button("pasteboard-tab add", "+", "Group selected items (Cmd+G)", evt => {
		evt.stopPropagation();
		groupSelected(owner);
	}));
	parent.appendChild(tabs);
}
function renderToolbar(owner, parent, count) {
	const toolbar = element("header", "pasteboard-toolbar");
	toolbar.appendChild(element("strong", "pasteboard-title", js.sf("Pasteboard (%d)", count)));
	toolbar.appendChild(button("pasteboard-command", "Group", "Group selected items (Cmd+G)", evt => {
		evt.stopPropagation();
		groupSelected(owner);
	}));
	toolbar.appendChild(button("pasteboard-command danger", "Delete", "Delete selected items", evt => {
		evt.stopPropagation();
		deleteSelected(owner);
	}));
	parent.appendChild(toolbar);
}
function renderStorageLocation(owner, parent) {
	const location = element("div", "pasteboard-storage-location");
	location.appendChild(element("span", "label", "Pasteboard persists its state at "));
	location.appendChild(element("code", "uri", storageUri(owner)));
	location.title = STORAGE_PROPERTY + "." + STORAGE_KEY;
	parent.appendChild(location);
}
function wireCard(owner, card, item) {
	card.tabIndex = 0;
	card.draggable = true;
	card.dataset.itemId = item.id;
	card.addEventListener("click", evt => selectItem(owner, item, evt));
	card.addEventListener("dragstart", evt => {
		if(!isSelected(owner, item.id)) {
			state(owner).selected = [item.id];
			state(owner).anchor = item.id;
			card.classList.add("selected");
		}
		evt.dataTransfer.effectAllowed = "move";
		evt.dataTransfer.setData("text/x-pasteboard-item", item.id);
		evt.stopPropagation();
	});
	card.addEventListener("dragover", evt => {
		evt.preventDefault();
		evt.dataTransfer.dropEffect = "move";
		evt.stopPropagation();
	});
	card.addEventListener("drop", evt => {
		evt.preventDefault();
		evt.stopPropagation();
		const rect = card.getBoundingClientRect();
		dropSelection(owner, item, evt.clientY > rect.top + rect.height / 2);
	});
	card.addEventListener("dragend", evt => {
		evt.stopPropagation();
		render(owner);
	});
}
function renderResourceGroup(owner, item) {
	const card = element("section", "paste-item resource-group" + (isSelected(owner, item.id) ? " selected" : ""));
	const rootUri = resourceGroupRoot(item);
	const heading = button("resource-group-title", item.name,
		rootUri, evt => {
			evt.stopPropagation();
			openResource(owner, {uri: rootUri, type: "Folder"});
		});
	const resources = element("ul", "resources");

	card.appendChild(heading);
	item.resources.forEach((resource, index) => {
		const droppedUri = [rootUri, index, resource.name].join("/");
		const entry = button("resource", "", resource.targetUri, evt => {
			evt.stopPropagation();
			openResource(owner, {
				uri: droppedUri,
				type: resource.type,
				targetUri: resource.targetUri
			});
		});
		entry.appendChild(element("span", "name", resource.name));
		entry.appendChild(element("span", "uri", resource.targetUri));
		const listItem = element("li", "resource-entry");
		listItem.appendChild(entry);
		resources.appendChild(listItem);
	});
	card.appendChild(resources);
	wireCard(owner, card, item);
	return card;
}
function renderImage(owner, item) {
	const card = element("section", "paste-item image-item" + (isSelected(owner, item.id) ? " selected" : ""));
	const title = button("image-title", item.name || generatedItemName("Image", item.created), "Maximize image");
	const image = document.createElement("img");
	image.src = item.dataUrl;
	image.alt = item.name;
	image.title = "Maximize image";
	title.setAttribute("aria-expanded", "false");
	const toggle = evt => {
		evt.preventDefault();
		evt.stopPropagation();
		toggleImage(owner, image, title);
	};
	title.addEventListener("click", toggle);
	image.addEventListener("click", toggle);
	card.appendChild(title);
	card.appendChild(image);
	wireCard(owner, card, item);
	return card;
}
function render(owner) {
	const preview = owner.scope().preview;
	const root = preview && preview.getNode();
	if(!root) return;
	if(state(owner).expandedImage) collapseImage(owner, false);
	const focused = document.activeElement;
	const focusedCard = focused && focused.closest && focused.closest("[data-item-id]");
	const focusedItemId = focusedCard && focusedCard.dataset.itemId;
	const restoreFocus = focused === root || root.contains(focused);
	const items = visibleItems(owner);
	root.replaceChildren();
	renderToolbar(owner, root, liveItems(state(owner).history).length);
	renderTabs(owner, root);
	renderStorageLocation(owner, root);
	const list = element("main", "pasteboard-items");
	items.forEach(item => list.appendChild(item.kind === "image" ?
		renderImage(owner, item) : renderResourceGroup(owner, item)));
	if(!items.length) list.appendChild(element("div", "pasteboard-empty", "No pasted items in this group"));
	root.appendChild(list);
	if(restoreFocus) {
		owner.setTimeout("pasteboard-restore-focus", () => {
			const item = focusedItemId && root.querySelector('[data-item-id="' + focusedItemId + '"]');
			(item || root).focus();
		}, 0);
	}
}

["Container", {
	classes: "glassy-overlay",
	css: {
		"": "z-index:9999; margin: 0;"
	},
	vars: {
		pasteboard: {
			instanceId: null,
			history: null,
			selected: [],
			anchor: null,
			activeTab: null,
			watcher: null,
			expandedImage: null
		}
	},
	overrides: {
		getStorageKey() {
			return STORAGE_DOCUMENT;
		}
	},
	// onNodeCreated() {
	// 	this._node.style.margin = "0";
	// },
	onDestroy() {
		collapseImage(this, false);
		document.removeEventListener("paste", this.vars(["pasteboard.pasteListener"]), true);
		document.removeEventListener("keydown", this.vars(["pasteboard.keyListener"]), true);
		const watcher = this.vars(["pasteboard.watcher"]);
		if(watcher && watcher.cancel) watcher.cancel();
	},
	onLoad() {
		const pasteboard = state(this);
		pasteboard.instanceId = uniqueId("instance");
		pasteboard.history = emptyHistory(pasteboard.instanceId);
		pasteboard.pasteListener = evt => handler(evt, this);
		pasteboard.keyListener = evt => keydown(evt, this);
		document.addEventListener("paste", pasteboard.pasteListener, true);
		document.addEventListener("keydown", pasteboard.keyListener, true);

		pasteboard.watcher = watchHistory(this);
		this.readStorage(STORAGE_KEY,
			value => receiveHistory(this, value),
			err => console.error("Could not load Pasteboard history", err));

		this.nextTick(() => this.setParent(this.app().down("#window")));

		this.setIndex(0);
		// this.nextTick(() => this.setParentNode(document.body));
	}
}, [
	["Executable", ("toggles-visible"), {
		state: false,
		visible: "state",
		hotkey: "Alt+Cmd+V",
		on(evt) { this.toggle(); },
			onChange() {
				if(this.getState()) {
					this._owner.setTimeout("pasteboard-focus", () =>
						this.scope().preview.getNode().focus(), 0);
				} else {
					collapseImage(this._owner, false);
				}
		}
	}],
	["Container", ("preview"), {
		action: "toggles-visible",
		align: "right",
		width: 600,
		executesAction: false,
		classes: "glassy no-margin with-shadow d",
		onNodeCreated() {
			this._node.tabIndex = 0;
		},
		css: {
			"": "text-align:left;display:flex;flex-direction:column;overflow:hidden;",
			"&.d.d": "margin:0;",
			".pasteboard-toolbar": "display:flex;align-items:center;gap:6px;padding:12px;border-bottom:1px solid rgba(0,0,0,.12);",
			".pasteboard-title": "flex:1;font-size:16px;",
			"button": "font:inherit;",
			".pasteboard-command,.pasteboard-tab": "border:0;border-radius:5px;padding:6px 9px;cursor:pointer;background:rgba(127,127,127,.14);",
			".pasteboard-command:hover,.pasteboard-tab:hover": "background:rgba(127,127,127,.25);",
			".pasteboard-command.danger": "color:#b42318;",
			".pasteboard-tabs": "display:flex;gap:5px;padding:8px 12px;overflow-x:auto;border-bottom:1px solid rgba(0,0,0,.08);",
			".pasteboard-tab": "white-space:nowrap;",
			".pasteboard-tab.selected": "background:#2864b7;color:white;",
			".pasteboard-storage-location": "padding:0 12px 8px;font-size:11px;opacity:.62;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;",
			".pasteboard-storage-location .uri": "user-select:text;",
			".pasteboard-items": "flex:1;overflow:auto;padding:12px;",
			".paste-item": "margin:0 0 10px;padding:10px;text-align:left;background:rgba(255,255,255,.72);border:2px solid transparent;border-radius:8px;outline:none;",
			".paste-item:focus": "border-color:rgba(40,100,183,.45);",
			".paste-item.selected": "border-color:#2864b7;background:rgba(40,100,183,.12);",
			".resource-group button": "display:block;width:100%;border:0;background:transparent;text-align:left;cursor:pointer;",
				".resource-group-title": "padding:6px;font-weight:bold;",
				".resources": "margin:0;padding:0 0 0 28px;list-style:disc;",
				".resource-entry": "margin:0;padding:0;",
				".resource": "padding:5px 8px;border-top:1px solid rgba(0,0,0,.08)!important;",
				".resource:hover,.resource-group-title:hover": "background:rgba(0,0,0,.06);",
				".resource:hover .name,.resource-group-title:hover,.image-title:hover": "text-decoration:underline;",
				".resource .name,.resource .uri": "display:block;overflow:hidden;text-overflow:ellipsis;",
				".resource .uri": "opacity:.6;font-size:11px;",
				".image-item img": "display:block;max-width:100%;max-height:55vh;margin:8px auto 0;cursor:zoom-in;",
				".image-title": "display:block;padding:4px;border:0;background:transparent;font-weight:bold;cursor:zoom-in;",
			".pasteboard-empty": "padding:32px;text-align:center;opacity:.55;"
		}
	}]
]];
