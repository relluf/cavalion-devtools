"use devtools/Resources";

var Node = require("vcl/ui/Node");
var Resources = require("devtools/Resources");

function Document_onNodesNeeded(parent) {
	var resource = this.vars("resource"), ln = this.ud("#layer-needed");
	Promise.resolve(resource.text ? resource : Resources.get(resource.uri))
		.then(resource => parent.app().qsa("#ol-sources-needed")
			.execute({resource: resource}).flat()
			.forEach(source => ln.execute({
				parent: parent, 
				layer: {
					name: source.get("name") || resource.name || resource.uri, 
					source: source
				}
			})));
}
function isResourceSupported(resource) {
	if(!resource) return false;
	
	var uri = (resource.uri || "").toLowerCase();
	return uri.endsWith(".xml")	|| uri.endsWith(".geojson") || 
			uri.endsWith(".topojson") || uri.endsWith("-itwbm.json");
}

["", {
	onActivate() {
	// TODO hacker-the-hack-hack
		this.down("#root-documents").update(true);
		return this.inherited(arguments);
	}
}, [
	[("#tree"), {}, [
		[("Node"), "root-documents", {
			text: "Documents",
			expandable: true,
			index: 0,
			onKeyDown(evt) {
				if(evt.keyCode === evt.KEY_F5) {
					this.reloadChildNodes();	
				}
			},
			onNodesNeeded(parent) {
				var resources = this.vars("resources", this.app().qsa("*")
							.filter(c => isResourceSupported(c.vars("resource")))
							.filter(c => c instanceof require("vcl/ui/Tab"))
							.map(c => c.vars("resource")));
				var owner = this.up();
				
				resources = resources.filter((r,i,a) => a.indexOf(r) === i);
				parent.beginLoading();
				try {
					resources.forEach(resource => new Node({
							text: resource.name || resource.uri,
							// text: js.sf("<input type='checkbox'>%H", resource.name || resource.uri),
							type: "File",
							expandable: true,
							parent: parent,
							owner: owner,
							onNodesNeeded: function(parent) { 
								return parent === this && 
									Document_onNodesNeeded.apply(this, arguments); 
							},
							vars: { resource: resource }
						}));
				} finally {
					parent.endLoading();
				}
			}
		}] // devtools-resources
	]]
]];