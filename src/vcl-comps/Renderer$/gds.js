"use js, vcl/ui/Button, vcl/ui/Tab, papaparse/papaparse, amcharts, amcharts.serial, amcharts.xy, lib/node_modules/regression/dist/regression, locale!./locales/nl";

define("devtools/Renderer<gds>.parseValue", () => (value) => isNaN(value.replace(",", ".")) ? value : parseFloat(value.replace(",", ".")));


"use strict";

/*-
	* `#VA-20201218-3` Main issue
	* `#VA-20210816-1` Deduce/copy Axial Stress from Stress Target
	* `#VA-20230130-1` 
		- Adding traxial variant
		- Refactoring into two components
			- Renderer<gds.settlement>
			- Renderer<gds.triaxial>
	
	- "entry point": vcl/Action#refresh.on
*/

var js = require("js");

var Button = require("vcl/ui/Button");
var Tab = require("vcl/ui/Tab");
var Control = require("vcl/Control");

/* Some styles and class */
var css = {
		"a": "visibility:hidden;",
		".multiple > div": "width:48%;height:48%;display:inline-block;" + 
			"border: 1px dashed black;" +
			"margin-left:1%;margin-right:1%;margin-top:5px;margin-bottom:5px;" + 
			"min-width:300px;min-height:300px;",
		// "> :not(.multiple)": "margin:5px;",
		"&.pdf > :not(.multiple)": "margin:5px;width: 850px; height: 470px; background-color: rgba(56, 121, 217, 0.075); border: 3px dashed rgb(56, 121, 217);",
		"&.pdf .multiple > div.selected": "background-color: rgba(56, 121, 217, 0.075); border: 3px dashed rgb(56, 121, 217);",
		"div.editing": "background-color: #f0f0f0; border: 3px dashed orange;top:0;left:0;right:0;bottom:0;z-index:1;position:absolute;width:auto;height:auto;margin:5px;",
		"&.pdf.generate .multiple > div": "height: 470px; width:850px; position:absolute;top:0;left:0;",
		// ".amcharts-main-div": "border: 3px solid transparent;"
	};
var logger; 

/* Other */
function getSelectedGraph(cmp) {
	var graph;
	if(cmp instanceof Tab) {
		graph = cmp.getControl();
	} else {
		graph = cmp.ud("#tabs-graphs").getSelectedControl(1).getControl();
	}
	return {
		id: graph.getName().substring("graph".length + 1).toLowerCase(),
		multiple: graph.hasClass("multiple")
	};
}
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

/* Event Handlers */
var handlers = {
	/* Event Handlers */
	"loaded": function root_loaded() {
		var editor, me = this, root = this.up("devtools/Editor<vcl>");
		if(root) {
			/*- DEBUG: hook into the 1st Editor<gds> we can find (if any) in order to tweak/fiddle code */
			if((editor = root.app().down("devtools/Editor<gds>:root"))) {
				var previous_owner = me._owner;
				me.setOwner(editor);
				me.on("destroy", () => me.setOwner(previous_owner));
			}
	 	}
	 	
	 	logger = this;
	},
	"#tabs-sections onChange": function tabs_change(newTab, curTab) {
		this.ud("#bar").setVisible(newTab && (newTab.vars("bar-hidden") !== true));
	}
};

["", { handlers: handlers }, [

	["vcl/data/Array", ("array-measurements"), {
		onGetAttributeValue: function(name, index, value) { 
			return (this._arr[index] || {})[name]; 
		},
		onFilterObject(obj) {
			var q = this.vars("q");
			if(!q) return false;
			return q.split(/\s/).filter(q => q.length > 0).some(q => !match(obj, q));
		},
		onUpdate() {
			// this.ud("#list-status").render();
		},
	}],
	["vcl/data/Array", ("array-variables"), {
		onFilterObject(obj) {
			var q = this.vars("q");
			if(!q) return false;
			return q.split(/\s/).filter(q => q.length > 0).some(q => !match(obj, q));
		}
	}],
	
    ["vcl/Action", ("toggle-edit-graph"), {
    	selected: "state",
    	state: false, 
    	visible: false,
    	on(evt) {
			var vars = this.vars(["variables"]), am, node, chart;
    		var graph = this.ud("#graphs > :visible"), state;
    		var stage = evt && evt.component.vars("stage");

    		am = (evt && evt.am) || graph.getNode().down(".amcharts-main-div");
			if(stage === undefined) {
				stage = Array.from(am.parentNode.parentNode.childNodes).indexOf(am.parentNode);
			}
			
			/* get the stage being clicked */
			chart = (graph.vars("am-" + stage) || graph.vars("am")).chart;

			if(!(state = this.toggleState())) {
				vars.editor && vars.editor.stop(true);
				delete vars.editor;
				this.ud("#popup-edit-graph-stage")._controls.forEach(c => c.setSelected("never"));
				// stage = undefined;
			} else {
				vars.editor = new TrendLineEditor(vars, vars.stages[stage], chart, graph);
				node = graph.getNode();
				node.previous_scrollTop = node.scrollTop;
				node.scrollTop = 0;
				graph._parent.focus();
	
				// if(evt && !evt.am && stage !== undefined) {
					// evt.component.print("nevering", evt);
					// evt.component._parent._controls.forEach(c => c.setSelected(c === evt.component ? true : "never"));
				// }
				
				if(stage !== undefined) {
					this.ud("#popup-edit-graph-stage").getControls().forEach((c, i) => c.setSelected(i === stage ? true : "never"));
				}
			}
			
			var multiple = getSelectedGraph(this).multiple;
			this.ud("#panel-edit-graph").setVisible(this.getState() && !multiple);
    	}
    }],
    ["vcl/Action", ("edit-graph-stage"), {
    	selected: "parent",
    	state: "parent",
    	parent: "toggle-edit-graph",
    	// parentExecute: true,
    	on(evt) {
    		// if(this.isSelected()) {
    		// 	this._parent.execute();
    		// }
    		if(evt.component.hasVar("stage")) {
    			// if it is a button inside the popup
    			if(this.isSelected() && !evt.component.isSelected()) {
    				this._parent.execute(); // deselect first
    			}
    			this._parent.execute(evt);
    		}
    	}
    }],
    
    ["vcl/Action", ("modified"), {
    	state: false,
    	visible: "state"
    }],
    ["vcl/Action", ("editing"), {
    	state: false,
    	selected: "state"
    }],

    ["vcl/Action", ("refresh"), {
		on_shouldbeoverridden(evt) { /* ... */ }
    }],
    ["vcl/Action", ("persist-changes"), {
    	parent: "modified",
    	visible: "parent",
    	on() {
    		/* overridden in eg. Tabs<Document> */
    		alert("LET OP: Niet geimplementeerd!");
    	}
    }],
    ["vcl/Action", ("cancel-changes"), {
    	parent: "modified",
    	visible: "parent",
    	on() {
			if(confirm("LET OP: Alle wijzigingen zullen verloren gaan.\n\nWeet u zeker dat u wilt annuleren?")) {
				// this.ud("#editing").setState(false);
				this.ud("#toggle-edit-graph").execute();
				this.ud("#modified").setState(false);
				this.ud("#refresh").execute();
			}
    	}
    }],
    ["vcl/Action", ("reflect-overrides"), {
		on_shouldbeoverridden(evt) { /* ... */ }
    }],

    ["vcl/ui/Popup", ("popup-edit-graph-stage"), { 
    	autoPosition: false,
		origin: "bottom-right",
		classes: "mw",
		css: {
			".{Button}": "white-space: nowrap;",
			"&.mw.mw.mw": "right:0;max-width:200px;",
			"span": "font-size:smaller;"
		}
    }],

	["vcl/ui/Tabs", ("tabs-sections"), { classes: "bottom", align: "bottom" }, [
		["vcl/ui/Bar", ("menubar"), {
			align: "right", 
			autoSize: "both",
			classes: "nested-in-tabs",
			css: "text-align:right;"
		}, [
			["vcl/ui/Button", ("button-persist-changes"), { 
				action: "persist-changes", classes: "submit",
				content: "Opslaan"
			}],
			["vcl/ui/Button", ("button-persist-changes"), { 
				action: "cancel-changes", classes: "cancel",
				content: "Annuleren"//, visible: false
			}]
		]],
		["vcl/ui/Tab", { text: "Variabelen", control: "variables", selected: !true }],
		["vcl/ui/Tab", { text: "Metingen", control: "measurements" }],
		["vcl/ui/Tab", { text: "Grafieken", control: "container-graphs", selected: true, vars: { 'bar-hidden': true }} ],
	]],
	["vcl/ui/Bar", ("bar"), { visible: false }, [
		["vcl/ui/Input", ("q"), { 
			placeholder: "Filter", 
			onChange() { 
				this.setTimeout("updateFilter", () => {
					var a1 = this.udr("#array-variables");
					var a2 = this.ud("#array-measurements");
					a1.vars("q", this.getValue());
					a1.updateFilter();

					a2.vars("q", this.getValue());
				}, 250); 
			} 
		}],
	]],
	["vcl/ui/List", ("variables"), { 
		align: "client", autoColumns: true, visible: false, 
		source: "array-variables",
		onDblClick: function() {
			this.print(this.getSelection(true));	
		}
	}],
	["vcl/ui/List", ("measurements"), { 
		align: "client", autoColumns: true, visible: false, 
		source: "array-measurements",
		onDblClick: function() {
			this.print(this.getSelection(true));	
		}
	}],
	["vcl/ui/Panel", ("container-graphs"), { align: "client", visible: false }, [
		["vcl/ui/Tabs", ("tabs-graphs"), {}, [
			// ["vcl/ui/Tab", { text: "Casagrande", control: "graph_Casagrande", selected: true, vars: { multiple: true } }],
			// ["vcl/ui/Tab", { text: "Taylor", control: "graph_Taylor", selected: !true, vars: { multiple: true } }],
			// ["vcl/ui/Tab", { text: "Isotachen (c)", control: "graph_Isotachen_c", selected: !true, vars: { multiple: true } }],
			// ["vcl/ui/Tab", { text: "Bjerrum (poriëngetal)", control: "graph_Bjerrum_e", selected: !true }],
			// ["vcl/ui/Tab", { text: "Bjerrum (rek)", control: "graph_Bjerrum_r", selected: !true }],
			// ["vcl/ui/Tab", { text: "Isotachen", control: "graph_Isotachen", selected: !true }],
			// ["vcl/ui/Tab", { text: "Koppejan", control: "graph_Koppejan", selected: !true }],
			// ["vcl/ui/Bar", ("menubar"), {
			// 	align: "right", autoSize: "both", classes: "nested-in-tabs"
			// }, [
			// 	["vcl/ui/Button", ("button-edit-graph"), { 
			// 		action: "toggle-edit-graph",
			// 		classes: "_right", content: "Lijnen muteren"
			// 	}],
			// 	["vcl/ui/PopupButton", ("button-edit-graph-stage"), { 
			// 		action: "edit-graph-stage", classes: "_right", origin: "bottom-right",
			// 		content: "Lijnen muteren <i class='fa fa-chevron-down'></i>",
			// 		popup: "popup-edit-graph-stage"
			// 	}]	
			// ]]
		]],
		["vcl/ui/Panel", ("graphs"), { 
			align: "client", css: css, tabIndex: 1,
			
			onDispatchChildEvent(child, name, evt, f, args) {
				var mouse = name.startsWith("mouse");
				var click = !mouse && name.endsWith("click");
				var vars = this.vars(["variables"]), am, stage, control, method, chart;

				if(click || mouse) {
					am = evt.target.up(".amcharts-main-div", true);
					if(!am) return;

					control = evt.component || require("vcl/Control").findByNode(am);
					if(!control || control.vars("rendering") === true) return;
					
					var stages = vars.stages;
					if(vars.editing) {
						if(!vars.editing.parentNode) {
							delete vars.editing;
						} else {
							stage = Array.from(vars.editing.parentNode.childNodes).indexOf(vars.editing);
						}
					}
					if(name === "click") {
						/* focus, clear overrides */
						if(stage !== undefined) {
							chart = (control.vars("am-" + stage) || control.vars("am")).chart;
							var trendLines = chart.trendLines;
							if(trendLines.selected) {
								trendLines.selected.lineThickness = 1;
								trendLines.selected.draw();
								delete trendLines.selected;
							}
						}
						this.focus();
						
						if(vars.editor) {
							vars.editor.handle(evt);
						}
							
					} else if(name === "dblclick") {
						evt.am = am;
						this.ud("#toggle-edit-graph").execute(evt);
					} else if(vars.editor) {
						vars.editor.handle(evt);
					} else if(mouse && vars.editing) {
						var trendLine = vars.etl && vars.etl.chart.trendLines.selected;
						if(trendLine) {
							handleTrendLineEvent(evt.component, trendLine, evt);
						}
					}
				}
			},
			onKeyDown(evt) { 
				var control = evt.component || require("vcl/Control").findByNode(evt.target);
				if(!control || control.vars("rendering") === true) return;

				var trendLine = this.vars(["variables.etl.chart.trendLines.selected"]);
				handleTrendLineEvent(control, trendLine, evt);
			},
			onKeyUp(evt) { 
				var control = evt.component || require("vcl/Control").findByNode(evt.target);
				if(!control || control.vars("rendering") === true) return;
				
				var trendLine = this.vars(["variables.etl.chart.trendLines.selected"]);
				handleTrendLineEvent(control, trendLine, evt);
			}

		}, [
			// ["vcl/ui/Panel", ("graph_Casagrande"), {
			// 	align: "client", visible: false, classes: "multiple"
			// }],
			// ["vcl/ui/Panel", ("graph_Taylor"), {
			// 	align: "client", visible: false, classes: "multiple"
			// }],
			// ["vcl/ui/Panel", ("graph_Bjerrum_e"), {
			// 	align: "client", visible: false
			// }],
			// ["vcl/ui/Panel", ("graph_Bjerrum_r"), {
			// 	align: "client", visible: false
			// }],
			// ["vcl/ui/Panel", ("graph_Isotachen"), {
			// 	align: "client", visible: false
			// }],
			// ["vcl/ui/Panel", ("graph_Koppejan"), {
			// 	align: "client", visible: false
			// }],
			// ["vcl/ui/Panel", ("graph_Isotachen_c"), {
			// 	align: "client", visible: false, classes: "multiple"
			// }],
			
			["vcl/ui/Panel", ("panel-edit-graph"), {
				align: "top", autoSize: "height",
				// action: "toggle-edit-graph", executeAction: "on",
				css: {
					"": "padding:8px;text-align:center;",
					">*": "margin-right: 4px;" ,
					"input": "text-align:center;width:40px;border-radius: 5px; border-width: 1px; border-color: rgb(240, 240, 240); padding: 2px 4px;"
			    },
				visible: false
			}, [
				// ["vcl/ui/Element", { element: "span", content: "onder Pg:"}],
				// ["vcl/ui/Input", "label-onder", { placeholder: "#-#"}],
				// ["vcl/ui/Element", { element: "span", content: "boven Pg:"}],
				// ["vcl/ui/Input", "label-boven", { placeholder: "#-#"}],
			]]
		]]
	]]
]];