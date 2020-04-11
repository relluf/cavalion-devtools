$([], {
	
	onKeyUp: function(e) {
		console.log(e);	
	},
	
    onActivate: function() {
    	
    	this.scope("vcl/ui/Tab[selected=true]").each(function(tab) {
			tab.getControl().setFocus();
    	});
    	
        return this.inherited(arguments);
    }

}, [
	$("vcl/ui/Bar", {align:"bottom", classes: "bottom"}, [
		$("vcl/ui/Tabs", "editors-tabs", {classes: "bottom"}, [
			$("vcl/ui/Tab", {content: ".less", 	control: "ace-less"}),
			$("vcl/ui/Tab", {content: ".js", 	control: "ace-js"}),
			$("vcl/ui/Tab", {content: ".html", 	control: "ace-html"}),
			$("vcl/ui/Tab", {content: ".page", 	control: "ace", selected: true})
		])
	]),
	
    $("vcl/ui/Ace", "ace-less"),
    $("vcl/ui/Ace", "ace-js"),
    $("vcl/ui/Ace", "ace-html")
	
]);