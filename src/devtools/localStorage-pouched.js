/*- localStorage.get/setItem from/to pouchdb */
define(["pouchdb"], function(PouchDB) { 'use strict';

	var local_dbName = localStorage['devtools/App.local_dbName'] || "code_vcl_comps";
	var remote_dbName = localStorage['devtools/App.remote_dbName'] || "https://cavalion.cloudant.com/" + local_dbName;
	
	var local_db = new PouchDB(local_dbName);
	var remote_db = new PouchDB(remote_dbName);
	window.local_db = local_db;
	
	var syncHandler = local_db.sync(remote_db, {
	live: true,
	retry: true
	}).on('change', function (change) {
	// yo, something changed!
	console.log("change", arguments);
	}).on('paused', function (info) {
	// replication was paused, usually because of a lost connection
	console.log("paused", arguments);
	}).on('active', function (info) {
	// replication was resumed
	console.log("active", arguments);
	}).on('error', function (err) {
	// totally unhandled error (shouldn't happen)
	console.log("error", arguments);
	});


	if([undefined, "", "pouchdb"].indexOf(localStorage['devtools/localStorage.adapter']) !== -1) {
		
	}
	
	var memory = {};
	
	return {
		getItem: function(key, callback, errback) {
			var fullKey = key, _id = key.split("$").shift(), r;
			key = key.split("$").pop();
			
			var cb = callback || function(doc) { console.info("read", _id, key, "=>", (value||"").length); };
			var eb = errback || function(err) { console.error(err); };

			local_db.get(_id, function(err, doc) {
				if(err && err.status !== 404) return eb(err);

				doc = doc || {_id: _id};
				
				if(!doc.hasOwnProperty(key)) {
					doc[key] = r;
					console.info("default", _id, key, (r||"").length);
				}

				// localStorage.setItem(key, doc[key]);
				cb(doc[key]);
			});

			if(memory.hasOwnProperty(fullKey)) {
				r = memory[fullKey];
			} else if(localStorage.hasOwnProperty(fullKey)) {
				r = localStorage[fullKey];
			} else {
				r = null;
			}
		},
		setItem: function(key, value) {
			var fullKey = key, _id = key.split("$").shift();
			key = key.split("$").pop();
			
			// var slot = memory[fullKey];
			// if(slot) {
			// 	clearTimeout(slot.timeout);
			// 	slot.timeout = setTimeout(toPouch, 10000);
			// }
			
			local_db.get(_id, function(err, doc) {
				if(err && err.status !== 404) return console.error(err);
				
				doc = doc || {_id: _id};
				doc[key] = value;
				
				local_db.put(doc).then(function(resp) {
					if(!resp.ok) return console.error(resp);
					
					console.log("written to pouch", _id, {key: key, value: value, doc: doc, resp: resp});
					
					delete memory[fullKey];
				});
			});
			
			memory[fullKey] = value;
			// localStorage[key] = value;
		}
	};
});

/*- v1

Method.override(Component.prototype, {
	readStorage: function(key, callback, errback) {
		var callee = arguments.callee;
		var _id = this.getUri(), me = this;
		
		errback = errback || function(err) { console.error(err); };
		
		local_db.get(_id, function(err, doc) {
			if(err && err.status !== 404) return errback(err);
console.log("read", _id, key, doc);
			if(doc === undefined) {
				doc = {}; doc[key] = me.inherited(js.mixIn([key], {callee: callee}));
				if(doc[key] === undefined) {
					delete doc[key];
				} else {
					console.log("imported from localStorage", _id, key, doc);
					me.writeStorage(key, doc[key]);
				}
			}
			callback && callback.apply(this, [doc[key]]);
		});
	},
	writeStorage: function(key, value, callback, errback) {
		var callee = arguments.callee;
		var _id = this.getUri(), me = this;
		
		errback = errback || function(err) { console.error(err); };
		
		local_db.get(_id, function(err, doc) {
			if(err && err.status !== 404) return errback(err);

			if(doc === undefined) {
				doc = {_id: _id};
			}
			
			doc[key] = value;

			local_db.put(doc).then(function(resp) {
				if(!resp.ok) return errback(resp);
				console.log("written", _id, {key: key, value: value, doc: doc, resp: resp});
				callback && callback.apply(this, [r]);
			});
		});
		
		return this.inherited(js.mixIn([key, value], {callee: callee}));
		
	}
});
*/