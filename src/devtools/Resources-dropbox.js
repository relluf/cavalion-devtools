define(function(require) {

	var Dropbox = require("dropbox").Dropbox;
	var Hash = require("util/Hash");

	var dbxs = {}, tokens = {};
	function getDropbox(uri, force) {
		var name = uri.split("/").shift();
		if(force || dbxs[name] === undefined) {
			// var accessToken = localStorage.getItem(js.sf("devtools/Resources-dropbox/tokens/%s", name)) || tokens[name];
			var accessToken = tokens[name];
			dbxs[name] = new Dropbox({ accessToken: accessToken });
		}
		return dbxs[name];
	}
	
	var all = {};
	function singleton(obj) {
		return all[obj.uri] ? js.mixIn(all[obj.uri], obj) : (all[obj.uri] = obj);
	}

	return {
		dbxs: dbxs,
		
		/*- dropbox://{alias}/path/to/resource */
		registerAccessToken: function(alias, token) {
			if(arguments.length === 1 && typeof alias === "object") {
				Object.keys(alias).forEach(name => 
					this.registerAccessToken(name, alias[name]));
			} else 
				tokens[alias] = token;	
		},
		
		index: function(uris) {
			return Promise.resolve([]);
		},
		list: function(path) {
			var name = path.split("/").shift(); 

 			return getDropbox(name)
 				.filesListFolder({ path: path.substring(name.length) })
 				.then(res => res.result || res)
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
 				.then(res => res.result || res)
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
		},
		link: function(path) {
			var name = path.split("/").shift(); 
			path = path.substring(name.length);

			return getDropbox(name).filesGetTemporaryLink({ path: path })
 				.then(res => res.result || res)
				.then(res => res.link);
		}

	};
});