define(function(require) {
	"use strict";

	const marked = require("marked").marked;

	function images(source) {
		const found = [];
		const visit = (tokens, base, text) => {
			let cursor = 0;
			(tokens || []).forEach(token => {
				const raw = token.raw || "";
				let index = raw ? text.indexOf(raw, cursor) : -1;
				if(index < 0) index = cursor;
				const offset = base + index;
				cursor = index + raw.length;
				if(token.type === "image") {
					found.push({ offset: offset, text: token.text || token.href || "Afbeelding", href: token.href || "" });
					return;
				}
				if(token.type === "html") {
					const pattern = /<img\b[^>]*>/gi;
					let match;
					while((match = pattern.exec(raw))) {
						const src = /\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(match[0]);
						const alt = /\balt\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(match[0]);
						const href = src && (src[1] || src[2] || src[3]) || "";
						found.push({ offset: offset + match.index, text: alt && (alt[1] || alt[2] || alt[3]) || href || "Afbeelding", href: href });
					}
				}
				if(token.tokens) visit(token.tokens, offset, raw);
				if(token.items) visit(token.items, offset, raw);
			});
		};
		visit(marked.lexer(source), 0, source);
		return found.sort((a, b) => a.offset - b.offset).map(item => {
			const before = source.slice(0, item.offset).split("\n");
			item.row = before.length - 1;
			item.column = before[before.length - 1].length;
			return item;
		});
	}

	return { images: images };
});
