"use devtools/Resources, devtools/Resources-ddh, vcl/Control, util/HtmlElement";

/*-

TODO ZIP archives, register ZIP extensions

2024/09/04 Adds support for packages and 1st implemenation directories 
2024/06/22 Adds support for multiple drop-targets, via vars.targets
*/

var Control = require("vcl/Control");
var HE = require("util/HtmlElement");
var Resources = require("devtools/Resources");
var Resources_ddh = require("devtools/Resources-ddh");

// function handleFile(file, r) {
// 	r.readerResult = new Promise((resolve, reject) => {
// 		let reader = new FileReader();
		
// 		const ext = file.name.toLowerCase().split(".").pop();
// 		const zipped = Resources.isZipped(file.name, ext);
		
// 		if(file.type) r.contentType = file.type;
		
// 		if(zipped) {
// 			Promise.resolve(req("jszip")).then(JSZip => {
// 				r.zipped = true;
// 	            reader.onloadend = (e) => {
// 	                const arrayBuffer = e.target.result;
// 	                JSZip.loadAsync(arrayBuffer).then(function(zip) {
// 	                	const all = [];
	                    
// 	                    zip.forEach(function(relativePath, zipEntry) {
// 	                        all.push(zipEntry.async("string").then(content => ({
//                             	relativePath: relativePath,
//                             	zipEntry: zipEntry,
//                             	content: content
//                             })));
// 	                    });
	                	
// 	                	Promise.all(all).then(function() {
// 	                		var res = js.copy_args(arguments);
// 	                		resolve(res);
// 	                	});
// 	                });
// 	            };
// 				reader.readAsArrayBuffer(file);
// 			});
// 		} else {
// 			reader.onloadend = () => resolve(r.readerResult = reader.result);
// 			if(r.type.startsWith("image/") || r.type.endsWith("/pdf")) {
// 				reader.readAsDataURL(file);
// 			} else {
// 				reader.readAsText(file);
// 			}
// 		}
// 	});
// 	return file;
// }
// function copy(obj, r, promises) {
// 	promises = promises || [];
// 	r = r || {};
// 	for(var k in obj) {
// 		var v = obj[k];
// 		if(typeof v === "object") {
// 			if(typeof v.length === "number") {
// 				v = copy(v, [], promises);
// 			} else if(v instanceof File) {
// 				handleFile(v, v = js.mi({}, v, false));
// 			} else {
// 				v = copy(v, {}, promises);
// 			}
// 		}
// 		if(typeof v !== "function") {
// 			r[k] = v;
// 		} else if(k === "webkitGetAsEntry" || k === "getAsEntry") {
// 			r.entry = (obj[k]());
// 			r.kind = r.entry.isDirectory ? "package" : "file";
// 			promises.push(r.items = traverseFileTree(obj[k]()).then(res => r.items = res));
// 		} else if(k === "getAsString") {
// 			obj.getAsString(value => r.strValue = value);
// 		} else if(k === "getAsFile") {
// 			r.fileValue = handleFile(obj.getAsFile(), r);
// 			promises.push(r.readerResult);
// 		} else {
// 			// r[k] = function() {};
// 		}
// 	}
// 	return r;
// }
// function traverseFileTree(item, path) { 
//     path = path || "";
//     return new Promise((resolve) => {
//         if (item.isFile) {
//             // Het is een bestand, verwerk het
//             item.file(file => { 
//             	file.path = path;
//             	resolve([file]); 
//             });
//         } else if (item.isDirectory) {
//             // Het is een directory, duik erin
//             var dirReader = item.createReader();
//             dirReader.readEntries(entries => {
//                 var promises = [];
//                 for (var i = 0; i < entries.length; i++) {
//                     promises.push(traverseFileTree(entries[i], path ? path + "/" + item.name : item.name));
//                 }
//                 Promise.all(promises).then(files => resolve(files.flat()));
//             });
//         }
//     });
// }
function syncAttribute(node, name, should) {
	const exists = node.hasAttribute(name);
	if(exists && !should) {
		node.removeAttribute(name);
	} else if(!exists && should) {
		node.setAttribute(name, "");
	}
}

[("vcl/ui/Panel"), {
	css: {
		'': "pointer-events:none;background-color:rgba(45,45,45,0.5);border-radius:9px;",
		'input': 'display:none;'
	},
	onLoad: function() {
		const input = HE.fromSource('<input type="file">');
		const dropped = this.vars("dropped", []);
		let listeners;

		this.setParentNode(document.body);
		this.nodeNeeded().appendChild(input);

		this.vars("input", input);
	    input.addEventListener("change", (evt) => {
	        if (evt.target.files.length > 0) {
	    		Resources_ddh.handle_input_change(evt).then(res => {
	    			this.emit("dropped", [dataTransfer, dropped, evt]);
	    		});
            	evt.target.value = ""; // TODO HOWTO  control this "auto-clear"-feature
	        }
	    });		
		
// To optimize following "listeners"-code: https://chatgpt.com/c/5fe6cd28-ac42-4fa5-82f1-695e4d0ce10c -- Search for: Explain the following API 
// Checkout this screenshot for location in thread: ![20240907-172446-zKQjDR](https://raw.githubusercontent.com/relluf/screenshots/master/uPic/202409/20240907-172446-zKQjDR.png)

		this.vars(("listeners"), listeners = {
			dragenter: (evt) => {
				evt.preventDefault();
				this.emit("dragenter", [evt]);
			},
			dragover: (evt) => {
				this.removeVar("parentNode");
				this.emit("beforedragover", [evt]);
				
				// TODO better interface would be Object.entries(this.vars("targets")).forEach(e => { e[1].node, e[1].handlers })
				Object
					.values(this.vars("targets") || {})
					.filter(target => (evt.target === target.node || HE.hasParent(evt.target, target.node)))
					.forEach(target => {
						target.dragover && target.dragover(evt);
						this.vars("parentNode", target.node);
					});

				const vars_pn = this.vars("parentNode");
				if(vars_pn === undefined || vars_pn === evt.target || HE.hasParent(evt.target, vars_pn)) {
					if(this._parentNode !== vars_pn) {
						if(this._parentNode) HE.removeClass(this._parentNode, "dragover");
						this.setParentNode(vars_pn || null);
						if(this._parentNode) HE.addClass(this._parentNode, "dragover");
					}
					// TODO show draghandles over/around specific target
					this.clearTimeout("hide");
					this.show();
					this.emit("dragover", [evt]);
				} else {
					this.hide();
				}
				evt.preventDefault();
			},
			drop: (evt) => {
				const vars_pn = this.vars("parentNode");
				if(vars_pn === undefined || vars_pn === evt.target || HE.hasParent(evt.target, vars_pn)) {
					dropped.push(evt.dataTransfer);
					
					Resources_ddh.handle_document_drop(evt).then(resources => {
						evt.resources = resources;
						Object
							.values(this.vars("targets") || {})
							.filter(target => target.dropped && (evt.target === target.node || HE.hasParent(evt.target, target.node)))
							.forEach(target => target.dropped(evt));
						
						this.emit("dropped", [evt]);
					});
				}
				
				evt.preventDefault();
				this.hide();
			},
			dragend: (evt) => {
				evt.preventDefault();
				this.setTimeout("hide", () => this.hide(), 500);
			},
			dragleave: (evt) => {
// console.log("dragleave", evt);
				evt.preventDefault();
				if(this._parentNode) {
					HE.removeClass(this._parentNode, "dragover");
					this.setParentNode(null);
				}

				this.setTimeout("hide", () => this.hide(), 500);
				this.emit("dragleave", [evt]);
			}
		});
		
		Object.keys(listeners).forEach(name => {
			document.addEventListener(name, listeners[name]);
		});
	},
	onDestroy: function() {
		var listeners = this.vars("listeners");
		Object.keys(listeners).forEach(name => {
			document.removeEventListener(name, listeners[name]);
		});

		// this.set("onDestroy", () => document.body.removeChild(input));

	},
	align: "client", 
	enabled: true,
	visible: false,
	// content: locale("DragDropHandler.dropHereMessage") + " [" + Date.now() + "]",
}, [
	["vcl/Action", ("drop-opened-files"), {
		hotkey: "MetaCtrl+O|Alt+MetaCtrl+O",
		on(evt) { 
			const input = this.vars(["input"]);
			syncAttribute(input, "multiple", true);
			syncAttribute(input, "webkitdirectory", evt.altKey === true);
			input.click(); 
		},
		overrides: {
			isHotkeyEnabled() { return this._owner.isEnabled(); },
		}
	}]	
]];