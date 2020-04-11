function handleFile(file) {
	let reader = new FileReader();
	reader.onloadend = function() {
		var result = reader.result;
		console.log(this, reader, this===reader);
		r.readerResult = result;
		debugger;
	};
	// reader.readAsDataURL(file);
	reader.readAsText(file);
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
		} else {
			r[k] = function() {};
		}
	}
	return r;
}

$("vcl/ui/Panel", {
	onLoad: function() {
		this.setParentNode(document.body);

		var me = this, listeners;
		var dropped = this.vars("dropped", false, []);
		this.vars("listeners", listeners = {
			dragover: function(evt) {
				evt.preventDefault();
				me.setVisible(true);
			},
			dragleave: function(evt) {
				evt.preventDefault();
				me.setVisible(false);
			},
			drop: function(evt) {
				var dataTransfer = copy(evt.dataTransfer);
				dropped.push(dataTransfer);
				
				console.log("dropped-so-far", dropped);
				
				evt.preventDefault();
				me.setVisible(false);
			}
		});
		
		document.addEventListener("dragover", listeners.dragover);
		document.addEventListener("dragleave", listeners.dragleave);
		document.addEventListener("drop", listeners.drop);
	},
	onDestroy: function() {
		var listeners = this.vars("listeners");
		document.removeEventListener("dragover", listeners.dragover);
		document.removeEventListener("dragleave", listeners.dragleave);
		document.removeEventListener("drop", listeners.drop);
	},
	align: "client",
	css: "background-color:rgba(45,45,45,0.8);z-index:9999999999; color:white;padding:64px; font-family:\"Lucida Grande\", Arial, sans-serif;",
	content: locale("DragDropHandler.dropHereMessage") + " [" + Date.now() + "]",
	visible: false
});