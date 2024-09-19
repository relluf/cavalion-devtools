define(["devtools/Resources-node", "devtools/Resources-pouchdb", "devtools/Resources-dropbox", "devtools/Resources-gdrive", "devtools/Resources-dropped", "devtools/Resources-ddh"], 
function(FS, Pouch, Dropbox, GDrive, Dropped, DragDropHandler) {
	return {
		index: function(uris) {
			return FS.index(typeof uris === "string" ? [uris] : uris);
		},
		list: function(uri, opts) {
			uri = uri || "/";

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
			if(uri.startsWith("gdrive://")) {
				return GDrive.list(uri.substring("gdrive://".length))
					.then(resources => resources.map(function(resource) {
						resource.uri = "gdrive://" + resource.uri;
						return resource;	
					}));
			}
			if(uri.startsWith("dropped://")) {
				return DragDropHandler.list(uri.substring("dropped://".length), opts)
					.then(resources => resources.map(function(resource) {
						resource.uri = "dropped://" + resource.uri.replace(/^\//, "");
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
		get: function(uri, opts) {
			if(uri.startsWith("pouchdb://")) {
				return Pouch.get(uri.substring("pouchdb://".length))
					.then(resource => {
						resource.uri = "pouchdb://" + resource.uri;
						return resource;
					});
			} 
			if(uri.startsWith("dropbox://")) {
				return Dropbox.get(uri.substring("dropbox://".length))
					.then(resource => {
						resource.uri = "dropbox://" + resource.uri;
						return resource;
					});
			}
			if(uri.startsWith("gdrive://")) {
				return GDrive.get(uri.substring("gdrive://".length))
					.then(resource => {
						resource.uri = "gdrive://" + resource.uri;
						return resource;
					});
			}
			if(uri.startsWith("dropped://")) {
				return DragDropHandler.get(uri.substring("dropped://".length), opts)
					.then(resource => {
						resource.uri = "dropped://" + resource.uri;
						return resource;
					});
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
			if(uri.startsWith("gdrive://")) {
				return GDrive.update(uri.substring("gdrive://".length), resource)
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
			if(uri.startsWith("gdrive://")) {
				return GDrive.link(uri.substring("gdrive://".length))
					.then(function(res) {
						return res;	
					});
			}
			return FS.link(uri);
		},

// still necessary?
		isZipped: function(uri, ext) {
			ext = ext || uri.split(".").pop();
			return ["zip", "kmz", "ti", "gz"].includes(ext);
		},
		isPackage: function(uri, ext) {
			ext = ext || uri.split(".").pop();
			return ["zip", "kmz", "gz"].includes(ext);
		}
		
		// paging
		//
	};
});