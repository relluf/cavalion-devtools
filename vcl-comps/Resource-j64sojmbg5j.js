var nameOf = (uri) => (uri||"").split("/").pop();

this.app()._onGetStorageKey = (forKey) => {

	// var name = (forKey[0]._name || "").split("/").pop();
	// ws.print(name, forKey[0].vars(["resource.uri"]));
	
	var tab = forKey[0].soup("vcl/ui/Tab");
	var parents = [];
	
	while(tab !== null) {
		parents.unshift(tab);
		tab = tab.up("vcl/ui/Tab");
	}
	
	parents = parents.map(_ => nameOf(_.vars("resource.uri")) || _.vars(["workspace.name"]));
	parents.unshift(forKey[0].vars(["resource.uri"]));
	parents.unshift(forKey[0].getUri());
	
	parents.unshift(js.sf("%s[resource.uri=%s]", parents.shift(), parents.shift()));
	
	console.log(parents.join(" "));
};