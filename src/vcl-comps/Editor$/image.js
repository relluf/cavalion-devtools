var allDroppedItems = () => require("vcl/Application").get()
		.qsa("devtools/DragDropHandler<>")
		.map(_ => _.vars("dropped")).flat()
		.map(_ => _.items)
		.flat();
		
["", {}, [
    [("#refresh"), {
        on() {
            var scope = this.scope(), uri = this.vars(["resource.uri"]);
            var node = scope.image.nodeNeeded();

            if(uri.startsWith("dropped://")) {
            	var dropped = allDroppedItems()[parseInt(uri.split("/")[2], 10)];
            	scope.image.setContent(js.sf("<img src='%s'>", dropped.readerResult));
            } else {
	            scope.image.setContent(js.sf("<img src='%s/%s?%d&file'>", 
	                    "/home", uri, Date.now()));
            }
        }
    }],
    [("#ace"), { visible: false, readOnly: true }], // base64?
    ["vcl/ui/Panel", ("image"), { align: "client", css: "text-align:center;" }]
]];