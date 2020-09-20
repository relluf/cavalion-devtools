define(function(require) {

	var DBX_XS_TOKEN = "nIxJhImnr5YAAAAAAAAAAZt82-DqagqCqtOqk4g6FEGC5wQTaP2tG_phBtPKnQY6";
	// var DBX_XS_TOKEN = "IbL2ZyoCPS0AAAAAAAAAAdxZpGDW23JdjYrycszNKrXK85AtdlIH_o7-SdtgL4Tb";
	
	var Dropbox = require("dropbox").Dropbox;
	var Hash = require("util/Hash");

	var dbxs = {};
	function getDropbox(uri, force) {
		var name = uri.split("/").shift();
		if(force || dbxs[name] === undefined) {
			dbxs[name] = new Dropbox({ accessToken: DBX_XS_TOKEN });
		}
		return dbxs[name];
	}
	
	var all = {};
	function singleton(obj) {
		return all[obj.uri] ? js.mixIn(all[obj.uri], obj) : (all[obj.uri] = obj);
	}

	return {
		dbxs: dbxs,
		
		index: function(uris) {
			return Promise.resolve([]);
		},
		list: function(path) {
			var name = path.split("/").shift(); 

 			return getDropbox(name)
 				.filesListFolder({ path: path.substring(name.length) })
 				.then(res => res.entries.map(e => singleton({
	 					name: e.name,
	 					type: e['.tag'] === "folder" ? "Folder" : "File",
	 					expandable: e['.tag'] === "folder",
	 					uri: js.sf("%s/%s", path, e.name),
	 					detail: e
	 				})));
 			
		},
		get: function(path) {
			var name = path.split("/").shift(); 
			path = path.substring(name.length);

			return getDropbox(name)
				.filesGetTemporaryLink({ path: path })
				.then(res => fetch(res.link)
					.then(resource => resource.text())
					.then(text => singleton({ 
						uri: path, 
						text: text, 
						dbx: res, 
						revision: js.get("metadata.rev", res)
					})));
				
			// // TODO make a devtools/Resource.get compatible object/return value
			// uri = uri.split("/");
			// return getDropbox(uri.shift()).get(uri.join("/")).then(function(res) {
			// 	var text = js.get("devtools:resource.text", res);
			// 	if(typeof text !== "string") {
			// 		text = js.b(JSON.stringify(res));
			// 	}
			// 	return res && {
			// 		revision: res._rev,
			// 		contentType: "application/json",
			// 		text: text
			// 	};
			// });
		},
		create: function(path, resource) {
			var name = path.split("/").shift(); 
			path = path.substring(name.length);

			return getDropbox(name)
				.filesUpload({
					path: path,
					// mode: {
					// 	'.tag': "update", 
					// 	update: resource.revision
					// },
					contents: new File(
						[resource.text],
						resource.name,
						{ type: resource.contentType || "application/json" }
					),
				});
		},
		'delete': function(path) {
			var name = path.split("/").shift(); 
			path = path.substring(name.length);

			return getDropbox(name).filesDelete({ path: path });
		},
		update: function(path, resource) {
			var name = path.split("/").shift(); 
			path = path.substring(name.length);

			return getDropbox(name)
				.filesUpload({
					path: path,
					mode: {
						'.tag': "update", 
						update: resource.revision
					},
					contents: new File(
						[resource.text],
						resource.name,
						{ type: resource.contentType || "application/json" }
					),
				});
		}
	};
});