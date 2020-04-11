define(function(require) {

	var $ = require("jquery");
	var js = require("js");
	
	var BASE_URL = "/fs/";

	function promise(request) {
		return Promise.resolve(request);
	}
	function adjust(uri) {
		if(uri.charAt(0) === "/") uri = uri.substring(1);
		return BASE_URL + (window.escape(uri) || "");
	}

	return {
		index: function(uris) {
			return promise($.ajax(adjust("") + "?index&uris=" + window.escape(uris.join(";"))))
				.then(function(res) {
					/*- TODO Current devtools/Navigator expects weird structure/processing */
					var dirs = {}, files = {};
					for(var path in res) {
						(res[path] instanceof Array) && res[path].forEach(function(item) {
							var item_path = ("" + item.path).split("/");
							var dir, name = item_path.pop();
							
							item_path.unshift(path);
							dir = item_path.join("/");
							if(!dirs.hasOwnProperty(dir)) {
								dirs[dir] = [];
							}
							
							item_path = dir + "/" + name;
							
							if(!files[item_path]) {
								dirs[dir].push(files[item_path] = js.mixIn(
										item, {name: name, uri: dir + "/" + name}));
							} else {
								// console.log("duplicate", item.path)
							}
						});
					}

					// console.log("files", files);
					
					return dirs;
				})
				.catch(function(err) {
					// TODO alert(err.message);
				});
		},
		list: function(uri) {
			if(typeof uri === "string" && uri !== "/" && uri.charAt(uri.length - 1) !== "/") {
				uri += "/";
			}
			return promise($.ajax(adjust(uri))).then(function(res) {
					var arr = [];
					for(var k in res) {
						var resource = res[k];
						arr.push({
							uri: uri.substring(uri.charAt(0) === "/" ? 1 : 0) + k, modified: resource.mtime,
							created: resource.ctime, added: resource.atime,
							link: resource.link, size: resource.size, name: k, 
							type: resource.type
						});
					}
					return arr;
				});
		},
		get: function(uri) {
			return promise($.ajax(adjust(uri)).then(function(res) {
					return res;	
				}));
		},
		create: function(uri, resource) {
			return promise($.ajax(adjust(uri), {
				method: "POST",
				contentType: "application/json",
				data: JSON.stringify({
					"text": resource.text,
					"revision": resource.revision,
					"position": 0
				})
			}));
		},
		'delete': function(uri) {
		    return promise($.ajax(adjust(uri), {
		        method: "DELETE"
		    }));
		},
		update: function(uri, resource) {
			return promise($.ajax(adjust(uri), {
				method: "PUT",
				contentType: "application/json",
				data: JSON.stringify({
					"text": resource.text,
					"revision": resource.revision,
					"position": 0
				})
			}));
		}
	};

});