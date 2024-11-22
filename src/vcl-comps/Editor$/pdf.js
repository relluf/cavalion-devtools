"use devtools/Resources";

var Resources = require("devtools/Resources");

var Handlers = {
    "#iframe onResize"() { this.setState("invalidated"); },
	"#iframe onRender"() {
		if(this._node && this._node.childNodes.length) {
			var cs = this.getComputedStyle();
		    // this._node.childNodes[0].style.width = "0";
		    this._node.childNodes[0].style.height = "0";
	    	this._node.childNodes[0].style.height = cs.height;
	    	this._node.childNodes[0].style.width = cs.width;
		}
    },
    
    onActivate() {
    	this.ud("#iframe").render();
    }
};


["", { handlers: Handlers }, [
    ["#refresh", {
        onExecute: function() {
        	var scope = this.scope();
			// var url = String.format("%s/%s?%d", 
			// 	"/home", scope['@owner'].vars(["resource.uri"]), 
			// 	Date.now());
			
			var uri = this.vars(["resource.uri"]);
			
			if(uri.startsWith("dropped://")) {
				Resources.get(uri, { arrayBuffer: true })
					.then(arrayBuffer => scope.iframe.setContent(js.sf("<iframe src='%s'></iframe>", 
						URL.createObjectURL(new Blob([arrayBuffer], { 
							type: 'application/pdf' })))));
			} else {
				
				Resources.link(uri)
					.then(url => {
						// TODO setContent without immediate update
						var post = url.startsWith("/office-rest/action/documenten/view?id=") ? "" : "?raw=1";
						scope.iframe._content = js.sf("<iframe src=\"%s%s\"></iframe>", url, post, Date.now());
						scope.iframe.recreateNode();
					    scope.loading.show();
						
						var node = scope.iframe.getChildNode(0);
						node.onload = function() {
							scope.iframe.render();
					        scope.loading.hide();
						};
					});
			}
				
        },
        onExecute_fetch_arrayBuffer: function() {
			fetch("path/to/pdf.pdf")
			  .then(response => response.arrayBuffer())
			  .then(arrayBuffer => {
			    var blob = new Blob([arrayBuffer], { type: "application/pdf" });
			    var link = document.createElement("a");
			    link.href = window.URL.createObjectURL(blob);
			    link.download = "pdf.pdf";
			    link.click();
			  });
        	
        }
    }],
    ["#ace", {visible: false}],
    ["vcl/ui/Panel", "iframe", {
        align: "client",
    	css: {
    	    "overflow": "hidden",
    	    "iframe": "position: absolute; top: 0; left: 0; bottom: 0; right: 0; width: 100%; height: 100%; border: none;",
    	    "transition": "all 500ms"
    	}
    }]
]];