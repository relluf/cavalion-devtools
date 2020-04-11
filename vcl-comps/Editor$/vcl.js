"vcl/Factory, vcl/ui/Node, vcl/ui/Tab";

var Component = require("vcl/Component");
var Factory = require("vcl/Factory");
var Node = require("vcl/ui/Node");
var Tab = require("vcl/ui/Tab");

$(["./Editor<js>"], {
    onLoad: function() {
        var tab = this.up("vcl/ui/Tab");
        var scope = this.scope();
        
        var sourceUri = tab.getVar("resource.uri", true);
        var uri = sourceUri.split(".");
        var ext = uri.pop(), index;
        
        uri = uri.join(".").split("/");
        
        if((index = uri.indexOf("vcl-comps")) !== -1) {
        	//uri.splice(0, index + 1);
        	uri = uri.join("/");
        	if(uri.indexOf("$/") !== -1) {
        		uri = uri.split("$");
        		uri = uri[0] + ("<" + uri.pop().substring(1) + ">");
        	}

			// var uri2 = uri;			
			// while((uri2 = Component.getImplicitBaseByUri(uri2)) !== null) {
			// 	var inh = new Tab(scope['@owner']);
			// 	inh.setParent(scope['bottom-tabs']);
			// 	inh.setText(uri2);
			// 	inh.setIndex(0);
			// }
        } else {
    		uri = uri.join("/");
        }
        
        /* When dealing with a "tool" run it immediately */
        if(uri.indexOf("/tools/vcl-comps/") !== -1 || uri.indexOf("/vcl-comps/tools/") !== -1) { 
        	scope['toggle-source'].setState(false);
        	scope.ace.hide();
        	scope['toggle-component'].setState(true);
        }
        
    	var keys = Component.getKeysByUri(this.up("devtools/Workspace<>")._uri);
    	// TODO this might work better: uri = String.format("/home/%s", uri);
    	// uri = String.format("ws/%s/%s", keys.specializer, uri);
    	
    	// see main.js
    	uri = String.format("$HOME/%s", uri);
        
        function f() { scope.instantiate.execute({ uri: uri, sourceUri: sourceUri }); }
        tab.on({"resource-loaded": f, "resource-saved": f});

    	var resource = this.getVar("resource", true);
		var node = new Node(this);
		node.setText(resource.uri);
		node.setExpandable(true);
		node.setParent(scope.tree);

        return this.inherited(arguments);
    },
    onResize: function() {
        this.setTimeout("alignControls", 32);
    }
}, [
	$("vcl/Action#instantiate", {
		onExecute: function(evt) {
			var scope = this.scope(), uri = evt.uri;
        	if(!scope.host.isVisible()) { return; } //TODO shouldn't be here
        	
            var factory = new Factory(require, uri, evt.sourceUri);
            var root = scope.host.getControls()[0];
            
            while(root) {
            	root && root.setParent(null);
            	root = scope.host.getControls()[0];
            }
            
            factory.load(scope.ace.getValue(), 
                function() {
                    try {
                        root && root.destroy();
                        root = factory.newInstance(scope['@owner'], uri);
                        if(root instanceof require("vcl/Control")) {
                            root.setParent(scope.host);
                        } else {
                        	root.qsa(":instanceOf(vcl/Control)").forEach(function(c) {
                        		if(c.getParentComponent() === root) {
                        			c.setParent(scope.host);
                        		}
                        	});
                        }
                        scope.host.up("devtools/Workspace<>").print(root);
                    } catch(e) {
                        alert(e.message); 
                    }
                }, 
                function(e) {
                    root && root.show();
                    
                	if(e instanceof Error) {
                    	console.error(e);
                		alert(e.message);
                		scope.host.up().print(e);
                	}
				});

		}
	}),
	
    $("vcl/Action#toggle-source", {
        hotkey: "Shift+MetaCtrl+S",
        selected: "state",
        visible: "state",
        state: true,
        
        onExecute: function() {
        	this.setState(!this.getState());
        }
    }),
    $("vcl/Action#toggle-component", {
        hotkey: "Shift+MetaCtrl+C",
        selected: "state",
        visible: "state",
        state: false,
        
        onExecute: function() {
        	this.setState(!this.getState());
        	// var preview = this.scope().preview;
        	// preview.setSelected(!preview.isSelected());
        }
    }),
    $("vcl/Action#toggle-instantiate", {
        hotkey: "Shift+MetaCtrl+X",
		onExecute: function(evt) {
			// TODO source might be lost because of #refresh
			var scope = this.scope();
			var tc = scope['toggle-component'];
			if(tc.getState() !== true) {
				tc.setState(true);
				tc.setTimeout("reload-execute", function() {
					scope.refresh.execute(evt, scope['@this']);
				}, 200);
			} else {
				tc.setState(false);
			}
		}    	
    }),

    $i("ace", { align: "left", width: 750 }),
    
	$("vcl/ui/Tabs#bottom-tabs", { align: "bottom", classes: "bottom inset", autoSize: "height" }, [
    	$("vcl/ui/Tab", { action: "toggle-source", text: locale("Source"), control: "ace", groupIndex: -2, visible: "always" }),
    	$("vcl/ui/Tab", { action: "toggle-component", text: locale("Component"), control: "host", groupIndex: -3, visible: "always" })
	]),
	
    $("vcl/ui/Tree", "tree", {
        align: "client", visible: false,
        css: { 
        	padding: "8px",
            "background-color": "#f0f0f0", 
            "border-left": "1px solid silver",
            "border-right": "1px solid silver"
        },
        onNodesNeeded: function(parent) {
        	var owner = this._owner;
        	
        	for(var i = 0; i < 5; ++i) {
        		var node = new Node(owner);
        		node.setText(i);
        		node.setExpandable(true);
        		node.setParent(parent || this);
        	}
        }
	}),
	
    $("vcl/ui/Panel", "host", {
        action: "toggle-component", align: "client", selected: "never", executesAction: false,
        classes: "animated",
        css: { 
            "background-color": "#f0f0f0", 
            "border-left": "1px solid silver",
            "border-right": "1px solid silver"
        }
    }, [
    	$("vcl/ui/Element", {
    		content: "<h3 style='margin-top:10%;'><center>" + 
    			"Reload <small>&#x2318;+R</small> or Save <small>&#x2318;+S</small> to view the component here<br><small>(or just click here to Reload)</small><br><br><br>" + 
    			"</center></h3><p style='padding-left:16px;'>Other shortcuts that might come handy:<ul>" + 
	    		"<li><b>&#x21E7;&#x2318;+S</b> toggles the Source tab</li>" +
	    		"<li><b>&#x21E7;&#x2318;+C</b> toggles the Component tab</li>" +
	    		"<li><b>&#x21E7;&#x2318;+X</b> toggles the Component tab and reloads upon show</li></ul></p>",
    		onClick: function() {
    			this.scope().refresh.execute();
    		}
    	})
    ])

]);
