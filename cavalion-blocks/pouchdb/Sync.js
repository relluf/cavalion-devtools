"use js";

var options = {
	live: true,
	retry: true	
}, push_options = {}, pull_options = {};

["Container", [

	["Executable", ("push"), {
		onExecute() {
			var PouchDB = require("pouchdb");
			var console = this.udown("Console<>");
			
			var source = new PouchDB(this.udown("#source").getValue());
			var push = source.push(push_options)
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
				
			console.print("start", push);
			this.up().vars("push", push);
		}
	}],
	["Executable", ("pull"), {
		onExecute() {
			var PouchDB = require("pouchdb");
			var console = this.udown("Console<>");
			
			var source = new PouchDB(this.udown("#source").getValue());
			var pull = source.pull(pull_options)
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
				
			console.print("start", pull);
			this.up().vars("pull", pull);
		}
	}],
	["Executable", ("sync"), {
		onExecute() {
			var PouchDB = require("pouchdb");
			var console = this.udown("Console<>");
			
			var source = this.udown("#source").getValue();
			var target = this.udown("#target").getValue();
			
			var sync = PouchDB.sync(source, target, options)
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
				
			console.print("start", sync);
			this.up().vars("sync", sync);
		}
	}],
	["Executable", ("cancel"), {
		onExecute() {
			var console = this.udown("Console<>");
			try {
				this.up().vars("sync").cancel();
			} catch(e) {
				console.print(e);	
			}
		}
	}],
	["Bar", { css: "display: flex;" }, [
		["Button", { action: "push" }],
		["Button", { action: "pull" }],
		["Element", { content: "source" }],
		["Input", ("source"), {
			css: "flex: 1.4;",
			value: require("vcl/Component").defaultDb.name
		}],
		["Button", { action: "sync" }],
		["Element", { content: "target" }],
		["Input", ("target"), {
			css: "flex: 4;",
			value: "https://dbs.veldapps.com/ralphk-code-va_objects"
		}],
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