"";

["", {
	overrides: {
		
	},
	vars: {
        "default-workspaces": [{
        	name: "✪",
	    	vars: { "#navigator favorites": [ "Dropbox-veldapps/BXV/.md;.md;File" ] },
            state: {
	            "left-sidebar.visible": false,
	            "editors": [{
	                "selected": true,
	                "resource": {
	                    "uri": "Dropbox-veldapps/BXV/.md",
	                    "type": "File"
	                }
	            }]
            },
            onTabRender() {
            	this.addClass("star");
            	this.set("onRender", null);
            }
        }, {
            "name": "Start",
            "selected": true,
	    	"vars": { "#navigator favorites": [ "Dropbox-veldapps/BXV/Start/.md;.md;File" ] },
            "state": {
	            "left-sidebar.visible": false,
	            "editors": [{
	                "selected": true,
	                "resource": {
	                    "uri": "Dropbox-veldapps/BXV/Start/.md",
	                    "type": "File"
	                }
	            }]
            }
        }, {
        	"name": "Kaart",
        	"specializer": "cavalion-blocks:Dropbox-veldapps/Issues/VA-20220501-1-Map/Map"
        }, {
        	"name": "Documenten",
	    	"vars": { "#navigator favorites": [ "Dropbox-veldapps/Issues/VA-20230903-1-Docs/.md;.md;File" ] }
        }]
	}
}, [
	[("#title"), { classes: "smdl" }]//, vars: { title: "BVX" } }], // picked up from #0 (app)
]];