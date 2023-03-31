"use ./Util, locale!./locales/nl, vcl/ui/Button, vcl/ui/Tab, papaparse/papaparse, amcharts, amcharts.serial, amcharts.xy, lib/node_modules/regression/dist/regression, ";

window.locale.loc = 'nl';

var Util = require("./Util");
var Button = require("vcl/ui/Button");
var Tab = require("vcl/ui/Tab");
var Control = require("vcl/Control");

var locale = window.locale.prefixed("devtools:Renderer:gds:");

/*-	Renderer<gds> sub class 

	* `#VA-20230130-1` 
		- Adding traxial variant
		- Refactoring into two components
			- Renderer<gds.settlement>
			- Renderer<gds.triaxial>
	
	- "entry point": vcl/Action#refresh.on
*/
	
var js = require("js");
var regression = require("lib/node_modules/regression/dist/regression");

/* Setup (must be called in same order) */
function setup_parameters() {
	const vars = this.up().vars("variables");
	const hvis = (section, items) => items.map(item => {
		var k, r = {
			name: locale(js.sf("Section:%s-%s", section, item[0])), 
			value: vars.headerValue(item[1], false),
		};
		
		["unit", "symbol"].map(key => {
			if(locale.has((k = js.sf("Section:%s-%s.%s", section, item[0], key)))) {
				r[key] = locale(k);
			}
		});
		
		return r;
	});
	const category = (section, items) => ({
		name: locale("Section:" + section + ".title"),
		items: hvis(section, items)
	});

	vars.categories = [
		category(("General"), [
			["projectcode", "Job reference"],
			["description", "Job Location"],
			["borehole", "Borehole"],
			["sample", "Sample Name"],
			["specimen", "Depth"],
			["date", "Sample Date"],
			["commotion", "Specimen Type"], 
		]),
		category(("Sample"), []),
		category(("Initial"), [
			["height", ""],
			["diameter", ""],
			["surface", ""],
			["sampleMassWet", ""],
			["sampleMassDry", ""],
			["densityWet", ""],
			["densityDry", ""],
			["waterContent", ""],
			["grainDensity", ""],
			["poreNumber", ""]
		]),
		category(("Final"), [
			// { symbol: "Hf", name: "Hoogte", unit: "mm", value: vars.Hf },
			// { symbol: "Vf", name: "Volume", unit: "mm3", value: vars.Vf },
			// { symbol: "Srf", name: "Verzadigingsgraad", unit: "%", value: vars.Srf },
			// { symbol: "wf", name: "Watergehalte", unit: "%", value: vars.wf },
			// { symbol: "yf", name: "Volumegewicht nat", unit: "kN/m3", value: vars.yf },
			// { symbol: "ydf", name: "Volumegewicht droog", unit: "kN/m3", value: vars.ydf },
			// { symbol: "ef", name: "Poriëngetal", unit: "-", value: vars.ef }
		])
	// }, {
	// 	name: "Overig",
	// 	items: [
	// 		{ symbol: "m", name: "Initial Mass", unit: "-", value: vars.m },
	// 		{ symbol: "md", name: "Initial Dry Mass", unit: "-", value: vars.md },
	// 		{ symbol: "mf", name: "Final Mass", unit: "-", value: vars.mf },
	// 		{ symbol: "mdf", name: "Final Dry Mass", unit: "-", value: vars.mdf },
	// 	]
	];
	vars.parameters = vars.categories.map(_ => (_.items || []).map(kvp => js.mi({ category: _ }, kvp))).flat();
/*-
	Effectieve belasting - σ'
	Belastingschema - σ'
	Poriëngetal - e
	Compression Index - Cc
	Compression Ratio - CR
	
	(Bjerrum/NEN)
		- Lineaire rek - εCv
	Coefficient of Consolidation 
		- Volumesamendrukkingscoëfficiënt - mv
		(Casagrande Method)
			- Tijd bij 50% consolidatie - t50
			- Consolidatiecoëfficient - cv
			- Waterdoorlatendheid - k
		(Taylor Method)
			- Tijd bij 90% consolidatie - t90
			- Consolidatiecoëfficient - cv
			- Waterdoorlatendheid - k
	(a,b,c-Isotachen)
		- Natuurlijke rek - εHv 
		- Natuurlijke Rek bij grenspanning NEN
		- Grenspanning bij NEN
		- a-waarden
		- b-waarden
		- c-waarden
	(Secundaire Consolidatieparameter Cα)
		- Secundaire Consolidatie Trap [...] - Calpha - Cα
	(Koppejan)
		- rc
		- np
		- z, z1, z10, z100, ...
		- Samendrukkingsparameters
			- Samendrukkingsconstant C > σ’p tussen Trap 5 en 6
*/
}

/* Event Handlers */
var handlers = {
	/* Event Handlers */
	// "loaded": function root_loaded() {
	// 	var editor, me = this, root = this.up("devtools/Editor<vcl>");
	// 	if(root) {
	// 		/*- DEBUG: hook into the 1st Editor<gds> we can find (if any) in order to tweak/fiddle code */
	// 		if((editor = root.app().down("devtools/Editor<gds>:root"))) {
	// 			var previous_owner = me._owner;
	// 			me.setOwner(editor);
	// 			me.on("destroy", () => me.setOwner(previous_owner));
	// 		}
	//  	}
	 	
	//  	logger = this;
	// },
	"#tabs-sections onChange": function tabs_change(newTab, curTab) {
		this.ud("#bar").setVisible(newTab && (newTab.vars("bar-hidden") !== true));
	},
	// "#tabs-graphs onChange": function graphs_change(newTab, curTab) {
	// 	var teg = this.ud("#toggle-edit-graph"), egs = this.ud("#edit-graph-stage");
	// 	var state = teg.getState();
	
	// 	if(state === true) {
	// 		// commit pending changes
	// 		teg.execute();
	// 	}
		
	// 	var multiple = (newTab.vars("multiple") === true);
	// 	teg.setVisible(!multiple);
	// 	egs.setVisible(multiple);
		
	// 	if(!multiple) {
	// 		var vars = this.vars(["variables"]), sg = getSelectedGraph(newTab);
	// 		this.ud("#label-boven").setValue(js.get(js.sf("overrides.%s.label-boven", sg.id), vars) || "3-4");
	// 		this.ud("#label-onder").setValue(js.get(js.sf("overrides.%s.label-onder", sg.id), vars) || "1-2");
	// 	}
		
	// 	if(state === true) {
	// 		this.setTimeout("foo", () => teg.execute(), 500);
	// 		// this causes UI state to become unstable - really not happy with the way it's organized Action stuff
	// 	}
	// },
	
	"#panel-edit-graph > vcl/ui/Input onChange": function() {
		this.setTimeout("foo", () => {
			var sg = getSelectedGraph(this); 
			if(!sg.multiple) {
				var vars = this.vars(["variables"]), path = js.sf("overrides.%s.%s", sg.id, this._name);
				var current = js.get(path, vars), value = this.getValue();
				
				if(current !== value) {
					js.set(path, value, vars);
					if(current !== undefined) {
						this.ud("#modified").setState(true);
					}	
				} else {
					this.print("ignore onChange");
				}
			}
		}, 750);
	},
};

["", { handlers: handlers }, [

    [("#refresh"), { vars: { setup: setup_parameters } }],
    [("#reflect-overrides"), {
    	on(evt) {
    		var vars = this.vars(["variables"]);
    		if(evt.overrides) {
    			vars.overrides = evt.overrides;
    		} else {
    			if(!vars.overrides) return;
    			delete vars.overrides;
    		}
			vars.stages.forEach(stage => stage.update("all"));
			vars.koppejan.update();
			vars.parameters.update();
			this.ud("#graphs").getControls().map(c => c.render());
    	}
    }],

	[("#tabs-graphs"), {}, [

		["vcl/ui/Tab", { text: locale("Graph:VolumeChange"), controle: "graph_VolumeChange" }],
		["vcl/ui/Tab", { text: locale("Graph:PorePressureDissipation"), controle: "graph_PorePressureDissipation" }],
		["vcl/ui/Tab", { text: locale("Graph:DeviatorStress"), controle: "graph_DeviatorStress" }],
		["vcl/ui/Tab", { text: locale("Graph:WaterOverpressure"), controle: "graph_WaterOverpressure" }],
		["vcl/ui/Tab", { text: locale("Graph:EffectiveHighStressRatio"), controle: "graph_EffectiveHighStressRatio" }],
		["vcl/ui/Tab", { text: locale("Graph:ShearStress"), controle: "graph_ShearStress" }],
		["vcl/ui/Tab", { text: locale("Graph:DeviatorStressQ"), controle: "graph_DeviatorStressQ" }],

		["vcl/ui/Bar", ("menubar"), {
			align: "right", autoSize: "both", classes: "nested-in-tabs"
		}, [
			["vcl/ui/Button", ("button-edit-graph"), { 
				action: "toggle-edit-graph",
				classes: "_right", content: "Lijnen muteren"
			}],
			["vcl/ui/PopupButton", ("button-edit-graph-stage"), { 
				action: "edit-graph-stage", classes: "_right", origin: "bottom-right",
				content: "Lijnen muteren <i class='fa fa-chevron-down'></i>",
				popup: "popup-edit-graph-stage"
			}]	
		]]
	]],
	[("#graphs"), { 


	}, [
		["vcl/ui/Panel", ("graphs_VolumeChange"), {
			align: "client", visible: false
		}],
		["vcl/ui/Panel", ("graphs_PorePressureDissipation"), {
			align: "client", visible: false
		}],
		["vcl/ui/Panel", ("graphs_DeviatorStress"), {
			align: "client", visible: false
		}],
		["vcl/ui/Panel", ("graphs_WaterOverpressure"), {
			align: "client", visible: false
		}],
		["vcl/ui/Panel", ("graphs_EffectiveHighStressRatio"), {
			align: "client", visible: false
		}],
		["vcl/ui/Panel", ("graphs_ShearStress"), {
			align: "client", visible: false
		}],
		["vcl/ui/Panel", ("graphs_DeviatorStressQ"), {
			align: "client", visible: false
		}],

		[("#panel-edit-graph"), {}, [
		]]
	]]
]];