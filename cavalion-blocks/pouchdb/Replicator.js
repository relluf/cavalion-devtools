"use pouchdb";

var options = {};

["Container", [
	["Executable", ("replicate"), {
		onExecute() {
			var PouchDB = require("pouchdb");
			var console = this.udown("Console<>");
			
			var source = this.udown("#source").getValue();
			var target = this.udown("#target").getValue();
			
			var replicator = PouchDB.replicate(source, target, options)
				.on("change", function (info) {
				  console.print("change", arguments[0]);
				}).on("paused", function (err) {
				  console.print("replication paused (e.g. replication up to date, user went offline)", arguments[0]);
				}).on("active", function () {
				  console.print("replicate resumed (e.g. new changes replicating, user went back online)", arguments[0]);
				}).on("denied", function (err) {
				  console.print("a document failed to replicate (e.g. due to permissions)", arguments[0]);
				}).on("complete", function (info) {
				  console.print("complete", arguments[0]);
				}).on("error", function (err) {
				  console.print("error", arguments[0]);
				});
				
			console.print("start", replicator);
			this.up().vars("replicator", replicator);
		}
	}],
	["Executable", ("cancel"), {
		onExecute() {
			var console = this.udown("Console<>");
			try {
				this.up().vars("replicator").cancel();
			} catch(e) {
				console.print(e);	
			}
		}
	}],

	["Bar", { css: "display: flex;" }, [
		["Element", { content: "source" }],
		["Input", "source", {
			value: "va_objects"
		}],
		["Element", { content: "target" }],
		["Input", "target", {
			value: "code-va_objects"
		}],
		["Button", { action: "replicate" }],
		["Button", { action: "cancel" }]
		
	]],
	
	["Console", { 
		css: "background-color:white;",
		onLoad() {
			this.print("this.up()", this.up());
			this.print("options", options);
		}
	}]
	
]];