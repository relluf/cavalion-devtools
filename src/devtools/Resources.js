define(["devtools/Resources-node", "devtools/Resources-pouchdb", "devtools/Resources-dropbox", "devtools/Resources-gdrive", "devtools/Resources-dropped", "devtools/Resources-ddh", "devtools/Resources-gitrepo", "vcl/Component", "js/nameOf"],
function(FS, Pouch, Dropbox, GDrive, Dropped, Ddh, GitRepo, Component, nameOf) {

    // Registry for resource providers
    const ResourceRegistry = {
        providers: {},

        register(scheme, provider) {
            this.providers[scheme] = provider;
        },

        getProvider(uri) {
            const scheme = uri.split("://")[0];
            return this.providers[scheme];
        },
    };

    // Default URI resolver
    const resolve = (relativeTo, path) => {
		if(path !== undefined) {
    		if(relativeTo instanceof Component) {
    			relativeTo = js.up(relativeTo.vars(["resource.uri"])) || "";
    		} else if(relativeTo.id && relativeTo.uri) {
    			relativeTo = js.up(relativeTo.id);
    		}
    		path = [relativeTo.replace(/^\$HOME\//, "").replace(/^home\//, ""), path].join("/");
		} else {
			path = relativeTo;
		}
		
        if (path.startsWith("://")) {
            path = Resources.getDefaultURIBase(path) + path.substring("://".length);
        }

        return path;
    };

    // Pluggable Resources system
    const Resources = {
        getDefaultURIBase(uri) {
            return "pouchdb://Resources/";
        },

		dereference(resource) {
			if(typeof resource === "string") return {uri: resource};
			if(!resource || typeof resource !== "object") return resource;

			const target = resource.target && typeof resource.target === "object" ? resource.target : null;
			const targetUri = resource.targetUri || resource.linkedUri || target && target.uri;
			if(!targetUri) return resource;

			const result = js.mi({}, resource);
			if(target) js.mi(result, target);
			result.aliasUri = resource.aliasUri || resource.uri;
			result.uri = targetUri;
			result.name = target && target.name || targetUri.replace(/\/$/, "").split("/").pop() || resource.name;
			delete result.target;
			delete result.targetUri;
			delete result.linkedUri;
			return result;
		},

        index(uris) {
            return FS.index(typeof uris === "string" ? [uris] : uris);
        },

        list(uri, opts) {
			if(uri && typeof uri === "object") uri = this.dereference(uri).uri;
            uri = resolve(uri || "/");
            const provider = ResourceRegistry.getProvider(uri);
            if (provider && provider.list) {
                const scheme = uri.split("://")[0];
                return provider.list(uri.substring(`${scheme}://`.length), opts)
                    .then(resources => resources.map(resource => {
                        resource.uri = `${scheme}://${resource.uri.replace(/^\//, "")}`;
                        return resource;
                    }));
            }
            return FS.list(uri);
        },

		get(uri, opts) {
			const requested = uri && typeof uri === "object" ? this.dereference(uri) : null;
			const aliasUri = requested && requested.aliasUri;
			if(requested) uri = requested.uri;
            uri = resolve(uri);
            const provider = ResourceRegistry.getProvider(uri);
            if (provider && provider.get) {
                const scheme = uri.split("://")[0];
				return provider.get(uri.substring(`${scheme}://`.length), opts)
					.then(resource => {
						if(opts && opts.arrayBuffer) return resource;
						resource.uri = `${scheme}://${resource.uri}`;
						if(aliasUri && !resource.aliasUri) resource.aliasUri = aliasUri;
						return Resources.dereference(resource);
					});
			}
			return FS.get(uri, opts).then(resource => {
				if(opts && opts.arrayBuffer) return resource;
				if(aliasUri && !resource.aliasUri) resource.aliasUri = aliasUri;
				return resource;
			});
        },

		revisionOf(resource) {
			if(!resource || typeof resource !== "object") return undefined;
			const fields = ["revision", "rev", "etag", "ETag", "uid", "sha", "contentHash", "contenthash", "version", "md5Checksum"];
			for(let i = 0; i < fields.length; ++i) {
				const field = fields[i];
				if(resource[field] !== undefined && resource[field] !== null) {
					return field + ":" + String(resource[field]);
				}
			}
			const modified = resource.lastModified !== undefined ? resource.lastModified : resource.modified;
			if(modified !== undefined && modified !== null) {
				return "modified:" + String(modified) + ":size:" + String(resource.size === undefined ? "" : resource.size);
			}
			if(typeof resource.text === "string") return "text:" + resource.text;
		},

		getRevision(uri) {
			const requested = uri && typeof uri === "object" ? this.dereference(uri) : null;
			if(requested) uri = requested.uri;
			uri = resolve(uri);
			const provider = ResourceRegistry.getProvider(uri);
			const scheme = uri.split("://")[0];
			const providerUri = provider ? uri.substring(`${scheme}://`.length) : uri;
			const result = provider && provider.getRevision ?
				provider.getRevision(providerUri) :
				this.get(uri);
			return Promise.resolve(result).then(value =>
				typeof value === "string" ? value : this.revisionOf(value));
		},

        create(uri, resource) {
            uri = resolve(uri);
            const provider = ResourceRegistry.getProvider(uri);
            if (provider && provider.create) {
                const scheme = uri.split("://")[0];
                return provider.create(uri.substring(`${scheme}://`.length), resource);
            }
            return FS.create(uri, resource);
        },

        delete(uri) {
            uri = resolve(uri);
            const provider = ResourceRegistry.getProvider(uri);
            if (provider && provider.delete) {
                const scheme = uri.split("://")[0];
                return provider.delete(uri.substring(`${scheme}://`.length));
            }
            return FS.delete(uri);
        },

        update(uri, resource) {
            uri = resolve(uri);
            const provider = ResourceRegistry.getProvider(uri);
            if (provider && provider.update) {
                const scheme = uri.split("://")[0];
                return provider.update(uri.substring(`${scheme}://`.length), resource);
            }
            return FS.update(uri, resource);
        },

        link(uri) {
            uri = resolve(uri);
            const provider = ResourceRegistry.getProvider(uri);
            if (provider && provider.link) {
                const scheme = uri.split("://")[0];
                return provider.link(uri.substring(`${scheme}://`.length));
            }
            return FS.link(uri);
        },

        isZipped(uri, ext) {
            ext = ext || uri.split(".").pop();
            return ["zip", "kmz", "ti", "gz"].includes(ext);
        },

        isPackage(uri, ext) {
            ext = ext || uri.split(".").pop();
            return String(uri || "").startsWith("gitrepo://") || ["zip", "kmz", "gz", "shp", "ti"].includes(ext);
        },

        ls() { return this.list.apply(this, arguments); },

        resolve: resolve
    };

    // Register default providers
    ResourceRegistry.register("pouchdb", Pouch);
    ResourceRegistry.register("dropbox", Dropbox);
    ResourceRegistry.register("gdrive", GDrive);
    ResourceRegistry.register("dropped", Ddh);
    ResourceRegistry.register("gitrepo", GitRepo);
    
    //
    nameOf.methods.after.push(obj => (typeof obj === "object" && typeof obj.uri === "string") ? obj.uri.split("/").pop() : undefined);
    
    return Resources;
});
