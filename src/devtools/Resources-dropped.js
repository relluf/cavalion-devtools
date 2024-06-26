define(function(require) {

	var Hash = require("util/Hash");
	
	var allDroppedItems = () => require("vcl/Application").get()
			.qsa("devtools/DragDropHandler<>:root")
			.map(_ => _.vars("dropped") || []).flat()
			.map(_ => _.items || _.files)
			.flat();

	return {
		index: function(uris) {
			return {
				"": allDroppedItems().map((item, index) => ({
					path: js.sf("%s", index),
					name: js.get("fileValue.name", item),
					uri: js.sf("%s/%s", index, js.get("fileValue.name", item)),
					lastModified: js.get("fileValue.lastModified", item),
					size: js.get("fileValue.size", item),
					type: "File"
				}))
			};
		},
		list: function(path) {
			return Promise.resolve(
				allDroppedItems().map((item, index) => {
					return item.fileValue ? {
						path: js.sf("%s", index),
						name: js.get("fileValue.name", item),
						uri: js.sf("%s/%s", index, js.get("fileValue.name", item)),
						lastModified: js.get("fileValue.lastModified", item),
						size: js.get("fileValue.size", item),
						type: "File"
					} : {
						path: js.sf("%s", index),
						name: item.name,
						uri: js.sf("%s/%s", index, item.name),
						lastModified: item.lastModified,
						size: item.size,
						type: "File"
					};
				}));
		},
		get: function(uri) {
			var index = parseInt(uri.split("/").shift(), 10);
			var item = allDroppedItems()[index] || { readerResult: `${uri} no longer valid` };

			if((item.text || item.readerResult) instanceof Promise) {
				(item.text || item.readerResult).then(() => alert(item.text));
			}
			
			return Promise.resolve({
				path: js.up(uri),
				name: uri.split("/").pop(),
				uri: uri,
				type: "File",
				text: item.readerResult
			});
		},
		
	/** not implemented below here */
		create: function(path, resource) {
		},
		'delete': function(path) {
		},
		update: function(path, resource) {
		},
		link: function(path) {
		}

	};
});