define(Util => {
	
	const key_s = "Stage Number";
	const key_t = "Time since start of stage (s)";
	const key_T = "Time since start of test (s)";
	const key_d = "Axial Displacement (mm)";
	const key_as = "Axial Stress (kPa)";
	const key_st = "Stress Target (kPa)";
	const treatZeroAs = 0.0001;

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
		
		if(measurements.length && !vars.measurements[0].hasOwnProperty(key_as)) {
			if(confirm(js.sf("NB: De data is niet compleet.\n\nWilt u het missende gegeven '%s' afleiden van '%s'?", key_as, key_st))) {
				vars.measurements.forEach(m => (m[key_as] = m[key_st]));
			}
		}
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

	return (Util = {
		key_s: key_s, 
		key_t: key_t, 
		key_T: key_T, 
		key_d: key_d, 
		key_as: key_as, 
		key_st: key_st, 
		treatZeroAs: treatZeroAs,
		
		cp: cp,
		parseValue: (value) => isNaN(value.replace(",", ".")) ? value : parseFloat(value.replace(",", ".")),
		removeQuotes: (str) => str.replace(/"/g, ""),
		removeTrailingColon: (s) => s.replace(/\:$/, ""),
		sort_numeric: (i1, i2) => parseFloat(i1) < parseFloat(i2) ? -1 : 1,
		
		setup_measurements_1: setup_measurements_1,
		setup_variables_1: setup_variables_1,
		setup_measurements_2: setup_measurements_2,
		setup_stages_1: setup_stages_1
	});

});