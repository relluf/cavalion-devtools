"use js, vcl/Component, blocks/Blocks";

var instantiate = require("blocks/Blocks").instantiate;
var dbName = req("vcl/Component").storageDB.name;

["Container", {}, [
	
	["Executable", "open", {
		onExecute() {
			var name = this.udown("#name").getValue();
			var tabs = this.udown("Tabs<>");
			var ws = this.up("devtools/Workspace<>");
			instantiate(
				["Tab<devtools/pouchdb/AllDocs>", name, { text: name, parent: tabs, owner: ws, selected: true }]
			);
		}
	}],
	
	["Bar", { css: "display: flex;"}, [
		["Input", "name", { css: "flex:1;", placeholder: locale("-name.placeholder"), 
			// value: require("vcl/Component").storageDB.name 
		}], 
		["Button", { action: "open" }]
	]],
	
	["Tabs", { _align: "bottom", _classes: "bottom" }, [

		["Tab<devtools/pouchdb/AllDocs>", (dbName), {
			text: dbName,
			selected: true
		}],
		
		// ["Tab<devtools/pouchdb/AllDocs>", ("Apps-va_objects"), {
		// 	text: "Apps-va_objects",
		// 	selected: true
		// }],
		// ["Tab<devtools/pouchdb/AllDocs>", ("code-va_objects"), {
		// 	text: "code-va_objects",
		// 	// selected: true,
		// 	onLoad() {
		// 		// js.override(this, "dispatch", function(name, evt) {
		// 		// 	console.log(name, evt);
		// 		// 	return js.inherited(arguments);
		// 		// });
		// 		return this.inherited(arguments);
		// 		// this._control.udown("#toggle_filters").setState(true);
		// 	}
		// }, [

		// 	// TODO Why does this not work?
		// 	// ["#toggle_filters", { state: true }]
	
		// ]],

		["Tab<devtools/pouchdb/AllDocs>", ("va_objects"), {
			text: "va_objects"
		}],

		// ["Tab<devtools/pouchdb/AllDocs>", ("VO.app-va_objects"), {
		// 	text: "VO.app-va_objects"
		// }]
		
		// ["Tab<devtools/pouchdb/AllDocs>", ("VO-va_objects"), {
		// 	text: "VO-va_objects"
		// }]
		
	]]

]];