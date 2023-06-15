define(Util => {

	const locale = window.locale.prefixed("devtools:Renderer:gds:");
	
	const key_s = "Stage Number";
	const key_t = "Time since start of stage (s)";
	const key_T = "Time since start of test (s)";
	const key_r = "Radial Pressue (kPa)";
	const key_d = "Axial Displacement (mm)";
	const key_as = "Axial Stress (kPa)";
	const key_st = "Stress Target (kPa)";
	const treatZeroAs = 0.0001;

	/* Math-like */
	function line_intersect(x1, y1, x2, y2, x3, y3, x4, y4) {
	    var ua, ub, denom = (y4 - y3)*(x2 - x1) - (x4 - x3)*(y2 - y1);
	    if (denom === 0) {
	        return null;
	    }
	    ua = ((x4 - x3)*(y1 - y3) - (y4 - y3)*(x1 - x3))/denom;
	    ub = ((x2 - x1)*(y1 - y3) - (y2 - y1)*(x1 - x3))/denom;
	    return {
	        x: x1 + ua * (x2 - x1),
	        y: y1 + ub * (y2 - y1),
	        seg1: ua >= 0 && ua <= 1,
	        seg2: ub >= 0 && ub <= 1
	    };
	}
	function log_line_intersect(x1, y1, x2, y2, x3, y3, x4, y4) {
	/*- find intersection in logarithimic-plane, straight line on log-scale? 
		>> N = b * g ^ t; (https://www.youtube.com/watch?v=i3jbTrJMnKs) */
	
	/*- (t1,N1), (t2,N2) => g1, b1 */
		var t1 = y1, N1 = x1;
		var t2 = y2, N2 = x2;
		var dt1 = t2 - t1;
		var g1 = Math.pow(N2 / N1, 1 / dt1);
		var b1 = N1 / Math.pow(g1, t1);
	
	/*- (t3,N3), (t4,N4) => g2, b2 */
		var t3 = y3, N3 = x3;
		var t4 = y4, N4 = x4;
		var dt2 = t4 - t3;
		var g2 = Math.pow(N4 / N3, 1 / dt2);
		var b2 = N3 / Math.pow(g2, t3);
	
	/*- TODO find where (b1 * g1 ^ t) === (b2 * g2 ^ t) - for now cheating? */
		var ts = [], delta;
		if(t1 > t4) {
			t1 = [t4, t1];
			t4 = t1.pop();
			t1 = t1.pop();
		}
	
		// >>  b1/b2 * g1 ^ t1 = g2 ^ t2 => WHERE t1 = t2 //=> a * b^x = c^x
		
		/*- TODO cheating part -> refactor to some sort of bubble sort mechanism? */
		for(var t = t1; t < t4; t += (t4 - t1) / 5000) {
			var obj = { t: t, N1: b1 * Math.pow(g1, t),  N2: b2 * Math.pow(g2, t) };
			if((obj.delta = Math.abs(obj.N2 - obj.N1)) < delta || delta === undefined) {
				delta = obj.delta;
				ts.unshift(obj);
			}
		}
		if(ts.length === 0) ts = [{}];
	
		return {
			sN1N2: {x: ts[0].N1, y: ts[0].t}, ts: ts,
			t1: t1, t2: t2, N1: N1, N2: N2, dt1: dt1, g1: g1, b1: b1,
			t3: t3, t4: t4, N3: N3, N4: N4, dt2: dt2, g2: g2, b2: b2
		};
	}
	function log_line_calc(N1, N2, t1, t2) {
		/*- straight line on log-scale? >> N = b * g ^ t; (https://www.youtube.com/watch?v=i3jbTrJMnKs) 
			(t1,N1), (t2,N2) => g1, b1  >>> t = Math.log(N / b) / Math.log(g); */
		var dt = t2 - t1;
		var g = Math.pow(N2 / N1, 1 / dt);
		var b = N1 / Math.pow(g, t1);
		
		return {b: b, g: g, N1: N1, N2: N2, t1: t1, t2: t2, dt: dt, dt_1: 1/dt };
	} 
	function calc_derivatives(measurements, y, x) {
		/*- assumes x and y attributes and a logarithmic scale along the X-axis */
		y = y || "y";
		x = x || "x";
		
		var prev1, next1, next2, prev2, dt;
		measurements.forEach((current, idx, arr) => {
			next1 = arr[idx + 1];
			next2 = arr[idx + 2];
			if(prev1 && next1) {
				
				dt = Math.log10(next1[x] / current[x]);
				// dt = Math.log(next1[x] / current[x]);
	
				current[y + "'"] = (next1[y] - prev1[y]) / (2*dt);
				current[y + "''"] = (next1[y] - (2 * current[y]) + prev1[y]) / (dt*dt);
				current[y + "'''"] = (next2 && prev2) && (next2[y] - 2*next1[y] + 2*prev1[y] - prev2[y]) / 2*(dt*dt*dt);
	
				current["d" + y] = current[y] - prev1[y];
				current["d" + y + "'"] = current[y + "'"] - prev1[y + "'"];
				current["d" + y + "''"] = current[y + "''"] - prev1[y + "''"];
				current["d" + y + "'''"] = current[y + "'''"] - prev1[y + "'''"];
			}
			prev2 = prev1;
			prev1 = current;
		});
	}
	function calc_T(d50, dA, dB, tA, tB) {
		return Math.pow(10, ((d50 - dA) / (dB - dA)) * Math.log10(tB / tA) + Math.log10(tA));
	}

	const parseValue = (value) => typeof value === "string" && value !== "" ? isNaN(value = value.replace(",", ".")) ? value : parseFloat(value) : value;
	const removeQuotes = (str) => str.replace(/"/g, "");
	const removeTrailingColon = (s) => s.replace(/\:$/, "");
	const sort_numeric = (i1, i2) => parseFloat(i1) < parseFloat(i2) ? -1 : 1;
	const cp = (obj) => {
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
	const valueOf = (measurement, name) => {
		if(measurement.hasOwnProperty(name)) {
			return parseValue(measurement[name]);
		}
		
		name = name.split("(")[0].replace(/\s$/g, "");
		for(var k in measurement) {
			if(k.split("(")[0].replace(/\s$/g, "") === name) {
				return parseValue(measurement[k]);
			}
		}
	};
	const rateOfStrain = (arr, index) => {
		/*-	ROS = (εn - εn-1) / ((tn - tn-1) / 3600)				
		
			ROS: rate of strain (reksnelheid) in % / uur
			εn: Axiale Rek bij datarij n (%)
			εn-1: Axiale Rek bij datarij n-1(%)
			tn: Tijd in afschuifsfase bij datarij n (s)
			tn-1: Tijd in afschuifsfase bij datarij n-1 (s)
			
			3600: eenheidsconversiefactor (van s tot uur)
			
			GEGEVENS
			ε2: 2 %
			ε1: 1.95 %
			t2: 1600 s
			t1: 1540 s
			
			ROS = (2 - 1.50) / (1600 - 1540) / 3600
			ROS = 3.125 % / uur
			
			The ROS for the test could be called from the test device. Alternatively, it could be possible to estimate by applying this formula on each datarow from the shearing phase, starting from datarow 2, and then calculate the average value from the second datarow to the last.					
		*/	
		
		if(index < 1) return 0;
		
		const mt = arr[index];
		const mt_1 = arr[index - 1];
		const en = valueOf(mt, "Axial Strain");
		const en_1 = valueOf(mt_1, "Axial Strain");
		const tn = valueOf(mt, "Time since start of test");
		const tn_1 = valueOf(mt_1, "Time since start of test");
		
		return (en - en_1) / ((tn - tn_1) / 3600);
	};

	const setup_measurements_1 = (vars, measurements) => {
		
		vars.measurements = measurements.filter(_ => _.length).map(values => {
			var obj = {};
			vars.columns.forEach((key, index) => obj[key] = Util.parseValue(values[index]));
			
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
		
	};
	const setup_variables_1 = (vars, headerValue) => {
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

		vars.t = vars.headerValue("Membrane Thickness");
		
		vars.y = vars.m / (Math.PI / 4 * vars.D * vars.D * vars.H) * vars.G;
		vars.yd = vars.md / (Math.PI / 4 * vars.D * vars.D * vars.H) * vars.G;
		vars.w0 = (vars.m - vars.md) / vars.md * 100;
		vars.pd = vars.yd / (vars.G / 1000);
		vars.e0 = (vars.ps / vars.pd) - 1;
		vars.Sr = (vars.w0 * vars.ps) / (vars.e0 * vars.pw);

function calc_dH(vars, stage) {
	var ms = (stage !== undefined ? vars.stages[stage] : vars).measurements;
	var min = ms[0].z;
	var max = ms.length ? ms[ms.length - 1].z : undefined;

	return max === undefined ? 0 : max - min;
}

		vars.dH = calc_dH(vars);
	/*- initial vars */
		vars.Hi = vars.H;
		vars.Vi = vars.V;
		vars.Ai = vars.A;
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
	};
	const setup_measurements_2 = (vars) => {
	/*- lineaire en natuurlijke rek */
		var H0 = vars.measurements[0].z; // always 0?
		vars.measurements.forEach(obj => {
			obj.EvC = (obj.z - H0) / vars.H;
			obj.EvH = -Math.log(1 - obj.EvC);
		});
	};
	const setup_stages_1 = (vars) => {
		var measurements = vars.measurements;
		var length = measurements.length;
		var n_stages = Math.floor((measurements[length - 1][Util.key_s] - 1) * 10);
	
		function e_(stage) {
			/*-
				Hs = H0/(1 + e0)
				ef = (Hf - Hs ) / Hs"	
				e0 = ρs/ρd - 1
				
				-e0: initial void ratio (-)
				-ef: void ratio at the end of each load stage (-)
				-H0: initial height of specimen (mm)
				-Hs: height of solids (mm)
				-ρs: particle density (density of solid particles) (Mg/m3)
				-ρd: dry particle density (Mg/m3)"
				
					H0= 20.20 mm		ρs=  2.65 Mg/m3
					γd = 10.21 kN/m3 (calculated previously)
					ρd=  γd/9.81
	
					ρd=  10.21 / 9.81 = 1.04 Mg/m3
					e0= 2.65/1.04 - 1 = 1.5481
					
					Hs= 20.20 / (1 + 1.5481) = 7.9275 mm
					
					Bij eind Trap 3:  Gecorrigeerd totaal vervorming: 0.8082 mm
					Hf= 20.20 - 0.8082 = 19.3918 mm 	ef= (19.3918 - 7.9275) / 13.42 = 0.8543
			*/
			var H = stage.Hf;
			var yd = vars.md / (Math.PI / 4 * vars.D * vars.D * H) * vars.G;
			var pd = yd / (vars.G / 1000);
			return vars.ps / pd - 1;
		}
		function mv_(stage) {
			/*- 
				mv = ((Hi - Hf) / Hi) * (1000 / (σ'v2 - σ'v1))	
				
				"-mv: coefficient of volume compressibility (Mpa-1)
				-Hi: height of specimen at start of load stage
				-Hf: height of specimen at end of load stage
				-σ'v2: vertical effective stress after load increment (kPa)
				-σ'v1: vertical effective stress before load increment (kPa)"			
			*/
			
			var index = vars.stages.indexOf(stage);
			if(index === vars.stages.length - 1) return NaN;
			
			var Hi = stage.Hf, Hf = vars.stages[index + 1].Hf;
			var ov1 = stage.effective, ov2 = vars.stages[index + 1].effective;
			
			return ((Hi - Hf) / Hi) * (1000 / (ov2 - ov1));
		}
	
		vars.stages = [];
		for(var st = 1; st <= n_stages; ++st) {
			var ms = measurements.filter(_ => _.stage === st), _;
			if(ms.length > 0) {
				vars.stages.push({
					measurements: ms, 
					Hi: vars.H - ms[0][Util.key_d],
					Hf: vars.H - ms[ms.length - 1][Util.key_d],
					target: ms[ms.length - 1][Util.key_st],
					effective: ms[ms.length - 1][Util.key_as]
				});
			}
		}
		
		vars.stages.forEach((stage, i) => {
			stage.i = i;
			stage.e0 = e_(stage);
			stage.mv = mv_(stage);
			stage.EvC = stage.measurements[stage.measurements.length - 1].EvC;
			stage.EvH = stage.measurements[stage.measurements.length - 1].EvH;
		});
	};
	const setup_stages_2 = (vars, only_this_stage) => {
		function CvT_(stage, wantsTaylor) {
			/*- 	
				TAYLOR
			
					-L: length of drainage path = 0.5*H (half of the specimen height of drainage from both ends) (m)
					-t90: time to 90% primary consolidation (s)
					-fT: temperature correction factor.
					
					GEGEVENS (VAN TRAP 3)
					H0= 20.20 mm
					Gecorrigeerd totaal vervorming voor begin Trap 3: 0.4998 mm
					Proeftemperatuur= 10 oC
					Temperatuurcorrectie fT voor referentietemperatuur van 20 oC (zie figuur B.5 NEN-EN-ISO 17892-5) = 1.3
					√t90 (Geschat)= 40 s
					
					Hi = 20.20 - 0.4998 = 19.7002 mm
					L = 0.50 * 19.7002 = 9.8501 mm = 9.8501 x 10-3 m )
					t90 = 402 = 1600 s2
					
					cv;20 =0.848 * 0.00985012 * 1.3 / 1600 = 6.68 x 10-8 m2/s"					
			
				CASAGRANDE
			
					"-L: length of drainage path = 0.5*H (half of the specimen height of drainage from both ends) (m)
					-t50: time to 50% primary consolidation (s)
					-fT: temperature correction factor."	
					
					"GEGEVENS (VAN TRAP 3)
					H0= 20.20 mm
					Gecorrigeerd totaal vervorming voor begin Trap 3: 0.4998 mm
					Proeftemperatuur= 10 oC
					Temperatuurcorrectie fT voor referentietemperatuur van 20 oC (zie figuur B.5 NEN-EN-ISO 17892-5) = 1.3
					log t50 (Geschat)= 2 (zie Opmerkingen)
	
					cv;20 = 0.197 * L2 * fT / t50			
					
					Hi = 20.20 - 0.4998 = 19.7002 mm
					L = 0.50 * 19.7002 = 9.8501 mm = 9.8501 x 10-3 m
					t50 = 10logt50 = 102 = 100 s
					
					cv;20 =0.197 * 0.00985012 * 1.3 / 100 =2.48 x 10-7 m2/s"					
			*/
			var L = 0.5 * stage.Hi; 
			var fT = 1, cf = wantsTaylor ? 0.848 : 0.197;
			var t = wantsTaylor ? stage.taylor.t90[0] : stage.casagrande.t50[0];
			return t !== undefined ? cf * (L*L / (1000*1000)) * fT / t : t;
		}
		function kT_(stage, wantsTaylor) {
			var r = CvT_(stage, wantsTaylor) * stage.mv * vars.pw * vars.G * 0.00000981;
			return isNaN(r) ? undefined : r;
		}
		
		function Cc_(stage) {
			/*-
				Cc (primaire) = -Δe / log ((σ'v + Δσ'v)/σ'v)
				
				- Δe= e2 - e1: change in void ratio 
				- σ'v: vertical effective stress before load increment (kPa)
				- σ'v + Δσ'v: vertical effective stress after load increment Δσ'v (kPa)"
	
				GEGEVENS (Data from steepest e-log p segment) 
				- e1= 1.4461 === segment with smallest slope_e before decompression stage
				- e2= 1.3144 === next segment
				- σ'v1= 50 kPa
				- σ'v2= 125 kPa
			
				Cc= - (1.3144 - 1.4461) / log (125/50)
				Cc= 0.3310
			*/
			
			var index = vars.stages.indexOf(stage);
			var points = js.get("overrides.bjerrum_e.points_pg", vars);
			
			if(index === -1) {//typeof stage === "string") {
				if(points) {
					if(stage === "onder") {
						return -(points[1].y - points[0].y) / Math.log10(points[1].x / points[0].x);
					} else if(stage === "boven") {
						return -(points[3].y - points[2].y) / Math.log10(points[3].x / points[2].x);
					}	
				} else if(stage === "onder") { 
					stage = vars.stages[0]; 
				} else if(stage === "boven") {
					stage = vars.stages[2];
				}
			}
	
			if(index === vars.stages.length - 1) return NaN;
	
			var e1 = stage.e0, e2 = vars.stages[index + 1].e0;
			var sv1 = stage.effective, sv2 = vars.stages[index + 1].effective;
	
			return -(e2 - e1) / Math.log10(sv2 / sv1);
		}
		function Cr_(stage) {
			/*- 
				Cr (primaire herbelasting): Cr = -Δe / log ((σ'v + Δσ'v)/σ'v)
				- Δe= e2 - e1: change in void ratio 
				- σ'v: vertical effective stress before load increment (kPa)
				- σ'v + Δσ'v: vertical effective stress after load increment Δσ'v (kPa)
				
				GEGEVENS (Data from reload e-log p segment)
				- e1= 1.3241
				- e2= 1.304
				- σ'v1= 50 kPa
				- σ'v2= 125 kPa
				
				Cr= - (1.304 - 1.3241) / log (125/50)
				Cr= 0.0505
				Waarden van poriëngetal berekend op basis van proefdata in de GDS-bestand.			
			*/
			return Cc_(stage); // is gewoon hetzelfde
		}
		function Csw_(stage) {
			return Cc_(stage);
		}
	
		function CR_(stage) {
			/*-
				CR = ΔεVC/ log ((σ'v + Δσ'v)/σ'v)
				- ΔεVC= εVC2 - εVC1: change in vertical linear (Cauchy) strain
				- σ'v: vertical effective stress before load increment (kPa)
				- σ'v + Δσ'v: vertical effective stress after load increment Δσ'v (kPa)"
			
				GEGEVENS (Data from steepest εvC-log p segment)
				- εvC1= 4.00%
				- εvC2= 9.17 %
				- σ'v1= 50 kPa
				- σ'v2= 125 kPa
				
				CR= (9.17 - 4.00)/100 / log (125/50)
				CR= 0.1299
			*/
	
			var index = vars.stages.indexOf(stage);
			var points = js.get("overrides.bjerrum_r.points_pg", vars);
			
			if(index === -1) {//typeof stage === "string") {
				if(points) {
					if(stage === "onder") {
						return -(points[1].y - points[0].y) / Math.log10(points[1].x / points[0].x);
					} else if(stage === "boven") {
						return -(points[3].y - points[2].y) / Math.log10(points[3].x / points[2].x);
					}	
				} else if(stage === "onder") { 
					stage = vars.stages[0]; 
				} else if(stage === "boven") {
					stage = vars.stages[2];
				}
			}
	
			if(index === vars.stages.length - 1) return NaN;
			
			var Hi = stage.Hi, Hf = stage.Hf;
			var Evc1 = stage.EvC, Evc2 = vars.stages[index + 1].EvC;
			var sv1 = stage.effective, sv2 = vars.stages[index + 1].effective;
	
			return (Evc2 - Evc1) / Math.log10(sv2 / sv1);
		}
		function RR_(stage) {
			return CR_(stage); // is gewoon hetzelfde
		}
	
		function iso_a_(stage) {
			/*- 
		
				a (voor Pg) a = ΔεVH/ Δlnσ'v
				- a: parameter ""a"" determined from 2 or more measurements (load stages) at the beginning of the test. 
				- εvH= -ln (1 - εvC) : Natural (Hencky) strain measure -σ'v: vertical effective stress 
				
				GEGEVENS (Data from first two load stages in εvH-log p segment) 
				- εvH1= 1.745 % (berekend van lineaire rek Trap 1) 
				- εvH2= 2.501 % (berekend van lineaire rek Trap 2)
				- σ'v1= 13 kPa σ'v2= 25 kPa
		
				a (voor Pg) = (2.501 - 1.745)/ 100 / ln (25/13) a (voor Pg)= 0.01156
				- Determined by the first load stages of the test. 
		
			*/
	
			var index = vars.stages.indexOf(stage);
			var points = js.get("overrides.isotachen.points_pg", vars);
			
			if(index === -1) {//typeof stage === "string") {
				if(points) {
					if(stage === "onder") {
						return -(points[1].y - points[0].y) / Math.log10(points[1].x / points[0].x);
					} else if(stage === "boven") {
						return -(points[3].y - points[2].y) / Math.log10(points[3].x / points[2].x);
					}	
				} else if(stage === "onder") { 
					stage = vars.stages[0]; 
				} else if(stage === "boven") {
					stage = vars.stages[2];
				}
			}
	
			if(index === vars.stages.length - 1) return NaN;
	
			var EvH1 = stage.EvH * 100;
			var EvH2 = vars.stages[index + 1].EvH * 100;
			var pv1 = stage.effective;
			var pv2 = vars.stages[index + 1].effective;
			
			return (EvH2 - EvH1) / 100 / Math.log(pv2 / pv1);
		}
		function iso_b_(stage) {
			/*-
				asw = ΔεVH/ Δlnσ'v
				- asw: parameter ""a"" determined from 2 or more measurements (load stages) during unloading.
				- εvH= -ln (1 - εvC) : Natural (Hencky) strain measure
				- σ'v: vertical effective stress "
				
				GEGEVENS (Data from unloading segment in εvH-log p plot)
				- εvH1= 9.618 % (berekend van lineaire rek Trap 4)
				- εvH2= 9.201 % (berekend van lineaire rek Trap 5)
				- σ'v1= 125 kPa
				- σ'v2= 50 kPa
	
				asw = (9.201 - 9.618)/ 100 / ln (50/125)
				asw= 0.00455
			*/
			return iso_a_(stage);
		}
		function iso_c_(stage) {
			/*-
				c = ΔεVH/ Δln ((t - t1)/t0)
				
				-c: creep parameter ""c""  determined from a log t - εvH plot.
				-εvH= -ln (1 - εvC) : Natural (Hencky) strain measure
				-t: time
				-t1: start time of the load step where c is being calculated
				-t0: reference time of 1 day.
				
				GEGEVENS
				(Data from Trap 7 in εvH-log t plot)
				εvH1= 14.896415 % (berekend van lineaire rek)
				εvH2= 15.466748 % (berekend van lineaire rek)
				t1= 24360 s
				t2= 86070 s
				
				c = (15.466748 - 14.896415)/ 100 / (ln 86070 - ln 24360)
				c= 0.004518
			*/
	
			var EvH1 = (stage.isotachen.mt1.EvH) * 100;
			var EvH2 = (stage.isotachen.mt2.EvH) * 100;
	
			var t1 = stage.isotachen.dt1;
			var t2 = stage.isotachen.dt2;
			
			return (EvH2 - EvH1) / 100 / (Math.log(t2 / t1));
		}
		
		function koppejan(stage) {
	
			var points = js.get("overrides.koppejan.points_pg", vars);
			if(!points) return NaN;
			
			var serie2 = js.get("koppejan.serie2", vars);
			if(!serie2) return NaN;
	
			var onder = (js.get("overrides.koppejan.label-onder", vars) || "1-2").split("-").map(_ => parseInt(_, 10) - 1);
			var boven = (js.get("overrides.koppejan.label-boven", vars) || "3-4").split("-").map(_ => parseInt(_, 10) - 1);
			
			var st = stage === "onder" ? onder : boven;
			var ob = stage === "onder" ? [0, 1] : [2, 3];
	
			var d = Math.log(points[ob[1]].x / points[ob[0]].x);
			var d10 = Math.log10(points[ob[1]].x / points[ob[0]].x);
			var H = vars.Hi;
			
			var Cp = 1 / (((serie2[st[1]].ez1 - serie2[st[0]].ez1) / H) / d);
			var Cs = 1 / (((serie2[st[1]].ez10 - serie2[st[0]].ez10) / H) / d - (1 / Cp));
			var C = (1 / ((points[ob[1]].y - points[ob[0]].y) / H)) * d;
			var C10 = (1 / ((points[ob[1]].y - points[ob[0]].y) / H)) * d10;
	
			return {	
				Cp: Cp,
				Cs: Cs,
				C: C,
				C10: C10
			};
			
		}
		
		var Cc_name = "Cc", CR_name = "CR";
		vars.stages.forEach((stage, i) => {
			if(only_this_stage !== undefined && i !== only_this_stage) return;
			
			if(i < vars.stages.length - 1) {
				if(Cc_name === "Csw") {
					Cc_name = "Cr"; CR_name = "RR";
				} else if(Cc_name === "Cr") {
					Cc_name = "Cc"; CR_name = "CR";
				} else if(stage.target > vars.stages[i + 1].target) {
					Cc_name = "Csw"; CR_name = "SR";
				}
			}
			
			stage.casagrande.cv = CvT_(stage);
			stage.casagrande.k = kT_(stage);
			stage.taylor.cv = CvT_(stage, true);
			stage.taylor.k = kT_(stage, true);
			stage.Cc_ = Cc_name;
			stage.Cc = Cc_(stage);
			stage.CR_ = CR_name;
			stage.CR = CR_(stage);
			stage.isotachen.a = iso_a_(stage);
			stage.isotachen.b = iso_b_(stage);
			stage.isotachen.c = iso_c_(stage);
			
			stage.update = (method) => {
				if(method === "all") {
					stage.casagrande.update();
					stage.taylor.update();
					stage.isotachen.update();
				}
				
				if(method === "all" || method === "bjerrum_e" || method === "bjerrum_r") {
					setup_bjerrum(vars);
					stage.Cc_ = Cc_name;
					stage.Cc = Cc_(stage);
					stage.CR_ = CR_name;
					stage.CR = CR_(stage);
				}
				
				if(method === "all" || method === "isotachen") {
					setup_isotachen(vars);
					stage.isotachen.a = iso_a_(stage);
					stage.isotachen.b = iso_b_(stage);
					stage.isotachen.c = iso_c_(stage);
				}
			};
		});
		
		vars.overrides = vars.overrides || {};
		["bjerrum_e", "bjerrum_r", "isotachen", "koppejan"].forEach(k => vars.overrides[k] = vars.overrides[k] || {});
		
		js.mi(vars.overrides.bjerrum_e, {
			onder: Cc_("onder"),
			boven: Cc_("boven")
		});
		js.mi(vars.overrides.bjerrum_r, {
			onder: CR_("onder"),
			boven: CR_("boven")
		});
		js.mi(vars.overrides.isotachen, {
			onder: iso_a_("onder"),
			boven: iso_b_("boven")
		});
		js.mi(vars.overrides.koppejan, {
			onder: koppejan("onder"),
			boven: koppejan("boven")
		});
	};

	function setup_bjerrum(vars) {
		// everything is already setup except for poriengetal (e)
	
		var points_e, points_rek, LLi_e, LLi_rek;
		var data_e = vars.stages.map(stage => ({ x: stage.target, y: stage.e0 }));
		var data_rek = vars.stages.map(stage => ({ x: stage.target, y: stage.EvC }));
		
		if((points_e = js.get("overrides.bjerrum_e.points_pg", vars))) {
			LLi_e = log_line_intersect(
				points_e[0].x, points_e[0].y, points_e[1].x, points_e[1].y, 
				points_e[2].x, points_e[2].y, points_e[3].x, points_e[3].y);
		} else {
			LLi_e = log_line_intersect(
				data_e[0].x, data_e[0].y, data_e[1].x, data_e[1].y, 
				data_e[2].x, data_e[2].y, data_e[3].x, data_e[3].y);
		}
		
		if((points_rek = js.get("overrides.bjerrum_r.points_pg", vars))) {
			LLi_rek = log_line_intersect(
				points_rek[0].x, points_rek[0].y, points_rek[1].x, points_rek[1].y, 
				points_rek[2].x, points_rek[2].y, points_rek[3].x, points_rek[3].y);
		} else {
			LLi_rek = log_line_intersect(
				data_rek[0].x, data_rek[0].y, data_rek[1].x, data_rek[1].y, 
				data_rek[2].x, data_rek[2].y, data_rek[3].x, data_rek[3].y);
		}
	
		vars.bjerrum = {
			data_e: data_e, 
			points_e: points_e,
			LLi_e: LLi_e, 
			data_rek: data_rek, 
			points_rek: points_rek,
			LLi_rek: LLi_rek
		};
	}
	function setup_isotachen(vars) {
		var LLi_e, points;
		var data = vars.stages.map(stage => ({ x: stage.target, y: stage.EvH }));
		
		if((points = js.get("overrides.isotachen.points_pg", vars))) {
			LLi_e = log_line_intersect(
				points[0].x, points[0].y, points[1].x, points[1].y, 
				points[2].x, points[2].y, points[3].x, points[3].y);
		} else {
			LLi_e = log_line_intersect(
				data[0].x, data[0].y, data[1].x, data[1].y, 
				data[2].x, data[2].y, data[3].x, data[3].y);
		}
		
		/* for the values of the c-parameter, the curve (EvH log t) should be considered */
		var x = "minutes", y = "y_isotachen_c";
	
		/*- for each stage determine the slope for c */
		vars.stages.forEach((stage, index) => {
			function calc() {
	
				/*- setup for minutes and recalculate derivatives */
				vars.measurements.forEach(m => { 
					m.x = m.minutes_log10; 
					m.y = (m[y] = m.EvH * 100);
				});
				calc_derivatives(vars.measurements, "y_isotachen_c");
	
				var measurements = stage.measurements.slice(1);
				var last = measurements[measurements.length - 1];
				var y0 = measurements[0][y];
				var yZ = last[y];
	
			/*- determine DEF */
				var idx = 0, vpnn = [], vnnp = [];
				while(measurements[idx].minutes < 150) { /*- TODO why 150 minutes?! */
					if(idx && (measurements[idx - 1]["dy_isotachen_c'"] < 0) && (measurements[idx]["dy_isotachen_c'"] > 0)) {
						vpnn.push(measurements[idx]);
					}
					idx++;
				}
				while(idx < measurements.length) {
					if(idx && (measurements[idx - 1]["dy_isotachen_c'"] > 0) && (measurements[idx]["dy_isotachen_c'"] < 0)) {
						vnnp.push(measurements[idx]);
					}
					idx++;
				}
	
				var guides = [], trendLines = [], def;
				var overrides = js.get("overrides.isotachen.stage" + index + ".lines", vars);
				if(overrides) {
					if(overrides.DEF) {
						def = [{
							minutes: overrides.DEF.initialXValue, 
							y_isotachen_c: overrides.DEF.initialValue,
						}, {
							minutes: overrides.DEF.finalXValue,
							y_isotachen_c: overrides.DEF.finalValue
						}];
					}
				} else {
					def = [vnnp[0], last];
				}
	
				var DEF = log_line_calc( def[0][x], def[1][x], def[0][y], def[1][y] );
				trendLines.push({
					initialXValue: 1, initialValue: Math.log(1 / DEF.b) / Math.log(DEF.g),
					// finalXValue: 1400, finalValue: Math.log(1400 / DEF.b) / Math.log(DEF.g),
					// initialXValue: DEF.b * Math.pow(DEF.g, 0), initialValue: 0,
					finalXValue: DEF.b * Math.pow(DEF.g, yZ), finalValue: yZ,
					lineColor: "red", lineThickness: 1, editable: true
				});
	
				var dt1 = vnnp[0][x], dt2 = last[x];
				var d1 = vnnp[0][y], d2 = last[y];
		
				var c = (d2 - d1) / Math.log10(dt2 / dt1);
	
				stage.isotachen = {
					DEF: DEF,
					guides: guides, 
					trendLines: trendLines,
					
					// c: c,
	
					d1: d1, d2: d2,
					dt1: dt1, dt2: dt2, 
					mt1: vnnp[0], mt2: last,
	
					update: function() { calc(); }
				};
			}
			calc();
		});
	
		vars.isotachen = { data_e: data,  LLi_e: LLi_e, points_e: points };
	}

	return (Util = {
		key_s: key_s, 
		key_t: key_t, 
		key_T: key_T, 
		key_d: key_d, 
		key_as: key_as, 
		key_st: key_st, 
		treatZeroAs: treatZeroAs,
		
		cp: cp,
		parseValue: parseValue,
		removeQuotes: removeQuotes,
		removeTrailingColon: removeTrailingColon,
		sort_numeric: sort_numeric,
		
		drainUsed: (id) => locale("DrainUsed#" + id),
		
		valueOf: valueOf,
		rateOfStrain: rateOfStrain,

		setup_measurements_1: setup_measurements_1,
		setup_variables_1: setup_variables_1,
		setup_measurements_2: setup_measurements_2,
		setup_stages_1: setup_stages_1,
		setup_stages_2: setup_stages_2,
		
		setup_bjerrum: setup_bjerrum,
		setup_isotachen: setup_isotachen
	});

});