[["devtools/Editor<xml>"], [
    [("#render"), {
    	onExecute: function() {
        	var scope = this.scope();
			scope.preview.getNode().innerHTML = scope.ace.getValue();
            return this.inherited(arguments);
    	}
    }],
	[("#console"), {
		align: "top", autoSize:"height",
		visible: false
	}],
    [("#output"), [
	    ["vcl/ui/Panel", "preview_wrapper", { align: "client" }, [
		    ["vcl/ui/Panel", "preview", { align: "client", css: "text-align: center; padding-top: 10%;" }]
	    ]]
    ]],
    [("#tabs"), [
    	["vcl/ui/Tab", { text: locale("Preview"), control: "preview", selected: true }]
    ]],
]];