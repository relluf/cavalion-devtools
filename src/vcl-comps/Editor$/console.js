$([], {
    
    activeControl: "console",
    
    onLoad: function() {
        var tab = this.query("@owner", require("vcl/ui/Tab"));
        var scope = this.getScope();
        
        scope.console.on("show", function() {
            scope.console.setFocus();
        });
        
        scope.console.loadHistory = function() {
			this._history = scope.ace.getValue().split("\n");
			this._history.index = this._history.length;
        };
        
        scope.console.saveHistory = function(text) {
            var history = scope.ace.getValue().split("\n");
            if (history[history.length - 1] !== text) {
                history.push(text);
                scope.ace.getEditor().setValue(history.join("\n"));
                //scope.ace.getEditor().getSession()._signal("change", {});
            }
        };
        
        tab.on("resource-loaded", function() {
            scope.console.loadHistory();
        });

        return this.inherited(arguments);
    },
    
    onActivate: function() {
    	var scope = this.getScope();
    	if(scope.ace.isVisible()) {
    		scope.ace.setFocus();
    	} else {
    		scope.console.setFocus();
    	}
    	
        return this.inherited(arguments);
    }
    
}, [
    
    $i("ace", {
        visible: false
    }),
    
    $("vcl/Action", "toggle-source", {
        hotkey: "F6",
        onExecute: function() {
            var scope = this.getScope();
            if(scope['source-tab'].isSelected()) {
                scope['console-tab'].setSelected(true);
            } else {
                scope['source-tab'].setSelected(true);
            }
        }
    }),

    $("vcl/ui/Console", "console", {
        css: "background-color:white;",
        align: "client" // Want a designer :) not sure whether this property client should be default
    }),
    
    $("vcl/ui/Tabs", "tabs", {
        align: "bottom", classes: "bottom inset", autoSize: "height"
    }, [
        $("vcl/ui/Tab", "source-tab", {
            text: "Source", control: "ace"
        }),
        $("vcl/ui/Tab", "console-tab", {
            text: "Console", control: "console", selected: true
        })
    ])

]);