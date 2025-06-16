"use js";

[("devtools/Iframe"), {
	css: {
		"iframe": "border-radius: 20px; overflow:hidden;",
		'&.phone': "width: 389px;",
		"&.right": {
			'': "right: 5%; transform-origin: top right;",
			// "&:not(:hover)": "margin-left:1px; transform: translate3d(75%, 0, 0);"
		},
		"&.left": {
			'': "left: 5%; transform-origin: top left;",
		}
	},
	// classes: "right phone"
}];