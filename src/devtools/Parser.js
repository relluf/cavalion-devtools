define(function(require) {
	
	const Control = require("vcl/Control");
	const Ace = require("vcl/ui/Ace");

	const Xml = require("veldapps-xml/index");
	const XmlUtils = require("util/Xml");
	const Papaparse = require("papaparse");
	const Markdown = require("markdown");

	const parseCsv = (text, opts) => {
		var options = opts || {
			// delimiter: ",",	// auto-detect
			// newline: "",	// auto-detect
			quoteChar: '"',
			// escapeChar: '"',
			header: true,
			// dynamicTyping: false,
			// preview: 0,
			// encoding: "",
			// worker: false,
			// comments: false,
			// step: undefined,
			// complete: undefined,
			// error: undefined,
			// download: false,
			skipEmptyLines: true,
			// chunk: undefined,
			// fastMode: undefined,
			// beforeFirstChunk: undefined,
			// withCredentials: undefined
		};
		var parsed = Papaparse.parse(text, options);
		var arr = parsed.data;
		var headers = parsed.meta.fields;

		// scope.array.setArray(arr);
		// this.up("vcl/ui/Tab").emit("resource-rendered", [{sender: this, data: arr}]);
		
		return {arr, headers};
	};
	const parseTsv = (text, opts) => {
		var options = opts || {
			delimiter: "\t",	// auto-detect
			// newline: "",	// auto-detect
			quoteChar: '"',
			// escapeChar: '"',
			header: true,
			// dynamicTyping: false,
			// preview: 0,
			// encoding: "",
			// worker: false,
			// comments: false,
			// step: undefined,
			// complete: undefined,
			// error: undefined,
			// download: false,
			skipEmptyLines: true,
			// chunk: undefined,
			// fastMode: undefined,
			// beforeFirstChunk: undefined,
			// withCredentials: undefined
		};
		var parsed = Papaparse.parse(text, options);
		var arr = parsed.data;
		var headers = parsed.meta.fields;

		// scope.array.setArray(arr);
		// this.up("vcl/ui/Tab").emit("resource-rendered", [{sender: this, data: arr}]);
		
		return {arr, headers};
	};
	const parseXml = (text, opts) => {
		return Xml.parse(text, opts);
	};
	const parseMd = (text, opts) => {
		const json = markdown.toHTMLTree(text);
    	return opts && opts.output === "json" ? json : markdown.renderJsonML(json);
	};

	const getRoot = (text, opts, /**/fn) => {
		let mode = opts || opts.mode;
		
		if(typeof mode !== "string") {
			mode = "";
		}
		
		if(text instanceof Ace) {
			mode = mode || text.getEditor().getSession().getMode().$id;
			text = text.getValue();
		}
		
		if(mode.endsWith("/xml")) {
			return getRoot_xml(text);
		} else if(mode.endsWith("/html")) {
			return getRoot_xml(text);
		} else if(mode.endsWith("/json")) {
			return getRoot_json(text);
		} else if(mode.endsWith("/javascript")) {
			if((fn = js.get("javascript.eval_", opts))) {
				return fn(text);
			}
			return getRoot_js(text);
		} else if(mode.endsWith("/markdown")) {
			return getRoot_md(text);
		}
		return text;
	};
	const getRoot_xml = (text) => {
		return Xml.parse(text);
	};
	const getRoot_json = (text) => {
		return JSON.parse(text);
	};
	const getRoot_js = (text) => {
		return js.eval(text);
	};
	const getRoot_md = (text) => {
		return text.getLines();
	};
	const format = (ace) => {
		const mode = ace.getEditor().getSession().getMode().$id;
		const source = ace.getValue();
		if(mode.endsWith("/xml")) {
			ace.setValue(require("util/Xml").beautify(source));
		} else if(mode.endsWith("/html")) {
			ace.setValue(require("util/Xml").beautify(source));
		} else if(mode.endsWith("/json")) {
			ace.setValue(js.b(source));
		} else if(mode.endsWith("/js")) {
			ace.setValue(js.b(source));
			// return format_js(ace);
		} else if(mode.endsWith("/markdown")) {
			// return format_md(ace);
		}
	};
	
	const arrN = (A, n, e) => A ? A[n] : e;
	const skipPrologue = (xml) => {
		if(!xml) return xml;
		// Find the end of the prologue if it exists
		const prologueEnd = xml.indexOf("?>");
		return xml.substring(prologueEnd !== -1 ? prologueEnd + 2 : 0).trim();
	};

	const Parser = {
		
		XML_NAMESPACES: {
			'isbhrgt': [
				// "http://www.broservices.nl/xsd/isbhr-gt/1.0",
				// "http://www.broservices.nl/xsd/isbhr-gt/2.0",
				"http://www.broservices.nl/xsd/isbhr-gt/2.1"],
			'bhrgtcom': [
				// "http://www.broservices.nl/xsd/bhrgtcommon/1.0",
				// "http://www.broservices.nl/xsd/bhrgtcommon/2.0",
				"http://www.broservices.nl/xsd/bhrgtcommon/2.1"
			],	
			'brocom': [
				// "http://www.broservices.nl/xsd/brocommon/1.0",
				// "http://www.broservices.nl/xsd/brocommon/2.0",
				"http://www.broservices.nl/xsd/brocommon/3.0"
			],
			'isgmw': ["http://www.broservices.nl/xsd/isgmw/1.1"],
			'isgld': ["http://www.broservices.nl/xsd/isgld/1.1"],
			'swe': ["http://www.opengis.net/swe/2.0"],
			'gml': ["http://www.opengis.net/gml/3.2"],
			'xlink': ["http://www.w3.org/1999/xlink"],
			'xsi': ["http://www.w3.org/2001/XMLSchema-instance"],
			'xs': ["http://www.w3.org/2001/XMLSchema"]
		},
		
		determineType(hints) {
			const types = [];
			const text = (hints.text || hints);
			if(typeof text === "string") {
				if(this.isTi(text)) {
					types.push("ti");
				}
				if(this.isKl(text)) {
					types.push("kl");
					types.push(this.getKlVersion(text) || "2.0");
				}
				if(this.isSikb(text)) {
					types.push("sikb");
					if(text.match(/<labresultaat\s/s)) {
						types.push("labresultaat");
					} else {
						if(text.match(/<bodeminformatie\s/s)) {
							types.push("bodeminformatie");
						}
					}
					types.push(this.getSikbVersion(text));
				}
				if(this.isBroBhrGt(text)) {
					types.push("bro-bhr-gt");
					types.push(this.getBroBhrGtVersion(text));
				}
				if(this.isBroGld(text)) {
					types.push("bro-gld");
					types.push(this.getBroGldVersion(text));
				}
				if(this.isBroGmw(text)) {
					types.push("bro-gmw");
					types.push(this.getBroGmwVersion(text));
				}
				if(this.isFews(text)) {
					types.push("fews");
					types.push(this.getFewsVersion(text));
				}
			}
			if(hints.filename) {
				types.push(filename.split("/").pop().split(".").pop());
			}
			return types.join("/");
		},
		parse(text, type, opts) {
			if(arguments.length === 1) {
				type = this.determineType(text);
			}
			
			if(type === "csv" || type.endsWith("/csv")) {
				return parseCsv(text, opts);
			}
			if(type === "tsv" || type.endsWith("/tsv")) {
				return parseTsv(text, opts);
			}
			if(type === "svg" || type === "xhtml" || type === "xml" || type.endsWith("application/xml")) {
				return parseXml(text, opts);
			}
			if(type === "md" || type === "markdown" || type.endsWith("application/markdown")) {
				return parseMd(text, opts);
			}
		},
		format(ace) {
			return format(ace);
		},
		
		isTi(text) {
			return skipPrologue(text).match(/^<VeldData>[^>]*<tbl[^>]*>/s);	
		},
		isKl(text) {
			text = skipPrologue(text);
			return /<[^>]*xmlns.*\="http:\/\/www.geostandaarden.nl\/imkl\/2015\/wion\/[^"]*"/s.test(text) || 
				/<[^>]*xmlns.*\="http:\/\/www.geostandaarden.nl\/imkl\/wibon\"/s.test(text);
		},
		isFews(text) {
			text = skipPrologue(text);
			return /<[^>]*xmlns.*\="http:\/\/www.wldelft.nl\/fews\/PI"/s.test(text);
		},
		isSikb(text) {
			text = skipPrologue(text);
			return /<[^>]*xmlns.*\="http:\/\/www.sikb.nl\/.*"/s.test(text) || 
				/<metainformatie.*versie="([^"]*)"/s.test(text) ||
				/^<labresultaat\s/s.test(text) ||
				/^<bodeminformatie\s/s.test(text);
			// return /<[^>]*xmlns.*\="http:\/\/www.sikb.nl\/imsikb0101"/s.test(text);
		},
		isBroBhrGt(text) {
			text = skipPrologue(text);
			return /<[^>]*xmlns.*\="http:\/\/www.broservices.nl\/xsd\/isbhr-gt\/[^"]*"/s.test(text);
		},
		isBroGld(text) {
			text = skipPrologue(text);
			return /<[^>]*xmlns.*\="http:\/\/www.broservices.nl\/xsd\/isgld\/(.*)"/s.test(text);
		},
		isBroGmw(text) {
			text = skipPrologue(text);
			return /<[^>]*xmlns.*\="http:\/\/www.broservices.nl\/xsd\/isgmw\/(.*)"/s.test(text);
		},
		
		getFewsVersion(text) {
			return arrN(text.match(/<.*TimeSeries.*version\=\"([^"]*)"/s), 1)
		},
		getSikbVersion(text) {
			return arrN(text.match(/<[^>]*version>(.*)<[^>]*version>/s), 1) ||
				arrN(text.match(/<metainformatie.*versie="([^"]*)"/s), 1) ||
				arrN(text.match(/<labresultaat.*versie\=\"([^"]*)"/s), 1)
		},
		getKlVersion(text) {
			return arrN(text.match(/<[^>]*xmlns.*\="http:\/\/www.geostandaarden.nl\/imkl\/2015\/wion\/([^"]*)"/s), 1);
		},
		getBroBhrGtVersion(text) {
			return arrN(text.match(/<[^>]*xmlns[^\=]*\="http:\/\/www.broservices.nl\/xsd\/isbhr-gt\/([^"]*)"/s), 1);
		},
		getBroGldVersion(text) {
			return arrN(text.match(/<[^>]*xmlns[^\=]*\="http:\/\/www.broservices.nl\/xsd\/isgld\/([^"]*)"/s), 1);
		},
		getBroGmwVersion(text) {
			return arrN(text.match(/<[^>]*xmlns[^\=]*\="http:\/\/www.broservices.nl\/xsd\/isgmw\/([^"]*)"/s), 1);
		},
		
		getRoot: getRoot,
		
		parseCsv: parseCsv,
		parseTsv: parseTsv,
		parseXml: parseXml,
		parseMd: parseMd
	};
	
	return Parser;	
});