["", {
	onLoad() {
		this.inherited(arguments);
		this.setTimeout(() => { this.print(this._uri, this); }, 250);
	}
}];