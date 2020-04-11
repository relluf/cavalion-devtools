$([], {}, [
    $i("refresh", {
        onExecute: function() {
            var scope = this.getScope();
            var node = scope.image.getNode();
            node.style.background = 
                String.format("url(%s/%s?%d&file) no-repeat 50%%,50%%", 
                    "/home",
                    this.getVar("resource.uri", true), 
                    Date.now());
        }
    }),
    $i("ace", {visible: false}),
    $("vcl/ui/Panel", "image", {align: "client"})
]);