"use vcl/Component";

var keysByUri = require("vcl/Component").getKeysByUri;

["", {

	onLoad() {
		var keys = keysByUri(this._uri);
		if(keys.specializer !== "code" || keys.specializer_classes.length > 0) {
			return;
		}
// console.log(this._uri, keys(this._uri).specializer_classes.length);
		this.app().open("devtools/Workspace<code/build>", { selected: false });
		this.app().open("devtools/Workspace<code/apps>", { selected: false });
	}
	
}, []];