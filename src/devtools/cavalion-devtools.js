define([], function() {

	var npm = (name) => "lib/node_modules/" + name;
	var npm_bang = (banger, name) => banger + "!../lib/node_modules/" + name;
	var bower = (name) => "lib/bower_components/" + name;
	
	function ls(k, slash) { var r = localStorage[k]; if(r) { 
		if(slash && !r.endsWith("/")) r+= "/"; 
		console.log(k, r); 
		return r; } }
	
	var cavalion_js = ls('cavalion-js-path', true) || "lib/node_modules/cavalion-js/src/";
	var cavalion_vcl = ls('cavalion-vcl-path', false) || "lib/node_modules/cavalion-vcl/src/";
	var cavalion_blocks = ls('cavalion-blocks-path', false) || "lib/node_modules/cavalion-blocks/src/";
	var cavalion_pouch = ls('cavalion-pouch-path', false) || "lib/node_modules/cavalion-pouch/src/";
	var veldoffice_js = ls('veldoffice-js-path', true) || "lib/node_modules/veldoffice-js/src/";
	var veldoffice_js_ = veldoffice_js.substring(veldoffice_js.charAt(0) === '/' ? 1 : 0);

	window.require.config({
		// baseUrl: "src/",
	    paths: {
	        "cavalion-blocks/$HOME": "/home",
	        "home": "/home",
	        "$HOME": "/home",
	
	        "Projects": "/home/Projects",
	        "Library": "/home/Library",
	        "Workspaces": "/home/Workspaces",
	
	        /*- bangers! */
	        "stylesheet": cavalion_js + "stylesheet",
	        "script": cavalion_js + "script",
	        "text": cavalion_js + "text",
	        "json": cavalion_js + "json",
	        "locale": cavalion_js + "locale",
	
	        /*- cavalion.org */
	        "js": cavalion_js + "js",
	        "console": cavalion_js + "console",
	        "vcl": cavalion_vcl,
	        "blocks": cavalion_blocks,
	        "pouch": cavalion_pouch,
	
	        "data": cavalion_js + "data",
	        "persistence": cavalion_js + "persistence",
	        "features": cavalion_js + "features",
	        "entities": cavalion_js + "entities",
	
	        "util": cavalion_js + "util",
	        "on": cavalion_js + "on",
	        "yell": cavalion_js + "yell",
	        
			"cavalion-pouch": "/home/Workspaces/cavalion.org/cavalion-pouch",
	        "xslt": "lib/node_modules/xslt/dist/xslt",
	        "eswbo": "/home/Workspaces/eae.com/BBT-1.5.3/WebContent/app/src",
	        "mapbox-gl": "lib/node_modules/mapbox-gl/dist/mapbox-gl-unminified",
	
			// "veldapps-ol": "/home/Workspaces/veldapps.com/veldapps-ol/src",
			"veldapps-ol": "lib/node_modules/veldapps-ol/src",
			// "veldapps-xml": "/home/Workspaces/veldapps.com/veldapps-xml/src",
			"veldapps-xml": "lib/node_modules/veldapps-xml/src",
			// "veldapps-imkl": "/home/Workspaces/veldapps.com/veldapps-imkl/src",
			"veldapps-imkl": "lib/node_modules/veldapps-imkl/src",
			// "veldapps-imsikb": "/home/Workspaces/veldapps.com/veldapps-imsikb/src",
			"veldapps-imsikb": "lib/node_modules/veldapps-imsikb/src",
			// "veldapps-imbro": "/home/Workspaces/veldapps.com/veldapps-imbro/src",
			"veldapps-imbro": "lib/node_modules/veldapps-imbro/src",
			// "vo": "/home/Workspaces/veldapps.com/veldapps-vo/src",
			// "vo": "lib/node_modules/veldapps-vo/src",
			"veldapps-gds-devtools": "/home/Workspaces/veldapps.com/veldapps-gds-devtools/src",
			// "veldapps-gds-devtools": "lib/node_modules/veldapps-gds-devtools/src",
			
			"veldoffice": veldoffice_js + "veldapps.com/veldoffice",
			"vcl-veldoffice": veldoffice_js + "veldapps.com/veldoffice/vcl-veldoffice",
			// "vcl/veldoffice": veldoffice_js + "veldapps.com/veldoffice/vcl-veldoffice",
			/*- veldapps.com/leaflet */
	
			/*- veldapps-leaflet/3rd party */
			"proj4": "lib/node_modules/veldapps-leaflet-js/src/proj4js.org/proj4-src",
			"epsg": "lib/node_modules/veldapps-leaflet-js/src/proj4js.org/epsg",
			"leaflet": "lib/node_modules/veldapps-leaflet-js/src/leafletjs.com",
			"famous": "lib/node_modules/famous",
	
			"ipfs": "lib/node_modules/ipfs/dist/index.min",
	
			// TODO now in veldapps-xml
	        "xml-js": "lib/node_modules/xml-js/dist/xml-js",
	        "handlebars": "lib/node_modules/handlebars/dist/handlebars.min",
	        
	        "sikb0101": "lib/node_modules/veldapps-xmlgen-imsikb",
	        "xml-formatter": "lib/node_modules/xml-formatter/dist/browser/xml-formatter",
	
			/*- bower */
	        "ace": "lib/bower_components/ace/lib/ace",
	        "less": "lib/bower_components/less/dist/less",
	        "moment": "lib/bower_components/moment/moment",
	        "moment-locale": "lib/bower_components/moment/locale",
	        "jquery": "lib/bower_components/jquery/dist/jquery",
	        "backbone": "lib/bower_components/backbone/backbone",
	        "underscore": "lib/bower_components/underscore/underscore",
	        "js-yaml": "lib/bower_components/js-yaml/dist/js-yaml",
	        // "csv-js": "lib/bower_components/CSV-JS/csv",
	        // "relational-pouch": "lib/bower_components/relational-pouch/dist/pouchdb.relational-pouch",
	        
	        /*- dojo */
	        "dojo": "lib/bower_components/dojo",
	        "dgrid": "lib/bower_components/dgrid",
	        "dstore": "lib/bower_components/dstore",
	        
			"chartjs": "lib/node_modules/chart.js/dist",
			"dygraphs/Dygraph": "lib/node_modules/dygraphs/dist/dygraph",
	
	        "fast-xml-parser": "lib/fast-xml-parser/parser",
			"papaparse": "lib/node_modules/papaparse",
			"jspdf": "lib/node_modules/jspdf/dist/jspdf.umd",
			"html2canvas": "lib/node_modules/html2canvas/dist/html2canvas.min",
	
			/*- amcharts3 */
	        "amcharts": "lib/bower_components/amcharts3/amcharts/amcharts",
	        "amcharts.funnel": "lib/bower_components/amcharts3/amcharts/funnel",
	        "amcharts.gauge": "lib/bower_components/amcharts3/amcharts/gauge",
	        "amcharts.pie": "lib/bower_components/amcharts3/amcharts/pie",
	        "amcharts.radar": "lib/bower_components/amcharts3/amcharts/radar",
	        "amcharts.serial": "lib/bower_components/amcharts3/amcharts/serial",
	        "amcharts.xy": "lib/bower_components/amcharts3/amcharts/xy"
	
	    },
		shim: {
			"amcharts.funnel": {
	            "deps": ["amcharts"],
	            "exports": "AmCharts",
	            "init": function () {
	                AmCharts.isReady = true;
	            }
	        },
	        "amcharts.gauge": {
	            "deps": ["amcharts"],
	            "exports": "AmCharts",
	            "init": function () {
	                AmCharts.isReady = true;
	            }
	        },
	        "amcharts.pie": {
	            "deps": ["amcharts"],
	            "exports": "AmCharts",
	            "init": function () {
	                AmCharts.isReady = true;
	            }
	        },
	        "amcharts.radar": {
	            "deps": ["amcharts"],
	            "exports": "AmCharts",
	            "init": function () {
	                AmCharts.isReady = true;
	            }
	        },
	        "amcharts.serial": {
	            "deps": ["amcharts"],
	            "exports": "AmCharts",
	            "init": function () {
	                AmCharts.isReady = true;
	            }
	        },
	        "amcharts.xy": {
	            "deps": ["amcharts"],
	            "exports": "AmCharts",
	            "init": function () {
	                AmCharts.isReady = true;
	            }
	        }
	    }
	});
	
	define("clipboard-copy", [], () => {
		return function clipboardCopy (text) {
		  // Use the Async Clipboard API when available. Requires a secure browsing
		  // context (i.e. HTTPS)
		  if (navigator.clipboard) {
		    return navigator.clipboard.writeText(text).catch(function (err) {
		      throw (err !== undefined ? err : new DOMException('The request is not allowed', 'NotAllowedError'))
		    })
		  }
		
		  // ...Otherwise, use document.execCommand() fallback
		
		  // Put the text to copy into a <span>
		  var span = document.createElement('span')
		  span.textContent = text
		
		  // Preserve consecutive spaces and newlines
		  span.style.whiteSpace = 'pre'
		  span.style.webkitUserSelect = 'auto'
		  span.style.userSelect = 'all'
		
		  // Add the <span> to the page
		  document.body.appendChild(span)
		
		  // Make a selection object representing the range of text selected by the user
		  var selection = window.getSelection()
		  var range = window.document.createRange()
		  selection.removeAllRanges()
		  range.selectNode(span)
		  selection.addRange(range)
		
		  // Copy text to the clipboard
		  var success = false
		  try {
		    success = window.document.execCommand('copy')
		  } catch (err) {
		    console.log('error', err)
		  }
		
		  // Cleanup
		  selection.removeAllRanges()
		  window.document.body.removeChild(span)
		
		  return success
		    ? Promise.resolve()
		    : Promise.reject(new DOMException('The request is not allowed', 'NotAllowedError'))
		}
	});
	define("vcl/Component.storage-pouchdb", ["cavalion-pouch/Component.storageDB"], function() { return arguments[0]; });
	define("vcl/Factory.fetch-resources", ["vcl/Factory", "vcl/Component", "devtools/Resources", "vcl/Component.storage-pouchdb"], (Factory, Component, Resources) => {
		Factory.fetch = function(name) {
			if(name.charAt(0) !== "/") {
				name = "/" + name;
			}
			if(name.indexOf("<") !== -1) {
				name = name.split("<").join("$/").split(">")[0];
			}
	
	
			return Resources.get(js.sf("pouchdb://%s/vcl-comps%s.js", Component.storageDB.name, name))
					.then(function(obj) {
						var src = js.get("vcl-comps:source", obj);
						if(src === undefined) {
							src = js.get("devtools:resource.text", obj);
							if(src === undefined) {
								src = obj.text || "[\"\", {}, []];";
							} else {
								// src = minify(src);
								js.set("vcl-comps:source", src, obj);
							}
						}
	
	// console.log(js.sf(">>> pouchdb://%s/vcl-comps%s.js", Component.storageDB.name, name))
						
						return src;
					})
					.catch(err => null);
		};
	});
	define("blocks/Factory.fetch-resources", ["blocks/Factory", "vcl/Component", "devtools/Resources", "vcl/Component.storage-pouchdb"], (Factory, Component, Resources) => {
		Factory.fetch = function(name) {
			var keys = Component.getKeysByUri(name);
			name = js.sf("%s/%s", keys.namespace, keys.name);
			if(keys.classes.length) {
				name += js.sf(".%s", keys.classes.join("."));
			}
			
			if(keys.specializer) {
				name += js.sf("<>/%s", keys.specializer);
				if(keys.specializer_classes.length) {
					name += js.sf(".%s", keys.specializer_classes.join("."));
				}
			}
	
			if(name.charAt(0) !== "/") {
				name = "/" + name;
			}
	
	// console.log(js.sf(">>> pouchdb://%s/cavalion-blocks%s.js", Component.storageDB.name, name))
	
			return Resources.get(js.sf("pouchdb://%s/cavalion-blocks%s.js", Component.storageDB.name, name))
				.then(function(obj) {
					var src = js.get("cavalion-blocks:source", obj);
					if(src === undefined) {
						src = js.get("devtools:resource.text", obj);
						if(src === undefined) {
							src = obj.text || "[\"\", {}, []];";
						} else {
							// src = minify(src);
							js.set("cavalion-blocks:source", src, obj);
						}
					}
					return src;
				});
		};
	});
	define("markdown", ["lib/bower_components/markdown/lib/markdown"], function() {
		return window.markdown;
	});

	return {
		init() {
			return new Promise((resolve, reject) => {
				require(["console/Printer", "veldapps-gds-devtools/index", "vcl/Component.storage-pouchdb", 
					"vcl/Factory.fetch-resources", "blocks/Factory.fetch-resources", "cavalion-pouch/db", "util/net/Url",
				], () => {
					try {
						var ComponentNode = require("console/node/vcl/Component");
						var Factory = require("vcl/Factory");
						var Url = require("util/net/Url");
						var JsObject = require("js/JsObject");
						var Url = require("util/net/Url");

						require("vcl/Component.storage-pouchdb");
						require("vcl/Factory.fetch-resources");
						require("blocks/Factory.fetch-resources");
						// require("stylesheet!styles.less");
						
						window.app = require("vcl/Application").instances[0];
						app.vars("url", new Url());

						resolve(true);
					} catch(e) {
						reject(e);
					}
				});
			});
		}
	};

});