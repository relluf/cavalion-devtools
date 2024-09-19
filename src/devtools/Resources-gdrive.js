define(function(require) {
    
    var Hash = require("util/Hash");

    var gdrives = {}, tokens = {};
    var CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID';
    var API_KEY = 'YOUR_API_KEY';
    var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
    var SCOPES = 'https://www.googleapis.com/auth/drive';
    
    function loadGapi() {
        return new Promise((resolve, reject) => {
            gapi.load('client:auth2', () => {
                gapi.client.init({
                    apiKey: API_KEY,
                    clientId: CLIENT_ID,
                    discoveryDocs: DISCOVERY_DOCS,
                    scope: SCOPES
                }).then(function () {
                    resolve();
                }, function(error) {
                    reject(error);
                });
            });
        });
    }

    function getGoogleDrive() {
        if (!gapi.auth2.getAuthInstance().isSignedIn.get()) {
            return gapi.auth2.getAuthInstance().signIn().then(() => gapi.client.drive);
        }
        return Promise.resolve(gapi.client.drive);
    }
    
    var all = {};
    function singleton(obj) {
        return all[obj.uri] ? js.mixIn(all[obj.uri], obj) : (all[obj.uri] = obj);
    }

    return {
        initGoogleDrive: function() {
            return loadGapi();
        },
        
        registerAccessToken: function(alias, token) {
            if(arguments.length === 1 && typeof alias === "object") {
                Object.keys(alias).forEach(name => 
                    this.registerAccessToken(name, alias[name]));
            } else {
                tokens[alias] = token;	
            }
        },

        list: function(path) {
            return getGoogleDrive()
                .then(drive => drive.files.list({
                    q: `'${path}' in parents`,
                    fields: 'files(id, name, mimeType)'
                }))
                .then(res => res.result.files.map(e => singleton({
                    name: e.name,
                    type: e.mimeType === "application/vnd.google-apps.folder" ? "Folder" : "File",
                    expandable: e.mimeType === "application/vnd.google-apps.folder",
                    uri: js.sf("%s/%s", path, e.name),
                    detail: e
                })));
        },

        get: function(fileId) {
            return getGoogleDrive()
                .then(drive => drive.files.get({
                    fileId: fileId,
                    alt: 'media'
                }))
                .then(res => res.body)
                .then(text => singleton({ 
                    uri: fileId, 
                    text: text
                }));
        },

        create: function(path, resource) {
            return getGoogleDrive()
                .then(drive => drive.files.create({
                    resource: {
                        name: resource.name,
                        parents: [path],
                        mimeType: resource.contentType || "application/json"
                    },
                    media: {
                        mimeType: resource.contentType || "application/json",
                        body: resource.text
                    },
                    fields: 'id'
                }));
        },

        'delete': function(fileId) {
            return getGoogleDrive().then(drive => drive.files.delete({ fileId: fileId }));
        },

        update: function(fileId, resource) {
            return getGoogleDrive()
                .then(drive => drive.files.update({
                    fileId: fileId,
                    media: {
                        mimeType: resource.contentType || "application/json",
                        body: resource.text
                    },
                    fields: 'id'
                }));
        },

        link: function(fileId) {
            return getGoogleDrive()
                .then(drive => drive.files.get({
                    fileId: fileId,
                    fields: 'webViewLink'
                }))
                .then(res => res.result.webViewLink);
        }
    };
});
