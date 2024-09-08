"use vcl/ui/Console, vcl/ui/ListColumn, util/Event";

/*- ### 2023/07/20 #focus-q stabilized
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

/*- Object.keys(VO.em.instances)
		.reduce((a, k) => { 
			a[k] = Object.keys(VO.em.instances[k]).map(_ => VO.em.instances[k][_]); 
			return a; 
		}, {})
*/

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

function nameOf(ft) {
	if(/\s/.test(ft) === false) {
		return ft.split(":").pop();
	}
	return ft;	
}

var css = {
	"#bar": "text-align: center;background: #f0f0f0;",
	"#bar > *": "margin-right:5px;",
	"#bar input": "font-size:12pt;width:50%; border-radius: 5px; border-width: 1px; padding: 2px 4px; border-color: #f0f0f0;",
	"#bar #left": "float:left;", "#bar #right": "float:right;"
};

["Container", (""), { 
	css: css, 
    onDispatchChildEvent: function (component, name, evt, f, args) {
        if (name.startsWith("key")) {
            var scope = this.scope();
            if (component === scope.q) {
                if ([13, 27, 38, 40].indexOf(evt.keyCode) !== -1) {
                    var list = scope.list;
                    if(evt.keyCode === 13 && list.getSelection().length === 0 && list.getCount()) {
                        list.setSelection([0]);
                    } else if(evt.keyCode === 27) {
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
		this.qsa("#load").execute(); 
		this.vars("history", []);
		
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
						[columns.length > 6, columns.length > 3 && columns.length <= 6, columns.length === 3]
					);
					
				}, 200);
			}
		});
		
		return this.inherited(arguments);
	}
}, [
	["Executable", ("load"), {
		on(evt) {
			var sel, cons = (evt && evt.cons) || this.vars(["console"]);
			sel = (evt && evt.sel) || (!(evt && evt.cons) && this.vars(["sel"]));
			
			this.ud("#reload").set("visible", cons instanceof Console);
			
			const keys = cons ? cons.getNode().qsa(".node.selected").map(node => {
				const key = node.qs(".key"), content = key && key.textContent;
				if(content) {
					return content.replace(/: $/, "");
				}
				return "";
			}) : [];
			
			const now = this.vars("now", Date.now());

			if(!cons && !sel) {
				var ws = this.up("devtools/Workspace<>");
				if(ws) {
					cons = ws.down("#left-sidebar < #console #console");
					sel = cons.sel || [];
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
					Promise.all(cons.sel.map(o => Promise.resolve(o)))
						.then(values => values.reduce((t, o, i) => { 
							t[keys[i]] = o instanceof Array ? o : [o]; return t; }, {}))
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
			this.ud("#q").setPlaceholder(keys.length === 1 ? keys.join(", ") : "");
			this.ud("#reflect").execute(sel);
		}
	}],
	["Executable", ("reflect"), {
		on(sel) {
			var root = this._owner;
			var value = sel[sel.length - 1];
			
			return Promise.resolve(value).then(value => {
				this.vars("value", value);
				
				if(value instanceof Array) {
					root.qs("#list").show();
					root.qs("#array").setArray(value);
				} else if(value !== null) {
					if(typeof value === "object") {
						var tabs = [], values = Object.values(value);
						if(values.length && values.every(value => value instanceof Array)) {
							tabs.push(["Tab", {
								textReflects: "innerHTML",
								text: js.sf("<small>(%d)</small>", values.flat().length), 
								vars: { array: values.flat(), key: "" }
							}]);
								
							for(var ft in value) {
								tabs.push(["Tab", { 
									textReflects: "innerHTML",
									text: js.sf("%H <small>(%d)</small>", nameOf(ft), value[ft].length), 
									vars: { array: value[ft], key: ft }
								}]);
							}
						}
						
						if(tabs.length) {
							B.i(["Container", tabs]).then(c => {
								var tabs = root.qs("#tabs");
								tabs.destroyControls();
								tabs.clearState("acceptChildNodes");
								[].concat(c._controls).forEach(tab => tab.setParent(tabs));
								tabs.setState("acceptChildNodes", true);
								tabs._controls[tabs._controls.length > 1 ? 1 : 0].setSelected(true);
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
						root.qs("#list").show();

						// root.qs("#array").setArray(Object.values(value));
					} else if(typeof value === "function") {
						// root.qs("#ace").show();
					}
				}
			}).then(_ => {

				root.qs("#list").destroyColumns();
				root.qs("#list").updateColumns();
										
			});
		}
	}],
	["Executable", ("view-source"), {
		// content: locale(""), // TODO like $p introduce some locale feature, just like require is rewired all the time
		content: "View As... <i class='fa fa-caret-down'></i>", 
		on() {
			
		}
	}],
	["Executable", ("print"), {
		hotkey: "MetaCtrl+Enter",
		on(evt) {
			var a = this.ud("#array");
			var q = this.ud("#q");
			var ws = this.up("devtools/Workspace<>");
			var objs = this.ud("#list").getSelection(true);
			var selected = this.ud("#tabs").getSelectedControl(1);
			selected = selected && selected.vars("key");
			
			if(objs.length === 0) {
				ws = null;
				objs = [].concat(a.getObjects());
			} else if(objs.length === 1) {
				objs = objs[0];
			}
			
			(ws || q._owner).print(q.getValue() || selected || "*" , objs);
		}
	}],
	["Executable", ("open"), {
		on(evt) {
			// var selection = this.getSelection(true);
			// this.ud("#print").execute(selection.length === 1 ? selection[0] : selection);
			
			if(evt.shiftKey !== true && evt.metactrlKey !== true) {
				const list = this.ud("#list");
				const sel = list.getSelection(true);
				if(sel.length) {
					let nsel;
					if(Object.keys(sel[0]).length === 2 && sel[0].hasOwnProperty("key") && sel[0].hasOwnProperty("value")) {
						nsel = sel[0].value;
					} else {
						nsel = sel;
					}
					
					if(nsel !== undefined) {
						const history = list.vars(["history"]);
						history.push(list._source._array);
						this.ud("#back").show(); this.ud("#bar").show();
						
						if(!(nsel instanceof Array)) {
							nsel = [nsel];
						} 

						if(nsel.length === 1 && typeof nsel[0] === "object" && nsel[0] !== null) {
							nsel = [Object.keys(nsel[0]).map(key => ({key: key, value: nsel[0][key]}))];
						} else {
							nsel = [nsel];
						}
						
						return this.ud("#load").execute({ sel: nsel, leaveTabs: true });
					}
				}
			}
			this.ud("#print").execute(evt);
		}	
	}],
	["Executable", ("focus-q"), {
		hotkey: "MetaCtrl+191",
		on() { this.ud("#q").setFocus(); }
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
			
			return context.q.some(q => q ? !(match(obj, q, context, row)) : false);
		},
		
		onUpdate() {
			this.ud("#list-status").render();
		},
		onGetAttributeValue(name, index, value) { 
			return (this._arr[index] || {})[name]; 
		}
	}],
	["Bar", ("bar") , { onDblClick() { this.ud("#reload").toggle("visible"); } }, [
		["Group", ("left"), [
			["Button", ("back"), { 
				content: "&lt;",
				visible: false,
				onClick() {
					var history = this.vars(["history"]);
					var value = history.pop();
					if(value) {
						this.ud("#array").setArray([]);
						this.nextTick(() => this.ud("#array").setArray(value));
					}
					this.setVisible(history.length > 0);
					this.ud("#list").destroyColumns();
					this.ud("#list").updateColumns();
				}
			}],
			["Button", ("reload"), {
				action: "load",
				content: "<i class='fa fa-refresh'></i>",
				visible: false
			}]
		]],
		["Input", ("q"), { 
			placeholder: "Filter", 
			onChange() { 
				var array = this.ud("#array");
				this.setTimeout("updateFilter", () => {
					array.vars("q", this.getValue());
					array.updateFilter();
					this.ud("#list-status").render();
				}, 250); 
			} 
		}],
		["Group", ("right"), [
			// ["Button", { action: "view-source" }],
			["Group", ("export"), [
			]],
			["Element", ("list-status"), { 
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
		action: "open",
		autoColumns: true,
		classes: "max-width-320",
		css: { 
			"&.max-width-320": {
				".autowidth": "max-width: 320px;", 
				".ListCell": "max-width: 332px;"
			},
			"&.max-width-500": {
				".autowidth": "max-width: 500px;", 
				".ListCell": "max-width: 512px;"
			},
			"&.max-width-750": {
				".autowidth": "max-width: 500px;", 
				".ListCell": "max-width: 512px;"
			},
			'.{ListColumn}': { ':active': "font-weight:bold;" },
			'.{ListHeader}': { 
				'': "background-color:transparent;transition:background-color 0.5s ease 0s;", 
				':active': "background-color: gold;", //rgb(56, 121, 217);" } 
				'&.scrolled': "background-color:rgba(255,255,255,0.75);"
			}
		},
		source: "array", 
		visible: false, 
		onColumnGetValue(column, value, row, source) {
			if(value instanceof Date) return value;
			return js.sf("%n", value).substring(0, 1024);
		},
// 		onColumnRenderCell(cell, value, column, row, source, orgValue) {
// console.log("onColumnRenderCell", value, arguments);
// 			//(function(cell, value, column, row, source, orgValue) {})	
// 		},
		onSelectionChange() {
			this.ud("#list-status").render();
		},
		onDispatchChildEvent(component, name, evt, f, ms) {
			if(name === "dblclick" && component instanceof ListColumn) {
				this.setTimeout("clicked", () => {
					var arr = this._source._arr.map(_ => js.mixIn({'_' : _}, _[component._attribute]));
					var old = this._source._arr;
					var history = this.vars(["history"]);
					history.push(this._source._array);
					this.ud("#array").setArray(null);
					this.ud("#array").setArray(arr.filter(_ => _ !== undefined));
					this.ud("#back").show(); this.ud("#bar").show();
					
					this.ud("#list").destroyColumns();
					this.ud("#list").updateColumns();
					
				})
			} else if(name === "click") {
				this.setTimeout("clicked", () => {
					if(this._columns && this._columns.includes(component)) {
						if(this.vars("sorted-by") !== component) {
							this.vars("sorted-by", component);
							dir = this.vars("sorted-by-dir", "asc");
						} else {
							dir = this.vars("sorted-by-dir", this.vars("sorted-by-dir") === "asc" ? "desc" : "asc");
						}
						// Promise.resolve(this.ud("#query_load_all").execute())
							// .then(res => 
								this.sortBy(component, dir)
								// )
								;
					}
				}, 300);
			}
		},
		onDblClick() { 
			// var selection = this.getSelection(true);
			// this.open(selection.length === 1 ? selection[0] : selection);
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
	// ["Ace", ("ace"), { visible: false }],
	["Tabs", ("tabs"), {
		onChange(newTab, oldTab) {
			var list = this.scope().list;
			var n = list.nodeNeeded();
			
			if(oldTab !== null) {
				oldTab.vars("scrollInfo", [n.scrollLeft, n.scrollTop]);
				// console.log("scrollInfo", oldTab.vars().scrollInfo);
			}
			this.ud("#array").setArray([]);
			this.setTimeout("change", () => {
				if(newTab !== null) {
					var list = this.ud("#list"), n = list.nodeNeeded();
					var arr = newTab.vars("array");
					
					if(arr.length === 1) {
						arr = Object.keys(arr[0]).map(key => ({key: key, value: arr[0][key]}));
					}
					
					this.ud("#array").setArray(arr);

					list.destroyColumns();
					list.updateColumns();
					
					this.setTimeout("change", () => {
						var si = newTab.vars("scrollInfo");
						si && (n.scrollLeft = si[0]);
						si && (n.scrollTop = si[1]);
					}, 200);
					
					this.ud("#list-status").render();
				}
			}, 50);
		}
	}]
]];