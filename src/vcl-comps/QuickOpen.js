"use vcl/ui/ListHeader, vcl/ui/ListColumn, devtools/ResourceIndex, vcl/Action";

const Action = require("vcl/Action");
const Control = require("vcl/Control");
const ResourceIndex = require("devtools/ResourceIndex");
const QUICK_OPEN_HEIGHT = 297;

const workspaceName = workspace =>
	workspace.vars(["workspace.name"]) || workspace.getSpecializer() || "Workspace";
const resourceName = resource => {
	const parts = String(resource && resource.uri || "").replace(/\/$/, "").split("/");
	return resource.name || parts.pop() || resource.uri;
};
const resourcePath = resource => {
	const uri = String(resource && resource.uri || "");
	const index = uri.lastIndexOf("/");
	return index === -1 ? "" : uri.substring(0, index);
};
const withoutHtml = value => {
	const node = document.createElement("span");
	node.innerHTML = value || "";
	return (node.textContent || "").trim();
};
const commandName = action => {
	let content = "";
	try { content = withoutHtml(action.getContent(null)); } catch(e) { }
	return content || String(action._name || "")
		.replace(/[-_]+/g, " ")
		.replace(/(^|\s)\S/g, value => value.toUpperCase());
};
const fuzzyScore = (value, query) => {
	value = String(value || "").toLowerCase();
	query = String(query || "").toLowerCase();
	if(!query) return 0;

	const at = value.indexOf(query);
	if(at !== -1) return at;

	let score = 40;
	let previous = -1;
	for(let i = 0; i < query.length; ++i) {
		const next = value.indexOf(query.charAt(i), previous + 1);
		if(next === -1) return -1;
		score += next - previous - 1;
		previous = next;
	}
	return score;
};
const matchScore = (row, query) => query
	.trim()
	.toLowerCase()
	.split(/\s+/)
	.reduce((total, token) => {
		if(total === -1) return total;
		const name = fuzzyScore(row.name, token);
		const uri = fuzzyScore(row.uri || row.detail, token);
		if(name === -1 && uri === -1) return -1;
		return total + Math.min(name === -1 ? 1000 : name, uri === -1 ? 1000 : uri + 15);
	}, 0);
const selectWorkspace = workspace => {
	const tabs = [];
	let tab = workspace;
	while((tab = tab.up("vcl/ui/Tab"))) tabs.unshift(tab);
	tabs.forEach(item => item.setSelected(true));
};

[("vcl/ui/Form"), {
	activeControl: "input",
	align: "none",
	autoPosition: "top-left-bottom-right",
	autoSize: "width",
	height: QUICK_OPEN_HEIGHT,
	css: {
		"font-family": '"Lucida Grande", Arial, sans-serif',
		"font-size": "9pt",
		position: "absolute",
		top: "120px",
		width: "50%",
		"margin-left": "25%",
		"margin-right": "25%",
		"z-index": "2147484000",
		"box-shadow": "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 3px 0 rgba(0, 0, 0, 0.19)",
		"border-radius": "13px",
		"backdrop-filter": "blur(10px)",
		"background-color": "rgba(155, 155, 155, 0.15)",
		input: {
			background: "transparent",
			border: "none",
			width: "100%",
			height: "50px",
			"font-size": "16pt",
			padding: "3px 12px",
			margin: "8px",
			outline: "none",
			"&.value": "margin-bottom:0;"
		},
		"#header": {
			"": "height:72px;border:0;background:transparent;",
			"#input": {
				"": "position:absolute;left:0;right:145px;height:72px;"
			},
			"#scope": {
				"": "position:absolute;right:8px;top:20px;padding:7px 9px;border-radius:5px;background:rgba(0,0,0,0.07);cursor:pointer;color:#444;",
				"&:hover": "background:rgba(0,0,0,0.12);"
			}
		},
		"#list": {
			"": "position:relative;background:transparent;",
			".{ListHeader}": "height:0;",
			".{ListRow}": "padding-left:8px;",
			".ListCell b": "font-weight:bold;max-width:350px;",
			".ListCell span": "padding-left:8px;font-size:6pt;",
			".ListCell em": "float:right;padding-right:8px;font-size:6pt;font-style:normal;"
		},
		"#status": "height:25px;box-sizing:border-box;padding:5px 10px;color:#777;border-top:1px solid rgba(0,0,0,0.1);font-size:8pt;"
	},
	onLoad() {
		this.setParentNode(document.body);

		this.showPalette = mode => {
			mode = mode || "files";
			if(this.getVisible() && this.isShowing() &&
				this.vars("mode") === mode && mode === "files") {
				return this.toggleScope();
			}

			this.setVar("focused", Control.focused);
			this.vars("mode", mode);
			// Panel.hidden() resets both dimensions for auto-sized panels.
			this.setHeight(QUICK_OPEN_HEIGHT);
			this.show();
			this.qs("#scope").render();
			this.refreshPalette();
			this.update(() => {
				const input = this.qs("#input");
				input.setValue("");
				input.setFocus();
			});
		};
		this.toggleScope = () => {
			this.vars("scope", this.vars("scope") === "all" ? "workspace" : "all");
			this.qs("#scope").render();
			this.refreshPalette();
			this.qs("#input").setFocus();
		};
		this.refreshPalette = force => {
			const run = (this.vars("run") || 0) + 1;
			this.vars("run", run);
			if(this.vars("mode") === "commands") {
				this.vars("rows", this.collectCommands());
				this.applyFilter();
				return;
			}

			const workspaces = this.getWorkspaces();
			this.vars("rows", this.collectResources(workspaces));
			this.applyFilter();
			this.setStatus(js.sf("%d workspace%s · indexing…", workspaces.length, workspaces.length === 1 ? "" : "s"));

			const progress = () => this.setTimeout("quick-open-index-progress", () => {
				if(this.vars("run") !== run || !this.isVisible()) return;
				this.vars("rows", this.collectResources(workspaces));
				this.applyFilter();
			}, 75);
			Promise.all(workspaces.map(workspace => ResourceIndex.refresh(workspace, force, progress)))
				.then(() => {
					if(this.vars("run") !== run || !this.isVisible()) return;
					this.vars("rows", this.collectResources(workspaces));
					this.applyFilter();
				});
		};
		this.getWorkspaces = () => {
			const selected = this.app().down("devtools/Workspace<>:root:selected");
			return this.vars("scope") === "all" ?
				this.app().qsa("devtools/Workspace<>:root") :
				(selected ? [selected] : []);
		};
		this.collectResources = workspaces => {
			const rows = {};
			const add = (workspace, resource, priority) => {
				if(!(resource && resource.uri)) return;
				if(resourceName(resource).endsWith("-")) return;
				const key = workspace.hashCode() + "\n" + resource.uri;
				const row = rows[key] || (rows[key] = {
					kind: "resource",
					workspace,
					workspaceName: workspaceName(workspace),
					resource,
					name: resourceName(resource),
					path: resourcePath(resource),
					uri: resource.uri,
					priority
				});
				row.priority = Math.min(row.priority, priority);
			};

			workspaces.forEach(workspace => {
				(workspace.vars(["resourcePalette.recent"]) || []).forEach(resource => add(workspace, resource, 0));
				workspace.qsa("vcl/ui/Tab").forEach(tab => add(workspace, tab.vars("resource"), 1));
				ResourceIndex.favorites(workspace).forEach(resource => add(workspace, resource, 2));
				ResourceIndex.get(workspace).resources.forEach(resource => add(workspace, resource, 3));
			});

			return Object.keys(rows).map(key => rows[key]);
		};
		this.collectCommands = () => {
			const workspace = this.app().down("devtools/Workspace<>:root:selected");
			const main = this._owner;
			const seen = {};
			return main.qsa("vcl/Action")
				.filter(action => {
					const ownerWorkspace = action.up("devtools/Workspace<>:root");
					return action instanceof Action && action._name &&
						!action.up("devtools/QuickOpen<>") &&
						(!ownerWorkspace || ownerWorkspace === workspace) &&
						action.isHotkeyEnabled() && action.isVisible();
				})
				.map(action => ({
					kind: "command",
					action,
					name: commandName(action),
					detail: action.getHint() || action.getHotkey() || "",
					uri: action._name,
					workspaceName: "Command",
					priority: 0
				}))
				.filter(row => row.name && !seen[row.uri] && (seen[row.uri] = true));
		};
		this.applyFilter = () => {
			const query = this.qs("#input").getInputValue() || "";
			let rows = (this.vars("rows") || []).map(row => {
				row.score = matchScore(row, query);
				return row;
			}).filter(row => row.score !== -1);

			if(!query && this.vars("mode") === "files") {
				rows = rows.filter(row => row.priority < 3);
			}
			rows.sort((a, b) =>
				a.score - b.score || a.priority - b.priority ||
				a.name.localeCompare(b.name) || a.uri.localeCompare(b.uri));
			rows = rows.slice(0, 250);
			this.qs("#array").setArray(rows);
			this.qs("#list").setTopRow(0);
			this.qs("#list").setSelection(rows.length ? [0] : []);
			this.setStatus(js.sf("%d result%s · %s", rows.length, rows.length === 1 ? "" : "s",
				this.vars("mode") === "commands" ? "commands" :
				(this.vars("scope") === "all" ? "all workspaces" : "current workspace")));
		};
		this.setStatus = content => {
			this.qs("#status").setContent(content);
		};
	},
	onActivate() {
		this.refreshPalette();
	},
	onDeactivate() {
		const focused = this.removeVar("focused");
		focused && focused.setFocus && focused.setFocus();
	},
	onDispatchChildEvent(component, name, evt) {
		const scope = this.scope();
		if(component === scope.input && name === "keydown") {
			if(evt.keyCode === 27) {
				this.hide();
			} else if(evt.keyCode === 13) {
				if(!scope.list.getSelection().length && scope.list.getCount()) scope.list.setSelection([0]);
				scope.accept.execute(evt);
			} else if(evt.keyCode === 38 || evt.keyCode === 40) {
				scope.list.dispatch(name, evt);
			} else if(evt.keyCode === 116) {
				this.refreshPalette(true);
			} else {
				return this.inherited(arguments);
			}
			evt.preventDefault();
		}
		return this.inherited(arguments);
	}
}, [
	[("vcl/data/Array"), "array", {}],
	[("vcl/Action"), "accept", {
		on(evt) {
			const row = this.ud("#list").getSelection(true)[0];
			if(!row) return;
			this._owner.hide();
			if(row.kind === "command") return row.action.execute(evt);
			selectWorkspace(row.workspace);
			return row.workspace.open({ resource: row.resource, selected: true });
		}
	}],
	[("vcl/ui/Panel"), "header", { align: "top", height: 72 }, [
		[("vcl/ui/Input"), "input", {
			onChange() {
				this._owner.applyFilter();
			}
		}],
		[("vcl/ui/Element"), "scope", {
			element: "span",
			onClick() {
				if(this._owner.vars("mode") === "files") this._owner.toggleScope();
			},
			onRender() {
				const commands = this._owner.vars("mode") === "commands";
				this.getNode().textContent = commands ? "Commands" :
					(this._owner.vars("scope") === "all" ? "All workspaces" : "Workspace");
			}
		}]
	]],
	[("vcl/ui/List"), "list", {
		action: "accept",
		align: "top",
		classes: "header-invisible",
		height: 200,
		rowHeight: 25,
		source: "array"
	}, [
		[("vcl/ui/ListColumn"), {
			attribute: ".",
			content: "#",
			rendering: "innerHTML",
			onGetValue(value) {
				const detail = value.kind === "command" ? value.detail : value.path;
				return [js.sf("<b>%H</b><span>%H</span><em>%H</em>",
					value.name, detail, value.workspaceName)];
			}
		}]
	]],
	[("vcl/ui/Panel"), "status", { align: "bottom", height: 25, content: "" }]
]];
