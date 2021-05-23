/*- 

### 2021/01/03

* Added onChange()

*/

function onChange() {
	var array = this.scope().array;
	this.setTimeout("changed", () => {
			array.vars("filter", this.getValue());
			array.updateFilter();
		}, 250);
}

["veldapps/ListOf<>", {}, [

	// 971
	// 1027
	
	// ["#toggle_filters", { state: true }],
	
	["#q", { onChange: onChange }],
	
	// [("#filters"), [
	// 	["Input", ("filter"), { 
	// 		classes: "important",
	// 		css: { "&.important.important": "width: 100%; padding: 4px 6px; margin-top: 2px; margin-bottom: 2px;" },
	// 		placeholder: "(⌥+F)",
	// 		onChange: onChange
	// 	}]
	// ]],

	["Array", "array", {
		onLoad() {
			this.readStorage("array", function(array) {
				if(!array) {
					array = app.qsa("*").map(_ => ({ name: _._name, repr: js.sf("%n", _), component: _}));
				}
				
				this.setArray(array);
			}.bind(this));
		},
		onFilterObject(object) {
			if(!this._vars || !this._vars.filter) return false;
			var filter = this._vars.filter;
			
			return !(object.name.includes(filter) || object.repr.includes(filter));
		}
	}],
	
	["#list", { source: "array" }]
	
]];