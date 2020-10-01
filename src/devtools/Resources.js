define(["devtools/Resources-node", "devtools/Resources-pouchdb", "devtools/Resources-dropbox", "devtools/Resources-dropped"], 
function(FS, Pouch, Dropbox, Dropped) {
	return {
		index: function(uris) {
			return FS.index(uris);
		},
		list: function(uri) {
			if(uri.startsWith("pouchdb://")) {
				return Pouch.list(uri.substring("pouchdb://".length))
					.then(resources => resources.map(function(resource) {
						resource.uri = "pouchdb://" + resource.uri;
						return resource;	
					}));
			}
			if(uri.startsWith("dropbox://")) {
				return Dropbox.list(uri.substring("dropbox://".length))
					.then(resources => resources.map(function(resource) {
						resource.uri = "dropbox://" + resource.uri;
						return resource;	
					}));
			}
			if(uri.startsWith("dropped://")) {
				return Dropped.list(uri.substring("dropped://".length))
					.then(resources => resources.map(function(resource) {
						resource.uri = "dropped://" + resource.uri;
						return resource;	
					}));
			}
			return FS.list(uri).then(function(res) {
				// if(uri === "/" || uri === "") {
				// 	res.push({ uri: "pouchdb://", name: "pouchdb://", type: "Folder", link: false });
				// }
				return res;
			});
		},
		get: function(uri) {
			if(uri.startsWith("pouchdb://")) {
				return Pouch.get(uri.substring("pouchdb://".length));
					// TODO extend/clean up uri?
			} 
			if(uri.startsWith("dropbox://")) {
				return Dropbox.get(uri.substring("dropbox://".length));
					// TODO extend/clean up uri?
			}
			if(uri.startsWith("dropped://")) {
				return Dropped.get(uri.substring("dropped://".length));
					// TODO extend/clean up uri?
			}
			return FS.get(uri);
		},
		create: function(uri, resource) {
			if(uri.startsWith("pouchdb://")) {
				return Pouch.create(uri.substring("pouchdb://".length), resource)
					.then(function(res) {
						return res;	
					});
			}
			if(uri.startsWith("dropbox://")) {
				return Dropbox.create(uri.substring("dropbox://".length), resource)
					.then(function(res) {
						return res;	
					});
			}
			return FS.create(uri, resource);
		},
		'delete': function(uri) {
			if(uri.startsWith("pouchdb://")) {
				return Pouch.delete(uri.substring("pouchdb://".length))
					.then(function(res) {
						return res;	
					});
			}
			if(uri.startsWith("dropbox://")) {
				return Dropbox.delete(uri.substring("dropbox://".length))
					.then(function(res) {
						return res;	
					});
			}
			return FS.delete(uri);
		},
		update: function(uri, resource) {
			if(uri.startsWith("pouchdb://")) {
				return Pouch.update(uri.substring("pouchdb://".length), resource)
					.then(function(res) {
						return res;	
					});
			}
			if(uri.startsWith("dropbox://")) {
				return Dropbox.update(uri.substring("dropbox://".length), resource)
					.then(function(res) {
						return res;	
					});
			}
			return FS.update(uri, resource);
		},
		link: function(uri) {
			if(uri.startsWith("pouchdb://")) {
				return Pouch.link(uri.substring("pouchdb://".length))
					.then(function(res) {
						return res;	
					});
			}
			if(uri.startsWith("dropbox://")) {
				return Dropbox.link(uri.substring("dropbox://".length))
					.then(function(res) {
						return res;	
					});
			}
			return FS.link(uri);
		}
	};
});