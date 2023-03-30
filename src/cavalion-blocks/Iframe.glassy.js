var WIDTH = 985, HEIGHT = 700;

function e(e, o, t, i) {
    for (; o >= t && !e("(min-resolution: " + o / i + "dppx)").matches;) o--;
    return o;
}
function o(o) {
    if (void 0 === o && (o = window), !o) return 1;
    if (void 0 !== o.devicePixelRatio) return o.devicePixelRatio;
    var t = o.document.frames;
    return void 0 !== t ? void 0 !== t.devicePixelRatio ? t.devicePixelRatio : t.screen.deviceXDPI / t.screen.systemXDPI : void 0 !== o.matchMedia ?
    function (o) {
        for (var t = o.matchMedia, i = 10, r = .1, n = 1, c = i, d = 0; d < 4; d++) i = (c = 10 * e(t, i, r, n)) + 9,
        r = c,
        n *= 10;
        return c / n
    } (o) : 1
}
function elementZoomLevel(e, t) {
    var i = (e instanceof Element ? getComputedStyle(e).zoom : e.zoom) || 1;
    return o(t) * ("string" == typeof i ? parseFloat(i) : i);
}
function zoomLevel() {
	return o.apply(this, arguments) / 2;
}

// Maybe introduce a .zoomy class?

[("devtools/Iframe"), {
	autoSize: "both", autoPosition: "all", align: "none",
	classes: "right",
	css: {
		"": {
			// "pointer-events": "none",
			"flex-shrink": "0",
			"box-shadow": "0 0 20px 10px rgba(0,0,0,.2)",
			"width": "90%",//WIDTH + "px",
			"height": HEIGHT + "px",
			"top": "5%", 
			"border-radius": "25px",
			"background": "transparent",
			"align-self": "center",
			"box-sizing": "border-box",
			"z-index": "1999",
			// "border": "3px solid rgba(0,0,0,0.05)",
			"transition": "transform 0.45s ease 0s, right 0.45s ease 0s, bottom 0.45s ease 0s, width 0.45s ease 0s, border-width 0.45s ease 0s"
		},
		
		".wrapper": {
			"position": "relative",
			"border-radius": "20px",
			"border": "7px solid rgba(0,0,0,0)",
			"overflow": "hidden",
			"height": "100%"
		},
		"&.glassy-overlay > .wrapper.no-margin": "margin:0;",
		"&.right": "right: 5%; transform-origin: top right;",
		"&.left": "left: 5%; transform-origin: top left;",
		"&:not(:hover)": "margin-left:1px; transform: translate3d(75%, 0, 0);"
	},

	onLoad() {
		// var win = this.app().qs("#window");
		this.override({
	        renderZoom: function() {
	        	/** @required: this._node */
	        	var zoomed = this.hasOwnProperty("_zoom");
	        	var style = this._node.style;
	        	if(zoomed) {
	        		var cs = this.getComputedStyle();
	        		//this.print("cs-transform", cs.transform);
	        		if(parseInt(cs.marginLeft, 10) === 1) {
	    				style.transform = String.format("scale3d(%s, %s, 1)", this._zoom, this._zoom);
	        		} else {
	    				style.transform = String.format("translate3d(75%, 0, 0) scale3d(%s, %s, 1)", this._zoom, this._zoom);
	        		}
	        	} else {
	        		style.transform = "";
	        	}
	        }
		});
		this.addClasses("glassy glassy-overlay");
		return this.inherited(arguments);
	},
	onDestroy() { 
		this.app().qs("#window").un(this.vars("listener")); 
	},
	onRender() {
		var src = this.vars(["frame-src"]) || this.getSpecializer();
		this._node.innerHTML = js.sf("<div class='glassy wrapper no-margin'><iframe src='%s'></iframe></div>", src);
		if(this.up("vcl/ui/Form").getParam("run") === true) {
			this.udr("#bottom-tabs").set("css", "display:none;height:0;"); 
		}
	},
	onNodeCreated() {
// return this.inherited(arguments);
		var zoomC = this.vars("zoomC") || 1; // TODO find better name
		var win = this.app().qs("#window");
		this.set("parent", win);

		var zoom0 = zoomLevel() * zoomC, width0 = win._node.clientWidth;
		this.print("zoom0 / width0", js.sf("%s / %s", zoom0, width0));
		
		this.set("zoom", 1 / zoom0);

		this.vars("listener", win.on("resize", () => {
			var zoom = zoomLevel() * zoomC, width = win._node.clientWidth;

			if(zoom0 !== zoom) {
				this.set("zoom", zoom0 / zoom);
			} else {
				this.set("zoom", 1);
			}
			
this.setTimeout("move", () => {
			// # CVLN-20220401-1-Panel-zoom-property	
			this._node.style.bottom = "";
			this._node.style.right = "";
}, 1000);

		}));

this.setTimeout("move", () => {
			// #CVLN-20220401-1
			this._node.style.bottom = "";
			this._node.style.right = "";
	
}, 1000);
		
		return this.inherited(arguments);
	},
	// onMouseOut() {
	// 	this.print("out");
	// 	while(this.hasClass("hovered")) this.removeClass("hovered");
	// },
	// onMouseOver() {
	// 	this.print("over");
	// 	if(!this.hasClass("hovered")) {
	// 		this.addClass("hovered");
	// 	}
	// },
	// onMouseMove() {
	// 	this.print("move");
	// 	if(!this.hasClass("hovered")) {
	// 		this.addClass("hovered");
	// 	}
	// },
	
	// vars: {'frame-src': "/home/Workspaces/veldapps.com/V7/src" }
	
}];