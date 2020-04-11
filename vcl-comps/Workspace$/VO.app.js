$([], {
	onLoad() {
		this.down("#session-bar").setParent(this.app().down("#window"));
		this.down("#session-bar").setIndex(0);
		
		["Gebruikers", "Bedrijven", "Onderzoeken", "Meetpunten", "Documenten"]
			.forEach(
				(name) => this
					.up("devtools/Main<>")
					.down("#workspace-needed")
					.execute({ workspace: { name: name }, selected: false })
			);
			
		return this.inherited(arguments);
	}
});