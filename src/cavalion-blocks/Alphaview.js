"use vcl/ui/Console, vcl/ui/ListColumn, util/Event";

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
var Event = require("util/Event");
var Console = require("vcl/ui/Console");
var Control = require("vcl/Control");

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

var css = {
	"#bar": "text-align: center;",
	"#bar > *": "margin-right:5px;",
	"#bar input": "font-size:12pt;width:50%; border-radius: 5px; border-width: 1px; padding: 2px 4px; border-color: #f0f0f0;",
	"#bar #left": "float:left;", 
	"#bar #right": "float:right; direction: rtl;",
	'#status': "direction: ltr;"
	// "#bar #right > .{Button}": "float:right;"
};

["Container", (""), { 
	activeControl: "q", css: css, 
    onDispatchChildEvent: function (component, name, evt, f, args) {
        if (name.startsWith("key")) {
        	
			if(evt.code === "BracketLeft" && evt.altKey === true) {
            	this.qs("#back").go();
            	evt.preventDefault();
            } else if(evt.code === "BracketRight" && evt.altKey === true) {
            	this.qs("#forward").go();
            	evt.preventDefault();
            }
            
            var scope = this.scope();
            if (component === scope.q) {
                if ([13, 27, 38, 40].indexOf(evt.keyCode) !== -1) {
                    var list = scope.list;
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
		
		this.qsa("#load").execute(); 
		this.vars("history", []);
		this.vars("ctx", Object.create(null, {
			selection: { get: () => {
				var selection = this.qs("#list").getSelection(true);
				var filtered = this.qs("#q").getValue().length > 0;
				if(selection.length === 0) {
					selection = this.qs("#array")[filtered ? '_arr' : '_array'];
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
		list.override("notifyEvent", (event, data) => {
			// this.print("notifyEvent-" + event, data);
			if(event === "columnsChanged") {
				this.setTimeout("update", () => {
					let columns; (columns = this
						.qsa("vcl/ui/ListColumn"))
						.filter(_ => _._attribute === "_")
						.map(_ => _.set("index", 0));

					list.syncClasses(
						["max-width-320", "max-width-500", "max-width-750"],
						[columns.length > 6, columns.length > 3 && columns.length <= 6, columns.length <= 3]
					);
					
				}, 200);
			}
		});
		
		return this.inherited(arguments);
	}
}, [
	["Executable", ("load"), {
		// visible: false,
		on(evt) {
			var sel, cons = (evt && evt.cons) || this.vars(["console"]);
			sel = (evt && evt.sel) || (!(evt && evt.cons) && this.vars(["sel"]));
			
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
				
				const wait = () => this.setTimeout("waiting", () => {
					if(now === this.vars("now")) {
						this.ud("#q").set("placeholder", "waiting for promises...");
					}
					wait();
				} , 500);

				sel = [
					Promise.allSettled(cons.sel.map(o => Promise.resolve(o)))
						.then(values => values.reduce((t, o, i) => { 
							t[keys[i]] = o.value instanceof Array ? o.value : [o.value]; return t; }, {}))
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
			this.ud("#tabs").set("visible", true);//sel.length > 1);
			this.ud("#q").setPlaceholder(keys.length === 1 ? keys.join(", ") : this.vars(["placeholder"]) || "");
			this.ud("#reflect").execute(sel);
		}
	}],
	["Executable", ("reflect"), {
		on(sel) {
			var root = this._owner;
			var value = sel instanceof Array ? sel[sel.length - 1] : undefined;
			var list = root.qs("#list");

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
							}
// list.show();
// root.qs("#array").setArray(Object.values(value));

						} else if(typeof value === "function") {
							// root.qs("#ace").show();
						}
						root.qs("#status").render();
						root.qs("#list").render_();
					}
				})
				.finally(() => list._source.setBusy(false));
		}
	}],
	["Executable", ("refresh"), {
		on(evt) {
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
			var value = history.pop();
			this.ud("#q").setValue(value.pop());
			value = value.pop();
			if(value) {
				this.ud("#array").setArray([]);
				this.nextTick(() => this.ud("#array").setArray(value));
			}
			this.setEnabled(history.length > 0);
			this.ud("#list").destroyColumns();
			this.ud("#list").updateColumns();
		}
	}],
	["Executable", ("do-forward"), {
		on(evt) {
			const list = this.ud("#list");
			const sel = list.getSelection(true);

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
					const history = list.vars(["history"]), q = this.ud("#q"), array = this.ud("#array");
					history.push([list._source._array, q.getValue()]);
					
					// q.setValue("");
					q.getNode().value = "";
					q._value = "";
					array.vars("q", "");
					array.updateFilter();
					this.ud("#status").render();

					this.ud("#back").setEnabled(true); 
					this.ud("#bar").show();
					
					if(!(nsel instanceof Array)) {
						nsel = [nsel];
					} 

					if(nsel.length === 1 && typeof nsel[0] === "object" && nsel[0] !== null) {
						nsel = [Object.keys(nsel[0]).map(key => ({key: key, value: nsel[0][key]}))];
					} else {
						nsel = [nsel];
					}
					
					list.destroyColumns();
					
					return this.ud("#load").execute({ sel: nsel, leaveTabs: true });
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
	["Executable", ("focus-q"), {
		hotkey: "MetaCtrl+191",
		on() { this.ud("#q").setFocus(); }
	}],
	
	["Executable", ("toggle-empty-columns"), {
		hotkey: "Shift+Ctrl+U",
		on() {
			if(this.ud("#q").isFocused()) {
				const list = this.ud("#list");
				const columns = list.getColumns();
				const objs = list.getSource().getObjects();
				
				columns.forEach(column => column.setVisible(objs.some((obj, row) => list.valueByColumnAndRow(column, row))));
			}
		}
	}],
	["Executable", ("print"), {
		parent: "forward",
		visible: "parent",
		enabled: "parent",
		on(evt) {
			const ctx = this.vars(["ctx"]);

			const ws = (!evt.shiftKey && this.up("devtools/Workspace<>:root:selected")) || this.app();
			const q = this.ud("#q"), list = this.ud("#list");
			const sel = list.getSelection(true);
			const tabs = this.ud("#tabs");
			const tab = tabs.getSelectedControl(1);
			
			const label = q.getValue() || (tab && tab.vars("key")) || q.getPlaceholder();
			const value = sel.length === 1 ? sel[0] : list.getSource().getArray();
			
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
			var q = this.vars("q"), match = this.vars("match") || this.vars("match_columns");
		
			if(!context.list) {
				context.list = this.ud("#list");
				context.columns = {};
				context.q = q ? q.split(" ") : [""];
			}

			if(!q) return false;
			
			var parts = q.split(/(?<!\\)\s/).map(
					s => s.split(/(?<!\\)\=/).map(s => String.unescape(s)));
			
			while(parts.length) {
				var part = parts.pop();
				if(part.length === 2) {
					var k = getMatchingKey(part[0], obj), v = part[1].trim().toLowerCase(), inverse = false;
					if((inverse = v.charAt(0)) === "!") {
						v = v.substring(1);
					}
					if(obj.hasOwnProperty(k) && js.sf("%s", obj[k]).toLowerCase().indexOf(v) !== -1) {
						return false;
					}
				} else {
					return !match(obj, part[0]);
					// return context.q.some(q => q ? !(match(obj, q, context, row)) : false);
				}
			}
			
			return true;//!parts.length ? false : !match(obj, parts[0]);
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
		["Input", ("q"), { 
			placeholder: "Filter (⌘/)", 
			onChange() { 
				var array = this.ud("#array");
				this.setTimeout("updateFilter", () => {
					array.vars("q", this.getValue());
					array.updateFilter();
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
				onRender() {
					this.setTimeout(() => {
						var arr = this.ud("#array"), status = [];
						if(arr._array) {;
						
							var total = arr._array.length;
							var filtered = this.ud("#q").getValue().length > 0 ? (arr._arr||[]).length : 0;
							var selected = this.ud("#list").getSelection().length;
							
							selected && status.push(js.sf("%s (%d%%) selected", selected, selected/total*100));
							filtered && status.push(js.sf("%d (%d%%) filtered", filtered, filtered/total*100));
							status.push(js.sf("%d %s", total, status.length>1 ? "total" : "items"));
						}						
						this.setContent(status.join(" / "));
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
		action: "do-forward",
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
		onColumnGetValue(column, value, row, source) {
			if(value instanceof Date) return value;
			return js.sf("%n", value).substring(0, 1024);
		},
		onSelectionChange() {
			this.ud("#status").render();
			this.ud("#forward").setVisible(this.getSelection().length > 0);
		},
		onDispatchChildEvent(component, name, evt, f, ms) {
			if(name === "dblclick" && component instanceof ListColumn) {
				this.setTimeout("clicked", () => {
					var arr = this._source._arr.map(_ => js.mixIn({'_' : _}, _ && _[component._attribute]));
					var history = this.vars(["history"]);
					history.push([this._source._array, this.ud("#q").getValue()]);
					
					// clearQ(this);
					const q = this.ud("#q"), array = this.ud("#array");
					q.getNode().value = "";
					q._value = "";
					array.vars("q", "");
					array.updateFilter();
					this.ud("#status").render();
					
					array.setArray(null);
					array.setArray(arr.filter(_ => _ !== undefined));

					this.ud("#back").setEnabled(true); this.ud("#bar").show();
					
					this.ud("#list").destroyColumns();
					this.ud("#list").updateColumns();
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

			const cell = evt.target.soup(".ListCell");
			if(evt.target.matches(".ListCell")) {
				const row = Control.findByNode(cell.parentNode);
				const index = Array.from(cell.parentNode.childNodes).indexOf(cell);
				const column = this._header.getControls()[index];
				let value;
				
				// if(evt.altKey === true) {
					value = this._source.getAttributeValue(evt.altKey ? column._attribute : ".", row._rowIndex, true);
					if(value.value && value.key && Object.values(value).length === 2) {
						value = value.value;
					}
				// } else {
					// value = this._source.getObject(row);					
				// }
				
				if(value instanceof Array && value.length === 1) {
					value = value[0];
				}
				
				var history = this.vars(["history"]);
				history.push([this._source._array, this.ud("#q").getValue()]);
				
				this.ud("#array").setArray(null);
				this.ud("#array").setArray(value instanceof Array ? value : Object.keys(value).map(k => ({ key: k, value: value[k] })));
				this.ud("#back").setEnabled(true); this.ud("#bar").show();
				
				this.ud("#list").destroyColumns();
				this.ud("#list").updateColumns();
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
		onChange(newTab, oldTab, opts) {
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
					if(arr.length === 1) {
						arr = Object.keys(arr[0]).map(key => ({key: key, value: arr[0][key]}));
					}
					
					array.setArray(arr);

					opts = opts || {};
					if(cur_length === 1 || arr.length === 1 || opts.updateList !== false) {
						list.destroyColumns();
						list.updateColumns();

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