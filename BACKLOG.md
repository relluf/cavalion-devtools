* **Shift+Ctrl+S**: this hotkey should always do something to get you started
	* directory picker? => inliner resources?
	* the [.md]()-file should be implicit for every workspace
	* specified by `ws.vars("paths.dot-md")`
		* ... or derived from `ws.vars("paths.home")`

#

* **Linking**: some important things still are missing
	* pass on parameters to [an iframe]([!devtools/Iframe]) 
		* `{'frame-src': 'https://docs.google.com/document/d/...'}`
		* [example1]([!devtools/Iframe]{frame-src:https://docs.google.com/document/d/1C0eSK4IJ89WfZXTl0qKYpK_1EGpVGzjsePxabk3qfzk/edit?usp=sharing;test=xyz})
		* [example2]([!devtools/Iframe<docs.google.com/document/d/1C0eSK4IJ89WfZXTl0qKYpK_1EGpVGzjsePxabk3qfzk/edit>])