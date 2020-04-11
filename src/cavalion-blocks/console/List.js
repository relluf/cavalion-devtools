["veldapps/ListOf<>", [

	["#list", { autoColumns: false, source: "array" }, [
		["Column", { attribute: "eventDate", onGetValue(v) { 
			return new Date(v);
		}}],
		["Column", { attribute: "applicationName" }],
		["Column", { attribute: "environmentName" }],
		["Column", { attribute: "severity" }],
		["Column", { attribute: "message" }]
	]],
	
	["Array", "array", { 
		onLoad() {
			this.setArray(this.vars(["array"]) || []);
		}
	}]

]];