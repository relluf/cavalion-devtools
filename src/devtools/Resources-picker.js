define(function(require) {
	
	const Component = require("vcl/Component");
	const nameOf = require("js/nameOf");
	
	const modules = ["node", "pouchdb", "dropbox", "gdrive", "dropped", "ddh"];
	const isModule = (s) => modules.includes(s);

	return {
		
		load: function (name, req, onLoad, config) {

			const deps = name.split(",").filter(isModule).map(s => "devtools/Resources-" + s);
			req(deps, function() {
				onLoad(js.copy_args(arguments));
			}, function() {
				alert("ERROR");
				console.log(js.copy_args(arguments));
				debugger;
			});
		}
	};
	
	
});