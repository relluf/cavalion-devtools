/* Set/Change vars.frame-src */

["Container", {
	vars: { 
		"frame-src": 'http://localhost/office-rest/action/rapportage?id=18906193&layout=profielen/WithPhotos&options.filter=18906332&options.scale=50&options.title=schaal%201%3A50&options.description=&options.footer=true&options.logo=true&options.pattern-colors=true&options.legend=true&options.meetpunt.multiple-per-column=true&options.meetpunt.avoid-break-over-column=true&options.meetpunt.coordinates=true&options.meetpunt.photos=true&options.bodemlaag.oow=true&options.bodemlaag.gi=true&options.bodemlaag.bvb=true&locale=nl_NL&1578597669369&pdf=1&test=true'
	},
	css: { iframe: "width:100%;height:100%;border:0;" },
	onRender() {
		var src = this.vars(["frame-src"]) || this.getSpecializer();
		this._node.innerHTML = js.sf("<iframe src='%s'>", src);
	},
	onLoad() {
		var owner = this;
		var parent = this.up("devtools/Editor<>:root");
		
		// if(parent && (parent = parent.down("#bottom-tabs"))) {
		// 	B.instantiate(["Input", { 
		// 		parent: parent, 
		// 		css: "border:none;display:inline-block;vertical-align:top;width:100%;",
		// 		onLoad() { 
		// 			this.setOwner(owner); 
		// 			this.setValue(owner.vars("frame-src"));
		// 		},
		// 		onKeyUp(evt) {
		// 			if(evt.keyCode === 13) {
		// 				this._owner.vars("frame-src", this.getValue());
		// 				this._owner.render();
		// 			}
		// 		}
		// 	}]);
		// }
	}
}];