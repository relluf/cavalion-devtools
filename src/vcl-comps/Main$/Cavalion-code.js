function title() {
	var url = app.vars("url");
	return url.getParamValue("title") || url.getParamValue("") || "Cavalion-code";
}

$([], {
	// onLoad() { return this.inherited(arguments); }
}, [

	$i("workspaces-tabs", { _align: "top", _index: 0, _classes: "", zoom: 1 }, [
		$("vcl/ui/Element", { 
			index: 0, 
			element: "span", 
			content: js.sf("<b>%s<b> / ", title())
		})
	])	
	
]);