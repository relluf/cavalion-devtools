["", {}, [
    [("#refresh"), {
        on() {
            var scope = this.scope(), uri = this.vars(["resource.uri"]);
            var node = scope.image.nodeNeeded();

            if(uri.startsWith("dropped://")) {
            	var dropped = this.app()
            		.down("devtools/DragDropHandler<>")
            		.vars("dropped")
            		[parseInt(uri.split("/")[2], 10)]
            		.items[0];

            	scope.image.setContent(js.sf("<img src='%s'>", dropped.readerResult));
            } else {
	            scope.image.setContent(js.sf("<img src='%s/%s?%d&file') no-repeat 50%%,50%%", 
	                    "/home", uri, Date.now()));
            }
        }
    }],
    [("#ace"), {visible: false}],
    ["vcl/ui/Panel", ("image"), {align: "client"}]
]];