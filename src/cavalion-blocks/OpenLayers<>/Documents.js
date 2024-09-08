"use devtools/Resources";

var Node = require("vcl/ui/Node");
var Resources = require("devtools/Resources");

function Document_onNodesNeeded(parent) {
	var resource = this.vars("resource"), ln = this.ud("#ol-layer-needed");
	Promise.resolve(resource.text ? resource : Resources.get(resource.uri))
		.then(resource => parent.app().qsa("#ol-sources-needed")
			.execute({resource: resource}).flat()
			.forEach(source => {
				ln.execute({
					parent: parent, 
					layer: {
						name: source.get("name") || resource.name || (resource.uri||"").split("/").pop(), 
						source: source
					}
				});
			}));
}
function isResourceSupported(resource) {
	if(!resource) return false;
	
	var uri = (resource.uri || "").toLowerCase();
	return uri.endsWith(".xml")	|| uri.endsWith(".geojson") || 
			uri.endsWith(".topojson") || uri.endsWith("-itwbm.json");
}

[(""), {
	onActivate() {
	// TODO hacker-the-hack-hack
		this.down("#root-documents").update(true);
		return this.inherited(arguments);
	}
}, [
	[("#tree"), {
			css: {
				// ".{Node} .icon": "vertical-align: bottom;"	,
				".{Node} .icon": "vertical-align: top; padding-top: 2px;"	
			},
	}, [
		[("Node"), "root-documents", {
			// classes: "root-invisible", expanded: true,
			// text: js.sf("<input type='checkbox'> %s", locale("OpenLayers-documents")),
			text: locale("OpenLayers-documents"),
			expandable: true, expanded: true,
			index: 0,
			onLoad() {
				// TODO need to respect nodes that are already instantiated
				this.app().qs("devtools/DragDropHandler<> #ddh").on("dropped", (evt) => {
					const files = evt.files;

					if(this._childNodesLoaded === false) {
						return this.reloadChildNodes(() => this.setExpanded(true));
					}
					
					const parent = this, owner = this.up();
					const uris = this.getControls().map(c => c.vars("resource.uri"));
					const dropped = this.app()
						.qs("devtools/DragDropHandler<> #ddh").vars("dropped")
						.map(d => d.files)
						.flat()
						.map((f, i) => js.sf("dropped://%d/%s", i, f.name));
						
					parent.beginLoading();
					try {
						dropped.filter(uri => !uris.includes(uri))
							.map(uri => new Node({
								text: uri.split("/").pop(),
								expandable: true,
								parent: parent,
								owner: owner,
								// onNodeCreated() { this.nextTick(() => this.setExpanded(true)); },
								onNodesNeeded(parent) { 
									return parent === this && 
										Document_onNodesNeeded.apply(this, arguments); 
								},
								vars: { resource: { uri: uri, type: "File" } }
							}))
							.forEach(node => this.nextTick(() => node.childNodesNeeded()));
					} finally {
						parent.endLoading();
					}
				});
			},
			onNodeCreated() { this.setTimeout(() => this.setExpanded(false), 200); },
			onKeyDown(evt) {
				if(evt.keyCode === evt.KEY_F5) {
					this.reloadChildNodes(() => this.setExpanded(true));
				}
			},
			onNodesNeeded(parent) {
				var dropped = this.app()
					.qs("devtools/DragDropHandler<> #ddh").vars("dropped")
					.map(d => d.files)
					.flat()
					.map((f, i) => ({ 
						uri: js.sf("dropped://%d/%s", i, f.name), 
						type: "File" 
					}));

				var resources = this.vars("resources", this.app().qsa("*")
							.filter(c => isResourceSupported(c.vars("resource")))
							.filter(c => c instanceof require("vcl/ui/Tab"))
							.map(c => c.vars("resource")));
				var owner = this.up();
				
				resources = dropped.concat(resources.filter((r,i,a) => a.indexOf(r) === i));
				parent.beginLoading();
				try {
					resources.forEach(resource => new Node({
							text: resource.name || (resource.uri||"").split("/").pop(),
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
	]],
	
	["#root-layers", { classes: "root-invisible", expanded: true }]
]];