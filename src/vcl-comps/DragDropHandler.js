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
	css: {
		'': "background-color:rgba(45,45,45,0.8);z-index:9999999999; color:white;padding:64px; font-family:\"Lucida Grande\", Arial, sans-serif;",
		'input': "display:none;"
	},
	onLoad: function() {
		const input = HE.fromSource('<input type="file" multiple webkitdirectory>');
		const dropped = this.vars("dropped", []);

		this.setParentNode(document.body);
		this.nodeNeeded().appendChild(input);

		this.vars("input", input);
	    input.addEventListener("change", (evt) => {
	        if (evt.target.files.length > 0) {
	            // var file = evt.target.files[0];
	            const p = [], dataTransfer = copy({ files: evt.target.files }, false, p);
	            Promise.all(p).then(() => {
		            dropped.push(dataTransfer);
					// this.emit("dropped", [dataTransfer, dropped]);
					this.nextTick(() => this.emit("dropped", [dataTransfer, dropped])); // TODO
					this.print("dropped", dataTransfer);
	            });
	        }
	    });		
		
		this.vars("listeners", listeners = {
			dragover: (evt) => {
				if(this.isEnabled()) {
					evt.preventDefault();
					this.clearTimeout("hide");
					this.show();
				}
			},
			dragend: (evt) => {
				if(this.isEnabled()) {
					evt.preventDefault();
					this.setTimeout("hide", () => this.hide(), 500);
				}
			},
			drop: (evt) => {
				if(this.isEnabled()) {
					var dataTransfer = copy(evt.dataTransfer);
					dropped.push(dataTransfer);
					
					this.emit("before-dropped", [dataTransfer, dropped]);
	
					Promise.all(dataTransfer.items.map(item => Promise.resolve(item.readerResult)))
						.then(res => this.emit("dropped", [dataTransfer, dropped]))
						.then(res => this.emit("after-dropped", [dataTransfer, dropped]));
	
					evt.preventDefault();
					this.hide();
				}
			},
			dragleave: (evt) => {
				if(this.isEnabled()) {
					evt.preventDefault();
					this.setTimeout("hide", () => this.hide(), 500);
				}
			}
		});

		document.addEventListener("dragover", listeners.dragover);
		document.addEventListener("dragend", listeners.dragend);
		document.addEventListener("drop", listeners.drop);
		document.addEventListener("dragleave", listeners.dragleave);
	},
	onDestroy: function() {
		var listeners = this.vars("listeners");

		// this.set("onDestroy", () => document.body.removeChild(input));

		document.removeEventListener("dragover", listeners.dragover);
		document.removeEventListener("dragend", listeners.dragend);
		document.removeEventListener("drop", listeners.drop);
		document.removeEventListener("dragleave", listeners.dragleave);
	},
	align: "client",
	// content: locale("DragDropHandler.dropHereMessage") + " [" + Date.now() + "]",
	visible: false
}, [
	["vcl/Action", ("drop-opened-files"), {
		hotkey: "MetaCtrl+O|Alt+MetaCtrl+O",
		on(evt) { 
			const input = this.vars(["input"]) || this.up().qsn("input");
			input.webkitdirectory = evt.altKey;
			input.click(); 
		},
		overrides: {
			isHotkeyEnabled() { return this._owner.isEnabled(); },
		}
	}]	
]];
