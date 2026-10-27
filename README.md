# cavalion-devtools

Package containing the core components for [cavalion-code](https://github.com/relluf/cavalion-code). 

## Active editor server changes

The visible, selected editor checks its resource revision immediately after activation and every five seconds while it remains active. The monitor follows both the editor form lifecycle and the browser document lifecycle rather than `#ace.onLoad`: it pauses while the window is blurred or the document is hidden, resumes with an immediate check on focus/visibility, and guards the revision request itself against delayed background timers. Specialized editors can therefore replace their Ace initialization and Markdown can hide its source pane without disabling revision checks. Resource providers expose their authoritative lightweight version where available: filesystem and PouchDB revisions, Dropbox `rev`, GitHub blob `sha`, and Google Drive version metadata. Providers without a metadata operation fall back to their existing resource read; filesystem metadata polls explicitly bypass the HTTP cache.

When the revision changes, the editor always asks before reloading. A dirty editor gets an explicit warning that reloading discards its local changes. Rejecting the reload keeps the local content and suppresses further dialogs for that same remote revision; a later remote revision can prompt again. Polling stops when the editor is hidden or destroyed, concurrent checks are coalesced, and successful reloads and saves refresh the remembered revision.

Immediately before a confirmed remote reload, the tab captures its current text, revision and timestamp as an in-memory `previous known version`. The tab chevron then exposes `Diff with Previous Version`, which opens a non-destructive `Hover<>` with read-only previous/current Ace editors, semantic change markers and synchronized scrolling. A later confirmed reload replaces the single snapshot; closing the editor discards it. This is separate from the persistent editor/UI state shown by `Open Revisions`.

An already running Code instance needs a full page reload after updating this package because existing editor forms keep their original lifecycle handlers. The source-served `/code/src/` application loads these AMD modules directly and does not require regenerating `app.js` or `lib.js`; bundled deployments still use their normal build step.

## Markdown source locations

Local Markdown links can carry a one-based source line and optional column without making the location part of the resource URI:

```md
[foo.js](src/foo.js:123)
[foo.js](src/foo.js:123:9)
[foo.js](:123)
```

Only an unescaped terminal `:<line>` or `:<line>:<column>` consisting of positive decimal integers is a source location. Existing description substitution remains unchanged for empty and non-numeric suffixes. Combining both features uses two colons because the location is removed first:

```md
[README.md](src/:)       <!-- src/README.md -->
[foo](src/:.js)          <!-- src/foo.js -->
[foo.js](src/::123)      <!-- src/foo.js, line 123 -->
[2026](issues/:/123)     <!-- issues/2026/123, no source location -->
```

Use `%3A` for a literal colon in a resource name, especially before terminal digits: `[snapshot:123](snapshots/snapshot%3A123)`. External URLs and `#heading` links do not acquire source locations. When opened, the workspace keeps the resolved resource URI clean, activates the existing or new editor tab, bounds the requested position to the document, centers the caret and focuses Ace.

## Resources

* [src/devtools/]()
	* [Resources.js](src/devtools/:)
		* [Resources-node.js](src/devtools/:)
		* [Resources-tomcat.js](src/devtools/:)
		* [Resources-dropbox.js](src/devtools/:)
		* [Resources-dropped.js](src/devtools/:)
		* [Resources-pouchdb.js](src/devtools/:)

## Components

* [src/vcl-comps](:/) - [src/cavalion-blocks](:/)

![](https://camo.githubusercontent.com/6d1b42fd20ea0ee599f5143c5511c605e59fcfb6/687474703a2f2f72656c6c75662e6e6c2f636176616c696f6e2d69636f6e2e706e67)


* Split of from cavalion-code/src/vcl-comps
* Developing tools
	* Alphaview => Alpha?
	* Graph
	* Keys
	* ...
