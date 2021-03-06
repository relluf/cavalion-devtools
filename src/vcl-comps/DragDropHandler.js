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
function copy(obj, r) {
	r = r || {};
	for(var k in obj) {
		var v = obj[k];
		if(typeof v === "object") {
			if(typeof v.length === "number") {
				v = copy(v, []);
			} else {
				v = copy(v);
			}
		}
		if(typeof v !== "function") {
			r[k] = v;
		} else if(k === "getAsString") {
			obj.getAsString(function(value) { 
				r.strValue = value; 
			});
		} else if(k === "getAsFile") {
			r.fileValue = handleFile(obj.getAsFile(), r);
			// r.fileValue.item = r;
		} else {
			r[k] = function() {};
		}
	}
	return r;
}

[("vcl/ui/Panel"), {
	onLoad: function() {
		this.setParentNode(document.body);

		var me = this, listeners;
		var dropped = this.vars("dropped", false, []);
		this.vars("listeners", listeners = {
			dragover: function(evt) {
				evt.preventDefault();
				me.setVisible(true);
			},
			dragend: function(evt) {
				me.setTimeout("dragend", function() {
					evt.preventDefault();
					me.setVisible(false);
				}, 500);
			},
			drop: function(evt) {
				var dataTransfer = copy(evt.dataTransfer);
				dropped.push(dataTransfer);
				
				me.emit("dropped", [dataTransfer, dropped]);
				
				evt.preventDefault();
				me.setVisible(false);
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
}];
