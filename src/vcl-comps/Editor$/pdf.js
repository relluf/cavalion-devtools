var Handlers = {
    iframe_onResize: function() {
    	this.render();
    },
	iframe_onRender: function() {
		var cs = this.getComputedStyle();
	    this._node.childNodes[0].style.width = cs.width;
	    this._node.childNodes[0].style.height = cs.height;
    }
};


$([], {}, [
    $i("refresh", {
        onExecute: function() {
        	var scope = this.scope();
			var url = String.format("%s/%s?%d", 
				"/home", scope['@owner'].vars(["resource.uri"]), 
				Date.now());
				
			// TODO setContent without immediate update
			scope.iframe._content = String.format("<iframe src=\"%s\"></iframe>", url);
			scope.iframe.recreateNode();
		    scope.loading.show();
			
			var node = scope.iframe.getChildNode(0);
			node.onload = function() {
				scope.iframe.render();
		        scope.loading.hide();
			};
        }
    }),
    $i("ace", {visible: false}),
    $("vcl/ui/Panel", "iframe", {
        align: "client",
    	css: {
    	    "overflow": "hidden",
    	    "iframe": "position: absolute; top: 0; left: 0; bottom: 0; right: 0; width: 100%; border: none;",
    	    "transition": "all 500ms"
    	},
		onResize: Handlers.iframe_onResize,
    	onRender: Handlers.iframe_onRender
    })
]);