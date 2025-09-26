

["", {}, [
	
	["Executable", ("csv"), {
		on(evt) {
			const ctx = this.vars(["ctx"]);

			/* build the header based upon Object.keys(ctx.sel) */
			const valueOf = (value, column) => value instanceof Array ? value.length : js.nameOf(value);
			const columnByH = (h) => list._columns.filter(c => c._attribute === h)[0];
			const columnsOf = (header) => header.map(h => columnByH(h)._attribute);
			
			function escapeCSVValue(value) {
				if (value == null) return "";
				var str = String(value);
				var escaped = str.replace(/"/g, '""');
				var needsQuotes = /[",\r\n]/.test(escaped);
				return needsQuotes ? '"' + escaped + '"' : escaped;
			}
			function getCSVContent(ctx, header) {
				const headers = columnsOf(header).map(escapeCSVValue).join(",");
			
				const rows = ctx.sel.map(row => {
					const values = header.map(h => {
						const value = row[h];
						return escapeCSVValue(value !== undefined ? valueOf(value, columnByH(h)) : "");
					});
					return values.join(",");
				});
			
				return [headers].concat(rows).join("\n");
			}
			
			let header = [], list = this.ud("#list");
			ctx.sel.forEach(_ => Object.keys(_).forEach(key => !header.includes(key) ? header.push(key) : []));
			header = header.sort((h1, h2) => {
				var c1 = columnByH(h1).getIndex();
				var c2 = columnByH(h2).getIndex();
				return c1 === c2 ? 0 : c1 < c2 ? -1 : 1;
			});
			
			const content = getCSVContent(ctx, header);

			if(ctx.ws) {
				const tab = ctx.ws.qs("#editor-needed").execute({
					resource: { uri: "Resource-" + Date.now() + ".csv" },
					selected: true
				});
				tab.once("resource-loaded", function() {
					const aceEditor = tab.down("#ace");
					aceEditor.setValue(content);
				});
			} else if(typeof window.O === "function") {
				
				const q = this.ud("#q");
				const sel = list.getSelection(true);
				const tabs = this.ud("#tabs");
				const tab = tabs.getSelectedControl(1);
				
				const label = q.getValue() || (tab && tab.vars("key")) || q.getPlaceholder();

				O(js.sf("/%s.csv", label), { text: content });
			}
		}
	}],

	[("#export"), [
		[("Button"), "button-csv",{ action: "csv" }]
	]]	

	// [("#bar"), [
	// 	[("#right"), [
	// 	]]
	// ]]
	
]];