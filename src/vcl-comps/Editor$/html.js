// "use pages/Controller, Framework7";

/*- 

2022/04/24 - cleaning up Framework7 stuff

	The Editor<html> should maintain a persistent register of classes being applied 
	to the `preview`.
	
	#CVLN-20210728-1 Editor<html>
		- ability to register classes per resource for the `preview`
		- use the menu button of the tab of the editor
		- potentially, there are many resources
			- would it be nice to collect a list of all resources?
			- would it be performant?
			- maybe a local document, without *any revisions?
	
*/

["", {
	// onLoad: function() {
	// 	var resource = this.getVar("resource", true);
	// 	var scope = this.scope();
	// 	if(
	// 		(resource.uri.indexOf("/V7/src/") !== -1 || resource.uri.indexOf("/src/pages/") !== -1 || resource.uri.indexOf(".page/.html") !== -1) ||
	// 		(resource.uri.indexOf("/src/gdtis/pages/") !== -1)
	// 	) {
	// 		require("pages/Controller");
	// 		scope.preview.setClasses("fw7 ios");
	// 	}
		
	// 	scope.preview.override({
	// 		layoutChanged: function() {
	// 			this.inherited();
				
	// 			var template;
	// 			if(this._node.childNodes.length && (template = this._node.childNodes[0]).nodeName === "TEMPLATE") {
	// 				var instance = document.importNode(template.content, true);
	// 				this._node.insertBefore(instance, template);
	// 			}

	// 			var node = this._node.childNodes[0] || {};
	// 			if(node.className === "popup" && node.childNodes.length) {
	// 				node.className = "popup_";
	// 				if(node.childNodes[0].className === "view") {
	// 					node.childNodes[0].className = "view_";
	// 				}
	// 			}
	// 		}
	// 	});
		
	// 	return this.inherited(arguments);
	// }
    onLoad: function() {
    	var scope = this.scope();
        var uri = this.vars(["resource.uri"]);
        // if(uri.indexOf("vcl-comps/f7/Page$/") !== -1) {
        // 	require(["Framework7", "font-awesome"]);
        // 	scope.preview.addClass("f7-body");
        // }
        if(uri.indexOf("index.html") !== -1) {
        	scope.preview.setVisible(false);
        }
    	return this.inherited(arguments);
    }
}, [
    [("#ace"), {
        align: "left",
        width: 750,
        onChange: function() {
        	this.setTimeout("render", () => this.scope().render.execute(), 250);
        },
    }],
	[("vcl/Action"), "toggle-source", {
		hotkey: "Shift+MetaCtrl+S",
		onLoad() {
			// this.scope().ace.hide();
			this.up().readStorage("toggle-source-state", (state) => {
				state = (state !== false);
				this.setState(state);
				if(!state) {
					this.scope().ace.hide();	
				}
			});
		},
		onExecute() {
			var state;
			if((state = this.toggleState()) === true) {
				this.scope().ace.show();
			} else {
				this.scope().ace.hide();
			}
			this.up().writeStorage("toggle-source-state", state);
		}
	}],
    [("vcl/Action"), "render", {
    	onExecute: function(evt) {
    		var scope = this.scope();
    		evt = evt || {value: scope.ace.getValue()};
    		
            /*- reference to root node of current HTML */
            var root = scope.preview.getNode();
            /*- save all scrollTop values which are not equal to 0 */
            // var pos = Array.from(root.querySelectorAll("*").filter(_ => _.scrollTop).map(_ => { 
            var pos = Array.from(root.qsa("*")).filter(_ => _.scrollTop).map(_ => { 
            	var n = _, s = []; 
            	while(n !== root) { 
            		/*- build the selector */
            		s.unshift(n.nodeName.toLowerCase() + (n.className ? ("." + n.className.split(" ").join(".")) : "")); 
            		n = n.parentNode; 
            	} 
            	return [s.join(" > "), _.scrollTop];
            });
        	var uri = this.vars(["resource.uri"]);
            var data = this._owner.vars("data") || this.vars(["devtools/Editor<html>://" + uri]);

			if(typeof Template7 !== "undefined") {
	            try {
	        		scope.preview.setContent(Template7.compile(evt.value)(data));
	            } catch(e) {
	            	this.print(e);
	            	scope.preview.setContent(js.sf("<div style='padding:8px;background-color:red;color:white;font-weight:bold;'>%H</div>%s", e.message, evt.value));
	            }
			} else {
        		scope.preview.setContent(evt.value);
			}
        	
        	/* restore scrollTop positions */
        	try { 
        		scope.preview.update(_ => pos.forEach(p => p[0].scrollTop = p[1]));
        		// scope.preview.update(_ => pos.forEach(p => document.querySelector(p[0]).scrollTop = p[1]));
				this._owner.emit("resource-rendered", [{sender: this.up()}]);
        	} catch(e) {
        		// Ni modo...
        	}
        },
    }],
    [("vcl/ui/Panel"), "preview", {
        align: "client",
        css: { 
            "background-color": "#f0f0f0", 
            "border-left": "1px solid silver",
            "border-right": "1px solid silver",
            "&.fw7": {
				"font-family": "-apple-system, SF UI Text, Helvetica Neue, Helvetica, Arial, sans-serif",
            	"background-color": "rgba(224,224,224,0.8)",
            	"border-radius": "12px"
            }
        },
        visible: true,
        vars: {
        	"wrapper-start": "",//"<div><h1>PREVIEW</h1><div>",
        	"wrapper-end": ""//"</div><h3>FOOTER</h3></div>"
        },
        
        onLoad() {
        	this.override("setContent", function(value) {
        		var args = [js.sf("%s%s%s", this.vars("wrapper-start"), value, this.vars("wrapper-end"))];
        		
        		// this.addClasses(classes);
        		
        		args.callee = arguments.callee;
        		return this.inherited(args);
        	});
        }
    }]
]];