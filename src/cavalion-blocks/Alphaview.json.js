"use js";

["", {}, [
	["Executable", ("json"), {
		on() {
			const ctx = this.vars(["ctx"]);
			const content = JSON.stringify(ctx.sel, null, 2);

			if(ctx.ws) {
				const tab = ctx.ws.qs("#editor-needed").execute({
					resource: { uri: "Resource-" + Date.now() + ".json" },
					selected: true
				});

				tab.once("resource-loaded", function() {
					tab.down("#ace").setValue(content);
				});
			} else if(typeof window.O === "function") {
				const q = this.ud("#q");
				const tab = this.ud("#tabs").getSelectedControl(1);
				const label = q.getValue() || (tab && tab.vars("key")) || q.getPlaceholder();

				window.O(js.sf("/%s.json", label), { text: content });
			}
		}
	}],
	[("#export-as"), { enabled: true }],
	[("#button-export"), { visible: true }],
	[("#popup-export"), [
		[("Button"), "button-json", { action: "json" }]
	]]
]];
