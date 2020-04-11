$(["devtools/Main<Veldoffice>"], {
	vars: {
		"default-workspaces": [{
			name: "Test",
	        "state": {
	            "left-sidebar.visible": true,
	            "editors": [{
	                "selected": true,
	                "resource": {
	                    "uri": "Projects/veldoffice-rapportage-scripts-live/lib/bro/tools",
	                    "type": "Folder"
	                }
	            }]
	        }
		}, {
			name: "Log",
			selected: true,
	        "state": {
	            "left-sidebar.visible": true,
	            "editors": [{
	                "selected": false,
	                "resource": {
	                    "uri": "Resource-wavkytnyk5.log",
	                    "type": "File"
	                }
	            },
	            {
	                "selected": true,
	                "resource": {
	                    "uri": "STREAM.md",
	                    "type": "File"
	                }
	            }]
	        }
		}, {
			name: "Sessies",
			state: {
	            "left-sidebar.visible": false,
	            editors: [{
	                selected: true,
	                resource: {
	                    uri: "Library/cavalion-blocks/tools/veldapps/ListOf<>/Session.js",
	                    type: "File"
	                }
	            }]
			}
		}, {
			name: "Bedrijven",
			state: {
				"left-sidebar.visible": false,
	            editors: [{
	                selected: true,
	                resource: {
	                    uri: "Library/cavalion-blocks/tools/veldapps/ListOf<>/Bedrijf.js"
	                }
	            }]
			}
		}, { 
			name: "Gebruikers",
			state: {
				"left-sidebar.visible": false,
	            editors: [{
	                selected: true,
	                resource: {
	                    uri: "Library/cavalion-blocks/tools/veldapps/ListOf<>/Account.js"
	                }
	            }]
			}
		}, { 
			name: "Onderzoeken",
			state: {
				"left-sidebar.visible": false,
	            editors: [{
	                selected: true,
	                resource: {
						uri: "Library/cavalion-blocks/tools/veldapps/ListOf<>/Onderzoek.js"
	                }
				}]
			}
		}, { 
			name: "Documenten",
			state: {
				"left-sidebar.visible": false,
	            editors: [{
	                selected: true,
	                resource: {
						uri: "Library/cavalion-blocks/tools/veldapps/ListOf<>/Document.js"
	                }
				}]
			}
		}, { 
			name: "Fotos",
			state: {
				"left-sidebar.visible": false,
	            editors: [{
	                selected: true,
	                resource: {
						uri: "Library/cavalion-blocks/tools/veldapps/ListOf<>/Foto.js"
	                }
	            }]
			}
		}, { 
			name: "Meetpunten",
			state: {
				"left-sidebar.visible": false,
	            editors: [{
	                selected: true,
	                resource: {
						uri: "Library/cavalion-blocks/tools/veldapps/ListOf<>/Meetpunt.js"
	                }
	            }]
			}
		}, {
			name: "Peilbuislabels",
	        state: {
	            "left-sidebar.visible": false,
	            "editors": [{
	                "selected": true,
	                "resource": {
	                    "uri": "Library/cavalion-blocks/tools/veldapps/ListOf<>/MeetpuntFilter-peilbuislabel-bedrijf.js",
	                    "type": "File"
	                }
	            },
	            {
	                "selected": false,
	                "resource": {
	                    "uri": "Library/cavalion-blocks/tools/veldapps/ListOf<>/MeetpuntFilter-peilbuislabel.js",
	                    "type": "File"
	                }
	            }]
	        }
		}]
	},
	css: {
		// ".vcl-ui-Tabs": "background-color: white;",
		".vcl-ui-Tabs.bottom": "background-color: transparent;"
	}
}, [
	$i("session-bar", [
	
		$i("title", { 
			content: "Veldoffice<span style='font-weight:normal;'> - beheer</span>" 
		})
		
	])
]);


