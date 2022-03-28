"use devtools/Resources";

/*-

### Notes

* `#editor-needed` has a param parents

### 2021/01/13
* Fix for double backslash while prompting for new uri

*/

var Resources = require("devtools/Resources");

function allowResource(resource) {
	return [".git", ".svn", ".DS_Store"].includes(resource.uri.split("/").pop()) === false
		&& ["zip", "7z"].includes(resource.uri.split(".").pop()) === false
		&& ["prj", "sbn", "dbf", "sbx", "shp", "shx"].includes(resource.uri.split(".").pop()) === false;
}
function sortResource(resource1, resource2) {
	if(resource1.name === ".md") return -1;
	if(resource2.name === ".md") return 1;
	
	var isnum1 = !isNaN(resource1.name), isnum2 = !isNaN(resource2.name);
	if(isnum1 && isnum2) {
		return isnum1 < isnum2 ? 1 : -1;
	}
	
	if(resource1.name.startsWith(".") && !resource2.name.startsWith(".")) {
		return -1;
	}
	if(resource2.name.startsWith(".") && !resource1.name.startsWith(".")) {
		return 1;
	}
	if(resource1.type === resource2.type) {
		return resource1.name < resource2.name ? -1 : 1;
	}
	if(resource1.type === "Folder") return -1;
	return 1;
}
function common(tab) {
	var resource = tab.vars("resource");
	tab.setCloseable(false);
	tab.on("dblclick", function() { 
		if(confirm("Are you sure you want to close this resource?") === true) {
			this.getControl().getForm().close();
		}
		//this._control && this._control._form && this._control._form.close(); 
	});
	if(resource.uri.split("/").pop().indexOf(".") === -1) {
		tab.addClass("bold");
	}
}

[(""), {
	css: {
		"[id$=-editors-tabs]": "border-top-color: transparent;"
	},
	_onDispatchChildEvent: function(component, name, evt, f, args) {
		if(name !== "keyup") {
			return;
		}
		var tabs = this.down("#editors-tabs");
		if(evt.ctrlKey === true && evt.shiftKey === true) {
			if(evt.keyCode === 186) {
				tabs.selectPrevious();
			} else if(evt.keyCode === 222) {
				tabs.selectNext();
			} else {
				// console.log(evt.keyCode);
			}
		} else if(evt.ctrlKey === true) {
			if(evt.keyCode === evt.KEY_PAGE_UP) {
				tabs.selectPrevious();
			} else if(evt.keyCode === evt.KEY_PAGE_DOWN) {
				tabs.selectNext();
			}
		}
	},
    onActivate: function() {
    	this.qsa("vcl/ui/Tab[selected=true]").each(tab => tab.getControl().setFocus());
        return this.inherited(arguments);
    },
    onLoad: function() {
    	var scope = this.scope();
    	var uri = this.vars(["resource.uri", true]);
    	var editor_needed = scope['editor-needed'];
    	
    	// if this a not a local folder, request its contents from Resources/cavalion-server
    	if(typeof uri === "string" && !uri.startsWith("local:")) {
	    	Resources.list(uri)
	    		.then(res =>
					res.filter(allowResource).sort(sortResource).forEach((resource, i) => 
						editor_needed.execute({resource: resource, selected: i === 0})
					))
				.then(res => {
					this.emit("editors-loaded", [this, res]);
				});
    	}
		
		scope.save._onExecute = null;

		var tab = this.up("vcl/ui/Tab");
        tab.emit("resource-loaded");

    	// Nasty hacks ;-)
		if(tab) tab.addClass("bold");
		scope['add-resources'].execute(this.vars("resources") || []);
	
		// NOTE do not call inherited, because we are not editing a file? didn't seem to work with jpg/png.js - better override refresh?
    }
}, [
	[("#menu-open"), {
		// onExecute: function() {
		// 	if(confirm(js.sf("I am folder %s, delegate to inherited?", 
		// 		this.vars(["resource.uri"]).split("/").pop())) === true) {
		// 			return this.inherited(arguments);
		// 	}
		// }
	}],
	
    [("#refresh"), { enabled: false }],
    [("#evaluate"), { enabled: false }],
    [("#print"), { enabled: false }],
    [("#format"), { enabled: false }],
	
	// TODO have a .blocks-file for overridden stuff (#CVLN-20200802-1)
	[("#ace"), { visible: false }],
	
	["vcl/ui/Tabs", ("editors-tabs"), {
		action: "prompt-add-resource",
		executesAction: "onDblClick",
		onNodeCreated() {
			this.up().readStorage("editors-tabs", (state) => {
				state && state.selected && this.getControl(state.selected).setSelected(true);
			});
		},
		onChange(newTab, oldTab) {
			if(!newTab) return;
			this.up().writeStorage("editors-tabs", { selected: newTab && newTab.getIndex() });
		}
	}],
	["vcl/Action", ("editor-needed"), {
		on(evt) {
			if(typeof evt === "string") {
				evt = { resource: { uri: evt } };
			}
			
			var scope = this.scope();
			evt.resource.uri = js.normalize(this.vars(["resource.uri"]) + "/", evt.resource.uri);

    		var owner = this._owner;
			var tabs = scope['editors-tabs']; 
			var tab = (tabs._controls||[]).find(_ => _.vars("resource.uri") === evt.resource.uri);
			
			if(!tab) {
		    	var editor_needed = this.up("devtools/Workspace<>:root").down("#editor-needed");
				tab = editor_needed.execute(js.mixIn({
					parents: {container: owner, tab: tabs},
					resource: evt.resource,
					selected: evt.selected,
					owner: owner
				}, evt));
				if(evt.resource.type === "Folder") {
					tab.addClass("bold");
				}
				tab.setCloseable(false);
				tab.on("dblclick", function() { 
					if(confirm("Do you want to close this resource?") === true) {
						this.getControl().getForm().close();
					}
				});
				
			} else {
				if(evt.formUri) {
					tab._control._formUri = evt.formUri;
				}
				if(evt.formParams) {
					tab._control._formParams = evt.formParams;
				}
				if(evt.selected) tab.setSelected(true);
				// return tab;
			}

			// if(evt.onAvailable || evt.onResourceLoaded || evt.onResourceSaved || evt.onResourceRendered) {
				var callback = (f, args) => {
					return f && f.apply(this, args);
				}, first = true;
	            tab.once("editor-available", (e) => { first = false; callback(evt.onAvailable, [e]); });
	            tab.on({
	            // 	"resource-rendered"(e) { callback(evt.onResourceRendered, [e]); },
	            	"resource-loaded"(e) { 
	            		if(first) { tab.emit("editor-available", [e]); }
	            		callback(evt.onResourceLoaded, [e]); 
	            	},
	            // 	"resource-saved"(e) { callback(evt.onResourceSaved, [e]); }
	            });
        	// }
        	
        	if(tab.down("#ace")) {
    			tab.setTimeout("available", () => tab.emit("editor-available", []), 0);
        	}
			
			return tab;
		}
	}],
	["vcl/Action", ("prompt-add-resource"), {
		onExecute(evt) {
			// console.log(evt.shiftKey, require("util/Event").getKeyModifiers(evt));
			
	    	var editor_needed = this.up("devtools/Workspace<>:root").down("#editor-needed");
	    	var uri = this.vars(["resource.uri"]);
	    	var scope = this.scope(), owner = this._owner;
	    	var rand = Math.random().toString(36).substring(2, 15);
	    	
	    	if(!uri.endsWith("/")) uri += "/";
	    	
	    	app.prompt(js.sf("Enter new resource uri:\n\n[.=%s]", uri), "./Resource-" + rand, function(value) {
	    		if(value) {
					var tab = editor_needed.execute({
						parents: {container: owner, tab: scope['editors-tabs']}, 
						resource: {uri: js.normalize(uri, value)},
						selected: true,
						owner: owner
					});
					common(tab);
	    		}
	    	});
		}
	}],
	["vcl/Action", ("add-resources"), {
		onExecute:  function(resources) {
	    	var scope = this.scope(), app = this.app();
	    	var uri = this.vars(["resource.uri"]);
	    	var editor_needed = this.up("devtools/Workspace<>:root").down("#editor-needed");
	    	var editors = this.up("devtools/Workspace<>:root").down("#editors");
	    	
	    	resources = resources.map(function(resource) {
	    		resource = typeof resource === "string" ? {uri: resource} : js.mixIn(resource);
	    		return resource;
	    	});
	    	
	    	var folders = resources.filter(_ => _.uri.indexOf("/") >= 0).map(_ => _.uri.split("/").shift());
	    	folders = folders.filter(function(path, index) {
	    			return folders.indexOf(path) === index;
	    		});
	    		
	    	var tabs = {};
	    	folders.forEach(function(folder_uri, i) {
	    		var tab = editor_needed.execute({
	    			selected: i === 0,
	    			resource: { uri: folder_uri, type: "Folder" },
    				parents: { container: scope['@owner'], tab: scope['editors-tabs'] }
	    		});
	    		
	    		tab.on("resource-loaded", function() {
		    		var lresources = resources.filter(function(resource) {
		    			return resource.uri.indexOf(folder_uri + "/") === 0;
		    		}).map(function(resource) {
		    			return js.mixIn(js.mixIn(resource), { 
		    				uri: resource.uri.substring(resource.uri.indexOf("/") + 1) 
		    			});
		    		});
	    			tab.down("#add-resources").execute(lresources);
	    			app.print("resource-loaded", this);
	    		});
	    		app.print(folder_uri, tab);
    			common(tab);
	    	});
			resources.forEach(function(resource, i) {
				if(resource.uri.split("/").length === 1) {
	    			var tab = editor_needed.execute({
	    				parents: {container: scope['@owner'], tab: scope['editors-tabs']},
	    				resource: resource,
	    				selected: i === 0 && !folders.length,
	    				owner: scope['@owner']
	    			});
	    			
	    			// TODO folder-resource-loaded?
	    			tab.on("resource-loaded", function() {
	    				if(typeof resource.onGenerate === "function") {
	    					tab.down("#ace").setValue(resource.onGenerate(tab));
	    				}
	    			});
	    			
	    			common(tab);
				}
			});
		}
	}], 
	["vcl/Action", ("add-resources-try"), {
		onExecute:  function(resources) {
	    	var scope = this.scope(), app = this.app();
	    	var uri = this.vars(["resource.uri"]) + "/";

	    	var editor_needed = this.up("devtools/Workspace<>:root").down("#editor-needed");
	    	var editors = this.up("devtools/Workspace<>:root").down("#editors");
	    	
	    	resources = resources.map(function(resource) {
	    		resource = typeof resource === "string" ? {uri: resource} : js.mixIn(resource);
	    		resource.uri = js.normalize(uri, resource.uri);
	    		return resource;
	    	});
	    	
// app.print("resource", resources);
	    	
	    	// var folders = resources.filter(_ => _.uri.indexOf(uri) === 0).map(_ => _.uri.split("/").shift());
	    	// folders = folders.filter(function(path, index) {
	    	// 		return folders.indexOf(path) === index;
	    	// 	});
	    		
	    	// var tabs = {};
	    	// folders.forEach(function(folder_uri, i) {
	    	// 	var tab = editor_needed.execute({
	    	// 		selected: i === 0,
	    	// 		resource: { uri: folder_uri, type: "Folder" },
    		// 		parents: { container: scope['@owner'], tab: scope['editors-tabs'] }
	    	// 	});
	    		
	    	// 	tab.on("resource-loaded", function() {
		    // 		var lresources = resources.filter(function(resource) {
		    // 			return resource.uri.indexOf(folder_uri + "/") === 0;
		    // 		}).map(function(resource) {
		    // 			return js.mixIn(js.mixIn(resource), { 
		    // 				uri: resource.uri.substring(resource.uri.indexOf("/") + 1) 
		    // 			});
		    // 		});
	    	// 		tab.down("#add-resources").execute(lresources);
	    	// 		app.print("resource-loaded", this);
	    	// 	});
	    	// 	app.print(folder_uri, tab);
    		// 	common(tab);
	    	// });
			// resources.forEach(function(resource, i) {
			// 	if(resource.uri.split("/").length === 1) {
	  //  			var tab = editor_needed.execute({
	  //  				parents: {container: scope['@owner'], tab: scope['editors-tabs']},
	  //  				resource: resource,
	  //  				selected: i === 0 && !folders.length,
	  //  				owner: scope['@owner']
	  //  			});
	    			
	  //  			// TODO folder-resource-loaded?
	  //  			tab.on("resource-loaded", function() {
	  //  				if(typeof resource.onGenerate === "function") {
	  //  					tab.down("#ace").setValue(resource.onGenerate(tab));
	  //  				}
	  //  			});
	    			
	  //  			common(tab);
			// 	}
			// });
		}
	}] // 2020-01-19
]];