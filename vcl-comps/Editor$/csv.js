"lib/bower_components/papaparse/papaparse";

var Parser = require("lib/bower_components/papaparse/papaparse");

$([], {
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
			scope.count.setContent(scope.array.getSize()); 
		}));
		
		this.readStorage("search-input-value", (value) => {
			this.down("#search-input").set("value", value);
		});

        return this.inherited(arguments);
    },
    onDispatchChildEvent: function (component, name, evt, f, args) {
        if (name.indexOf("key") === 0) {
            var scope = this.scope();
            // this.app().qs("vcl/ui/Console#console").print(name, {f: arguments.callee, args: arguments});
			if (component === scope['search-input']) {
                if ([13, 27, 33, 34, 38, 40].indexOf(evt.keyCode) !== -1) {
                    var list = scope.list;
                    if(evt.keyCode === 13 && list.getSelection().length === 0 && list.getCount()) {
                        list.print(list.getSelection(true));
                    } else if(evt.keyCode === 27) {
		                scope['search-input'].setValue("");
		                scope['search-input'].fire("onChange", [true]); // FIXME
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
		"#search-input onKeyDown": function() {
		},
		"#search-input onChange": function() {
			var array = this.scope().array;
			var input = this.udown("#search-input");
			
			this.setTimeout(() => { 
				array.vars("q", input.getInputValue());
				array.updateFilter();
				array.up().writeStorage("search-input-value", input.getInputValue());
			}, 350);
		}
    }
}, [
	$i("ace", { align: "left", width: 750 }),
	$(("vcl/data/Array"), "array"),
	
	$("vcl/Action", ("toggle-source"), {
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
	}),
	
	$(("vcl/ui/Bar"), [
		$("vcl/ui/Input", ("search-input"), { placeholder: locale("Search.placeholder") }),
		$("vcl/ui/Element", "count", { content: "-" })
	]),
	
	$("vcl/ui/List", ("list"), { 
		align: "client", autoColumns: true, source: "array",
		css: "background-color: white; min-width:100%;", 
		onDblClick: function() {
			this.print(this.getSelection(true));	
		},
		onColumnGetValue: function(column, value, row, source) {
			value = this._source._arr[row][column._attribute];
			if(column.getIndex() === 0) {
				return row + " - " + value;
			}
			return value;
		}
	}),
	$("vcl/Action", ("render"), {
		onExecute: function() {
			// see https://www.papaparse.com/docs#config
			var options = this.getVar("options", true) || {
				// delimiter: "",	// auto-detect
				// newline: "",	// auto-detect
				// quoteChar: '"',
				// escapeChar: '"',
				// header: false,
				// dynamicTyping: false,
				// preview: 0,
				// encoding: "",
				// worker: false,
				// comments: false,
				// step: undefined,
				// complete: undefined,
				// error: undefined,
				// download: false,
				// skipEmptyLines: false,
				// chunk: undefined,
				// fastMode: undefined,
				// beforeFirstChunk: undefined,
				// withCredentials: undefined
			};
			
			var scope = this.scope();
			var arr = Parser.parse(scope.ace.getValue(), options).data;
			var headers = arr.shift();
			
			scope.array.setArray(arr.map(function(values) {
				var obj = {};
				headers.forEach(function(key, index) {
					obj[key] = values[index];
				});
				return obj;
			}));
		}
	})
]);