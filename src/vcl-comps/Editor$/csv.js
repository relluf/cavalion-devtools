"lib/bower_components/papaparse/papaparse";

/*
	- 2022/01/19: \t not auto-deteced as delimiter
	
	- resource-loaded => scope.render.execute
*/

var Parser = require("lib/bower_components/papaparse/papaparse");

["", {
    onDestroy: function() {
		this.scope().array.un(this.removeVar("listeners"));
    },
    onLoad: function() {
        var tab = this.up("vcl/ui/Tab");
        var scope = this.scope();

        function f() { scope.render.execute({}); }
        tab.on({"resource-loaded": f, "resource-saved": f});
        
		// TODO pinpoint specific event (not all)
		this.vars("listeners", scope.array.on("event", () => { 
			scope.count?.setContent(scope.array.getSize()); 
		}));
		
		// this.readStorage("q-value", (value) => {
		// 	this.down("#q").set("value", value);
		// });

        return this.inherited(arguments);
    },
    vars: {
    	/* disabled */
	    onDispatchChildEvent: function (component, name, evt, f, args) {
	        if (name.indexOf("key") === 0) {
	            var scope = this.scope();
	            // this.app().qs("vcl/ui/Console#console").print(name, {f: arguments.callee, args: arguments});
				if (component === scope['q']) {
	                if ([13, 27, 38, 40].indexOf(evt.keyCode) !== -1) {
	                    var list = scope.list;
	                    if(evt.keyCode === 13 && list.getSelection().length === 0 && list.getCount()) {
	                        list.print(list.getSelection(true));
	                    } else if(evt.keyCode === 27) {
			                scope['q'].setValue("");
			                scope['q'].fire("onChange", [true]); // FIXME
	                    }
	                    if (list.isVisible()) {
	                        list.dispatch(name, evt);
	                    }
	                    evt.preventDefault();
	                }
	            }
	        }
	        return this.inherited(arguments);
	    },
	    handlers: {
			"#array onFilterObject": function(obj, q) {
				if((q = this.vars("q"))) {
					return !(q.toLowerCase().split(" ").filter(_ => _.length).every(s => {
						for(var k in obj) {
							if(("" + obj[k]).toLowerCase().indexOf(s) >= 0) {
								return true;
							}
						}	
						return false;
					}));
				}
			},
			"#q onKeyDown": function() {
			},
			"#q onChange": function() {
				var array = this.scope().array;
				var input = this.udown("#q");
				
				this.setTimeout(() => { 
					array.vars("q", input.getInputValue());
					array.updateFilter();
					array.up().writeStorage("q-value", input.getInputValue());
				}, 350);
			}
	    }
    }
}, [
	["#ace", { align: "left", width: 750 }],
    
    [("#print"), {
    	onLoad() {
    		this.vars("eval", () => { 
    			var label = [this.vars(["resource.uri"]).split("/").pop()], value;
    			if((value = this.ud("#q").getValue())) {
    				label.push(value);
    			}
    			this.vars("label", label.join("-"));
    			return this.ud("#array")._arr;
    		});
    		return this.inherited(arguments);
    	}
    }],

	[("vcl/Action"), ("toggle-source"), {
		hotkey: "Shift+MetaCtrl+S",
		onLoad() {
			this.scope().ace.hide();
			this.up().readStorage("toggle-source-state", (state) => {
				this.setState(state === true);
				if(state === true) {
					this.scope().ace.show();	
				}
			});
		},
		onExecute() {
			var state;
			if((state = this.toggleState()) === true) {
				this.scope().ace.show();
			} else {
				this.scope().ace.hide();
			}
			this.up().writeStorage("toggle-source-state", state);
		}
	}],
	[("vcl/Action"), ("render"), {
		onExecute: function() {
			// see https://www.papaparse.com/docs#config
			var options = this.vars(["options"]) || {
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
			
			var scope = this.scope();
			var parsed = Parser.parse(scope.ace.getValue(), options);
			var arr = parsed.data;
			var headers = parsed.meta.fields;//arr.shift();

this.print("parsed", parsed);			

			// arr = arr.map(function(values) {
			// 	var obj = {};
			// 	headers.forEach((key, index) => obj[key] = values[index]);
			// 	return obj;
			// });
			
			scope.array.setArray(arr);
			
			const reflect = scope.alphaview.qs("#reflect");
			if(reflect) {
				reflect.execute([arr]);
			} else {
				scope.alphaview.once("container-ready", () => scope.alphaview.qs("#reflect").execute([arr]));
			}
			
			this.up("vcl/ui/Tab").emit("resource-rendered", [{sender: this, data: arr}]);
		}
	}],

	// TODO List<Array> shared by Editor<gds> - AlphaView?
	[("vcl/data/Array"), ("array"), {
		onGetAttributeValue: function(name, index, value) { 
			return (this._arr[index] || {})[name]; 
		}
	}],
	// [("vcl/ui/Bar"), ("menu"), [
	// 	["vcl/ui/Input", ("q"), { placeholder: locale("Search.placeholder") }],
	// 	["vcl/ui/Element", "count", { content: "-" }]
	// ]],
	// ["vcl/ui/List", ("list"), { 
	// 	align: "client", autoColumns: true, source: "array",
	// 	css: "background-color: white; min-width:100%;", 
	// 	onDblClick: function() {
	// 		this.print(this.getSelection(true));	
	// 	},
	// 	// onColumnGetValue: function(column, value, row, source) {
	// 	// 	value = this._source._arr[row][column._attribute];
	// 	// 	if(column.getIndex() === 0) {
	// 	// 		return row + " - " + value;
	// 	// 	}
	// 	// 	return value;
	// 	// }
	// }]
	
	[["cavalion-blocks<devtools/Alphaview>"], "alphaview", { }]
]];