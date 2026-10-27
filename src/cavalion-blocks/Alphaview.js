"use vcl/ui/Console, vcl/ui/List, vcl/ui/ListColumn, vcl/data/Array, vcl/Control, util/Event";

/*- ### 2025/04/04 See .md */
/*- ### 2023/07/20 #focus-q stabilized */
/*- ### 2022/07/24 #q.placeholder reflects location in tree (more or less) */
/*- ### 2024/09/03 Loads of features added */
/*- ### 2022/01/10 ... */
/*- ### 2021/09/18 Hooking devtools/Editor<xml>'s console */
/*- ### 2021/09/11 Whatvar? console or sel */
/*- ### 2021/01/09 Tired of not populating when console is invisible */
/*- ### 2020-10-29 Alphaview - Arcadis-demo inspired */
/*- ### 2020-10-02 Console hook - SIKB12 inspired */

var ListColumn = require("vcl/ui/ListColumn");
var List = require("vcl/ui/List");
var ArraySource = require("vcl/data/Array");
var Event = require("util/Event");
var Console = require("vcl/ui/Console");
var Control = require("vcl/Control");

var LOGGING = 0;
var AUTO_HIDE_EMPTY_COLUMNS_MAX_ROWS = 10000;

function match(obj, q) {
	q = q.toLowerCase();	
	if(typeof obj ==="string") {
		return obj.toLowerCase().includes(q);
	}
	for(var k in obj) {
		if(js.sf("%n", obj[k]).toLowerCase().includes(q)) {
			return true;
		}
	}
	return false;
}
function objectAsTabs() {
	
}
function getMatchingKey(name, obj) {
	if(obj.hasOwnProperty(name)) return name;
	return Object.keys(obj).filter(k => k.startsWith(name))[0];
};

function nameOf(ft) {
	if(/\s/.test(ft) === false) {
		return ft.split(":").pop();
	}
	return ft;	
}
function uniqueSelectionKeys(keys) {
	var counts = {}, seen = {};
	
	keys.forEach(key => {
		key = key || "";
		counts[key] = (counts[key] || 0) + 1;
	});
	
	return keys.map((key, index) => {
		key = key || js.sf("selection %d", index + 1);
		if(counts[key] <= 1) {
			return key;
		}
		
		seen[key] = (seen[key] || 0) + 1;
		return js.sf("%s [%d/%d]", key, seen[key], counts[key]);
	});
}

var css = {
	"#bar": "text-align: center; backdrop-filter: blur(3px); background-color: rgba(255,255,255,0.5);",
	"#bar > *": "margin-right:5px;",
	"#bar input": "font-size:12pt;width:50%; border-radius: 5px; border-width: 1px; padding: 2px 4px; border-color: #f0f0f0;",
	"#bar #left": "float:left;", 
	"#bar #right": "float:right; direction: rtl;",
	"#presets": "display:inline-block;white-space:nowrap;",
	"#presets .alphaview-preset": "margin:0 2px;padding:2px 6px;",
	'#status': "direction: ltr;",
	"#status .alphaview-column-visibility-toggle": "cursor:pointer;text-decoration:underline;"
	// "#bar #right > .{Button}": "float:right;"
};

const getActiveList = function(root) {
	return root.vars("navigation.activeList") || root.ud("#list");
};
const captureNavigationState = function(root, list) {
	list = list || getActiveList(root);
	var body = list.getNodes().body;

	return {
		topRow: list.getTopRow(),
		selection: list.getSelection(),
		scroll: { left: body.scrollLeft, top: body.scrollTop },
		visibleColumns: getVisibleColumnAttributes(list)
	};
};
const restoreNavigationState = function(root, state) {
	var list = root.ud("#list");
	var count, selection;

	if(!state) return;

	if(state.visibleColumns) {
		applyVisibleColumns(list, state.visibleColumns);
	}

	if(state.topRow !== undefined) {
		list.setTopRow(state.topRow);
	}

	if(state.selection) {
		count = list.getCount();
		selection = state.selection.filter(function(index) {
			return index >= 0 && index < count;
		});
		list.setSelection(selection);
		list.storeScroll();
		list._scrollLeft = js.get("scroll.left", state) || 0;
		list.restoreScroll();

		// if(list._nodes && list._nodes.body && state.scroll) {
		// 	list._nodes.body.scrollTop = state.scroll.top || 0;
		// }
	}
};
const captureHistoryEntry = function(root) {
	var list = getActiveList(root);
	var q = root.ud("#q");

	var entry = {
		list: list,
		state: {
			q: q ? q.getValue() : undefined,
			list: list ? captureNavigationState(root, list) : null
		}
	};
	// root.print("captureHE", entry);
	return entry;
};
const restoreHistoryEntry = function(root, entry) {
	var list = getActiveList(root);
	var q = root.ud("#q");
	var state = entry && entry.state;

	// root.print("restoreHE", entry);

	if(!entry) return;

	if(!entry.list) return;

	var index = list.getIndex();
	list.setVisible(false);
	list.setName(js.sf("list-history-%d", root.vars("navigation.nextListId", 0)));
	entry.list.setName("list");
	entry.list.setIndex(index);
	moveNavigationBar(root, entry.list);
	entry.list.setEnabled(true);
	entry.list.setVisible(true);
	root.vars("navigation.activeList", entry.list);
	syncNavigationButtons(root, true);

	if(q && state && state.q !== undefined) {
		q.setValue(state.q);
		entry.list.getSource().vars("q", parseFilterAndAttributes(state.q).q);
		entry.list.getSource().updateFilter();
	}
	root.setTimeout("restore-history-state", function() {
		state && state.list && restoreNavigationState(root, state.list);
		root.ud("#status").render();
	}, 0);
};

const parseFilterAndAttributes = function(input) {
	var parts, attrs, q;

	input = input || "";

	// default: no valid column spec present
	var result = {
		raw: input,
		q: input,
		hasAttrsSpec: false,
		allColumns: false,
		attrs: undefined
	};

	if(input.charAt(0) !== "|") {
		return result;
	}

	parts = input.split(/(?<!\\)\|/);

	// Need at least: "", <one-or-more attr tokens>, <q>
	// Example valid:
	//   |*|
	//   |name|value|abc
	// Invalid / incomplete:
	//   |
	//   ||
	//   |name
	if(parts.length < 3) {
		result.q = "";
		return result;
	}

	q = parts.pop();
	attrs = parts.slice(1); // skip leading empty token from initial "|"

	// Empty attr list => invalid/empty spec, recover gracefully
	// "||" => attrs = [""]
	if(attrs.length === 0 || attrs.every(function(s) { return s === ""; })) {
		result.q = q;
		return result;
	}

	attrs = attrs.filter(function(s) { return s !== ""; });

	// Explicit all-columns mode
	if(attrs.length === 1 && attrs[0] === "*") {
		result.q = q;
		result.hasAttrsSpec = true;
		result.allColumns = true;
		result.attrs = null;
		return result;
	}

	result.q = q;
	result.hasAttrsSpec = true;
	result.attrs = attrs;
	return result;
};
const getVisibleColumnAttributes = function(list) {
	return list._columns
		.filter(function(column) { return column.isVisible(); })
		.map(function(column) { return column._attribute; });
};
const applyVisibleColumns = function(list, attrs) {
	var autoVisible = {};

	if(!list || !list._columns) return;

	list._controls.forEach(function(r) {
		r.setState("classesInvalidated", true);
	});

	list._columns.forEach(function(column) {
		var visible = !attrs || attrs.some(function(a) {
			if(!a) return false;
			return a.endsWith(" ") ? column._attribute.startsWith(a.trim()) :
				a.startsWith("=") ? column._attribute === a.substring(1) :
				column._attribute.includes(a.trim());
		});

		setColumnAutoVisible(list, column, visible, autoVisible);
	});
	list.vars("autoColumns.autoVisible", autoVisible);
};
const getListColumns = function(list) {
	return (list && (list._columns || (list.getColumns && list.getColumns()))) || [];
};
const getColumnAttribute = function(column) {
	return column && column._attribute;
};
const getManualHiddenColumnAttrs = function(list) {
	return list.vars("autoColumns.manualHiddenAttributes") || [];
};
const setManualHiddenColumnAttrs = function(list, attrs) {
	list.vars("autoColumns.manualHiddenAttributes", attrs);
};
const isManualHiddenColumn = function(list, column) {
	var attr = getColumnAttribute(column);
	return attr !== undefined && getManualHiddenColumnAttrs(list).indexOf(attr) !== -1;
};
const rememberManualColumnVisibility = function(list) {
	var autoVisible = list.vars("autoColumns.autoVisible") || {};
	var manualHidden = getManualHiddenColumnAttrs(list).reduce(function(map, attr) {
		map[attr] = true;
		return map;
	}, {});
	var changed = false;

	getListColumns(list).forEach(function(column) {
		var attr = getColumnAttribute(column);
		var expectsHidden = autoVisible[attr] === false;

		if(attr === undefined) return;

		if(!column.isVisible() && !expectsHidden && manualHidden[attr] !== true) {
			manualHidden[attr] = true;
			changed = true;
		} else if(column.isVisible() && manualHidden[attr] === true) {
			delete manualHidden[attr];
			changed = true;
		}
	});

	if(changed) {
		setManualHiddenColumnAttrs(list, Object.keys(manualHidden));
	}
};
const setColumnAutoVisible = function(list, column, visible, autoVisible) {
	var attr = getColumnAttribute(column);

	if(attr !== undefined) {
		autoVisible[attr] = visible;
	}
	column.setVisible(visible && !isManualHiddenColumn(list, column));
};
const updateListWidthClasses = function(list) {
	var count = getListColumns(list).filter(function(column) { return column.isVisible(); }).length;

	list.syncClasses(
		["max-width-320", "max-width-500", "max-width-750"],
		[count > 1 && count <= 3, count > 3 && count <= 6, count > 6]
	);
};
const showAllColumns = function(list) {
	var columns = getListColumns(list);
	var autoVisible = {};

	columns.forEach(function(column) { setColumnAutoVisible(list, column, true, autoVisible); });
	list.vars("autoColumns.autoVisible", autoVisible);
	list.vars("autoColumns.emptyColumnsSkipped", 0);
	list.vars("autoColumns.emptyColumnsHidden", 0);

	return { skipped: false, rows: 0, hidden: 0, total: columns.length };
};
const hideEmptyColumns = function(list, opts) {
	opts = opts || {};

	var columns = getListColumns(list);
	var source = list && list.getSource && list.getSource();
	var objs = (source && source.getObjects && source.getObjects()) || [];
	var autoVisible = {};
	var hidden = 0;

	if(objs.length === 0 || (opts.maxRows !== undefined && objs.length > opts.maxRows)) {
		showAllColumns(list);
		list.vars("autoColumns.emptyColumnsSkipped", objs.length);
		return { skipped: objs.length > 0, rows: objs.length, hidden: 0, total: columns.length };
	}

	list.vars("autoColumns.emptyColumnsSkipped", 0);
	columns.forEach(function(column) {
		var visible = objs.some(function(obj, row) {
			return list.valueByColumnAndRow(column, row);
		});

		setColumnAutoVisible(list, column, visible, autoVisible);
		hidden += visible ? 0 : 1;
	});
	list.vars("autoColumns.autoVisible", autoVisible);
	list.vars("autoColumns.emptyColumnsHidden", hidden);

	return { skipped: false, rows: objs.length, hidden: hidden, total: columns.length };
};
const toggleEmptyColumnVisibility = function(list) {
	var showingAll = list.vars("autoColumns.showingAll");

	if(showingAll) {
		hideEmptyColumns(list);
	} else {
		showAllColumns(list);
	}
	list.vars("autoColumns.showingAll", !showingAll);
	updateListWidthClasses(list);
};
const applyDefaultColumnVisibility = function(list) {
	var q, parsed, attrs;

	if(!list || list.vars("autoColumns.applying") || list.vars("autoColumns.showingAll")) return;

	list.vars("autoColumns.applying", true);
	try {
		q = list.ud("#q");
		parsed = parseFilterAndAttributes(q && q.getValue());

		if(parsed.hasAttrsSpec) {
			applyVisibleColumns(list, parsed.allColumns ? null : parsed.attrs);
			list.vars("autoColumns.emptyColumnsSkipped", 0);
			list.vars("autoColumns.emptyColumnsHidden", 0);
		} else if((attrs = list.vars("autoColumns.attributes"))) {
			applyVisibleColumns(list, attrs);
			list.vars("autoColumns.emptyColumnsSkipped", 0);
			list.vars("autoColumns.emptyColumnsHidden", 0);
		} else if(list.vars("autoColumns.hideEmpty") === false) {
			showAllColumns(list);
		} else if(list.vars("autoColumns.hideEmptyForced") === true) {
			hideEmptyColumns(list);
		} else {
			hideEmptyColumns(list, { maxRows: AUTO_HIDE_EMPTY_COLUMNS_MAX_ROWS });
		}
		list.vars("autoColumns.showingAll", false);
	} finally {
		list.vars("autoColumns.applying", false);
	}
};
const updateList = (list) => {
	list.destroyColumns();
	list.updateColumns();
	applyDefaultColumnVisibility(list);
	updateListWidthClasses(list);
};
const moveNavigationBar = function(root, list) {
	var bar = root.qs("#bar");
	var parent = list.getParent();

	if(bar && parent) {
		if(bar.getParent() !== parent) {
			bar.setParent(parent);
		}
		bar.setIndex(list.getIndex()); // keep the bar directly above its active grid
	}
};
const syncNavigationButtons = function(root, canGoBack) {
	var back = root.qs("#back");
	var backButton = root.qs("#button-back");
	var forward = root.qs("#forward");

	[back, backButton].forEach(function(control) {
		if(control) {
			control.setEnabled(canGoBack);
			control.update();
		}
	});
	if(forward) forward.setVisible(false);
};
const installListColumnVisibilitySync = function(root, list) {
	list.override("notifyEvent", (event, data) => {
		if(event === "columnsChanged") {
			root.setTimeout("update-columns-" + list.hashCode(), () => {
				list.qsa("vcl/ui/ListColumn")
					.filter(_ => _._attribute === "_")
					.map(_ => _.set("index", 0));

				rememberManualColumnVisibility(list);
				applyDefaultColumnVisibility(list);
				updateListWidthClasses(list);
				root.qs("#status").render();
			}, 200);
		}
	});
};
const pushNavigationList = function(root, value) {
	var previous = getActiveList(root);
	var previousSource = previous.getSource();
	var id = root.vars("navigation.nextListId", 0) + 1;
	var source = new ArraySource(root);
	var list = new List(root);

	root.vars("navigation.nextListId", id);
	previous.setVisible(false);
	previous.setName(js.sf("list-history-%d", id));

	source.set({
		onFilterObject: previousSource._onFilterObject,
		onGetAttributeValue: previousSource._onGetAttributeValue,
		onUpdate: previousSource._onUpdate
	});
	list.set({
		autoColumns: previous.getAutoColumns(),
		classes: previous.getClasses(),
		css: previous.getCss(),
		onColumnGetValue: previous.getOnColumnGetValue(),
		onSelectionChange: previous.getOnSelectionChange(),
		onDispatchChildEvent: previous._onDispatchChildEvent,
		onDblClick: previous._onDblClick,
		onScroll: previous._onScroll
	});
	list.setName("list");
	list.setParent(previous.getParent());
	list.setIndex(previous.getIndex());
	list.setSource(source);
	moveNavigationBar(root, list);
	list.setEnabled(true);
	list.setVisible(true);
	installListColumnVisibilitySync(root, list);
	source.setArray(value);
	root.vars("navigation.activeList", list);
	updateList(list);
	syncNavigationButtons(root, true);
	root.setTimeout("sync-navigation-buttons", function() {
		syncNavigationButtons(root, true);
	}, 0);
	root.ud("#status").render();

	return list;
};
const listCellContext = (list, evt) => {
	const cell = evt && evt.target && evt.target.soup && evt.target.soup(".ListCell");

	if(!cell || !cell.parentNode || !list._header || !list._source) return null;
	const row = Control.findByNode(cell.parentNode);
	const index = Array.from(cell.parentNode.childNodes).indexOf(cell);
	const column = list._header.getControls()[index];

	return row && column ? {
		cell: cell,
		row: row,
		column: column
	} : null;
};
const updateAltCellHover = (list, evt) => {
	const context = evt && evt.altKey === true && listCellContext(list, evt);
	const previous = list.vars(["alphaview.altCellHover"]);
	const cell = context && context.cell;

	if(previous && previous !== cell && previous.classList) {
		previous.classList.remove("alphaview-alt-cell");
	}
	if(cell && cell.classList) {
		cell.classList.add("alphaview-alt-cell");
	}
	list.vars("alphaview.altCellHover", cell || null);
};
const activateAlphaviewCell = (list, evt, attributeOnly) => {
	const context = listCellContext(list, evt);

	if(!context) return false;
	let value = list._source.getAttributeValue(attributeOnly ? context.column._attribute : ".", context.row._rowIndex, true);
	if(value && value.value && value.key && Object.values(value).length === 2) {
		value = value.value;
	}

	const type = typeof value;
	const isobj = type === "object";
	const isarr = value instanceof Array;
	const isdate = value instanceof Date;
	LOGGING && list.print("logging alphaview.cell.activate", {
		column: context.column && context.column._attribute,
		row: context.row && context.row._rowIndex,
		attributeOnly: attributeOnly,
		valueType: value === null ? "null" : isarr ? "array" : type
	});

	if(isobj && !isdate) {
		if(isarr && value.length === 1) {
			value = value[0];
		}

		var history = list.vars(["history"]);
		history.push(captureHistoryEntry(list._owner));

		clearFilter(list._owner);
		list = pushNavigationList(list._owner, value instanceof Array ? value : Object.keys(value).map(k => ({ key: k, value: value[k] })));
		LOGGING && list.print("logging alphaview.cell.drilldown", {
			column: context.column && context.column._attribute,
			count: value instanceof Array ? value.length : Object.keys(value).length
		});
		list._owner.qs("#back").setEnabled(true); list.ud("#bar").show();
	} else {
		LOGGING && list.print("logging alphaview.scalar.prompt", {
			column: context.column && context.column._attribute,
			value: value
		});
		prompt("", js.n(value));
	}

	window.getSelection().removeAllRanges();
	return true;
};
const clearFilter = function(owner) {
	const q = owner.ud("#q"), array = getActiveList(owner).getSource();

	q.getNode().value = "";
	q._value = "";
	q.vars("previous", null);
	array.vars("q", "");
	array.updateFilter();
	owner.ud("#status").render();
};
const renderPresets = function(control) {
	const presets = (control.vars(["presets"]) || []).filter(function(preset) {
		return preset && typeof preset.expression === "string" && preset.label;
	});
	const node = control.getNode();

	if(presets.length === 0) {
		control.setVisible(false);
		node.textContent = "";
		return;
	}

	control.setVisible(true);
	node.textContent = "";
	presets.forEach(function(preset) {
		const button = document.createElement("button");
		button.type = "button";
		button.className = "alphaview-preset";
		button.textContent = preset.label;
		button.title = preset.expression;
		button.addEventListener("click", function() {
			const q = control.ud("#q");
			q.setValue(preset.expression);
			q.fire("onChange", [true]);
		});
		node.appendChild(button);
	});
};

["Container", (""), { 
	activeControl: "q", css: css, 
    onDispatchChildEvent: function (component, name, evt, f, args) {
        if (name.startsWith("key")) {

			if(evt.code === "BracketLeft" && evt.altKey === true) {
            	this.qs("#back").go(evt);
            	evt.preventDefault();
            } else if(evt.code === "BracketRight" && evt.altKey === true) {
            	this.qs("#forward").go(evt);
            	evt.preventDefault();
            }
            
            var scope = this.scope();
            if (component === scope.q) {
                if ([13, 27, 38, 40].indexOf(evt.keyCode) !== -1) {
                    var list = getActiveList(this);
                    if(evt.keyCode === 13 && evt.metaKey === false && list.getSelection().length === 0 && list.getCount()) {
                        list.setSelection([0]);
                    } else if(evt.keyCode === 27 && Event.eventModifiersMatch(evt, [])) {
                    	if(scope.q.getValue() === "") {
							const now = Date.now(), last = this.vars("last_27");
							if(last && now - last < 200) {
								this.setTimeout("destroy", () => this.destroy(), 64);
							}
							this.vars("last_27", now);
                    	}
		                scope.q.setValue("");
		                scope.q.fire("onChange", [true]); // FIXME
                    }

                    if (list.isVisible()) {
                        list.dispatch(name, evt);
                    }
                    evt.preventDefault();
                }
            }
        }
        return this.inherited(arguments);
    },
	onLoad() { 
		const alias = (forkey) => ({ get: function() { return this[forkey]; } });
		
		LOGGING && this.print("logging alphaview.load", {
			uri: this.getUri(),
			vars: this.vars()
		});
		this.qsa("#load").execute(); 
		this.vars("history", []);
		this.vars("ctx", Object.create(null, {
			selection: { get: () => {
				var list = getActiveList(this);
				var selection = list.getSelection(true);
				var filtered = this.qs("#q").getValue().length > 0;
				if(selection.length === 0) {
					selection = list.getSource()[filtered ? '_arr' : '_array'];
				}
				
				if (!selection || selection.length === 0) {
					throw new Error("No selection available");
				}
				
				return selection;				
			} },
			sel: { get() {
				var selection = this.selection;

				if (!selection || selection.length === 0) {
					throw new Error("No selection available");
				}
				
				return selection;				
			} },
			ws: { get: () => this.app().qs("devtools/Workspace<>:root:visible:selected") }
		}));

		const list = this.qs("#list");
		installListColumnVisibilitySync(this, list);
		
		return this.inherited(arguments);
	}
}, [
	["Executable", ("load"), {
		// visible: false,
		on(evt) {
			var sel, cons = (evt && evt.cons) || this.vars(["console"]);
			sel = (evt && evt.sel) || (!(evt && evt.cons) && this.vars(["sel"]));
			LOGGING && this.print("logging alphaview.load.execute", {
				evt: evt,
				hasConsole: cons instanceof Console,
				hasSelection: sel instanceof Array ? sel.length : !!sel
			});
			
			this.ud("#button-refresh").set("visible", cons instanceof Console);
			
			const keys = cons ? cons.getNode().qsa(".node.selected").map(node => {
				const key = node.qs(".key"), content = key && key.textContent;
				if(content) {
					if(content.startsWith("/* ")) {
						return content.substring(3, content.indexOf(" */"));
					}
					return content.replace(/: $/, "");
				}
				return "";
			}) : [];
			
			const now = this.vars("now", Date.now());

			if(!cons && !sel) {
				var ws = this.up("devtools/Workspace<>");
				if(ws) {
					cons = ws.down("#left-sidebar < #console #console");
					sel = (cons && cons.sel) || [];
				} else {
					cons = this.app().qs("#console #console");
				}
				if(cons) {// && cons.isVisible()) {
					sel = cons.sel || [];
				} else {
					sel = this.app().down("vcl/ui/Console#console").sel || [];
				}
			} else if(!sel && (cons && cons.sel && cons.sel.length > 1)) {
				const selectionKeys = uniqueSelectionKeys(keys);
				
				const wait = () => this.setTimeout("waiting", () => {
					if(now === this.vars("now")) {
						this.ud("#q").set("placeholder", "waiting for promises...");
					}
					wait();
				} , 500);

				sel = [
					Promise.allSettled(cons.sel.map(o => Promise.resolve(o)))
						.then(values => values.reduce((t, o, i) => { 
							t[selectionKeys[i] || js.sf("selection %d", i + 1)] = o.value instanceof Array ? o.value : [o.value]; return t; }, {}))
						.then(_ => {
							this.setTimeout("waiting", () => {}, 0);
							this.ud("#q").set("placeholder", "");
							return _;
						})
				];
				
				wait();
			} else {
				sel = sel || cons.sel || [];
			}
			
			if(!evt || !evt.leaveTabs) {
				this.ud("#tabs").destroyControls();
			}
			const tabs = this.ud("#tabs");
			tabs.setVisible(tabs.getControlCount() > 0);
			this.ud("#q").setPlaceholder(keys.length === 1 ? keys.join(", ") : this.vars(["placeholder"]) || "");
			LOGGING && this.print("logging alphaview.load.resolved", {
				selectionCount: sel && sel.length,
				keys: keys,
				leaveTabs: evt && evt.leaveTabs
			});
			this.ud("#reflect").execute(sel);
		}
	}],
	["Executable", ("reflect"), {
		on(sel) {
			var root = this._owner;
			var value = sel instanceof Array ? sel[sel.length - 1] : undefined;
			var list = root.qs("#list");
			LOGGING && this.print("logging alphaview.reflect.execute", {
				selectionCount: sel instanceof Array ? sel.length : undefined,
				valueType: value === null ? "null" : value instanceof Array ? "array" : typeof value
			});

			// list.setCount(0);
			list._source.setBusy(true);
			return Promise.resolve(value).then(value => {
				this.vars("value", value);
	
				const tx = (value) => this.applyVar("devtools/Alphaview<> #reflect:transform", [value]);
				
				if(value instanceof Array) {
// list.show();
// root.qs("#array").setArray([]);
					const txd = tx(value);
					root.qs("#array").setArray(txd || value);
					LOGGING && this.print("logging alphaview.reflect.array", {
						length: value.length,
						transformed: !!txd
					});
	
				} else if(value !== null) {
					if(typeof value === "object") {
						var src = [], values = Object.values(value);
						if(values.length && values.every(value => value instanceof Array)) {
							src.push(["Tab", {
								textReflects: "innerHTML",
								text: js.sf("<small>(%d)</small>", values.flat().length), 
								vars: { array: values.flat(), key: "" }
							}]);
								
							for(var ft in value) {
								src.push(["Tab", { 
									textReflects: "innerHTML",
									text: js.sf("%H <small>(%d)</small>", nameOf(ft), value[ft].length), 
									vars: { array: tx(value[ft]) || value[ft], key: ft }
								}]);
							}
						}
		
						if(src.length) {
							B.i(["Container", src]).then(c => {
								var tabs = root.qs("#tabs");
								var dest = tabs._controls || [];
								LOGGING && this.print("logging alphaview.reflect.tabs", {
									tabCount: src.length,
									reused: src.length === dest.length
								});
	
								if(src.length === dest.length) {
		
									dest.forEach((t, i) => t.set(src[i][1]));
									tabs.dispatch("change", tabs.getSelectedControl(1), null, { updateList: false });
	
								} else {
									tabs.destroyControls();
									tabs.clearState("acceptChildNodes");
		
									[].concat(c._controls).forEach(tab => tab.setParent(tabs));
		
									tabs.setState("acceptChildNodes", true);
									tabs._controls[tabs._controls.length > 1 ? 1 : 0].setSelected(true);
								}
	
								tabs.show();
								root.qs("#bar").show();
							});
						} else {
							// root.qs("#tabs").hide();
							// root.qs("#bar").hide();
							// root.qs("#tabs").destroyControls();
	
							var arr = [];
							// for(var k in value) arr.push({key:k, value:value[k]});\
							js.keys(value).forEach(k => arr.push({key: k, value: value[k]}));
							root.qs("#array").setArray(arr.sort((i1, i2) => i1.key < i2.key ? -1 : 1));
							LOGGING && this.print("logging alphaview.reflect.object", {
								keyCount: arr.length
							});
						}
// list.show();
// root.qs("#array").setArray(Object.values(value));

					} else if(typeof value === "function") {
						// root.qs("#ace").show();
					}
					root.qs("#status").render();
					root.qs("#list").render_();
				}
				LOGGING && this.print("logging alphaview.reflect.resolved", {
					valueType: value === null ? "null" : value instanceof Array ? "array" : typeof value
				});
			})
			.finally(() => list._source.setBusy(false));
		}
	}],
	["Executable", ("refresh"), {
		on(evt) {
			LOGGING && this.print("logging alphaview.refresh.execute", {
				evt: evt,
				delegate: evt.altKey === true ? "#load" : "#reflect"
			});
			this.ud("#list").render_(true);
			
			const delegate = this.ud(evt.altKey === true ? "#load" : "#reflect");
			return delegate.execute(evt);
		}
	}],
	["Executable", ("view-source"), {
		// content: locale(""), // TODO like $p introduce some locale feature, just like require is rewired all the time
		content: "View As... <i class='fa fa-caret-down'></i>", 
		on() {
			
		}
	}],
	["Executable", ("back"), {
		enabled: false,
		on() {
			var history = this.vars(["history"]);
			LOGGING && this.print("logging alphaview.back.execute", {
				historyDepth: history.length
			});
			// var value = history.pop();
			// this.ud("#q").setValue(value.pop());
			// value = value.pop();
			var entry = history.pop();
			if(entry) {
				// this.ud("#array").setArray([]);
				// this.nextTick(() => this.ud("#array").setArray(value));
				restoreHistoryEntry(this._owner, entry);
				LOGGING && this.print("logging alphaview.back.restored", entry);
			}
			this.setEnabled(history.length > 0);
		}
	}],
	["Executable", ("do-forward"), {
		on(evt) {
			const list = getActiveList(this._owner);
			const sel = list.getSelection(true);
			LOGGING && this.print("logging alphaview.forward.execute", {
				selectionCount: sel.length,
				ctrlKey: evt.ctrlKey === true
			});

			if(evt.ctrlKey === true) {
				return this.ud("#open").execute(evt);
			}

			if(sel.length) {
				let nsel;
				if(Object.keys(sel[0]).length === 2 && sel[0].hasOwnProperty("key") && sel[0].hasOwnProperty("value")) {
					nsel = sel.map(o => o.value);
				} else {
					nsel = sel;
				}
				
					if(nsel !== undefined) {
						const history = list.vars(["history"]);
					// history.push([list._source._array, q.getValue()]);
					history.push(captureHistoryEntry(this._owner));
					
					clearFilter(this);

						this._owner.qs("#back").setEnabled(true); 
						this.ud("#bar").show();
						LOGGING && this.print("logging alphaview.forward.resolved", {
							nextSelectionCount: nsel.length,
							drilldownType: nsel.length === 1 && nsel[0] && typeof nsel[0] === "object" ? "object" : "selection"
						});
						
						if(!(nsel instanceof Array)) {
							nsel = [nsel];
					} 

					if(nsel.length === 1 && typeof nsel[0] === "object" && nsel[0] !== null) {
						nsel = Object.keys(nsel[0]).map(key => ({key: key, value: nsel[0][key]}));
					}

					pushNavigationList(this._owner, nsel);
					return nsel;
				}
			}
		}
	}],
	["Executable", ("forward"), {
		content: "&gt;",
		parent: "do-forward",
		parentExecute: true,
		visible: false
	}],
	["Executable", ("refresh-presets"), {
		on() { renderPresets(this.ud("#presets")); }
	}],
	["Executable", ("focus-q"), {
		hotkey: "MetaCtrl+191",
		on() { this.ud("#q").setFocus(); }
	}],
	
	["Executable", ("toggle-empty-columns"), {
		hotkey: "Shift+Ctrl+U",
		on() {
			if(this.ud("#q").isFocused()) {
				const list = this.ud("#list");
				const hideEmptyEnabled = list.vars("autoColumns.hideEmptyForced") === true ||
					list.vars("autoColumns.emptyColumnsHidden") > 0;
				
				if(hideEmptyEnabled) {
					list.vars("autoColumns.hideEmpty", false);
					list.vars("autoColumns.hideEmptyForced", false);
					showAllColumns(list);
				} else {
					list.vars("autoColumns.hideEmpty", true);
					list.vars("autoColumns.hideEmptyForced", true);
					hideEmptyColumns(list);
				}
				this.ud("#status").render();
			}
		}
	}],
	["Executable", ("print"), {
		parent: "forward",
		visible: "parent",
		enabled: "parent",
		hotkey: "MetaCtrl+Enter|Shift+MetaCtrl+Enter",
		on(evt) {
			const ctx = this.vars(["ctx"]);

			const ws = (!evt.shiftKey && this.up("devtools/Workspace<>:root:selected")) || this.app();
			const q = this.ud("#q"), list = this.ud("#list");
			const sel = list.getSelection(true);
			const tabs = this.ud("#tabs");
			const tab = tabs.getSelectedControl(1);
			
			const label = q.getValue() || (tab && tab.vars("key")) || q.getPlaceholder();
			const value = sel.length === 1 ? sel[0] : list.getSource().getArray().slice(0)
			
			ws.print(label, value);
		}
	}],
	
	["Array", ("array"), { 
		vars: {
			match(obj, q, context) {
				const invert = q.charAt(0) === "!";

				q = q.toLowerCase();
				if(invert) {
					q = q.substring(1);
				}
				if(typeof obj ==="string") {
					q = obj.toLowerCase().includes(q);
					return invert ? !q : q;
				}
				for(var k in obj) {
					if(js.sf("%n", obj[k]).toLowerCase().includes(q)) {
						return invert ? false : true;
					}
				}
				return invert ? true : false;
			},
			match_columns(obj, q, context, row) {
				var column, value, invert;

				if((invert = q.charAt(0) === "!")) {
					q = q.substring(1);
				}
				
				if(q.indexOf(":") === -1) {
					q = q.toLowerCase();
					
					for(var i = 0, n = context.list.getColumnCount(); i < n; ++i) {
						column = context.list.getColumn(i);
						value = context.list.valueByColumnAndRow(column, row);
						
						if(value instanceof Array) {
							value = value.findIndex(v => js.sf("%n", v).toLowerCase().includes(q)) !== -1;
							
							return invert ? !value : value;
						}

						if(js.sf("%n", value).toLowerCase().includes(q)) {
							return invert ? false : true;
						}
					}
					return invert ? true : false;
				} else {
					q = q.split(":");
					column = context.columns[q[0]] || (context.columns[q] = context.list.getColumnByName(q[0]));
					if(column) {
						value = context.list.valueByColumnAndRow(column, row);

						if(value instanceof Array) {
							value = value.findIndex(v => js.sf("%n", v).toLowerCase().includes(q)) !== -1;
							
							return invert ? !value : value;
						}
						
						if(js.sf("%n", value).toLowerCase().includes(q[1])) {
							return invert ? false : true;
						}
					}
					return invert ? true : false;
				}
			}
		},
		onFilterObject(obj, row, context) {
			var q = this.vars("q");
			var match = this.vars("match") || this.vars("match_columns");

			if(!context.list) {
				context.list = this.ud("#list");
				context.columns = {};
			}
		
			// No query => keep everything (i.e. do NOT filter out)
			if(!q) return false;
		
			var parts = q.split(/(?<!\\)\s/).map(
				s => s.split(/(?<!\\)\=/).map(s => String.unescape(s))
			);
		
			for(var i = 0; i < parts.length; ++i) {
				var part = parts[i];
		
				// key=value (optionally value prefixed with !)
				if(part.length === 2) {
					var k = getMatchingKey(part[0], obj);
					var v = (part[1] || "").trim().toLowerCase();
		
					var inverse = v.charAt(0) === "!";
					if(inverse) v = v.substring(1);
		
					var hay = obj.hasOwnProperty(k) ? js.sf("%s", obj[k]).toLowerCase() : "";
					var contains = v ? (hay.indexOf(v) !== -1) : true;
		
					// AND semantics with inverted return:
					// - normal: must contain; if not => filter out (true)
					// - inverse: must NOT contain; if it does => filter out (true)
					if(!inverse) {
						if(!contains) return true;
					} else {
						if(contains) return true;
					}
		
				// plain term: must match somewhere; if not => filter out (true)
				} else {
					var term = (part[0] || "");
					var inverse = term.charAt(0) === "!";
					if(inverse) term = term.substring(1);

					if(!inverse) {
						if(term && !match(obj, term, context, row)) return true;
					} else {
						if(term && match(obj, term, context, row)) return true;
					}

				}
			}
		
			// All clauses passed => keep (do NOT filter out)
			return false;
		},
		onUpdate() {
			this.ud("#status").render();
		},
		onGetAttributeValue(name, index, value) { 
			return (this._arr[index] || {})[name]; 
		}
	}],
	["Bar", ("bar") , { onDblClick() { this.ud("#load").toggle("visible"); } }, [
		["Group", ("left"), [
			["Button", ("button-back"), { 
				action: "back",
				content: "&lt;"
			}],
			["Button", ("button-refresh"), {
				action: "refresh",
				content: "<i class='fa fa-refresh'></i>"
			}],
			["Button", ("button-forward"), { action: "forward" }],
			["Button", ("button-open"), { action: "print" }]
		]],
		["Element", ("presets"), {
			visible: false,
			onLoad() { renderPresets(this); }
		}],
		["Input", ("q"), { 
			placeholder: "Filter (⌘/)", 
			onChange() {
				var list = getActiveList(this._owner);
				var array = list.getSource();
				LOGGING && this.print("logging alphaview.filter.change", {
					value: this.getValue()
				});
			
				this.setTimeout("updateFilter", () => {
					var parsed = parseFilterAndAttributes(this.getValue());
					var q = parsed.q;
					var attrs;
			
					var previous = this.vars("previous");
					var signature = js.sj({
						q: q,
						hasAttrsSpec: parsed.hasAttrsSpec,
						allColumns: parsed.allColumns,
						attrs: parsed.attrs
					});
			
					if(previous === signature && q !== "") {
						return;
					}
					this.vars("previous", signature);
			
					array.vars("q", q);
					array.updateFilter();
					list.vars("autoColumns.showingAll", false);

					if(parsed.hasAttrsSpec) {
						// Explicit column instruction from the input
						attrs = parsed.allColumns ? null : parsed.attrs;
						applyVisibleColumns(list, attrs);
					} else {
						// No valid column instruction in the input:
						// fall back to remembered/default visible columns,
						// otherwise hide empty columns for reasonably sized data.
						applyDefaultColumnVisibility(list);
					}

					this.ud("#status").render();
				}, 250);
			}
		}],
		["Group", ("right"), [
			// ["Button", { action: "view-source" }],
			["Group", ("export"), [
				
			]],
		["Element", ("status"), { 
				content: "-",
				onClick(evt) {
					var target = evt.target;
					var toggle = target && (target.closest ? target.closest(".alphaview-column-visibility-toggle") : target.up(".alphaview-column-visibility-toggle", true));

					if(toggle && this.getNode().contains(toggle)) {
						toggleEmptyColumnVisibility(this.ud("#list"));
						this.render();
					}
				},
				onRender() {
					this.setTimeout(() => {
						var arr = getActiveList(this._owner).getSource(), status = [];
						if(arr._array) {;
						
							var total = arr._array.length;
							var filtered = this.ud("#q").getValue().length > 0 ? (arr._arr||[]).length : 0;
							var selected = this.ud("#list").getSelection().length;
							var columns = getListColumns(this.ud("#list"));
							var hiddenColumns = columns.filter(function(column) { return !column.isVisible(); }).length;
							
							selected && status.push(js.sf("%s (%d%%) selected", selected, selected/total*100));
							filtered && status.push(js.sf("%d (%d%%) filtered", filtered, filtered/total*100));
							if(hiddenColumns || this.ud("#list").vars("autoColumns.showingAll")) {
								status.push(js.sf("<span class=\"alphaview-column-visibility-toggle\" title=\"Show or hide empty columns\">%d %s hidden</span>", hiddenColumns, hiddenColumns === 1 ? "column" : "columns"));
							}
							status.push(js.sf("%d %s", total, status.length ? "total" : "items"));
						} 						
						this.getNode().innerHTML = status.join(" / ");
					}, 250);
				}
			}]
		]],
		
		["Radiobutton", ("opt-and"), {
			visible: false, // not=working=yet
			label: "AND", groupIndex: 1
		}],
		["Radiobutton", ("opt-or"), {
			visible: false, // not=working=yet
			checked: true, groupIndex: 1,
			label: "OR"
		}],
		["Checkbox", ("check-exact-case"), {
			visible: false, // not=working=yet
			label: "Exact case",
			checked: false
		}]

	]],
	["List", ("list"), { 
		autoColumns: true,
		classes: "max-width-320",
		css: { 
			"&.max-width-500 :not(.details)": {
				"&.autowidth": "max-width: 500px;", 
				"&.ListCell": "max-width: 512px;"
			},
			"&.max-width-750 :not(.details)": {
				"&.autowidth": "max-width: 500px;", 
				"&.ListCell": "max-width: 512px;"
			},
			"&.max-width-320 :not(.details)": {
				"&.autowidth": "max-width: 320px;", 
				"&.ListCell": "max-width: 332px;"
			},
			".ListCell.alphaview-alt-cell": "cursor: pointer; text-decoration: underline;",
			// '.ListCell:hover': "cursor: pointer; text-decoration: underline;",
			'.{ListColumn}': { ':active': "font-weight:bold;" },
			'.{ListHeader}': { 
				'': "background-color:transparent;transition:background-color 0.5s ease 0s;", 
				':active': "background-color: gold;", //rgb(56, 121, 217);" } 
				'&.scrolled': "background-color:rgba(255,255,255,0.75);"
			}
		},
		source: "array", 
		// visible: false, 

		// _vars: {
		// 	_lastMouseDownTime: 0,
		// 	_clickStreak: 0,
		// 	_noSelectArmed: false
		// },

		onColumnGetValue(column, value, row, source) {
			if(value instanceof Date) return value;
			if(value instanceof Array && value.every(function(item) { return typeof item === "string"; })) {
				return value.join(", ").substring(0, 1024);
			}
			var objectContentKey = this.vars(["presentation.objectContentKey"]);
			if(objectContentKey && value && typeof value === "object" &&
				Object.prototype.hasOwnProperty.call(value, objectContentKey)) {
				return js.sf("%n", value[objectContentKey]).substring(0, 1024);
			}
			return js.sf("%n", value).substring(0, 1024);
		},
		onSelectionChange() {
			LOGGING && this.print("logging alphaview.selection.change", {
				selectionCount: this.getSelection().length
			});
			this.ud("#status").render();
			this.ud("#forward").setVisible(this.getSelection().length > 0);
		},
		onDispatchChildEvent(component, name, evt, f, ms) {
			if(name === "mousemove") {
				updateAltCellHover(this, evt);
				} else if(name === "mouseleave" || (name === "mouseout" && !(evt.relatedTarget && this.getNode().contains(evt.relatedTarget)))) {
				updateAltCellHover(this, null);
			} else if(name === "click" && evt.altKey === true && listCellContext(this, evt)) {
				this.clearTimeout("clicked");
				evt.preventDefault && evt.preventDefault();
				evt.stopPropagation && evt.stopPropagation();
				activateAlphaviewCell(this, evt, true);
				return false;
			}
			if(name === "dblclick" && component instanceof ListColumn) {
				LOGGING && this.print("logging alphaview.column.dblclick", {
					column: component._attribute
				});
				this.setTimeout("clicked", () => {
				var arr = this._source._arr.map(_ => js.mixIn({'_' : _}, _ && _[component._attribute]));
				var history = this.vars(["history"]);
				// history.push([this._source._array, this.ud("#q").getValue()]);
				history.push(captureHistoryEntry(this._owner));
				
				clearFilter(this._owner);
				pushNavigationList(this._owner, arr.filter(_ => _ !== undefined));
					LOGGING && this.print("logging alphaview.column.drilldown", {
						column: component._attribute,
						count: arr.filter(_ => _ !== undefined).length
					});

					this._owner.qs("#back").setEnabled(true); this.ud("#bar").show();
				
			});
		} else if(name === "click") {
			this.setTimeout("clicked", () => {
				if(this._columns && this._columns.includes(component)) {
					if(this.vars("sorted-by") !== component) {
						this.vars("sorted-by", component);
						dir = this.vars("sorted-by-dir", "asc");
					} else {
						dir = this.vars("sorted-by-dir", this.vars("sorted-by-dir") === "asc" ? "desc" : "asc");
					}
					this.sortBy(component, dir);
				}
			}, 300);
		}
			
		},
			onDblClick(evt) { 
				this.clearTimeout("click");
				if(evt.altKey === true) {
					window.getSelection().removeAllRanges();
					return false;
				}

				if(listCellContext(this, evt)) {
					activateAlphaviewCell(this, evt, false);
				}
			
			window.getSelection().removeAllRanges();
		},
		onScroll() {
// console.log("onScroll", arguments)
			var hasClass = this._header.hasClass("scrolled");
			var scrollTop = this._nodes.body.scrollTop;
			if(scrollTop > 20) {
				!hasClass && this._header.addClass("scrolled");
			} else {
				hasClass && this._header.removeClass("scrolled");
			}
			this.ud("#list")._nodes.body.scrollTop = scrollTop;
		}
	}],
	["Tabs", ("tabs"), {
		visible: false,
		onChange(newTab, oldTab, opts) {
			LOGGING && this.print("logging alphaview.tabs.change", {
				newTab: newTab && newTab.vars("key"),
				oldTab: oldTab && oldTab.vars("key"),
				opts: opts
			});
			var list = this.scope().list;
			var n = list.nodeNeeded();
			
			if(oldTab !== null) {
				oldTab.vars("scrollInfo", [n.scrollLeft, n.scrollTop]);
				// console.log("scrollInfo", oldTab.vars().scrollInfo);
			}
			this.ud("#array").setArray([]);
			this.setTimeout("change", () => {
				if(newTab !== null) { 
					var array = this.ud("#array"), list = this.ud("#list");
					var n = list.nodeNeeded();
					var cur_length = array.getSize();
					
					var arr = newTab.vars("array");
					if(arr.length === 1 && this.vars(["presentation.singleton"]) !== "table") {
						arr = Object.keys(arr[0]).map(key => ({key: key, value: arr[0][key]}));
					}
					
					array.setArray(arr);

					opts = opts || {};
					if(cur_length === 1 || arr.length === 1 || opts.updateList !== false) {
						// list.destroyColumns();
						// list.updateColumns();
						updateList(list);

						this.setTimeout("change", () => {
							var si = newTab.vars("scrollInfo");
							si && (n.scrollLeft = si[0]);
							si && (n.scrollTop = si[1]);
						}, 200);
					}
					
					
					this.ud("#status").render();
				}
			}, 50);
		}
	}]
]];
