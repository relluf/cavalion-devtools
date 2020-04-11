$([], {
	
	onLoad: function() {
		alert("Hello World!");
	}
	
}, [

	$("vcl-ui/Bar", [
		$("vcl-ui/Button", { content: "Open Session"})	
	])	
	
])