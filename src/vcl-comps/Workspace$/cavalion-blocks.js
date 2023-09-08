"use blocks";

["", {
	
	onLoad() {
		const spec = this.getSpecializer().split(":").pop();
		app.toast({ content: spec, classes: "glassy fade centered"});
		
		this.scope().host.vars("uri", "$HOME/" + spec + ".js");
		this.setTimeout(".md", () => this.open(js.up(spec) + "/.md"), 500);
		
		return this.inherited(arguments);
	}
}, [
	
	["vcl/Action", ("editors-visible"), {
		state: false,
		visible: "state",
		on() { this.toggle(); },
		hotkey: "Alt+Cmd+F1"
	}],
	
	["vcl/Action", ("viewer-visible"), { 
		parent: "editors-visible", 
		state: "parent", 
		visible: "notState"
	}],

	["#editors", { action: "editors-visible", executesAction: false }],
	["#left-sidebar", { action: "editors-visible", executesAction: false }],
	
	[["cavalion-blocks"], ("host"), {
		action: "viewer-visible", 
		executesAction: false
	}]

]];