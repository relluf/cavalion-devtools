$([], {
	onLoad() {
		this.setTimeout(() => { this.print(this._uri, this) }, 250);
		return this.inherited(arguments);
	}
}, []);