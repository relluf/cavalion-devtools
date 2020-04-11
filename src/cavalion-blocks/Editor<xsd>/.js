var ace = this.scope().ace, me = this;
var obj = {}, text = ace.getValue() + "\n\n\nvar Xsds = ";

// var console_ = this.up("devtools/Workspace<>:root").down("#console > #console");
// var obj = console_.sel[0];

var root = {};
j$[609].up().down(":root").qsa("Array<>").forEach(function(arr) {
	var obj = root[arr._name] = {};
	arr._arr.forEach(function(item) {
		obj[js.sf("%s:%s", item['@__'].xmlns, item['@_name'])] = {
			ns: item['@__'].xmlns, 
			name: item['@_name'],
			features: item['@__'].features
		};
	});
});

ace.setValue(js.b(JSON.stringify(obj, function(key, value) { 
	return ["parser", "type-resolved"].includes(key) || key.startsWith("xs") || key.startsWith("@") ? undefined : value;
})));
