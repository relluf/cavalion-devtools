["", {}, [
	
	["Executable", ("csv"), {
		on(evt) {
			var selection = this.ud("#list").getSelection(true);
			var filtered = this.ud("#q").getValue().length > 0;
			if(selection.length === 0) {
				selection = this.ud("#array")[filtered ? '_arr' : '_array'];
			}

var valueOf = (value, column) => value instanceof Array ? value.length : js.nameOf(value);

			var ws = this.up("devtools/Workspace<>:root");
			var tab = ws.down("#editor-needed").execute({
				resource: { uri: "Resource-" + Date.now() + ".csv" },
				selected: true
			});
			
			/* build the header based upon Object.keys(selection) */
			var columnByH = (h) => list._columns.filter(c => c._attribute === h)[0];
			var columnsOf = (header) => header.map(h => columnByH(h)._attribute);//getContent());
			
			var header = [], list = this.ud("#list");
			selection.forEach(_ => Object.keys(_).forEach(key => !header.includes(key) ? header.push(key) : []));
			header = header.sort((h1, h2) => {
				var c1 = columnByH(h1).getIndex();
				var c2 = columnByH(h2).getIndex();
				return c1 === c2 ? 0 : c1 < c2 ? -1 : 1;
			});

			// this.print("remove", header.splice(0, 1)); // ? (1*)
			
			selection = selection.map(_ => js.sf("\"%s\"", header.map(h => _[h] !== undefined ? valueOf(_[h], columnByH(h)) : "").join("\",\"")));
			tab.once("resource-loaded", function() {
				tab.down("#ace").setValue([columnsOf(header)].concat(selection).join("\n"));
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