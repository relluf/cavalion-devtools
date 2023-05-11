"use ./Util, locale!./locales/nl, vcl/ui/Button, vcl/ui/Tab, papaparse/papaparse, amcharts, amcharts.serial, amcharts.xy, lib/node_modules/regression/dist/regression, ";

window.locale.loc = 'nl'; // TODO

const js = require("js");
const regression = require("lib/node_modules/regression/dist/regression");

const GDS = require("./Util");
const Button = require("vcl/ui/Button");
const Tab = require("vcl/ui/Tab");
const Control = require("vcl/Control");

const locale = window.locale.prefixed("devtools:Renderer:gds:");

/* Setup (must be called in same order) */
function setup_stages(vars, sacosh) {
	/*- find highest "B Value"
	
		B-check - In the sample reports this seems to be recalled by GDS from the datapoint with the highest B-value (see column "B Value").
	*/
	const indexOf = (stage, measurement) => stage.measurements.indexOf(measurement);
	const maxOf = (stage, name) => {
		var max, r;
		stage.measurements.map(measurement => {
			const value = GDS.valueOf(measurement, name);
			if(r === undefined || max < value) {
				r = measurement;
				max = value;
			}
		});
		return r;
	};

	vars.stages.map(stage => {
		stage.dH = (() => {
			var ms = stage.measurements;
			var min = ms[0].z;
			var max = ms.length ? ms[ms.length - 1].z : undefined;
		
			return max === undefined ? 0 : max - min;
		})();
		stage.dV = GDS.valueOf(stage.measurements[stage.measurements.length - 1], "Volume Change") * -1;
		stage.ui = GDS.valueOf(stage.measurements[0], "Pore Pressure");
		stage.uf = GDS.valueOf(stage.measurements[stage.measurements.length - 1], "Pore Pressure");
		// stage.measurements.map((measurement, index, arr) => {
		// 	const value = GDS.valueOf(measurement, "B Value");
		// 	if(stage.b === undefined || stage['B Value'] < value) {
		// 		stage.b = measurement;
		// 		stage['B Value'] = value;
		// 	}
		// });
		stage.b = maxOf(stage, "B Value");
		stage["B Value"] = stage.b["B Value"];
	});
	
	if(vars.stages.SA === undefined) {
		vars.stages.SA = vars.stages.saturation = vars.stages[sacosh.SA];
		vars.stages.CO = vars.stages.consolidation = vars.stages[sacosh.CO];
		vars.stages.SH = vars.stages.shearing = vars.stages[sacosh.SH];
	}

	js.mi((vars.stages.SA), {

		// RP = Radial Pressure increase 
		// BP = Back Pressure increasre
		// CP - BP = Cell Pressure - Back Pressure
		// CP = Cell Pressure
		// PP = Pore Water Pressure
		// delta RP / delta CP

	});
	js.mi((vars.stages.CO), {
		o3: (() => {
			/*- Effectieve celdruk: σ'3 = σc - ub
	
				σ'3= effectieve celdruk voor consolidatiefase (effective consolidation pressure) (kPa)
				σc= total cell pressure applied in chamber at the time the effective consolidation pressure is reached (kPa)
				ub= total back pressure applied at the time effective consolidation pressure is reached (kPa)
				
				Effectieve Celdruk (kPa): effective cell pressure applied to the specimen before starting the
				consolidation stage. This is the difference between the cell (radial) pressure and the back
				pressure [at the time the target effective consolidation pressure is reached], before allowing
				drainage to take place. The effective cell pressure (or effective consolidation pressure) is
				defined by the test schedule and the calculation allows for verification.
				
			*/
			var mt = vars.stages.CO.measurements[0];
			
			var r = GDS.valueOf(mt, "Eff. Radial Stress");
			var oc = GDS.valueOf(mt, "Radial Pressure");
			var ub = GDS.valueOf(mt, "Back Pressure");
			
			console.log(js.sf("o3: %s === %s", oc - ub, r));
			
			return r;
		})(),
		o1: (() => {
			/*-	σ'1= σ'3 + q
			
				σ'1= vertical effective stress at the end of consolidation (kPa)
				σ'3= effective consolidation stress or effective radial stress at the end of consolidation (kPa)
				q= deviator stress applied vertically (kPa)"
			
			*/
			var st = vars.stages.CO;
			var ms = st.measurements;
			var mt = ms[ms.length - 1];
			
			return GDS.valueOf(mt, "Eff. Radial Stress") + GDS.valueOf(mt, "Deviator Stress");
		})(),
		V: (() => {
			/*- Vc = V0 - ΔVc
			
				Vc: geconsolideerd volume van proefstuk na consolidatie (mm3)
				ΔVc: volumeverandering in proefstuk na consolidatie (mm3)
				V0: volume van proefstuk voor test (mm3)
			
			*/
			return vars.V - vars.stages.CO.dV;
		})(),
		Evol: (() => {
			/*- εvol;c = ΔVc/V0 x 100
			
				εvol;c: volumetrische rek na consolidatie (%)
				ΔVc: volumeverandering in proefstuk na consolidatie (mm3)
				V0: volume van proefstuk voor test (mm3)
				
			*/
			return vars.stages.CO.dV / vars.V * 100;
		})(),
		H: (() => {
			/*-	Hc = H0 - ΔHc
				
				Hc : height of specimen at the end of the consolidation phase (mm)
				H0 : initial height of specimen (mm)
				ΔHc: change in height of specimen during consolidation (mm) (vertical displacement)
				
			*/
			
			return vars.H - vars.stages.CO.dH;
		})(),
		mvT: (() => {
			/*- mv = ΔVc/V0 / (ui - uc) x 1000
			
				mv : volume compressibility (MPa-1)
				ΔVc: volumeverandering in proefstuk na consolidatie (mm3)
				V0: volume van proefstuk voor test (mm3)
				ui: poriënwaterspanning bij begin van consolidatie (kPa)
				uf: poriënwaterspanning bij eind van consolidatiefase (kPa)
			*/
			
			var st = vars.stages.CO;
			return (st.dV / vars.V) / (st.ui - st.uf) * 1000;
		})(),
		cvT: (() => {
			/*-	cv;20 = 0.848 * L2 * fT / t90x
			
				-L: length of drainage path = 0.5*H (half of the specimen height of drainage from both ends) (m)
				-t90: time to 90% primary consolidation (s)
				-fT: temperature correction factor."
			*/
		})(),
		EvT: (() => {
			/*-	εv;c = ΔHc / H0 x 100

				εv;c = verticale rek na consolidatie (%)
				Hc : proefstukshoogte na consolidatie (mm)
				H0 : initiële proegstukshoogte (mm)
				ΔHc: proefstukshoogteverandering tijdens consolidatie (mm) (verticale vervorming)
			*/
		})()
	});
	js.mi((vars.stages.CO), {
		A: (() => {
			/*- Ac = (V0 - ΔVc) / (H0 - ΔHc)
			
				Ac: geconsolideerde oppervlakte na consolidatie (mm2)
				Vc: geconsolideerd volume van proefstuk na consolidatie (mm3)
				ΔVc: volumeverandering in proefstuk na consolidatie (mm3)
				V0: volume van proefstuk voor test (mm3)
				Hc : proefstukshoogte na consolidatie (mm)
				H0 : initiële proegstukshoogte (mm)
				ΔHc: proefstukshoogteverandering tijdens consolidatie (mm) (verticale vervorming)
			*/
			var st = vars.stages.CO;
			return (vars.V - st.dV) / (vars.H - st.dH);
		})(),
		K0: (() => {
			/*-	K0 = σ'3/ σ'1
			
				K0 = earth pressure coefficient at rest (Dimensionless)
				σ'3= effective consolidation pressure (kPa)
				σ'1= effective vertical pressure (kPa)"
			*/
			var st = vars.stages.CO;
			return st.o3 / st.o1;
		})()
	});

	const values = (mt) => {
		const r = {
			ar: GDS.valueOf(mt, "Axial Strain"),
			q_corr: (() => {
				/*-	qcor = q - Δqfilter - Δqmembrane				
				
					qcor: corrected deviator stress (kPa)
					q: measured deviator stress (raw) (kPa)
					Δqfilter: correction in deviator stress during shear due to filter paper drains
					Δqmembrane: correction in deviator stress during shear due to membrane (kPa)
	
					qcor is calculated for all data rows during shear phase and the maximum value is selected
					
					GEGEVENS
					q = 200 kPa
					Δqfilter = 5.2 kPa
					Δqmembrane = 6.1 kPa
					
					qcor = 200 - 5.2 - 6.1
					qcor = 188.70 kPa
				*/
				const q = GDS.valueOf(mt, "Deviator Stress");
				const dq_filter = 40; // TODO 
				const dq_membrane = 32; // TODO
				
				return q - dq_filter + dq_membrane;
			})(),
			o3: GDS.valueOf(mt, "Eff. Radial Stress")
		};
		
		r.o1 = r.o3 / r.q_corr;
		r.o13 = r.o1 / r.o3;
		r.es = (r.o1 + r.o3) / 2;
		r.te = (r.o1 - r.o3) / 2;
		r.phi = 1; // TODO
		r.ce = 2; // TODO
		r.e50und = (() => {
			/*- E50;und = (qmax/2) / (εqmax / 2 / 100) / (1000)
			
				E50;und = Young's modulus at 50% of maximum deviator stress (MPa)
				qmax= maximum deviator stress (kPa) (corrected!)
				εqmax= axial strain at maximum deviator stress (in %)
				
				GEGEVENS:
				qmax = 250 kPa
				εqmax = 12 %

				E50;und = (250/2)/(12/2/100)/(1000)
				E50;und = 2.08 MPa
			*/
			var q_max = GDS.valueOf(mt, "Deviator Stress");
			var E_q_max = GDS.valueOf(mt, "Axial Strain");
			
			return (q_max / 2) / (E_q_max / 2 / 100) / 1000;
		})();
		
		return r;
	};

	js.mi((vars.stages.SH), {
		// Mohr-Coulomb Parameters bij Max Deviatorspanning
		// max q -	Called from calculation section, field "Axial Strain (%)", corresponding to max corrected deviator stress
		max_q: values(maxOf(vars.stages.SH, "Deviator Stress")),


		// Mohr-Coulomb Parameters bij Max Hoofdspanningsverhouding σ'1/σ'3
		// max o1 - Called from calculation section; field "Axial Strain (%)", corresponding to max effective stress ratio σ'1/σ'3.
		max_o13: values(maxOf(vars.stages.SH, "Eff. Stress Ratio")),
		
		// Mohr-Coulomb Parameters bij NN % Axiale Rek
		// max o3 - Called from calculation section; field "Axial Strain (%)". User-defined strain value for which values and parameters will be reported.
		max_NN: values(vars.stages.SH.measurements[222])
	});
}
function setup_measurements(vars) {

/*-
	O = 2 pi r
	A = pi r2
	r = sqrt(A/pi)
*/

	const Ac = js.get("stages.CO.A", vars);
	const r = Math.sqrt(Ac / Math.pi);
	const O = 2 * Math.PI * r;
	
	vars.stages.forEach(stage => stage.measurements.map((mt, index, arr) => {

		mt.txVC = GDS.valueOf(mt, "Volume Change") * -1;
		mt.txPPD = GDS.valueOf(mt, "Pore Pressure");
		mt.txPWPR = GDS.valueOf(mt, "PWP Ratio");
		
		if(stage === vars.stages.SH) {
			mt.ROS = GDS.rateOfStrain(arr, index);
			
	 		mt.Evs = GDS.valueOf(mt, "Axial Displacement") / vars.stages.CO.Hf * 100;
	
			// Filter Paper Correction
			mt.do1_fp = (() => {
			
				/*-	(∆ σ1) fp = ε1 * Kfp * Pfp * O / (0.02 * Ac)
					             
					ε1: axial strain during shear phase (in decimal form) (if axial strain is in %, it must be divided by 100)
					Kfp: load (when fully mobilized) carried by the filter paper covering a unit length of the specimen perimeter (kPa/mm).
					Pfp: fraction of perimeter covered by the filter paper. Pfp may be up to 0.50 (50 %) of the perimeter of the specimen.
					Ac: specimen area at the end of the consolidation stage (mm2).
					O: circumference of the specimen at the end of the consolidation stage. Can be calculated from the specimen area at the end of consolidation stage. (mm)
				*/
		
				var E1 = GDS.valueOf(mt, "Axial Strain") / 100;
				var Kfp = stage.Kfp;
				var Pfp = stage.Pfp;
		
		 		if(mt.Evs < 2) {
		 			return E1 * Kfp * Pfp * O / (0.02 * Ac);
		 		}
		 		
		 		return Kfp * Pfp * O / Ac;
			})();

			// Membrane Correction [CO, SH] – ISO/TS 17892-9 
			mt.do1_m = (() => {
				/*-	vertical:	(∆σ1)m = (4*t*E) / D1 [ (ε1)m + ((εvol)m / 3)]

					(ε1)m: vertical strain of the membrane (expressed in decimal form).
					(εvol)m: volumetric strain of the membrane (expressed in decimal form).
					D1: initial diameter of the membrane (diameter before it is placed on specimen) (mm).
					t: initial thickness of the membrane (mm)
					E: elastic modulus for the membrane, measured in tension (kPa)					
				*/

			})();
			mt.do3_m = (() => {
				
				/*-	horizontal:	(∆σ3)m = (4*t*E) / D1 [ (εvol)m / 3]
					
					(ε1)m: vertical strain of the membrane (expressed in decimal form).
					(εvol)m: volumetric strain of the membrane (expressed in decimal form).
					D1: initial diameter of the membrane (diameter before it is placed on specimen) (mm).
					t: initial thickness of the membrane (mm)
					E: elastic modulus for the membrane, measured in tension (kPa)					
				*/
				
			})();
			
			// Membrane Correction [SH] – based on ASTM D4767-11/NEN 5117 and Greeuw et al.
			mt.do1_m_alt = (() => {
				/*-	(∆σ1)m = α*(4*t*E*εv;s / (D1 × 100))
					
					α: correction factor (slope) for first segment of bilinear function (unitless)
					β: correction factor (slope) for second segment of bilinear function (unitless)
					εv;s: axial strain during shear phase, with respect to height of specimen at the
					beginning of shear stage (in %)
					εv;knikpunt: axial strain where breakpoint is defined, as a function of the calibration data
					(in %).
					(Δσ1)m: vertical stress correction due to membrane (kPa), applicable in the raw
					deviator stress.
					D1: initial diameter of the membrane (diameter before it is placed on specimen) (mm).
					t: initial thickness of the membrane (mm)
					E: elastic modulus for the membrane, measured in tension (kPa)
				*/

				var breakpoint = 2, a  = 1, t = 3, E = 2, D1 = 2.3;
				return mt.Evs < breakpoint ?
					a * (4 * t * E * mt.Evs / (D1 * 100)) :
					a * (4 * t * E * mt.Evs / (D1 * 100));

			})();

		}

	}));
}
function setup_parameters(vars) {
	const hvis = (section, items) => items.map(item => {
		var k, r = {
			name: locale(js.sf("Section:%s-%s", section, item[0]))
		};

		["unit", "symbol"].map(key => {
			if(locale.has((k = js.sf("Section:%s-%s.%s", section, item[0], key)))) {
				r[key] = locale(k);
			}
		});

		if(item.length === 1 && r.symbol) {
			r.value = js.get(r.symbol, vars);
		} else if(typeof item[1] === "string") {
			r.value = vars.headerValue(item[1], true);
		} else if(typeof item[1] === "function") {
			r.value = item[1]();
		} else { 
			r.value = "?";
		}
		
		if(typeof item[2] === "function") { // transform
			r.value = item[2](r.value);
		}

		return r;
	});
	const category = (section, items, cb) => {
		var r = {
			name: locale("Section:" + section + ".title"),
			items: hvis(section, items)
		};
		if(cb) cb(r);
		return r;
	};

/*- E8: A0 = π/4 * D0^2 */
	vars.A = vars.Ai = Math.PI / 4 * vars.D * vars.D;	
	vars.mi = vars.m;
	vars.mdi = vars.md;

/*-	E12: ρ0;nat = m0;nat / (π/4 * D02 * H0) * 1000 */
	if(isNaN(vars.pi)) {
		vars.pi = vars.mi / (Math.PI/4 * vars.D * vars.D * vars.H) * 1000;
	}

/*-	E13: ρ0;droog = m0;droog / (π/4 * D02 * H0) * 1000 */
	if(isNaN(vars.pdi)) {
		vars.pdi = vars.mdi / (Math.PI/4 * vars.D * vars.D * vars.H) * 1000;
	}

/*- E14: w0 (%) = ( m0;nat - m0;droog) / m0;droog * 100 % */
	if(isNaN(vars.wi)) {
		vars.wi = (vars.mi - vars.mdi) / vars.mdi * 100;
	}
	
/*-	E15: S0 = (w0 * ρs) / (e0 * ρs) */
	vars.Sri = (vars.wi * vars.ps) / (vars.e0 * vars.ps);
	
/*-	E17: e0 = ρs/ρd - 1 */
	if(isNaN(vars.ei = vars.e0)) {
		vars.ei = vars.e0 = vars.ps / vars.pdi - 1;
	}

/*-	E20 wf (%) = ( mf;nat - m0;droog) / m0;droog * 100 % */
	if(isNaN(vars.wf)) {
		vars.wf = (vars.mf - vars.mdi) / vars.mdi * 100;
	}

/*- E21 ρf;nat = mf;nat / (π/4 * D02 * H0 - ΔVc - ΔV) * 1000 * 1000 */
	if(isNaN(vars.pf)) {
		vars.pf = vars.mf / (Math.PI / 4 * vars.D * vars.D * vars.H + vars.stages.CO.dV) * 1000;
	}
	if(isNaN(vars.pdf)) {
		vars.pdf = vars.mdi / (Math.PI / 4 * vars.D * vars.D * vars.H + vars.stages.CO.dV) * 1000;
	}
	
	const meas_b = (st, name) => GDS.valueOf(vars.stages[st].b, name);
	const meas_0 = (st, name) => GDS.valueOf(vars.stages[st].measurements[0], name);
	const meas_N = (st, name) => GDS.valueOf(vars.stages[st].measurements[vars.stages[st].measurements.length - 1], name);
	
	const shearItems = [
			["axialStrain"],
			["deviatorStressCorrected"],
			["effectiveHorizontalStress"],
			["effectiveVerticalStress"],
			["sigma1/3"],
			["es"],
			["te"],
			["phi"],
			["ce"],
			["e50und"]
		];
	const adjustC = (type, key) => (c) => {
		c.name += js.sf(" - %s", locale("Section:ShearPhase-" + type));
		c.items.forEach(item => {
			if(item.symbol && item.symbol.startsWith(".")) {
				// item.symbol = js.sf("stages.SH.%s.%s", key, item.symbol.substring(1));
				item.value = js.get(js.sf("stages.SH.%s.%s", key, item.symbol.substring(1)), vars)
			}
		});
	};

	vars.categories = [
		category(("Project"), [
			["projectcode", "Job reference"],
			["description", "Job Location"],
			["borehole", "Borehole"],
			["sample", "Sample Name"],
			["date", "Sample Date"]
		]),
		category(("Sample"), [
			["description", "Description of Sample"],
			["specimen", "Depth"],
			["commotion", "Specimen Type"]
		]),
		category(("Initial"), [
			["height", "Initial Height"],
			["diameter", "Initial Diameter"],
			["surface"],
			["volume"],
			["sampleMassWet", "Initial Mass"],
			["sampleMassDry", "Initial dry mass"],
			["densityWet"],
			["densityDry"],
			["waterContent"],
			["grainDensity"],
			["poreNumber"]
		]),
		category(("Final"), [
			["densityWet"],
			["densityDry"],
			["waterContent"],
			["poreNumber"]
		]),
		category(("TestRun"), [
			["start", "Date Test Started"],
			["end", "Date Test Finished"],
			["drainTopUsed", "Top Drain Used", GDS.drainUsed],
			["drainBaseUsed", "Base Drain Used", GDS.drainUsed],
			["drainSidesUsed", "Side Drains Used", GDS.drainUsed],
			["pressureSystem", "Pressure System"],
			["cellNumber", "Cell No."]
		]),
		category(("Saturation"), [
			["increaseCellPressure", () => meas_b("SA", "Radial Pressure") - meas_0("SA", "Radial Pressure")],
			["increaseBackPressure", () => meas_b("SA", "Back Pressure") - meas_0("SA", "Back Pressure")],
			["differentialPressure", () => meas_b("SA", "Radial Pressure") - meas_b("SA", "Back Pressure")],
			["saturationPressure", () => meas_b("SA", "Radial Pressure")],
			["poreWaterPressure", () => meas_b("SA", "Pore Pressure")],
			["bAfterSaturation", () => meas_b("SA", "B Value")]
		]),
		category(("Consolidation"), [
			["effectiveCellPressure"], 
			["cellPressure", () => meas_0("CO", "Radial Pressure")],
			["backPressure", () => meas_0("CO", "Back Pressure")],
			["poreWaterOverpressure", () => meas_0("CO", "Pore Pressure")],
			["finalPoreWaterPressure", () => meas_N("CO", "Pore Pressure")],
			["consolidatedVolume"],
			["consolidatedHeight"],
			["consolidatedArea"],
			["volumetricStrain"],
			["volumeCompressibility"],
			["consolidationCoefficient"],
			["verticalStrain"],
			["effectiveVerticalStress"],
			["k0AfterConsolidation"],
			["consolidationType", () => "TODO"],
		]),
		category(("ShearPhase"), [
			["cellPressure", () => meas_0("SH", "Radial Pressure")],
			["poreWaterPressure", () => meas_0("CO", "Pore Pressure")],
			["strainRate"]
			// ["maxDeviatorStress"],
			// ["maxPrincipalStressRatio"],
			// ["axialStrain2%"],
		]),
		category(("ShearPhase"), shearItems, adjustC("maxDeviatorStress", "max_q")),
		category(("ShearPhase"), shearItems, adjustC("maxPrincipalStressRatio", "max_o13")),
		category(("ShearPhase"), shearItems, adjustC("axialStrain2%", "max_NN"))
	];
	vars.parameters = vars.categories.map(_ => (_.items || []).map(kvp => js.mi({ category: _ }, kvp))).flat();
}

function makeChart(c, opts) {
	function render(options) {
		var node = options.node || this.getNode();
	
		this.print(this.vars("am"));
		
		var defaults = {
		    mouseWheelZoomEnabled: true, zoomOutText: " ", 
		    mouseWheelScrollEnabled: false,
		    // chartScrollbar: {
		    //     oppositeAxis: true,
		    //     offset: 30,
		    //     scrollbarHeight: 20,
		    //     backgroundAlpha: 0,
		    //     selectedBackgroundAlpha: 0.1,
		    //     selectedBackgroundColor: "#888888",
		    //     graphFillAlpha: 0,
		    //     graphLineAlpha: 0.5,
		    //     selectedGraphFillAlpha: 0,
		    //     selectedGraphLineAlpha: 1,
		    //     autoGridCount: true,
		    //     color: "#AAAAAA"
		    // },
		    chartCursor: {
		        // pan: true,
		        valueLineEnabled: true,
		        valueLineBalloonEnabled: true,
		    	categoryBalloonDateFormat: "D MMM HH:NN",
		    	color:"black",
		        cursorAlpha:0.5,
		        cursorColor:"#e0e0e0",
		        valueLineAlpha:0.2,
		        valueZoomable:true
		    },
		    
		    // processCount: 1000,
		    // processTimeout: 450,
			// autoMarginOffset: 10,
			// autoMargins: false,
			// marginLeft: 60,
			// marginBottom: 30,
			// marginTop: 30,
			// marginRight: 30,
		
			numberFormatter: { decimalSeparator: ",", thousandsSeparator: "" },
			
		    type: "xy",  
		    colors: ["rgb(56, 121, 217)", "black"],
		    // legend: { useGraphSettings: true },
			dataProvider: this.vars("am.data"),
			// minValue: 1, maxValue: 0,
		    valueAxes: [{
		        id: "y1", position: "left",
		        reversed: true
			}, {
				position: "bottom", 
				logarithmic: options.xAxisLogarithmic,
				title: options.xAxisTitle
			}]
		};
		options = js.mixIn(defaults, options);
		options.graphs = options.graphs || this.vars("am.series").map(serie => {
			return js.mixIn({
	        	type: "line", lineThickness: 2,
		        connect: serie.connect || false,
			    xField: serie.categoryField || "x", yField: serie.valueField || "y",
			    yAxis: serie.yAxis || "y1"
		    }, serie);
		});
		
		// var serializing = this.vars(["pdf"]);
		var serializing = this.ud("#graphs").hasClass("pdf");
		
		options.valueAxes.forEach(ax => {
			ax.includeGuidesInMinMax = true;
			if(serializing) {
				delete ax.title;
			} else {
				ax.zoomable = true;
			}
			// ax.ignoreAxisWidth = true;
			// ax.inside = true;
		});
		// options.valueAxes.forEach(ax => ax.precision = 4);
		var emit = (a, b) => {
			// this.print("emit: " + a, b);
			this.emit(a, b);
		};
		var chart = AmCharts.makeChart(node, options);

		this.vars("am.chart", chart);
		// this.print("rendering", options);

		chart.addListener("drawn", (e) => emit("rendered", [e, "drawn"]));
		chart.addListener("dataUpdated", (e) => emit("rendered", [e, "dataUpdated"]));
		chart.addListener("rendered", (e) => emit("rendered", [e]));
		chart.chartCursor.addListener("moved", (e) => emit("cursor-moved", [e]));
		// chart.addListener("init", (e) => emit("rendered", [e, "init"]));
		// chart.addListener("zoomed", (e) => emit("zoomed", [e]));
		// chart.addListener("changed", (e) => emit("changed", [e]));
	}
	opts.immediate ? render.apply(c, [opts || {}]) : c.nextTick(() => render.apply(c, [opts || {}]));
}

/* Event Handlers */
const handlers = {
	"#tabs-sections onChange": function tabs_change(newTab, curTab) {
		this.ud("#bar").setVisible(newTab && (newTab.vars("bar-hidden") !== true));
	},
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
	
	"#bar-select-stages onNodeCreated"() {
		this.setParent(this.udr("#bar").getParent());
		this.setIndex(1);
	},
	"#bar-select-stages onRender"() {
		var vars = this.vars(["variables"]);
		if(vars === undefined) return;
		
		var stages = this.vars("stages");
		if(stages === vars.stages.length) return;
		
		this.vars("stages", vars.stages.length);
		
		var stages = vars.stages;
		var options = stages.map((s, i, a) => ({
			content: js.sf("%s %d", locale("Stage"), i + 1),
			value: i
		}));
		this.ud("#select-stage-SA").set({ 
			options: options, 
			value: stages.indexOf(stages.SA) 
		});
		this.ud("#select-stage-CO").set({ 
			options: options, 
			value: stages.indexOf(stages.CO) 
		});
		this.ud("#select-stage-SH").set({ 
			options: options, 
			value: stages.indexOf(stages.SH) 
		});
	},
	
	"#bar-select-stages onDispatchChildEvent"(component, name, evt, f, args) {
		if(name === "change") {
    		var vars = this.vars(["variables"]);
    		
    		delete vars.stages.SA;
    		delete vars.stages.CO;
    		delete vars.stages.SH;
    		
			this.setTimeout("refresh", () => this.ud("#refresh").execute(), 250);
		}
	},

	"#graphs onDispatchChildEvent"(child, name, evt, f, args) {
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
	"#graph_VolumeChange onRender"() {
		var vars = this.vars(["variables"]) || { stages: [] };
		var selected = [3];

		this.vars("rendering", true);

		/*- reset */
		var content = [], st;
		for(st = 0; st < vars.stages.length; ++st) {
			content.push(js.sf("<div>%s %s</div>", locale("Stage"), st));
		}
		this._node.innerHTML = content.join("");
		
		var render = () => {
			var stage = vars.stages[st];
			var series = [{
				title: js.sf(locale("Graph:VolumeChange.title.stage-F"), st + 1),
				valueAxis: "y1", valueField: "txVC", 
				categoryField: "minutes_sqrt"
			}];
			this.vars("am", { series: series, stage: stage, data: stage.measurements });
			this.vars("am-" + st, this.vars("am"));
			makeChart(this, {
				immediate: true, node: this.getChildNode(st),
				// trendLines: Util.cp(stage.casagrande.trendLines || []),
			    valueAxes: [{
			        id: "y1", position: "left", reversed: true,
					// guides: Util.cp(stage.casagrande.guides.filter(guide => guide.position === "left" || guide.position === "right"))
				}, {
					id: "x1", position: "bottom",
					title: js.sf(locale("Graph:VolumeChange.title.stage-F"), st + 1),
					// guides: Util.cp(stage.casagrande.guides.filter(guide => guide.position === "top" || guide.position === "bottom")),
					// logarithmic: true
				}]
			});
				
			if(++st < vars.stages.length) {
				this.nextTick(render);
			} else {
				selected.forEach(selected => this.getChildNode(selected - 1).classList.add("selected"));
				this.vars("rendering", false);
			}
		};

		st = 0; vars.stages.length && render();
	},
	"#graph_PorePressureDissipation onRender"() {
		var vars = this.vars(["variables"]) || { stages: [] };
		var selected = [3];//js.get("overrides.casagrande.stage", vars) || [3];

		/*- reset */
		var content = [], st;
		for(st = 0; st < vars.stages.length; ++st) {
			content.push(js.sf("<div>%s %s</div>", locale("Stage"), st));
		}
		this._node.innerHTML = content.join("");
		this.vars("rendering", true);
		
		var render = () => {
			var stage = vars.stages[st];
			var series = [{
				title: js.sf(locale("Graph:PorePressureDissipation.title.stage-F"), st + 1),
				valueAxis: "y1", valueField: "txPWPR", 
				categoryField: "minutes"
			}];
			this.vars("am", { series: series, stage: stage, data: stage.measurements });
			this.vars("am-" + st, this.vars("am"));
			makeChart(this, {
				immediate: true, node: this.getChildNode(st),
				// trendLines: Util.cp(stage.casagrande.trendLines || []),
			    valueAxes: [{
			        id: "y1", position: "left", reversed: true,
					// guides: Util.cp(stage.casagrande.guides.filter(guide => guide.position === "left" || guide.position === "right"))
				}, {
					id: "x1", position: "bottom",
					title: js.sf(locale("Graph:PorePressureDissipation.title.stage-F"), st + 1),
					// guides: Util.cp(stage.casagrande.guides.filter(guide => guide.position === "top" || guide.position === "bottom")),
					logarithmic: true,
					treatZeroAs: GDS.treatZeroAs
				}]
			});
				
			if(++st < vars.stages.length) {
				this.nextTick(render);
			} else {
				selected.forEach(selected => this.getChildNode(selected - 1).classList.add("selected"));
				this.vars("rendering", false);
			}
		};

		st = 0; vars.stages.length && render();
	}
};

["", {
	handlers: handlers,
	vars: { 
		layout: "grafieken/documenten/Triaxiaalproef",
		graphs: [
			"VolumeChange",
			"PorePressureDissipation",
			// "DeviatorStress",
			// "WaterOverpressure",
			// "EffectiveHighStressRatio",
			// "ShearStress",
			// "DeviatorStressQ"
		]
	}
}, [

    [("#refresh"), { 
    	vars: { 
    		setup() {
				const vars = this.vars(["variables"]), n = vars.stages.length;
				const sacosh = {SA: n - 3, CO: n - 2, SH: n - 1};
				
				if(!Object.keys(sacosh).every(k => {
					if(isNaN(sacosh[k] = parseInt(this.ud("#select-stage-" + k).getValue(), 10))) {
						vars.parameters = [];
						vars.categories = [];

						return false;
					}
					return true;
				})) return this.ud("#bar-select-stages").render();

    			setup_stages(vars, sacosh);
    			setup_measurements(vars);
    			setup_parameters(vars);
    		}
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
			this.ud("#graphs").getControls().map(c => c.render)();
    	}
    }],
    
    ["vcl/ui/Bar", ("bar-select-stages"), { 
    	index: 0,
    	css: {
    		"": "text-align: center;",
    		"*:not(.{Group})": "display: inline-block; margin: 2px;",
    		".{Input}": "max-width: 50px;"
    	}
    }, [
    	["vcl/ui/Element", { content: locale("Stage#SA") + ":" }],
    	["vcl/ui/Select", ("select-stage-SA"), { }],
    	["vcl/ui/Element", { content: locale("Stage#CO") + ":" }],
    	["vcl/ui/Select", ("select-stage-CO"), { }],
    	["vcl/ui/Element", { content: locale("Stage#SH") + ":" }],
    	["vcl/ui/Select", ("select-stage-SH"), { }],
    	["vcl/ui/Group", { css: "display: block;"}, [
	    	["vcl/ui/Element", { 
	    		content: locale("FilterPaper-loadCarried") + ":",
	    		hint: locale("FilterPaper-loadCarried.hint")
	    	}],
	    	["vcl/ui/Input", ("input-Kfp"), { 
	    		hint: locale("FilterPaper-loadCarried.hint")
	    	}],
	    	["vcl/ui/Element", { 
	    		content: js.sf("(%H)", locale("FilterPaper-loadCarried.unit")),
	    		hint: locale("FilterPaper-loadCarried.hint")
	    	}],
	    	["vcl/ui/Element", { 
	    		content: locale("FilterPaper-perimeterCovered") + ":",
	    		hint: locale("FilterPaper-perimeterCovered.hint")
	    	}],
	    	["vcl/ui/Input", ("input-Pfp"), {
	    		hint: locale("FilterPaper-perimeterCovered.hint")    		
	    	}],
	    	["vcl/ui/Element", { 
	    		content: js.sf("(%H)", locale("FilterPaper-perimeterCovered.unit")),
	    		hint: locale("FilterPaper-perimeterCovered.hint")
	    	}]
    	]]
    ]],

	[("#tabs-graphs"), {}, [

		["vcl/ui/Tab", { text: locale("Graph:VolumeChange"), control: "graph_VolumeChange" }],
		["vcl/ui/Tab", { text: locale("Graph:PorePressureDissipation"), control: "graph_PorePressureDissipation" }],
		["vcl/ui/Tab", { text: locale("Graph:DeviatorStress"), control: "graph_DeviatorStress" }],
		["vcl/ui/Tab", { text: locale("Graph:WaterOverpressure"), control: "graph_WaterOverpressure" }],
		["vcl/ui/Tab", { text: locale("Graph:EffectiveHighStressRatio"), control: "graph_EffectiveHighStressRatio" }],
		["vcl/ui/Tab", { text: locale("Graph:ShearStress"), control: "graph_ShearStress" }],
		["vcl/ui/Tab", { text: locale("Graph:DeviatorStressQ"), control: "graph_DeviatorStressQ" }],

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
		["vcl/ui/Panel", ("graph_VolumeChange"), {
			align: "client", visible: false, 
			classes: "multiple"
		}],
		["vcl/ui/Panel", ("graph_PorePressureDissipation"), {
			align: "client", visible: false, 
			classes: "multiple"
		}],
		["vcl/ui/Panel", ("graph_DeviatorStress"), {
			align: "client", visible: false, 
			classes: "multiple"
		}],
		["vcl/ui/Panel", ("graph_WaterOverpressure"), {
			align: "client", visible: false, 
			classes: "multiple"
		}],
		["vcl/ui/Panel", ("graph_EffectiveHighStressRatio"), {
			align: "client", visible: false, 
			classes: "multiple"
		}],
		["vcl/ui/Panel", ("graph_ShearStress"), {
			align: "client", visible: false, 
			classes: "multiple"
		}],
		["vcl/ui/Panel", ("graph_DeviatorStressQ"), {
			align: "client", visible: false, 
			classes: "multiple"
		}],

		[("#panel-edit-graph"), {}, [
		]]
	]]
]];