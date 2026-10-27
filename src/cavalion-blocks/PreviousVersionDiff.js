"use vcl/ui/Ace";

var label = version => js.sf("%H — %H — %H",
	version.side,
	version.revision || version.side,
	version.capturedAt || "");

["Container", {
	width: 1000,
	height: 620,
	classes: "previous-version-diff",
	css: {
		"background-color": "white",
		"min-width": "720px",
		"min-height": "420px",
		".version-pane": "min-width:280px;",
		".version-label": "height:28px;padding:6px 10px;box-sizing:border-box;background:#f3f3f3;border-bottom:1px solid #ccc;font-weight:bold;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;",
		".previous-pane": "border-right:1px solid #bbb;"
	},
	onLoad() {
		var scope = this.scope();
		var previous = this.vars(["previous"]);
		var current = this.vars(["current"]);
		var mode = this.vars(["mode"]);
		var left = scope["previous-ace"];
		var right = scope["current-ace"];
		var syncing = false;
		var sync = (source, target) => {
			if(syncing) return;
			syncing = true;
			target.getEditor().session.setScrollTop(source.getEditor().session.getScrollTop());
			target.getEditor().session.setScrollLeft(source.getEditor().session.getScrollLeft());
			syncing = false;
		};
		var bindScroll = (source, target) => {
			var session = source.getEditor().session;
			var handler = () => sync(source, target);
			session.on("changeScrollTop", handler);
			session.on("changeScrollLeft", handler);
			source.once("destroy", () => {
				session.off("changeScrollTop", handler);
				session.off("changeScrollLeft", handler);
			});
		};

		scope["previous-label"].setContent(label({
			side: "previous",
			revision: previous.revision,
			capturedAt: previous.capturedAt
		}));
		scope["current-label"].setContent(label({
			side: "current",
			revision: current.revision,
			capturedAt: current.capturedAt
		}));
		left.setValue(previous.text);
		right.setValue(current.text);
		mode && left.getEditor().session.setMode(mode);
		mode && right.getEditor().session.setMode(mode);
		left.getEditor().setReadOnly(true);
		right.getEditor().setReadOnly(true);
		left.markDiffs(current.text);
		right.markDiffs(previous.text);
		bindScroll(left, right);
		bindScroll(right, left);

		return this.inherited(arguments);
	}
}, [
	["Container", { align: "left", width: 500, classes: "version-pane previous-pane" }, [
		["Element", "previous-label", { align: "top", classes: "version-label" }],
		["vcl/ui/Ace", "previous-ace", { align: "client" }]
	]],
	["Container", { align: "client", classes: "version-pane current-pane" }, [
		["Element", "current-label", { align: "top", classes: "version-label" }],
		["vcl/ui/Ace", "current-ace", { align: "client" }]
	]]
]];
