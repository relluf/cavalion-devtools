$([], {
}, [
    
    $i("ace", {
        align: "top",
        height: 100
    }),
    
    $("vcl/entities/Query", "query", {
        servlet: "../stuv/",
    	entity: "veldoffice:Meetpunt",
    	attributes: "onderzoek.naam,onderzoek.projectcode,code,max:bodemlagen.onderkant,type.omschrijving.values.text",//,type.omschrijving",
    	where: {"items":[["like","onderzoek.projectcode",":projectcode"]]},
    	groupBy: ".",
    	orderBy: "max:bodemlagen.onderkant desc",
    	parameters: {
    		projectcode: function() {
    		    return "%160%";
    // 			var key = this._owner.getVar("onderzoek") || 2245601;
    // 			return require("entities/EM").getInstance("Onderzoek", key);
    		}
    	},
    	limit: 10000
    }),
    
    $("vcl/ui/List", {
        align: "client",
        autoColumns: true,
        source: "query",
        css: {
            border: "1px solid silver",
            background: "white"
        }
    })
    
]);