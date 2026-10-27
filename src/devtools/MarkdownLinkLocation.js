define(function() {

	const LITERAL_COLON = "\uE000";
	const external = href => /^(?:https?|file|ftp|codex):\/\//.test(href) || href.startsWith("///");
	const protectLiteralColons = href => String(href || "")
		.replace(/%253A/ig, LITERAL_COLON)
		.replace(/%3A/ig, LITERAL_COLON);
	const restoreLiteralColons = href => String(href || "").split(LITERAL_COLON).join(":");
	const decodeHref = (href, decode) => {
		href = protectLiteralColons(href);
		return (decode || (value => value))(href);
	};
	const parse = href => {
		let match;

		href = String(href || "");
		if(href.charAt(0) === "#" || external(href)) return { href: href };

		match = href.match(/^(.*):([1-9][0-9]*):([1-9][0-9]*)$/);
		if(match) {
			return {
				href: match[1],
				position: { line: parseInt(match[2], 10), column: parseInt(match[3], 10) }
			};
		}

		match = href.match(/^(.*):([1-9][0-9]*)$/);
		return match ? {
			href: match[1],
			position: { line: parseInt(match[2], 10) }
		} : { href: href };
	};
	const format = (href, position) => {
		href = restoreLiteralColons(href);
		if(!(position && position.line)) return href;
		return href + ":" + position.line + (position.column ? ":" + position.column : "");
	};

	return {
		LITERAL_COLON,
		decodeHref,
		external,
		format,
		parse,
		protectLiteralColons,
		restoreLiteralColons
	};
});
