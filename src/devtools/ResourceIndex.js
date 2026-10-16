define(["devtools/Resources"], function(Resources) {

	const isFolder = resource => {
		const type = String(resource && resource.type || "");
		return type === "Package" || type.indexOf("Folder") !== -1;
	};
	const hasScheme = uri => new RegExp("^[^/:]+://").test(uri);
	const parseFavorite = value => {
		if(typeof value !== "string") return value;
		value = value.split(";");
		return {
			uri: value[0],
			name: value[1] || value[0].split("/").pop(),
			type: value[2] || "Folder"
		};
	};
	const uniqueResources = resources => {
		const seen = {};
		return resources.filter(resource => {
			const uri = resource && resource.uri;
			if(!uri || seen[uri] || uri.split("/").pop().endsWith("-")) return false;
			seen[uri] = true;
			return true;
		});
	};
	const favorites = workspace =>
		(workspace.vars(["#navigator favorites"]) || [])
			.map(parseFavorite)
			.filter(Boolean);
	const roots = workspace => {
		const configured = workspace.vars(["resourcePalette.folders"]);
		const navigator = workspace.qs("#navigator");
		const checked = navigator && navigator.vars("uris") || [];
		const result = Array.isArray(configured) ? configured : checked;

		return uniqueResources(result
			.map(parseFavorite)
			.concat(favorites(workspace).filter(isFolder)))
			.map(resource => resource.uri);
	};
	const state = workspace => {
		const palette = workspace.vars(["resourcePalette"]);
		return palette.index || (palette.index = {
			resources: [],
			roots: "",
			promise: null,
			generation: 0,
			indexedAt: 0,
			error: null
		});
	};
	const flatten = index => {
		const resources = [];
		for(const uri in index || {}) {
			if(Array.isArray(index[uri])) {
				index[uri].forEach(resource => resources.push(resource));
			}
		}
		return uniqueResources(resources);
	};
	const crawl = (root, maximum, add) => new Promise(resolve => {
		const queue = [root];
		const visited = {};
		let active = 0;
		let count = 0;

		const pump = () => {
			while(active < 4 && queue.length && count < maximum) {
				const uri = queue.shift();
				if(visited[uri]) continue;
				visited[uri] = true;
				active++;
				Resources.list(uri).then(resources => {
					resources = uniqueResources(resources).slice(0, maximum - count);
					count += resources.length;
					add(resources);
					resources.filter(isFolder).forEach(resource => {
						if(!visited[resource.uri]) queue.push(resource.uri);
					});
				}).catch(() => null).then(() => {
					active--;
					if((!queue.length && active === 0) || count >= maximum) resolve();
					else pump();
				});
			}
			if(!queue.length && active === 0) resolve();
		};

		pump();
	});

	return {
		favorites,
		roots,
		get(workspace) {
			return state(workspace);
		},
		invalidate(workspace) {
			const current = state(workspace);
			current.generation++;
			current.roots = "";
			current.promise = null;
		},
		refresh(workspace, force, onProgress) {
			const current = state(workspace);
			const folders = roots(workspace);
			const key = folders.join("\n");

			if(!force && current.roots === key && (current.promise || current.indexedAt)) {
				return current.promise || Promise.resolve(current);
			}
			if(!folders.length) {
				current.generation++;
				current.resources = [];
				current.roots = key;
				current.indexedAt = Date.now();
				return Promise.resolve(current);
			}

			const generation = ++current.generation;
			const found = {};
			const add = resources => {
				if(current.generation !== generation) return;
				resources.forEach(resource => {
					if(resource && resource.uri) found[resource.uri] = resource;
				});
				current.resources = Object.keys(found).map(uri => found[uri]);
				onProgress && onProgress(current);
			};
			const serverFolders = folders.filter(uri => !hasScheme(uri));
			const providerFolders = folders.filter(hasScheme);
			const maximum = workspace.vars(["resourcePalette.maxIndexedResources"]) || 10000;
			const jobs = providerFolders.map(uri => crawl(uri, maximum, add));
			if(serverFolders.length) {
				jobs.push(Resources.index(serverFolders).then(index => add(flatten(index))));
			}

			current.resources = [];
			current.roots = key;
			current.error = null;
			current.promise = Promise.all(jobs).then(() => {
				if(current.generation !== generation) return current;
				current.indexedAt = Date.now();
				current.promise = null;
				return current;
			}).catch(error => {
				if(current.generation !== generation) return current;
				current.error = error;
				current.promise = null;
				return current;
			});

			return current.promise;
		}
	};
});
