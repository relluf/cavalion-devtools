"use vcl/ui/Node";

var Node = require("vcl/ui/Node");

const resolveOutline = (tree) => tree.vars(["outline"]) ||
	tree.vars(["document"]) ||
	(tree.vars(["ace"]) && tree.vars(["ace"]).ud("#outline-proxy-generate").execute());

const createTreeNode = (owner, parent, item, index) => {
	var node = new Node(owner);
	var is_root = item.level === 1;
	var text = is_root ?
		String.format("<span class='label root'>%H</span>", item.text) :
		String.format("<span class='label'>%H</span>", item.text);

	node.setText(text);
	node.setVar("outline.node", item);
	node.setExpandable(!!(item.children && item.children.length));
	node.setParent(parent);
	node.addClass(js.sf("md-level-%d", item.level));
	if(is_root) {
		node.addClass("root");
		if(index > 0) {
			node.addClass("seperator");
		}
	}

	return node;
};

const populateTree = (owner, parent, items) => {
	(items || []).forEach((item, index) => {
		var node = createTreeNode(owner, parent, item, index);
		if(item.children && item.children.length) {
			populateTree(owner, node, item.children);
		}
	});
};

const expandParents = (node) => {
	while(node && node instanceof Node) {
		node.setExpanded(true);
		node = node.getParent();
	}
};

const findTreeNodeByKey = (tree, key) => tree.qsa("vcl/ui/Node")
	.find(node => js.get("key", node.vars(["outline.node"])) === key) || null;

const syncTreeSelection = (tree, outline) => {
	if(!outline || !outline.getActiveKey) {
		return;
	}

	var key = outline.getActiveKey();
	var node = key && findTreeNodeByKey(tree, key);
	if(node) {
		expandParents(node.getParent());
		tree.vars("outline.syncing-selection", true);
		tree.setSelection([node]);
		tree.makeVisible(node);
		tree.vars("outline.syncing-selection", false);
	}
};

const refreshTree = (tree) => {
	var outline = resolveOutline(tree);

	if(!outline) {
		return;
	}

	tree.vars("outline", outline);
	tree.destroyControls();
	tree.dispatch("nodesneeded", null);
	syncTreeSelection(tree, outline);
};


[(""), {
	css: {
		"": "background:#fff;min-width:420px;max-width:760px;padding:18px 18px 24px 18px;",
		".{Node}": {
			"font-family": "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
			"font-size": "11pt",
			"line-height": "1.35"
		},
		".{Node} > .icon": {
			"width": "26px",
			"background-position-x": "8px",
			"background-position-y": "11px"
		},
		".{Node} > .text": {
			"padding": "6px 10px 6px 0",
			"display": "inline-block"
		},
		".{Node} > .text > .label": {
			"font-weight": "500",
			"letter-spacing": "-0.01em"
		},
		".{Node}.selected > .text": {
			"background-color": "rgb(56,121,217)",
			"color": "white",
			"border-radius": "6px",
			"padding-left": "8px",
			"padding-right": "8px"
		},
		".{Node}.selected > .text > .label": {
			"font-weight": "600"
		},
		".{Node}.root": {
			"padding-top": "16px",
			"margin-top": "16px",
			"border-top": "1px solid #f0f0f0"
		},
		".{Node}.root:first-child": {
			"padding-top": "0",
			"margin-top": "0",
			"border-top": "none"
		},
		".{Node}.root > .icon": {
			"padding-top": "7px"
		},
		".{Node}.root > .text": {
			"font-size": "19pt",
			"line-height": "1.25",
			"font-weight": "700",
			"letter-spacing": "-0.02em",
			"padding": "16px 18px 18px 16px"
		},
		".{Node}.root > .selection": {
			"border-radius": "2px",
			"height": "72%",
			"top": "14%",
			"left": "0",
			"width": "7px"
		},
		".{Node}.root.selected > .icon": {
			"visibility": "hidden"
		},
		".{Node}.root.selected > .text": {
			"background-color": "transparent",
			"color": "black",
			"font-weight": "800",
			"padding-left": "16px",
			"padding-right": "18px"
		},
		".{Node}.md-level-2": {
			"margin-left": "38px"
		},
		".{Node}.md-level-3": {
			"margin-left": "78px"
		},
		".{Node}.md-level-4": {
			"margin-left": "118px"
		},
		".{Node}.md-level-5": {
			"margin-left": "158px"
		},
		".{Node}.md-level-6": {
			"margin-left": "198px"
		}
	},
	onLoad() {
		var ace = this.vars(["ace"]);
		var editor = ace && ace.getEditor ? ace.getEditor() : null;
		var schedule_refresh = () => this.setTimeout("refresh-outline", () => refreshTree(this), 140);
		var schedule_selection = () => this.setTimeout("sync-outline-selection",
			() => syncTreeSelection(this, resolveOutline(this)), 60);

		this.vars("outline", resolveOutline(this));
		if(editor) {
			editor.selection.on("changeCursor", schedule_selection);
			editor.session.on("change", schedule_refresh);
		}

		return this.inherited(arguments);
	},
	onNodesNeeded(parent) {
		var outline = resolveOutline(this);
		var nodes = outline && outline.getNodes ? outline.getNodes() : [];
		populateTree(this, parent || this, parent ? js.get("children", parent.vars(["outline.node"])) : nodes);
	},
	onSelectionChange() {
		if(this.vars(["outline.syncing-selection"]) === true) {
			return;
		}

		var selection = this.getSelection();
		var outline = resolveOutline(this);
		var node = selection && selection[0];
		var item = node && node.vars(["outline.node"]);

		if(outline && item && outline.navigate) {
			outline.navigate(item);
		}
	}
}];
