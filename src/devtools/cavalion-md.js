define(function(require) {

	const on = require("on");
	const marked = require("marked").marked;
	const markdown = require("markdown");
	const Component = require("vcl/Component");
	const HE = require("util/HtmlElement");
	const LinkLocation = require("devtools/MarkdownLinkLocation");
	const MarkdownRenderScheduler = require("devtools/MarkdownRenderScheduler");
	const MarkdownRenderSections = require("devtools/MarkdownRenderSections");
	const resolveUri_blocks = require("blocks/Factory").resolveUri;
	const resolveUri_comps = require("vcl/Factory").resolveUri;

	const CONSOLE_ALLOW_ALT_META_CLICK_VAR = "console/allow-alt-meta-click";
	const PREVIEW_FOLLOW_STORAGE_KEY = "md-preview-follow-source";
	const PREVIEW_SCROLL_STORAGE_KEY = "md-preview-scroll-state";
	const CHECKBOX_STATE_STORAGE_KEY = "md-checkbox-state";
	const SECTION_STATE_STORAGE_KEY = "md-section-state";
	const RENDER_QUIET_PERIOD = 750;
	const RENDER_MAX_DELAY = 2500;
	const now = () => window.performance && window.performance.now ? window.performance.now() : Date.now();

	if(!js.dt) {
		js.dt = (a) => a === undefined ? new Date() : new Date(a);
	}

	function encodeMdLinks(md) {
		return (md || "")
			.replace(/\]\(([^)\s]+)(\s+"[^"]*")?\)/g, (m, url, title = "") => {
				return `](${encodeURI(url)}${title})`;
			})
			.replace(/^\[([^\]]+)\]:\s*([^\s]+)(\s+"[^"]*")?\s*$/gm, (m, id, url, title = "") => {
				return `[${id}]: ${encodeURI(url)}${title}`;
			});
	}
	function isEscapedAt(text, index) {
		let count = 0;
		for(let i = index - 1; i >= 0 && text.charAt(i) === "\\"; --i) {
			++count;
		}
		return count % 2 === 1;
	}
	function escapeMarkdownLinkDescription(text) {
		return (text || "").split("").map((ch, index) => {
			if((ch === "_" || ch === "<") && isEscapedAt(text, index) === false) {
				return "\\" + ch;
			}
			return ch;
		}).join("");
	}
	function escapeMarkdownLinkDescriptions(md) {
		return (md || "").replace(/(!?)\[((?:\\.|[^\]\\])*)\]\(([^)\n]*)\)/g, (match, bang, description, href) => {
			if(bang === "!") {
				return match;
			}
			return `[${escapeMarkdownLinkDescription(description)}](${href})`;
		});
	}
	const getEditorRoot = (control) => {
		let current = control;
		while(current) {
			if(current.hasVar && (current.hasVar("topLevelNavigation") ||
					(current.hasVar("document") && current.vars(["document.facet"]) === "md"))) {
				return current;
			}
			current = typeof current.up === "function" ? current.up() : null;
		}
		return null;
	};
	const getPreviewScrollState = (control) => {
		const root = getEditorRoot(control);
		let state = root && root.vars(["md-preview-scroll-state"]);
		if(!state) {
			state = { left: 0, top: 0 };
			root && root.vars("md-preview-scroll-state", state);
		}
		return state;
	};
	const persistPreviewScrollState = (control) => {
		const root = getEditorRoot(control);
		const state = getPreviewScrollState(control);
		if(root && root.writeStorage instanceof Function) {
			root.writeStorage(PREVIEW_SCROLL_STORAGE_KEY, state);
		}
	};
	const capturePreviewScrollState = (control, preview) => {
		if(!preview) return getPreviewScrollState(control);

		const state = getPreviewScrollState(control);
		state.left = preview.scrollLeft || 0;
		state.top = preview.scrollTop || 0;
		return state;
	};
	const restorePreviewScrollState = (control, preview) => {
		if(!preview) return;

		const state = getPreviewScrollState(control);
		preview.scrollLeft = state.left || 0;
		preview.scrollTop = state.top || 0;
	};
	const getSectionState = (control) => {
		const root = getEditorRoot(control);
		let state = root && root.vars(["md-section-state"]);
		if(!state) {
			state = {};
			root && root.vars("md-section-state", state);
		}
		return state;
	};
	const persistSectionState = (control) => {
		const root = getEditorRoot(control);
		const state = getSectionState(control);
		if(root && root.writeStorage instanceof Function) {
			root.writeStorage(SECTION_STATE_STORAGE_KEY, state);
		}
	};
	const getCheckboxState = (control) => {
		const root = getEditorRoot(control);
		let state = root && root.vars(["md-checkbox-state"]);
		if(!state) {
			state = {};
			root && root.vars("md-checkbox-state", state);
		}
		return state;
	};
	const persistCheckboxState = (control) => {
		const root = getEditorRoot(control);
		const state = getCheckboxState(control);
		if(root && root.writeStorage instanceof Function) {
			root.writeStorage(CHECKBOX_STATE_STORAGE_KEY, state);
		}
	};
	const clearState = (control) => {
		const root = getEditorRoot(control);
		if(!root) return;

		root.vars(SECTION_STATE_STORAGE_KEY, {});
		root.vars(CHECKBOX_STATE_STORAGE_KEY, {});
		if(root.writeStorage instanceof Function) {
			root.writeStorage(SECTION_STATE_STORAGE_KEY, {});
			root.writeStorage(CHECKBOX_STATE_STORAGE_KEY, {});
		}
	};
	const normalizeText = (text) => (text || "").replace(/\s+/g, " ").trim();
	const headingLevel = (node) => node && node.nodeType === 1 && /^H[1-6]$/.test(node.tagName) ? parseInt(node.tagName.substring(1), 10) : 0;
	const slugifyHeading = (text) => normalizeText(text)
		.toLowerCase()
		.replace(/[^\w\s-]/g, "")
		.replace(/\s+/g, "-") || "section";
	const renderInlineMarkdownToText = (text) => {
		const div = document.createElement("DIV");
		if(marked.parseInline) {
			div.innerHTML = marked.parseInline(text || "");
			return normalizeText(div.textContent);
		}
		return normalizeText((text || "")
			.replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
			.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
			.replace(/[`*_~]/g, ""));
	};
	const buildHeadingKey = (stack, counts, level, text) => {
		while(stack.length > 1 && stack[stack.length - 1].level >= level) {
			stack.pop();
		}

		const parent = stack[stack.length - 1];
		const count_key = js.sf("%s|%d|%s", parent.key, level, text);
		const count = counts[count_key] = (counts[count_key] || 0) + 1;
		const key = js.sf("%s/%d:%s#%d", parent.key, level, text, count);

		stack.push({ level: level, key: key });
		return key;
	};
	const buildMarkdownHeadingIndex = (value) => {
		const lines = (value || "").split("\n");
		const headings = [];
		const counts = Object.create(null);
		const stack = [{ level: 0, key: "" }];
		let fenced;

		for(let i = 0; i < lines.length; ++i) {
			const line = lines[i];
			const fence = line.match(/^\s*([`~]{3,})/);
			if(fence) {
				const marker = fence[1];
				if(!fenced) {
					fenced = marker;
				} else if(marker.charAt(0) === fenced.charAt(0) && marker.length >= fenced.length) {
					fenced = null;
				}
				continue;
			}
			if(fenced) {
				continue;
			}

			const atx = line.match(/^\s{0,3}(#{1,6})[ \t]+(.+?)\s*#*\s*$/);
			if(atx) {
				const level = atx[1].length;
				const text = renderInlineMarkdownToText(atx[2]);
				if(text !== "") {
					headings.push({
						row: i,
						level: level,
						text: text,
						key: buildHeadingKey(stack, counts, level, text)
					});
				}
				continue;
			}

			const next = lines[i + 1];
			const setext = next && next.match(/^\s{0,3}(=+|-+)\s*$/);
			if(setext && line.trim() !== "") {
				const text = renderInlineMarkdownToText(line.trim());
				const level = setext[1].charAt(0) === "=" ? 1 : 2;
				if(text !== "") {
					headings.push({
						row: i,
						level: level,
						text: text,
						key: buildHeadingKey(stack, counts, level, text)
					});
				}
				++i;
			}
		}

		return headings;
	};
	const buildMarkdownOutlineNodes = (headings, total_lines) => {
		const roots = [];
		const stack = [];

		headings.forEach((heading, index) => {
			const next = headings[index + 1];
			const node = {
				id: heading.key,
				key: heading.key,
				level: heading.level,
				text: heading.text,
				row: heading.row,
				endRow: next ? Math.max(heading.row, next.row - 1) : Math.max(heading.row, (total_lines || 1) - 1),
				parentId: null,
				children: []
			};

			while(stack.length && stack[stack.length - 1].level >= node.level) {
				stack.pop();
			}

			if(stack.length) {
				node.parentId = stack[stack.length - 1].key;
				stack[stack.length - 1].children.push(node);
			} else {
				roots.push(node);
			}

			stack.push(node);
		});

		return roots;
	};
	const findHeadingIndexForRow = (headings, row) => {
		let active = -1;
		for(let i = 0; i < headings.length; ++i) {
			if(headings[i].row > row) {
				break;
			}
			active = i;
		}
		return active;
	};
	const getAceEditor = (control) => {
		const root = getEditorRoot(control);
		const ace = root && root.qsa && root.qsa("#ace")[0];
		return ace && ace.getEditor ? ace.getEditor() : null;
	};
	const getOutputControl = (control) => {
		if(control && control.ud) {
			const output = control.ud("#output") || control.ud("#preview");
			if(output) {
				return output;
			}
		}

		const root = getEditorRoot(control);
		return root && root.qsa ? (root.qsa("#output")[0] || root.qsa("#preview")[0]) : null;
	};
	const getPreviewFollowEnabled = (control) => {
		const root = getEditorRoot(control);
		return root ? root.vars(["md-preview-follow-source"]) !== false : true;
	};
	const isSourceVisible = (control) => {
		const root = getEditorRoot(control);
		return root ? root.vars(["md-source-visible"]) !== false : true;
	};
	const buildEditorFoldState = (control) => {
		const root = getEditorRoot(control);
		const editor = getAceEditor(control);
		const headings = root && root.vars(["md-heading-index"]);
		const state = {};

		(headings || []).forEach(heading => state[heading.key] = false);
		if(!editor || !headings || headings.length === 0 || !editor.session.getAllFolds) {
			return state;
		}

		editor.session.getAllFolds().forEach(fold => {
			const index = findHeadingIndexForRow(headings, fold.start.row);
			if(index !== -1) {
				state[headings[index].key] = true;
			}
		});

		return state;
	};
	const snapshotEditorFoldState = (control) => {
		const root = getEditorRoot(control);
		root && root.vars("md-editor-fold-state", buildEditorFoldState(control));
	};
	const applyEditorFoldStateToPreview = (control) => {
		const root = getEditorRoot(control);
		const current = buildEditorFoldState(control);
		let changed = false;

		if(!root || root.vars(["md-fold-sync-ready"]) !== true) {
			root && root.vars("md-editor-fold-state", current);
			return false;
		}

		Object.keys(current).forEach(key => {
			const section = getPreviewSectionByKey(control, key);
			if(!section) {
				return;
			}
			if(section.classList.contains("collapsed") !== current[key]) {
				setSectionCollapsed(control, section, current[key], false);
				changed = true;
			}
		});

		root.vars("md-editor-fold-state", current);
		if(changed) {
			persistSectionState(control);
		}
		return changed;
	};
	const markMarkdownFoldSyncReady = (control) => {
		const root = getEditorRoot(control);
		const editor = getAceEditor(control);

		if(!root) {
			return;
		}
		root.vars("md-fold-sync-ready", true);
		snapshotEditorFoldState(control);
		applyEditorFoldStateToPreview(control);
		if(editor) {
			schedulePreviewSync(control, editor.getCursorPosition().row);
		}
	};
	const createMarkdownOutlineProxy = (control) => {
		const root = getEditorRoot(control) || control;
		const ace = root && root.ud ? root.ud("#ace") : null;
		const editor = ace && ace.getEditor ? ace.getEditor() : null;
		const resource = root && root.vars ? root.vars(["resource"]) : null;
		let cached_source = null;
		let cached_outline = null;
		const getOutline = () => {
			const source = ace ? ace.getValue() : "";
			if(cached_outline && source === cached_source) {
				return cached_outline;
			}

			const headings = buildMarkdownHeadingIndex(source);
			cached_source = source;
			cached_outline = {
				headings: headings,
				nodes: buildMarkdownOutlineNodes(headings, source.split("\n").length)
			};
			return cached_outline;
		};

		return {
			type: "markdown-outline",
			dialect: root && root.vars ? (root.vars(["dialect"]) || "markdown") : "markdown",
			resource: resource,
			ace: ace,
			editor: root,
			getSource() {
				return ace ? ace.getValue() : "";
			},
			getOutline() {
				return getOutline();
			},
			getNodes() {
				return getOutline().nodes;
			},
			getHeadings() {
				return getOutline().headings;
			},
			getActiveKey() {
				if(!editor) return null;
				const headings = getOutline().headings;
				const index = findHeadingIndexForRow(headings, editor.getCursorPosition().row);
				return index === -1 ? null : headings[index].key;
			},
			navigate(target) {
				if(!editor) return;

				const key = typeof target === "string" ? target : js.get("key", target);
				const heading = getOutline().headings.find(item => item.key === key);
				if(!heading) return;

				editor.gotoLine(heading.row + 1, 0, true);
				ace && ace.setFocus && ace.setFocus();
			},
			toJSON() {
				return {
					type: this.type,
					dialect: this.dialect,
					resource: this.resource,
					nodes: this.getNodes()
				};
			}
		};
	};
	const ensurePreviewCursorBand = (preview) => {
		let band = preview.querySelector(".md-cursor-band");
		if(!band) {
			band = document.createElement("DIV");
			band.className = "md-cursor-band";
			preview.appendChild(band);
		}
		return band;
	};
	const ensurePreviewSelectionLayer = (preview) => {
		let layer = preview.querySelector(".md-selection-layer");
		if(!layer) {
			layer = document.createElement("DIV");
			layer.className = "md-selection-layer";
			preview.appendChild(layer);
		}
		return layer;
	};
	const clearPreviewCursorState = (control, preview) => {
		if(!preview) return;

		const output = getOutputControl(control);
		const active = output && output.vars(["md-active-section"]);
		if(active) {
			active.classList.remove("cursor-active");
			output.vars("md-active-section", null);
		}
		syncTopLevelNavActive(control, null);

		const band = preview.querySelector(".md-cursor-band");
		if(band) {
			band.style.display = "none";
		}

		const layer = preview.querySelector(".md-selection-layer");
		if(layer) {
			layer.innerHTML = "";
			layer.style.display = "none";
		}
	};
	const getPreviewSectionByKey = (control, key) => {
		const output = getOutputControl(control);
		const preview = output && output.nodeNeeded ? output.nodeNeeded() : null;
		const map = output && output.vars(["md-section-map"]);

		if(map && map[key]) {
			return map[key];
		}
		if(!preview) return null;

		return Array.from(preview.querySelectorAll(".md-section"))
			.find(section => section.getAttribute("data-section-key") === key) || null;
	};
	const keepPreviewBandInView = (preview, band, block = "center") => {
		if(!preview || !band) return;

		const band_top = band.offsetTop;
		const band_bottom = band_top + band.offsetHeight;
		const window_top = preview.scrollTop + (preview.clientHeight * 0.18);
		const window_bottom = preview.scrollTop + (preview.clientHeight * 0.62);

		if(band_top < window_top || band_bottom > window_bottom) {
			let target;
			if(block === "nearest") {
				target = band_top - 24;
			} else {
				target = band_top - Math.round(preview.clientHeight * 0.35);
			}
			preview.scrollTop = Math.max(0, target);
		}
	};
	const placePreviewCursorBand = (preview, band, target, top) => {
		const preview_rect = preview.getBoundingClientRect();
		const target_rect = target.getBoundingClientRect();
		const inset = 10;
		const left = Math.max(0, (target_rect.left - preview_rect.left) + inset);
		const width = Math.max(48, target_rect.width - (inset * 2));

		band.style.left = js.sf("%dpx", Math.round(left));
		band.style.width = js.sf("%dpx", Math.round(width));
		band.style.top = js.sf("%dpx", Math.max(0, top));
		band.style.display = "";
	};
	const placePreviewSelectionBand = (preview, layer, target, top, height) => {
		const preview_rect = preview.getBoundingClientRect();
		const target_rect = target.getBoundingClientRect();
		const inset = 10;
		const band = document.createElement("DIV");

		band.className = "md-selection-band";
		band.style.left = js.sf("%dpx", Math.round(Math.max(0, (target_rect.left - preview_rect.left) + inset)));
		band.style.width = js.sf("%dpx", Math.round(Math.max(48, target_rect.width - (inset * 2))));
		band.style.top = js.sf("%dpx", Math.max(0, top));
		band.style.height = js.sf("%dpx", Math.max(10, height));
		layer.appendChild(band);
		layer.style.display = "";
	};
	const getVisibleSectionElement = (section) => {
		while(section && section.classList && section.classList.contains("md-section")) {
			const parent = section.parentNode;
			let parent_section = null;
			if(parent && parent.classList && parent.classList.contains("md-section-body")) {
				parent_section = parent.parentNode;
				if(parent_section && parent_section.classList.contains("collapsed")) {
					return parent_section;
				}
			}
			section = parent_section;
		}
		return null;
	};
	const renderPreviewSelection = (control, preview, editor, headings) => {
		const layer = ensurePreviewSelectionLayer(preview);
		const range = editor.selection.getRange();
		const max_bands = 64;

		layer.innerHTML = "";
		if(!range || (range.isEmpty && range.isEmpty())) {
			layer.style.display = "none";
			return;
		}

		const start_row = Math.min(range.start.row, range.end.row);
		const end_row = Math.max(range.start.row, range.end.row);
		const start_index = findHeadingIndexForRow(headings, start_row);
		let end_index = findHeadingIndexForRow(headings, end_row);

		if(start_index === -1 || end_index === -1) {
			layer.style.display = "none";
			return;
		}

		if(end_index - start_index > max_bands) {
			end_index = Math.min(headings.length - 1, start_index + max_bands);
		}

		for(let i = start_index; i <= end_index; ++i) {
			const heading = headings[i];
			const next = headings[i + 1];
			const section = getPreviewSectionByKey(control, heading.key);
			const target = section && (getVisibleSectionElement(section) || section);
			if(!section || target !== section) {
				continue;
			}

			const section_start_row = heading.row;
			const section_end_row = next ? next.row : Math.max(editor.session.getLength() - 1, section_start_row + 1);
			const span = Math.max(1, section_end_row - section_start_row);
			const from_row = i === start_index ? start_row : section_start_row;
			const to_row = i === end_index ? end_row + 1 : section_end_row;
			const from_ratio = Math.max(0, Math.min(1, (from_row - section_start_row) / span));
			const to_ratio = Math.max(from_ratio, Math.min(1, (to_row - section_start_row) / span));
			const top = section.offsetTop + ((section.offsetHeight || 0) * from_ratio);
			const bottom = section.offsetTop + ((section.offsetHeight || 0) * to_ratio);

			placePreviewSelectionBand(preview, layer, section, top, bottom - top);
		}
	};
	const syncPreviewToEditorRow = (control, row) => {
		const root = getEditorRoot(control);
		const output = getOutputControl(control);
		const preview = output && output.nodeNeeded ? output.nodeNeeded() : null;
		if(getPreviewFollowEnabled(control) !== true || isSourceVisible(control) !== true) {
			clearPreviewCursorState(control, preview);
			syncTopLevelNavActiveToPreviewScroll(control, preview);
			return;
		}

		const editor = getAceEditor(control);
		const headings = root && root.vars(["md-heading-index"]);
		clearPreviewCursorState(control, preview);
		if(!preview || !editor || !headings || headings.length === 0) {
			if(preview && row <= 0) {
				preview.scrollTop = 0;
			}
			return;
		}

		const index = findHeadingIndexForRow(headings, row);
		if(index === -1) {
			preview.scrollTop = 0;
			return;
		}

		const current = headings[index];
		const next = headings[index + 1];
		const section = getPreviewSectionByKey(control, current.key);
		if(!section) {
			return;
		}

		const target = getVisibleSectionElement(section) || section;
		if(target.classList) {
			target.classList.add("cursor-active");
			output && output.vars("md-active-section", target);
			syncTopLevelNavActiveToSourcePosition(control);
		}
		renderPreviewSelection(control, preview, editor, headings);
		const band = ensurePreviewCursorBand(preview);
		let band_top;
		if(target !== section) {
			const target_heading = target.firstElementChild;
			band_top = target.offsetTop + (target_heading ? target_heading.offsetHeight - 3 : Math.round(target.offsetHeight / 2));
			placePreviewCursorBand(preview, band, target, band_top);
			keepPreviewBandInView(preview, band, "nearest");
			return;
		}

		const section_end_row = next ? next.row : Math.max(editor.session.getLength() - 1, current.row + 1);
		const span = Math.max(1, section_end_row - current.row);
		const ratio = Math.max(0, Math.min(1, (row - current.row) / span));
		band_top = section.offsetTop + ((section.offsetHeight || 0) * ratio);
		placePreviewCursorBand(preview, band, target, band_top);
		keepPreviewBandInView(preview, band, "center");
	};
	const schedulePreviewSync = (control, row) => {
		if(control && control.setTimeout) {
			control.setTimeout("sync-preview-to-editor", () => syncPreviewToEditorRow(control, row), 60);
		}
	};
	const syncTopLevelNavToSourcePositionThrottled = (control, interval) => {
		const root = getEditorRoot(control);
		const throttle = root && root.vars && root.vars(["runTopLevelNavigationThrottled"]);

		if(throttle) {
			throttle(root, "md-toplevel-nav-source-sync",
				() => syncTopLevelNavActiveToSourcePosition(control), interval || 50);
		} else {
			syncTopLevelNavActiveToSourcePosition(control);
		}
	};
	const syncPreviewToEditorFolds = (control) => {
		const root = getEditorRoot(control);
		const output = getOutputControl(control);
		const preview = output && output.nodeNeeded ? output.nodeNeeded() : null;
		const previous = root && root.vars(["md-editor-fold-state"]);
		const current = buildEditorFoldState(control);
		let changed = false;

		if(!root) {
			return;
		}
		if(root.vars(["md-fold-sync-ready"]) !== true) {
			root.vars("md-editor-fold-state", current);
			return;
		}
		if(!preview || !previous) {
			root.vars("md-editor-fold-state", current);
			return;
		}

		Object.keys(current).forEach(key => {
			const before = previous[key];
			const after = current[key];
			if(before === after) {
				return;
			}

			const section = getPreviewSectionByKey(control, key);
			if(!section) {
				return;
			}

			const preview_collapsed = section.classList.contains("collapsed");
			if(preview_collapsed === before) {
				setSectionCollapsed(control, section, after, false);
				changed = true;
			}
		});

		root.vars("md-editor-fold-state", current);
		if(changed) {
			persistSectionState(control);
		}
	};
	const setSectionCollapsed = (control, section, collapsed, persist = true) => {
		if(!section) return;

		section.classList[collapsed ? "add" : "remove"]("collapsed");

		const heading = section.firstElementChild;
		if(heading) {
			heading.setAttribute("aria-expanded", collapsed ? "false" : "true");
		}

		const key = section.getAttribute("data-section-key");
		if(key) {
			getSectionState(control)[key] = collapsed;
			if(persist) {
				persistSectionState(control);
			}
		}
	};
	const setSectionsCollapsed = (control, sections, collapsed) => {
		sections.forEach(section => setSectionCollapsed(control, section, collapsed, false));
		persistSectionState(control);
	};
	const setFolderCollapsed = (control, item, collapsed, persist = true) => {
		if(!item || item.classList.contains("md-folder") === false) return;

		item.classList[collapsed ? "add" : "remove"]("collapsed");
		const link = getFolderLink(item);
		const toggle = getFolderToggle(item);
		if(toggle) {
			toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
		}
		if(link) {
			link.setAttribute("aria-expanded", collapsed ? "false" : "true");
		}

		const key = item.getAttribute("data-folder-key");
		if(key) {
			getSectionState(control)[key] = collapsed;
			if(persist) {
				persistSectionState(control);
			}
		}
	};
	const setFoldersCollapsed = (control, items, collapsed) => {
		items.forEach(item => setFolderCollapsed(control, item, collapsed, false));
		persistSectionState(control);
	};
	const expandSectionsUpToLevel = (control, sections, level) => {
		level = parseInt(level, 10);
		sections.forEach(section => {
			const section_level = parseInt(section.getAttribute("data-section-level"), 10);
			if(section_level <= level) {
				setSectionCollapsed(control, section, false, false);
			}
		});
		persistSectionState(control);
	};
	const getTopLevelOutlineNodes = (control) => {
		const root = getEditorRoot(control);
		let headings = root && root.vars(["md-heading-index"]);
		const ace = root && root.ud ? root.ud("#ace") : null;
		const source = ace && ace.getValue ? ace.getValue() : "";

		if(!headings || headings.length === 0) {
			headings = buildMarkdownHeadingIndex(source);
		}

		return buildMarkdownOutlineNodes(headings || [], source.split("\n").length);
	};
	const getSectionTitleText = (section) => {
		if(headingLevel(section) > 0) {
			return normalizeText(section.textContent) || "Section";
		}

		const heading = section && section.firstElementChild;
		return normalizeText(heading ? heading.textContent : "") || "Section";
	};
	const getTopLevelSectionForSection = (section) => {
		let current = section;
		let top = section;

		while(current && current.classList && current.classList.contains("md-section")) {
			top = current;
			const parent = current.parentNode;
			current = parent && parent.classList && parent.classList.contains("md-section-body") ?
				parent.parentNode : null;
		}

		return top;
	};
	const getTopLevelNavigation = (control) => {
		const root = getEditorRoot(control);
		return root && root.vars ? root.vars(["topLevelNavigation"]) : null;
	};
	const syncTopLevelNavActive = (control, active_sections, caret_sections) => {
		const output = getOutputControl(control);
		const preview = output && output.nodeNeeded ? output.nodeNeeded() : null;
		const nav = preview && preview.querySelector(".md-toplevel-nav");
		const active_keys = Object.create(null);
		const caret_keys = Object.create(null);
		const helper = getTopLevelNavigation(control);
		const collect = (sections, target) => {
			(sections ? (Array.isArray(sections) ? sections : [sections]) : [])
				.forEach(section => {
					const top_section = getTopLevelSectionForSection(section);
					const key = top_section && top_section.getAttribute &&
						top_section.getAttribute("data-section-key");
					if(key) {
						target[key] = true;
					}
				});
		};

		if(!nav || !helper) return;

		collect(active_sections, active_keys);
		collect(caret_sections, caret_keys);

		helper.syncActive(nav, Object.keys(active_keys), Object.keys(caret_keys));
	};
	const expandSectionForNavigation = (control, section) => {
		let current = section;

		while(current && current.classList) {
			if(current.classList.contains("md-section")) {
				setSectionCollapsed(control, current, false, false);
			}

			const parent = current.parentNode;
			current = parent && parent.classList && parent.classList.contains("md-section-body") ?
				parent.parentNode : null;
		}

		persistSectionState(control);
	};
	const navigateSourceToHeading = (control, key) => {
		const root = getEditorRoot(control);
		const editor = getAceEditor(control);
		const headings = root && root.vars(["md-heading-index"]);
		const heading = headings && headings.find(item => item.key === key);
		const ace = root && root.ud ? root.ud("#ace") : null;

		if(!editor || !heading || isSourceVisible(control) !== true) {
			return;
		}

		editor.gotoLine(heading.row + 1, 0, true);
		ace && ace.setFocus && ace.setFocus();
	};
	const navigateToTopLevelSection = (control, key, evt) => {
		let section = getPreviewSectionByKey(control, key);
		const output = getOutputControl(control);
		const preview = output && output.nodeNeeded ? output.nodeNeeded() : null;
		const modified = evt && (evt.metaKey || evt.ctrlKey || evt.shiftKey);

		if(!section && preview) {
			section = Array.from(preview.querySelectorAll("[data-md-nav-key]"))
				.find(node => node.getAttribute("data-md-nav-key") === key);
		}
		if(!section) return;
		if(modified && section.tagName === "A") {
			section.dispatchEvent(new MouseEvent("click", {
				bubbles: true,
				cancelable: true,
				metaKey: evt.metaKey,
				ctrlKey: evt.ctrlKey,
				altKey: evt.altKey,
				shiftKey: evt.shiftKey
			}));
			return;
		}

		expandSectionForNavigation(control, section.closest && section.closest(".md-section") || section);
		section.scrollIntoView({ block: "start", behavior: "smooth" });
		navigateSourceToHeading(control, key);
		section.classList.add("cursor-active");
		if(output) {
			const previous = output.vars(["md-active-section"]);
			if(previous && previous !== section) {
				previous.classList.remove("cursor-active");
			}
			output.vars("md-active-section", section);
		}
		syncTopLevelNavActive(control, section, isSourceVisible(control) ? section : null);
	};
	const buildTopLevelLinkItems = (preview) => Array.from(preview.querySelectorAll("a[href]"))
		.filter(anchor => anchor.closest(".md-toplevel-nav") === null)
		.filter(anchor => anchor.classList.contains("md-heading-anchor") === false)
		.map((anchor, index) => {
			const key = js.sf("link:%d", index);
			const text = normalizeText(anchor.textContent) ||
				normalizeText(anchor.getAttribute("title")) ||
				anchor.getAttribute("href") || "Link";

			anchor.setAttribute("data-md-nav-key", key);
			anchor.setAttribute("data-section-key", key);
			return {
				key: key,
				section: anchor,
				navNode: anchor,
				text: text,
				isLink: true,
				navTitle: anchor.getAttribute("data-href-hint") || anchor.getAttribute("href") || text,
				children: []
			};
		});
	const buildTopLevelSectionItems = (preview, control) => {
		const outline_nodes = getTopLevelOutlineNodes(control);
		const outline_by_key = {};

		outline_nodes.forEach(node => outline_by_key[node.key] = node);

		let sections = Array.from(preview.querySelectorAll(".md-section"))
			.filter(section => section.closest(".md-section-body") === null)
			.map(section => {
				const key = section.getAttribute("data-section-key");
				const outline = outline_by_key[key];
				return {
					key: key,
					section: section,
					row: outline && outline.row,
					endRow: outline && outline.endRow
				};
			})
			.filter(item => item.key && item.section);

		if(sections.length > 0) {
			return sections;
		}

		const map = control.vars(["md-section-map"]) || {};
		sections = outline_nodes.map(node => ({
			key: node.key,
			section: map[node.key],
			row: node.row,
			endRow: node.endRow
		})).filter(item => item.key && item.section);

		if(sections.length > 0) {
			return sections;
		}

		sections = Array.from(preview.querySelectorAll("h1,h2,h3,h4,h5,h6"))
			.filter(heading => heading.closest(".md-toplevel-nav") === null)
			.map((heading, index) => {
				const key = js.sf("heading:%d", index);
				heading.setAttribute("data-md-nav-key", key);
				heading.setAttribute("data-section-key", key);
				return {
					key: key,
					section: heading
				};
			});

		return sections.length > 0 ? sections : buildTopLevelLinkItems(preview);
	};
	const buildTopLevelMenuItems = (preview, control) => {
		const root = getEditorRoot(control);
		const settings = root && root.vars && root.vars(["topLevelNavigation.settings"]) || {};
		const outline_nodes = getTopLevelOutlineNodes(control);
		const section_items = new Map();
		const compareMenuItems = (a, b) => {
			const an = a.navNode || a.section;
			const bn = b.navNode || b.section;
			const pos = an && bn && an.compareDocumentPosition(bn);

			if(an === bn) return 0;
			if(!an) return 1;
			if(!bn) return -1;
			return pos & Node.DOCUMENT_POSITION_PRECEDING ? 1 : -1;
		};
		const sortMenuItems = (items) => {
			items.sort(compareMenuItems);
			items.forEach(item => sortMenuItems(item.children || []));
			return items;
		};
		const mapNode = (node, depth = 1) => {
			const section = getPreviewSectionByKey(control, node.key);
			const item = {
				key: node.key,
				section: section,
				navNode: section,
				navDepth: depth,
				text: node.text,
				row: node.row,
				endRow: node.endRow,
				children: (node.children || []).map(child => mapNode(child, depth + 1))
			};

			if(section) {
				section_items.set(section, item);
			}
			return item;
		};
		const menu_items = outline_nodes.map(mapNode);
		const link_items = buildTopLevelLinkItems(preview);

		if(settings.links === true || outline_nodes.length === 0) {
			link_items.forEach(item => {
				let parent_section = item.section.closest(".md-section");
				let parent_item = parent_section && section_items.get(parent_section);

				while(parent_item && parent_item.navDepth > (settings.depth || 1)) {
					parent_section = parent_section.parentNode &&
						parent_section.parentNode.closest &&
						parent_section.parentNode.closest(".md-section");
					parent_item = parent_section && section_items.get(parent_section);
				}
				(parent_item ? parent_item.children : menu_items).push(item);
			});
		}

		return sortMenuItems(menu_items);
	};
	const getTopLevelSectionItems = (preview, control) => {
		const output = getOutputControl(control);
		const items = output && output.vars(["md-toplevel-nav-items"]);

		return items || buildTopLevelSectionItems(preview, control);
	};
	const getTopLevelSectionsForPreviewScroll = (preview, control) => {
		const items = getTopLevelSectionItems(preview, control);
		const top = preview.scrollTop;
		const bottom = top + preview.clientHeight;
		let active;

		if(items.length === 0) {
			return [];
		}

		active = items.filter(item => {
			const section = item.section;
			const section_top = section.offsetTop;
			const section_bottom = section_top + Math.max(section.offsetHeight, 1);
			return section_top < bottom && section_bottom > top;
		});

		if(preview.scrollTop + preview.clientHeight >= preview.scrollHeight - 2 &&
				active.indexOf(items[items.length - 1]) === -1) {
			active.push(items[items.length - 1]);
		}

		return active.length ? active.map(item => item.section) : [items[0].section];
	};
	const syncTopLevelNavActiveToPreviewScroll = (control, preview) => {
		if(!preview) return;

		syncTopLevelNavActive(control, getTopLevelSectionsForPreviewScroll(preview, control));
	};
	const syncTopLevelNavActiveToSourcePosition = (control) => {
		const root = getEditorRoot(control);
		const editor = getAceEditor(control);
		const headings = root && root.vars(["md-heading-index"]);
		const output = getOutputControl(control);
		const preview = output && output.nodeNeeded ? output.nodeNeeded() : null;
		const items = preview ? getTopLevelSectionItems(preview, control) : [];
		let first_row;
		let last_row;
		let active;
		let index;
		let cursor_row;
		let caret_section;

		if(!editor || !headings || headings.length === 0) {
			syncTopLevelNavActive(control, null);
			return;
		}

		cursor_row = editor.getCursorPosition().row;
		if(editor.renderer && editor.renderer.getFirstVisibleRow) {
			first_row = editor.renderer.getFirstVisibleRow();
			last_row = editor.renderer.getLastVisibleRow ?
				editor.renderer.getLastVisibleRow() : first_row;
		} else {
			first_row = last_row = cursor_row;
		}

		active = items
			.filter(item => typeof item.row === "number" && typeof item.endRow === "number")
			.filter(item => item.row <= last_row && item.endRow >= first_row)
			.map(item => item.section);

		index = findHeadingIndexForRow(headings, cursor_row);
		caret_section = index === -1 ? null : getPreviewSectionByKey(control, headings[index].key);
		if(active.length === 0) {
			active = caret_section ? [caret_section] : [];
		}

		syncTopLevelNavActive(control, active.filter(Boolean),
			isSourceVisible(control) && caret_section ? [caret_section] : []);
	};
	const decorateTopLevelNavigation = (preview, control) => {
		const output = getOutputControl(control);
		const helper = getTopLevelNavigation(control);
		const nodes = buildTopLevelSectionItems(preview, control);
		const total_row = nodes.reduce((value, node) =>
			Math.max(value, typeof node.endRow === "number" ? node.endRow :
				typeof node.row === "number" ? node.row : 0), 0) || 1;
		let nav;

		nodes.forEach(node => {
			if(typeof node.row === "number") {
				node.positionRatio = node.row / total_row;
			}
		});
		output && output.vars("md-toplevel-nav-items", nodes);
		if(!helper || nodes.length === 0) {
			const previous = preview.querySelector(".md-toplevel-nav");
			previous && previous.parentNode.removeChild(previous);
			output && output.vars("md-toplevel-nav-elements", []);
			return;
		}

		nav = helper.render({
			root: getEditorRoot(control),
			ownerNode: preview,
			fallback: preview,
			className: "md-toplevel-nav",
			railClassName: "md-toplevel-nav-rail",
			menuClassName: "md-toplevel-nav-menu",
			tickClassName: "md-toplevel-nav-tick",
			itemClassName: "md-toplevel-nav-item",
			keyAttribute: "data-section-key",
			ariaLabel: "Document sections",
			items: nodes,
			menuItems: buildTopLevelMenuItems(preview, control),
			side: isSourceVisible(control) ? "right" : undefined,
			minGap: 6,
			defaultDepth: 1,
			supportsLinks: true,
			getKey: node => node.key,
			getLabel: node => node.text || getSectionTitleText(node.section),
			getMenuLabel: node => node.text || getSectionTitleText(node.section),
			onSettingsChanged: () => updateTopLevelNavigationPosition(control),
			onNavigate: (key, evt) => navigateToTopLevelSection(control, key, evt)
		});
		output && output.vars("md-toplevel-nav-elements", nav && nav._topLevelNav ? nav._topLevelNav.elements : []);
		syncTopLevelNavActiveToPreviewScroll(control, preview);
	};
	const scheduleTopLevelNavigationResize = (control) => {
		const root = getEditorRoot(control);
		if(!root) return;
		root.setTimeout("md-toplevel-nav-resize", () => {
			const output = getOutputControl(control);
			const preview = output && output._node;
			const nav = preview && preview.querySelector(".md-toplevel-nav");
			const helper = getTopLevelNavigation(control);
			if(!nav || !helper || !root.isVisible()) return;
			helper.resize(nav);
			output.vars("md-toplevel-nav-elements", nav._topLevelNav.elements);
			if(isSourceVisible(control)) {
				syncTopLevelNavActiveToSourcePosition(control);
			} else {
				syncTopLevelNavActiveToPreviewScroll(control, preview);
			}
		}, 0);
	};
	const updateTopLevelNavigationPosition = (control) => {
		const output = getOutputControl(control);
		const preview = output && output.nodeNeeded ? output.nodeNeeded() : null;

		if(preview) {
			decorateTopLevelNavigation(preview, control);
		}
	};
	const startsWithProtocol = (url) => url.match(/^[^\s]*:\/\//) !== null;
	const expandProjectMarkdownHref = (href, kind) => {
		const root = kind === "blocks" ? "./src/cavalion-blocks/" : "./src/vcl-comps/";
		if(href === "$" || href === "$:") return root + ":";
		if(href.startsWith("$/")) return root + href.substring(2);
		return href;
	};
	const resolveLinkHintHref = (anchor, control) => {
		let href = LinkLocation.decodeHref(js.get("attributes.href.value", anchor) || "", window.unescape);
		let blocks, blocks_vars, comps, comps_vars;
		let backticks = false;
		let swp, uri, position;
		const base = control.vars(["resource.uri"]);

		if(href.startsWith("javascript:")) {
			return href;
		}

		if(href.startsWith("`") && href.endsWith("`")) {
			backticks = true;
			href = href.substring(1, href.length - 1);
			if(href === "!") {
				href = "${p(:)}";
			}
		}

		const silent = href.match(/!!\$\{/);
		if(silent) {
			href = href.substring(2);
		}

		if(href === "[]") {
			href = "[:]";
		}

		if(href === "[.]") {
			href = "blocks:./:";
		} else if(href === "[!]") {
			href = "blocks:!:";
		} else if(href.startsWith("[") && href.endsWith("]")) {
			href = "blocks:" + href.substring(1, href.length - 1);
		} else if(href.startsWith("<<[") && href.endsWith("]>>")) {
			href = "blocks:*" + href.substring(3, href.length - 3);
		} else if(href.startsWith("<[") && href.endsWith("]>")) {
			href = "blocks:*" + href.substring(2, href.length - 2);
		} else if(href.startsWith("<[") && href.endsWith("]>>")) {
			href = "blocks:*" + href.substring(2, href.length - 3);
		} else if((blocks = href.match(/(\[[^\]]*\])({.*})/))) {
			href = "blocks:" + blocks[1].substring(1).split("]")[0];
			blocks_vars = blocks[2];
		}

		if(href === "()") {
			href = "(:)";
		}

		if(href === "(.)") {
			href = "comps:./:";
		} else if(href === "(!)") {
			href = "comps:!:";
		} else if(href.startsWith("(") && href.endsWith(")")) {
			href = "comps:" + href.substring(1, href.length - 1);
		} else if((comps = href.match(/(\([^\)]*\))({.*})/))) {
			href = "comps:" + comps[1].substring(1).split(")")[0];
			comps_vars = comps[2];
		}

		if(href === "{}") href = "{:}";

		if(href.startsWith("blocks:")) {
			href = expandProjectMarkdownHref(href.substring("blocks:".length), "blocks");
			blocks = true;
		} else if(href.startsWith("comps:")) {
			href = expandProjectMarkdownHref(href.substring("comps:".length), "comps");
			comps = true;
		}
		if(!backticks) {
			const parsed = LinkLocation.parse(href);
			href = parsed.href;
			position = parsed.position;
		}
		if(href.startsWith(":") && !href.startsWith("://")) {
			href = anchor.textContent + href.substring(1);
		}

		swp = startsWithProtocol(href);
		if(!swp || href.split(":").length > 2) {
			if(href.charAt(0) === "#") {
				if(!href.endsWith(":")) {
					return href;
				}
			} else {
				href = href.replace(/:([^:]*)$/, anchor.textContent + "$1");
			}
		}

		if(href === "" || href === "*") {
			href = href + anchor.textContent;
		}

		if(backticks) {
			return js.sf("[dynamic] %s", href);
		}
		href = LinkLocation.restoreLiteralColons(href);

		if(href.startsWith("https://") ||
			href.startsWith("http://") ||
			href.startsWith("file://") ||
			href.startsWith("ftp://") ||
			href.startsWith("codex://") ||
			href.startsWith("///")
		) {
			return href.startsWith("///") ? href.substring(3) : href;
		}

		if(href.endsWith("::")) {
			const hs = href.split(":");
			hs.pop(); hs.pop(); hs.shift();
			return js.normalize(base, hs.join(":").replace(/::/g, anchor.textContent) || anchor.textContent);
		}

		if(blocks) {
			if(href.charAt(0) === "*") href = href.substring(1);
			if(href.charAt(0) === "!") href = href.substring(1);

			if(href.startsWith("./")) {
				uri = js.normalize(base, href);
			} else if(href.startsWith("/")) {
				uri = href.substring(1);
			} else if(!swp) {
				uri = "Library/cavalion-blocks/" + href;
			} else {
				uri = href;
			}
			return LinkLocation.format(resolveUri_blocks(uri).substring("cavalion-blocks/".length) + ".js", position);
		} else if(comps) {
			if(href.charAt(0) === "!") href = href.substring(1);
			if(href.startsWith("./")) {
				uri = js.normalize(base, href);
			} else if(href.startsWith("/")) {
				uri = href.substring(1);
			} else if(!swp) {
				uri = "Library/vcl-comps/" + href;
			} else {
				uri = href;
			}
			return LinkLocation.format(resolveUri_comps(uri).substring("vcl-comps/".length) + ".js", position);
		}

		swp = startsWithProtocol(href);
		if(!swp) {
			const _ = window.require.s.contexts._;
			if(href.startsWith("{") && href.endsWith("}")) {
				uri = _.nameToUrl(href.substring(1, href.length - 1));
				uri = uri.replace(/^\.\/lib/, "/Library/");
			} else {
				uri = href;
			}
			uri = js.normalize(base, uri.charAt(0) === "/" ? uri.substring(1) : ("./" + uri));
		} else {
			uri = href;
		}

		return LinkLocation.format(uri.endsWith("/") ? uri.substring(0, uri.length - 1) : uri, position);
	};
	const decorateLinks = (node, control) => {
		node.qsa("a").forEach(a => {
			if(a.classList.contains("md-heading-anchor")) {
				a.removeAttribute("data-href-hint");
			} else {
				const href = resolveLinkHintHref(a, control);
				if(href) {
					a.setAttribute("data-href-hint", href);
				} else {
					a.removeAttribute("data-href-hint");
				}
			}
		});
	};
	const decorateSections = (node, control) => {
		const children = Array.from(node.childNodes);
		if(children.some(child => headingLevel(child) > 0) === false) {
			control.vars("md-section-map", {});
			return;
		}

		const state = getSectionState(control);
		const counts = Object.create(null);
		const map = {};

		while(node.firstChild) {
			node.removeChild(node.firstChild);
		}

		const stack = [{ level: 0, body: node, key: "" }];
		children.forEach(child => {
			const level = headingLevel(child);
			if(level === 0) {
				stack[stack.length - 1].body.appendChild(child);
				return;
			}

			while(stack.length > 1 && stack[stack.length - 1].level >= level) {
				stack.pop();
			}

			const parent = stack[stack.length - 1];
			const text = normalizeText(child.textContent);
			const count_key = js.sf("%s|%d|%s", parent.key, level, text);
			const count = counts[count_key] = (counts[count_key] || 0) + 1;
			const key = js.sf("%s/%d:%s#%d", parent.key, level, text, count);
			const section = document.createElement("DIV");
			const body = document.createElement("DIV");

			section.className = "md-section";
			section.setAttribute("data-section-key", key);
			section.setAttribute("data-section-level", level);
			body.className = "md-section-body";
			child.classList.add("md-section-heading");

			section.appendChild(child);
			section.appendChild(body);
			parent.body.appendChild(section);
			map[key] = section;
			stack.push({ level: level, body: body, key: key });

			setSectionCollapsed(control, section, state[key] === true, false);
		});

		control.vars("md-section-map", map);
	};
	const getFolderLink = (item) => {
		if(!item || item.nodeName !== "LI") return null;

		const content = Array.from(item.children).find(child =>
			child.nodeName === "A" || child.nodeName === "P");
		const link = content && (content.nodeName === "A" ? content : content.querySelector("A"));
		return link && normalizeText(link.textContent).endsWith("/") ? link : null;
	};
	const getFolderToggle = (item) => item && Array.from(item.children).find(child =>
		child.classList && child.classList.contains("md-folder-toggle"));
	const getFolderItemText = (item) => {
		const link = getFolderLink(item);
		if(link) {
			return normalizeText(link.textContent);
		}

		const clone = item.cloneNode(true);
		Array.from(clone.querySelectorAll("ul, ol")).forEach(list => {
			list.parentNode && list.parentNode.removeChild(list);
		});
		return normalizeText(clone.textContent) || "item";
	};
	const buildFolderKey = (item, counts) => {
		const section = item.closest ? item.closest(".md-section") : null;
		const section_key = section ? section.getAttribute("data-section-key") : "";
		const path = [];
		let current = item;

		while(current && current.nodeName === "LI") {
			path.unshift(getFolderItemText(current));
			const list = current.parentNode;
			current = list && list.parentNode && list.parentNode.nodeName === "LI" ? list.parentNode : null;
		}

		const name = path.join(" > ");
		const count_key = js.sf("%s|%s", section_key, name);
		const count = counts[count_key] = (counts[count_key] || 0) + 1;
		return js.sf("folder:%s::%s#%d", section_key, name, count);
	};
	const decorateFolders = (node, control) => {
		const state = getSectionState(control);
		const counts = Object.create(null);

		node.qsa("li").forEach(item => {
			const link = getFolderLink(item);
			const children = Array.from(item.children).filter(child =>
				child.nodeName === "UL" || child.nodeName === "OL");
			if(!link || children.length === 0) return;

			const key = buildFolderKey(item, counts);
			let toggle = getFolderToggle(item);
			item.classList.add("md-folder");
			item.setAttribute("data-folder-key", key);
			if(!toggle) {
				toggle = document.createElement("BUTTON");
				toggle.type = "button";
				toggle.className = "md-folder-toggle";
				toggle.setAttribute("aria-label", "Toggle folder");
				item.insertBefore(toggle, item.firstChild);
			}
			setFolderCollapsed(control, item, state[key] === true, false);
		});
	};
	const getCheckboxItemText = (item) => {
		const clone = item.cloneNode(true);

		Array.from(clone.querySelectorAll("input, ul, ol")).forEach(node => {
			node.parentNode && node.parentNode.removeChild(node);
		});

		return normalizeText(clone.textContent) || "item";
	};
	const buildCheckboxKey = (item, counts) => {
		const section = item.closest ? item.closest(".md-section") : null;
		const section_key = section ? section.getAttribute("data-section-key") : "";
		let path = [];
		let current = item;

		while(current && current.nodeName === "LI") {
			path.unshift(getCheckboxItemText(current));
			const list = current.parentNode;
			current = list && list.parentNode && list.parentNode.nodeName === "LI" ? list.parentNode : null;
		}

		path = path.join(" > ") || "item";
		const count_key = js.sf("%s|%s", section_key, path);
		const count = counts[count_key] = (counts[count_key] || 0) + 1;
		return js.sf("%s::%s#%d", section_key, path, count);
	};
	const decorateCheckboxes = (node, control) => {
		const state = getCheckboxState(control);
		const counts = Object.create(null);

		node.qsa('input[type="checkbox"]').forEach(input => {
			const item = input.closest ? input.closest("LI") : null;
			if(!item) {
				input.removeAttribute("disabled");
				return;
			}

			const key = buildCheckboxKey(item, counts);
			input.removeAttribute("disabled");
			input.setAttribute("data-checkbox-key", key);

			if(state[key] !== undefined) {
				input.checked = state[key] === true;
			}

			input.addEventListener("change", () => {
				state[key] = input.checked === true;
				persistCheckboxState(control);
			});
		});
	};
	const e_v_a_l = (s) => {
		let E;
		s = js.sf("try { return `${r = %s`, r; } catch(e) { alert(e.message); throw p(e); } ", s.substring(2));
		return window[(E = "e") + "val"](js.sf("({" +
			"f: (app, ws, ed, v, l, p, r) => { %s }, " +
			"i: (img, app, ws, ed, v, l, p, r) => { %s } " +
		"})", s, s));
	};
	const e_v_a_l1 = (s, E) => {
		s = js.sf("try { return `%s`; } catch(e) { alert(e.message); throw p(e); } ", s);
		return window[(E = "e") + "val"](js.sf("({" +
			"f: (app, ws, ed, v, l, p, r) => { %s }, " +
			"i: (img, app, ws, ed, v, l, p, r) => { %s } " +
		"})", s, s));
	};
	const addMarkdownHeadingAnchors = node => {
		const insert = heading => {
			if(heading.querySelector(":scope > .md-heading-anchor")) return;

			const anchor = document.createElement("A");
			anchor.className = "md-heading-anchor";
			anchor.id = slugifyHeading(heading.textContent);
			anchor.href = "#" + anchor.id;
			heading.appendChild(anchor);
		};

		"h1,h2,h3,h4,h5".split(",").forEach(selector => node.qsa(selector).forEach(insert));
	};
	const prepareMarkdownNode = (node, control, resource) => {
		const output = getOutputControl(control);
		const me = output || control;

		node.qsa("a").forEach(anchor => {
			if(anchor.title && anchor.title.startsWith("`") && anchor.title.endsWith("`")) {
				const params = [
					me.app(),
					me.up("devtools/Workspace<>:root"),
					me.up("devtools/Editor<>:root"),
					(a, b, c, d) => me.vars.apply(me, [a, b, c, d].filter(a => a !== undefined)),
					window.locale,
					(a, b, c, d) => me.print.apply(me, [a, b, c, d].filter(a => a !== undefined))];

				anchor.title = e_v_a_l1(anchor.title.substring(1, anchor.title.length - 1))
					.f.apply(me, params);
			}
		});

		node.qsa("img").forEach(img => {
			const src = js.get("attributes.src.value", img) || "";
			if(src.indexOf(":") === -1 && resource.uri) {
				img.src = "/home/" + js.up(resource.uri) + "/" + src;
			}
		});

		on(node.qsa("img"), "load", function() {
			let ratio = window.devicePixelRatio || 1;
			if(this.style.maxWidth === "") {
				ratio = this["@?x"] || ratio;
				this.style.maxWidth = js.sf("%dpx", (this.naturalWidth / ratio));
			}
		});

		node.qsa("img").forEach(img => {
			const ratio = window.devicePixelRatio > 1 ? 2 : 2;
			let instructions;
			if(img.naturalWidth && img.src.indexOf("?2x") !== -1) {
				img.style.widthWhenHovered = img.naturalWidth / ratio + "px";
			}
			if(img.title.match(/^@([0-9]*[.])?[0-9]+/)) {
				instructions = img.title.split(" ");
				img["@?x"] = parseFloat(instructions.shift().substring(1));

				while(instructions.length && !instructions[0].startsWith("`")) {
					HE.addClass(img, instructions.shift());
				}

				img.title = instructions.join(" ");
			}

			if(img.title.startsWith("`") && img.title.endsWith("`")) {
				const params = [
					img,
					me.app(),
					me.up("devtools/Workspace<>:root"),
					me.up("devtools/Editor<>:root"),
					(i, a, b, c, d) => me.vars.apply(me, [i, a, b, c, d].filter(a => a !== undefined)),
					window.locale,
					(i, a, b, c, d) => me.print.apply(me, [i, a, b, c, d].filter(a => a !== undefined))];

				instructions = img.title.split("`");
				img.title = instructions.pop();
				instructions = e_v_a_l1(instructions[1]).i.apply(me, params).split(";");

				if(instructions.length === 1) {
					HE.addClasses(instructions.pop());
				}

				if(instructions.length) {
					js.mixIn(img.style, js.str2obj(instructions.join(";")));
				}
			}
		});

		addMarkdownHeadingAnchors(node);
		decorateLinks(node, control);
	};
	const finishMarkdownPreview = (node, control) => {
		decorateTopLevelNavigation(node, control);
		restorePreviewScrollState(control, node);
		applyEditorFoldStateToPreview(control);
		const editor = getAceEditor(control);
		schedulePreviewSync(control, editor ? editor.getCursorPosition().row : 0);
	};
	const recordRenderMetrics = (control, metrics) => {
		const root = getEditorRoot(control) || control.up();
		const output = getOutputControl(control);
		const history = root && root.vars(["md-render-metrics"]) || [];

		metrics.totalMs = now() - metrics.startedAt;
		delete metrics.startedAt;
		history.push(metrics);
		while(history.length > 20) history.shift();
		root && root.vars("md-render-metrics", history);
		if(output && output._node) {
			output._node.setAttribute("data-md-render-metrics", JSON.stringify(metrics));
		}
		if(root && root.vars(["md-render-profile"]) === true && control.print) {
			control.print("Markdown render", metrics);
		}
	};
	const editorNeeded = (control, evt) => {
		const workspace = control.up("devtools/Workspace<>:root");
		if(evt.metaKey === true && workspace) {
			return workspace.down("#editor-needed");
		}
		return control.udr("#editor-needed");
	};
	const update_shrink = (me, value) => {
		const output = me.ud("#output") || me.ud("#preview");
		output && output.syncClass("shrink", value);
	};
	const isUpperCase = (s) => s.toUpperCase() === s;
	const renderMarkdown = (control, opts) => {
		opts = opts || {};
		const pending_scheduler = control.vars(["md-render-scheduler"]);
		if(opts.fromScheduler !== true && pending_scheduler) pending_scheduler.cancel();
		const metrics = { startedAt: now(), mode: "full" };
		let value = opts.value !== undefined ? opts.value : control.getValue();
		let impl;

		if((impl = control.vars(["onGetRenderValue"]))) {
			value = impl(value, control);
		}
		if((impl = control.vars(["onRender"]))) {
			return impl(value, control);
		}

		const dialect = opts.dialect || control.vars(["dialect"]);
		const resource = opts.resource || control.vars(["resource"]) || {};
		const root_control = opts.root || control.up();
		const output = opts.output || getOutputControl(control);
		const render_value = dialect === "marked" ? escapeMarkdownLinkDescriptions(value) : value;
		const previous_value = root_control && root_control.vars(["md-render-source"]);
		const previous_headings = root_control && root_control.vars(["md-heading-index"]);
		const previous_dialect = root_control && root_control.vars(["md-render-dialect"]);
		let content, dom_replace_started, headings, plan, root, started;

		if(root_control && dialect !== undefined && root_control.vars("dialect-persisted") !== dialect &&
				root_control.writeStorage instanceof Function) {
			root_control.vars("dialect-persisted", dialect);
			root_control.writeStorage("dialect", dialect);
		}

		started = now();
		if(!dialect || dialect === "markdown") {
			root = markdown.toHTMLTree(encodeMdLinks(render_value),
				control.vars(["markdown.dialect"]),
				control.vars(["markdown.options"]));
			content = markdown.renderJsonML(root);
		} else if(dialect === "marked") {
			content = marked(render_value);
		}
		metrics.parseMs = now() - started;

		started = now();
		headings = buildMarkdownHeadingIndex(value);
		metrics.indexMs = now() - started;
		plan = previous_dialect === dialect ? MarkdownRenderSections.plan(
			previous_value, value, previous_headings, headings) : { mode: "full", reason: "dialect" };
		metrics.mode = plan.mode === "section" ? "section" : "full";
		metrics.reason = plan.reason;

		root_control && root_control.vars("md-heading-index", headings);
		root_control && root_control.vars("root", root);
		root_control && root_control.vars("md-render-source", value);
		root_control && root_control.vars("md-render-dialect", dialect);

		if(!output) {
			recordRenderMetrics(control, metrics);
			return content;
		}

		capturePreviewScrollState(control, output.nodeNeeded ? output.nodeNeeded() : null);
		if(plan.mode === "section") {
			const previous_section = getPreviewSectionByKey(control, plan.key);
			const staging = document.createElement("DIV");
			started = now();
			staging.innerHTML = content;
			decorateSections(staging, control);
			const next_section = Array.from(staging.querySelectorAll(".md-section"))
				.find(section => section.getAttribute("data-section-key") === plan.key);
			metrics.domBuildMs = now() - started;

			if(previous_section && next_section) {
				started = now();
				prepareMarkdownNode(next_section, control, resource);
				decorateFolders(next_section, control);
				if(dialect === "marked") decorateCheckboxes(next_section, control);
				metrics.postprocessMs = now() - started;
				started = now();
				previous_section.parentNode.replaceChild(next_section, previous_section);
				next_section.offsetHeight;
				metrics.domReplaceMs = now() - started;
				output.update(function() {
					const finish_started = now();
					finishMarkdownPreview(this.nodeNeeded(), control);
					metrics.postprocessMs += now() - finish_started;
					recordRenderMetrics(control, metrics);
				});
				return content;
			}

			metrics.mode = "full";
			metrics.reason = "section-node-missing";
		}

		dom_replace_started = now();
		output.setContent(content);
		output.update(function() {
			const node = this.nodeNeeded();
			node.offsetHeight;
			metrics.domReplaceMs = now() - dom_replace_started;
			started = now();
			decorateSections(node, control);
			prepareMarkdownNode(node, control, resource);
			decorateFolders(node, control);
			if(dialect === "marked") decorateCheckboxes(node, control);
			finishMarkdownPreview(node, control);
			metrics.postprocessMs = now() - started;
			recordRenderMetrics(control, metrics);
		}.bind(output));

		return content;
	};
	const isMarkdownControl = (control) => {
		return !!(control && (control.up("devtools/Editor<md>") || control.up("Tabs<Document.md>") ||
			(control.vars && control.vars(["document.facet"]) === "md")));
	};
	const getMarkdownRenderScheduler = control => {
		let scheduler = control.vars(["md-render-scheduler"]);
		if(!scheduler) {
			scheduler = new MarkdownRenderScheduler({
				quietPeriod: RENDER_QUIET_PERIOD,
				maxDelay: RENDER_MAX_DELAY,
				render: () => renderMarkdown(control, { fromScheduler: true })
			});
			control.vars("md-render-scheduler", scheduler);
		}
		return scheduler;
	};
	const scheduleMarkdownRender = (control, change) =>
		getMarkdownRenderScheduler(control).dirty(change);
	const noteMarkdownInteraction = control => {
		const editor = control && control.getEditor ? control.getEditor() : null;
		if(!editor || !editor.isFocused || editor.isFocused()) {
			getMarkdownRenderScheduler(control).activity();
		}
	};
	const flushMarkdownRender = (control, reason) =>
		getMarkdownRenderScheduler(control).flush(reason || "explicit");
	const installDocumentClickHandler = () => {
		if(installDocumentClickHandler.installed) {
			return;
		}
		installDocumentClickHandler.installed = true;
		document.addEventListener("click", (evt) => {
			const anchor = evt.target.up("A", true);
			if(!anchor) return;

			const control = require("vcl/Control").findByNode(anchor);
			if(!isMarkdownControl(control)) {
				return;
			}

			let href = LinkLocation.decodeHref(js.get("attributes.href.value", anchor) || "", window.unescape);
			let blocks, blocks_vars, comps, comps_vars;
			let backticks = false, position;

			if(href.startsWith("javascript:")) {
				return;
			}

			if(href.startsWith("`") && href.endsWith("`")) {
				backticks = true;
				href = href.substring(1, href.length - 1);
				if(href === "!") {
					href = "${p(:)}";
				}
			}

			const show_console = href.match(/\$\{p\(.*\)\}$/);
			const silent = href.match(/!!\$\{/);
			if(silent) {
				href = href.substring(2);
			}
			if(href === "[]") {
				href = "[:]";
			}

			if(href === "[.]") {
				href = "blocks:./:";
			} else if(href === "[!]") {
				href = "blocks:!:";
			} else if(href.startsWith("[") && href.endsWith("]")) {
				href = "blocks:" + href.substring(1, href.length - 1);
			} else if(href.startsWith("<<[") && href.endsWith("]>>")) {
				href = "blocks:*" + href.substring(3, href.length - 3);
			} else if(href.startsWith("<[") && href.endsWith("]>")) {
				href = "blocks:*" + href.substring(2, href.length - 2);
			} else if(href.startsWith("<[") && href.endsWith("]>>")) {
				href = "blocks:*" + href.substring(2, href.length - 3);
			} else if((blocks = href.match(/(\[[^\]]*\])({.*})/))) {
				href = "blocks:" + blocks[1].substring(1).split("]")[0];
				blocks_vars = blocks[2];
			}

			if(href === "()") {
				href = "(:)";
			}

			if(href === "(.)") {
				href = "comps:./:";
			} else if(href === "(!)") {
				href = "comps:!:";
			} else if(href.startsWith("(") && href.endsWith(")")) {
				href = "comps:" + href.substring(1, href.length - 1);
			} else if((comps = href.match(/(\([^\)]*\))({.*})/))) {
				href = "comps:" + comps[1].substring(1).split(")")[0];
				comps_vars = comps[2];
			}

			if(href === "{}") href = "{:}";

			if(href.startsWith("blocks:")) {
				href = expandProjectMarkdownHref(href.substring("blocks:".length), "blocks");
				blocks = true;
			} else if(href.startsWith("comps:")) {
				href = expandProjectMarkdownHref(href.substring("comps:".length), "comps");
				comps = true;
			}
			if(!backticks) {
				const parsed = LinkLocation.parse(href);
				href = parsed.href;
				position = parsed.position;
			}
			if(href.startsWith(":") && !href.startsWith("://")) {
				href = anchor.textContent + href.substring(1);
			}

			let swp = startsWithProtocol(href);
			if(!swp || href.split(":").length > 2) {
				if(href.charAt(0) === "#") {
					if(!href.endsWith(":")) {
						return;
					}
				} else {
					href = href.replace(/:([^:]*)$/, anchor.textContent + "$1");
				}
			}

			evt.preventDefault();

			if(href === "" || href === "*") {
				href = href + anchor.textContent;
			}

			const backtick_params = [
				control.app(),
				control.up("devtools/Workspace<>:root"),
				control.up("devtools/Editor<>:root"),
				(a, b, c, d) => control.vars.apply(control, [a, b, c, d].filter(a => a !== undefined)),
				window.locale,
				(a, b, c, d) => control.print.apply(control, [a, b, c, d].filter(a => a !== undefined))];

			if(backticks) {
				href = LinkLocation.restoreLiteralColons(href);
				href = e_v_a_l1(href).f.apply(control, backtick_params);
				blocks_vars = e_v_a_l1(blocks_vars).f.apply(control, backtick_params);
				comps_vars = e_v_a_l1(comps_vars).f.apply(control, backtick_params);
				const parsed = LinkLocation.parse(href);
				href = parsed.href;
				position = parsed.position;
			}
			href = LinkLocation.restoreLiteralColons(href);

			if(silent) {
				return;
			}

			if(show_console) {
				if(!evt.metaKey) {
					control	.up("devtools/Workspace<>:root")
							.qs("#left-sidebar-tabs > vcl/ui/Tab[control=console]")
							.selectVisible();
				}
				return;
			}

			if(href.startsWith("https://") ||
				href.startsWith("http://") ||
				href.startsWith("file://") ||
				href.startsWith("ftp://") ||
				href.startsWith("codex://") ||
				href.startsWith("///")
			) {
				if(href.startsWith("///")) {
					href = href.substring(3);
				}

				return window.open(href, "_blank");
			}

			const base = control.vars(["resource.uri"]);
			let tab, uri;

			if(href.endsWith("::")) {
				const hs = href.split(":"), action = control.udr(hs[0]);
				hs.pop(); hs.pop(); hs.shift();
				if(action instanceof require("vcl/Action")) {
					return action.execute(js.normalize(base, hs.join(":").replace(/::/g, anchor.textContent) || anchor.textContent), evt);
				}
				alert(js.sf("%s not found", href.split(":")[0]));
				throw new Error(js.sf("%s not found", href.split(":")[0]));
			}

			let run, ins, title = anchor.title.trim(), sourceUri, props;
			if(title.startsWith("${") && title.endsWith("}")) {
				props = e_v_a_l(title).f.apply(control, backtick_params);
			}

			if(blocks) {
				if(ins = href.charAt(0) === "*") href = href.substring(1);
				if(run = href.charAt(0) === "!") href = href.substring(1);

				if(href.startsWith("./")) {
					uri = js.normalize(base, href);
				} else if(href.startsWith("/")) {
					uri = href.substring(1);
				} else if(!swp) {
					uri = "Library/cavalion-blocks/" + href;
				} else {
					uri = href;
				}

				sourceUri = resolveUri_blocks(uri).substring("cavalion-blocks/".length) + ".js";

				if(ins && evt.altKey === false) {
					if(!run) {
						props = props || {};
						props.vars = js.mi({ "storage-uri": uri }, props.vars || {});
						if(blocks_vars) {
							if(typeof blocks_vars === "string") {
								if(blocks_vars.startsWith("{") && blocks_vars.endsWith("}")) {
									const vars = {};
									blocks_vars.substring(1, blocks_vars.length - 1).split(";").forEach(kvp => {
										kvp = kvp.split("=");
										js.set(kvp.shift(), kvp.join("="), vars);
									});
									blocks_vars = vars;
								} else {
									blocks_vars = js.str2obj(blocks_vars);
								}
							}
							control.print(H("$HOME/" + uri, { owner: control, vars: blocks_vars }));
						} else {
							control.print(H("$HOME/" + uri, { owner: control }));
						}
					} else {
						control.print(B.i(["$HOME/" + uri, props]));
					}
				} else {
					tab = editorNeeded(control, evt).execute({
						formUri: "devtools/Editor<blocks>",
						formParams: { run: run },
						formVars: blocks_vars,
						resource: { uri: sourceUri },
						position: position,
						selected: true
					});
				}

			} else if(comps) {
				run = href.charAt(0) === "!";
				if(run) href = href.substring(1);
				if(href.startsWith("./")) {
					uri = js.normalize(base, href);
				} else if(href.startsWith("/")) {
					uri = href.substring(1);
				} else if(!swp) {
					uri = "Library/vcl-comps/" + href;
				} else {
					uri = href;
				}

				tab = editorNeeded(control, evt).execute({
					formUri: "devtools/Editor<blocks>",
					formParams: { run: run },
					formVars: blocks_vars,
					resource: {
						uri: resolveUri_comps(uri).substring("vcl-comps/".length) + ".js",
						title: title === "" ? "" : title || anchor.textContent
					},
					position: position,
					selected: true
				});
			} else {
				swp = startsWithProtocol(href);

				if(!swp) {
					const _ = window.require.s.contexts._;
					if(href.startsWith("{") && href.endsWith("}")) {
						uri = _.nameToUrl(href.substring(1, href.length - 1));
						uri = uri.replace(/^\.\/lib/, "/Library/");
					} else {
						uri = href;
					}
					uri = js.normalize(base, uri.charAt(0) === "/" ? uri.substring(1) : ("./" + uri));
				} else {
					uri = href;
				}

				if(evt.altKey === true) {
					if(uri.endsWith("/")) {
						uri += ".md";
					} else if(uri.endsWith("/.md")) {
						uri = uri.replace(/\.md$/, "");
					} else if(!uri.endsWith(".smdl")) {
						uri += ".smdl";
					} else {
						uri = uri.replace(/\.smdl$/, "");
					}
				}

				tab = editorNeeded(control, evt).execute({
					resource:{
						uri: uri.endsWith("/") ? uri.substring(0, uri.length - 1) : uri,
						type: uri.endsWith("/") ? "Folder" : "File",
						title: title === "" ? "" : title || anchor.textContent
					},
					fromResourceUri: base,
					position: position,
					bringToFront: evt.shiftKey === true,
					selected: true
				});
			}
		});
	};
	const bindMarkdownEditor = (ace) => {
		if(ace.vars(["md-editor-bound"]) === true) {
			return;
		}
		ace.vars("md-editor-bound", true);

		const root = getEditorRoot(ace) || ace.up();
		const editor = ace.getEditor();
		const selection = editor.selection, session = editor.session;
		let disposed = false, loadedListener;
		const scheduler = getMarkdownRenderScheduler(ace);
		const interaction_node = editor.container;
		const note_interaction = () => noteMarkdownInteraction(ace);
		const flush_on_blur = () => scheduler.flush("blur");
		const tab = ace.up("vcl/ui/Tab");
		ace.once("destroy", () => {
			disposed = true;
			scheduler.cancel();
			if(loadedListener) tab.off(loadedListener);
			selection.off("changeCursor", sync_cursor);
			selection.off("changeSelection", sync_selection);
			session.off("changeScrollTop", sync_scroll);
			session.off("changeFold", sync_folds);
			if(interaction_node) {
				interaction_node.removeEventListener("keydown", note_interaction);
				interaction_node.removeEventListener("keyup", note_interaction);
				interaction_node.removeEventListener("compositionupdate", note_interaction);
			}
			editor.off("blur", flush_on_blur);
		});
		const bindResize = root && root.vars(["bindTopLevelNavigationResize"]);
		const sync_cursor = () => {
			noteMarkdownInteraction(ace);
			syncTopLevelNavActiveToSourcePosition(ace);
			schedulePreviewSync(ace, editor.getCursorPosition().row);
		};
		const sync_selection = () => {
			noteMarkdownInteraction(ace);
			schedulePreviewSync(ace, editor.getCursorPosition().row);
		};
		const sync_scroll = () => {
			syncTopLevelNavToSourcePositionThrottled(ace, 50);
			schedulePreviewSync(ace,
				editor.getFirstVisibleRow ? editor.getFirstVisibleRow() : editor.renderer.getFirstVisibleRow());
		};
		const sync_folds = () => syncPreviewToEditorFolds(ace);

		editor.selection.on("changeCursor", sync_cursor);
		editor.selection.on("changeSelection", sync_selection);
		editor.session.on("changeScrollTop", sync_scroll);
		editor.session.on("changeFold", sync_folds);
		if(interaction_node) {
			interaction_node.addEventListener("keydown", note_interaction);
			interaction_node.addEventListener("keyup", note_interaction);
			interaction_node.addEventListener("compositionupdate", note_interaction);
		}
		editor.on("blur", flush_on_blur);
		bindResize && bindResize(root, "md-toplevel-nav-window-resize",
			() => scheduleTopLevelNavigationResize(ace), 120);

		if(root) {
			loadedListener = tab && tab.once("resource-loaded", () => {
				loadedListener = null;
				if(disposed) return;
				ace.setTimeout("md-fold-sync-ready", () => {
					markMarkdownFoldSyncReady(ace);
				}, 150);
			});
			if(!tab) {
				ace.setTimeout("md-fold-sync-ready", () => {
					markMarkdownFoldSyncReady(ace);
				}, 150);
			}

			root.readStorage && root.readStorage("dialect", (dialect) => {
				if(disposed) return;
				if(dialect !== undefined && root.vars(["dialect"]) === undefined) {
					root.vars("dialect", dialect);
					root.vars("dialect-persisted", dialect);
					ace.setTimeout("render", () => renderMarkdown(ace), 0);
				}
			});
			root.readStorage && root.readStorage(SECTION_STATE_STORAGE_KEY, (state) => {
				if(disposed) return;
				if(state && typeof state === "object") {
					root.vars("md-section-state", state);
					ace.setTimeout("render", () => renderMarkdown(ace), 0);
				}
			});
			root.readStorage && root.readStorage(CHECKBOX_STATE_STORAGE_KEY, (state) => {
				if(disposed) return;
				if(state && typeof state === "object") {
					root.vars("md-checkbox-state", state);
					ace.setTimeout("render", () => renderMarkdown(ace), 0);
				}
			});
			root.readStorage && root.readStorage(PREVIEW_FOLLOW_STORAGE_KEY, (state) => {
				if(disposed) return;
				if(typeof state === "boolean") {
					root.vars("md-preview-follow-source", state);
				}
			});
			root.readStorage && root.readStorage(PREVIEW_SCROLL_STORAGE_KEY, (state) => {
				if(disposed) return;
				if(state && typeof state === "object") {
					root.vars("md-preview-scroll-state", {
						left: state.left || 0,
						top: state.top || 0
					});
					ace.setTimeout("restore-preview-scroll", () =>
						restorePreviewScrollState(ace, getOutputControl(ace).nodeNeeded()), 0);
				}
			});
		}
	};
	const renderDocumentMarkdown = (root, opts) => {
		opts = opts || {};
		const ace = opts.ace || root.qs("#ace");
		const preview = opts.preview || root.qs("#preview");
		const source = opts.value !== undefined ? opts.value : ace.getValue();

		root.vars("document.facet", "md");
		bindMarkdownEditor(ace);
		root.vars("md-source-visible", ace.isVisible instanceof Function ? ace.isVisible() : root.qs("#toggle-source").getState() === true);
		preview.addClass && preview.addClass("markdown");
		return renderMarkdown(ace, {
			value: source,
			root: root,
			output: preview,
			resource: root.vars(["resource"]),
			dialect: root.vars(["dialect"]) || "marked"
		});
	};
	const parseMarkdownDocument = (text, doc, opts) => {
		opts = opts || {};
		const headings = buildMarkdownHeadingIndex(text);
		return {
			type: "md",
			profile: "bxv/profiles/markdown",
			root: {
				Document: [{
					name: doc && (doc.naam || doc.id),
					lines: String(text || "").split("\n").length,
					headings: headings.length
				}],
				Headings: headings
			},
			view: {
				Headings: headings
			},
			capabilities: {
				markdown: true,
				view: true
			}
		};
	};

	const Css_content = {
		"": "margin-left:auto;margin-right:auto;",
		":not(.shrink)": "width:795px;",
		"background-color": "rgba(240,240,240,1)",
		"border-left": "1px solid silver",
		"border-right": "1px solid silver",
		"font-family": "times,-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif,'Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol'",
		"font-size": "12pt",
		"table": "width:100%;table-layout:fixed;border-collapse:collapse;border-spacing:0;margin:1.25em 0;",
		"thead": "border-bottom:2px solid rgba(0,0,0,.12);",
		"tbody tr": "border-bottom:1px solid rgba(0,0,0,.08);",
		"tbody tr:last-child": "border-bottom:0;",
		"th": "padding:.6em 0;text-align:left;font-weight:600;vertical-align:top;",
		"td": "padding:1em 0;vertical-align:top;line-height:1.55;overflow-wrap:anywhere;",
		"th + th, td + td": "padding-left:1.5em;",
		"td code": "white-space:normal;overflow-wrap:anywhere;",
		"img": {
			"": "width:75%; transition: width 1s ease 0s, box-shadow 1s ease 0s;",
			":not(.inline)": "display:block; margin:auto;",
			"&:hover": "width: 100%; box-shadow: rgb(0 0 0 / 40%) 0px 1px 2px 0px;"
		},
		padding: "10px 50px",
		"a": "text-decoration:underline;color:blue;",
		"a[data-href-hint]": "position:relative;",
		"a[data-href-hint]:hover::after": "content:attr(data-href-hint);position:absolute;left:0;bottom:calc(100% + 6px);z-index:20;display:block;max-width:36em;padding:4px 7px;border-radius:4px;background:rgba(32,32,32,.92);color:white;font-size:9pt;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;pointer-events:none;box-shadow:0 4px 14px rgba(0,0,0,.2);",
		".md-heading-anchor": "display:none;",
		".md-section > .md-section-heading": "position:relative;cursor:pointer;padding-left:18px;margin-left:-18px;",
		".md-section > .md-section-body": "position:relative;",
		".md-section.cursor-active > .md-section-heading": "background:linear-gradient(90deg, rgba(56,121,217,.16), rgba(56,121,217,.05));border-radius:4px;color:rgb(19,71,144);",
		".md-section.cursor-active > .md-section-body": "background:linear-gradient(180deg, rgba(56,121,217,.05), rgba(56,121,217,.015));",
		".md-section > .md-section-heading::before": "content:'';position:absolute;left:2px;top:50%;width:7px;height:7px;border-right:2px solid rgba(60,60,60,.75);border-bottom:2px solid rgba(60,60,60,.75);transform:translateY(-65%) rotate(-45deg);opacity:0;transition:opacity 120ms ease, transform 120ms ease;",
		".md-section > .md-section-heading:hover::before": "opacity:.85;",
		".md-section:not(.collapsed) > .md-section-heading::before": "transform:translateY(-70%) rotate(45deg);",
		".md-section.collapsed > .md-section-heading::before": "opacity:.2;",
		".md-section.collapsed > .md-section-heading": "color:rgba(20,20,20,.78);",
		".md-section.collapsed > .md-section-body": "display:none;",
		"li.md-folder": "position:relative;cursor:default;",
		"li.md-folder > .md-folder-toggle": "appearance:none;-webkit-appearance:none;position:absolute;left:-17px;top:.25em;width:14px;height:14px;margin:0;padding:0;border:0;background:transparent;cursor:pointer;",
		"li.md-folder > .md-folder-toggle::before": "content:'';position:absolute;left:3px;top:3px;width:6px;height:6px;border-right:2px solid rgba(60,60,60,.75);border-bottom:2px solid rgba(60,60,60,.75);transform:rotate(45deg);opacity:.05;transition:opacity 120ms ease,transform 120ms ease;",
		"li.md-folder:hover > .md-folder-toggle::before,li.md-folder > .md-folder-toggle:hover::before,li.md-folder > .md-folder-toggle:focus-visible::before": "opacity:.85;",
		"li.md-folder.collapsed > .md-folder-toggle::before": "transform:translateY(-1px) rotate(-45deg);",
		"li.md-folder.collapsed > ul,li.md-folder.collapsed > ol": "display:none;",
		".md-cursor-band": "position:absolute;height:12px;margin-top:-6px;border-top:1px solid rgba(56,121,217,.35);border-bottom:1px solid rgba(56,121,217,.18);background:linear-gradient(180deg, rgba(56,121,217,.10), rgba(56,121,217,.03));border-radius:999px;pointer-events:none;z-index:6;box-shadow:0 0 0 1px rgba(56,121,217,.04) inset;",
		".md-selection-layer": "position:absolute;inset:0;pointer-events:none;z-index:4;",
		".md-selection-band": "position:absolute;border-radius:10px;background:linear-gradient(180deg, rgba(56,121,217,.12), rgba(56,121,217,.05));box-shadow:0 0 0 1px rgba(56,121,217,.08) inset;",
		"code": "border-radius:7px;font-size: 7.5pt;background-color:white;padding:4px;vertical-align:middle;",
		"&.small-images": {
			"img:not(:hover)": "width: 10%; height: 10%;",
			"img:not(.inline)": "margin: 8px; margin-left: 24px;"
		},
		"&.hide-images": {
			"img": "display: none;"
		}
	};
	const Css = {
		"a > img": "border: 2px solid rgb(56, 121, 217);"
	};
	const Handlers = {
		onResize() {
			const cs = this.getComputedStyle();
			const output = this.ud("#output") || this.ud("#preview");
			output && output.syncClass("shrink", parseInt(cs.width, 10) < 900);
			scheduleTopLevelNavigationResize(this);
		},
		"#output onDblClick": function(evt) {
			if(evt.metaKey === true) {
				this._node.qsa("img").forEach(function(img) {
					const r = window.devicePixelRatio > 1 ? 2 : 2;
					if(img.naturalWidth && img.src.indexOf("?2x") !== -1) {
						img.style.width = img.naturalWidth / r + "px";
					}
				});
			}
		}
	};

	const api = {
		CONSOLE_ALLOW_ALT_META_CLICK_VAR,
		PREVIEW_FOLLOW_STORAGE_KEY,
		PREVIEW_SCROLL_STORAGE_KEY,
		CHECKBOX_STATE_STORAGE_KEY,
		SECTION_STATE_STORAGE_KEY,
		RENDER_QUIET_PERIOD,
		RENDER_MAX_DELAY,
		Css,
		Css_content,
		Handlers,
		encodeMdLinks,
		escapeMarkdownLinkDescriptions,
		buildMarkdownHeadingIndex,
		buildMarkdownOutlineNodes,
		findHeadingIndexForRow,
		createMarkdownOutlineProxy,
		applyEditorFoldStateToPreview,
		markMarkdownFoldSyncReady,
		capturePreviewScrollState,
		restorePreviewScrollState,
		persistPreviewScrollState,
		clearState,
		setSectionCollapsed,
		setSectionsCollapsed,
		setFolderCollapsed,
		setFoldersCollapsed,
		expandSectionsUpToLevel,
		syncPreviewToEditorRow,
		schedulePreviewSync,
		syncTopLevelNavActiveToSourcePosition,
		syncTopLevelNavActiveToPreviewScroll,
		syncTopLevelNavToSourcePositionThrottled,
		syncPreviewToEditorFolds,
		snapshotEditorFoldState,
		updateTopLevelNavigationPosition,
		resolveLinkHintHref,
		decorateLinks,
		decorateSections,
		decorateFolders,
		decorateCheckboxes,
		render: renderMarkdown,
		renderMarkdown,
		scheduleMarkdownRender,
		noteMarkdownInteraction,
		flushMarkdownRender,
		renderDocumentMarkdown,
		parse: parseMarkdownDocument,
		bindMarkdownEditor,
		installDocumentClickHandler,
		update_shrink,
		isUpperCase
	};

	installDocumentClickHandler();
	window.cavalionMarkdown = api;
	return api;
});
