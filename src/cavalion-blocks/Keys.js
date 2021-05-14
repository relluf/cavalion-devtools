/*-

### 2021/01/16
- How to limit the console size?

### 2021/01/09
* More summary info (code, keyCode, key)

### 2021/01/02 
* render this in a glassy-container above the source
* while modifier-keys are down => use current toast (and don't let it go yet)
* hook deeper, Ace seems to steal a lot of events 
* key names for chars like !@#$ [];',./,'
	* https://stackoverflow.com/questions/1772179/get-character-value-from-keycode-in-javascript-then-trim
* bring styling here / outside App-toast.js
* lookup vcl/Action~Executable involved to display its name
* use Tippy?
	
*/
"use util/HotkeyManager";

var HKM = require("util/HotkeyManager");
var Event_ = require("util/Event");

var Symbols = { meta: "⌘", ctrl: "^", alt: "⌥", shift: "⇧" };
var Sort = { "⌘": 4, "^": 2, "⌥": 1, "⇧": 3 };
var deunders = (s) => s.split("_").map(s => s.charAt(0) + s.substring(1).toLowerCase()).join("");
var getKeyName = (key) => {
	var name = Event_.revKeys[key];
	name = name ? deunders(name.substring(4)) 
				: String.fromCharCode((96 <= key && key <= 105) ? key - 48 : key);
	name = name.replace(/Arrow/, "");
	return name;
};

["Console", {
	css: "background:#f0f0f0;",
	onLoad() {
		var app = require("vcl/Application").instances[0];//this.app();
		this.vars("li", HKM.register({
			keyCode: "*", 
			callback: (e) => { 
				var modifiers = Event_.getKeyModifiers(e, false)
					.map(s => Symbols[s] || s)
					.sort((m1, m2) => Sort[m1] < Sort[m2] ? -1 : 1)
					.join("");

				var name = e.code.replace(/^Key/, "");//getKeyName(e.keyCode, e.code);
				
				if(e.keyCode >= 16 && e.keyCode <= 18 || e.keyCode === 91 || e.keyCode === 93) {
					name = "";
				}
				
				if(e.type !== "keydown") return;// || !name) return;

				name = String.format("%s%s", modifiers, name || "");
				this.print(e.type, {event: e, name: name, code: e.code, key: e.key, keyCode: e.keyCode});
				
				// if(modifiers.length === 0) return; 
				
				app.toast({ classes: "fade glassy big", content: name });
			}
		}));
		this.print("just casually tracking keystrokes");
	},
	onDestroy() {
		var li = this.vars("li");
		HKM.unregister(li);
	}
}];