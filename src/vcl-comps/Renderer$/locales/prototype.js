define((require) => ({
	
	"devtools:Renderer:gds": {
		"Stage":								"Trap",
		"Edit.trendlines":						"Lijnen muteren",
		
		"Consolidated":							"Geconsolideerde",
		"Drianed":								"Gedraineerde",
		"Undrianed":							"Ongedraineerde",
		"TriaxialTest":							"Triaxiaalproef",
		"NEN-EN-ISO":							"NEN-EN-ISO 17892-9:2018",
		
		"Graph:VolumeChange":					"Volumeverandering",
		"Graph:PorePressureDissipation":		"Poriëndrukdissipatie",
		"Graph:DeviatorStress":					"Deviatorspanning",
		"Graph:WaterOverpressure":				"Wateroverspanning",
		"Graph:EffectiveHighStressRatio":		"Effectieve hoogspanningsverhouding",
		"Graph:ShearStress":					"Schuifspanning",
		"Graph:DeviatorStressQ":				"Deviatorspanning (q)",
		
		"Section:": {
			"General": {
				".title":						"Algemene informatie",
				"-projectcode":				{	label: "Projectnummer"	},
				"-description":				{	label: "Projectomschrijving"	},
				"-borehole":				{	label: "Boring" },
				"-sample":					{	label: "Monster" },
				"-specimen":				{	label: "Diepte", unit: "m-mv" },
				"-date":					{	label: "Datum" },
				"-commontion":				{	label: "Beroering" },
			},
			"SampleDesc": {
				".title":						"Monsterbeschrijving"
			},
			"Initial": {
				".title":						"Initiële eigenschappen",
				"-height":					{	label: "Hoogte", unit: "mm"	},
				"-diameter":				{	label: "Diameter", unit: "mm"	},
				"-surface":					{	label: "Oppervlakte", unit: "mm"	},
				"-sampleMassWet":			{	label: "Massa proefstuk nat", unit: "g" },
				"-sampleMassDry":			{	label: "Massa proefstuk droog", unit: "g" },
				"-densityWet":				{	label: "Dichtheid nat", unit: "Mg/m3" },
				"-densityDry":				{	label: "Dichtheid droog", unit: "Mg/m3" },
				"-waterContent":			{	label: "Watergehalte", unit: "%" },
				"-grainDensity":			{	label: "Korreldichtheid", unit: "Mg/m3" },
				"-porenumber":				{	label: "Poriëngetal", unit: "-" }
			},
			"Final": {
				".title":						"Eindcondities",
				"-densityWet":				{	label: "Dichtheid nat", unit: "Mg/m3" },
				"-densityDry":				{	label: "Dichtheid droog", unit: "Mg/m3" },
				"-waterContent":			{	label: "Watergehalte", unit: "%" },
				"-porenumber":				{	label: "Poriëngetal", unit: "-" }
			},
			"Photos": {
				".title":						"Foto's"
			},
			"TestRun": {
				".title":						"Proefuitvoering",
				"-start":					{	label: "Start datum", unit: "dd/mm/yyyy" },
				"-end":						{	label: "Eind datum", unit: "dd/mm/yyyy" },
				"-drainTopUsed":			{	label: "Bovenafvoer gebruikt" },
				"-drainBaseUsed":			{	label: "Basisafvoer gebruikt" },
				"-drainSidesUsed":			{	label: "Zijafvoer gebruikt" },
				"-pressureSystemNo":		{	label: "Druksysteemnummer" },
				"-celNumber":				{	label: "Celnummer" }
			},
			"Saturation": {
				".title":						"Verzadiding",
				"-increaseCellPressure":	{	label: "Celdruk verhoging", unit: "kPa"	},
				"-increaseBackPressure":	{	label: "Tegendruk verhoging", unit: "kPa"	},
				"-differentialPressure":	{	label: "Differentiële druk", unit: "kPa"	},
				"-saturationPressure":		{	label: "Eindverzadigingsdruk", unit: "kPa" },
				"-poreWaterPressure":		{	label: "Eindporiewaterdruk", unit: "kPa" },
				"-bAfterSaturation":		{	label: "B-factor na verzadiging" }
				// celdrukverhoging							cell pressure increase
				// backpressureverhoging					backpressure increase
				// differentieele druk						differential pressure
				// eindverzadigingsspanning					final saturation pressure
				// eindporiewaterspanning					final pore water pressure
				// B-factor na verzadiging					B factor after saturation
			},
			"Consolidation": {
				".title":						"Consolidatie"
				// Effectieve celdruk kPa 25,00 50,00 100,00
				// Celdruk kPa 325 350 400
				// Back Pressure kPa 300 300 300
				// Poriënwateroverspanning kPa -0,12 -0,69 -0,42
				// Eindporiënwaterspanning kPa 299,81 299,27 299,40
				// Geconsolideerd Volume cm3 185,60 192,28 184,21
				// Volumetrische rek % 0,0070 0,0037 0,0095
				// Geconsolideerde Hoogte mm 98,90 97,44 98,66
				// Geconsolideerde Oppervlakte mm2 1876,77 1973,32 1867,47
				// Vol. compressibility m2/kN 1,04E-03 3,21E-04 3,43E-04
				// Consolidatiecoëfficient m2/s 1,03E-05 1,19E-06 2,21E-07
				// Verticale rek % 0,70 0,37 0,95
				// Effectieve verticale spanning kPa 25,00 50,00 100,00
				// K0-factor na consolidatie 1,00 1,00 1,00
				// Type consolidatie Isotroop Isotroop Isotroop
			},
			"ConsolidationPhase": {
				".title":						"Consolidatiefase"
			},
			"ShearPhase": {
				".title":						"Afschuiffase"
				// Initiale celdruk kPa 325 350 400
				// Initiale poriënwaterspanning kPa 300,02 299,267 299,583
				// Reksnelheid %/uur 1,8 1,8 1,8
				// Max. deviatorspanning
				// Axiale rek % 5,913 5,906 5,946
				// Deviatorspanning (gecorr.) kPa 90,37 88,33 135,11
				// Effectieve horizontale spanning kPa 89,01 98,48 158,51
				// Effectieve verticale spanning kPa -1,36 10,15 23,41
				// σ'1/σ'3 -65,447 9,704 6,772
				// s' kPa 43,82 54,31 90,96
				// t' kPa 45,18 44,16 67,55
				// φ' degs
				// c' kPa
				// E50,und MPa 1,53 1,50 2,27
				// Max Hoofdspanningsverhouding σ'
				// 1/σ'3
				// Axiale Rek % 1,401 5,849 5,917
				// Deviatorspanning (gecorr.) kPa 48,89 87,91 134,64
				// Effectieve horizontale spanning kPa 51,78 97,97 157,84
				// Effectieve verticale spanning kPa 2,89 10,06 23,20
				// σ'1/σ'3 17,916 9,741 6,805
				// s' kPa 27,33 54,01 90,52
				// t' kPa 24,44 43,95 67,32
				// φ' degs
				// c' kPa
				// E50,und MPa 3,49 1,50 2,28
				// Bij 2 % Axiale Rek
				// Axiale Rek % 2,000 2,000 2,000
				// Deviatorspanning (gecorr.) kPa 57,77 61,30 92,85
				// Effectieve horizontale spanning kPa 58,30 80,00 133,99
				// Effectieve verticale spanning kPa 0,52 18,70 41,13
				// σ'1/σ'3 111,428 4,277 3,257
				// s' kPa 29,41 49,35 87,56
				// t' kPa 28,89 30,65 46,43
				// φ' degs
				// c' kPa
				// E50,und MPa 2,89 3,06 4,64
}
		}
		

		
		
		// ".label": "onder Pg:",
		// ".label": "boven Pg:"
	}
	
}));