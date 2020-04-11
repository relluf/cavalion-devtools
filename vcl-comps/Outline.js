"vcl/ui/Node";

$("vcl/ui/Tree", {

    css: {
        ".{./Node}": {
            "&:not(.selected) > .text > .class": {
                color: "silver",
                ">a": {
                    color: "rgba(0, 0, 255, 0.75)"
                }
            },
            "> .text > .class": {
                ">a": {
                    "font-size": "6.5pt",
                    "text-decoration": "underline",
                    cursor: "pointer"
                }
            },
            ".root": {
                "font-weight": "bold"
            }
        }
    },

    onLoad: function() {
        this.dispatch("nodesneeded", null);
        return this.inherited(arguments);
    },

    onNodeCreated: function() {
        var app = this.getApp();
        var me = this;
        this._node.addEventListener("click", function(e) {
            if(e.target.nodeName === "A") {
                var uri = e.target.textContent;
                if(uri.charAt(0) !== "#") {
                    uri += ".js";
                    if(uri.indexOf("vcl/") === 0) {
                        uri = "cavalion-vcl/lib/cavalion.org/" + uri;
                    } else {
                        uri = "code/src/vcl-comps/" + uri;
                    }
                    app.qsa("devtools/Workspace<>:owner-of(.) #editor-needed", me)
                    	.execute({resource: {uri: uri}, selected: true});
                } else {
                    app.emit("print", require("js/JsObject").all[
                        parseInt(uri.substring(1))]);
                }

            }
        });
    },

	onNodesNeeded: function(parent) {
	    var Node = require("vcl/ui/Node");
	    var owner = this;
	    var arr;

	    if(parent === null) {
	        arr = require("vcl/Component").all
	            .reduce(function(arr, item) {
    	            if(item._isRoot) {
    	                arr.push(item);
    	            }
                    return arr;
    	        }, []);
	        parent = this;
	    } else {
	        arr = parent.getVar("component")._components || [];
	    }
        arr.forEach(function(comp) {
	        var node = new Node(owner);
	        var className = comp.constructor['@class obj'].name;
	        var name = comp._name;

	        if(comp._isRoot) {
	            if(!(name = comp._name)) {
	                name = comp._uri;
	                if(name.indexOf("<") === -1) {
	                    name += "<>";
	                }
	            }
	        }

	        if(name) {
    	        node.setText(String.format("<span class='name%s'>%H</span>\
    	            <span class='class'>- <a>%H</a> - <a>%H</a> - <a>#%d</a></span>",
    	            comp._isRoot ? " root" : "",
    	            name, className, comp._uri, comp.hashCode()));
	        } else {
    	        node.setText(String.format(
    	            "<span class='class'>- <a>%H</a> - <a>%H</a> - <a>#%d</a></span>",
    	            className, comp._uri, comp.hashCode()));
	        }
	        node.setVar("component", comp);
	        node.setParent(parent);
	        node.setExpandable(comp._components);
        });
	}

}, []);