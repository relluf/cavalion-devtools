"use devtools/Resources, vcl/ui/Node, markdown, jquery";
"use strict";

var Resources = require("devtools/Resources");
var Node_ = require("vcl/ui/Node");
var markdown = require("markdown");
var jquery = require("jquery");
var locale = window.locale;

function findImages(arr, r) {
	r = r || [];
	
	arr.forEach(function(item, index) {
		if(item instanceof Array) {
			findImages(item, r);
		} else if(item === "img") {
			r.push(arr[index + 1]);
		}
	});
	
	return r;
}

var styles = {
	"": "background-color: white;",
	".vcl-ui-Tree li": "list-style-type: none;",
	".vcl-ui-Tree li img:not(:hover)": "max-width: 64px; max-height: 64px;",
	"#preview": "padding: 20px;",
	"#preview img:not(:hover)": "max-width: 90%; max-height: 800px;"
};

["Container", {
	css: styles,
	handlers: {
		loaded: function() {
			// Get all resource uris to Markdown-files (.md extensions)
			
			var all = [], uris = [];
			var images = this.scope().images, status = this.scope().status;
			var mds = this.app()
				.qsa("devtools/Workspace<>:root #editors-tabs < vcl/ui/Tab")
				.filter(_ => (_.vars(["resource.uri"]) || "").endsWith(".md"))
				.map(_ => _.vars(["resource.uri"]));
				
			this.vars("mds", mds);
				
			function tick() { 
				if(mds.length) {
					next(); 
				}
				images.setTimeout(function() { 
					// TODO this if(all.length) { ... } should not be necessay
					if(all.length) {
						images.setArray(all.sort(function(i1, i2) {
							return i1.source < i2.source ? -1 : 1;
						})); 
						// TODO this is a bug, should not be needed
						images.notifyEvent("changed");
					}
					status.setContent(String.format("%d snag.gy image%s found", 
						all.length, all.length === 1 ? "": "s"));
				}, 20);
			}
			function next() {
				var uri = mds.pop();
				Resources.get(uri).then(function(resource) {
					findImages(markdown.toHTMLTree(resource.text)).forEach(function(img) {
						if(img.src.indexOf("snag.gy") !== -1 && uris.indexOf(img.src) === -1) {
							uris.push(img.src);
							
							var id = img.src.split("/").pop();
							var path = uri.split("/"), file = path.pop();
							var details = { 
								// path: path.join("/"),
								file: uri,//file,
								// id: id, 
								source: img.src,
								date: "-"
							};
							all.push(details);
							
							// jquery.ajax(img.src).then(function(text, status, req) {
							// 	details.date = req.getAllResponseHeaders()['last-modified'];
							// 	images.setTimeout(function() { images.notifyEvent("changed"); }, 200);
							// });
						}
					});
					tick();
				}).catch(function(e) {
					tick();
				});
			}	
			tick();
		}
	}
}, [
	["vcl-data:Array", "images"],
	["vcl-ui:Node", {
		text: locale("Images.text"),
		classes: "folder seperator",
		onLoad: function() {
			var tree = this.up("devtools/Workspace<>").down("devtools/Navigator<>#tree");
			this.setParent(tree);
			this.expand();
		},
		onNodesNeeded: function(parent) {
			var app = this.app(), owner = this._owner;
				
			if(parent === this) {
				this.app().qsa("devtools/Main<> #workspaces-tabs < vcl/ui/Tab")
					.vars("workspace").forEach(function(workspace) {
						var node = new Node_(owner);
						node.setVar("workspace", workspace);
						node.setExpandable(true);
						node.setText(workspace.name);
						node.addClass("no-icon");
						node.setParent(parent);
					});
					
				return;
			}
			
			var workspace = parent.vars("workspace");
			var resource = parent.vars("resource");
			var tab = parent.vars("tab");
			if(workspace) {
				this.app()
					.qsa(String.format(
						"devtools/Workspace<%s>:root #editors-tabs < vcl/ui/Tab", 
						workspace.name))
					.filter(_ => (_.vars(["resource.uri"]) || "").endsWith(".md"))
					.forEach(function(tab) {
						var node = new Node_(owner);
						node.setVars({"resource": tab.vars(["resource"]), "tab": tab });
						node.setExpandable(true);
						
						var uri = tab.vars(["resource.uri"]).split("/");
						node.setText(String.format("<b>%s</b> - %s", uri.pop(), uri.join("/")));
						node.addClass("no-icon");
						node.setParent(parent);
					});
			} else if(resource && tab) {
				Resources.get(resource.uri).then(function(resp) {
					resource.cached = resp.cached;
					findImages(markdown.toHTMLTree(resp.text)).forEach(function(img) {
						var node = new Node_(owner);
						node.setText(img.src);
						node.vars("src", img.src);
						node.setExpandable(true);
						node.addClass("no-icon");
						node.setParent(parent);
					});
				});
			} else {
				parent._nodes.container.innerHTML = String.format(
						"<li><img src='%s'></li>", parent.vars("src"));
			}
		}
	}],
	["vcl-ui:Panel", "status", { autoSize: "height", align: "top" }],
	["Container", { align: "left", width: 500 }, [
		["Bar", [
			["vcl-ui:Input", "search", { placeholder: locale("Search.placeholder") }],
			["vcl-ui:Element", "status"]
		]],
		["vcl-ui:List", {
			autoColumns: true,
			source: "images",
			onSelectionChange: function() {
				this.scope().preview.setContent(this.getSelection(true).map(function(entry) {
					return String.format("<img src='%s'>", entry.source);
				}).join(""));
			}
		}],
	]],
	["Container", "preview", { align: "client" }]
	
]];
