### `2025/04/02` 1.0.90

* Advancing
	* 20250403 adds new hotkeys for navigating .md resources updates coloring #title feature removes obsolete code
	* 20250403 updates and develops Editor<xsd>
	* 20250403 updates and finetunes devtools/Resources-classes
	* 20250403 updates and develops Alphaview to show loading state when promise-value is pending
	* 20250403 cosmetic
	* 20250403 updates editors xsd, var/log, md, html, csv and folder chsnges Markdown-renderer to marked (npm) adds support for initializing vars of linked components adds support for wrapping previewed html adds support for packages (folder)
	* 20241124 fixes case .shp files without .dbf
	* 20241123 replaces / for \ in pathnames, so folders in ZIP are supported, more or less (![20241123-205527-JRpq1i](https://raw.githubusercontent.com/relluf/screenshots/master/uPic/202411/20241123-205527-JRpq1i.png)) simplifies packageHandlers
	* 20241123 resolves all issues with folders in packages in packages in etc :-)
	* 20241123 findFileByPath => findPackageByPath
	* 20241122 extracts common logic for processing package entries into a reusable utility.
	* 20241122 optimizes directory traversal enhances readAllEntries and traverseEntry to handle large directories and batches, using Promise.allSettled to improve resilience
	* 20241122 centralizes Related File Handling adds support for Handler Dependency Injection moves handlers definitions down the file
	* 20241122 stabilizes features, one important feature is still missing and ie. folders in ZIP
	* 20241121 adds sqlite handler, but lacks modules and libraries still be get it up and running adds qgs and qmd extensions
	* 20241121 refactors module to be pluggable
	* 20241121 removes unnecessary code changes isPackage to be no more async (removed async-ness) implements qgz package
	* 20241121 fixes gz handler
	* 20241121 adds PackageHandlerRegistry for "customly" handling packages
	* 20241121 refactors and simplifies code fixes nested ZIP in ZIP fixes PDF nested in ZIP implements dropped://- in Editor<pdf> implements ZIP packages in Workspace navigator
	* 20241119 betters support for Console-node.key to ListColumn-content
	* 20241119 shows instantiated component/control when running component (Shift+Cmd+X)
	* 20241111 adds Alphaview to view tsv/csv data finetunes column headers


### `2024/11/08` 1.0.89

* Service build for cavalion-code
	* 20241108 adds support for linking to Library-based source files with curly brackets updates docs removes dead code
	* 20241108 gets rid of jquery-usage updates requirejs configs
	* 20241026 adds/starts support for Markdown-dialects
	* 20241026 updates the docs
	* 20241026 adds Res(ources).resolve makes all leaner and meaner removes jquery dependencies refactors js.override and js.inherited


### `2024/10/24` 1.0.88

* 20241024 adds support for ://-resources prevents reloading page without warning fixes a bug in DragDropHandler introducing cc()
* 20241012 adds opts to Resources.list() changes the rules for stealing the console bar updates styles in the Navigator
* 20241012 updates the docs
* 20241012 introduces devtools/Parser first commit
* 20241012 optimizes column width based on number of columns optimizes sorting values with Array.sortValues
* 20240919 identifies #ddh by name now (instead of uri/componentclass (although relative querying is now available)) adds/starts support for GDrive (first commit) adds/fixes support for ZIP-files implements event handlers for opening files adds support for opening files (Cmd+O) updates cavalion-devtools unit to be more useful
* 20240911 enhances support for packages and ZIP-files specifically adds support for arrayBuffer-manipulation
* 20240911 adds opts to get() - however, link() is necessary, I think
* 20240911 anticipates changes in Dropbox API updates style of caret in Navigator
* 20240908 adjusts to #ddh convention (query for name of DragDropHandler (which must be a singleton afterall) instead of its class (which must be allowed to change forpluggability)
* 20240908 optimizes handling of promises
* 20240908 adjusts to usage of latest ace-builds package
* 20240908 optimizes code
* 20240908 introduces Resources-ddh (refactor of -dropped-v2)
* 20240908 adds opts to list()
* 20240908 optimizes code
* 20240906 suggests client as default alignment
* 20240906 updating ace
* 20240906 developing Resources-dropped
* 20240906 starts refactoring/rewriting of Resources-dropped (AI-driven)
* 20240904 adds support for multiple selected values displays multiple tabs when multiple values are selected in linked Console
* 20240904 updates the docs
* 20240904 add support for workspace specific storageDB while referencing vcl-comps and cavalion-blocks in Mardkown documents names DragDropHandler ddh
* 20240904 introduces hotkey for aligning #ace client
* 20240904 fixes reading nil-reference
* 20240904 adds support for folders and packages (ZIP-files)


### `2024/07/07` 1.0.87 July Release

* Adds clipboard-copy 
* Allows to override allDroppedItems-determination 
* **Alphaview<>**
	* Develops features for Veldoffice-docs
	* Finetunes object browsing XP
	* Auto sizing for columns is adjusted according to number of columns (320, 500, 750) - fixes rendering #status
	* Fixes a bug where the tabs would not be reset correctly upon selection change
* **Resources-dropped**
	* Fixes issue with dropped resource where item.readerResult would be Promise
	* Anticipates non-existent dropped://-uris alt-key controls whether webkitdirectory-attribute is set, off by default improves drag/drop-resource experience dramatically fixes :root:root-sympton
* **Navigator**
	* Improves drag and drop handling
* **Editor**
	* Makes me wonder how it is possible this wasn't bugfixed before
* **Editor<xsd>**:
	* Fixes issues with references to elements within complex types definitions
* **Editor<xml>**:
	* Updates #print to use xml currently active in #ace

### `2024/05/20` 1.0.86 May Release

* Changes were made
* Bugs were fixed
* Features were added

### `2023/10/12` 1.0.85 October Release

* Finally (**!!!**) fixed focusing #ace upon Editor-tab change

### `2023/09/16` 1.0.84

- **Added**:
  - An evaluation mechanism with a return value.
  - Support for instantiating block components using Markdown anchors, enabling specific property value transfers.
  - Support for embedding block components within a Hover<> instance.
  - Interaction with .md and .smdl files and folders, introducing an Alt+Tap toggle behavior.
  - MetaCtrl+O shortcut to "drop" additional files in.
  - A reload action.
  - The smdl file format.
  - A cavalion-blocks feature.
  - The ✪ workspace.
  - Debugger tools for RequireJS.
  - A setting to keep Markdown sources hidden by default.
  - The latest dotted part of the name on the corresponding Tab.
  - The use of :: in Markdown-action links.
  - Filter and matching mechanisms.
  - The capability to override matching items using `vars.match_columns` and falling back to `vars.match` (utilized by ChatGPT viewer by falsifying `match_columns` and redefining `match`).
  - The `devtools/cavalion-devtools.js` file.
  - The initial version of `Main<bxv>`.
- **Developed**:
  - Drag-and-drop functionality for directories.
  - The ability to drop and open files in BXV.
  - Cavalion-blocks features, allowing the instantiation of Hover<> with specific block components using the <<[:]>> syntax.
  - The functionality to drag and drop files directly onto the map.
  - BXV by removing the Documenten workspace on startup.
- **Fixed**:
  - The primary workspace to display its tab in a unique manner.
  - Blocks and cavalion-blocks workspaces to support an alternative workspace UI.
  - A bug preventing certain characters from being filtered.
  - An issue where `top.document` access would throw an error when not allowed.
  - `#title` colors.
  - The silent tap issue.
- **Refactored**:
  - The hotkey functionality for resource-focus within the navigator.
  - Title-related classes.

### `2023/08/29` 1.0.83

* Publishing in favor of veldapps.com/bxv
* Adds debugging info for Keys
* Adds hotkey for focussing #q (filter dataset)
* Adjusts background styling

### `2023/03/30` - 1.0.82

* Adds Renderer<>/Util module;
* Refactores Editor<gds> and Renderer<gds> in order to support so called "settlement"- and "triaxial" test type automatically

### `2023/03/26` - 1.0.81

* 1291ab7 - develops VA-20230130-1
* ef04825 - first commit - starting development reporting triaxial tests from GDS-files
* b4f381d - removed (obsolete code)
* 992f002 - adds code for fetching PDF document
* 9a1dacc - fixes linking to :// fixes using the startsWithProtocol function adds some more padding
* dce4c7d - fixes the polluting the global namespace

### `2022/11/15` - 1.0.80

* Fixes a bug where null, 0 and false where treated as undefined
* Fixes a bug where not characters would be available to type in a search field
* Improves/updates editor-switch-favorite
* Iframe: Develops glassiness and animations Keys: fixes some bug where toasts would not disappear (correctly)

### `2022/10/30` - 1.0.79

* #VA-20221029-1 - Improves the use of backticks
* 87b9b4f - detects whether to automagically show the workspace console even better

### `2022/10/19` - 1.0.77

* #VA-20221010-1 - Restores adjustment "haakje terug Jaap" (Editor/Renderer<gds>)

### `2022/10/18` - 1.0.76

* #VA-20221010-1 - Restores the series with the verschoven zetting - which were accidently committed away
* 2fba8a5 - adds Ctrl+S => #editor-switch-favorite
* 539bc16 - cleans up some messy code
* 114a745 - adds an extra usage hint
* a947dc2 - updates css for inline images

### `2022/07/28` - 1.0.75

* 9a40b7d - fixes a crashing issue when a form could not be closed
* aae9402 - adds the double ShiftRight keyboard shortcut for CtrlCtrl-pane
* 40895e7 - fixes an crashing issue where _node was accessed while not being available yet (should use nodeNeeded() instead
* e1464ea - enhances image styling and classifications in Markdown code, introduces `${p(:)}` which greatly enhances possibilities with links and backticks Markdown code, constifies vars
* 5c6e43b - fixes an crashing issue where the selected control (ie. file or folder) was not available upon restoring state
* f2f0275 - fixes an issue where toasts could no longer be removed
* c309900 - reflect now returns a Promise
* 03b52ce - #q.placeholder reflects location in tree (more or less
* daf0f45 - enhances CSV generation, now conserving column headers and order

### `2022/06/27` - 1.0.74

* 0ceb90d - refactoring Cmd+.
* 60aae38 - enhancing Shift+Ctrl+S behaviour - toasting status and cycling through all .md files upon fastmultipress
* 095f59b - toast remain visible while modifiers are down (except for Meta/Cmd though) 
* 7d8eb3f - #editor-switch-favorite now cycles through all .md-files in workspace and remembers last selected entry
* 2c3a070 - fixes a bug where activating workspace Console while #left-sidebar is not shown yet, would show the Navigator underneath
 
### `2022/06/27` - 1.0.73

* d75591f - now also activating CtrlCtrl<>> by double fastpress of right Alt-key
* 6ae1aef - cosmetic / developing (finally!) - currently rendering a list of all within #editors-tabs nested vcl/ui/Tab

### `2022/05/15` - 1.0.72

* Adding devtools/Editor<yml>

### `2022/05/15` - 1.0.71

* a6e918e - developing support for styling images and scaling shortcuts (@Fx)
* a60eefd - cosmetic, ui improvements
* 4f6fda7 - refactoring Veldoffice workspace (session-bar is gone?) - refactoring vo/VO => veldoffice/VO
* 24be0e9 - style and cosmetic - more transparent - less code

### `2022/05/02` - 1.0.70

* 4f6fda7 - Veldoffice-workspace: #session-bar is gone (?) 
* 4f6fda7 - Refactoring vo/VO => veldoffice/VO
* 24be0e9 - Style and cosmetic changes, mainly more transparency and less code

### `2022/04/27` - 1.0.69

`#VA-20220427-1`

* Editor<xsd>: Incredible, but still true, fixed a bug concerning "sequence.sequence.element" definitions

### `2022/04/24` - 1.0.67-68

`#CVLN-20210102-2`

* Editor<svg>: enhancing previewing SVG graphic, now scrollable 
* Editor<html>: cleaning up Framework7 and pages/Controller references
* Editor<md>: advancing "link-features", dynamic titles and hrefs with backticks

### `2022/04/25` - 1.0.67

* Workspace<>#editor-switch-favorite: `vars(["#navigator favorites"])` can be inherited now

### `2022/04/22` - 1.0.66

`#CVLN-20210102-2`

* Editor<md>: Adding support for document-relative links ([for example](#2020-07-08)) _history-navigation-time!_
* 9f67437 - (origin/master, origin/HEAD) 1.0.66

### `2022/04/18` - 1.0.65

* eaeca9f - making background transparent where possible - preparing for embedding in Docs-like environment
* 5606ae4 - adding support for glassy iframes
* e648b3b - 1st commit - adding support for .markdown-extensioned files
* 50e1f1a - adding support for .markdown-extensioned files - chaning behaviour of rendered images

### `2022/04/15` - 1.0.64

* 8bc8d3e - (HEAD -> master, origin/master, origin/HEAD) adding support for a zoomC-orrection var 
* 1e37f63 - just refactoring a little 
* 4c79f00 - support for defining formVars as string

### `2022/04/06` - 1.0.63

* 46fe995 - 1st commit
* 8416504 - adding Ctrl+Shift+E alias for ...+S, macbook doesn't support the S it seems
* eb1dd78 - making linking to blocks less buggy
* 8cf5390 - commiting progress / developing / updating / bugfix in Editor<md> for linking to blocks
* 338fba4 - commiting progress / developing / updating
* 38b7fa9 - updating essential workspaces

### `2022/04/03` - 1.0.62

`#CVLN-20210102-2`

* Introducing [devtools/Alphaview.graph]([:])
* Fixes issues with linking to cavalion-blocks source (devtools/Editor<md>)
* Cleaning up some obsolete print-statements

### `2022/03/31` - 1.0.60

* Improved linking and inlining iframe and cavalion-blocks

### `2022/03/30`

* Improved Ctrl+F11 handling, ie. toggling workspace tabs

### `2022/03/29` - 1.0.59

`#CVLN-20210102-2`

* **Editor<md>**: Fix for linking to urls with a specific protocol (eg. pouchdb://) and for linking to current `va_objects` database (via `://`)

### `2022/03/28` - 1.0.57

`#CVLN-20210102-2`

* Improving devtools/Editor<md> - linking to [devtools/Editor<blocks>]([])-instances, optionally instantiating the component on load, eg:
	* [devtools/Alphaview]([!]) <- `[devtools/Alphaview]([!])`
* Alphaview: max-width for all lists
* Editor<csv>: now correctly determining headers

### `2022/03/10`

* Improving devtools/Editor<md> - linking to ?://-scheme while replacing : for anchor textContent

### `2022/01/25`

* Fix for `devtools/Editor<md>`, clicking on [pouchdb://]()-links now works as expected/wanted/desired, ie. a _Local Storage_-document

### `2022/01/25` - 1.0.56

* Fix for `devtools/Editor<tsv>` delimiter detection
* Now sorting numeric folders in reverse

>> ![image](https://user-images.githubusercontent.com/686773/150946933-030a45ad-40b9-4764-ae1b-00727512257b.png?2x)


### `2022/01/03` - 1.0.55

* Developing [Alphaview.preview](./src/cavalion-blocks/:.js)
* Introducing var "eval-context" for [Console](./src/vcl-comps/:.js)

### `2021/09/13` - 1.0.53

- Shared components have been refactored, adjustments have been made
- Alphaview/Graph-am: Updating and developing features
- Pasteboard: First commit
- Updating navigator images
- Editor<csv>: Adjustment for handling VAERS datasets
- Editor: Not opening files with extensions like zip.7z, Shapefiles

### `2021/09/13` - 1.0.52

* Updating

### `2021/08/16` - 1.0.50

* Developing Renderer<gds> in favor of `#VA-20201218-3`
* `#VA-20210816-1` Deduce/copy Axial Stress from Stress Target

### `2021/06/13` - 1.0.49

* Developing Renderer<gds> in favor of `#VA-20201218-3`

### `2021/06/09` - 1.0.48

* Publishing current version in favor af veldoffice.nl (`#VA-20201218-3`)

### `2021/05/26` - 1.0.47
* Introducing `devtools/Revisions` - hooking the Navigator
* Introducing **⌘.** (Cmd+<dot>)

### `2021/05/23` - 1.0.44

* Navigator: Adding `cascade-refresh` feature
* Allow for workspaces-tabs to have no tab selected (longpress/click)
* Updating YAML editor & some cosmetic changes were commmited
* NavigatorNode: Defining/centralizing folder and file icon

### `2021/05/14` - 1.0.43

* Better and more intuitive link handling (Editor<md>)
* Cleaning up, refactoring, SPN-feedback integrations `#VA-20201218-3`
* Even more lazy rendering (Renderer<gds>)

### `2021/04/17` - 1.0.42

* Developing Renderer<gds> in favor of `#VA-20201218-3`

### `2021/04/05` - 1.0.41

* Developing Renderer<gds> in favor of `#VA-20201218-3`

### `2021/03/18` - 1.0.40

* Persisting serialized SVG and calculated parameters as JSON document
* Finetuning chart generation

### `2021/03/15`

`#VA-20201218-3`

* Integrating feedback (Salvadar Paz Noriega)
* Corrected/updated Isotachen graph
* Serializing SVG to JSON

### `2021/03/11` - 1.0.39

`#VA-20201218-3`

* Fixes Taylor to work with a non-30-second interval data stream
* Finetuning some guidelines 

### `2021/03/10` - 1.0.38
- Developing `#VA-20201218-3`
- veldoffice-rapportage-vcl@v147

### `2021/03/07` - @1.0.37
- Developing `#VA-20201218-3`

### `2021/02/18` - @1.0.34
- Introducing `devtools/Renderer` and `devtools/Renderer<gds>` - `#VA-20201218-3`

### `2021/02/02`
- Fixes the un(listen)-crash of `devtools/Workspace` upon destroy

### `2021/01/26` - @1.0.33
- Fix for case-sensitivity of extensions

### `2021/01/25` - @1.0.32
- Housekeeping
- Removing obsolete sub-workspaces, 
- Improving `ace`-variable in consoles

### `2021/01/23` - @1.0.31
- Minor tweaks
- Publishing in favor of veldoffice-geografie-vcl

### `2021/01/12` - @1.0.30
- Alphaview: Routing navigation-keystrokes from filter-input to grid
- Keys: The logging of keystrokes has been enhanced significantly ;-)

### `2021/01/09` - @1.0.29
- Changes need to be committed still
- Updating veldapps.com

### `2021/01/06` - @1.0.28
`#CLVN-20210102-2`

* Adds anchor handling (in Markdown documents)

### `2021/01/03`

* Fixes a bug in [devtools/Editor<>](code:) where loading files without extension would potentially crash
* BUG devtools/Editor-tab-text: if no name and folder => use folder name

### `2021/01/02` - @1.0.26
`#TOFR-20210102-0`

- Improves the **Keys**-tool displaying human-readable names for keys and utilizing new App-toast features
- Adds CSV-export to the **AlphaView**-tool


### `2020-12-08` - @1.0.25
`#VA-20201207-1`

- Beautifying more XML-formats (although the formatter seems broken)

### `2020-12-04` - @1.0.24
- **Alphaview**: Improving/extending map_xy

### `2020-12-27` - @1.0.23
- ?

### `2020-11-22` - @1.0.22
- Introducing **devtools/OpenLayers<Documents>**
- tools/pouchdb/Sync: Pulling and pushing seems to be working now :-D

### `2020-11-?? `- @1.0.21
- ?

### `2020-11-16` - @1.0.20
- Developing Alphaview
	- Introducing print (MetaCtrl+Enter)
	- Adding support for single object selection(s)
	- Improving status info

### `2020-11-11` - @1.0.19
- Enhances/fixes rendering of the hashcode in editors-tabs - it will now always be visible
- Fixes a bug where images would not render in devtools/Editor<image>

### `2020-11-09` - @1.0.18
- Introducing: **Alphaview.js** 
- DragDropHandler: Finetuning after actually using it while dropping loads of images
- Editor<image>: Now playing nice with dropped images

### `2020-10-28`
- DragDropHandler: Finetuning dragleave => dragend

### `2020-10-24`
- Integrating (Arcadis-driven) new Editor<xml>-features (DetailViews)

### `2020-10-19` - @1.0.17
- Preparing for ElliTrack-specifics
- Updating devtools/Resources.prototype.index()
	- allowing single string as argument

### `2020-10-09` - @1.0.16
- **Workspace<VO>**: Developing VO object/workspace/namespace, seems the place to be hanging out lately
- **DragDropHandler**: Anticipating image/ content to be parsed as DataURL always
- **Editor<image>**:
	- Introducing new base for image/-contentTypes 
	- Changed implementation from css-background-image to `<img>`-element, for scrolling features and the likes _while we're at it_
- **Main**: Adding (opioniated) classes/colors for the title-element (eae, gx, veldapps, cavalion, etc)

### `2020-10-19` - @1.0.17
- Cosmetic changes
- Preparing for ElliTrack-specifics
- Improved Resources.prototype.index()

### `2020-10-?? `- @1.0.16
- ?

### `2020-10-08` - @1.0.15

- ImageParser: Now no more snag-gy-specific
- Introducing DragDropHandler-features (nodes) in Navigator
- advancing and fixing features for devtools/Editor<folder> <xml> and <blocks>

### `2020-10-02` - @1.0.14
* Updating NPM

### `2020-10-01` - @1.0.13
* Reducing jquery-dependencies
* Preparing the Outline for features where one can jump to the source
* Developing `devtools/Resources-dropped`
* Listing "Dropped Resources" in the Navigator
* Integrating pouchdb://-resources into Arcadis-workspace
* devtools/Editor<blocks>: Exposing root (exporting?)

### `2020-09-20` - @1.0.12
- Developing more Resources-dropbox features/implementation

### `2020-09-19`
- Adding Resources-dropbox implementation (works pretty neat nowadays :-))
- Round-tweaking styles of tabs

### `2020-09-18` - @1.0.11
- **Main**<>: Generalizing the title area

### `2020-09-14` - @1.0.10
- Enhanced Console, still feel the need to "centralize" often-used-code, in IPFS for example? Make snippets better and easily accessible

### `2020-09-11` - @1.0.9
- **Editor**<>: Adding more general information to alternate `#evaluate` output

### `2020-09-07` - @1.0.8
- **Editor<md>**: `#evaluate` now outs information about the parsed Markdown-document
- **Editor**<>: Working on `#evaluate`

### `2020-08-29`
* More improvements to editors-tabs features: show newly focused editors-tabs on hotkey navigation (up/down) 

### `2020-08-21` - @1.0.7
- Improved toggling the visibility of editor tabs and other  workspace tabs. When its hot key (Ctrl+F11 by default) is being pressed rapidly twice (ie. within 250 ms), the current editors-tabs will remain visible, while the others are hidden
- Using block-syntax in vcl-comps

>> ![](https://user-images.githubusercontent.com/686773/91371009-8a25ba00-e7d5-11ea-9a54-78eecce43f8e.png?2x)

### `2020-08-21` - @1.0.6
- Fixed the rendering of Navigator search-results
- Fixing behaviour of Cmd+Enter in several devtools/Editor<>-classes - the idea being that the content of the current appears "evaluated" in the console(s)

### `2020-08-15` - @1.0.5
- Advancing devtools/Editor making more use of the workspaces' console
- Cmd+[Alt+]Enter is "thabomb"

### `2020-08-03`
* **Editor**: Now persisting font-size over sessions

### `2020-08-02` - @1.0.4
* Fixing reload^H^H^H^Hfresh bug

### `2020-07-28` - @1.0.2
* Refactored class `opaque` to `opaque-50` to avoid a name/class-clash with `opaque`, which really means invisible (and seems to be defined all the "sudden" ;-))

### `2020-07-08`
* **Editor<blocks>**: Adding full-width support to preview
* **Editor<folder>**: Sorting dot-files first, then directories and then files in

### `2020-05-08`
* Initial coding, which is mostly taken from cavalion-code
