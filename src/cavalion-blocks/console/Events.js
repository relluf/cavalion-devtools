"use js, override";

/*-

2023/10/14 Should add [x] Ignore event of this component

*/

var override = require("override");

var handlers = {

	"loaded": function() {
		var info = this.vars(["devtools/Events", false]), 
			scope = this.scope();
			
		scope.start.set("state", !info);
		this.up("devtools/Workspace<>").vars("devtools/Events", info || {});
	},
	"#list dblclick": function() {
		var selection = this.getSelection(true), label;
		if(selection.length === 1) {
			label = String.format("%n", selection = selection[0]);
		} else {
			label = String.format("%d events", selection.length);
		}
		this.up("devtools/Workspace<>").down("#console").print(label, selection);
	},
	"#stop execute": function() {
		var info = this.vars(["devtools/Events", true]), 
			scope = this.scope();
			
		this._parent.toggleState();
		delete info.run;
	},
	"#start execute": function() {
		var info = this.vars(["devtools/Events", true]), 
			scope = this.scope(), run = Date.now();
			
		this.toggleState();
		info.run = run;
		
		// override(this.app()._dispatcher, "handle", function(inherited) {
		override(this.app(), "dispatchChildEvent", function(inherited) {
			var blocked;
			return function(component, name, evt, f, args) {
				try {
					return inherited.apply(this, arguments);
				} finally {
					if(blocked) return;
					try {
						blocked = true;
						info.run === run && scope.events._array.splice(0, 0, {
							time: Date.now(),
							component: js.sf("%n", component),
							name: name,
							uri: component.getUri().split("/cavalion-blocks/").pop(),
							_uri: component._uri.split("/cavalion-blocks/").pop()
						});
						scope.events.setTimeout("spliced", () => scope.events.splice(0, 0), 250);
					} finally {
						blocked = false;
					}
				}
			};
		});
		this.setTimeout(function() { scope.list.updateColumns(); }, 1000);
	},
	
    onDispatchChildEvent(component, name, evt, f, args) {
        if (name.indexOf("key") === 0) {
            var scope = this.scope();
			if (component === scope['search-input']) {
                if ([13, 27, 33, 34, 38, 40].indexOf(evt.keyCode) !== -1) {
                    var list = scope.list;
                    if(evt.keyCode === 13 && list.getSelection().length === 0 && list.getCount()) {
                        list.setSelection([0]);
                    } else if(evt.keyCode === 27) {
		                scope['search-input'].setValue("");
		                scope['search-input'].fire("onChange", [true]); // FIXME
                    }

                    list.dispatch(name, evt);
                    evt.preventDefault();
                }
            }
        }
        // return this.inherited(arguments);
    },
	"#events onFilterObject": function(obj) {
		var q = this.udown("#search-input").getInputValue().toLowerCase();
		if(q === "") return false;
		
		// var text = obj._text || (obj._text = JSON.stringify(obj).toLowerCase());
		// obj = js.mixIn({}, obj);
		// delete obj.evt;
		var text = JSON.stringify(obj, ["component", "name", "time"]).toLowerCase();
		return !q.split(" ").every(function(term) {
			return text.includes(term);
		});
	},
	"#search-input onKeyDown": function() {
	},
	"#search-input onChange": function() {
		var events = this.scope().events;
		this.setTimeout(function() { events.updateFilter(); }, 500);
	},
};

["Container", { handlers: handlers } ,[
	
	["Executable", "start", { enabled: "state" }],
	["Executable", "stop", { enabled: "notState", state: "parent", parent: "start" }],

	["Bar", [
		["Button", { action: "start" }],
		["Button", { action: "stop" }]
	]],

	["Bar", [
		["vcl-ui:Input", "search-input", { placeholder: locale("Search.placeholder") }],
		["vcl-ui:Element", "status"]
	]],

	["List","list", {
		autoColumns: true,
		source: "events"
	}],
	
	["Array", "events", { array: [].concat(window.events||[]) }]
]];