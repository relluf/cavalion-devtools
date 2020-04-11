$([], {
	onLoad() {
		this.setTimeout(() => { this.app().qsa("vcl/ui/Console").print(this, "loaded appsy! - " + this._uri) }, 250);
		return this.inherited(arguments);
	}
}, []);