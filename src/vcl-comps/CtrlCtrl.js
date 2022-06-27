"";

/*- hide list when no results */

var path = (tab) => {
	var tabs = [];
	while((tab = tab.up("vcl/ui/Tab"))) {
		if(tab.vars("resource")) {
			tabs.unshift(tab);
		}
	}
	return tabs.map(tab => tab.vars("resource.uri").split("/").pop()).join("/") + "/";
};
var nameOf = (resource) => resource.uri.split("/").pop();

[("vcl/ui/Form"), {
	activeControl: "input",
	autoSize: "both",
	autoPosition: "top-left-bottom-right",
	css: {
		"font-family": '"Lucida Grande", Arial, sans-serif',
		"font-size": "9pt",
		"position": "absolute",
		// "background-color": "rgba(255, 255, 255, 0.85)",
		"top": "120px",
		"width": "50%",
		// "height": "64px",
		"margin-left": "25%",
		"margin-right": "25%",
		"z-index": "99999",
		//padding: "8px",
		"box-shadow": "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 3px 0 rgba(0, 0, 0, 0.19)",
		"input": {
			background: "transparent",
			border: "none", width: "100%", height: "50px",
			"font-size": "16pt",
			padding: "3px 12px",
			margin: "8px",
			outline: "none",
			'&.value': "margin-bottom: 0;"
		},
		"border-radius":"13px",
		"backdrop-filter": "blur(10px)",
		"background-color": "rgba(155, 155, 155, 0.15)",
		"#list": {
			"": "height: 200px; position: relative;",
			".{ListRow}": {
				"": "padding-left: 8px;",
				"> .hash": "font-size: 6pt;",
				"> .workspace": "font-size: 6pt;",
				"> .name": "font-weight: bold; max-width: 350px;",
				"> .path": "font-size: 6pt;",
				// "> :nth-child(4)": "font-size: 6pt;",
			}
		}
	},
	
	onLoad() {
		this.setParentNode(document.body);
	},
	onActivate() {
		var tabs = this.app().qsa("vcl/ui/Tab")
			.filter(tab => tab.vars("resource"))
			.sort((tab1, tab2) => {
				
				var t1 = tab1.vars("resource.type");
				var t2 = tab2.vars("resource.type");
				
				if(t1 === t2) {
					var r1 = tab1.vars("resource");
					var r2 = tab2.vars("resource");

					t1 = nameOf(r1);
					t2 = nameOf(r2);
					
					if(t1 === t2) {
						t1 = r1.uri;
						t2 = r2.uri;
					}
				}
				
				return t1 < t2 ? -1 : t1 > t2 ? 1 : 0;
			});
		var hash = tabs.map(tab => tab.hashCode()).join(",");

		this.setVar("focused", require("vcl/Control").focused);
		this.qs("#input").syncClass("value", this.qs("#list").isVisible());

		if(this.vars("hash") !== hash) {
			this.vars("hash", hash);
			this.qs("#array").setArray(tabs.map(tab => {
				var resource = tab.vars(["resource"]);
				var folder = resource.uri.split("/");
				var name = folder.pop();
				return {
					hash: tab._control ? tab._control.hashCode() : "-",
					workspace: tab.up("devtools/Workspace<>").getSpecializer(),
					name: name, folder: folder.join("/"),
					path: path(tab),
					// type: resource.type
				};
			}));
		}
	},
	onDeactivate() {
		var control = this.getVar("focused");
		control && control.setFocus();
		// this.ud("#list").hide();
	},
    onDispatchChildEvent(component, name, evt, f, args) {
        if (name.indexOf("key") === 0) {
            var scope = this.scope();
            if (component === scope.input) {
                if ([13, 27, 33, 34, 38, 40].indexOf(evt.keyCode) !== -1) {
                    var list = scope.list, input = scope.input;
                    if(evt.keyCode === 13 && list.getSelection().length === 0 && list.getCount()) {
                        list.setSelection([0]);
                    // } else if(evt.keyCode === 27) {
		                // input.setValue("");
		                // input.removeClass("value");
		                // input.fire("onChange", [true]); // FIXME
                    } else {
						list.show(); 
						if(!input.hasClass("value")) input.addClass("value");
                    }
                    list.dispatch(name, evt);
                    evt.preventDefault();
                }
            }
        }
        return this.inherited(arguments);
    }

}, [
	[("vcl/Action"), "open", {
		on() {
			var list = this.ud("#list"), selection = list.getSelection(true);
			if(!selection.length) return;
			
			var ace = j$[selection[0].hash];
			var tabs = [];
			while((ace = ace.up("vcl/ui/Tab"))) {
				tabs.push(ace);
			}
			while((ace = tabs.pop())) {
				ace.setSelected(true);
			}
			this._owner.hide();
		}
	}],
	[("vcl/data/Array"), "array", {
		onFilterObject(obj, row, context) {
			var q = this.vars("q");
			
			if(!context.list) {
				context.list = this.ud("#list");
				context.columns = {};
				context.q = q ? q.split(" ") : [""];
			}
			
			function match(obj, q) {
				q = q.toLowerCase();	
				if(typeof obj ==="string") {
					return obj.toLowerCase().includes(q);
				}
				for(var k in obj) {
					if(js.sf("%n", obj[k]).toLowerCase().includes(q)) {
						return true;
					}
				}
				return false;
			}
			function match_columns(obj, q) {
				var column, value;
				if(q.indexOf(":") === -1) {
					q = q.toLowerCase();
					for(var i = 0, n = context.list.getColumnCount(); i < n; ++i) {
						column = context.list.getColumn(i);
						value = context.list.valueByColumnAndRow(column, row);
						if(js.sf("%n", value).toLowerCase().includes(q)) {
							return true;
						}
					}
					return false;
				} else {
					q = q.split(":");
					column = context.columns[q[0]] || (context.columns[q] = context.list.getColumnByName(q[0]));
					if(column) {
						value = context.list.valueByColumnAndRow(column, row);
						if(js.sf("%n", value).toLowerCase().includes(q[1])) {
							return true;
						}
					}
					return false;
				}
			}
			
			return context.q.some(q => q ? !(match_columns(obj, q)) : false);// || match(obj, q)): false;
		},
	}],
	[("vcl/ui/Input"), "input", {
		onChange() {
			var array = this.ud("#array"), q;
			array.vars("q", (q = this._node.value));
			array.updateFilter();
			this.ud("#list").setVisible(q.length > 0);
			this.syncClass("value", q.length > 0);
		},
		onKeyDown(evt) {
			if(evt.keyCode === 27) {
				// if(this._node.value.length === 0) {
					this._owner.hide();
				// } else {
				// 	this.setValue("");
				// 	this.setFocus();
				// }
			}
		},
		onBlur() {
			// this.setTimeout("blur", () => this._owner.hide(), 250);
		}
	}],
	[("vcl/ui/List"), "list", {
		align: "none", autoSize: "both", action: "open",
		classes: "header-invisible",
		autoColumns: true,
		source: "array",
		visible: false,
		
		onKeyUp(evt) {
			if(evt.keyCode === 13) {
				this.ud("#open").execute();
			}
		}
	}]
]];