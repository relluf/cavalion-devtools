define(function(require) {

	var PouchDB = require("pouchdb");
	var Hash = require("util/Hash");

	/*- 
		Hosts allDocs as a JSON resource or devtools:resource is the actual doc.
		String before first slash identifies the database.
			
			cavalion-code/vcl-comps/devtools/Workspace$/V7.js
			cavalion-docs/vcl-comps/devtools/Workspace$/V7.js
			
		### 2019-10-08
		- list() now also returns /

	*/
	
	var dbs = {};
	function getDb(uri, force) {
		var name = uri.split("/").shift();
		if(force || dbs[name] === undefined) {
			dbs[name] = new PouchDB(name);
		}
		return dbs[name];
	}
	function attachmentUri(uri, name) {
		if(typeof uri !== "string" || !uri.startsWith("pouchdb://")) {
			throw new Error("Expected a PouchDB document URI");
		}
		var path = uri.substring("pouchdb://".length);
		var separator = path.indexOf("/");
		if(separator < 1 || !path.substring(separator + 1) || !name) {
			throw new Error("PouchDB document and attachment names are required");
		}
		return "pouchdb-attachment://" + encodeURIComponent(path.substring(0, separator)) + "/" +
			encodeURIComponent(path.substring(separator + 1)) + "/" + encodeURIComponent(name);
	}
	function getAttachment(uri, opts) {
		var parts = uri.split("/");
		if(parts.length !== 3 || parts.some(part => !part)) {
			return Promise.reject(new Error("Invalid PouchDB attachment URI"));
		}
		var dbName, docId, name;
		try {
			dbName = decodeURIComponent(parts[0]);
			docId = decodeURIComponent(parts[1]);
			name = decodeURIComponent(parts[2]);
		} catch(error) {
			return Promise.reject(error);
		}
		var db = getDb(dbName);
		return db.get(docId).then(function(doc) {
			var metadata = doc._attachments && doc._attachments[name];
			if(!metadata) throw new Error("PouchDB attachment not found: " + name);
			return db.getAttachment(docId, name).then(function(blob) {
				if(opts && opts.arrayBuffer) return blob.arrayBuffer();
				return {
					uri: uri, name: name, type: "File", contentType: metadata.content_type || blob.type,
					revision: doc._rev, size: metadata.length,
					arrayBuffer: function() { return blob.arrayBuffer(); }
				};
			});
		});
	}
	function now() {
		return (new Date()).toISOString();
	}

	return {
		dbs: dbs,
		attachmentUri: attachmentUri,
		getAttachment: getAttachment,
		index: function(uris) {
			return Promise.resolve([]);
		},
		list: function(parent, opts) {
			var db = parent.split("/").shift(); 
			
			if(!parent.endsWith("/")) parent += "/";

 			return getDb(parent).allDocs().then(function(res) {
 				var all = res.rows.map(_ => db + "/" + _.id);
 				return all.filter(uri => uri.startsWith(parent))
					.map(uri => uri.substring(parent.length).split("/").shift())
					.filter(function(name, index, arr) { return arr.indexOf(name) === index; })
					.map(name => ({
						name: name, uri: parent + (name || "/"), 
						type: all.includes(parent + name) ? all.some(s => s.startsWith(parent + name + "/")) ? "Package" : "File" : "Folder",
						expandable: all.indexOf(parent + name) === -1,
						contentType: name.indexOf("<") === -1 && name.indexOf(".") !== -1 ? undefined : "application/json"
					}));
 			});
		},
		get: function(uri_) {
			var uri = uri_.split("/");
			return getDb(uri.shift()).get(uri.join("/")).then(function(res) {
				var resource = js.get("devtools:resource", res);
				if(resource) {
					resource.revision = res._rev;
					resource.uri = uri_;
					return resource;
					// return {
					// 	uri: uri_,
					// 	name: uri_.split("/").pop(),
					// 	revision: res._rev,
					// 	// contentType: "application/json",
					// 	text: js.b(JSON.stringify(resource.text))
					// };
				}
				return {
					uri: uri_,
					name: uri_.split("/").pop(),
					revision: res._rev,
					contentType: "application/json",
					text: js.b(JSON.stringify(res))
				};
				// throw new Error("404 " + uri.join("/"));
			});
		},
		getRevision: function(uri) {
			var parts = uri.split("/");
			return getDb(parts.shift()).get(parts.join("/")).then(function(doc) {
				return "revision:" + doc._rev;
			});
		},
		create: function(uri, resource) {
			uri = uri.split("/");
			if(!resource.created) {
				resource.created = now();
			}
			return getDb(uri.shift()).put({ 
				_id: uri.join("/"), 
				'devtools:resource': resource
			});
		},
		'delete': function(uri) {
			uri = uri.split("/");
			var db = getDb(uri.shift());
			return db.get(uri.join("/")).then(function(doc) {
				return db.remove(doc);
			});
		},
		// update: function(uri, resource) {
		// 	uri = uri.split("/");
			
		// 	var dbName = uri.shift();
		// 	return getDb(dbName).put({ 
		// 		_id: uri.join("/"), 
		// 		_rev: resource.revision,
		// 		'devtools:resource': resource
		// 	}).then(function(res) {
		// 		resource.revision = res.rev;
		// 		return resource;
		// 	});
		// },
		update: function(uri, resource) {
			function done(res) {
					resource.revision = res.rev;
					resource.text = js.b(JSON.stringify(res));
					return res;
				}
				
			uri = uri.split("/");
			
			var dbName = uri.shift();
			if(resource.contentType === "application/json") {
				var db, obj = JSON.parse(resource.text); // potential crash
				obj._id = uri.join("/");
				obj._rev = resource.revision;
				
				return getDb(dbName).put(obj).then(done).catch(function(err) {
					if(err.name === "conflict") {
						console.log("conflict - recreated PouchDB object");
						return getDb(dbName, true).put(obj).then(done);
					}
					throw err;
				});
			}
			return getDb(dbName).put({ 
				_id: uri.join("/"), 
				_rev: resource.revision,
				'devtools:resource': { text: resource.text, modified: now() }
			}).then(function(res) {
				// console.log("updated", res);
				resource.revision = res.rev;
				return res;
			});
		},
		link: function(uri) {
			throw new Error("Not sure what do here yet ...");
			// return Promise.resolve(String.format("/home/%s", uri));
		},
		
		sync: function(db, dbs) {
			if(typeof db === "string") db = this.dbs[db];
			
			dbs = dbs || "https://dbs.veldapps.com/";
			// TODO sync-token-manager (!!!) based on session / account / user
			var dbi = "cavdevres_" + Hash.md5("cavalion.org/devtools/Resources://" + db.name);
			
			console.log("started live syncing for", dbs + dbi);
			return db.sync(new PouchDB(dbs + dbi), { live: true })
				.on("error", function(err) {
					console.error(err);
				})
				.on('change', function (change) {
				  console.log("change", change);
				})
				.on('paused', function (info) {
				  console.log("paused", info);
				})
				.on('active', function (info) {
				  console.log("active", info);
				});
		}
	};
});
