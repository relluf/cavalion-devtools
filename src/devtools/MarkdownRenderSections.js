define(function() {

	const splitLines = value => String(value || "").split("\n");
	const headingSignature = headings => (headings || [])
		.map(heading => [heading.key, heading.level, heading.text].join("|"))
		.join("\n");
	const changedRange = (before, after) => {
		const oldLines = splitLines(before);
		const newLines = splitLines(after);
		let start = 0;
		let oldEnd = oldLines.length - 1;
		let newEnd = newLines.length - 1;

		while(start <= oldEnd && start <= newEnd && oldLines[start] === newLines[start]) ++start;
		while(oldEnd >= start && newEnd >= start && oldLines[oldEnd] === newLines[newEnd]) {
			--oldEnd;
			--newEnd;
		}

		return { start, oldEnd: Math.max(start, oldEnd), newEnd: Math.max(start, newEnd) };
	};
	const topLevelSections = (headings, lineCount) => {
		let minimum = 7;

		(headings || []).forEach(heading => minimum = Math.min(minimum, heading.level));
		const top = (headings || []).filter(heading => heading.level === minimum);
		return top.map((heading, index) => {
			const next = top[index + 1];
			return {
				key: heading.key,
				row: heading.row,
				endRow: next ? next.row - 1 : Math.max(heading.row, lineCount - 1)
			};
		});
	};
	const sectionAt = (sections, start, end) => sections.find(section =>
		start > section.row && start <= section.endRow && end <= section.endRow);
	const hasGlobalDefinitions = value => /^(?: {0,3})\[(?:\^)?[^\]]+\]:/m.test(value || "");
	const hasUnsafeChangedSyntax = value => /^(?: {0,3})(?:#{1,6}(?:\s|$)|[`~]{3,}|<\/?(?:address|article|aside|base|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul)(?:\s|>|\/?>))/im.test(value || "");

	const plan = (before, after, beforeHeadings, afterHeadings) => {
		if(before === after) return { mode: "none", reason: "unchanged" };
		if(!before || !beforeHeadings || beforeHeadings.length === 0) {
			return { mode: "full", reason: "no-baseline" };
		}
		if(headingSignature(beforeHeadings) !== headingSignature(afterHeadings)) {
			return { mode: "full", reason: "heading-structure" };
		}
		if(hasGlobalDefinitions(before) || hasGlobalDefinitions(after)) {
			return { mode: "full", reason: "global-definition" };
		}

		const range = changedRange(before, after);
		const oldLines = splitLines(before);
		const newLines = splitLines(after);
		const changedText = oldLines.slice(range.start, range.oldEnd + 1)
			.concat(newLines.slice(range.start, range.newEnd + 1)).join("\n");
		if(hasUnsafeChangedSyntax(changedText)) {
			return { mode: "full", reason: "structural-syntax" };
		}

		const oldSection = sectionAt(topLevelSections(beforeHeadings, oldLines.length),
			range.start, range.oldEnd);
		const newSection = sectionAt(topLevelSections(afterHeadings, newLines.length),
			range.start, range.newEnd);
		if(!oldSection || !newSection || oldSection.key !== newSection.key) {
			return { mode: "full", reason: "section-boundary" };
		}

		return {
			mode: "section",
			reason: "local-section",
			key: oldSection.key,
			range
		};
	};

	return {
		changedRange,
		topLevelSections,
		hasGlobalDefinitions,
		hasUnsafeChangedSyntax,
		plan
	};
});
