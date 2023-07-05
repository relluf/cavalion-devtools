"use blocks";

["", {
	
	vars: {
        "default-workspaces": [{
            "name": "⌘1",
            "selected": true,
        	"vars": { "#navigator favorites": [ ".md;.md;File" ] },
            "state": {
	            "left-sidebar.visible": false,
	            "editors": [{
	                "selected": true,
	                "resource": {
	                    "uri": ".md",
	                    "type": "File"
	                }
	            }]
            }
        },{
            "name": "⌘2",
            "state": {
	            "editors": [{
	                "selected": true,
	                "resource": {
	                    "uri": "README.md",
	                    "type": "File"
	                }
	            }, {
	                "resource": {
	                    "uri": ".js",
	                    "type": "File"
	                }
	            }, {
	                "resource": {
	                    "uri": ".blocks",
	                    "type": "File"
	                }
	            }]
            }
        },{
            name: "⌘3"
        },{
            name: "⌘4"
        }]
	}
	
}, [

	// ["#workspaces-tabs", { _align: "top", _index: 0, _classes: "", zoom: 1 }]
	
]];








// [["./Main<Cavalion-code>"]]; // just an alias