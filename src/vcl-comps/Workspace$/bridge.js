$([], {
	onLoad: function () {
        // bridge to cavalion-blocks (everything is in flux, blocks in emerging)
        var uri = js.sf("OpenLayers<%s>", this.getSpecializer());
        var me = this;
        
        // this' a fkn complicated setup vcl-comps -> cavalion-blocks
        
        B.instantiate(uri, { owner: this }).then(_ => {
        	_.setParent(this);
        	_.on("mapready", function() { me.emit("mapready"); });
        });
        
        return this.inherited(arguments);
    }
});