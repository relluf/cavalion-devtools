define(['devtools/Resources-node', 'devtools/Resources-pouchdb', 'devtools/Resources-dropbox'], 
function(ResourcesHttp, ResourcesDB, ResourcesDbx) {
	return {
		index: function(uris) {
			return ResourcesHttp.index(uris);
		},
		list: function(uri) {
			if(uri.startsWith("pouchdb://")) {
				return ResourcesDB.list(uri.substring("pouchdb://".length))
					.then(resources => resources.map(function(resource) {
						resource.uri = "pouchdb://" + resource.uri;
						return resource;	
					}));
			}
			if(uri.startsWith("dropbox://")) {
				return ResourcesDbx.list(uri.substring("dropbox://".length))
					.then(resources => resources.map(function(resource) {
						resource.uri = "dropbox://" + resource.uri;
						return resource;	
					}));
			}
			return ResourcesHttp.list(uri).then(function(res) {
				// if(uri === "/" || uri === "") {
				// 	res.push({ uri: "pouchdb://", name: "pouchdb://", type: "Folder", link: false });
				// }
				return res;
			});
		},
		get: function(uri) {
			if(uri.startsWith("pouchdb://")) {
				return ResourcesDB.get(uri.substring("pouchdb://".length));
					// TODO extend/clean up uri?
			} 
			if(uri.startsWith("dropbox://")) {
				return ResourcesDbx.get(uri.substring("dropbox://".length));
					// TODO extend/clean up uri?
			}
			return ResourcesHttp.get(uri);
		},
		create: function(uri, resource) {
			if(uri.startsWith("pouchdb://")) {
				return ResourcesDB.create(uri.substring("pouchdb://".length), resource)
					.then(function(res) {
						return res;	
					});
			}
			if(uri.startsWith("dropbox://")) {
				return ResourcesDbx.create(uri.substring("dropbox://".length), resource)
					.then(function(res) {
						return res;	
					});
			}
			return ResourcesHttp.create(uri, resource);
		},
		'delete': function(uri) {
			if(uri.startsWith("pouchdb://")) {
				return ResourcesDB.delete(uri.substring("pouchdb://".length))
					.then(function(res) {
						return res;	
					});
			}
			if(uri.startsWith("dropbox://")) {
				return ResourcesDbx.delete(uri.substring("dropbox://".length))
					.then(function(res) {
						return res;	
					});
			}
			return ResourcesHttp.delete(uri);
		},
		update: function(uri, resource) {
			if(uri.startsWith("pouchdb://")) {
				return ResourcesDB.update(uri.substring("pouchdb://".length), resource)
					.then(function(res) {
						return res;	
					});
			}
			if(uri.startsWith("dropbox://")) {
				return ResourcesDbx.update(uri.substring("dropbox://".length), resource)
					.then(function(res) {
						return res;	
					});
			}
			return ResourcesHttp.update(uri, resource);
		},
		link: function(uri) {
			if(uri.startsWith("pouchdb://")) {
				return ResourcesDB.link(uri.substring("pouchdb://".length))
					.then(function(res) {
						return res;	
					});
			}
			if(uri.startsWith("dropbox://")) {
				return ResourcesDbx.link(uri.substring("dropbox://".length))
					.then(function(res) {
						return res;	
					});
			}
			return ResourcesHttp.link(uri);
		}
	};
});