define((require) => ({
	
	"devtools:Renderer:gds:": {
		"Stage": {
			"":									"Trap",
			"#SA":								"Verzadigingstrap",
			"#CO":								"Consolidatietrap",
			"#SH":								"Afschuiftrap"
		},
		"Edit.trendlines":						"Lijnen muteren",
		
		"Consolidated":							"Geconsolideerde",
		"Drianed":								"Gedraineerde",
		"Undrianed":							"Ongedraineerde",
		"TriaxialTest":							"Triaxiaalproef",
		"NEN-EN-ISO":							"NEN-EN-ISO 17892-9:2018",
		
		"DrainUsed#": {
			"y":								"Ja",
			"n":								"Nee"
		},
		
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
			
			"VolumeChange": {
				"":								"Volumeverandering",
				".title.stage-F":				"Trap %d: volumeverandering [cm3] / tijd [√ minuten] →"
			},
			"PorePressureDissipation": {
				"":								"Poriëndrukdissipatie",
				".title.stage-F":				"Trap %d: poriëndrukdissipatie [%%] / tijd [minuten] →"
			},
			"DeviatorStress": {
				"":								"Deviatorspanning", // Schuifspanning
				".title.stage-F":				"Trap %d: deviatorspanning [kPa] / axiale rek [%%] →"
			},
			"WaterOverpressure": {
				"":								"Wateroverdruk",
				".title.stage-F":				"Trap %d: Wateroverdruk [kPa] / axiale rek [%%] →"
			},
			"EffectiveHighStressRatio": {
				"":								"Effectieve hoogspannigsverhouding",
				".title.stage-F":				"Trap %d: hoofdspanningsverhouding [-] / axiale rek [%%] →"
			},
			"ShearStress": {
				"":								"Schuifspanning",
				".title.stage-F":				"Trap %d: schuifspanning [kN/m2] / effectieve spanning [kN/m2] →"
			},
			"DeviatorStressQ": {
				"":								"Deviatorspanning (q)",
				".title.stage-F":				"Trap %d: deviatorspanning q [kPa] / gem. eff. spanning p' [kPa] →"
			}
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
			"Project": {
				".title":						"Project",
				"-projectcode":				{	'': "Projectnummer"	},
				"-description":				{	'': "Projectomschrijving"	},
				"-borehole":				{	'': "Boring" },
				"-sample":					{	'': "Monster" },
				"-specimen":				{	'': "Diepte",						'.unit': "m-mv" },
				"-date":					{	'': "Datum",						'.unit': "dd/mm/yyyy" },
				"-commotion":				{	'': "Beroering" }
			},
			"Sample": {
				".title":						"Monster",
				"-description":					"Beschrijving",
				"-borehole":				{	'': "Boring" },
				"-sample":					{	'': "Monster" },
				"-specimen":				{	'': "Diepte",						'.unit': "m-mv" },
				"-date":					{	'': "Datum",						'.unit': "dd/mm/yyyy" },
				"-commotion":				{	'': "Beroering" }
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
				"-waterContent":			{	'': "Watergehalte", 				'.unit': "%",		'.symbol': "wi"		},
				"-saturation":				{	'': "Verzadigingsgraad",			'.unit': "%",		'.symbol': "Sri"	},
				"-grainDensity":			{	'': "Korreldichtheid",				'.unit': "Mg/m3",	'.symbol': "ps"	},
				"-poreNumber":				{	'': "Poriëngetal",					'.unit': "-",		'.symbol': "e0"		},
			},
			"Final": {
				".title":						"Uiteindelijke waarden",
				"-densityWet":				{	'': "Dichtheid nat",				'.unit': "Mg/m3",	'.symbol': "pf"	}, // volumieke massa
				"-densityDry":				{	'': "Dichtheid droog",				'.unit': "Mg/m3",	'.symbol': "pdf"	}, // droge volumieke massa
				"-waterContent":			{	'': "Watergehalte", 				'.unit': "%",		'.symbol': "wf"		},
				"-poreNumber":				{	'': "Poriëngetal",					'.unit': "-",		'.symbol': "e0"	},
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
				"-cellNumber":				{	'': "Celnummer" }
			},
			"Saturation": {
				".title":						"Verzadiging",
				"-increaseCellPressure":	{	'': "Celdruk verhoging",			'.unit': "kPa"	},
				"-increaseBackPressure":	{	'': "Achterdruk verhoging",			'.unit': "kPa"	},
				"-differentialPressure":	{	'': "Differentiële druk",			'.unit': "kPa"	},
				"-saturationPressure":		{	'': "Eindverzadigingsdruk", 		'.unit': "kPa" },
				"-poreWaterPressure":		{	'': "Eindporiewaterdruk",			'.unit': "kPa" },
				"-bAfterSaturation":		{	'': "B-factor na verzadiging" }
			},
			"Consolidation": {
				".title":						"Consolidatie",
				"-effectiveCellPressure":	{	'': "Effectieve celdruk",			'.unit': "kPa",			'.symbol': "stages.CO.o3" },
				"-cellPressure":			{	'': "Celdruk",						'.unit': "kPa" },
				"-backPressure":			{	'': "Achterdruk",					'.unit': "kPa" },
				"-poreWaterOverpressure":	{	'': "Poriënwateroverdruk",			'.unit': "kPa" },
				"-finalPoreWaterPressure":	{	'': "Finale poriënwaterduk",		'.unit': "kPa" },
				"-consolidatedVolume":		{	'': "Geconsolideerd volume",		'.unit': "cm3",			'.symbol': "stages.CO.V" },
				"-consolidatedHeight":		{	'': "Geconsolideerde hoogte",		'.unit': "mm",			'.symbol': "stages.CO.H" },
				"-consolidatedArea":		{	'': "Geconsolideerde oppervlakte",	'.unit': "mm2",			'.symbol': "stages.CO.A" },
				"-volumetricStrain":		{	'': "Volumetrische rek",			'.unit': "%",			'.symbol': "stages.CO.Evol" },
				"-verticalStrain":			{	'': "Verticale rek",				'.unit': "%",			'.symbol': "stages.CO.H" },
				"-volumeCompressibility":	{	'': "Volume samendrukbaarheid",		'.unit': "m2/kN",		'.symbol': "stages.CO.mvT" },
				"-consolidationCoefficient":{	'': "Consolidatiecoëfficient",		'.unit': "m2/s",		'.symbol': "stages.CO.cvT" },
				"-effectiveVerticalStress":	{	'': "Effectieve verticale spanning",'.unit': "kPa",			'.symbol': "stages.CO.o1" },
				"-k0AfterConsolidation":	{	'': "K0-factor na consolidatie",	'.unit': "-",			'.symbol': "stages.CO.K0" },
				"-consolidationType":		{	'': "Type consolidatie" }
			},
			"ConsolidationPhase": {
				".title":						"Consolidatiefase"
			},
			"ShearPhase": {
				"-q": "q",
				"-o13": "o13", 
				"-NN": "NN",

				".title":						"Afschuiffase",
				"-cellPressure":			{	'': "Initiële celdruk", 			'.unit': "kPa" },
				"-poreWaterPressure":		{	'': "Initiële poriënwaterdruk", 	'.unit': "kPa" },
				"-strainRate":				{	'': "Reksnelheid", 					'.unit': "%/hr" },

				"-maxDeviatorStress":		{	'': "Maximale deviatorspanning" }, 
				"-maxPrincipalStressRatio": {	'':	"Maximale hoofdspanningsverhouding", _: " (σ'1/σ'3)" },
				"-axialStrain2%":			{	'': "Bij 2% axial rek" },

				"-axialStrain": 			{	'': "Axiale rek",					'.unit': "%",		'.symbol': ".ar" },
				"-deviatorStressCorrected": {	'': "Deviatorspanning (gecorr.)",	'.unit': "kPa",		'.symbol': ".q_corr" },
				"-effectiveHorizontalStress":{	'': "Effectieve horizontale spanning",'.unit': "kPa",	'.symbol': ".o3" },
				"-effectiveVerticalStress":	{	'': "Effectieve verticale spanning",'.unit': "kPa",		'.symbol': ".o1" },
				"-sigma1/3":				{	'': "σ'1/σ'3",						'.unit': "-",		'.symbol': ".o13" },
				"-es":						{	'': "s'",							'.unit': "kPa",		'.symbol': ".es" },// 43.82 54.31 90.96
				"-te":						{	'': "t'",							'.unit': "kPa",		'.symbol': ".te" },// 45.18 44.16 67.55
				"-phi": 					{	'': "φ'",							'.unit': "degs",	'.symbol': ".phi" },
				"-ce":						{	'': "c'",							'.unit': "kPa",		'.symbol': ".ce" },
				"-e50und":					{	'': "E50.und",						'.unit': "MPa",		'.symbol': ".e50und"},

				"-max_q":					{	'': "Mohr-Coulomb parameters bij maximale deviatorspanning" },
				"-max_o13":					{	'': "Mohr-Coulomb parameters bij maximale hoofdspanningsverhouding σ'1/σ'3" },
				"-max_NN":					{	'': "Mohr-Coulomb parameters bij NN % axiale rek" }
			}
		},
		"FilterPaper": {
			"-loadCarried": {
				"": "Kfp",
				".hint": "Load (when fully mobilized) carried by filter paper covering a unit length of the specimen perimeter",
				".unit": "kPa/mm"
			},
			"-perimeterCovered": {
				"": "Pfp",
				".hint": "Fraction of perimeter covered by the filter paper (up to 50%)",
				".unit": "%"
			}
		}
	}
	
}));