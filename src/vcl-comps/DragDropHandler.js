"use util/HtmlElement";

var HE = require("util/HtmlElement");

function handleFile(file, r) {
	let reader = new FileReader();
	reader.onloadend = function() {
		var result = reader.result;
		// console.log(this, reader, this===reader);
		r.readerResult = result;
		// debugger;
	};
	if(r.type.startsWith("image/")) {
		reader.readAsDataURL(file);
	} else {
		reader.readAsText(file);
	}
	return file;
}
function copy(obj, r, promises) {
	r = r || {};
	promises = promises || [];
	
	for(var k in obj) {
		var v = obj[k];
		if(typeof v === "object") {
			if(typeof v.length === "number") {
				v = copy(v, [], promises);
			} else {
				v = copy(v);//, {}, promises);
			}
		}
		if(typeof v !== "function") {
			r[k] = v;
		} else if(k === "getAsString") {
			promises.push(obj.getAsString(value => r.strValue = value));
		} else if(k === "getAsFile") {
			r.fileValue = handleFile(obj.getAsFile(), r, promises); // TODO handle with promises
		} else if(k === "text" && typeof v === "function") {
			promises.push(r.text = obj.text().then(res => r.text = r.readerResult = res));
		} else {
			r[k] = function() {};
		}
	}
	return r;
}
function traverseFileTree(item, path) {
    path = path || "";
    return new Promise((resolve) => {
        if (item.isFile) {
            // Het is een bestand, verwerk het
            item.file(file => {
                resolve([file]);
            });
        } else if (item.isDirectory) {
            // Het is een directory, duik erin
            var dirReader = item.createReader();
            dirReader.readEntries(entries => {
                var promises = [];
                for (var i = 0; i < entries.length; i++) {
                    promises.push(traverseFileTree(entries[i], path + item.name + "/"));
                }
                Promise.all(promises).then(files => {
                    resolve(files.flat());
                });
            });
        }
    });
}


[("vcl/ui/Panel"), {
	css: { 'input': "display:none;" },
	onLoad: function() {
		this.setParentNode(document.body);

		const input = HE.fromSource('<input type="file" multiple webkitdirectory>');
		this.nodeNeeded().appendChild(input);
		
		this.set("onDestroy", () => document.body.removeChild(input));
		this.vars("input", input);
		
		const dropped = this.vars("dropped", false, []);
		
	    input.addEventListener("change", (evt) => {
	        if (evt.target.files.length > 0) {
	            // var file = evt.target.files[0];
	            const p = [], dataTransfer = copy({ files: evt.target.files }, false, p);
	            Promise.all(p).then(() => {
		            dropped.push(dataTransfer);
					// this.emit("dropped", [dataTransfer, dropped]);
					this.nextTick(() => this.emit("dropped", [dataTransfer, dropped])); // TODO
	            });
	        }
	    });		

		var listeners;
		this.vars("listeners", listeners = {
			dragover: (evt) => {
				evt.preventDefault();
				this.setVisible(true);
			},
			dragend: (evt) => {
				this.setTimeout("dragend", () => {
					evt.preventDefault();
					this.setVisible(false);
				}, 500);
			},
			drop: (evt) => {
			    evt.preventDefault();
			    this.setVisible(false);
			
			    var items = Array.from(evt.dataTransfer.items);
				Promise.all(items.map(itemEntry => {
				        var item = itemEntry.webkitGetAsEntry();
				        if (item) {
				            return traverseFileTree(item);
				        }
				        return null;
				    })
				    .filter(Boolean))
				    .then(files => {
					    files = files.flat();
					    files.forEach(file => {
					        var dataTransfer = copy({ files: [file] });
					        dropped.push(dataTransfer);
					        this.emit("dropped", [dataTransfer, dropped]);
					    });
					});
			},
			drop_: (evt) => {
				const p = [], dataTransfer = copy(evt.dataTransfer, false, p);
				Promise.all(p).then(() => {
					dropped.push(dataTransfer);
					// this.emit("dropped", [dataTransfer, dropped]);
					this.nextTick(() => this.emit("dropped", [dataTransfer, dropped])); // TODO
					this.setVisible(false);
				});
				
				evt.preventDefault();
			}
		});
		
		document.addEventListener("dragover", listeners.dragover);
		document.addEventListener("dragend", listeners.dragend);
		document.addEventListener("drop", listeners.drop);
	},
	onDestroy: function() {
		var listeners = this.vars("listeners");
		document.removeEventListener("dragover", listeners.dragover);
		document.removeEventListener("dragend", listeners.dragend);
		document.removeEventListener("drop", listeners.drop);
	},
	align: "client",
	css: "background-color:rgba(45,45,45,0.8);z-index:9999999999; color:white;padding:64px; font-family:\"Lucida Grande\", Arial, sans-serif;",
	content: locale("DragDropHandler.dropHereMessage") + " [" + Date.now() + "]",
	visible: false
}, [

	["vcl/Action", ("drop-opened-files"), {
		hotkey: "MetaCtrl+O",
		on() { this.vars(["input"]).click(); },
		overrides: {
			isHotkeyEnabled() { return true; },
		}
	}]	
	
]];
