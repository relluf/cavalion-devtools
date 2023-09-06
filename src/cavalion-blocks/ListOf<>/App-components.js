/*- 

### Z023/09/06

* Fixed filtering array (instead of query)

### 2021/01/03

* Added onChange()

*/

function onChange() {
	var array = this.scope().array;
	this.setTimeout("changed", () => {
		array.vars("q", this.getValue());
		array.updateFilter();
	}, 250);
}

["veldapps/ListOf<>", {}, [

	["Array", ("array"), {
		onLoad() {
			this.readStorage("array", function(array) {
				if(!array) {
					array = app.qsa("*").map(_ => ({ 
						hashCode: _['@hashCode'],
						name: _._name, 
						uri: _._uri,
						constructor: _.constructor,
						component: _,
						factory: _['@factory']
					}));
				}
				
				this.setArray(array);
			}.bind(this));
		},
		onFilterObject(object) {
			const query = this.ud("#query"), ofo = query.getOnFilterObject();
			this.setOnFilterObject(ofo);
			ofo.apply(this, arguments);
		}
	}],
	
	["#list", { source: "array" }]
	
]];