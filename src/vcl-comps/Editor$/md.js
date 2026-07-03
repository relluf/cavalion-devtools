"use on, marked, markdown, blocks/Factory, util/HtmlElement";

/*-

FR: choose rendering-implementation (2025-04-01)

### 2023/09/16

- Introduced an evaluation mechanism with a return value.

### 2023/09/13

- Added the ability to instantiate block components using Markdown anchors, allowing for specific property value transfers.
- Implemented support for embedding block components within a Hover<> instance.
- Enhanced interaction with .md and .smdl files and folders, introducing an Alt+Tap toggle behavior.

### 2023/09/12

- Expanded the features of cavalion-blocks, enabling the instantiation of Hover<> with specific block components using the <<[:]>> syntax.

### 2023/09/11

- Resolved the silent tap issue.
- Introduced a local save feature for the resource currently being edited, specifically for #ace.getValue().

### 2023/09/09

- Prioritized using component names over class names.
- Enabled the use of :: in Markdown-action links.
- Refactored the hotkey functionality for resource-focus within the navigator.
- Updated the primary workspace to display its tab in a unique manner.

### 2023/09/07

- Introduced a silent option for linking evaluable links in Markdown.
- Allowed the use of :: (replacing :) in #action::-links, which will be replaced with anchor content.
- Optimized the default workspaces for BXV.
- Automated the title generation in devtools/Main based on vcl/Application#0.title.
- Refactored title-related classes.

### 2023/09/06

- Modified blocks and cavalion-blocks workspaces to support an alternative workspace UI.
- Fixed a bug preventing certain characters from being filtered.
- Introduced a setting to keep Markdown sources hidden by default.
- Added the devtools/cavalion-devtools.js file.
- Committed the initial version of Main<bxv>.

### 2023/06/07

- No significant changes, only file attributes were modified.

### 2023/03/26

- Resolved issues with linking to ://.
- Fixed the startsWithProtocol function.
- Enhanced the UI with additional padding.

### 2023/01/16

- Updated the width settings for the non-shrink mode in devtools/Editor<md>.

### 2023/11/15

- Fixed a bug causing null, 0, and false to be treated as undefined.

### 2023/10/30

- Improved the detection mechanism for automatically displaying the workspace console.
  
### 2023/10/30

- Reference: #CVLN-20210102-2.

### 2023/09/23

- Added a shortcut, Ctrl+S, for #editor-switch-favorite.

### 2023/07/29

- Updated the CSS styling for inline images.

### 2023/07/28

- Enhanced image styling and classifications within Markdown code.
- Introduced `${p(:)}`, expanding the possibilities with links and backticks in Markdown.
- Made variables constant for better code stability.

### 2023/06/24

- Removed unnecessary log and debug prints.


### 2022/10/29

* Improves console.print-click, while Cmd no console.show
* Betters exception handling
* Adds a shortcut for ${p(:)} ${p(:)} ${p(:)}
	=> [expression](`$!`)

### 2022/07/26

* Documenting backticks behaviour, for images and for links
* Enhancing backticks behaviour for links so that "stuff and printed in console"

### 2022/04/24

* Linking vcl-comps: [](())
* Linking cavalion-blocks: []([])
* Running cavalion-blocks: []([!]{vars})
* Use backticks for context-sensitivity: []([])

### 2022/02/28

* Finetuning "restore-scroll"-feature

### 2021/01/06

* Adding support for opening Tools (Library/cavalion-blocks/tools/...)
	* [devtools/Alphaview](tools://)
	* [devtools/Alphaview](://)
	* [devtools/Alphaview](:)
	* [devtools/Alphaview](:./:)

### 2021/01/04

* Updating syntax
* Adding support for clicking anchors (`#CVLN-20210102-2`)
*/

const resolveUri_blocks = require("blocks/Factory").resolveUri;
const on = require("on");
const marked = require("marked").marked;
const markdown = require("markdown");
const Component = require("vcl/Component");
const HE = require("util/HtmlElement");
const resolveUri_comps = require("vcl/Factory").resolveUri;
const CONSOLE_ALLOW_ALT_META_CLICK_VAR = "console/allow-alt-meta-click";
const PREVIEW_FOLLOW_STORAGE_KEY = "md-preview-follow-source";
const PREVIEW_SCROLL_STORAGE_KEY = "md-preview-scroll-state";
const CHECKBOX_STATE_STORAGE_KEY = "md-checkbox-state";

// CVLN-20221106-1, CVLN-20220418-1
js.dt = (a) => a === undefined ? new Date() : new Date(a);

function encodeMdLinks(md) {
	return md
		// inline links/images: ...](url "title")
		.replace(/\]\(([^)\s]+)(\s+"[^"]*")?\)/g, (m, url, title = "") => {
			return `](${encodeURI(url)}${title})`;
		})
		// reference-style: [id]: url "title"
		.replace(/^\[([^\]]+)\]:\s*([^\s]+)(\s+"[^"]*")?\s*$/gm, (m, id, url, title = "") => {
			return `[${id}]: ${encodeURI(url)}${title}`;
		});
}
function isEscapedAt(text, index) {
	var count = 0;
	for(var i = index - 1; i >= 0 && text.charAt(i) === "\\"; --i) {
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
// function encodeMdLinks(md) {
// 	return md
// 		.replace(/\]\((\S+)(\s+"[^"]*")?\)/g, (m, url, title = "") => {
// 			return `](${encodeURI(url)}${title})`;
// 		})
// 		.replace(/^\[([^\]]+)\]:\s*(\S+)(\s+"[^"]*")?$/gm, (m, id, url, title = "") => {
// 			return `[${id}]: ${encodeURI(url)}${title}`;
// 		});
// }
const SECTION_STATE_STORAGE_KEY = "md-section-state";
const getEditorRoot = (control) => {
	if(!control) return null;
	if(control.hasVar && control.hasVar("topLevelNavigation")) {
		return control;
	}
	return typeof control.up === "function" ? control.up() : null;
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
	if(root) {
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
	if(root) {
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
	if(root) {
		root.writeStorage(CHECKBOX_STATE_STORAGE_KEY, state);
	}
};
const normalizeText = (text) => (text || "").replace(/\s+/g, " ").trim();
const headingLevel = (node) => node && node.nodeType === 1 && /^H[1-6]$/.test(node.tagName) ? parseInt(node.tagName.substring(1), 10) : 0;
const slugifyHeading = (text) => normalizeText(text)
	.toLowerCase()
	.replace(/[^\w\s-]/g, "")
	.replace(/\s+/g, "-") || "section";
const renderInlineMarkdownToText = (text) => {
	var div = document.createElement("DIV");
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

	var parent = stack[stack.length - 1];
	var count_key = js.sf("%s|%d|%s", parent.key, level, text);
	var count = counts[count_key] = (counts[count_key] || 0) + 1;
	var key = js.sf("%s/%d:%s#%d", parent.key, level, text, count);

	stack.push({ level: level, key: key });
	return key;
};
const buildMarkdownHeadingIndex = (value) => {
	var lines = (value || "").split("\n");
	var headings = [];
	var counts = Object.create(null);
	var stack = [{ level: 0, key: "" }];
	var fenced;

	for(var i = 0; i < lines.length; ++i) {
		var line = lines[i];
		var fence = line.match(/^\s*([`~]{3,})/);
		if(fence) {
			var marker = fence[1];
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

		var atx = line.match(/^\s{0,3}(#{1,6})[ \t]+(.+?)\s*#*\s*$/);
		if(atx) {
			var level = atx[1].length;
			var text = renderInlineMarkdownToText(atx[2]);
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

		var next = lines[i + 1];
		var setext = next && next.match(/^\s{0,3}(=+|-+)\s*$/);
		if(setext && line.trim() !== "") {
			var text = renderInlineMarkdownToText(line.trim());
			var level = setext[1].charAt(0) === "=" ? 1 : 2;
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
	var roots = [];
	var stack = [];

	headings.forEach((heading, index) => {
		var next = headings[index + 1];
		var node = {
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
	var active = -1;
	for(var i = 0; i < headings.length; ++i) {
		if(headings[i].row > row) {
			break;
		}
		active = i;
	}
	return active;
};
const getAceEditor = (control) => {
	var root = getEditorRoot(control);
	var ace = root && root.qsa && root.qsa("#ace")[0];
	return ace && ace.getEditor ? ace.getEditor() : null;
};
const getOutputControl = (control) => {
	if(control && control.ud) {
		var output = control.ud("#output");
		if(output) {
			return output;
		}
	}

	var root = getEditorRoot(control);
	return root && root.qsa ? root.qsa("#output")[0] : null;
};
const getPreviewFollowEnabled = (control) => {
	var root = getEditorRoot(control);
	return root ? root.vars(["md-preview-follow-source"]) !== false : true;
};
const isSourceVisible = (control) => {
	var root = getEditorRoot(control);
	return root ? root.vars(["md-source-visible"]) !== false : true;
};
const buildEditorFoldState = (control) => {
	var root = getEditorRoot(control);
	var editor = getAceEditor(control);
	var headings = root && root.vars(["md-heading-index"]);
	var state = {};

	(headings || []).forEach(heading => state[heading.key] = false);
	if(!editor || !headings || headings.length === 0) {
		return state;
	}

	editor.session.getAllFolds().forEach(fold => {
		var index = findHeadingIndexForRow(headings, fold.start.row);
		if(index !== -1) {
			state[headings[index].key] = true;
		}
	});

	return state;
};
const snapshotEditorFoldState = (control) => {
	var root = getEditorRoot(control);
	root && root.vars("md-editor-fold-state", buildEditorFoldState(control));
};
const createMarkdownOutlineProxy = (control) => {
	var root = getEditorRoot(control) || control;
	var ace = root && root.ud ? root.ud("#ace") : null;
	var editor = ace && ace.getEditor ? ace.getEditor() : null;
	var resource = root && root.vars ? root.vars(["resource"]) : null;
	var cached_source = null;
	var cached_outline = null;
	var getOutline = () => {
		var source = ace ? ace.getValue() : "";
		if(cached_outline && source === cached_source) {
			return cached_outline;
		}

		var headings = buildMarkdownHeadingIndex(source);
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
			var headings = getOutline().headings;
			var index = findHeadingIndexForRow(headings, editor.getCursorPosition().row);
			return index === -1 ? null : headings[index].key;
		},
		navigate(target) {
			if(!editor) return;

			var key = typeof target === "string" ? target : js.get("key", target);
			var heading = getOutline().headings.find(item => item.key === key);
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
	var band = preview.querySelector(".md-cursor-band");
	if(!band) {
		band = document.createElement("DIV");
		band.className = "md-cursor-band";
		preview.appendChild(band);
	}
	return band;
};
const ensurePreviewSelectionLayer = (preview) => {
	var layer = preview.querySelector(".md-selection-layer");
	if(!layer) {
		layer = document.createElement("DIV");
		layer.className = "md-selection-layer";
		preview.appendChild(layer);
	}
	return layer;
};
const clearPreviewCursorState = (control, preview) => {
	if(!preview) return;

	var output = getOutputControl(control);
	var active = output && output.vars(["md-active-section"]);
	if(active) {
		active.classList.remove("cursor-active");
		output.vars("md-active-section", null);
	}
	syncTopLevelNavActive(control, null);

	var band = preview.querySelector(".md-cursor-band");
	if(band) {
		band.style.display = "none";
	}

	var layer = preview.querySelector(".md-selection-layer");
	if(layer) {
		layer.innerHTML = "";
		layer.style.display = "none";
	}
};
const getPreviewSectionByKey = (control, key) => {
	var output = getOutputControl(control);
	var preview = output && output.nodeNeeded ? output.nodeNeeded() : null;
	var map = output && output.vars(["md-section-map"]);

	if(map && map[key]) {
		return map[key];
	}
	if(!preview) return null;

	return Array.from(preview.querySelectorAll(".md-section"))
		.find(section => section.getAttribute("data-section-key") === key) || null;
};
const keepPreviewBandInView = (preview, band, block = "center") => {
	if(!preview || !band) return;

	var band_top = band.offsetTop;
	var band_bottom = band_top + band.offsetHeight;
	var window_top = preview.scrollTop + (preview.clientHeight * 0.18);
	var window_bottom = preview.scrollTop + (preview.clientHeight * 0.62);

	if(band_top < window_top || band_bottom > window_bottom) {
		var target;
		if(block === "nearest") {
			target = band_top - 24;
		} else {
			target = band_top - Math.round(preview.clientHeight * 0.35);
		}
		preview.scrollTop = Math.max(0, target);
	}
};
const placePreviewCursorBand = (preview, band, target, top) => {
	var preview_rect = preview.getBoundingClientRect();
	var target_rect = target.getBoundingClientRect();
	var inset = 10;
	var left = Math.max(0, (target_rect.left - preview_rect.left) + inset);
	var width = Math.max(48, target_rect.width - (inset * 2));

	band.style.left = js.sf("%dpx", Math.round(left));
	band.style.width = js.sf("%dpx", Math.round(width));
	band.style.top = js.sf("%dpx", Math.max(0, top));
	band.style.display = "";
};
const placePreviewSelectionBand = (preview, layer, target, top, height) => {
	var preview_rect = preview.getBoundingClientRect();
	var target_rect = target.getBoundingClientRect();
	var inset = 10;
	var band = document.createElement("DIV");

	band.className = "md-selection-band";
	band.style.left = js.sf("%dpx", Math.round(Math.max(0, (target_rect.left - preview_rect.left) + inset)));
	band.style.width = js.sf("%dpx", Math.round(Math.max(48, target_rect.width - (inset * 2))));
	band.style.top = js.sf("%dpx", Math.max(0, top));
	band.style.height = js.sf("%dpx", Math.max(10, height));
	layer.appendChild(band);
	layer.style.display = "";
};
const renderPreviewSelection = (control, preview, editor, headings) => {
	var layer = ensurePreviewSelectionLayer(preview);
	var range = editor.selection.getRange();
	var max_bands = 64;

	if(!range || (range.isEmpty && range.isEmpty())) {
		layer.style.display = "none";
		return;
	}

	var start_row = Math.min(range.start.row, range.end.row);
	var end_row = Math.max(range.start.row, range.end.row);
	var start_index = findHeadingIndexForRow(headings, start_row);
	var end_index = findHeadingIndexForRow(headings, end_row);

	if(start_index === -1 || end_index === -1) {
		layer.style.display = "none";
		return;
	}

	if(end_index - start_index > max_bands) {
		end_index = Math.min(headings.length - 1, start_index + max_bands);
	}

	for(var i = start_index; i <= end_index; ++i) {
		var heading = headings[i];
		var next = headings[i + 1];
		var section = getPreviewSectionByKey(control, heading.key);
		var target = section && (getVisibleSectionElement(section) || section);
		if(!section || target !== section) {
			continue;
		}

		var section_start_row = heading.row;
		var section_end_row = next ? next.row : Math.max(editor.session.getLength() - 1, section_start_row + 1);
		var span = Math.max(1, section_end_row - section_start_row);
		var from_row = i === start_index ? start_row : section_start_row;
		var to_row = i === end_index ? end_row + 1 : section_end_row;
		var from_ratio = Math.max(0, Math.min(1, (from_row - section_start_row) / span));
		var to_ratio = Math.max(from_ratio, Math.min(1, (to_row - section_start_row) / span));
		var top = section.offsetTop + ((section.offsetHeight || 0) * from_ratio);
		var bottom = section.offsetTop + ((section.offsetHeight || 0) * to_ratio);

		placePreviewSelectionBand(preview, layer, section, top, bottom - top);
	}
};
const getVisibleSectionElement = (section) => {
	while(section && section.classList && section.classList.contains("md-section")) {
		var parent = section.parentNode;
		var parent_section = null;
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
const syncPreviewToEditorRow = (control, row) => {
	var root = getEditorRoot(control);
	var output = getOutputControl(control);
	var preview = output && output.nodeNeeded ? output.nodeNeeded() : null;
	if(getPreviewFollowEnabled(control) !== true || isSourceVisible(control) !== true) {
		clearPreviewCursorState(control, preview);
		syncTopLevelNavActiveToPreviewScroll(control, preview);
		return;
	}

	var editor = getAceEditor(control);
	var headings = root && root.vars(["md-heading-index"]);
	clearPreviewCursorState(control, preview);
	if(!preview || !editor || !headings || headings.length === 0) {
		if(preview && row <= 0) {
			preview.scrollTop = 0;
		}
		return;
	}

	var index = findHeadingIndexForRow(headings, row);
	if(index === -1) {
		preview.scrollTop = 0;
		return;
	}

	var current = headings[index];
	var next = headings[index + 1];
	var section = getPreviewSectionByKey(control, current.key);
	if(!section) {
		return;
	}

	var target = getVisibleSectionElement(section) || section;
	if(target.classList) {
		target.classList.add("cursor-active");
		output && output.vars("md-active-section", target);
		syncTopLevelNavActiveToSourcePosition(control);
	}
	renderPreviewSelection(control, preview, editor, headings);
	var band = ensurePreviewCursorBand(preview);
	var band_top;
	if(target !== section) {
		var target_heading = target.firstElementChild;
		band_top = target.offsetTop + (target_heading ? target_heading.offsetHeight - 3 : Math.round(target.offsetHeight / 2));
		placePreviewCursorBand(preview, band, target, band_top);
		keepPreviewBandInView(preview, band, "nearest");
		return;
	}

	var section_end_row = next ? next.row : Math.max(editor.session.getLength() - 1, current.row + 1);
	var span = Math.max(1, section_end_row - current.row);
	var ratio = Math.max(0, Math.min(1, (row - current.row) / span));
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
	var root = getEditorRoot(control);
	var throttle = root && root.vars && root.vars(["runTopLevelNavigationThrottled"]);

	if(throttle) {
		throttle(root, "md-toplevel-nav-source-sync",
			() => syncTopLevelNavActiveToSourcePosition(control), interval || 50);
	} else {
		syncTopLevelNavActiveToSourcePosition(control);
	}
};
const syncPreviewToEditorFolds = (control) => {
	var root = getEditorRoot(control);
	var output = getOutputControl(control);
	var preview = output && output.nodeNeeded ? output.nodeNeeded() : null;
	var previous = root && root.vars(["md-editor-fold-state"]);
	var current = buildEditorFoldState(control);
	var changed = false;

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
		var before = previous[key];
		var after = current[key];
		if(before === after) {
			return;
		}

		var section = getPreviewSectionByKey(control, key);
		if(!section) {
			return;
		}

		var preview_collapsed = section.classList.contains("collapsed");
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

	var heading = section.firstElementChild;
	if(heading) {
		heading.setAttribute("aria-expanded", collapsed ? "false" : "true");
	}

	var key = section.getAttribute("data-section-key");
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
const expandSectionsUpToLevel = (control, sections, level) => {
	level = parseInt(level, 10);
	sections.forEach(section => {
		var section_level = parseInt(section.getAttribute("data-section-level"), 10);
		if(section_level <= level) {
			setSectionCollapsed(control, section, false, false);
		}
	});
	persistSectionState(control);
};
const getTopLevelOutlineNodes = (control) => {
	var root = getEditorRoot(control);
	var headings = root && root.vars(["md-heading-index"]);
	var ace = root && root.ud ? root.ud("#ace") : null;
	var source = ace && ace.getValue ? ace.getValue() : "";

	if(!headings || headings.length === 0) {
		headings = buildMarkdownHeadingIndex(source);
	}

	return buildMarkdownOutlineNodes(headings || [], source.split("\n").length);
};
const getSectionTitleText = (section) => {
	if(headingLevel(section) > 0) {
		return normalizeText(section.textContent) || "Section";
	}

	var heading = section && section.firstElementChild;
	return normalizeText(heading ? heading.textContent : "") || "Section";
};
const getTopLevelSectionForSection = (section) => {
	var current = section;
	var top = section;

	while(current && current.classList && current.classList.contains("md-section")) {
		top = current;
		var parent = current.parentNode;
		current = parent && parent.classList && parent.classList.contains("md-section-body") ?
			parent.parentNode : null;
	}

	return top;
};
const getTopLevelNavigation = (control) => {
	var root = getEditorRoot(control);
	return root && root.vars ? root.vars(["topLevelNavigation"]) : null;
};
const syncTopLevelNavActive = (control, active_sections, caret_sections) => {
	var output = getOutputControl(control);
	var preview = output && output.nodeNeeded ? output.nodeNeeded() : null;
	var nav = preview && preview.querySelector(".md-toplevel-nav");
	var active_keys = Object.create(null);
	var caret_keys = Object.create(null);
	var helper = getTopLevelNavigation(control);
	var collect = (sections, target) => {
		(sections ? (Array.isArray(sections) ? sections : [sections]) : [])
			.forEach(section => {
				var top_section = getTopLevelSectionForSection(section);
				var key = top_section && top_section.getAttribute &&
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
	var current = section;

	while(current && current.classList) {
		if(current.classList.contains("md-section")) {
			setSectionCollapsed(control, current, false, false);
		}

		var parent = current.parentNode;
		current = parent && parent.classList && parent.classList.contains("md-section-body") ?
			parent.parentNode : null;
	}

	persistSectionState(control);
};
const navigateToTopLevelSection = (control, key) => {
	var section = getPreviewSectionByKey(control, key);
	var output = getOutputControl(control);
	var preview = output && output.nodeNeeded ? output.nodeNeeded() : null;

	if(!section && preview) {
		section = Array.from(preview.querySelectorAll("[data-md-nav-key]"))
			.find(node => node.getAttribute("data-md-nav-key") === key);
	}
	if(!section) return;

	expandSectionForNavigation(control, section);
	section.scrollIntoView({ block: "start", behavior: "smooth" });
	navigateSourceToHeading(control, key);
	section.classList.add("cursor-active");
	if(output) {
		var previous = output.vars(["md-active-section"]);
		if(previous && previous !== section) {
			previous.classList.remove("cursor-active");
		}
		output.vars("md-active-section", section);
	}
	syncTopLevelNavActive(control, section, isSourceVisible(control) ? section : null);
};
const buildTopLevelSectionItems = (preview, control) => {
	var outline_nodes = getTopLevelOutlineNodes(control);
	var outline_by_key = {};

	outline_nodes.forEach(node => outline_by_key[node.key] = node);

	var sections = Array.from(preview.querySelectorAll(".md-section"))
		.filter(section => section.closest(".md-section-body") === null)
		.map(section => {
			var key = section.getAttribute("data-section-key");
			var outline = outline_by_key[key];
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

	var map = control.vars(["md-section-map"]) || {};
	sections = outline_nodes.map(node => ({
		key: node.key,
		section: map[node.key],
		row: node.row,
		endRow: node.endRow
	})).filter(item => item.key && item.section);

	if(sections.length > 0) {
		return sections;
	}

	return Array.from(preview.querySelectorAll("h1,h2,h3,h4,h5,h6"))
		.filter(heading => heading.closest(".md-toplevel-nav") === null)
		.map((heading, index) => {
			var key = js.sf("heading:%d", index);
			heading.setAttribute("data-md-nav-key", key);
			heading.setAttribute("data-section-key", key);
			return {
				key: key,
				section: heading
			};
		});
};
const getTopLevelSectionItems = (preview, control) => {
	var output = getOutputControl(control);
	var items = output && output.vars(["md-toplevel-nav-items"]);

	return items || buildTopLevelSectionItems(preview, control);
};
const getTopLevelSectionsForPreviewScroll = (preview, control) => {
	var items = getTopLevelSectionItems(preview, control);
	var top = preview.scrollTop;
	var bottom = top + preview.clientHeight;
	var active;

	if(items.length === 0) {
		return [];
	}

	active = items.filter(item => {
		var section = item.section;
		var section_top = section.offsetTop;
		var section_bottom = section_top + Math.max(section.offsetHeight, 1);
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
	var root = getEditorRoot(control);
	var editor = getAceEditor(control);
	var headings = root && root.vars(["md-heading-index"]);
	var output = getOutputControl(control);
	var preview = output && output.nodeNeeded ? output.nodeNeeded() : null;
	var items = preview ? getTopLevelSectionItems(preview, control) : [];
	var first_row;
	var last_row;
	var active;
	var index;
	var cursor_row;
	var caret_section;

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
const navigateSourceToHeading = (control, key) => {
	var root = getEditorRoot(control);
	var editor = getAceEditor(control);
	var headings = root && root.vars(["md-heading-index"]);
	var heading = headings && headings.find(item => item.key === key);
	var ace = root && root.ud ? root.ud("#ace") : null;

	if(!editor || !heading || isSourceVisible(control) !== true) {
		return;
	}

	editor.gotoLine(heading.row + 1, 0, true);
	ace && ace.setFocus && ace.setFocus();
};
const decorateTopLevelNavigation = (preview, control) => {
	var output = getOutputControl(control);
	var helper = getTopLevelNavigation(control);
	var nodes = buildTopLevelSectionItems(preview, control);
	var total_row = nodes.reduce((value, node) =>
		Math.max(value, typeof node.endRow === "number" ? node.endRow :
			typeof node.row === "number" ? node.row : 0), 0) || 1;
	var nav;

	nodes.forEach(node => {
		if(typeof node.row === "number") {
			node.positionRatio = node.row / total_row;
		}
	});
	output && output.vars("md-toplevel-nav-items", nodes);
	if(!helper || nodes.length === 0) {
		var previous = preview.querySelector(".md-toplevel-nav");
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
		side: isSourceVisible(control) ? "right" : undefined,
		minGap: 6,
		getKey: node => node.key,
		getLabel: node => getSectionTitleText(node.section),
		onNavigate: key => navigateToTopLevelSection(control, key)
	});
	output && output.vars("md-toplevel-nav-elements", nav && nav._topLevelNav ? nav._topLevelNav.elements : []);
	syncTopLevelNavActiveToPreviewScroll(control, preview);
};
const updateTopLevelNavigationPosition = (control) => {
	var output = getOutputControl(control);
	var preview = output && output.nodeNeeded ? output.nodeNeeded() : null;

	if(preview) {
		decorateTopLevelNavigation(preview, control);
	}
};
const resolveLinkHintHref = (anchor, control) => {
	var href = window.unescape(js.get("attributes.href.value", anchor) || "");
    var blocks, blocks_vars, comps, comps_vars;
    var backticks = false;
    var swp, uri;
	var base = control.vars(["resource.uri"]);

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

	var silent = href.match(/!!\$\{/);
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
    
    if(href === "{}") href = "{:}"
    
    if(href.startsWith(":") && !href.startsWith("://")) {
    	href = anchor.textContent + href.substring(1);
    } else if(href.startsWith("blocks:")) {
		href = href.substring("blocks:".length);
		blocks = true;
    } else if(href.startsWith("comps:")) {
		href = href.substring("comps:".length);
		comps = true;
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
    	var hs = href.split(":");
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
		return resolveUri_blocks(uri).substring("cavalion-blocks/".length) + ".js";
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
		return resolveUri_comps(uri).substring("vcl-comps/".length) + ".js";
	}

	swp = startsWithProtocol(href);
	if(!swp) {
		var _ = window.require.s.contexts._;
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

	return uri.endsWith("/") ? uri.substring(0, uri.length - 1) : uri;
};
const decorateLinks = (node, control) => {
	node.qsa("a").forEach(a => {
		if(a.classList.contains("md-heading-anchor")) {
			a.removeAttribute("data-href-hint");
		} else {
			var href = resolveLinkHintHref(a, control);
			if(href) {
				a.setAttribute("data-href-hint", href);
			} else {
				a.removeAttribute("data-href-hint");
			}
		}
	});
};
const decorateSections = (node, control) => {
	var children = Array.from(node.childNodes);
	if(children.some(child => headingLevel(child) > 0) === false) {
		control.vars("md-section-map", {});
		return;
	}

	var state = getSectionState(control);
	var counts = Object.create(null);
	var map = {};

	while(node.firstChild) {
		node.removeChild(node.firstChild);
	}

	var stack = [{ level: 0, body: node, key: "" }];
	children.forEach(child => {
		var level = headingLevel(child);
		if(level === 0) {
			stack[stack.length - 1].body.appendChild(child);
			return;
		}

		while(stack.length > 1 && stack[stack.length - 1].level >= level) {
			stack.pop();
		}

		var parent = stack[stack.length - 1];
		var text = normalizeText(child.textContent);
		var count_key = js.sf("%s|%d|%s", parent.key, level, text);
		var count = counts[count_key] = (counts[count_key] || 0) + 1;
		var key = js.sf("%s/%d:%s#%d", parent.key, level, text, count);
		var section = document.createElement("DIV");
		var body = document.createElement("DIV");

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
const getCheckboxItemText = (item) => {
	var clone = item.cloneNode(true);

	Array.from(clone.querySelectorAll("input, ul, ol")).forEach(node => {
		node.parentNode && node.parentNode.removeChild(node);
	});

	return normalizeText(clone.textContent) || "item";
};
const buildCheckboxKey = (item, counts) => {
	var section = item.closest ? item.closest(".md-section") : null;
	var section_key = section ? section.getAttribute("data-section-key") : "";
	var path = [];
	var current = item;

	while(current && current.nodeName === "LI") {
		path.unshift(getCheckboxItemText(current));
		var list = current.parentNode;
		current = list && list.parentNode && list.parentNode.nodeName === "LI" ? list.parentNode : null;
	}

	path = path.join(" > ") || "item";
	var count_key = js.sf("%s|%s", section_key, path);
	var count = counts[count_key] = (counts[count_key] || 0) + 1;
	return js.sf("%s::%s#%d", section_key, path, count);
};
const decorateCheckboxes = (node, control) => {
	var state = getCheckboxState(control);
	var counts = Object.create(null);

	node.qsa('input[type="checkbox"]').forEach(input => {
		var item = input.closest ? input.closest("LI") : null;
		if(!item) {
			input.removeAttribute("disabled");
			return;
		}

		var key = buildCheckboxKey(item, counts);
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
function render() {
	var value = this.getValue();
	
// #CVLN-20200906-3
	var impl;
	if((impl = this.vars(["onGetRenderValue"]))) {
		value = impl(value, this);
	}
	if((impl = this.vars(["onRender"]))) {
		return impl(value, this);
	}
	
	var dialect = this.vars(["dialect"]);
	var resource = this.vars(["resource"]);
	var content;
	var root_control = this.up();
	var render_value = dialect === "marked" ? escapeMarkdownLinkDescriptions(value) : value;

	if(root_control && dialect !== undefined && root_control.vars("dialect-persisted") !== dialect) {
		root_control.vars("dialect-persisted", dialect);
		root_control.writeStorage("dialect", dialect);
	}

	if(!dialect || dialect === "markdown") {
		var root = markdown.toHTMLTree(encodeMdLinks(render_value), 
				this.vars(["markdown.dialect"]), 
				this.vars(["markdown.options"]));
				
		content = markdown.renderJsonML(root);
	} else if(dialect === "marked") {

		content = marked(render_value);
	}
	
	root_control && root_control.vars("md-heading-index", buildMarkdownHeadingIndex(value));
	root_control && root_control.vars("root", root);

	var output = getOutputControl(this);
	if(!output) {
		return;
	}

	capturePreviewScrollState(this, output.nodeNeeded ? output.nodeNeeded() : null);
	output.setContent(content);
	output.update(function() {
    		var node = this.nodeNeeded(), me = this;
    		
    		node.qsa("a").forEach(a => {
    			if(a.title && a.title.startsWith("`") && a.title.endsWith("`")) {
					var params = [
						this.app(), 
						this.up("devtools/Workspace<>:root"), 
						this.up("devtools/Editor<>:root"),
						(a, b, c, d) => this.vars.apply(this, [a, b, c, d].filter(a => a !== undefined)),
						window.locale,
						(a, b, c, d) => this.print.apply(this, [a, b, c, d].filter(a => a !== undefined))];

    				a.title = e_v_a_l1( // probably doesn't work as expected anymore
    					a.title.substring(1, a.title.length - 1))
    						.f.apply(this, params);
    			}
    		});
    		
		    node.qsa("img").forEach(img => {
		    	var src = js.get("attributes.src.value", img) || "";
		    	if(src.indexOf(":") === -1) { // relative image src
		    		img.src = "/home/" + js.up(resource.uri) + "/" + src;
		    	}
		    });

		    on(node.qsa("img"), "load", function(img, r) {
		    	img = this; r = window.devicePixelRatio || 1;
	    		if(img.style.maxWidth === "") {
	    			r = img['@?x'] || r;
    				img.style.maxWidth = js.sf("%dpx", (img.naturalWidth / r));
	    		}
		    });
		    
		    node.qsa("img").forEach(function(img) {
		    	var r = window.devicePixelRatio > 1 ? 2 : 2, title, imgs;
		    	if(img.naturalWidth && img.src.indexOf("?2x") !== -1) {
		    		img.style.widthWhenHovered = img.naturalWidth / r + "px";
		    	}
		    	if(img.title.match(/^@([0-9]*[.])?[0-9]+/)) {
		    		imgs = img.title.split(' ');
		    		img['@?x'] = parseFloat(imgs.shift().substring(1));
		    		
		    		while(imgs.length && !imgs[0].startsWith('`')) {
		    			HE.addClass(img, imgs.shift());
		    		}
		    		
		    		img.title = imgs.join(' ');
		    	}
		    	
		    	if(img.title.startsWith('`') && img.title.endsWith('`')) {
					var backtick_params = [
						img,
						me.app(), 
						me.up("devtools/Workspace<>:root"), 
						me.up("devtools/Editor<>:root"),
						(i, a, b, c, d) => me.vars.apply(me, [i, a, b, c, d].filter(a => a !== undefined)),
						window.locale,
						(i, a, b, c, d) => me.print.apply(me, [i, a, b, c, d].filter(a => a !== undefined))];

		    		imgs = img.title.split('`');
		    		img.title = imgs.pop();
		    		imgs = e_v_a_l1(imgs[1]).i.apply(me, backtick_params).split(";");
		    		
		    		if(imgs.length === 1) { // only classes
		    			HE.addClasses(imgs.pop());
		    		}

		    		if(imgs.length) { // mixin on img.style
    					js.mixIn(img.style, js.str2obj(imgs.join(";")));
		    		}
		    	}
		    });
		    
			var insertA = (H) => {
				var a = document.createElement("A");
				a.className = "md-heading-anchor";
				a.id = slugifyHeading(H.textContent);
				a.href = "#" + a.id;
				H.appendChild(a);
				return a.href;
			};
			
				"h1,h2,h3,h4,h5".split(",").forEach(H => node.qsa(H).map(insertA));
				decorateLinks(node, this);
				decorateSections(node, this);
				decorateTopLevelNavigation(node, this);
				if(dialect === "marked") {
					decorateCheckboxes(node, this);
				}
				restorePreviewScrollState(this, node);
				var editor = getAceEditor(this);
				schedulePreviewSync(this, editor ? editor.getCursorPosition().row : 0);
			    
	}.bind(output));
}
document.addEventListener("click", (evt) => {
// #CVLN-20210102-2
	var anchor = evt.target.up("A", true);
	if(anchor) {

		var control = require("vcl/Control").findByNode(anchor);
		if(!control || !(control.up("devtools/Editor<md>") || control._owner)) {
			return;
		}

		var href = window.unescape(js.get("attributes.href.value", anchor) || "");
        var blocks, blocks_vars, comps, comps_vars;
        var backticks = false;
        
        if(href.startsWith("javascript:")) {
        	return;
        }
        
        if(href.startsWith("`") && href.endsWith("`")) {
        	backticks = true;
        	href = href.substring(1, href.length - 1);
	        // #VA-20221029-1
	        if(href === "!") {
	        	href = "${p(:)}";
	        } else if(href.charAt(0) === "!") {
	        	// href = "${p(:)}";
	        }
        }

		var show_console = href.match(/\$\{p\(.*\)\}$/);
		var silent = href.match(/!!\$\{/);
		if(silent) { // adds option to evaluate href-expression silently (ie. not open resource, nor the console) - href must begin with !!${
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
        } else if(href.startsWith("<[") && href.endsWith("]>>")) { // crazy rendering bugs)
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
        
        if(href === "{}") href = "{:}"
        
        if(href.startsWith(":") && !href.startsWith("://")) {
        	href = anchor.textContent + href.substring(1);
        } else if(href.startsWith("blocks:")) {
			href = href.substring("blocks:".length);
			blocks = true;
        } else if(href.startsWith("comps:")) {
			href = href.substring("comps:".length);
			comps = true;
		}
		
		var swp = startsWithProtocol(href);//.match("^[/]*[^:]*://");
		if(!swp || href.split(":").length > 2) {
			if(href.charAt(0) === "#") {
				if(!href.endsWith(":")) {
					return;
				}
			} else {
				// replace last : occurence with anchor.textContent
				href = href.replace(/:([^:]*)$/, anchor.textContent + "$1");
			}
		}
			
		evt.preventDefault();
		
		if(href === "" || href === "*") { // <<[]>> becomes *
			href = href + anchor.textContent;
		}

		/*- 20241025 obsolete - implemented by Resource.resolve(uri)
			if(href.startsWith("://")) { // TODO anticipate ! and *
				var pre = blocks ? "/cavalion-blocks" : comps ? "/vcl-comps" : "";
				href = js.sf("pouchdb://%s%s/%s", getDB_name(control), pre, href.substring(3) || anchor.textContent);
			} 
		*/
		
		var backtick_params = [
			control.app(), 
			control.up("devtools/Workspace<>:root"), 
			control.up("devtools/Editor<>:root"),
			(a, b, c, d) => control.vars.apply(control, [a, b, c, d].filter(a => a !== undefined)),
			window.locale,
			(a, b, c, d) => control.print.apply(control, [a, b, c, d].filter(a => a !== undefined))];

		if(backticks) {
			href = e_v_a_l1(href).f.apply(control, backtick_params);
			blocks_vars = e_v_a_l1(blocks_vars).f.apply(control, backtick_params);
			comps_vars = e_v_a_l1(comps_vars).f.apply(control, backtick_params);
		}
		
		if(silent) {
			return;
		}

		if(show_console) {
			if(!evt.metaKey) {
				control	.up("devtools/Workspace<>:root")
						.qs("#left-sidebar-tabs > vcl/ui/Tab[control=console]")
						.selectVisible();
			}
			return; // bail-out (#CVLN-20210102-2)
		}
		
		// so the rules apply these anchors as well
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
		
		// links are relative to the resource
		var base = control.vars(["resource.uri"]);
		var tab, uri;

        if(href.endsWith("::")) {
        	// TODO allow pre/suffix? maybe checking for "if(href.startWith("#"))" is better and then just substitute the last :, the first being a seperator
        	var hs = href.split(":"), action = control.udr(hs[0]);
        	hs.pop(); hs.pop(); hs.shift();
        	if(action instanceof require("vcl/Action")) {
        		return action.execute(js.normalize(base, hs.join(":").replace(/::/g, anchor.textContent) || anchor.textContent), evt);
        	}
        	alert(js.sf("%s not found", href.split(":")[0]));
        	throw new Error(js.sf("%s not found", href.split(":")[0]));
        }

		var run, ins, title = anchor.title.trim(), sourceUri, props;
		if(title.startsWith('${') && title.endsWith('}')) {
			// title = title.substring(2, title.length - 1);
			props = e_v_a_l(title).f.apply(control, backtick_params);
		}
		
		if(blocks) {
			if(ins = href.charAt(0) === "*") href = href.substring(1);
			if(run = href.charAt(0) === "!") href = href.substring(1);
			
			if(href.startsWith("./")) {
				uri = js.normalize(base, href);
			} else if(href.startsWith("/")) {
				uri = href.substring(1);
			} else if(!swp) { // does not start with protocol
				uri = "Library/cavalion-blocks/" + href;
			} else {
				uri = href;
			}
				
			sourceUri = resolveUri_blocks(uri).substring("cavalion-blocks/".length) + ".js";
			
			if(ins && evt.altKey === false) {
				if(!run) {
					props = props || {};
					props.vars = js.mi({ 'storage-uri': uri }, props.vars || {});
					if(blocks_vars) {
						if(typeof blocks_vars === "string") {
		            		if(blocks_vars.startsWith("{") && blocks_vars.endsWith("}")) {
		            			var vars = {};
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
			} else if(!swp) { // does not start with protocol
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
					title: title === "" ? "" : title || anchor.textContent//href.substring(href.charAt(0) === "/" ? 1 : 0)
				},
				selected: true
			});
		} else {
			swp = startsWithProtocol(href);//.match("^[/]*[^:]*://");
			
			if(!swp) {
				var _ = window.require.s.contexts._;
		        if(href.startsWith("{") && href.endsWith("}")) { // []({})
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
					// uri already ends in ".md", cut it off
					uri = uri.replace(/\.md$/, "");
				} else if(!uri.endsWith(".smdl")) {
					uri += ".smdl"
				} else {
					// uri ends in ".smdl", cut it off
					uri = uri.replace(/\.smdl$/, "");
				}
			}
			
			tab = editorNeeded(control, evt).execute({
				resource:{ 
					uri: uri.endsWith("/") ? uri.substring(0, uri.length - 1) : uri,
					type: uri.endsWith("/") ? "Folder" : "File",
					title: title === "" ? "" : title || anchor.textContent//href.substring(href.charAt(0) === "/" ? 1 : 0)
				},
				bringToFront: evt.shiftKey === true,
				selected: true
			});
		}
	}
});

const editorNeeded = (control, evt) => {
	if(evt.metaKey === true) {
		return control.up("devtools/Workspace<>:root").down("#editor-needed");
	}
	return control.udr("#editor-needed");
}
const update_shrink = (me, value) => me.ud("#output").syncClass("shrink", value);
const isUpperCase = (s) => s.toUpperCase() === s;
const e_v_a_l = (s) => {
	// #VA-20221029-1 TODO EXPLAIN this one
	var E, s = js.sf("try { return `${r = %s`, r; } catch(e) { alert(e.message); throw p(e); } ", s.substring(2));
	return window[(E = "e") + 'val'](js.sf("({" + 
		"f: (app, ws, ed, v, l, p, r) => { %s }, " + 
		"i: (img, app, ws, ed, v, l, p, r) => { %s } " + 
	"})", s, s));
};
const e_v_a_l1 = (s, E) => {
	// #VA-20221029-1 TODO EXPLAIN this one
	s = js.sf("try { return `%s`; } catch(e) { alert(e.message); throw p(e); } ", s);
	return window[(E = "e") + 'val'](js.sf("({" + 
		"f: (app, ws, ed, v, l, p, r) => { %s }, " + 
		"i: (img, app, ws, ed, v, l, p, r) => { %s } " + 
	"})", s, s));
};
const startsWithProtocol = (url) => url.match(/^[^\s]*:\/\//) !== null;
const getDB_name = (control) => {
	var ws = control.up("devtools/Workspace<>:root");
	if(ws) {
		var CS = ws.qs("#Component_storage");
		if(CS) {
			var uri = CS.vars("resource.uri");
			if(uri.startsWith("pouchdb://")) {
				return uri.split("/")[2];
			}
		}
	}
	
	return Component.storageDB.name;
}

const Handlers = {
    onResize() {
    	var cs = this.getComputedStyle();
		this.ud("#output").syncClass("shrink", parseInt(cs.width, 10) < 900);
		updateTopLevelNavigationPosition(this);
    },
	"#output onDblClick": function(evt) {
    	if(evt.metaKey === true) {
		    this._node.qsa("img").forEach(function(img) {
		    	var r = window.devicePixelRatio > 1 ? 2 : 2;
		    	if(img.naturalWidth && img.src.indexOf("?2x") !== -1) {
		    		// console.log(">>>", img.naturalWidth, img);
		    		img.style.width = img.naturalWidth / r + "px";
		    	}
		    });
    	}
	}
};
const Css = {
	'a > img': "border: 2px solid rgb(56, 121, 217);"
};
const Css_content = {
/*- TODO should be centralized */
			"": "margin-left:auto;margin-right:auto;",//position:relative;",
			':not(.shrink)': "width:795px;",
		    "background-color": "rgba(240,240,240,1)", 
		    "border-left": "1px solid silver",
		    "border-right": "1px solid silver",
		    "font-family": "times,-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif,'Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol'", 
		    "font-size": "12pt",
		    'img': {
		    	'': "width:75%; transition: width 1s ease 0s, box-shadow 1s ease 0s;",
		    	':not(.inline)': "display:block; margin:auto;",
		    	'&:hover': "width: 100%; box-shadow: rgb(0 0 0 / 40%) 0px 1px 2px 0px;",// max-height: 600px;",
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
		    ".md-cursor-band": "position:absolute;height:12px;margin-top:-6px;border-top:1px solid rgba(56,121,217,.35);border-bottom:1px solid rgba(56,121,217,.18);background:linear-gradient(180deg, rgba(56,121,217,.10), rgba(56,121,217,.03));border-radius:999px;pointer-events:none;z-index:6;box-shadow:0 0 0 1px rgba(56,121,217,.04) inset;",
		    ".md-selection-layer": "position:absolute;inset:0;pointer-events:none;z-index:4;",
		    ".md-selection-band": "position:absolute;border-radius:10px;background:linear-gradient(180deg, rgba(56,121,217,.12), rgba(56,121,217,.05));box-shadow:0 0 0 1px rgba(56,121,217,.08) inset;",
		    // "img:hover": "width:100%;max-width:600px;",
		    "code": "border-radius:7px;font-size: 7.5pt;background-color:white;padding:4px;vertical-align:middle;",
		    "&.small-images": {
		    	"img:not(:hover)": "width: 10%; height: 10%;",
		    	"img:not(.inline)": "margin: 8px; margin-left: 24px;"
		    },
		    "&.hide-images": {
		    	"img": "display: none;"
		    }
	    };

[(""), {
	css: Css,
	handlers: Handlers,
	vars: {
		topLevelNavigation: {
			side: "left"
		}
	}
}, [
    [("#evaluate"), {
    	onLoad() {
    		this.vars("eval", () => this.vars(["root"]));
    		return this.inherited(arguments);
    	}
    }],
    [("#ace"), { 
    	align: "left", width: 600, action: "toggle-source",
    	executesAction: "none",
	    onLoad() {
    		var root = this.up();
    		var editor = this.getEditor();
    		var bindResize = root && root.vars(["bindTopLevelNavigationResize"]);
    		var sync_cursor = () => {
    			syncTopLevelNavActiveToSourcePosition(this);
    			schedulePreviewSync(this, editor.getCursorPosition().row);
    		};
    		var sync_selection = () => schedulePreviewSync(this, editor.getCursorPosition().row);
    		var sync_scroll = () => {
    			syncTopLevelNavToSourcePositionThrottled(this, 50);
    			schedulePreviewSync(this,
    				editor.getFirstVisibleRow ? editor.getFirstVisibleRow() : editor.renderer.getFirstVisibleRow());
    		};
    		var sync_folds = () => syncPreviewToEditorFolds(this);

    		editor.selection.on("changeCursor", sync_cursor);
    		editor.selection.on("changeSelection", sync_selection);
    		editor.session.on("changeScrollTop", sync_scroll);
    		editor.session.on("changeFold", sync_folds);
    		bindResize && bindResize(root, "md-toplevel-nav-window-resize",
    			() => updateTopLevelNavigationPosition(this), 120);

	    		if(root) {
	    			this.up("vcl/ui/Tab").once("resource-loaded", () => {
    				this.setTimeout("md-fold-sync-ready", () => {
    					root.vars("md-fold-sync-ready", true);
    					snapshotEditorFoldState(this);
    					schedulePreviewSync(this, editor.getCursorPosition().row);
    				}, 150);
    			});

    			root.readStorage("dialect", (dialect) => {
    				if(dialect !== undefined && root.vars(["dialect"]) === undefined) {
    					root.vars("dialect", dialect);
    					root.vars("dialect-persisted", dialect);
    					this.setTimeout("render", render.bind(this), 0);
    				}
    			});
    			root.readStorage(SECTION_STATE_STORAGE_KEY, (state) => {
    				if(state && typeof state === "object") {
    					root.vars("md-section-state", state);
    					this.setTimeout("render", render.bind(this), 0);
    				}
    			});
	    			root.readStorage(CHECKBOX_STATE_STORAGE_KEY, (state) => {
	    				if(state && typeof state === "object") {
	    					root.vars("md-checkbox-state", state);
	    					this.setTimeout("render", render.bind(this), 0);
	    				}
	    			});
	    			root.readStorage(PREVIEW_FOLLOW_STORAGE_KEY, (state) => {
	    				if(typeof state === "boolean") {
	    					root.vars("md-preview-follow-source", state);
	    				}
	    			});
	    			root.readStorage(PREVIEW_SCROLL_STORAGE_KEY, (state) => {
	    				if(state && typeof state === "object") {
	    					root.vars("md-preview-scroll-state", {
	    						left: state.left || 0,
	    						top: state.top || 0
	    					});
	    					this.setTimeout("restore-preview-scroll", () =>
	    						restorePreviewScrollState(this, this.ud("#output").nodeNeeded()), 0);
	    				}
	    			});
	    		}
	    	},
        onChange() { 
        	if(!this._vars) {
        		render.apply(this, []);
        		this.vars();
        	} else {
        		this.setTimeout("render", render.bind(this), 750);
        	}
        }
    }],
    
    ["vcl/Action", ("toggle-source"), {
	    hotkey: "Shift+MetaCtrl+S",
	    selected: "state", visible: "state", 
	    state: true,
	    onLoad() {
	    	var resource = this.vars(["resource"]);
	    	var md_sourceInitiallyHidden = this.vars(["markdown-source-intially-hidden"]) === true;
	    	if(!resource.name) resource.name = resource.uri.split("/").pop();
    		this.up().readStorage("source-visible", (visible) => {
    			if(typeof visible === "boolean") {
    				this.setState(visible);
    				this.up().vars("md-source-visible", visible);
    				update_shrink(this, visible);
    				// this.ud("#output").syncClass("shrink", visible);
    			} else if(visible === undefined && (md_sourceInitiallyHidden || (
    					resource.uri.split("/").pop() === ".md" ||
    					isUpperCase(resource.name.split(".md")[0])
    				))
    			) {
    				this.setState(false);
    				this.up().vars("md-source-visible", false);
    				update_shrink(this, false);
    				// this.ud("#output").syncClass("shrink", false);
    			} else {
    				this.up().vars("md-source-visible", this.getState());
    			}
    		});
        },
        onExecute() {
        	var state = !this.getState();
        	this.setState(state);
        	this.up().vars("md-source-visible", state);
        	schedulePreviewSync(this, this.ud("#ace").getEditor().getCursorPosition().row);
        	if(state === true) {
        		var ace = this.ud("#ace");
        		ace.setFocus();
		// this.nextTick(() => ace.focus());
		// this.ud("#output").toggleClass("shrink");
	}
	update_shrink(this, state);
	this.setTimeout("md-nav-position", () => updateTopLevelNavigationPosition(this), 0);
	this.up().writeStorage("source-visible", this.getState());
	
    }
    }],
    ["vcl/Action", ("outline-proxy-generate"), {
    	on() {
    		return createMarkdownOutlineProxy(this.up());
    	}
    }],
    ["vcl/Action", ("show-outline"), {
    	hotkey: "Shift+MetaCtrl+O",
    	on() {
    		return H("vcl-comps:devtools/Outline<md>", {
    			ace: this.ud("#ace"),
    			outline: this.ud("#outline-proxy-generate").execute()
    		});
    	}
    }],
    ["vcl/ui/Panel", ("output"), { 
    	align: "client", 
		vars: {
			[CONSOLE_ALLOW_ALT_META_CLICK_VAR]: true
		},
		css: Css_content,
	    classes: "shrink",
	    
	    onMouseMove(evt) {
	    	
	    	if(evt.shiftKey === false) return;
	    	
	    	var current = evt.target;
	    	if(current.nodeName !== "IMG") {
	    		current = undefined;
	    	}
	    	
	    	var last = this.vars("last");
			if(last !== current) {
				if(last) {
					last.style.width = "";
				}
				last = current;
				if(last) {
					last.style.width = last.style.widthWhenHovered;
				}
			}
			
			last && this.vars("last", last);
	    },
	    onMouseLeave(evt) {
	    	var last = this.removeVar("last");
			if(last) {
				last.style.width = "";
			}
	    },
	    onScroll() {
	    	if(isSourceVisible(this)) {
	    		syncTopLevelNavActiveToSourcePosition(this);
	    	} else {
	    		syncTopLevelNavActiveToPreviewScroll(this, this.nodeNeeded());
	    	}
	    	capturePreviewScrollState(this, this.nodeNeeded());
	    	this.setTimeout("persist-preview-scroll-state",
	    		() => persistPreviewScrollState(this), 150);
	    },
	    onClick(evt) {
	    	var anchor = evt.target.up("A", true);
	    	if(anchor) return;

    	var heading = evt.target.up("H1,H2,H3,H4,H5,H6", true);
    	if(!heading || heading.classList.contains("md-section-heading") === false) {
    		return;
    	}

    	var section = heading.parentNode;
    	if(!section || section.classList.contains("md-section") === false) {
    		return;
    	}

    	evt.preventDefault();
    	evt.stopPropagation();

    	var collapsed = section.classList.contains("collapsed");
    		var level = section.getAttribute("data-section-level");
    	if(evt.shiftKey === true && evt.altKey === true && evt.metaKey === true) {
    		expandSectionsUpToLevel(this, this._node.qsa(".md-section"), level);
    	} else if(evt.altKey === true && evt.metaKey === true) {
    		setSectionsCollapsed(this,
    			this._node.qsa(js.sf('.md-section[data-section-level="%s"]', level)),
    			true);
    	} else if(evt.altKey === true) {
    		setSectionsCollapsed(this, this._node.qsa(".md-section"), !collapsed);
    	} else {
    		setSectionCollapsed(this, section, !collapsed);
    	}
    }
	}]
]];
