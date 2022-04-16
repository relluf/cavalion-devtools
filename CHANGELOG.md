### 2022/04/15 - 1.0.64

* 8bc8d3e - (HEAD -> master, origin/master, origin/HEAD) adding support for a zoomC-orrection var 
* 1e37f63 - just refactoring a little 
* 4c79f00 - support for defining formVars as string

### 2022/04/06 - 1.0.63

* 46fe995 - (HEAD -> master) 1st commit
* 8416504 - adding Ctrl+Shift+E alias for ...+S, macbook doesn't support the S it seems
* eb1dd78 - making linking to blocks less buggy
* 8cf5390 - commiting progress / developing / updating / bugfix in Editor<md> for linking to blocks
* 338fba4 - commiting progress / developing / updating
* 38b7fa9 - updating essential workspaces

### 2022/04/03 - 1.0.62

`#CVLN-20210102-2`

* Introducing [devtools/Alphaview.graph]([:])
* Fixes issues with linking to cavalion-blocks source (devtools/Editor<md>)
* Cleaning up some obsolete print-statements

### 2022/03/31 - 1.0.60

* Improved linking and inlining iframe and cavalion-blocks

### 2022/03/30

* Improved Ctrl+F11 handling, ie. toggling workspace tabs

### 2022/03/29 - 1.0.59

`#CVLN-20210102-2`

* **Editor<md>**: Fix for linking to urls with a specific protocol (eg. pouchdb://) and for linking to current `va_objects` database (via `://`)

### 2022/03/28 - 1.0.57

`#CVLN-20210102-2`

* Improving devtools/Editor<md> - linking to [devtools/Editor<blocks>]([])-instances, optionally instantiating the component on load, eg:
	* [devtools/Alphaview]([!]) <- `[devtools/Alphaview]([!])`
* Alphaview: max-width for all lists
* Editor<csv>: now correctly determining headers

### 2022/03/10

* Improving devtools/Editor<md> - linking to ?://-scheme while replacing : for anchor textContent

### 2022/01/25

* Fix for `devtools/Editor<md>`, clicking on [pouchdb://]()-links now works as expected/wanted/desired, ie. a _Local Storage_-document

### 2022/01/25 - 1.0.56

* Fix for `devtools/Editor<tsv>` delimiter detection
* Now sorting numeric folders in reverse

>> ![image](https://user-images.githubusercontent.com/686773/150946933-030a45ad-40b9-4764-ae1b-00727512257b.png?2x)


### 2022/01/03 - 1.0.55

* Developing [Alphaview.preview](./src/cavalion-blocks/:.js)
* Introducing var "eval-context" for [Console](./src/vcl-comps/:.js)

### 2021/09/13 - 1.0.53

- Shared components have been refactored, adjustments have been made
- Alphaview/Graph-am: Updating and developing features
- Pasteboard: First commit
- Updating navigator images
- Editor<csv>: Adjustment for handling VAERS datasets
- Editor: Not opening files with extensions like zip.7z, Shapefiles

### 2021/09/13 - 1.0.52

* Updating

### 2021/08/16 - 1.0.50

* Developing Renderer<gds> in favor of `#VA-20201218-3`
* `#VA-20210816-1` Deduce/copy Axial Stress from Stress Target

### 2021/06/13 - 1.0.49

* Developing Renderer<gds> in favor of `#VA-20201218-3`

### 2021/06/09 - 1.0.48

* Publishing current version in favor af veldoffice.nl (`#VA-20201218-3`)

### 2021/05/26 - 1.0.47
* Introducing `devtools/Revisions` - hooking the Navigator
* Introducing **⌘.** (Cmd+<dot>)

### 2021/05/23 - 1.0.44

* Navigator: Adding `cascade-refresh` feature
* Allow for workspaces-tabs to have no tab selected (longpress/click)
* Updating YAML editor & some cosmetic changes were commmited
* NavigatorNode: Defining/centralizing folder and file icon

### 2021/05/14 - 1.0.43

* Better and more intuitive link handling (Editor<md>)
* Cleaning up, refactoring, SPN-feedback integrations `#VA-20201218-3`
* Even more lazy rendering (Renderer<gds>)

### 2021/04/17 - 1.0.42

* Developing Renderer<gds> in favor of `#VA-20201218-3`

### 2021/04/05 - 1.0.41

* Developing Renderer<gds> in favor of `#VA-20201218-3`

### 2021/03/18 - 1.0.40

* Persisting serialized SVG and calculated parameters as JSON document
* Finetuning chart generation

### 2021/03/15

`#VA-20201218-3`

* Integrating feedback (Salvadar Paz Noriega)
* Corrected/updated Isotachen graph
* Serializing SVG to JSON

### 2021/03/11 - 1.0.39

`#VA-20201218-3`

* Fixes Taylor to work with a non-30-second interval data stream
* Finetuning some guidelines 

### 2021/03/10 - 1.0.38
- Developing `#VA-20201218-3`
- veldoffice-rapportage-vcl@v147

### 2021/03/07 - @1.0.37
- Developing `#VA-20201218-3`

### 2021/02/18 - @1.0.34
- Introducing `devtools/Renderer` and `devtools/Renderer<gds>` - `#VA-20201218-3`

### 2021/02/02
- Fixes the un(listen)-crash of `devtools/Workspace` upon destroy

### 2021/01/26 - @1.0.33
- Fix for case-sensitivity of extensions

### 2021/01/25 - @1.0.32
- Housekeeping
- Removing obsolete sub-workspaces, 
- Improving `ace`-variable in consoles

### 2021/01/23 - @1.0.31
- Minor tweaks
- Publishing in favor of veldoffice-geografie-vcl

### 2021/01/12 - @1.0.30
- Alphaview: Routing navigation-keystrokes from filter-input to grid
- Keys: The logging of keystrokes has been enhanced significantly ;-)

### 2021/01/09 - @1.0.29
- Changes need to be committed still
- Updating veldapps.com

### 2021/01/06 - @1.0.28
`#CLVN-20210102-2`

* Adds anchor handling (in Markdown documents)

### 2021/01/03

* Fixes a bug in [devtools/Editor<>](code:) where loading files without extension would potentially crash
* BUG devtools/Editor-tab-text: if no name and folder => use folder name

### 2021/01/02 - @1.0.26
`#TOFR-20210102-0`

- Improves the **Keys**-tool displaying human-readable names for keys and utilizing new App-toast features
- Adds CSV-export to the **AlphaView**-tool


### 2020-12-08 - @1.0.25
`#VA-20201207-1`

- Beautifying more XML-formats (although the formatter seems broken)

### 2020-12-04 - @1.0.24
- **Alphaview**: Improving/extending map_xy

### 2020-12-27 - @1.0.23
- ?

### 2020-11-22 - @1.0.22
- Introducing **devtools/OpenLayers<Documents>**
- tools/pouchdb/Sync: Pulling and pushing seems to be working now :-D

### 2020-11-?? - @1.0.21
- ?

### 2020-11-16 - @1.0.20
- Developing Alphaview
	- Introducing print (MetaCtrl+Enter)
	- Adding support for single object selection(s)
	- Improving status info

### 2020-11-11 - @1.0.19
- Enhances/fixes rendering of the hashcode in editors-tabs - it will now always be visible
- Fixes a bug where images would not render in devtools/Editor<image>

### 2020-11-09 - @1.0.18
- Introducing: **Alphaview.js** 
- DragDropHandler: Finetuning after actually using it while dropping loads of images
- Editor<image>: Now playing nice with dropped images

### 2020-10-28
- DragDropHandler: Finetuning dragleave => dragend

### 2020-10-24
- Integrating (Arcadis-driven) new Editor<xml>-features (DetailViews)

### 2020-10-19 - @1.0.17
- Preparing for ElliTrack-specifics
- Updating devtools/Resources.prototype.index()
	- allowing single string as argument

### 2020-10-09 - @1.0.16
- **Workspace<VO>**: Developing VO object/workspace/namespace, seems the place to be hanging out lately
- **DragDropHandler**: Anticipating image/ content to be parsed as DataURL always
- **Editor<image>**:
	- Introducing new base for image/-contentTypes 
	- Changed implementation from css-background-image to `<img>`-element, for scrolling features and the likes _while we're at it_
- **Main**: Adding (opioniated) classes/colors for the title-element (eae, gx, veldapps, cavalion, etc)

### 2020-10-19 - @1.0.17
- Cosmetic changes
- Preparing for ElliTrack-specifics
- Improved Resources.prototype.index()

### 2020-10-?? - @1.0.16
- ?

### 2020-10-08 - @1.0.15

- ImageParser: Now no more snag-gy-specific
- Introducing DragDropHandler-features (nodes) in Navigator
- advancing and fixing features for devtools/Editor<folder> <xml> and <blocks>

### 2020-10-02 - @1.0.14
* Updating NPM

### 2020-10-01 - @1.0.13
* Reducing jquery-dependencies
* Preparing the Outline for features where one can jump to the source
* Developing `devtools/Resources-dropped`
* Listing "Dropped Resources" in the Navigator
* Integrating pouchdb://-resources into Arcadis-workspace
* devtools/Editor<blocks>: Exposing root (exporting?)

### 2020-09-20 - @1.0.12
- Developing more Resources-dropbox features/implementation

### 2020-09-19
- Adding Resources-dropbox implementation (works pretty neat nowadays :-))
- Round-tweaking styles of tabs

### 2020-09-18 - @1.0.11
- **Main**<>: Generalizing the title area

### 2020-09-14 - @1.0.10
- Enhanced Console, still feel the need to "centralize" often-used-code, in IPFS for example? Make snippets better and easily accessible

### 2020-09-11 - @1.0.9
- **Editor**<>: Adding more general information to alternate `#evaluate` output

### 2020-09-07 - @1.0.8
- **Editor<md>**: `#evaluate` now outs information about the parsed Markdown-document
- **Editor**<>: Working on `#evaluate`

### 2020-08-29
* More improvements to editors-tabs features: show newly focused editors-tabs on hotkey navigation (up/down) 

### 2020-08-21 - @1.0.7
- Improved toggling the visibility of editor tabs and other  workspace tabs. When its hot key (Ctrl+F11 by default) is being pressed rapidly twice (ie. within 250 ms), the current editors-tabs will remain visible, while the others are hidden
- Using block-syntax in vcl-comps

>> ![](https://user-images.githubusercontent.com/686773/91371009-8a25ba00-e7d5-11ea-9a54-78eecce43f8e.png?2x)

### 2020-08-21 - @1.0.6
- Fixed the rendering of Navigator search-results
- Fixing behaviour of Cmd+Enter in several devtools/Editor<>-classes - the idea being that the content of the current appears "evaluated" in the console(s)

### 2020-08-15 - @1.0.5
- Advancing devtools/Editor making more use of the workspaces' console
- Cmd+[Alt+]Enter is "thabomb"

### 2020-08-03
* **Editor**: Now persisting font-size over sessions

### 2020-08-02 - @1.0.4
* Fixing reload^H^H^H^Hfresh bug

### 2020-07-28 - @1.0.2
* Refactored class `opaque` to `opaque-50` to avoid a name/class-clash with `opaque`, which really means invisible (and seems to be defined all the "sudden" ;-))

### 2020-07-08
* **Editor<blocks>**: Adding full-width support to preview
* **Editor<folder>**: Sorting dot-files first, then directories and then files in

### 2020-05-08
* Initial coding, which is mostly taken from cavalion-code
