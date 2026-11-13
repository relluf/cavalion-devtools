"use devtools/MarkdownImages, devtools/cavalion-md";

const MarkdownImages = require("devtools/MarkdownImages");
const Md = require("devtools/cavalion-md");

["Container", {
	align: "client",
	css: {
		"": "background:white;overflow:auto;padding:20px 8px 8px;",
		"button": "display:block;width:100%;padding:6px;text-align:left;overflow-wrap:anywhere;border:0;background:transparent;cursor:pointer;",
		"button img": "display:block;max-width:100%;max-height:160px;margin:0 auto 4px;object-fit:contain;",
		"button:hover,button:focus": "background:#e9eef8;"
	},
	onLoad() {
		const ace = this.vars(["ace"]);
		const editor = ace.getEditor();
		const refresh = () => this.setTimeout("images-refresh", () => {
			const node = this.nodeNeeded();
			node.textContent = "";
			const entries = MarkdownImages.images(ace.getValue());
			if(!entries.length) node.textContent = "Geen afbeeldingen";
			entries.forEach((item, index) => {
				const button = document.createElement("button");
				const image = document.createElement("img");
				const label = document.createElement("span");
				const resource = ace.vars(["resource"]) || {};
				button.type = "button";
				image.alt = item.text;
				image.loading = "lazy";
				image.src = item.href.indexOf(":") === -1 && resource.uri ?
					"/home/" + js.up(resource.uri) + "/" + item.href : item.href;
				label.textContent = item.text;
				button.appendChild(image);
				button.appendChild(label);
				button.title = item.href;
				button.addEventListener("click", () => {
					const root = ace.up();
					Md.flushMarkdownRender(ace, "image-navigation");
					editor.gotoLine(item.row + 1, item.column, true);
					if(root.vars(["md-source-visible"]) !== false) ace.setFocus();
					ace.setTimeout("sync-preview-to-editor", () => {
						const output = root.ud("#output") || root.ud("#preview");
						const preview = output && output.nodeNeeded();
						if(!preview || typeof output.isVisible === "function" && output.isVisible() === false) return;
						const occurrence = entries.slice(0, index).filter(entry => entry.href === item.href).length;
						const matches = Array.from(preview.querySelectorAll("img"))
							.filter(candidate => candidate.src === image.src);
						const target = matches[occurrence];
						if(!target) return;
						const parents = [];
						let parent = target.parentElement;
						while(parent && parent !== preview) {
							parents.push(parent);
							parent = parent.parentElement;
						}
						parents.reverse().forEach(parent => {
							if(parent.classList.contains("md-section") && parent.classList.contains("collapsed")) {
								Md.setSectionCollapsed(ace, parent, false);
							} else if(parent.classList.contains("md-folder") && parent.classList.contains("collapsed")) {
								Md.setFolderCollapsed(ace, parent, false);
							}
						});
						const imageRect = target.getBoundingClientRect();
						const previewRect = preview.getBoundingClientRect();
						preview.scrollTop += imageRect.top - previewRect.top - (preview.clientHeight - imageRect.height) / 2;
					}, 80);
				});
				node.appendChild(button);
			});
		}, 100);
		editor.session.on("change", refresh);
		this.once("destroy", () => editor.session.off("change", refresh));
		refresh();
		return this.inherited(arguments);
	}
}];
