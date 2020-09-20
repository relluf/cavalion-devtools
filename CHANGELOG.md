### 2020-09-19 - @1.0.12
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
