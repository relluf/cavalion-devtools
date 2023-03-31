define((require) => ({
	
	"devtools:Renderer:gds:": {
		"Stage":								"Trap",
		"Edit.trendlines":						"Lijnen muteren",
		
		"Consolidated":							"Geconsolideerde",
		"Drianed":								"Gedraineerde",
		"Undrianed":							"Ongedraineerde",
		"TriaxialTest":							"Triaxiaalproef",
		"NEN-EN-ISO":							"NEN-EN-ISO 17892-9:2018",
		
// Staat van het monster
// Preparatiemethode

		"Graph:": {
			"Casagrande":						"Casagrande",
			"Taylor":							"Taylor",
			"Isotachen_c":						"Isotachen (c)",
			"Bjerrum_e":						"Bjerrum (poriëngetal)",
			"Bjerrum":							"Bjerrum (rek)",
			"Isotachen":						"Isotachen",
			"Koppejan":							"Koppejan",
			
			"VolumeChange":						"Volumeverandering",
			"PorePressureDissipation":			"Poriëndrukdissipatie",
			"DeviatorStress":					"Deviatorspanning",
			"WaterOverpressure":				"Wateroverdruk",
			"EffectiveHighStressRatio":			"Effectieve hoogspannigsverhouding",
			"ShearStress":						"Schuifspanning",
			"DeviatorStressQ":					"Deviatorspanning (q)"
		},
		"Section:": {
			"General": {
				".title":						"Algemene informatie",
				"-projectcode":				{	'': "Projectnummer"	},
				"-description":				{	'': "Projectomschrijving"	},
				"-borehole":				{	'': "Boring" },
				"-sample":					{	'': "Monster" },
				"-specimen":				{	'': "Diepte",						'.unit': "m-mv" },
				"-date":					{	'': "Datum",						'.unit': "dd/mm/yyyy" },
				"-commotion":				{	'': "Beroering" }
			},
			"Sample": {
				".title":						"Monsterbeschrijving"
			},
			"Initial": {
				".title":						"Initiële waarden",
				"-height":					{	'': "Hoogte",						'.unit': "mm",		'.symbol': "Hi"		},
				"-diameter":				{	'': "Diameter", 					'.unit': "mm",		'.symbol': "D"		},
				"-surface":					{	'': "Oppervlakte",					'.unit': "mm",		'.symbol': "Ai"		},
				"-volume":					{	'': "Volume",						'.unit': "cm3",		'.symbol': "Vi"		},
				"-sampleMassWet":			{	'': "Massa proefstuk nat",			'.unit': "g",		'.symbol': "mi"	},
				"-sampleMassDry":			{	'': "Massa proefstuk droog",		'.unit': "g",		'.symbol': "mdi"	},
				"-densityWet":				{	'': "Dichtheid nat",				'.unit': "Mg/m3",	'.symbol': "pi"	}, // volumieke massa
				"-densityDry":				{	'': "Dichtheid droog",				'.unit': "Mg/m3",	'.symbol': "pdi"	}, // droge volumieke massa
				"-waterContent":			{	'': "Watergehalte", 				'.unit': "%",		'.symbol': "w0"		},
				"-saturation":				{	'': "Verzadigingsgraad",			'.unit': "%",		'.symbol': "Sri"	},
				"-grainDensity":			{	'': "Korreldichtheid",				'.unit': "Mg/m3",	'.symbol': "psi"	},
				"-poreNumber":				{	'': "Poriëngetal",					'.unit': "-",		'.symbol': "ei"		},
			},
			"Final": {
				".title":						"Uiteindelijke waarden",
				"-densityWet":				{	'': "Dichtheid nat",				'.unit': "Mg/m3",	'.symbol': "pNf"	}, // volumieke massa
				"-densityDry":				{	'': "Dichtheid droog",				'.unit': "Mg/m3",	'.symbol': "pDf"	}, // droge volumieke massa
				"-waterContent":			{	'': "Watergehalte", 				'.unit': "%",		'.symbol': "wf"		},
				"-poreNumber":				{	'': "Poriëngetal",					'.unit': "-",		'.symbol': "e0f"	},
			},
			"Photos": {
				".title":						"Foto's"
			},
			"TestRun": {
				".title":						"Proefuitvoering",
				"-start":					{	'': "Start datum",					'.unit': "dd/mm/yyyy" },
				"-end":						{	'': "Eind datum",					'.unit': "dd/mm/yyyy" },
				"-drainTopUsed":			{	'': "Bovenafvoer gebruikt" },
				"-drainBaseUsed":			{	'': "Basisafvoer gebruikt" },
				"-drainSidesUsed":			{	'': "Zijafvoer gebruikt" },
				"-pressureSystem":			{	'': "Druksysteem" },
				"-celNumber":				{	'': "Celnummer" }
			},
			"Saturation": {
				".title":						"Verzadiging",
				"-increaseCellPressure":	{	'': "Celdruk verhoging",			'.unit': "kPa"	},
				"-increaseBackPressure":	{	'': "Tegendruk verhoging",			'.unit': "kPa"	},
				"-differentialPressure":	{	'': "Differentiële druk",			'.unit': "kPa"	},
				"-saturationPressure":		{	'': "Eindverzadigingsdruk", 		'.unit': "kPa" },
				"-poreWaterPressure":		{	'': "Eindporiewaterdruk",			'.unit': "kPa" },
				"-bAfterSaturation":		{	'': "B-factor na verzadiging" }
			},
			"Consolidation": {
				".title":						"Consolidatie",
				"-effectiveCellPressure":	{	'': "Effectieve celdruk",			'.unit': "kPa" },
				"-backPressure":			{	'': "Tegendruk",					'.unit': "kPa" },
				"-poreWaterOverpressure":	{	'': "Poriënwateroverdruk",			'.unit': "kPa" },
				"-finalPoreWaterPressure":	{	'': "Finale poriënwaterduk",		'.unit': "kPa" },
				"-consolidatedVolume":		{	'': "Geconsolideerd volume",		'.unit': "cm3" },
				"-consolidatedHeight":		{	'': "Geconsolideerde hoogte",		'.unit': "mm" },
				"-consolidatedArea":		{	'': "Geconsolideerde oppervlakte",	'.unit': "mm2" },
				"-volumetricStrain":		{	'': "Volumetrische rek",			'.unit': "%" },
				"-verticalStrain":			{	'': "Verticale rek",				'.unit': "%" },
				"-volumeCompressibility":	{	'': "Volume samendrukbaarheid",		'.unit': "m2/kN" },
				"-consolidationCoefficient":{	'': "Consolidatiecoëfficient",		'.unit': "m2/s" },
				"-effectiveVerticalStress":	{	'': "Effectieve verticale spanning",'.unit': "kPa" },
				"-k0AfterConsolidation":	{	'': "K0-factor na consolidatie",	'.unit': "-" },
				"-consolidationType":		{	'': "Type consolidatie" }
			},
			"ConsolidationPhase": {
				".title":						"Consolidatiefase"
			},
			"ShearPhase": {
				".title":						"Afschuiffase",
				"-initialCellPressure": 	{	'': "Initiële celdruk", 			'.unit': "kPa" },
				"-initialPoreWaterPressure":{	'': "Initiële poriënwaterdruk", 	'.unit': "kPa" },
				"-strainRate":				{	'': "Reksnelheid", 					'.unit': "%/hr" },

				"-maxDeviatorStress":		{	'': "Maximale deviatorspanning" }, 
				"-maxPrincipalStressRatio": {	'':	"Maximale hoofdspanningsverhouding σ'1/σ'3" },
				"-axialStrain2%":			{	'': "Bij 2% axial rek" },

				"-axialStrain": 			{	'': "Axiale rek",					'.unit': "%" },
				"-deviatorStressCcorrected":{	'': "Deviatorspanning (gecorr.)",	'.unit': "kPa" },
				"-effectiveHorizontalStress":{	'': "Effectieve horizontale spanning",'.unit': "kPa" },
				"-effectiveVerticalStress":	{	'': "Effectieve verticale spanning",'.unit': "kPa" },
				"-sigma1/3":				{	'': "σ'1/σ'3" },
				"-es":						{	'': "s'",							'.unit': "kPa" },// 43.82 54.31 90.96
				"-te":						{	'': "t'",							'.unit': "kPa" },// 45.18 44.16 67.55
				"-phi": 					{	'': "φ'",							'.unit': "degs" },
				"-ce":						{	'': "c'",							'.unit': "kPa" },
				"-e50und":					{	'': "E50.und",						'.unit': "MPa"}
			}
		}
	}
	
}));