function title() {
	var url = app.vars("url");
	return url.getParamValue("title") || url.getParamValue("") || "Cavalion-code";
}

$([], {
	// onLoad() { return this.inherited(arguments); }
}, [

	$i("workspaces-tabs", { _align: "top", _index: 0, _classes: "", zoom: 1 })	
	
]);