define(function(require) {

	var NavigatorNode = require("js/defineClass");
    var EventDispatcher = require("vcl/EventDispatcher");
	var Node = require("vcl/ui/Node");
	var Type = require("js/Type");

	return (NavigatorNode = NavigatorNode(require, {
		inherits: Node,
        prototype: {
            _onChange: null,
            
            initializeNodes: function () {
            	/** @overrides vcl/Control.prototype.initializeNodes */
                var r = this.inherited(arguments);

                var checkbox = document.createElement("input");
                checkbox.setAttribute("type", "checkbox");
                checkbox.className = "navigator checkbox";
                checkbox.onchange = EventDispatcher.handleEvent;

                this._node.insertBefore(checkbox, this._nodes.icon);
                this._nodes.checkbox = checkbox;

                return r;
            },
            hasClass: function (className) {
            	/** @overrides vcl/Control.prototype.hasClass */
                return this.determineClasses().indexOf(className) !== -1;
            },
            determineClasses: function () {
            	/** @overrides vcl/Control.prototype.determineClasses */
                var r = this.inherited(arguments);
                // if this._parent is not a NavigatorNode...
                if (this._parent && !(this._parent instanceof NavigatorNode)) {
                    // ...consider this to be a root node
                    r.push("root");
                }
                var item = this.getVar("resource") || {
                    type: ""
                };
                r.push(item.type.indexOf("Folder") === -1 ? "file" : "folder");
                return r;
            },
            render: function () {
            	/** @overrides vcl/Control.prototype.render */
                //node.setText(root ? String.format("%H <span class='desc'>- %H</span>", item.name, item.uri) : item.name);
                var item = this.vars("resource") || {};
                if (this.hasClass("root")) {
                    this._nodes.text.innerHTML = String.format(
                    	"%H&nbsp;&nbsp;<span class='desc'>%H</span>", 
                    	item.name, 
                    	item.uri.replace(/^Workspaces\/[^\/]*\//, "../"));
                } else {
                    this._nodes.text.innerHTML = String.format("%H", item.name);
                }
            },
            onchange: function () {
                return this.fire("onChange", arguments);
            },
            setChecked: function (value) {
                this.nodeNeeded();
                this.getNode("checkbox").checked = value;
            },
            getChecked: function () {
                this.nodeNeeded();
                return this.getNode("checkbox").checked;
            }
        },
        properties: {
            onChange: {
                type: Type.EVENT
            },
            checked: {
            	type: Type.BOOLEAN,
            	get: Function,
            	set: Function
            }
        }
    }));
});