/*-

2024/09/04	Dragging and dropping PDF files doesn't work in cavalion-code yet, however it does work in veldoffice-vcl-comps
	- need some more abstract way of dealing with devtools/Resources
	- maybe devtools/Resources should have an understanding type
	- or a level above
	
*/

define(function(require) {
	const Hash = require("util/Hash");
	const Mapper = (item, index) => {
		return item.kind === "package" || item.zipped ? ({
			path: js.sf("%s", index),
			name: js.get("fileValue.name", item),
			lastModified: js.get("fileValue.lastModified", item),
			size: js.get("fileValue.size", item),
			contents: item.items,
			type: item.kind === "package" ? "Folder" : req("devtools/Resources").isPackage(item.fileValue.name) ? "Folder" : "File"
		}) : item.fileValue ? ({
			path: js.sf("%s", index),
			name: js.get("fileValue.name", item),
			lastModified: js.get("fileValue.lastModified", item),
			size: js.get("fileValue.size", item),
			type: "File"
		}) : item instanceof File ? ({
			path: item.path,
			name: item.name,
			lastModified: item.lastModified,
			size: item.size,
			type: "File"
		}) : js.mi({}, item);
	};
	const getFolders = (items, index) => {
		// TODO cache result, ie. only rebuild when necessary (VA-20240904-1-DragDropHandler)

		const folders = {};
		return Promise.resolve(items[index].items)
			.then(items => {
				items.forEach(item => (folders[item.path] = (folders[item.path] || [])).push(item));

				Object.keys(folders).map(path => path.split("/")).filter(path => path.length > 1)
					.forEach(path => {
						const name = path.pop();
						path = path.join("/");
						
						if(folders[path]) {
							folders[path].push({
								path: path, name: name, type: "Folder",
								uri: js.sf("%s/%s", path, name)
							});
						} else {
							console.warn("TODO this is unexpected at this point");
						}
					});
		
				return folders;
			});
	};

	let allDroppedItems = () => {
		const app = require("vcl/Application").get();
		return []
			.concat(Array.from(app.qsa("devtools/DragDropHandler<>:root")))
			.concat(Array.from(app.qsa("DragDropHandler<>:root")))
			.concat(Array.from(app.qsa("#ddh")))
			.filter(Array.fn.unique)
			.map(_ => _.vars("dropped") || []).flat()
			.map(_ => _.items || _.files || [])
			.flat();
	};

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
		list: function(path, opts) {
			const items = allDroppedItems();
			const index = parseInt((path = path.split("/")).shift(), 10);

			if(isNaN(index)) {
				return Promise.resolve(items.map(Mapper).map(item => {
					item.uri = js.sf("%s/%s", item.path, item.name);
					return item;
				}));
			} 
			
			return Promise.resolve(items[index].readerResult || items[index].items).then(res => {
				if(res instanceof Array) {
					// TODO fix this
					var itemz = (res[0].map ? res[0] : res);
					return Promise.resolve(itemz.map(item => item instanceof File ? ({
						name: item.name,
						path: path.join("/"),
						type: "File",
						uri: js.sf("%s/%s/%s", index, path, item.name),
					}) : ({
						// text: item.content,
						name: item.zipEntry.name,
						path: path.join("/"),
						type: item.zipEntry.dir ? "Folder" : "File",
						uri: js.sf("%s/%s/%s", index, path, item.zipEntry.name),
					})));
				}
				
				return getFolders(items, index).then(folders => {
					const folder = folders[path.join("/")];
					return Promise.resolve(folder).map(Mapper).map(item => {
						item.uri = js.sf("%s/%s/%s", index, item.path, item.name);
						return item;
					});
				});
			});
			
		},
		get: function(uri) {
			const Resources = req("devtools/Resources");

			const index = parseInt(uri.split("/").shift(), 10);
			const items = allDroppedItems();
			const item = items[index] || { readerResult: `${uri} no longer valid` };
			
			const handleR = (uri, text) => text instanceof Array ? ({
					path: js.up(uri),
					name: uri.split("/").pop(),
					uri: uri,
					type: "File",
					text: js.get("0.0.content", text)
				}) : ({
					path: js.up(uri),
					name: uri.split("/").pop(),
					uri: uri,
					type: "File",
					text: text
				});
			
			if(item.kind === "package" || item.zipped) {
				let path = uri.split("/");
				let name = path.pop();
				path = path.join("/");

				if(item.readerResult instanceof Promise) {
					return item.readerResult.then(res => handleR(uri, res));
				} else {
					let folder = getFolders(items, index)[path.substring(2)] || [];
					let entry = folder.find(item => item.name === name);
					if(entry && typeof entry.text === "function") {
						return entry.text().then(text => ({
							path: js.up(uri),
							name: uri.split("/").pop(),
							uri: uri,
							type: Resources.isPackage(entry.name) ? "Package" : "File",
							text: text
						}));
					}
				}

				return Promise.resolve({uri: uri, text: "not a valid resource"});
			}

			if((item.text || item.readerResult) instanceof Promise) {
				// no problem, but why wasn't this case anticipated for (@20240623)
				return Promise.resolve(item.text || item.readerResult)
					.then(text => handleR(uri, text));
			}
			
			return Promise.resolve({
				path: js.up(uri),
				name: uri.split("/").pop(),
				uri: uri,
				type: "File",
				text: item.readerResult
			});
		},
		
		set_allDroppedItems: function(impl) { allDroppedItems = impl; },
		allDroppedItems: () => allDroppedItems(),
		
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