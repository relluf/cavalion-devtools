"use papaparse/papaparse, lib/node_modules/regression/dist/regression, locale!./locales/nl";
/* Renderer<gds> sub class */

var Button = require("vcl/ui/Button");
var Tab = require("vcl/ui/Tab");
var Control = require("vcl/Control");

var locale = window.locale.prefixed("devtools:Renderer:gds:");
window.locale.loc = 'nl';

"use strict";

/*-
	* `#VA-20230130-1` 
		- Adding traxial variant
		- Refactoring into two components
			- Renderer<gds.settlement>
			- Renderer<gds.triaxial>
	
	- "entry point": vcl/Action#refresh.on
*/
	
var js = require("js");
var regression = require("lib/node_modules/regression/dist/regression");

var key_s = "Stage Number";
var key_t = "Time since start of stage (s)";
var key_T = "Time since start of test (s)";
var key_d = "Axial Displacement (mm)";
var key_as = "Axial Stress (kPa)";
var key_st = "Stress Target (kPa)";
var treatZeroAs = 0.0001;

/* Handy Dandy */
var cp = (obj) => {
	if(obj instanceof Array) {
		return obj.map(_ => cp(_));
	}
	if(obj !== null && typeof obj === "object") {
		var newObj = {};
		Object.keys(obj).forEach(key => newObj[key] = cp(obj[key]));
		obj = newObj;
	}
	return obj;
};
var parseValue = (value) => isNaN(value.replace(",", ".")) ? value : parseFloat(value.replace(",", "."));
var removeQuotes = (str) => str.replace(/"/g, "");
var removeTrailingColon = (s) => s.replace(/\:$/, "");
var sort_numeric = (i1, i2) => parseFloat(i1) < parseFloat(i2) ? -1 : 1;

/* Setup (must be called in same order) */
function setup_measurements_1(vars, measurements) {
	vars.measurements = measurements.filter(_ => _.length).map(values => {
		var obj = {};
		vars.columns.forEach((key, index) => obj[key] = parseValue(values[index]));
		
		obj.stage = Math.round(obj[key_s] > 1 && obj[key_s] < 2 ? 10 * (obj[key_s] - 1) : obj[key_s]);
		obj.seconds = obj[key_t];
		obj.minutes = obj.seconds / 60;
		obj.hours = obj.seconds / (60 * 60);
		obj.days = obj.seconds / (24 * 60 * 60);
		obj.secondsT = obj[key_T];
		obj.daysT = obj.secondsT / (24 * 60 * 60);
		obj.z = obj[key_d];
		
		obj.minutes_sqrt = Math.sqrt(obj.minutes);
		obj.minutes_log10 = Math.log10(obj.minutes || treatZeroAs);
		obj.days_log10 = Math.log10(obj.days || treatZeroAs);

		return obj;
	});
	
	if(measurements.length && !vars.measurements[0].hasOwnProperty(key_as)) {
		if(confirm(js.sf("NB: De data is niet compleet.\n\nWilt u het missende gegeven '%s' afleiden van '%s'?", key_as, key_st))) {
			vars.measurements.forEach(m => (m[key_as] = m[key_st]));
		}
	}
}
function setup_variables_1(vars, headerValue) {
	vars.G = 9.81 * 1000;
	vars.pw = 1.00; //(assumed value; note that water density may vary due to temperature)
/*- read variables from header information */
	vars.ps = headerValue("Specific Gravity (kN");
	vars.H = headerValue("Initial Height (mm)");
	vars.D = headerValue("Initial Diameter (mm)");
	vars.m = headerValue("Initial mass (g)");
	vars.md = headerValue("Initial dry mass (g)");
	vars.mf = headerValue("Final Mass");
	vars.mdf = headerValue("Final Dry Mass");
	vars.temperature = headerValue("Temperatuur") || 10;
/*- initialize and calculate some more variables (see documentation `#VA-20201218-3`) */
	vars.V = Math.PI * (vars.D/2) * (vars.D/2) * vars.H;
	vars.y = vars.m / (Math.PI / 4 * vars.D * vars.D * vars.H) * vars.G;
	vars.yd = vars.md / (Math.PI / 4 * vars.D * vars.D * vars.H) * vars.G;
	vars.w0 = (vars.m - vars.md) / vars.md * 100;
	vars.pd = vars.yd / (vars.G/1000);
	vars.e0 = (vars.ps / vars.pd) - 1;
	vars.Sr = (vars.w0 * vars.ps) / (vars.e0 * vars.pw);
	// vars.dH = calc_dH(vars);
/*- initial vars */
	vars.Hi = vars.H;
	vars.Vi = vars.V;
	vars.yi = vars.y;
	vars.ydi = vars.yd;
	vars.pdi = vars.pd;
	vars.ei = vars.e0;
	vars.Sri = vars.Sr;
/*- final vars */
	vars.Hf = vars.H - vars.dH;
	vars.Vf = Math.PI * (vars.D/2) * (vars.D/2) * vars.Hf;
	vars.yf = vars.mf / (Math.PI / 4 * vars.D * vars.D * vars.Hf) * vars.G;
	vars.ydf = vars.mdf / (Math.PI / 4 * vars.D * vars.D * vars.Hf) * vars.G;
	vars.pdf = vars.ydf / (vars.G/1000);
	vars.ef = (vars.ps / vars.pdf) - 1;
	vars.wf = (vars.mf - vars.mdf) / vars.mdf * 100;
	vars.Srf = (vars.wf * vars.ps) / (vars.ef * vars.pw);
}
function setup_variables_2(vars, headerValue) {
	vars.categories = [{
		name: "Algemene informatie",
		items: [
			{ name: "Projectnummer", value: headerValue("Job reference", false) },
			{ name: "Projectomschrijving", value: headerValue("Job Location", false)  },
			// { name: "Aantal trappen", value: vars.stages.length },
			// { name: "Proef periode", value: js.sf("%s - %s", headerValue("Date Test Started", false), headerValue("Date Test Finished", false)) },
			// { name: "Beproevingstemperatuur", value: headerValue("Sample Date") || ""},
			// { name: "Opmerking van de proef", value: "" },
			// { name: "Opdrachtgever", value: "" },
			// { name: "Opdrachtnemer", value: "" },
			// { name: "Coördinaten", value: "" }
		]
	}, {
		name: "Monster",
		items: [
			{ name: "Boring", value: headerValue("Borehole", false) },
			{ name: "Monster", value: headerValue("Sample Name", false) },
			{ name: "Monstertype", value: headerValue("Specimen Type", false) },
			{ name: "Grondsoort", value: headerValue("Description of Sample", false) },
			{ name: "Diepte", unit: "m-NAP", value: headerValue("Depth", false) },

			// { name: "Opstelling nr", value: "" },
			// { name: "Laborant", value: "" },
			// { name: "Uitwerking", value: "" },
			// { name: "Proefmethode", value: "" },
			// { name: "Proefomstandigheden", value: "" },
			// { name: "Monsterpreparatie", value: "" },
			// { name: "Opmerking monster", value: "" }
		]
	}, {
		name: "Initiële waarden",
		items: [
			{ symbol: "Hi", name: "Hoogte", unit: "mm", value: vars.Hi },
			{ symbol: "D", name: "Diameter", unit: "mm", value: vars.D },
			{ symbol: "ρs", name: "Dichtheid vaste delen", unit: "Mg/m3", value: vars.ps },
			{				name: "Bepaling dichtheid", value: headerValue("Specific Gravity (ass", false).replace("Ingeschaat", "Ingeschat").replace("Hoobs", "Hobbs") },
			{ symbol: "Vi", name: "Volume", unit: "mm3", value: vars.Vi },
			{ symbol: "Sri", name: "Verzadigingsgraad", unit: "%", value: vars.Sri },
			{ symbol: "w0", name: "Watergehalte", unit: "%", value: vars.w0 },
			{ symbol: "yi", name: "Volumegewicht nat", unit: "kN/m3", value: vars.yi },
			{ symbol: "ydi", name: "Volumegewicht droog", unit: "kN/m3", value: vars.ydi },
			{ symbol: "ei", name: "Poriëngetal", unit: "-", value: vars.ei }
		]
	}, {
		name: "Uiteindelijke waarden",
		items: [
			{ symbol: "Hf", name: "Hoogte", unit: "mm", value: vars.Hf },
			{ symbol: "Vf", name: "Volume", unit: "mm3", value: vars.Vf },
			{ symbol: "Srf", name: "Verzadigingsgraad", unit: "%", value: vars.Srf },
			{ symbol: "wf", name: "Watergehalte", unit: "%", value: vars.wf },
			{ symbol: "yf", name: "Volumegewicht nat", unit: "kN/m3", value: vars.yf },
			{ symbol: "ydf", name: "Volumegewicht droog", unit: "kN/m3", value: vars.ydf },
			{ symbol: "ef", name: "Poriëngetal", unit: "-", value: vars.ef }
		]
	}, {
		name: "Belastingschema",
		items: vars.stages.map((stage, i) => ({ name: js.sf("Trap %d", i + 1), symbol: "σ'v", unit: "kPa", value: stage.target })),
	}, {
		name: "Belastingschema (effectief)",
		items: vars.stages.map((stage, i) => ({ name: js.sf("Trap %d", i + 1), symbol: "σ'v", unit: "kPa", value: stage.effective })),
	}, {
		name: "Grensspanning",
		items: [
			{ name: "Bjerrum/NEN", unit: "kPa", symbol: "σ'p", value: js.get("bjerrum.LLi_rek.sN1N2.x", vars) },
			{ name: "Isotachen", unit: "kPa", symbol: "σ'p", value: js.get("isotachen.LLi_e.sN1N2.x", vars) },
			{ name: "Koppejan", unit: "kPa", symbol: "σ'p", value: js.get("koppejan.LLi_1.sN1N2.x", vars) + 0},
			{ name: "Rek bij Bjerrum/NEN", symbol: "εCv", unit: "%", value: js.get("bjerrum.LLi_rek.sN1N2.y", vars) * 100 },
			{ name: "Rek bij Isotachen", symbol: "εHv", unit: "%", value: js.get("isotachen.LLi_e.sN1N2.y", vars) * 100 },
			{ name: "Rek bij Koppejan", symbol: "εCv", unit: "%", value: js.get("koppejan.LLi_1.sN1N2.y", vars) / vars.Hi * 100 },
		]
	}, {
		name: "Poriëngetal",
		items: vars.stages.map((stage, i) => ({ name: js.sf("Trap %d", i + 1), symbol: "e(" + (i+1) + ")", value: stage.e0 })),
	}, {
		name: "Lineaire rek",
		items: vars.stages.map((stage, i) => ({ name: js.sf("Trap %d", i + 1), symbol: "EvC(" + (i+1) + ")", value: stage.EvC })),
	}, {
		name: "Natuurlijke rek",
		items: vars.stages.map((stage, i) => ({ name: js.sf("Trap %d", i + 1), symbol: "EvH(" + (i+1) + ")", value: stage.EvH })),
	}, {
		name: "Volumesamendrukkingscoëfficiënt",
		items: vars.stages.map((stage, i) => ({ name: js.sf("Trap %d-%d", i + 1, i + 2), unit: "1/Mpa", symbol: js.sf("mv%s(%s)", vars.temperature, i), value: stage.mv })).filter(_ => !isNaN(_.value))
	}, {
		name: "Casagrande - Consolidatie 50%",
		items: vars.stages.map((stage, i) => ({ name: js.sf("Trap %d", i + 1), unit: "s", symbol: "t50(" + (i+1) +")", value: stage.casagrande.t50[0] })),
	}, {
		name: "Casagrande - Consolidatie 100%",
		items: vars.stages.map((stage, i) => ({ name: js.sf("Trap %d", i + 1), unit: "s", symbol: "t100(" + (i+1) +")", value: stage.casagrande.t100[0] })),
	}, {
		name: "Casagrande - Consolidatiecoëfficiënt",
		items: vars.stages.map((stage, i) => ({ name: js.sf("Trap %d", i + 1), unit: "m2/s", symbol: js.sf("Cv%s(%s)", vars.temperature, (i + 1)), value: stage.casagrande.cv }))
	}, {
		name: "Casagrande - Waterdoorlatendheid",
		items: vars.stages.map((stage, i) => ({ 
				name: js.sf("Trap %d-%d", i + 1, i + 2), 
				unit: "m/s", symbol: js.sf("k%s(%s)", vars.temperature, i + 1), 
				value: stage.casagrande.k
			})).filter((o, i, a) => i < a.length - 1)
	}, {
		name: "Casagrande - Secundaire consolidatie (Calpha)",
		items: vars.stages.map((stage, i) => ({ name: js.sf("Trap %d", i + 1), symbol: "Cα(" + (i+1) + ")", unit: "-", value: stage.casagrande.Calpha }))
	}, {
		name: "Taylor - Consolidatie 50%",
		items: vars.stages.map((stage, i) => ({ name: js.sf("Trap %d", i + 1), unit: "s", symbol: "t50(" + (i+1) +")", value: stage.taylor.t50[0] })),
	}, {
		name: "Taylor - Consolidatie 90%",
		items: vars.stages.map((stage, i) => ({ name: js.sf("Trap %d", i + 1), unit: "s", symbol: "t90(" + (i+1) +")", value: stage.taylor.t90[0] })),
	}, {
		name: "Taylor - Consolidatiecoëfficiënt",
		items: vars.stages.map((stage, i) => ({ name: js.sf("Trap %d", i + 1), unit: "m2/s", symbol: js.sf("Cv%s(%s)", vars.temperature, i + 1), value: stage.taylor.cv }))
	}, {
		name: "Taylor - Waterdoorlatendheid",
		items: vars.stages.map((stage, i) => ({ 
			name: js.sf("Trap %d-%d", i + 1, i + 2), 
			unit: "m/s", symbol: js.sf("k%s(%s)", vars.temperature, i + 1), 
			value: stage.taylor.k
		})).filter((o, i, a) => i < a.length - 1)
	}, {
		name: "NEN/Bjerrum - Samendrukkingsindices",
		items: vars.stages.map((stage, i) => ({ 
			name: js.sf("Trap %d-%d", i + 1, i + 2), 
			symbol: js.sf("%s(%d-%d)", stage.Cc_, i + 1, i + 2), 
			value: stage.Cc })).filter((o, i, a) => i < a.length - 1).concat(bjerrum_e_variables(vars))
	}, {
		name: "NEN/Bjerrum - Samendrukkingsgetallen",
		items: vars.stages.map((stage, i) => ({ 
			name: js.sf("Trap %d-%d", i + 1, i + 2), 
			symbol: js.sf("%s(%d-%d)",  stage.CR_, i + 1, i + 2), 
			// symbol: js.sf("CR(%s)",  i), 
			value: stage.CR })).filter((o, i, a) => i < a.length - 1).concat(bjerrum_r_variables(vars))
	}, {
		name: "Isotachen - Samendrukkingscoëfficiënten",
		items: (() => {
			var Pg = vars.isotachen.LLi_e.sN1N2.x;
			var name, value;
			return vars.stages.slice(0, vars.stages.length - 1).map((stage, i) => {
				if(name === undefined) {
					name = "a";
				} else if(/*name === "b" &&*/ stage.target > vars.stages[i + 1].target) {
					name = "asw";
				} else if(name === "a" && stage.effective > Pg) {
					name = "b";
				} else if(name === "asw") {
					name = "ar";
				} else if(name === "ar") {
					name = "b";
				}

				value = stage.isotachen[name.charAt(0)];

				return {
					name: js.sf("%s-waarde %s Pg", name, (stage.target > Pg ? "boven" : "onder"), i + 1, i + 2),
					symbol: js.sf("%s(%d-%d)", name, i + 1, i + 2),
					value: value
				};
			}).concat(isotachen_variables(vars));
		})()
	}, {
		name: "Isotachen - c-waarde",
		items: vars.stages.slice(0, vars.stages.length - 1).map((stage, i) => ({
				name: js.sf("c-waarde Trap %d", i + 1),
				symbol: js.sf("c(%d)", i + 1),
				value: stage.isotachen.c
			}))
	}, {
		name: "Koppejan - Zetting (geëxtrapoleerde)",
		items: [
			{ name: "1 dag", unit: "mm", symbol: "ez1", value: vars.koppejan.serie2.map(o => o.ez1).join(" ") },
			{ name: "10 dagen", unit: "mm", symbol: "ez10", value: vars.koppejan.serie2.map(o => o.ez10).join(" ") },
			{ name: "100 dagen", unit: "mm", symbol: "ez100", value: vars.koppejan.serie2.map(o => o.ez100).join(" ") },
			{ name: "1000 dagen", unit: "mm", symbol: "ez1000", value: vars.koppejan.serie2.map(o => o.ez1000).join(" ") },
			{ name: "10000 dagen", unit: "mm", symbol: "ez10000", value: vars.koppejan.serie2.map(o => o.ez10000).join(" ") },
		]
	}, {
		name: "Koppejan - Parameters",
		items: (() => { 
			var Pg = vars.koppejan.LLi_1.sN1N2.x;
			var slopes = vars.koppejan.slopes;
			var serie2 = vars.koppejan.serie2;
			var sig = key_st;

			var unload = 0, pre, post, reload = 0;
			return slopes.map((o, index) => { 
				if(index === slopes.length - 1) return [];
				if(index && !unload) {
					// if((unload = serie2[index - 1][sig] > serie2[index][sig] ? 1 : 0)) {
					if((unload = serie2[index][sig] > serie2[index + 1][sig] ? 1 : 0)) {
						pre = "A";
					} else {
						pre = "C";
					}
				} else {
					if(unload) {
						reload++;
					}
					pre = "C";
				}

				post = serie2[index][sig] < Pg ? "" : "'";
				post += (reload === 1 ? "(r)" : "");

				return [
					{ name: js.sf("%s%s Trap %d-%d", pre, post, index + 1, index + 2), unit: "", symbol: js.sf("%s%s", pre, post), value: o.C },
					{ name: js.sf("%s10%s Trap %d-%d", pre, post, index + 1, index + 2), unit: "", symbol: js.sf("%s10%s", pre, post), value: o.C10 },
					{ name: js.sf("%sp%s Trap %d-%d", pre, post, index + 1, index + 2), unit: "", symbol: js.sf("%sp%s", pre, post), value: o.Cp },
					{ name: js.sf("%ss%s Trap %d-%d", pre, post, index + 1, index + 2), unit: "", symbol: js.sf("%ss%s", pre, post), value: o.Cs }
				];
			}).flat().concat(koppejan_variables(vars));
		})()
	}, {
		name: "Koppejan - Regressielijnen",
		items: vars.stages.map((stage, i) => {
			return { 
				name: js.sf("Richtingscoëfficiënt regressielijn %d", i + 1), 
				symbol: "rc" + (i + 1), 
				value: stage.koppejan.rc 
			};
		}).concat(
			vars.stages.map((stage, i) => ({ 
				name: js.sf("Nulpunt regressielijn %d", i + 1), 
				symbol: "np" + (i+1), 
				value: stage.koppejan.np 
			}))),
	}, {
		name: "Overig",
		items: [
			{ symbol: "m", name: "Initial Mass", unit: "-", value: vars.m },
			{ symbol: "md", name: "Initial Dry Mass", unit: "-", value: vars.md },
			{ symbol: "mf", name: "Final Mass", unit: "-", value: vars.mf },
			{ symbol: "mdf", name: "Final Dry Mass", unit: "-", value: vars.mdf },
		]
	}];
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

    [("#refresh"), {
		on: function() {
			var Parser = require("papaparse/papaparse");
			var options = this.vars(["options"]) || {
				// delimiter: "",	// auto-detect
				// newline: "",	// auto-detect
				// quoteChar: '"',
				// escapeChar: '"',
				// header: false,
				// dynamicTyping: false,
				// preview: 0,
				// encoding: "",
				// worker: false,
				// comments: false,
				// step: undefined,
				// complete: undefined,
				// error: undefined,
				// download: false,
				// skipEmptyLines: false,
				// chunk: undefined,
				// fastMode: undefined,
				// beforeFirstChunk: undefined,
				// withCredentials: undefined
			};
			var vars = this.up().vars("variables", {});
			var headerValue = (key, parse/*default true*/) => {
				key = key.toLowerCase();
				key = (vars.headers.filter(_ => _.name.toLowerCase().startsWith(key))[0] || {});
				return parse === false ? key.raw : key.value;
			};

		/*- parse lines => headers, columns and measurements */		
			var ace = this.udr("#ace");
			var lines = ace.getLines().filter(_ => _.length); if(lines.length < 2) return; //can't be good
			var headers = lines.filter(_ => _.split("\"").length < 15);
			var measurements = lines.filter(_ => _.split("\"").length > 15);
	
		/*- parse columns */
			vars.columns = measurements.shift().split(",").map(removeQuotes);
		
		/*- parse headers */	
			vars.headers = headers.map(_ => _.split("\",\"")).filter(_ => _.length === 2)
				.map(_ => [removeTrailingColon(_[0].substring(1)), _[1].substring(0, _[1].length - 2)])
				.map(_ => ({category: "Header", name: _[0], value: parseValue(_[1]), raw: _[1]}));
			
		/*- use overrides immediately (if any) */	
			vars.overrides = this.vars(["overrides"]);
		
		/*- setup dataset and variables */
			setup_measurements_1(vars, Parser.parse(measurements.join("\n"), options).data);
			setup_variables_1(vars, headerValue);

			vars.parameters	= [];
			vars.stages = [];

/*- TODO measurements and variables are common? */
			this.udr("#array-measurements").setArray(vars.measurements);
			this.udr("#array-variables").setArray(vars.headers.concat(vars.parameters));
			
			var me = this;
			vars.parameters.update = function update_parameters() {
				// setup_stages_2(vars);
				setup_variables_2(vars, headerValue);
				me.ud("#array-variables").setArray(vars.headers.concat(vars.parameters));
				vars.parameters.update = update_parameters;
			};
			
			// setup_stages_2(vars);
			setup_variables_2(vars, headerValue);

			var edit = this.ud("#edit-graph-stage"), popup = this.ud("#popup-edit-graph-stage");
			popup.destroyControls();
			var n_stages = Math.floor((measurements[measurements.length - 1][key_s] - 1) * 10);
			for(var index = 0 ; index < n_stages; ++index) {
				vars.stages.push({ stage: index })
				new Button({
					action: edit, parent: popup,
					content: js.sf("Trap %d", index + 1), 
					selected: "never", vars: { stage: index }
				});
			}
			
			this.ud("#graphs").getControls().forEach(c => c.setState("invalidated", true));
			
			this.print("parsed", { stages: vars.stages, variables: vars, measurements: measurements });
		}
    }],
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