define(function(require) {

	const js = require("js");
	const BASE_URL = "/fs/";
	
	function adjust(uri) {
		if(uri.charAt(0) === "/") uri = uri.substring(1);
		return BASE_URL + (window.escape(uri) || "");
	}
	function request(urlOrOpts, opts = {}) {
	    let url, options;
	
	    // Check if the first parameter is a string (URL) or an options object
	    if (typeof urlOrOpts === 'string') {
	        url = urlOrOpts;
	        options = opts;
	    } else {
	        url = urlOrOpts.url;
	        options = urlOrOpts;
	    }
	
	    // Set defaults and destructure options
	    const { method = 'GET', data = null, headers = {} } = options;
	
	    return fetch(url, {
	        method,
	        headers: js.mi({ 'Content-Type': 'application/json' }, headers),
	        body: data ? JSON.stringify(data) : null
	    }).then(response => {
	    	if(opts.method === "DELETE") return response;
	    	
	        if (!response.ok) {
	        	throw response;
	        }
	        return response.json();
	    });
	}

	return {
		index: function(uris) {
			return (request(adjust("") + "?index&uris=" + window.escape(uris.join(";"))))
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
			return (request(adjust(uri))).then(function(res) {
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
			return (request(adjust(uri)).then(function(res) {
					return js.mixIn({
						name: uri.split("/").pop(),
						uri: uri,
						type: "File",
					}, res);
				}));
		},
		create: function(uri, resource) {
			return request(adjust(uri), {
				method: "POST",
				contentType: "application/json",
				data: ({
					"text": resource.text,
					"revision": resource.revision,
					"position": 0
				})
			});
		},
		'delete': function(uri) {
		    return request(adjust(uri), { method: "DELETE" });
		},
		update: function(uri, resource) {
			return (request(adjust(uri), {
				method: "PUT",
				contentType: "application/json",
				data: ({
					"text": resource.text,
					"revision": resource.revision,
					"position": 0
				})
			}));
		},
		link: function(uri) {
			return Promise.resolve(String.format("/home/%s", uri));
		}
	};

});