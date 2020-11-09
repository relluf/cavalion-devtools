"use devtools/Resources, vcl/ui/Node, markdown, jquery";
"use strict";

var Resources = require("devtools/Resources");
var Node_ = require("vcl/ui/Node");
var markdown = require("markdown");
var jquery = require("jquery");
var j$ = window.j$;
var locale = window.locale;

function isContentItem(item) {
	return ["img"].indexOf(item) === -1;
}
function isDateMarker(arr) {
	var content;
	if(arr instanceof Array && typeof arr[0] === "string" && arr[0].charAt(0) === "h") {
		content = getContent(arr);
	} else {
		content = "" + arr;
	}
	var date = content.match(/\d+-|\d\d/g);
	date = date && date.splice(0, 3).join("");
	if(date && date.length === 10 && date.split("-").length === 3) {
		return date;
	}
	return false;
}
function getContent(arr) {
	var content = [];
	if(isContentItem(arr[0])) {
		// j$[6].print(arr);
		for(var i = 1; i < arr.length; ++i) {
			if(arr[i] instanceof Array) {
				content.push(getContent(arr[i]));
			} else {//if(typeof arr[i] === "string") {
				content.push(arr[i]);
			}
		}
		return content.join("");
	}
	return "";
}
function getPosts(arr, posts) {
	if(!posts) { posts = []; posts.level = 0; }

	var post, date, dt;
	arr.forEach(function(item, index) {
		if(item === "html") return;
		
		// Recognize date marker
		if((dt = isDateMarker(item)) !== false) {
			if(date !== undefined && post === undefined) {
				// j$[6].print(date + " - " + arr[index - 1]);
				post = {date: date, h: -1, nodes: [arr[index - 1]]};
			}
			
			if(post !== undefined) {
				posts.push(post);
				post = undefined;
			}
			date = dt;
		} else {
			// Check for Post
			if(item instanceof Array && typeof item[0] === "string" && item[0].charAt(0) === "h") {
				var h = parseInt(item[0].substring(1), 10);
				if(post !== undefined && h <= post.h) {
					posts.push(post);
					post = {date: date, h: h, nodes: [item]};
				} else if(post === undefined) {
					post = {date: date, h: h, nodes: [item]};
				}
			} else if(post === undefined) {
				post = {date: date, h: -1, nodes: [["h2", date], item]};
			} else {
				post.nodes.push(item);
			}
		}
	});
	if(post) posts.push(post);
	
	return posts;
}

["Container", { 
	css: {
		"": "background-color: white;",
		".vcl-ui-Tree li": "list-style-type: none;",
		".vcl-ui-Tree li img:not(:hover)": "max-width: 64px; max-height: 64px;",
		"#preview": "border-left: 1px solid silver; background-color: #f9f9f9; padding: 20px;",
		"#preview img:not(:hover)": "max-width: 90%; max-height: 800px;"
	}, 
	handlers: {
	    onDispatchChildEvent(component, name, evt, f, args) {
	        if (name.indexOf("key") === 0) {
	            var scope = this.scope();
				if (component === scope['search-input']) {
	                if ([13, 27, 33, 34, 38, 40].indexOf(evt.keyCode) !== -1) {
	                    var list = scope.list;
	                    if(evt.keyCode === 13 && list.getSelection().length === 0 && list.getCount()) {
	                        list.setSelection([0]);
	                    } else if(evt.keyCode === 27) {
			                scope['search-input'].setValue("");
			                scope['search-input'].fire("onChange", [true]); // FIXME
	                    }
	
                        list.dispatch(name, evt);
	                    evt.preventDefault();
	                }
	            }
	        }
	        // return this.inherited(arguments);
	    },
		"#posts onFilterObject": function(obj) {
			var q = this.udown("#search-input").getInputValue().toLowerCase();
			if(q === "") return false;
			
			// var text = obj._text || (obj._text = JSON.stringify(obj).toLowerCase());
			var text = JSON.stringify(obj).toLowerCase();
			return !q.split(" ").every(function(term) {
				return text.includes(term);
			});
		},
		"#search-input onKeyDown": function() {
		},
		"#search-input onChange": function() {
			var posts = this.scope().posts;
			this.setTimeout(function() { posts.updateFilter(); }, 500);
		},
		"loaded": function() {
			// Get all resource uris to Markdown-files (.md extensions)
			
			var all = [], uris = [];
			var posts = this.scope().posts, status = this.scope().status;
			var mds = this.app()
				.qsa("devtools/Workspace<>:root #editors-tabs < vcl/ui/Tab")
				.filter(_ => (_.vars(["resource.uri"]) || "").endsWith(".md"))
				.map(_ => _.vars(["resource.uri"]));
				
			this.vars("mds", mds);
				
			function tick() { 
				if(mds.length) {
					next(); 
				}
				posts.setTimeout(function() { 
					// TODO this if(all.length) { ... } should not be necessay
// posts.print("updating after timeout");
					if(all.length) {
						all.sort(function(i1, i2) {
							if(i1.date === undefined) return 1;
							if(i2.date === undefined) return -1;
							return i1.date > i2.date ? -1 : 1;
						});
						console.log("setting posts...", all.map(_ => _.date));
						posts.setArray(all); 
						// TODO this is a bug, should not be needed
						posts.notifyEvent("changed");
					}
					status.setContent(String.format("%d post%s found", all.length, all.length === 1 ? "": "s"));
				}, 200);
			}
			function next() {
				var uri = mds.pop();
				Resources.get(uri).then(function(resource) {
					getPosts(markdown.toHTMLTree(resource.text)).forEach(function(post) {
						post.file = uri.split("/").pop();
						post.uri = uri;
						post.date_ = typeof post.date;
						all.push(post);
					});
					tick();
				}).catch(function(e) {
					tick();
				});
			}	
			tick();
		},
	}
}, [
	["vcl-data:Array", "posts"],
	["vcl-ui:Node", (""), {
		textReflects: "textContent",
		text: js.sf("%H", "devtools/Editor<md> #posts"),
		classes: "folder seperator",
		onLoad() {
			var tree = this.up("devtools/Workspace<>").down("devtools/Navigator<>#tree");
			this.setParent(tree);
			this.expand();
		},
		onNodesNeeded(parent) {
			var app = this.app(), owner = this._owner;
				
			if(parent === this) {
				this.app().qsa("devtools/Main<> #workspaces-tabs < vcl/ui/Tab")
					.vars("workspace").forEach(function(workspace) {
						var node = new Node_(owner);
						node.setVar("workspace", workspace);
						node.setClasses("folder");
						node.setExpandable(true);
						node.setText(workspace.name);
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
						"devtools/Workspace<%s>:root #editors-tabs < vcl/ui/Tab", workspace.name))
					.filter(_ => _.vars(["resource.uri"]).endsWith(".md"))
					.forEach(function(tab) {
						var node = new Node_(owner);
						node.setVars({"resource": tab.vars(["resource"]), "tab": tab });
						node.setExpandable(true);
						node.setClasses("file");
						
						var uri = tab.vars(["resource.uri"]).split("/");
						node.setText(String.format("<b>%s</b> - %s", uri.pop(), uri.join("/")));
						node.setParent(parent);
					});
			} else if(resource && tab) {
				Resources.get(resource.uri).then(function(resp) {
					resource.cached = resp.cached;
					getPosts(markdown.toHTMLTree(resp.text)).forEach(function(post) {
						var node = new Node_(owner);
						node.setText(post.date);
						node.setClasses("no-icon");
						node.vars("post", post);
						node.setExpandable(true);
						node.setParent(parent);
					});
				});
			} else {
				var post = parent.vars("post");
				post.render = post.render || 
						markdown.renderJsonML(["p"].concat(post.nodes));
				parent._nodes.container.innerHTML = post.render;
			}
		}
	}],
	
	["Container", (""), { align: "left", width: 275 }, [
		["Bar", ("bar"), [
			["vcl-ui:Input", "search-input", { placeholder: locale("Search.placeholder") }],
			["vcl-ui:Element", "status"]
		]],
		
		["vcl-ui:List", ("list"), {
			autoColumns: true,
			source: "posts",
			onDblClick() {
				var selection = this.getSelection(true), ws = this.up("devtools/Workspace<>:root");
				this.print(this.getUri(), selection.length === 1 ? selection[0] : selection);
				selection.forEach(_ => ws.open(_.uri));
			},
			onSelectionChange: function() {
				this.scope().preview.setContent(this.getSelection(true)
					.map(function(entry) {
						return (entry.render = entry.render || 
							(markdown.renderJsonML(["p"].concat(
								JSON.parse(JSON.stringify(entry.nodes))))));
					}).join(""));
			}
		}]
	]],
	["Container", "preview", { align: "client" }]
	
]];