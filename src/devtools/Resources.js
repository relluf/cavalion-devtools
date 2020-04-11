define(['devtools/Resources-node', 'devtools/Resources-pouchdb'], 
function(ResourcesHttp, ResourcesDB) {
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
			}
			return ResourcesHttp.get(uri);
		},
		create: function(uri, resource) {
			if(uri.startsWith("pouchdb://")) {
				return ResourcesDB.create(uri.substring("pouchdb://".length), resource)
					.then(function(res) {
console.log("create-result", res);
						return res;	
					});
			}
			return ResourcesHttp.create(uri, resource);
		},
		'delete': function(uri) {
			if(uri.startsWith("pouchdb://")) {
				return ResourcesDB.delete(uri.substring("pouchdb://".length))
					.then(function(res) {
console.log("delete-result", res);
						return res;	
					});
			}
			return ResourcesHttp.delete(uri);
		},
		update: function(uri, resource) {
			if(uri.startsWith("pouchdb://")) {
				return ResourcesDB.update(uri.substring("pouchdb://".length), resource)
					.then(function(res) {
console.log("update-result", res);
						return res;	
					});
			}
			return ResourcesHttp.update(uri, resource);
		}
	};
});