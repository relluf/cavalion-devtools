define(["devtools/Resources-node", "devtools/Resources-pouchdb", "devtools/Resources-dropbox", "devtools/Resources-gdrive", "devtools/Resources-dropped", "devtools/Resources-ddh", "vcl/Component", "js/nameOf"], 
function(FS, Pouch, Dropbox, GDrive, Dropped, Ddh, Component, nameOf) {

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

        index(uris) {
            return FS.index(typeof uris === "string" ? [uris] : uris);
        },

        list(uri, opts) {
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
            uri = resolve(uri);
            const provider = ResourceRegistry.getProvider(uri);
            if (provider && provider.get) {
                const scheme = uri.split("://")[0];
                return provider.get(uri.substring(`${scheme}://`.length), opts)
                    .then(resource => {
                        resource.uri = `${scheme}://${resource.uri}`;
                        return resource;
                    });
            }
            return FS.get(uri);
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
            return ["zip", "kmz", "gz", "shp", "ti"].includes(ext);
        },

        ls() { return this.list.apply(this, arguments); },

        resolve: resolve
    };

    // Register default providers
    ResourceRegistry.register("pouchdb", Pouch);
    ResourceRegistry.register("dropbox", Dropbox);
    ResourceRegistry.register("gdrive", GDrive);
    ResourceRegistry.register("dropped", Ddh);
    
    //
    nameOf.methods.after.push(obj => (typeof obj === "object" && typeof obj.uri === "string") ? obj.uri.split("/").pop() : undefined);
    
    return Resources;
});
