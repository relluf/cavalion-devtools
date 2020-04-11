"veldoffice/Session, veldoffice/EM, stylesheet!home/Projects/V7/src/styles.less, pouchdb";

var Application = require("vcl/Application");
var Session = require("veldoffice/Session");
var EM = require("veldoffice/EM");


var app = Application.get();
var consol3 = app.qs("#console");
var PouchDB = require("pouchdb");

define("veldoffice/models", ["home/Projects/V7/src/node_modules/veldoffice-js/src/veldapps.com/veldoffice/models"], function(models) {
	return models;
});

$([], {
	vars: {
		"#navigator favorites": [
			"Library/cavalion-blocks",
			"Workspaces/veldapps.com/veldapps-vo",
			"Workspaces/veldapps.com/veldoffice-js/src",
			"Workspaces/veldapps.com/veldoffice-js/src/veldapps.com/veldoffice;veldoffice-js/src/veldapps.com/veldoffice;Folder"
		]
	},
	onLoad: function() {
		window.veldapps = { EM: EM, Session: Session };
		window.EM = EM;
		window.Session = Session;
		
		window.v7o_db = new PouchDB("v7-objects");

		consol3.log("veldapps loaded", veldapps);
		return this.inherited(arguments);
	}
}, []);