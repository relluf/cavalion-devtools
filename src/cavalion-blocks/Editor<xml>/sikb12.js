"use blocks";
/*- ### 2020-10-02 Console hook - SIKB12 inspired */

function match(obj, q) {
	q = q.toLowerCase();	
	for(var k in obj) {
		if(js.sf("%s", obj[k]).toLowerCase().includes(q)) {
			return true;
		}
	}
	return false;
}
function objectAsTabs() {
	
}

var css = {
	"#bar > *": "margin-right:5px;",
	"#bar input": "border-radius: 5px; border-width: 1px; padding: 2px 4px; border-color: #f0f0f0;"
};

["Container", ("ws-console-hook"), { css: css, onLoad() { this.qsa("#load").execute(); } }, [
	["Executable", ("load"), {
		on() {
			var ws = this.up("devtools/Workspace<>");
			var sel = ws.down("#left-sidebar < #console #console").sel 
					|| 
				app.down("#console #console").sel;
			
			this.ud("#reflect").execute(sel);
		}
	}],
	["Executable", ("reflect"), {
		on(sel) {
			var root = this._owner;
			var value = sel[0];
			
			Promise.resolve(value).then(value => {
				if(value instanceof Array) {
					root.down("#list").show();
					root.down("#array").setArray(value);
				} else if(value !== null) {
					if(typeof value === "object") {
						var tabs = [];
						if(Object.values(value).every(value => value instanceof Array)) {
							for(var ft in value) {
								tabs.push(["Tab", { 
									text: ft.split(":").pop(), 
									vars: { array: value[ft] }
								}]);
							}
						}
						
						if(tabs.length) {						
							B.i(["Container", tabs]).then(c => {
								var tabs = root.down("#tabs");
								tabs.clearState("acceptChildNodes");
								[].concat(c._controls).forEach(tab => tab.setParent(tabs));
								tabs.setState("acceptChildNodes", true);
								tabs._controls[0].setSelected(true)
							});
						}
						
						root.down("#list").show();
						// root.down("#array").setArray(Object.values(value));
					} else if(typeof value === "function") {
						// root.down("#ace").show();
					}
				}
			});
		}
	}],
	["Executable", ("json"), {
		on() {
			
		}
	}],
	["Array", ("array"), { 
		onFilterObject(obj) {
			var q = this.vars("q");
			if(!q) return false;
			return q.split(/\s/).filter(q => q.length > 0).some(q => !match(obj, q));
		}
	}],
	["Bar", ("bar"), {} , [
		// ["Button", { action: "json" }],
		
		["Input", ("q"), { 
			placeholder: "Filter", 
			css: "font-size:12pt;",
			onChange() { 
				var array = this.ud("#array");
				this.setTimeout("updateFilter", () => {
					array.vars("q", this.getValue());
					array.updateFilter();
				}, 250); 
			} 
		}],
		
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
		css: { ".ListCell": "color:red;" },
		visible: false, autoColumns: true,
		source: "array", css: "background-color:white;",
		onDblClick() { 
			var selection = this.getSelection(true);
			this.print(selection.length === 1 ? selection[0] : selection);
		}}],
	["Ace", ("ace"), { visible: false }],
	["Tabs", ("tabs"), {
		onChange(newTab, oldTab) {
			var list = this.scope().list;
			var n = list.nodeNeeded();
			
			if(oldTab !== null) {
				oldTab.vars("scrollInfo", [n.scrollLeft, n.scrollTop]);
				console.log("scrollInfo", oldTab.vars().scrollInfo);
			}
			this.ud("#array").setArray([]);
			this.setTimeout("change", () => {
				if(newTab !== null) {
					var n = this.ud("#list").nodeNeeded();
					this.ud("#array").setArray(newTab.vars("array"));
					this.setTimeout("change", () => {
						var si = newTab.vars("scrollInfo");
						si && (n.scrollLeft = si[0]);
						si && (n.scrollTop = si[1]);
					}, 200);
				}
			}, 50);
		}
	}]
]];
