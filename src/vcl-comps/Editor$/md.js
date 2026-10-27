"use js, devtools/cavalion-md";

const Md = require("devtools/cavalion-md");

const render = control => Md.render(control);
const isSourceVisible = control => {
	const root = control.up();
	return root ? root.vars(["md-source-visible"]) !== false : true;
};
const setMarkdownDialect = (control, dialect) => {
	const root = control.up();
	const ace = root && root.ud("#ace");

	if(!root) return;
	root.vars("dialect", dialect);
	root.vars("dialect-persisted", dialect);
	root.writeStorage && root.writeStorage("dialect", dialect);
	ace && render(ace);
	Md.updateTopLevelNavigationPosition(root);
};

["", {
	css: Md.Css,
	handlers: Md.Handlers,
	vars: {
		dialectMenu: {
			enabled: true,
			label: "Dialect"
		},
		stateOverlay: {
			enabled: true,
			label: "(State) Revisions",
			clear(root) {
				root = root && root.up && root.up("devtools/Editor<>:root") || root || this;
				Md.clearState(root);
				render(root.ud("#ace"));
				Md.updateTopLevelNavigationPosition(root);
				root.app().toast({
					content: "State overlay cleared",
					classes: "fade"
				});
			}
		},
		topLevelNavigation: {
			side: "left"
		}
	}
}, [
	["#evaluate", {
		onLoad() {
			this.vars("eval", () => this.vars(["root"]));
			return this.inherited(arguments);
		}
	}],
	["#ace", {
		align: "left", width: 600, action: "toggle-source",
		executesAction: "none",
		onLoad() {
			Md.bindMarkdownEditor(this);
		},
		onChange(change) {
			if(!this._vars) {
				render(this);
				this.vars();
			} else {
				Md.scheduleMarkdownRender(this, change);
			}
		}
	}],

	["vcl/Action", "toggle-source", {
		hotkey: "Shift+MetaCtrl+S",
		selected: "state", visible: "state",
		state: true,
		onLoad() {
			const resource = this.vars(["resource"]);
			const md_sourceInitiallyHidden = this.vars(["markdown-source-intially-hidden"]) === true;

			if(resource && !resource.name) resource.name = resource.uri.split("/").pop();
			this.up().readStorage("source-visible", visible => {
				if(typeof visible === "boolean") {
					this.setState(visible);
					this.up().vars("md-source-visible", visible);
					Md.update_shrink(this, visible);
				} else if(visible === undefined && resource && (md_sourceInitiallyHidden || (
						resource.uri.split("/").pop() === ".md" ||
						Md.isUpperCase(resource.name.split(".md")[0])
					))
				) {
					this.setState(false);
					this.up().vars("md-source-visible", false);
					Md.update_shrink(this, false);
				} else {
					this.up().vars("md-source-visible", this.getState());
				}
			});
		},
		onExecute() {
			const state = !this.getState();
			this.setState(state);
			this.up().vars("md-source-visible", state);
			Md.schedulePreviewSync(this, this.ud("#ace").getEditor().getCursorPosition().row);
			if(state === true) {
				this.ud("#ace").setFocus();
			}
			Md.update_shrink(this, state);
			this.setTimeout("md-nav-position", () => Md.updateTopLevelNavigationPosition(this), 0);
			this.up().writeStorage("source-visible", this.getState());
		}
	}],
	["vcl/Action", "state-clear", {
		on() {
			return this.up().vars(["stateOverlay.clear"]).call(this.up(), this.up());
		}
	}],
	["vcl/Action", "markdown-dialect-default", {
		on() {
			return setMarkdownDialect(this, "markdown");
		}
	}],
	["vcl/Action", "markdown-dialect-marked", {
		on() {
			return setMarkdownDialect(this, "marked");
		}
	}],
	["vcl/Action", "markdown-dialect-toggle", {
		hotkey: "MetaCtrl+Shift+D",
		on() {
			const root = this.up();
			return setMarkdownDialect(this,
				root && root.vars(["dialect"]) === "marked" ? "markdown" : "marked");
		}
	}],
	["vcl/Action", "outline-proxy-generate", {
		on() {
			return Md.createMarkdownOutlineProxy(this.up());
		}
	}],
	["vcl/Action", "show-outline", {
		hotkey: "Shift+MetaCtrl+O",
		on() {
			return H("vcl-comps:devtools/Outline<md>", {
				ace: this.ud("#ace"),
				outline: this.ud("#outline-proxy-generate").execute()
			});
		}
	}],
	["vcl/ui/Panel", "output", {
		align: "client",
		vars: {
			[Md.CONSOLE_ALLOW_ALT_META_CLICK_VAR]: true
		},
		css: Md.Css_content,
		classes: "shrink",

		onMouseMove(evt) {
			if(evt.shiftKey === false) return;

			let current = evt.target;
			if(current.nodeName !== "IMG") {
				current = undefined;
			}

			const last = this.vars("last");
			if(last !== current) {
				if(last) {
					last.style.width = "";
				}
				if(current) {
					current.style.width = current.style.widthWhenHovered;
				}
			}

			current && this.vars("last", current);
		},
		onMouseLeave() {
			const last = this.removeVar("last");
			if(last) {
				last.style.width = "";
			}
		},
		onScroll() {
			if(isSourceVisible(this)) {
				Md.syncTopLevelNavActiveToSourcePosition(this);
			} else {
				Md.syncTopLevelNavActiveToPreviewScroll(this, this.nodeNeeded());
			}
			Md.capturePreviewScrollState(this, this.nodeNeeded());
			this.setTimeout("persist-preview-scroll-state",
				() => Md.persistPreviewScrollState(this), 150);
		},
		onClick(evt) {
			const folder_toggle = evt.target.closest ? evt.target.closest(".md-folder-toggle") :
				evt.target.up(".md-folder-toggle", true);
			const item = folder_toggle && (folder_toggle.closest ?
				folder_toggle.closest("li.md-folder") : folder_toggle.up("LI", true));
			const anchor = evt.target.up("A", true);
			if(item && !anchor && item.classList.contains("md-folder")) {
				evt.preventDefault();
				evt.stopPropagation();

				const collapsed = item.classList.contains("collapsed") === false;
				if(evt.altKey === true && evt.metaKey === true) {
					Md.setFoldersCollapsed(this, Array.from(item.parentNode.children)
						.filter(sibling => sibling.classList.contains("md-folder")), collapsed);
				} else if(evt.altKey === true) {
					Md.setFoldersCollapsed(this, [item].concat(Array.from(item.querySelectorAll("li.md-folder"))), collapsed);
				} else {
					Md.setFolderCollapsed(this, item, collapsed);
				}
				return;
			}

			if(anchor) return;

			const heading = evt.target.up("H1,H2,H3,H4,H5,H6", true);
			if(!heading || heading.classList.contains("md-section-heading") === false) {
				return;
			}

			const section = heading.parentNode;
			if(!section || section.classList.contains("md-section") === false) {
				return;
			}

			evt.preventDefault();
			evt.stopPropagation();

			const collapsed = section.classList.contains("collapsed");
			const level = section.getAttribute("data-section-level");
			if(evt.shiftKey === true && evt.altKey === true && evt.metaKey === true) {
				Md.expandSectionsUpToLevel(this, this._node.qsa(".md-section"), level);
			} else if(evt.altKey === true && evt.metaKey === true) {
				Md.setSectionsCollapsed(this,
					this._node.qsa(js.sf('.md-section[data-section-level="%s"]', level)),
					true);
			} else if(evt.altKey === true) {
				Md.setSectionsCollapsed(this, this._node.qsa(".md-section"), !collapsed);
			} else {
				Md.setSectionCollapsed(this, section, !collapsed);
			}
		}
	}]
]];
