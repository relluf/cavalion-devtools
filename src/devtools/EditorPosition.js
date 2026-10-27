define(function() {

	const PENDING_VAR = "open-position";
	const READY_VAR = "editor-position-ready";
	const INITIALIZED_VAR = "editor-position-initialized";
	const normalize = (position, editor) => {
		let line = Number(position && position.line);
		let column = position && position.column;
		let line_count, text;

		if(Number.isInteger(line) === false || line < 1) return null;
		line_count = editor.session && editor.session.getLength ? editor.session.getLength() : line;
		line = Math.min(line, Math.max(1, line_count || 1));

		if(column === undefined) {
			column = 0;
		} else {
			column = Number(column);
			if(Number.isInteger(column) === false || column < 1) return null;
			column -= 1;
			text = editor.session && editor.session.getLine ? editor.session.getLine(line - 1) : null;
			if(typeof text === "string") column = Math.min(column, text.length);
		}

		return { line: line, column: column };
	};
	const reveal = (tab, position) => {
		const ace = tab && tab.qs && tab.qs("#ace");
		const editor = ace && ace.getEditor && ace.getEditor();
		const normalized = editor && normalize(position, editor);

		if(!normalized) return null;
		editor.gotoLine(normalized.line, normalized.column, true);
		editor.clearSelection && editor.clearSelection();
		if(editor.centerSelection) {
			editor.centerSelection();
		} else if(editor.renderer && editor.renderer.scrollCursorIntoView) {
			editor.renderer.scrollCursorIntoView();
		}
		if(ace.setFocus) ace.setFocus();
		else if(editor.focus) editor.focus();
		return normalized;
	};
	const queue = (tab, position) => {
		if(!(tab && position)) return null;
		if(tab.vars([READY_VAR]) === true) {
			tab.setTimeout("reveal-open-position", () => reveal(tab, position), 0);
		} else {
			tab.vars(PENDING_VAR, position);
		}
		return position;
	};
	const revealPending = tab => {
		const position = tab && tab.removeVar && tab.removeVar(PENDING_VAR);
		return position ? reveal(tab, position) : null;
	};

	return { INITIALIZED_VAR, PENDING_VAR, READY_VAR, normalize, queue, reveal, revealPending };
});
