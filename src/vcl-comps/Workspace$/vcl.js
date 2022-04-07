$(["devtools/Workspace"], { 
	vars: {
		"#navigator favorites": [
			"Workspaces/cavalion.org/cavalion-js/src",
			"Workspaces/cavalion.org/cavalion-vcl/src",
			"Workspaces/cavalion.org/cavalion-vcl/.md;vcl/.md;File"
		]
	},
	handlers: {
		"loaded": function() {
			// this.udown("#workspace-needed").execute("code/build");
		}
	}
});