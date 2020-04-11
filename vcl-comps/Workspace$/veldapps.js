"veldoffice/Session, veldoffice/EM, stylesheet!home/Projects/V7/src/styles.less, pouchdb";

var Application = require("vcl/Application");
var Session = require("veldoffice/Session");
var EM = require("veldoffice/EM");


var app = Application.get();
var PouchDB = require("pouchdb");

define("veldoffice/models", ["home/Projects/V7/src/node_modules/veldoffice-js/src/veldapps.com/veldoffice/models"], function(models) {
	return models;
});

$([], {
	vars: {
		"#navigator favorites": [
			"Workspaces/veldapps.com/veldapps-vo",
			"Workspaces/veldapps.com/Veldoffice/veldoffice-js/src/veldapps.com;veldapps-js",
			"Workspaces/veldapps.com/veldapps-vo/src/cavalion-blocks;veldapps-blocks",
			"Workspaces/veldapps.com/veldapps-vo/src/cavalion-blocks;cavalion-blocks/veldapps"
		]
	},
	onLoad: function() {
		window.veldapps = { EM: EM, Session: Session };
		window.EM = EM;
		window.Session = Session;
		
		window.v7o_db = new PouchDB("v7-objects");

		this.print("veldapps loaded", veldapps);
		return this.inherited(arguments);
	}
}, []);