$([], {
	
	onLoad() {
		var ace = this.down("#ace"), firstRun = false;
		ace.up().readStorage("ace", function(state) {
			firstRun = state === undefined;
		});
		this.up("vcl/ui/Tab").once("resource-loaded", () => {
			if(firstRun === true) {
				var editor = ace.getEditor();
				editor.execCommand("foldall");
			
				// TODO actually it should be the last visible fold (root fold?)
				var fold = editor.session.getAllFolds()[0];
				editor.session.expandFold(fold);
			}
		});
		return this.inherited(arguments);
	}
	
});