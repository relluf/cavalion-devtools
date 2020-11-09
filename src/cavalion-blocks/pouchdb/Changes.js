"use pouchdb";

var options = {};

["Container", [
	["Executable", ("listen"), {
		onExecute() {
			var PouchDB = require("pouchdb");
			var console = this.udown("#console");
			
			var dbName = this.udown("#dbName").getValue();
			var db = new PouchDB(dbName);
			// console.print("[" + dbName + "]", db);

			var listener = db.changes({
				  since: 'now',
				  live: true,
				  include_docs: true
				}).on('change', function(change) {
				  console.print("change", change);
				}).on('complete', function(info) {
				  console.print("complete - changes() was canceled", info);
				  // changes() was canceled
				}).on('error', function (err) {
				  console.print("error", err);
				});
				
			console.print("start", listener);
			this.up().vars("listener", listener);
		}
	}],
	["Executable", ("cancel"), {
		onExecute() {
			var console = this.udown("Console<>");
			try {
				this.up().vars("listener").cancel();
			} catch(e) {
				console.print(e);	
			}
		}
	}],

	["Bar", { css: "display: flex;" }, [
		["Element", { content: "dbName" }],
		["Input", ("dbName"), {
			value: require("vcl/Component").storageDB.name
		}],
		["Button", { action: "listen" }],
		["Button", { action: "cancel" }]
		
	]],
	
	["Console", ("console"), { 
		css: "background-color:white;",
		onLoad() {
			this.print("this.up()", this.up());
			this.print("options", options);
		}
	}]
	
]];