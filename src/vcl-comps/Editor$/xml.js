"use fast-xml-parser, xml-funcs, veldapps-imsikb/util, vcl/ui/ListColumn";


function match(obj, q) {
	q = q.toLowerCase();	
	for(var k in obj) {
		var v = obj[k];
		if(!(v instanceof Array)) {
			v = [v];
		}
		if(v.some(obj => js.sf("%n", obj).toLowerCase().includes(q))) {
			return true;
		}
	}
	return false;
}

var Blocks = require("blocks");
var Parser = require("fast-xml-parser");
var Xml = require("xml-funcs");
var ListColumn = require("vcl/ui/ListColumn");

/*- TODO `#CLVN-20201024-1` Infra for Editor<xml>-detailViews */
var DetailViews = {
	imsikb0101: 
		["Container", { 
			css: {
				// "#bar > *": "margin-right:5px;",
				// "#bar input": "border-radius: 5px; border-width: 1px; padding: 2px 4px; border-color: #f0f0f0;"
				"#bar": "text-align: center;",
				"#bar > *": "margin-right:5px;",
				"#bar input": "font-size:12pt;width:300px;max-width:50%; border-radius: 5px; border-width: 1px; padding: 2px 4px; border-color: #f0f0f0;",
				"#bar #left": "float:left;", "#bar #right": "float:right;"
			}, 
			onLoad() { 
				// var root = this.up("devtools/Editor<xml>").vars("root");
				var root = this.vars("root");
				var parsed = require("veldapps-imsikb/util").parse(root);
				var tabs = [];
				for(var ent in parsed.entities) {
					tabs.push(["Tab", { 
						textReflects: "innerHTML",
						text: js.sf("%H <small>(%d)</small>", ent.split(":").pop(), 
							parsed.entities[ent].length), 
						vars: { array: parsed.entities[ent] }
					}]);
				}

				this.vars("history", []);

				if(tabs.length) {						
					B.i(["Container", tabs]).then(c => {
						var tabs = this.scope().tabs;
						tabs.clearState("acceptChildNodes");
						[].concat(c._controls).forEach(tab => tab.setParent(tabs));
						tabs.setState("acceptChildNodes", true);
						tabs._controls[0].setSelected(true);
					});
				}
				
				// this.scope().list.show();
				// this.up("devtools/Editor<xml>").vars("root-imsikb0101", parsed);
			},
			visible: false,
			vars: { selected: true }
		}, [
			["Array", ("array"), { 
				onFilterObject(obj) {
					var q = this.vars("q");
					if(!q) return false;
					return q.split(/\s/).filter(q => q.length > 0).some(q => !match(obj, q));
				},
				onUpdate() {
					this.ud("#list-status").render();
				}
			}],
			["Bar", ("bar") , [
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
							if(history.length === 0) this.hide();
						}
					}],
					["Button", (""), { 
						content: "View on Map", 
						onClick: function() {
							this.print("selection", this.ud("#list").getSelection());
						} 
					}],
					// ["Button", {
					// 	content: "Drill Down... <i class='fa fa-caret-down'></i>"
					// }],
					// ["Button", {
					// 	action: "collect-sample",
					// 	css: "margin-left: 8px;",
					// }],
					// ["Button", {
					// 	action: "collect-analysis",
					// }]
				]],
				["Input", ("q"), { 
					placeholder: "Filter", 
					onChange() { 
						var array = this.ud("#array");
						this.setTimeout("updateFilter", () => {
							array.vars("q", this.getValue());
							array.updateFilter();
						}, 250); 
					} 
				}],
				["Group", ("right"), [
					// ["Button", { action: "view-source" }]
					["Element", ("list-status"), { 
						content: "-", element: "span",
						onRender() {
							var status;
							this.setTimeout(() => {
								var arr = this.ud("#array");
								if(!arr._array) return;
								
								var total = arr._array.length;
								var filtered = this.ud("#q").getValue().length > 0 ? (arr._arr||[]).length : 0;
								var selected = this.ud("#list").getSelection().length;
								
								if(filtered === 0 && selected === 0) {
									status = js.sf("%d items", total);
								} else {
									status = js.sf("%d/%d", selected, filtered || total);
								}
								
								if(filtered) {
									status += js.sf(" (%d)", total);
								}
								
								this.setContent(status);
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
			// ["Bar", ("bar"), { css: {"": "text-align: center;", "input": "width: 250px; font-size: 14pt;"} }, [
			// 	["Input", ("q"), { 
			// 		placeholder: "Filter", 
			// 		onChange() { 
			// 			var array = this.ud("#array");
			// 			this.setTimeout("updateFilter", () => {
			// 				array.vars("q", this.getValue());
			// 				array.updateFilter();
			// 			}, 250); 
			// 		} 
			// 	}],
				
			// 	["Radiobutton", ("opt-and"), {
			// 		visible: false, // not=working=yet
			// 		label: "AND", groupIndex: 1
			// 	}],
			// 	["Radiobutton", ("opt-or"), {
			// 		visible: false, // not=working=yet
			// 		checked: true, groupIndex: 1,
			// 		label: "OR"
			// 	}],
			// 	["Checkbox", ("check-exact-case"), {
			// 		visible: false, // not=working=yet
			// 		label: "Exact case",
			// 		checked: false
			// 	}]
			// ]],
			["List", ("list"), { 
				css: { ".ListCell": "color:red;" },
				autoColumns: true,
				source: "array", css: "background-color:white;",
				onSelectionChange() {
					this.ud("#list-status").render();
				},
				onDispatchChildEvent(component, name, evt, f, ms) {
					if(name === "dblclick" && component instanceof ListColumn) {
						var arr = this._source._arr.map(_ => _[component._attribute]);
						var old = this._source._arr;
						var history = this.vars(["history"]);
						history.push(this._source._array);
						this.ud("#array").setArray(null);
						this.ud("#array").setArray(arr.filter(_ => _ !== undefined));
						this.ud("#back").show();
					}
				},
				onDblClick() { 
					var selection = this.getSelection(true);
					this.print(selection.length === 1 ? selection[0] : selection);
				}}],
			["Ace", ("ace"), { visible: false }],
			["Tabs", ("tabs"), {
				css: "text-align:center;",
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
		]
	]
};


["", { 
	css: {
		"#output": "background-color: #f0f0f0; border-right: 1px solid silver;"
	},
	onLoad() {
        var render = (evt) => this.qsa("#render").execute(evt);
        
        this.up("vcl/ui/Tab").on({
        	"resource-loaded": render, 
        	"resource-saved": render 
        });
        
        return this.inherited(arguments);
	}
}, [
    ["vcl/Action", ("toggle-source"), {
        hotkey: "Shift+MetaCtrl+S",
        selected: "state", visible: "state",
        state: true,
        
        onExecute: function() {
        	this.setState(!this.getState());
        	// this.scope().ace.setVisible(this.getState());
        }
    }],
    ["vcl/Action", ("toggle-output"), {
        hotkey: "Shift+MetaCtrl+O",
        selected: "state",
        visible: "state",
        state: true,
        
        onExecute: function() {
        	var output = this.scope().output;
        	output.setVisible(!output.isVisible());
        }
    }],
    ["vcl/Action", ("render"), {
    	onExecute: function() {
    		var owner = this._owner;
    		var scope = this.scope();
			var root = Parser.parse(scope.ace.getValue(), {ignoreAttributes : false});
    		var format, formats = [];
			
		 	var console = scope.console;
			console.print("root", owner.vars("root", root));

    		if(root.hasOwnProperty("imsikb0101:FeatureCollectionIMSIKB0101")) {
    			// formats.push("gml");
    			formats.push("imsikb0101");
    			format = formats[0];
    		}

			if(formats.length) {
				console.print("formats detected", formats.join(", "));
// TODO some sort of loading indicator...
				this.setTimeout("load-detailviews", () => {
					var dva = this.ud("#detailview-available");
					console.print("loading extensions", Promise.all(
						formats.map(
							format => Blocks.instantiate(DetailViews[format], { 
								setIsRoot: true,
								loaded(view) { 
									// view.setIsRoot(true);
									view.vars("root", root); 
									view.loaded();
								}
							}).then(view => {
									view.setOwner(owner);
									dva.execute({ name: format, view: view, selected: view.vars("selected") });
									return view;
								}))));
				}, 500);
			}
    	}
    }],
    ["vcl/Action", ("detailview-available"), {
    	on(evt) {
	    	var Tab = require("vcl/ui/Tab");
	    	
	    	var scope = this.scope();
    		var tab = new Tab({ owner: this._owner, text: evt.name,
    			parent: scope['details-tabs'], control: evt.view,
    			selected: evt.selected || false
    		});
    		
    		evt.view.setParent(scope.output);

    		return tab;
    	}	
    }],
    
    ["vcl/ui/Panel", ("output"), { align: "client" }, [
	    ["vcl/ui/Tabs", ("details-tabs"), { align: "bottom", classes: "bottom" }, [
	    	["vcl/ui/Tab", { text: locale("Console"), control: "console", selected: true }]
	    ]],
	    ["vcl/ui/Console", ("console"), { 
	    	align: "client", 
    		vars: { 'skip-print': true },
	    	onEvaluate: function(expr) {
	    		var root = this._owner.getVar("root"), scope = this.scope();
    			return eval(expr);
	    	}
	    }]
    ]],
    
    [("#render"), {
    	on() {
    		this.inherited(arguments);
    		
    	}
    }],
    [("#ace"), { 
    	align: "left", width: 600, 
    	action: "toggle-source",
    	executesAction: "none"
    }],
    [("#evaluate"), {
    	onLoad() {
    		this.vars("eval", () => this.vars(["root"]));
    		return this.inherited(arguments);
    	}
    }]
]];