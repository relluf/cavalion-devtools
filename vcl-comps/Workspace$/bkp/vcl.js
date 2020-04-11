$(["devtools/Workspace"], { 
	vars: {
		"#navigator favorites": [
			"Workspaces/cavalion.org/cavalion-js/src",
			"Workspaces/cavalion.org/cavalion-vcl/src",
			"Workspaces/cavalion.org/cavalion-js/CHANGELOG.md;js/CHANGELOG.md;File",
			"Workspaces/cavalion.org/cavalion-vcl/CHANGELOG.md;vcl/CHANGELOG.md;File"
		]
	},
	handlers: {
		"loaded": function() {
			this.udown("#workspace-needed").execute("code/build");
		}
	}
});