["", {}, [
	
	[("Executable"), "csv", {
		on(evt) {
			var selection = this.ud("#list").getSelection(true);
			var filtered = this.ud("#q").getValue().length > 0;
			if(selection.length === 0) {
				selection = this.ud("#array")[filtered ? '_arr' : '_array'];
			}

var nameOf = (_) => _ instanceof Array ? js.sf("%d items", _.length) : js.nameOf(_);

			var ws = this.up("devtools/Workspace<>:root");
			var tab = ws.down("#editor-needed").execute({
				resource: { uri: "Resource-" + Date.now() + ".csv" },
				selected: true
			});
			
			var header = [];
			selection.forEach(_ => Object.keys(_).forEach(key => !header.includes(key) ? header.push(key) : []));
			
			// this.print("remove", header.splice(0, 1)); // ? (1*)
			
			selection = selection.map(_ => js.sf("\"%s\"", header.map(h => _[h] !== undefined ? nameOf(_[h]) : "").join("\",\"")));
			tab.once("resource-loaded", function() {
				tab.down("#ace").setValue([header].concat(selection).join("\n"));
			});
		}
	}],

	[("#bar"), [
		[("#right"), [
			[("#export"), [
				[("Button"), "button-csv",{ action: "csv" }]
			]]	
		]]
	]]
	
]];