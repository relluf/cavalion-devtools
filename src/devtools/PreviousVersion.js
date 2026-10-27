define(function(require) {
	var VAR = "previousKnownVersion";
	var get = tab => tab && tab.vars && tab.vars([VAR]);

	return {
		VAR: VAR,
		capture(text, revision, capturedAt, nextRevision) {
			return {
				text: String(text === undefined ? "" : text),
				revision: revision || "previous",
				capturedAt: capturedAt || new Date().toISOString(),
				nextRevision: nextRevision || "current"
			};
		},
		remember(tab, snapshot) {
			tab.vars(VAR, snapshot);
			return snapshot;
		},
		get: get,
		has(tab) {
			var snapshot = get(tab);
			return !!(snapshot && typeof snapshot.text === "string");
		},
		view(tab, currentText, currentRevision) {
			var previous = get(tab);
			return previous && {
				previous: previous,
				current: {
					text: String(currentText === undefined ? "" : currentText),
					revision: currentRevision || previous.nextRevision || "current",
					capturedAt: new Date().toISOString()
				}
			};
		},
		clear(tab) {
			if(tab && tab.removeVar) tab.removeVar(VAR);
		}
	};
});
