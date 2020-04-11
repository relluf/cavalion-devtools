"use pages/Controller, Framework7";

var q$ = require("jquery");

$([], {
	onLoad: function() {
		var resource = this.getVar("resource", true);
		var scope = this.scope();
		if(
			(resource.uri.indexOf("/V7/src/") !== -1 || resource.uri.indexOf("/src/pages/") !== -1 || resource.uri.indexOf(".page/.html") !== -1) ||
			(resource.uri.indexOf("/src/gdtis/pages/") !== -1)
		) {
			require("pages/Controller");
			scope.preview.setClasses("fw7 ios");
		}
		
		scope.preview.override({
			layoutChanged: function() {
				this.inherited();
				
				var template;
				if(this._node.childNodes.length && (template = this._node.childNodes[0]).nodeName === "TEMPLATE") {
					var instance = document.importNode(template.content, true);
					this._node.insertBefore(instance, template);
				}

				var node = this._node.childNodes[0] || {};
				if(node.className === "popup" && node.childNodes.length) {
					node.className = "popup_";
					if(node.childNodes[0].className === "view") {
						node.childNodes[0].className = "view_";
					}
				}
			}
		});
		
		return this.inherited(arguments);
	}
}, [
    $i(("ace"), {
        onLoad: function() {
        	var scope = this.scope();
	        var uri = this.vars(["resource.uri"]);
	        if(uri.indexOf("vcl-comps/f7/Page$/") !== -1) {
	        	require(["Framework7", "font-awesome"]);
	        	scope.preview.addClass("f7-body");
	        }
            if(uri.indexOf("index.html") !== -1) {
            	scope.preview.setVisible(false);
            }
        	return this.inherited(arguments);
        },
        onChange: function() {
        	this.setTimeout("render", function() {
            	this.scope().render.execute();
        	}.bind(this), 250);
        },
        align: "client"
    }),
    $(("vcl/Action"), "render", {
    	onExecute: function(evt) {
    		var scope = this.scope();
    		evt = evt || {value: scope.ace.getValue()};
    		
            /*- reference to root node of current HTML */
            var root = scope.preview._node; 
            /*- save all scrollTop values which are not equal to 0 */
            var pos = q$("*", root).toArray().filter(_ => _.scrollTop).map(_ => { 
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
            
            try {
        		scope.preview.setContent(Template7.compile(evt.value)(data));
            } catch(e) {
            	this.print(e);
            	scope.preview.setContent(js.sf("<div style='padding:8px;background-color:red;color:white;font-weight:bold;'>%H</div>%s", e.message, evt.value));
            }
        	
        	/* restore scrollTop positions */
        	try { 
        		scope.preview.update(_ => pos.forEach(p => q$(p[0]).scrollTop(p[1])));
        	} catch(e) {
        		// Ni modo...
        	}
        },
    }),
    $(("vcl/ui/Panel"), "preview", {
        align: "right",
        width: 375,
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
        visible: true
    })
]);