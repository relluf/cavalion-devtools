"veldoffice/Session, veldoffice/EM, stylesheet!home/Projects/V7/src/styles.less, pouchdb";

var Application = require("vcl/Application");
var Session = require("veldoffice/Session");
var EM = require("veldoffice/EM");
var app = Application.get();
var PouchDB = require("pouchdb");

// define("veldoffice/models", ["home/Projects/V7/src/node_modules/veldoffice-js/src/veldapps.com/veldoffice/models"], function(models) {
// 	return models;
// });

[(""), {
	vars: {
		"#navigator favorites": [
			"Dropbox/Docs/veldapps.com/.md;;File",
			// "Workspaces/veldapps.com/.md;veldapps.com/.md;File",
			// "Dropbox-veldapps/INDEX.md;;File",
			"Workspaces/veldapps.com/Veldoffice/veldoffice-js",
			"Workspaces/veldapps.com/Veldoffice/veldoffice-js/src/veldapps.com;veldapps-js",
			"Workspaces/veldapps.com/veldapps-leaflet-js",
			"Workspaces/veldapps.com/veldapps-xml",
			"Workspaces/veldapps.com/veldapps-imbro",
			"Workspaces/veldapps.com/veldapps-imsikb",
			"Workspaces/veldapps.com/veldapps-xmlgen-broservices",
			"Workspaces/veldapps.com/veldapps-xmlgen-imsikb",
			"Workspaces/veldapps.com/veldapps-vo",
			"Workspaces/veldapps.com/veldapps-vo/src/cavalion-blocks;veldapps-blocks",
			"Workspaces/veldapps.com/veldapps-vo/src/cavalion-blocks;cavalion-blocks/veldapps"
		]
	},
	onLoad: function() {
		window.veldapps = { 
			veldoffice: { EM: EM, Session: Session, models: EM.models },
			// TODO move to the V7 workspace
			v7: { styles: require("stylesheet!home/Projects/V7/src/styles.less") }
		};
		window.EM = EM;
		window.Session = Session;
		return this.inherited(arguments);
	}
}];