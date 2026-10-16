const ROOT = "Dropbox-veldapps/BXV/";

const default_workspaces =  [{
    	name: "✪",
    	vars: { "#navigator favorites": [ ROOT + ".md;.md;File" ] },
        state: {
            "left-sidebar.visible": false,
            "editors": [{
                "selected": true,
                "resource": {
                    "uri": ROOT + ".md",
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
    	"vars": { "#navigator favorites": [ ROOT + "Start/.md;.md;File" ] },
        "state": {
            "left-sidebar.visible": false,
            "editors": [{
                "selected": true,
                "resource": {
                    "uri": ROOT + "Start/.md",
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
    }, {
    	"name": "BW",
    	"specializer": "cavalion-blocks:Dropbox-veldapps/Issues/VA-20220501-1-Map/Map."
    }];

["", {
	vars: {
		"default-workspaces": default_workspaces
	}
}, [
	[("#title"), { classes: "smdl" }]//, vars: { title: "BVX" } }], // picked up from #0 (app)
]];
