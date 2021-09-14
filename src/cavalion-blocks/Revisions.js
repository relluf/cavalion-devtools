"use devtools/Resources-pouchdb";

var Resources = require("devtools/Resources-pouchdb");

[("./Alphaview"), {
	onLoad() {
		var me = this, tree = this.udr("#navigator #tree");
		var list = this.udr("#navigator #search-list");
		var reflect = (sel) => {
			if(sel.length) {
				if((uri = sel[0].uri)) {
					uri = uri.split("/");
					var db = Resources.dbs[uri[2]];
					if(db) {
						uri = uri.slice(3).join("/");
						var rget = db.get(uri, {revs_info: true}).then(res => 
							Promise.all(res._revs_info.slice(0, 25).map(rev => 
								db.get(uri, { rev: rev.rev }).then(obj => 
									rev.obj = obj))
							)
						).then(function(sel) {
								me.vars("console", { sel: js.copy_args(arguments) });
								me.qsa("#load").execute(); 
								return sel;
							});
					}
				}
			}				
		};
		
		tree.on("selectionchange", (sel) => {
			this.setTimeout("reflect", () => reflect(tree.getSelection().map(_ => _.vars("resource"))), 250);
		});
		
		list.on("selectionchange", (sel) => {
			this.setTimeout("reflect", () => reflect(list.getSelection(true)), 250);
		});

		this.vars("console", { sel: []});

		reflect(tree.getSelection());
		
		return this.inherited(arguments);
	}
}, [
	[("#list"), {
		onColumnRenderCell(cell, value, column, row, source, orgValue) {
			if(column._attribute === "savedAt_") {
				cell.textContent = (new Date(value)).toISOString();
				column.autoWidth(cell.textContent, cell);
				return false;
			}
		}
	}],
	
	// [("#left"), [
	// 	[("Button"), { content: "test",
		
	// 		onTap() {
	// 			var PouchDB = require("pouchdb");
	// 			var db = new PouchDB("va_objects");
				
	// 		}
			
	// 	}]	
	// ]]
]];