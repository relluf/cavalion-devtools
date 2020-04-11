() => {
	var Veloffice = require("entities/EM!Veldoffice");
	var EM = require("entities/EM");
	
	var Bookmarks = require("entities/EM!Bookmarks");
	
	EM.monitor("veldoffice:Onderzoek#3432/meetpunten", {})
		.addCallback(function() {});

};


$(["ui/Form"], {}, []);
