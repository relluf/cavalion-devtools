define(function(require) {
	const js = require("js");

	const requestJson = (url, opts) => fetch(url, {
		headers: js.mixIn({
			Accept: "application/vnd.github+json"
		}, opts && opts.headers || {})
	}).then(response => {
		if(!response.ok) {
			throw new Error(response.status + " " + response.statusText);
		}
		return response.json();
	});
	const textDecoder = () => new TextDecoder("utf-8");
	const parseUri = (uri) => {
		const parts = String(uri || "").replace(/^\/+/, "").split("/").filter(Boolean);
		const owner = parts.shift();
		const repo = (parts.shift() || "").replace(/\.git$/i, "");
		const path = parts.join("/");
		if(!owner || !repo) {
			throw new Error("Invalid gitrepo resource uri: " + uri);
		}
		return {
			owner: owner,
			repo: repo,
			name: owner + "/" + repo,
			path: path,
			webUrl: "https://github.com/" + owner + "/" + repo,
			apiUrl: "https://api.github.com/repos/" + owner + "/" + repo
		};
	};
	const contentUrl = (info, path) =>
		info.apiUrl + "/contents" + (path ? "/" + path.split("/").map(encodeURIComponent).join("/") : "");
	const resourceUri = (info, path) =>
		[info.owner, info.repo, path || ""].filter(Boolean).join("/");
	const contentTypeFor = (name, fallback) => {
		const ext = String(name || "").split(".").pop().toLowerCase();
		const types = {
			md: "text/markdown",
			txt: "text/plain",
			json: "application/json",
			js: "application/javascript",
			css: "text/css",
			html: "text/html",
			htm: "text/html",
			xml: "application/xml",
			yaml: "application/yaml",
			yml: "application/yaml"
		};
		return types[ext] || fallback || "application/octet-stream";
	};
	const mapContentItem = (info, item) => ({
		uri: resourceUri(info, item.path || item.name),
		name: item.name,
		type: item.type === "dir" ? "Folder" : "File",
		size: item.size,
		contentType: item.type === "dir" ? undefined : contentTypeFor(item.name),
		htmlUrl: item.html_url,
		downloadUrl: item.download_url,
		sha: item.sha
	});
	const repoResource = (info, repo) => ({
		uri: resourceUri(info),
		name: info.name + ".gitrepo",
		type: "Package",
		contentType: "application/vnd.github.repository+json",
		repository: repo,
		text: JSON.stringify({
			type: "gitrepo",
			repository: repo
		}, null, "\t")
	});

	return {
		list(uri, opts) {
			const info = parseUri(uri);
			const path = info.path === "contents" ? "" :
				info.path.indexOf("contents/") === 0 ? info.path.substring("contents/".length) : info.path;
			return requestJson(contentUrl(info, path), opts)
				.then(content => Array.as(content).map(item => mapContentItem(info, item)));
		},
		get(uri, opts) {
			opts = opts || {};
			const info = parseUri(uri);
			if(!info.path) {
				return requestJson(info.apiUrl).then(repo => repoResource(info, repo));
			}
			if(info.path === "README.md") {
				return requestJson(info.apiUrl + "/readme").then(readme => {
					if(opts.arrayBuffer && readme.download_url) {
						return fetch(readme.download_url).then(response => response.arrayBuffer());
					}
					return fetch(readme.download_url).then(response => response.arrayBuffer()).then(buffer => ({
						uri: resourceUri(info, "README.md"),
						name: "README.md",
						type: "File",
						contentType: "text/markdown",
						size: buffer.byteLength,
						text: textDecoder().decode(buffer)
					}));
				});
			}
			return requestJson(contentUrl(info, info.path)).then(content => {
				if(content.type === "dir") {
					return {
						uri: resourceUri(info, content.path),
						name: content.name,
						type: "Folder",
						content: content
					};
				}
				if(opts.arrayBuffer) {
					return fetch(content.download_url).then(response => response.arrayBuffer());
				}
				return fetch(content.download_url).then(response => response.arrayBuffer()).then(buffer => ({
					uri: resourceUri(info, content.path),
					name: content.name,
					type: "File",
					contentType: contentTypeFor(content.name, content.type),
					size: buffer.byteLength,
					text: textDecoder().decode(buffer),
					content: content
				}));
			});
		},
		link(uri) {
			const info = parseUri(uri);
			return Promise.resolve(info.webUrl + (info.path ? "/tree/HEAD/" + info.path : ""));
		}
	};
});
