"use data/Source, veldoffice/Session, veldoffice/EM, pouch/db";

var PouchDB = require("pouch/db");
var Source = require("data/Source");
var Component = require("vcl/Component");

["veldapps/ListOf", { 
	handlers: {
		onLoad() {
			this.scope().refresh.setEnabled(false);
			this.vars("db", new PouchDB(this.getSpecializer() || "arcadis-va_objects" || Component.storageDB.name));
			this.scope().refresh.setEnabled(true);
			this.scope().refresh.execute();
		},
	
		"#list onColumnGetValue": function(column, value, rowIndex, source) {
			if(column._attribute === "value") {
				return value.rev;
			}
			return value;
		},
		"#list onDblClick": function(e) {
			var selection = this.getSelection(true);
			var db = this.vars(["db"]);
			this.print(Promise.all(selection.map(_ => db.get(_.id, { revs: true, revs_info: true }))));
			
			if(e.altKey !== true) {
				var ws = this.up("devtools/Workspace<>:root");
				selection.map(_ => ws.open({ 
					resource: { 
						uri: js.sf("pouchdb://%s/%s", db.name, _.id),
						contentType: "application/json", 
						type: "File" 
					}, 
					selected: true
				}));
			}
		}
	}
}, [
	
	[("#query_load_all"), { on() {} }],

	[("#list"), { autoColumns: true, source: "docs" }],

	[("#filters"), [	
		["Group", [
			["Element", { content: locale("-id.label"), classes: "header" }],
			["Input", "input", { 
				onChange: function(obj) {
					this.setTimeout(() => {
						var value = this.getValue();
						var docs = this.scope("docs");
						if(value === "") {
							docs.setOnFilterObject(null);
						} else {
							docs.setOnFilterObject(function(obj) {
								return !obj.id.includes(value);	
							});
						}
					}, 250);
				}
			}]
		]]
	]],
	
	[("#refresh"), {
		onExecute() {
			var db = this.vars(["db"]), docs = this.scope().docs;
			var sort = this.vars(["sort"]);
			var map = this.vars(["map"]) || function(r) { return r; };
			docs.setBusy(true);
			docs.setArray([]);
			db.allDocs({include_docs: true}).then(function(res) {
				docs.setArray(res.rows.sort(sort || function(i1, i2) {
					return parseInt(i2.value.rev, 10) - parseInt(i1.value.rev, 10);
				}).map(map));
				docs.setBusy(false);
			});
		}
	}],
	
	["Array", ("docs"), {
		onActiveChanged: function(active) {
			this.scope().status.render();
		},
		onUpdate: function() { 
			this.scope().status.render(); 
		},
		onBusyChanged: function(busy) {
			// console.log("onBusyChanged", busy);
			var scope = this.scope();
			scope.refresh.setEnabled(!busy);
			scope.status.render();
		},
		onFilterObject(obj, row, context) {
			var q = this.vars("q");
			
			if(!context.list) {
				context.list = this.ud("#list");
				context.columns = {};
				context.q = q ? q.split(" ") : [""];
			}
			
			function match(obj, q) {
				q = q.toLowerCase();
	
				if((inverse = (q && q.charAt(0) === "!"))) {
					q = q.substring(1);
				}
				
				if(typeof obj ==="string") {
					return obj.toLowerCase().includes(q);
				}
				for(var k in obj) {
					if(js.sf("%n", obj[k]).toLowerCase().includes(q)) {
						return inverse ? false : true;
					}
				}
				return inverse ? true : false;
			}
			function match_columns(obj, q) {
				var column, value, inverse = false;
				if(q.indexOf(":") === -1) {
					q = q.toLowerCase();
					if(q && (inverse = (q.charAt(0) === "!"))) {
						q = q.substring(1);
					}
					
					for(var i = 0, n = context.list.getColumnCount(); i < n; ++i) {
						column = context.list.getColumn(i);
						value = context.list.valueByColumnAndRow(column, row);
						if(js.sf("%n", value).toLowerCase().includes(q)) {
							return inverse ? false : true;
						}
					}
					return inverse ? true : false;
				} else {
					q = q.split(":");
					column = context.columns[q[0]] || (context.columns[q] = context.list.getColumnByName(q[0]));
					if(column) {
						value = context.list.valueByColumnAndRow(column, row);
						if(js.sf("%n", value).toLowerCase().includes(q[1])) {
							return true;
						}
					}
					return false;
				}
			}
			
			return context.q.some(q => q ? !(match_columns(obj, q)) : false);// || match(obj, q)): false;
		}
	}]
	
	// ["Node", ("node"), {
	// 	text: "AllDocs",
	// 	visible: false,
	// 	classes: "seperator folder",
	// 	expandable: true,
	// 	vars: { root: undefined },
	// 	onLoad: function() {
	// 		var tree = this.up("devtools/Workspace<>").down("#navigator #tree");
	// 		this.setParent(tree);
	// 		this.show();
	// 	},
	// 	onNodesNeeded: function(parent) {
	// 		var db = this.vars(["db"]);

	// 		function f(root) {
	// 			for(var k in root) {
	// 				var node = new Node();
	// 				node.setText(k || "/");
	// 				node.setClasses("folder");
	// 				node.setParent(parent);
	// 				node.vars("root", root[k]);
	// 			}
	// 		}
			
			
	// 		var root = parent.vars("root"), Node = this.constructor;
	// 		if(root === undefined) {
	// 			return db.allDocs().then(function(res) {
	// 				root = {};
	// 				res.rows.forEach(function(row) {
	// 					js.set(row.id.replace(/\./g, "&centerdot;").replace(/\//g, "."), row.value, root);
	// 				});
	// 				parent.vars("root", root);
	// 				f(root);
	// 			}.bind(this));
	// 		} else {
	// 			f(root);
	// 		}
	// 	}
	// }]
]];